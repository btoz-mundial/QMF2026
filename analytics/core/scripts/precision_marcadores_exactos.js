const path = require('path');

const {
  loadScoreDetails
} = require('../../helpers/loadScoreDetails');

const {
  saveOutput
} = require('../../helpers/saveOutput');


// =====================================
// LOAD
// =====================================

const scoreDetails =
  loadScoreDetails();


// =====================================
// BUILD METRIC
// =====================================

const users = scoreDetails.map(user => {

  // =====================================
  // KNOCKOUT MATCHES COMPLETED
  // =====================================

  const knockoutMatches =
    user.knockout.filter(match =>

      match.result.home_score !== null &&
      match.result.away_score !== null

    );

  // =====================================
  // PRECISION BREAKDOWN
  // =====================================

  let correctHomeGoals = 0;
  let correctAwayGoals = 0;
  let exactScores      = 0;

  knockoutMatches.forEach(match => {

    const breakdown = match.breakdown || {};

    const homeCorrect =
     breakdown.home_goals === true;

    const awayCorrect =
      breakdown.away_goals === true;

    const exactCorrect =
      breakdown.exact_goals === true;

  if (homeCorrect)
    correctHomeGoals++;

  if (awayCorrect)
    correctAwayGoals++;

  if (exactCorrect)
    exactScores++;

  });
  
  // =====================================
  // VALUE
  // =====================================

  const value =
    knockoutMatches.length > 0
      ? exactScores / knockoutMatches.length
      : 0;

  // =====================================
  // RETURN
  // =====================================

  return {

    user_id:
      user.user_id,

    display_name:
      user.display_name,

    value,

    extra: {

      exact_scores:
      exactScores,

      matches:
       knockoutMatches.length,

      home_goal_accuracy:
        knockoutMatches.length > 0
          ? correctHomeGoals / knockoutMatches.length
          : 0,

      away_goal_accuracy:
        knockoutMatches.length > 0
          ? correctAwayGoals / knockoutMatches.length
          : 0,

      combined_goal_accuracy:
        knockoutMatches.length > 0
          ? (
              correctHomeGoals +
              correctAwayGoals
            ) / (knockoutMatches.length * 2)
          : 0,

      exact_score_precision:
        knockoutMatches.length > 0
          ? exactScores / knockoutMatches.length
          : 0

    }

  };

});


// =====================================
// OUTPUT
// =====================================

const output = {

  generated_at:
    new Date().toISOString(),

  metric:
    'precision_marcadores_exactos',

  users

};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'precision_marcadores_exactos.json'

);

saveOutput(
  outputPath,
  output
);

console.log(
  '✅ precision_marcadores_exactos.json generado'
);