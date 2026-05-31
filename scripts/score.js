const fs = require('fs');
const path = require('path');


// =====================================
// PATHS
// =====================================

const BASE_DIR = path.resolve(__dirname, '..');

const OUTPUT_DIR = path.join(
  BASE_DIR,
  'output',
  'users',
  'profiles'
);

const RESULTS_DIR = path.join(
  BASE_DIR,
  'data',
  'results'
);

const SCORES_DIR = path.join(
  BASE_DIR,
  'output',
  'scores'
);

const SNAPSHOTS_DIR = path.join(
  SCORES_DIR,
  'snapshots'
);


// =====================================
// SCORING MODULES
// =====================================

const {
  getGroupScores
} = require('../scoring/group_stage_score');

const {
  getKnockoutScores
} = require('../scoring/knockout_stage_score');

const {
  getStandingsScores
} = require('../scoring/standings_score');

const {
  getBonusScores
} = require('../scoring/bonus_score');


// =====================================
// HELPERS
// =====================================

function loadJSON(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );
}

function loadUsers() {
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json');
  return files.map(file => {
    const fullPath = path.join(OUTPUT_DIR, file);
    return loadJSON(fullPath);
  });
}

function loadResults() {
  return {
    group: loadJSON(path.join(RESULTS_DIR, 'group_results.json')),
    knockout: loadJSON(path.join(RESULTS_DIR, 'knockout_results.json')),
    standings: loadJSON(path.join(RESULTS_DIR, 'standings_results.json'))
  };
}

function ensureDirectories() {
  if (!fs.existsSync(SCORES_DIR)) {
    fs.mkdirSync(SCORES_DIR, { recursive: true });
  }
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}


// =====================================
// COMPLETED MATCHES
// =====================================

function getCompletedMatches(results) {
  const completedGroup = results.group
    .filter(match => match.status === 'final')
    .map(match => ({ match_id: match.match_id, stage: 'group' }));

  const knockoutStages = ['R32', 'OF', 'QF', 'SF', '3P', 'Final'];
  const completedKnockout = results.knockout
    .filter(match => knockoutStages.includes(match.stage) && match.status === 'final')
    .map(match => ({ match_id: match.match_id, stage: 'knockout' }));

  return [...completedGroup, ...completedKnockout]
    .sort((a, b) => a.match_id - b.match_id);
}


// =====================================
// SNAPSHOT RESULTS BUILDER
// =====================================

function buildSnapshotResults(results, currentMatchId) {
  const group = results.group.map(match => {
    if (match.match_id <= currentMatchId) return match;
    return { ...match, result: null };
  });

  const knockout = results.knockout.map(match => {
    if (match.match_id <= currentMatchId) return match;
    return { ...match, home_goals: null, away_goals: null, advance_team: null };
  });

  return { group, knockout };
}


// =====================================
// LEADERBOARD BUILDER
// =====================================

function buildLeaderboard(users, results, currentMatchId) {

  const snapshotResults = buildSnapshotResults(results, currentMatchId);
  const includeStandings = currentMatchId >= 72;
  const scoreDetails = [];

  const leaderboard = users.map(user => {
    const group = getGroupScores(user, snapshotResults.group);

    const standings = includeStandings
      ? getStandingsScores(user, results.standings.groups)
      : { total: 0, details: [] };

    const knockout = getKnockoutScores(user, snapshotResults.knockout);

    const bonus = getBonusScores(user, snapshotResults.knockout);

    const total = group.total + standings.total + knockout.total + bonus.total;

    scoreDetails.push({
      user_id: user.user_id,
      display_name: user.display_name,
      group: group.details,
      standings: standings.details,
      knockout: knockout.details,
      bonus: bonus.detail
    });

    return {
      user_id: user.user_id,
      display_name: user.display_name,
      total_points: total,
      breakdown: {
        group: group.total,
        standings: standings.total,
        knockout: knockout.total,
        bonus: bonus.total
      }
    };
  });

  leaderboard.sort((a, b) => b.total_points - a.total_points);

  let currentRank = 1;
  leaderboard.forEach((user, index) => {
    if (index === 0) { user.rank = currentRank; return; }
    const previous = leaderboard[index - 1];
    if (user.total_points === previous.total_points) {
      user.rank = currentRank;
    } else {
      currentRank = index + 1;
      user.rank = currentRank;
    }
  });

  const totalUsers = leaderboard.length;
  leaderboard.forEach(user => {
    user.percentile_general = Math.round(
      (totalUsers - user.rank + 1) / totalUsers * 100
    );
  });

  return { leaderboard, scoreDetails };
}


