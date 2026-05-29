const path = require('path');
const fs = require('fs');

const {
  loadSnapshots
} = require('../../helpers/loadSnapshots');

const {
  saveOutput
} = require('../../helpers/saveOutput');


// =====================================
// LOAD PAYOUT STRUCTURE
// =====================================

const payoutStructurePath = path.join(
  __dirname,
  '..', '..', '..', 'payout',
  'payout_structure.json'
);

const payoutStructure = JSON.parse(
  fs.readFileSync(payoutStructurePath, 'utf-8')
);

const paidPositions = payoutStructure.paid_positions;


// =====================================
// LOAD SNAPSHOTS
// =====================================

const snapshots = loadSnapshots();


// =====================================
// USERS MAP
// =====================================

const usersMap = {};


// =====================================
// BUILD METRICS
// =====================================

snapshots.forEach(snapshot => {

  snapshot.leaderboard.forEach(user => {

    // =====================================
    // INIT USER
    // =====================================

    if (!usersMap[user.user_id]) {

      usersMap[user.user_id] = {
        user_id: user.user_id,
        display_name: user.display_name,
        // Store { rank, match_id, stage } per snapshot
        // to derive best/worst match context without re-lookup
        snapshots: []
      };

    }

    // =====================================
    // PUSH SNAPSHOT ENTRY
    // =====================================

    usersMap[user.user_id].snapshots.push({
      rank: user.rank,
      match_id: snapshot.snapshot_match_id,
      stage: snapshot.stage
    });

  });

});


// =====================================
// BUILD CONSISTENCY
// =====================================

const users = Object.values(usersMap).map(user => {

  const snapshotEntries = user.snapshots;
  const ranks = snapshotEntries.map(s => s.rank);

  // =====================================
  // EMPTY GUARD
  // =====================================

  if (ranks.length === 0) {
    return {
      user_id: user.user_id,
      display_name: user.display_name,
      value: null,
      extra: {
        best_rank: null,
        worst_rank: null,
        best_rank_match_id: null,
        best_rank_stage: null,
        worst_rank_match_id: null,
        worst_rank_stage: null,
        rank_range: null,
        rank_changes: 0,
        consistency_score: null,
        most_common_rank: null,
        consecutive_payout_snapshots: 0,
        snapshots: 0
      }
    };
  }

  // =====================================
  // BEST / WORST RANK  (real matches only)
  // =====================================

  // Narrative milestones use only real match snapshots (numeric match_id).
  // The '+' snapshot (pre-tournament initial state) is excluded from all
  // narrative milestone derivation — it carries no competitive context.
  // consecutive_payout_snapshots still uses ALL entries ('+' is a valid state).
  const realMatchEntries = snapshotEntries.filter(
    s => typeof s.match_id === 'number'
  );

  const realRanks = realMatchEntries.map(s => s.rank);

  // If user has no real match snapshots, narrative milestones are null
  const bestRank  = realRanks.length > 0 ? Math.min(...realRanks) : null;
  const worstRank = realRanks.length > 0 ? Math.max(...realRanks) : null;

  // First real match chronologically where best/worst rank was reached
  const bestEntry  = bestRank  !== null ? realMatchEntries.find(s => s.rank === bestRank)  || null : null;
  const worstEntry = worstRank !== null ? realMatchEntries.find(s => s.rank === worstRank) || null : null;

  // =====================================
  // RANK CHANGES
  // =====================================

  let rankChanges = 0;
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1]) rankChanges++;
  }

  // =====================================
  // MOST COMMON RANK
  // =====================================

  const rankFrequency = {};
  ranks.forEach(rank => {
    rankFrequency[rank] = (rankFrequency[rank] || 0) + 1;
  });

  let mostCommonRank = null;
  let highestFrequency = 0;
  Object.entries(rankFrequency).forEach(([rank, freq]) => {
    if (freq > highestFrequency) {
      highestFrequency = freq;
      mostCommonRank = Number(rank);
    }
  });

  // =====================================
  // CONSECUTIVE PAYOUT SNAPSHOTS
  // Clamp paid_positions to total users
  // to protect against config/dummy errors.
  // 0 is a valid value — never null.
  // =====================================

  const totalUsers = ranks.length > 0
    ? Math.max(...Object.values(usersMap).map(u => u.snapshots.length > 0 ? 1 : 0))
    : 1;

  // Use leaderboard size from first snapshot as total users reference
  const firstSnapshotSize = snapshots.length > 0
    ? snapshots[0].leaderboard.length
    : 1;

  const effectivePaidPositions = Math.min(paidPositions, firstSnapshotSize);

  let consecutivePayoutSnapshots = 0;
  let currentStreak = 0;

  snapshotEntries.forEach(entry => {
    if (entry.rank <= effectivePaidPositions) {
      currentStreak++;
      if (currentStreak > consecutivePayoutSnapshots) {
        consecutivePayoutSnapshots = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });

  // =====================================
  // VALUE / CONSISTENCY SCORE
  // =====================================

  const rankRange        = (bestRank !== null && worstRank !== null) ? worstRank - bestRank : null;
  const value            = rankRange;
  const consistencyScore = (rankRange !== null) ? rankRange + rankChanges : null;

  // =====================================
  // RETURN
  // =====================================

  return {
    user_id: user.user_id,
    display_name: user.display_name,
    value,
    extra: {
      best_rank:               bestRank,
      worst_rank:              worstRank,
      best_rank_match_id:      bestEntry  ? bestEntry.match_id  : null,
      best_rank_stage:         bestEntry  ? bestEntry.stage      : null,
      worst_rank_match_id:     worstEntry ? worstEntry.match_id  : null,
      worst_rank_stage:        worstEntry ? worstEntry.stage     : null,
      rank_range:              rankRange,
      rank_changes:            rankChanges,
      consistency_score:       consistencyScore,
      most_common_rank:        mostCommonRank,
      consecutive_payout_snapshots: consecutivePayoutSnapshots, // 0 is valid
      snapshots:               ranks.length
    }
  };

});


// =====================================
// OUTPUT
// =====================================

const output = {
  generated_at: new Date().toISOString(),
  metric: 'consistencia_ranking',
  users
};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(
  __dirname,
  '..',
  'outputs',
  'consistencia_ranking.json'
);

saveOutput(outputPath, output);

console.log('✅ consistencia_ranking.json generado');
