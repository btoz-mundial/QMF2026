const fs = require('fs');
const path = require('path');


// =====================================
// PATHS
// =====================================

const BASE_DIR = path.resolve(__dirname, '..', '..', '..');

const SCORES_PATH = path.join(
  BASE_DIR,
  'output',
  'scores',
  'score_details.json'
);

const USERS_DIR = path.join(
  BASE_DIR,
  'output',
  'users',
  'profiles'
);

const KNOCKOUT_RESULTS_PATH = path.join(
  BASE_DIR,
  'data',
  'results',
  'knockout_results.json'
);

const OUTPUT_PATH = path.join(
  BASE_DIR,
  'analytics',
  'core',
  'outputs',
  'precision_avance.json'
);


// =====================================
// HELPERS
// =====================================

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


// =====================================
// REAL QUALIFIED TEAMS
// =====================================

function getRealQualifiedTeams(
  knockoutResults
) {

  const r32Matches = knockoutResults
    .filter(match =>
      match.stage === 'R32'
    );

  const teams = [];

  r32Matches.forEach(match => {

    if (match.home_team) {

      teams.push({
        team: match.home_team,
        position: 1
      });

    }

    if (match.away_team) {

      teams.push({
        team: match.away_team,
        position: 2
      });

    }

  });

  return teams;

}


// =====================================
// USER QUALIFIED TEAMS
// =====================================

function getUserQualifiedTeams(user) {

  const qualified = [];

  user.standings.forEach(group => {

    const first =
      group.positions?.[0];

    const second =
      group.positions?.[1];

    if (first) {

      qualified.push({
        team: first,
        position: 1
      });

    }

    if (second) {

      qualified.push({
        team: second,
        position: 2
      });

    }

  });

  return qualified;

}


// =====================================
// GROUP QUALIFIERS ACCURACY
// =====================================

function getGroupQualifiersAccuracy(
  user,
  knockoutResults
) {

  const real =
    getRealQualifiedTeams(
      knockoutResults
    );

  const predicted =
    getUserQualifiedTeams(user);

  let correctTeams = 0;
  let correctPositions = 0;

  predicted.forEach(pred => {

    const found =
      real.find(r =>
        r.team === pred.team
      );

    if (found) {

      correctTeams++;

      if (
        found.position === pred.position
      ) {

        correctPositions++;

      }

    }

  });

  return {

    correct_teams:
      correctTeams,

    correct_positions:
      correctPositions,

    total_slots: 32,

    team_accuracy_percent:
      Number(
        (
          correctTeams / 32 * 100
        ).toFixed(2)
      ),

    position_accuracy_percent:
      Number(
        (
          correctPositions / 32 * 100
        ).toFixed(2)
      )

  };

}


// =====================================
// KNOCKOUT ADVANCEMENT ACCURACY
// =====================================

function getKnockoutAccuracy(
  scoreDetail
) {

  const matches =
    scoreDetail.knockout || [];

  const completed =
    matches.filter(match =>
      match.result?.advance_team
    );

  const correct =
    completed.filter(match =>
      match.prediction?.advance_team ===
      match.result?.advance_team
    );

  return {

    correct_predictions:
      correct.length,

    total_predictions:
      completed.length,

    accuracy_percent:
      completed.length === 0
        ? 0
        : Number(
            (
              correct.length /
              completed.length *
              100
            ).toFixed(2)
          )

  };

}

// =====================================
// BUILD METRIC
// =====================================

function buildMetric() {

  const scoreDetails =
    loadJSON(SCORES_PATH);

  const knockoutResults =
    loadJSON(KNOCKOUT_RESULTS_PATH);

  const userFiles =
    fs.readdirSync(USERS_DIR)
      .filter(file =>
        file.endsWith('.json')
      );

  const users =
    userFiles.map(file =>
      loadJSON(
        path.join(
          USERS_DIR,
          file
        )
      )
    );

  const output = [];

  users.forEach(user => {

    const detail =
      scoreDetails.find(s =>
        s.user_id === user.user_id
      );

    if (!detail) {
      return;
    }

    const qualifiers =
      getGroupQualifiersAccuracy(
        user,
        knockoutResults
      );
    
    

    const knockout =
      getKnockoutAccuracy(
        detail
      );

    const combined =
      Number(
        (
          (
            qualifiers.position_accuracy_percent +
            knockout.accuracy_percent
          ) / 2
        ).toFixed(2)
      );

    output.push({

      user_id:
        user.user_id,

      display_name:
        user.display_name,

      metric_id:
        'precision_avance',

      value:
        combined,

      group_qualifiers_accuracy:
        qualifiers,

      knockout_advancement_accuracy:
        knockout

    });

  });

  output.sort(
    (a, b) =>
      b.value - a.value
  );

  output.forEach((user, index) => {

    user.rank = index + 1;

  });

  output.forEach((user, index) => {

  user.rank = index + 1;

});

const OUTPUT_DIR = path.dirname(
  OUTPUT_PATH
);

if (!fs.existsSync(OUTPUT_DIR)) {

  fs.mkdirSync(
    OUTPUT_DIR,
    { recursive: true }
  );

}


 fs.writeFileSync(

  OUTPUT_PATH,

  JSON.stringify(
    output,
    null,
    2
  )

);

console.log(
  '✅ precision_avance generado'
);

}


// =====================================
// RUN
// =====================================

buildMetric();