// =====================================
// SAVE SNAPSHOT
// =====================================

function saveSnapshot(match, leaderboard) {
  const snapshotName = String(match.match_id);
  const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshotName}_score.json`);

  const snapshotData = {
    snapshot_match_id: match.match_id,
    stage: match.stage,
    generated_at: new Date().toISOString(),
    leaderboard
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
  console.log(`Snapshot -> ${snapshotName}_score.json`);
}


// =====================================
// MAIN
// =====================================

function main() {
  console.log('Calculando scores...\n');

  ensureDirectories();

  const users = loadUsers();
  const results = loadResults();
  const completedMatches = getCompletedMatches(results);

  // =====================================
  // TOURNAMENT STATUS
  // =====================================

  const latestCompletedMatch =
    completedMatches.length > 0
      ? completedMatches[completedMatches.length - 1]
      : null;

  completedMatches.forEach(match => {
    const snapshot = buildLeaderboard(users, results, match.match_id);
    saveSnapshot(match, snapshot.leaderboard);

    if (match.match_id === 72) {
      const standingsSnapshot = buildLeaderboard(users, results, 72.5);
      saveSnapshot({ match_id: 72.5, stage: 'standings' }, standingsSnapshot.leaderboard);
    }
  });

  // =====================================
  // CURRENT LEADERBOARD
  // =====================================

let currentMatchId = 0;

if (completedMatches.length > 0) {

  const latestMatch =
    completedMatches[
      completedMatches.length - 1
    ];

  currentMatchId =
    latestMatch.match_id === 72
      ? 72.5
      : latestMatch.match_id;

}

const current =
  buildLeaderboard(
    users,
    results,
    currentMatchId
  );

// =====================================
// LEADERBOARD
// =====================================

const leaderboardPath =
  path.join(
    SCORES_DIR,
    'leaderboard.json'
  );

fs.writeFileSync(
  leaderboardPath,
  JSON.stringify(
    current.leaderboard,
    null,
    2
  )
);

// =====================================
// DETAILS
// =====================================

const detailsPath =
  path.join(
    SCORES_DIR,
    'score_details.json'
  );

fs.writeFileSync(
  detailsPath,
  JSON.stringify(
    current.scoreDetails,
    null,
    2
  )
);

  console.log('\nScores generados -> output/scores');

  // =====================================
  // TOURNAMENT STATUS
  // =====================================

  let tournamentStatus = {

    generated_at:
      new Date().toISOString(),

    last_match_id: 0,

    last_match_label:
      'Torneo sin iniciar',

    completed_matches:
      completedMatches.length

  };

  if (latestCompletedMatch) {

    let lastMatch =

      results.group.find(
        m => m.match_id === latestCompletedMatch.match_id
      )

      ||

      results.knockout.find(
        m => m.match_id === latestCompletedMatch.match_id
      );

    if (lastMatch) {

      tournamentStatus.last_match_id =
        lastMatch.match_id;

      if (
        lastMatch.home_team &&
        lastMatch.away_team
      ) {

        tournamentStatus.last_match_label =
          `${lastMatch.home_team} vs ${lastMatch.away_team}`;

      }
    }

  }

  fs.writeFileSync(

    path.join(
      SCORES_DIR,
      'tournament_status.json'
    ),

    JSON.stringify(
      tournamentStatus,
      null,
      2
    )

  );
}

main();
