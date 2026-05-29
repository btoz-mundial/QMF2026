// =====================================
// IMPORTS
// =====================================

const path = require('path');

const {
  loadJson
} = require('../../../helpers/loadJson');


// =====================================
// LOAD CONTRACTS
// =====================================

const activationRulesPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'contracts',
  'analytics',
  'runtime_profiles',
  'archetype_activation_rules_v1.json'
);

const payoutStructurePath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'payout',
  'payout_structure.json'
);


const activationRules =
  loadJson(activationRulesPath);

const payoutStructure =
  loadJson(payoutStructurePath);


// =====================================
// CONSTANTS
// =====================================

const FRONT_RUNNER_RULES =
  activationRules
    .archetypes
    .find(
      archetype =>
        archetype.id === 'front_runner'
    );

const TOTAL_ENTRIES =
  payoutStructure.entries;


// =====================================
// EVALUATE FRONT RUNNER
// =====================================

function evaluateFrontRunner({

  userId,
  snapshots = [],
  metrics = {}

}) {

  // =====================
  // DEFAULT RESPONSE
  // =====================

  const response = {

    archetype_id: 'front_runner',

    eligible: false,

    activation_reasons: [],

    failed_conditions: [],

    evaluation: {}

  };


  // =====================
  // VALIDATE SNAPSHOTS
  // =====================

  const minimumSnapshotsRequired =
    activationRules
      .activation_governance
      .minimum_snapshots_required;

  if (
    snapshots.length <
    minimumSnapshotsRequired
  ) {

    response.failed_conditions.push(
      'insufficient_snapshots'
    );

    return response;

  }


  // =====================
  // LOAD METRICS
  // =====================

  const averageRank =
    metrics.average_rank;

  const payoutZoneDurationPercentage =
    metrics.payout_zone_duration_percentage;

  const rankRange =
    metrics.rank_range;

  const tournamentCompletion =
    metrics.tournament_completion;


  // =====================
  // STORE EVALUATION
  // =====================

  response.evaluation = {

    average_rank:
      averageRank,

    payout_zone_duration_percentage:
      payoutZoneDurationPercentage,

    rank_range:
      rankRange,

    tournament_completion:
      tournamentCompletion

  };


  // =====================
  // VALIDATE TOURNAMENT
  // MATURITY
  // =====================

  if (
    tournamentCompletion <
    FRONT_RUNNER_RULES
      .minimum_tournament_completion_required
  ) {

    response.failed_conditions.push(
      'insufficient_tournament_maturity'
    );

  }


  // =====================
// VALIDATE
// AVERAGE RANK
// =====================

const FRONT_RUNNER_PERCENTILE =
  0.15;

const maximumAllowedAverageRank =
  TOTAL_ENTRIES *
  FRONT_RUNNER_PERCENTILE;


if (
  averageRank >
  maximumAllowedAverageRank
) {

  response.failed_conditions.push(
    'outside_elite_rank_threshold'
  );

} else {

  response.activation_reasons.push(
    'sustained_high_ranking'
  );

}


  // =====================
  // VALIDATE
  // PAYOUT ZONE DURATION
  // =====================

  if (
    payoutZoneDurationPercentage <
    0.60
  ) {

    response.failed_conditions.push(
      'insufficient_payout_zone_presence'
    );

  } else {

    response.activation_reasons.push(
      'extended_payout_zone_presence'
    );

  }


  // =====================
  // VALIDATE
  // RANK RANGE
  // =====================

  const maxAllowedRankRange =
    TOTAL_ENTRIES * 0.20;

  if (
    rankRange >
    maxAllowedRankRange
  ) {

    response.failed_conditions.push(
      'high_rank_volatility'
    );

  } else {

    response.activation_reasons.push(
      'low_rank_volatility'
    );

  }


  // =====================
  // FINAL ELIGIBILITY
  // =====================

  response.eligible =
    response.failed_conditions.length === 0;


  // =====================
  // RETURN
  // =====================

  return response;

}


// =====================================
// EXPORTS
// =====================================

module.exports = {
  evaluateFrontRunner
};