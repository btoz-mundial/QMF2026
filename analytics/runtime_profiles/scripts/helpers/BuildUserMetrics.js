// =====================================
// IMPORTS
// =====================================

const path = require('path');

const {
  loadJson
} = require('../../../helpers/loadJson');

const {
  loadSnapshots
} = require('../../../helpers/loadSnapshots');


// =====================================
// LOAD OUTPUTS
// =====================================

const precisionGeneralPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'core',
  'outputs',
  'precision_general.json'
);

const exactPrecisionPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'core',
  'outputs',
  'precision_marcadores_exactos.json'
);

const rankingConsistencyPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'timeline',
  'outputs',
  'consistencia_ranking.json'
);

const leaderboardPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'output',
  'scores',
  'leaderboard.json'
);


const precisionGeneral =
  loadJson(precisionGeneralPath);

const exactPrecision =
  loadJson(exactPrecisionPath);

const rankingConsistency =
  loadJson(rankingConsistencyPath);

const leaderboard =
  loadJson(leaderboardPath);

const snapshots =
  loadSnapshots();


// =====================================
// CONSTANTS
// =====================================

const TOTAL_EXPECTED_SNAPSHOTS =
  104;


// =====================================
// BUILD USER METRICS
// =====================================

function buildUserMetrics() {

  // =====================
  // USER MAP
  // =====================

  const userMetrics = {};


  // =====================
  // INIT FROM LEADERBOARD
  // =====================

  leaderboard.forEach(user => {

    userMetrics[user.user_id] = {

      user_id:
        user.user_id,

      display_name:
        user.display_name

    };

  });


  // =====================
  // PRECISION GENERAL
  // =====================

  precisionGeneral.users.forEach(user => {

    if (!userMetrics[user.user_id]) {
      return;
    }

    userMetrics[user.user_id]
      .group_accuracy =
        user.extra
          .category_breakdown
          .group
          .accuracy / 100;

    userMetrics[user.user_id]
      .standings_accuracy =
        user.extra
          .category_breakdown
          .standings
          .accuracy / 100;

    userMetrics[user.user_id]
      .knockout_accuracy =
        user.extra
          .category_breakdown
          .knockout
          .accuracy / 100;

    // phase_delta: max spread across all three phases
    // Three-phase spread catches spikes in any single phase, not just group↔knockout
    const _gAcc  = user.extra.category_breakdown.group.accuracy;
    const _sAcc  = user.extra.category_breakdown.standings.accuracy;
    const _kAcc  = user.extra.category_breakdown.knockout.accuracy;

    userMetrics[user.user_id]
      .phase_delta =
        (Math.max(_gAcc, _sAcc, _kAcc) - Math.min(_gAcc, _sAcc, _kAcc)) / 100;

  });


  // =====================
  // EXACT SCORE PRECISION
  // =====================

  exactPrecision.users.forEach(user => {

    if (!userMetrics[user.user_id]) {
      return;
    }

    userMetrics[user.user_id]
      .exact_score_precision =
        user.value;

    userMetrics[user.user_id]
      .goal_prediction_sample =
        user.extra.matches;

    userMetrics[user.user_id]
      .knockout_prediction_sample =
        user.extra.matches;

    userMetrics[user.user_id]
      .home_goal_accuracy =
        user.extra.home_goal_accuracy;

    userMetrics[user.user_id]
      .away_goal_accuracy =
       user.extra.away_goal_accuracy;

    userMetrics[user.user_id]
      .combined_goal_accuracy =
       user.extra.combined_goal_accuracy;    

  });


  // =====================
  // RANKING CONSISTENCY
  // =====================

  rankingConsistency.users.forEach(user => {

    if (!userMetrics[user.user_id]) {
      return;
    }

    userMetrics[user.user_id]
      .rank_range =
        user.extra.rank_range;

    userMetrics[user.user_id]
      .rank_changes =
        user.extra.rank_changes;

    userMetrics[user.user_id]
      .consistency_score =
        user.extra.consistency_score;

    userMetrics[user.user_id]
      .worst_rank =
        user.extra.worst_rank;

  });


  // =====================
  // SNAPSHOT METRICS
  // =====================

  Object.values(userMetrics)
    .forEach(user => {

      const userId =
        user.user_id;

      const userSnapshots =
        snapshots.filter(snapshot =>

          snapshot.leaderboard.some(ranking =>

            ranking.user_id === userId

          )

        );


      // =====================
      // RANK HISTORY
      // =====================

      const rankHistory =
        userSnapshots.map(snapshot => {

          const ranking =
            snapshot.leaderboard.find(ranking =>

              ranking.user_id === userId

            );

          return ranking.rank;

        });


      // =====================
      // AVERAGE RANK
      // =====================

      const totalRanks =
        rankHistory.reduce(

          (sum, rank) =>
            sum + rank,

          0

        );

      const averageRank =
        rankHistory.length > 0

          ? totalRanks /
            rankHistory.length

          : null;

      user.average_rank =
        averageRank;


      // =====================
      // PAYOUT ZONE DURATION
      // =====================

      // Payout zone: top 20% of field (dynamic, not hardcoded to 20)
      const payoutZoneCutoff =
        Math.max(1, Math.ceil(leaderboard.length * 0.20));

      const payoutZoneSnapshots =
        rankHistory.filter(rank =>
          rank <= payoutZoneCutoff
        );

      const payoutZoneDurationPercentage =

        rankHistory.length > 0

          ? payoutZoneSnapshots.length /
            rankHistory.length

          : 0;

      user.payout_zone_duration_percentage =
        payoutZoneDurationPercentage;


      // =====================
      // TOURNAMENT COMPLETION
      // =====================

      user.tournament_completion =
        snapshots.length /
        TOTAL_EXPECTED_SNAPSHOTS;

    });


  // =====================
  // INJECT TOTAL ENTRIES
  // =====================
  // total_entries is injected into every user's metrics so evaluators
  // can compute relative thresholds without loading external files.

  const totalEntries = leaderboard.length;

  Object.values(userMetrics).forEach(user => {
    user.total_entries = totalEntries;
  });


  // =====================
  // RETURN
  // =====================

  return userMetrics;

}


// =====================================
// EXPORTS
// =====================================

module.exports = {
  buildUserMetrics
};