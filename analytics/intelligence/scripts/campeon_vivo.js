const path = require('path');
const fs = require('fs');

const {
  loadUsers
} = require('../../helpers/loadUsers');

const {
  loadResults
} = require('../../helpers/loadResults');

const {
  saveOutput
} = require('../../helpers/saveOutput');


// =====================================
// LOAD
// =====================================

const users =
  loadUsers().flat();


const results =
  loadResults();


// =====================================
// ELIMINATED TEAMS
// =====================================

const eliminatedTeams = {};
const qualifiedTeams =
  new Set();

// =====================================
//ELIMINATED AT GROUP FASE
// =====================================
const firstRoundMatches =
  results.knockout.filter(
    match => match.round_order === 1
  );

firstRoundMatches.forEach(match => {

  if (match.home_team) {
    qualifiedTeams.add(match.home_team);
  }

  if (match.away_team) {
    qualifiedTeams.add(match.away_team);
  }

});
// =====================================
// KNOCKOUT RESULTS
// =====================================

results.knockout.forEach(match => {

  // =====================================
  // SKIP UNPLAYED
  // =====================================

  if (
    match.home_goals === null ||
    match.away_goals === null ||
    !match.advance_team
  ) {
    return;
  }

  // =====================================
  // LOSER
  // =====================================

    // =====================================
  // LOSER
  // =====================================

  const loser =

    match.advance_team === match.home_team
      ? match.away_team
      : match.home_team;

  eliminatedTeams[loser] =
    match.stage;

});


// =====================================
// BUILD METRIC
// =====================================

const validUsers = users.filter(user =>

  user.user_id &&
  user.display_name

);

const metricUsers = validUsers.map(user => {

  const profilePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'output',
    'users',
    'profiles',
    path.basename(user.profile_file)
  );

  const profile = JSON.parse(
    fs.readFileSync(profilePath, 'utf-8')
  );

  // =====================================
  // SPECIAL MATCHES
  // =====================================

  const finalMatch =
    profile.knockout?.find(
      match => match.match_id === 104
    );

  const thirdPlaceMatch =
    profile.knockout?.find(
      match => match.match_id === 103
    );

  // =====================================
  // PICKS
  // =====================================

  const champion =
    finalMatch?.advance_team || null;

  const finalist1 =
    finalMatch?.home_team || null;

  const finalist2 =
    finalMatch?.away_team || null;

  const third_place =
    thirdPlaceMatch?.advance_team || null;

  // =====================================
  // KNOCKOUT STATE
  // =====================================

  // knockoutStarted = true only when at least one knockout match has been played
  // (advance_team populated). If the bracket is set up but no games played yet,
  // we do NOT mark group-eliminated teams as out — they remain 'pending'.
  const knockoutStarted =
    results.knockout.some(m => m.advance_team !== null);

  // =====================================
  // HELPER
  // =====================================

  function buildStatus(team) {

    if (!team) {

      return {
        status: 'no_pick',
        eliminated_by_stage: null,
        alive: false
      };

    }

    const eliminatedInKnockout =
      eliminatedTeams[team] || null;

    const eliminatedInGroups =

      knockoutStarted &&
      !qualifiedTeams.has(team) &&
      !eliminatedInKnockout;

    const alive =
      !eliminatedInKnockout &&
      !eliminatedInGroups;

    const eliminated_by_stage =

      alive
        ? null

        : eliminatedInKnockout
          ? eliminatedInKnockout

          : eliminatedInGroups
            ? 'GROUP'

            : null;

    // 'pending' = bracket not started yet (no advance_team in any KO match)
    const status =
      alive && !knockoutStarted
        ? 'pending'
        : alive
          ? 'alive'
          : 'eliminated';

    return {

      status,
      eliminated_by_stage,
      alive

    };

  }

  // =====================================
  // STATES
  // =====================================

  const championState =
    buildStatus(champion);

  const thirdPlaceState =
    buildStatus(third_place);

  const finalist1State =
    buildStatus(finalist1);

  const finalist2State =
    buildStatus(finalist2);

  // =====================================
  // PRIMARY VALUE
  // =====================================

  const value =
    championState.alive;

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

      champion,
      champion_status:
        championState.status,
      champion_eliminated_by_stage:
        championState.eliminated_by_stage,

      third_place,
      third_place_status:
        thirdPlaceState.status,
      third_place_eliminated_by_stage:
        thirdPlaceState.eliminated_by_stage,

      finalist1,
      finalist1_status:
        finalist1State.status,
      finalist1_eliminated_by_stage:
        finalist1State.eliminated_by_stage,

      finalist2,
      finalist2_status:
        finalist2State.status,
      finalist2_eliminated_by_stage:
        finalist2State.eliminated_by_stage

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
    'campeon_vivo',

  users:
    metricUsers

};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'campeon_vivo.json'

);

saveOutput(
  outputPath,
  output
);

console.log(
  '✅ campeon_vivo.json generado'
);
