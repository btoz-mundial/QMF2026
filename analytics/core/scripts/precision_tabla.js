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

  let correct_positions = 0;

  let possible_positions = 0;

  // =====================================
  // STANDINGS
  // =====================================

  let perfect_groups = [];

  let zero_points_groups = [];

  let best_group_score = -1;

  let worst_group_score = 999;

  user.standings.forEach(group => {

    let group_correct_positions = 0;

    let group_points = 0;

    group.positions.forEach(position => {

      possible_positions += 1;

      if (position.correct) {

        correct_positions += 1;

        group_correct_positions += 1;

      }

      group_points += position.points;

    });

    // =====================================
    // PERFECT GROUPS
    // =====================================

    if (group_correct_positions === 4) {

      perfect_groups.push(group.group);

    }

    // =====================================
    // ZERO POINT GROUPS
    // =====================================

    if (group_points === 0) {

      zero_points_groups.push(group.group);

    }

    // =====================================
    // BEST GROUP SCORE
    // =====================================

    if (group_points > best_group_score) {

      best_group_score = group_points;

    }

    // =====================================
    // WORST GROUP SCORE
    // =====================================

    if (group_points < worst_group_score) {

      worst_group_score = group_points;

    }

  });

  // =====================================
  // BEST/WORST GROUPS
  // =====================================

  const best_groups =
    user.standings
      .filter(group => group.total_points === best_group_score)
      .map(group => group.group);

  const worst_groups =
    user.standings
      .filter(group => group.total_points === worst_group_score)
      .map(group => group.group);

  // =====================================
  // VALUE
  // =====================================

  const value =
    possible_positions > 0
      ? correct_positions / possible_positions
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

      correct_positions,

      incorrect_positions:
        possible_positions - correct_positions,

      possible_positions,

      perfect_groups,

      zero_points_groups,

      best_group_score,

      best_groups,

      worst_group_score,

      worst_groups

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
    'precision_tabla',

  users

};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'precision_tabla.json'

);

saveOutput(
  outputPath,
  output
);

console.log(
  '✅ precision_tabla.json generado'
);