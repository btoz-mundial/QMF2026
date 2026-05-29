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

const SHARPSHOOTER_RULES =
  activationRules
    .archetypes
    .find(
      archetype =>
        archetype.id === 'sharpshooter'
    );


// =====================================
// THRESHOLDS
// =====================================

const HOME_ACCURACY_THRESHOLD =
  0.50;

const AWAY_ACCURACY_THRESHOLD =
  0.50;

const COMBINED_PRECISION_THRESHOLD =
  0.55;

const MINIMUM_PREDICTION_SAMPLE =
  10;

  const EXACT_SCORE_PRECISION_THRESHOLD =
  0.30;

// =====================================
// EVALUATE SHARPSHOOTER
// =====================================

function evaluateSharpshooter({

  userId,
  snapshots = [],
  metrics = {}

}) {

  // =====================
  // DEFAULT RESPONSE
  // =====================

  const response = {

    archetype_id: 'sharpshooter',

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

 const homeAccuracy =
  metrics.home_goal_accuracy ?? 0;

const awayAccuracy =
  metrics.away_goal_accuracy ?? 0;

const combinedPrecision =
  metrics.combined_goal_accuracy ?? 0;

const predictionSample =
  metrics.goal_prediction_sample ?? 0;

const exactScorePrecision =
  metrics.exact_score_precision ?? 0;


  // =====================
  // STORE EVALUATION
  // =====================

  response.evaluation = {

    home_goal_accuracy:
      homeAccuracy,

    away_goal_accuracy:
      awayAccuracy,

    combined_goal_accuracy:
      combinedPrecision,

    goal_prediction_sample:
      predictionSample

  };


  // =====================
  // VALIDATE
  // PREDICTION SAMPLE
  // =====================

  if (
    predictionSample <
    MINIMUM_PREDICTION_SAMPLE
  ) {

    response.failed_conditions.push(
      'insufficient_prediction_sample'
    );

  } else {

    response.activation_reasons.push(
      'sustained_precision'
    );

  }


  // =====================
  // VALIDATE
  // HOME ACCURACY
  // =====================

  if (
    homeAccuracy <
    HOME_ACCURACY_THRESHOLD
  ) {

    response.failed_conditions.push(
      'low_home_accuracy'
    );

  } else {

    response.activation_reasons.push(
      'elite_home_accuracy'
    );

  }


  // =====================
  // VALIDATE
  // AWAY ACCURACY
  // =====================

  if (
    awayAccuracy <
    AWAY_ACCURACY_THRESHOLD
  ) {

    response.failed_conditions.push(
      'low_away_accuracy'
    );

  } else {

    response.activation_reasons.push(
      'elite_away_accuracy'
    );

  }


  // =====================
  // VALIDATE
  // COMBINED PRECISION
  // =====================

  if (
    combinedPrecision <
    COMBINED_PRECISION_THRESHOLD
  ) {

    response.failed_conditions.push(
      'low_combined_precision'
    );

  } else {

    response.activation_reasons.push(
      'elite_combined_precision'
    );

  }

  // =====================
  // VALIDATE
  // EXACT SCORE PRECISION
  // =====================

  if (
    exactScorePrecision >=
    EXACT_SCORE_PRECISION_THRESHOLD
  ) {

    response.activation_reasons.push(
      'elite_exact_score_precision'
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
  evaluateSharpshooter
};