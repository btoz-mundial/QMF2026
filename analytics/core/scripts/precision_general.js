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

  let correct = 0;
  let possible = 0;

  // =====================================
  // GROUP
  // =====================================

  user.group.forEach(match => {

    possible += 1;

    if (match.breakdown.correct) {
      correct += 1;
    }

  });

  // =====================================
  // STANDINGS
  // =====================================

  user.standings.forEach(group => {

    group.positions.forEach(position => {

      possible += 1;

      if (position.correct) {
        correct += 1;
      }

    });

  });

  // =====================================
  // KNOCKOUT
  // =====================================

  user.knockout.forEach(match => {

    const breakdown =
      match.breakdown;

    const categories = [

      breakdown.home_team,
      breakdown.away_team,
      breakdown.home_goals,
      breakdown.away_goals,
      breakdown.exact_goals,
      breakdown.advance

    ];

    categories.forEach(value => {

      possible += 1;

      if (value) {
        correct += 1;
      }

    });

  });

  // =====================================
  // VALUE
  // =====================================

  // =====================================
 // CATEGORY BREAKDOWN
 // =====================================

  const groupCorrect =
    user.group.filter(
    match => match.breakdown.correct
    ).length;

  const groupPossible =
   user.group.length;

  const standingsCorrect =
   user.standings.reduce(

    (sum, group) =>

      sum +

      group.positions.filter(
        position => position.correct
      ).length, 0

     );

   const standingsPossible =
     user.standings.reduce(

     (sum, group) =>

      sum + group.positions.length,

     0

     );

    const knockoutCorrect =
      user.knockout.reduce(

        (sum, match) => {

        const breakdown =
          match.breakdown;

        const categories = [

          breakdown.home_team,
          breakdown.away_team,
          breakdown.home_goals,
          breakdown.away_goals,
          breakdown.exact_goals,
          breakdown.advance

          ];

      return sum +
        categories.filter(Boolean).length;

    },

    0

  );

const knockoutPossible =
  user.knockout.length * 6;


// =====================================
// CATEGORY ACCURACY
// =====================================

const groupAccuracy =

  groupPossible === 0

    ? 0

    : Number(
        (
          groupCorrect /
          groupPossible *
          100
        ).toFixed(2)
      );

const standingsAccuracy =

  standingsPossible === 0

    ? 0

    : Number(
        (
          standingsCorrect /
          standingsPossible *
          100
        ).toFixed(2)
      );

const knockoutAccuracy =

  knockoutPossible === 0

    ? 0

    : Number(
        (
          knockoutCorrect /
          knockoutPossible *
          100
        ).toFixed(2)
      );
  const value =
    possible > 0
      ? correct / possible
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

      best_category:

      groupAccuracy >= standingsAccuracy &&
      groupAccuracy >= knockoutAccuracy

      ? 'group'

      : standingsAccuracy >= knockoutAccuracy

      ? 'standings'

      : 'knockout',

      worst_category:

      groupAccuracy <= standingsAccuracy &&
      groupAccuracy <= knockoutAccuracy

      ? 'group'

      : standingsAccuracy <= knockoutAccuracy

      ? 'standings'

      : 'knockout',

      category_breakdown: {

      group: {

      correct:
      groupCorrect,

      possible:
      groupPossible,

      accuracy:
      groupAccuracy

      },

      standings: {

      correct:
      standingsCorrect,

      possible:
      standingsPossible,

      accuracy:
      standingsAccuracy

      },

      knockout: {

      correct:
      knockoutCorrect,

      possible:
      knockoutPossible,

      accuracy:
      knockoutAccuracy

      }

      }

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
    'precision_general',

  users

};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'precision_general.json'

);

saveOutput(
  outputPath,
  output
);

console.log(
  '✅ precision_general.json generado'
);