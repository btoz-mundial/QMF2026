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

const CLUTCH_HUNTER_RULES =
  activationRules
    .archetypes
    .find(
      archetype =>
        archetype.id === 'clutch_hunter'
    );


// =====================================
// THRESHOLDS
// =====================================

const GROUP_ACCURACY_THRESHOLD =
  0.30;

const KNOCKOUT_ACCURACY_THRESHOLD =
  0.50;

const KNOCKOUT_DELTA_THRESHOLD =
  0.10;

const MINIMUM_KNOCKOUT_SAMPLE =
  10;


// =====================================
// EVALUATE CLUTCH HUNTER
// =====================================

function evaluateClutchHunter({

  userId,
  snapshots = [],
  metrics = {}

}) {

  // =====================
  // DEFAULT RESPONSE
  // =====================

  const response = {

    archetype_id: 'clutch_hunter',

    eligible: false,

    activation_reasons: [],

    failed_conditions: [],

    evaluation: {}

  };


  // =====================
  // VALIDATE SNAPSHOTS
  // =====================

  const minimumSnapshotsRequired =
    CLUTCH_HUNTER_RULES
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

  const groupAccuracy =
    metrics.group_accuracy;

  const knockoutAccuracy =
    metrics.knockout_accuracy;

  const knockoutPredictionSample =
    metrics.knockout_prediction_sample;

  const knockoutVsGroupDelta =
    knockoutAccuracy -
    groupAccuracy;


  // =====================
  // STORE EVALUATION
  // =====================

  response.evaluation = {

    group_accuracy:
      groupAccuracy,

    knockout_accuracy:
      knockoutAccuracy,

    knockout_vs_group_delta:
      knockoutVsGroupDelta,

    knockout_prediction_sample:
      knockoutPredictionSample

  };


  // =====================
  // VALIDATE
  // KNOCKOUT SAMPLE
  // =====================

  if (
    knockoutPredictionSample <
    MINIMUM_KNOCKOUT_SAMPLE
  ) {

    response.failed_conditions.push(
      'insufficient_knockout_sample'
    );

  } else {

    response.activation_reasons.push(
      'sustained_knockout_precision'
    );

  }


  // =====================
  // VALIDATE
  // GROUP ACCURACY
  // =====================

  if (
    groupAccuracy <
    GROUP_ACCURACY_THRESHOLD
  ) {

    response.failed_conditions.push(
      'low_group_accuracy'
    );

  }


  // =====================
  // VALIDATE
  // KNOCKOUT ACCURACY
  // =====================

  if (
    knockoutAccuracy <
    KNOCKOUT_ACCURACY_THRESHOLD
  ) {

    response.failed_conditions.push(
      'low_knockout_accuracy'
    );

  } else {

    response.activation_reasons.push(
      'elite_knockout_accuracy'
    );

  }


  // =====================
  // VALIDATE
  // KNOCKOUT DELTA
  // =====================

  if (
    knockoutVsGroupDelta <
    KNOCKOUT_DELTA_THRESHOLD
  ) {

    response.failed_conditions.push(
      'low_knockout_delta'
    );

  } else {

    response.activation_reasons.push(
      'positive_knockout_delta'
    );

      response.activation_reasons.push(
      'strong_knockout_specialization'
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
  evaluateClutchHunter
};