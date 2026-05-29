// ======================================
// STANDINGS SCORE
// ======================================

function getStandingsScores(user, results) {

  // ======================================
  // VALIDATION
  // ======================================

  if (!user || !user.standings || !results) {
    return {
      total: 0,
      details: []
    };
  }

  // ======================================
  // RESULTS MAP
  // ======================================

 const resultsMap = {};

 const standingsResults =

  Array.isArray(results)

    ? results

    : results.standings.group || [];

 standingsResults.forEach(r => {
  resultsMap[r.group] =
    r.positions;

  });
  
  // ======================================
  // POINTS TABLE
  // ======================================

  const pointsTable = [4, 3, 2, 1];

  // ======================================
  // SCORING
  // ======================================

  let total = 0;

  const details = [];

  user.standings.forEach(prediction => {

    const real = resultsMap[prediction.group];

    if (!real) return;

    let groupPoints = 0;

    const positions = [];

    prediction.positions.forEach((team, idx) => {

      const realTeam =
      real[idx]?.team || null;

      const correct =
      team === realTeam;

      const points =
      correct ? pointsTable[idx] : 0;
     // ======================================
     // ACCUMULATE
     // ======================================
      groupPoints += points;
      total += points;
      
      positions.push({
        position: idx + 1,
        predicted_team: team,
        real_team: realTeam,
        correct,
        points
      });

    });

    // ======================================
    // DETAILS
    // ======================================

    details.push({

      group: prediction.group,

      total_points: groupPoints,

      positions

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
  getStandingsScores
};