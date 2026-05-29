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

const activationRules =
  loadJson(activationRulesPath);


// =====================================
// CONSTANTS
// =====================================

const CONSISTENCY_MACHINE_RULES =
  activationRules
    .archetypes
    .find(
      archetype =>
        archetype.id === 'consistency_machine'
    );



// =====================================
// THRESHOLDS
// =====================================

const PHASE_DELTA_THRESHOLD =
  0.15;


// =====================================
// EVALUATE CONSISTENCY MACHINE
// =====================================

function evaluateConsistencyMachine({

  userId,
  snapshots = [],
  metrics = {}

}) {

  // =====================
  // DEFAULT RESPONSE
  // =====================

  const response = {

    archetype_id: 'consistency_machine',

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

  // total_entries injected by BuildUserMetrics — avoids loading external files
  const totalEntries =
    metrics.total_entries;

  const consistencyScore =
    metrics.consistency_score;

  const rankChanges =
    metrics.rank_changes;

  const worstRank =
    metrics.worst_rank;

  const phaseDelta =
    metrics.phase_delta;

  const tournamentCompletion =
    metrics.tournament_completion;


  // =====================
  // STORE EVALUATION
  // =====================

  response.evaluation = {

    consistency_score:
      consistencyScore,

    rank_changes:
      rankChanges,

    worst_rank:
      worstRank,

    phase_delta:
      phaseDelta,

    tournament_completion:
      tournamentCompletion

  };


  // =====================
  // VALIDATE TOURNAMENT
  // MATURITY
  // =====================

  if (
    tournamentCompletion <
    CONSISTENCY_MACHINE_RULES
      .minimum_tournament_completion_required
  ) {

    response.failed_conditions.push(
      'insufficient_tournament_maturity'
    );

  }


  // =====================
  // VALIDATE
  // COMPETITIVE FLOOR
  // =====================

  const maximumAllowedWorstRank =
    totalEntries * 0.50;

  if (
    worstRank >
    maximumAllowedWorstRank
  ) {

    response.failed_conditions.push(
      'weak_scoring_floor'
    );

  } else {

    response.activation_reasons.push(
      'stable_scoring_floor'
    );

  }


  // =====================
  // VALIDATE
  // PHASE DELTA
  // =====================

  if (
    phaseDelta >
    PHASE_DELTA_THRESHOLD
  ) {

    response.failed_conditions.push(
      'unstable_cross_phase_performance'
    );

  } else {

    response.activation_reasons.push(
      'consistent_cross_phase_performance'
    );

  }


  // =====================
  // VALIDATE
  // RUNTIME VOLATILITY
  // =====================

  const maximumAllowedConsistencyScore =
    totalEntries * 0.30;

  if (
    consistencyScore >
    maximumAllowedConsistencyScore
  ) {

    response.failed_conditions.push(
      'high_runtime_volatility'
    );

  } else {

    response.activation_reasons.push(
      'low_runtime_volatility'
    );

  }


  // =====================
  // VALIDATE
  // RANK CHANGES
  // =====================

  const maximumAllowedRankChanges =
    snapshots.length * 0.35;

  if (
    rankChanges >
    maximumAllowedRankChanges
  ) {

    response.failed_conditions.push(
      'large_rank_swings'
    );

  } else {

    response.activation_reasons.push(
      'stable_competitive_performance'
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
  evaluateConsistencyMachine
};