const path = require('path');

const {
  loadLeaderboard
} = require('../../helpers/loadLeaderboard');

const {
  loadResults
} = require('../../helpers/loadResults');

const {
  loadScoreDetails
} = require('../../helpers/loadScoreDetails');

const {
  saveOutput
} = require('../../helpers/saveOutput');


// =====================================
// LOAD
// =====================================

const leaderboard =
  loadLeaderboard();

const results =
  loadResults();

const scoreDetails =
  loadScoreDetails();


// =====================================
// AVAILABLE POINTS
// =====================================

let availableGroupPoints = 0;

let availableStandingsPoints = 0;

let availableKnockoutPoints = 0;


// =====================================
// GROUP
// =====================================

const completedGroupMatches =
  results.group.filter(
    match => match.result !== null
  );

availableGroupPoints =
  completedGroupMatches.length * 1;


// =====================================
// STANDINGS
// =====================================

if (
  results.standings.groups &&
  Array.isArray(
    results.standings.groups
  )
) {

  results.standings.groups.forEach(
    group => {

      const allPositionsDefined =
        group.positions.every(
          position =>
          position?.position !== null &&
          position?.team !== null
        );
      if (!allPositionsDefined) {
        return;
      }

      availableStandingsPoints += 10;

    }
  );

}


// =====================================
// KNOCKOUT
// =====================================

const completedKnockoutMatches =
  results.knockout.filter(match =>

    match.home_goals !== null &&
    match.away_goals !== null &&
    match.advance_team

  );

availableKnockoutPoints =
  completedKnockoutMatches.length * 6;


// =====================================
// TOTAL AVAILABLE
// =====================================

const totalAvailablePoints =

  availableGroupPoints +

  availableStandingsPoints +

  availableKnockoutPoints;


// =====================================
// BUILD METRIC
// =====================================

const users = leaderboard.map(user => {

  // =====================================
  // USER DETAILS
  // =====================================

  const detail =
    scoreDetails.find(
      d => d.user_id === user.user_id
    );

  // =====================================
  // FALLBACK
  // =====================================

  if (!detail) {

    return {

      user_id:
        user.user_id,

      display_name:
        user.display_name,

      value: 0,

      breakdown: {},

      extra: {}

    };

  }

  // =====================================
  // EARNED POINTS
  // =====================================

  const earnedGroupPoints =
    detail.group.reduce(
      (sum, match) =>
        sum + match.points,
      0
    );

  const earnedStandingsPoints =
    detail.standings.reduce(
      (sum, group) =>
        sum + group.total_points,
      0
    );

  const earnedKnockoutPoints =
    detail.knockout.reduce(
      (sum, match) =>
        sum + match.points,
      0
    );

  // =====================================
  // TOTAL EARNED
  // =====================================

  const totalEarnedPoints =

    earnedGroupPoints +

    earnedStandingsPoints +

    earnedKnockoutPoints;

  // =====================================
  // EFFICIENCIES
  // =====================================

  const groupEfficiency =

    availableGroupPoints === 0

      ? 0

      : Number(
          (
            earnedGroupPoints /
            availableGroupPoints *
            100
          ).toFixed(2)
        );

  const standingsEfficiency =

    availableStandingsPoints === 0

      ? 0

      : Number(
          (
            earnedStandingsPoints /
            availableStandingsPoints *
            100
          ).toFixed(2)
        );

  const knockoutEfficiency =

    availableKnockoutPoints === 0

      ? 0

      : Number(
          (
            earnedKnockoutPoints /
            availableKnockoutPoints *
            100
          ).toFixed(2)
        );

  // =====================================
  // TOTAL EFFICIENCY
  // =====================================

  const value =

    totalAvailablePoints === 0

      ? 0

      : Number(
          (
            totalEarnedPoints /
            totalAvailablePoints *
            100
          ).toFixed(2)
        );

  // =====================================
  // RETURN
  // =====================================

  return {

    user_id:
      user.user_id,

    display_name:
      user.display_name,

    metric_id:
      'eficiencia_de_puntos',

    value,

    breakdown: {

      group_efficiency:
        groupEfficiency,

      standings_efficiency:
        standingsEfficiency,

      knockout_efficiency:
        knockoutEfficiency

    },

    extra: {

  earned_points:
    totalEarnedPoints,

  available_points:
    totalAvailablePoints,

  earned_group_points:
    earnedGroupPoints,

  available_group_points:
    availableGroupPoints,

  earned_standings_points:
    earnedStandingsPoints,

  available_standings_points:
    availableStandingsPoints,

  earned_knockout_points:
    earnedKnockoutPoints,

  available_knockout_points:
    availableKnockoutPoints,

  best_stage:

    groupEfficiency >= standingsEfficiency &&
    groupEfficiency >= knockoutEfficiency

      ? 'group'

      : standingsEfficiency >= knockoutEfficiency

        ? 'standings'

        : 'knockout',

  worst_stage:

    groupEfficiency <= standingsEfficiency &&
    groupEfficiency <= knockoutEfficiency

      ? 'group'

      : standingsEfficiency <= knockoutEfficiency

        ? 'standings'

        : 'knockout',

  stage_breakdown: {

    group: {

      earned:
        earnedGroupPoints,

      available:
        availableGroupPoints,

      efficiency:
        groupEfficiency

    },

    standings: {

      earned:
        earnedStandingsPoints,

      available:
        availableStandingsPoints,

      efficiency:
        standingsEfficiency

    },

    knockout: {

      earned:
        earnedKnockoutPoints,

      available:
        availableKnockoutPoints,

      efficiency:
        knockoutEfficiency

    }

  }

}

  };

});


// =====================================
// SORT
// =====================================

users.sort(
  (a, b) =>
    b.value - a.value
);


// =====================================
// RANK
// =====================================

users.forEach((user, index) => {

  user.rank = index + 1;

});


// =====================================
// OUTPUT
// =====================================

const output = {

  generated_at:
    new Date().toISOString(),

  metric:
    'eficiencia_de_puntos',

  users

};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'eficiencia_de_puntos.json'

);

saveOutput(
  outputPath,
  output
);

console.log(
  '✅ eficiencia_de_puntos.json generado'
);