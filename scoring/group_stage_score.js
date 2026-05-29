// ======================================
// GROUP STAGE SCORE
// ======================================

function getGroupScores(user, results) {

  if (!user || !user.group_stage || !results) {
    return {
      total: 0,
      details: []
    };
  }

  // ======================================
  // RESULTS MAP
  // ======================================

  const resultsMap = {};

  results.forEach(r => {
    resultsMap[r.match_id] = r;
  });

  // ======================================
  // SCORING
  // ======================================

  let total = 0;

  const details = [];

  user.group_stage.forEach(pred => {

    const real = resultsMap[pred.match_id];

    if (!real) return;

    // partido aún sin resultado
    if (!real.result) {
      return;
    }

    // ======================================
    // RULE
    // ======================================

    const correct =
      pred.prediction === real.result;

    const points =
      correct ? 1 : 0;

    total += points;

    // ======================================
    // DETAILS
    // ======================================

    details.push({

      match_id: pred.match_id,

      prediction: pred.prediction,

      result: real.result,

      points,

      breakdown: {
        correct
      }

    });

  });

  // ======================================
  // RETURN
  // ======================================

  return {
    total,
    details
  };

}


// ======================================
// EXPORTS
// ======================================

module.exports = {
  getGroupScores
};