// ======================================
// KNOCKOUT SCORE
// ======================================

function getKnockoutScores(user, results) {

  if (!user || !user.knockout || !results) {
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

  // ======================================ma
  // SCORING
  // ======================================

  let total = 0;

  const details = [];

  user.knockout.forEach(pred => {

    const real = resultsMap[pred.match_id];

    if (!real) return;

    // partido aún sin jugar
    if (
     real.home_goals === null ||
     real.away_goals === null ||
     !real.advance_team
    ) {
    return;
    }

    // ======================================
    // RULES
    // ======================================

    const homeTeam =
      pred.home_team === real.home_team;

    const awayTeam =
      pred.away_team === real.away_team;

    const homeGoals =
      pred.home_goals === real.home_goals;

    const awayGoals =
      pred.away_goals === real.away_goals;

    const exactScore =
      homeGoals && awayGoals;

    const advance =
      pred.advance_team === real.advance_team;

    // ======================================
    // POINTS
    // ======================================

    const points =
      (homeTeam ? 1 : 0) +
      (awayTeam ? 1 : 0) +
      (homeGoals ? 1 : 0) +
      (awayGoals ? 1 : 0) +
      (exactScore ? 1 : 0) +
      (advance ? 0 : 0);

    total += points;

    // ======================================
    // DETAILS
    // ======================================

    details.push({

      match_id: pred.match_id,

      prediction: {
        home_team: pred.home_team,
        away_team: pred.away_team,
        home_goals: pred.home_goals,
        away_goals: pred.away_goals,
        advance_team: pred.advance_team
      },

      result: {
        home_team: real.home_team,
        away_team: real.away_team,
        home_goals: real.home_goals,
        away_goals: real.away_goals,
        advance_team: real.advance_team
      },

      points,

      breakdown: {
        home_team: homeTeam,
        away_team: awayTeam,
        home_goals: homeGoals,
        away_goals: awayGoals,
        exact_goals: exactScore,
        advance
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
  getKnockoutScores
};