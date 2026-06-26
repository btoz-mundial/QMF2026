// scripts/admin_standings_projection.js

const fs = require('fs');
const path = require('path');

// =====================================
// PATHS
// =====================================

const BASE_DIR = path.resolve(__dirname, '..');

const USERS_DIR = path.join(
  BASE_DIR,
  'output',
  'users',
  'profiles'
);

const TEMPORAL_STANDINGS_FILE = path.join(
  BASE_DIR,
  'output',
  'scores',
  'temporal_group_standings.json'
);

const GROUP_RESULTS_FILE = path.join(
  BASE_DIR,
  'data',
  'results',
  'group_results.json'
);

const OUTPUT_FILE = path.join(
  BASE_DIR,
  'output',
  'admin',
  'standings_projection.json'
);

// =====================================
// HELPERS
// =====================================

function loadJSON(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  );
}

function ensureOutputDir() {

  const dir = path.dirname(
    OUTPUT_FILE
  );

  if (!fs.existsSync(dir)) {

    fs.mkdirSync(
      dir,
      { recursive: true }
    );

  }

}

// =====================================
// LOAD DATA
// =====================================

const users = fs
  .readdirSync(USERS_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f =>
    loadJSON(
      path.join(
        USERS_DIR,
        f
      )
    )
  );

const temporalStandings =
  loadJSON(
    TEMPORAL_STANDINGS_FILE
  );

const groupResults =
  loadJSON(
    GROUP_RESULTS_FILE
  );

// =====================================
// BUILD CURRENT POSITIONS MAP
// =====================================

const currentGroups = {};

temporalStandings.groups.forEach(group => {

  currentGroups[group.group] =
    group.table
      .sort(
        (a, b) =>
          a.position - b.position
      )
      .map(row => row.team);

});
console.log(
  JSON.stringify(
    currentGroups["B"],
    null,
    2
  )
);
// =====================================
// GROUP RESOLVED?
// =====================================

function isGroupResolved(group) {

  const matches =
    groupResults.filter(
      m => m.group === group
    );

  return matches.every(
    m => m.status === 'final'
  );

}

// =====================================
// STANDINGS SCORING
// =====================================

const POSITION_POINTS = [
  4, // 1°
  3, // 2°
  2, // 3°
  1  // 4°
];

function scoreGroup(
  predictedPositions,
  currentPositions
) {

  let points = 0;

  for (let i = 0; i < 4; i++) {

    if (
      predictedPositions[i] ===
      currentPositions[i]
    ) {
      points += POSITION_POINTS[i];
    }

  }

  return points;

}

// =====================================
// BUILD REPORT
// =====================================

const report = users.map(user => {

  const row = {
    display_name:
      user.display_name
  };

  let total = 0;
  let resolvedPoints = 0;

  user.standings.forEach(groupPrediction => {

    const group =
      groupPrediction.group;

    const currentPositions =
      currentGroups[group];

    if (!currentPositions) {
      return;
    }

    const points =
      scoreGroup(
        groupPrediction.positions,
        currentPositions
      );

    row[group] = points;

    total += points;

    if (
      isGroupResolved(group)
    ) {
      resolvedPoints += points;
    }

  });

  row.resolved_points =
    resolvedPoints;

  row.total =
    total;

  return row;

});

// =====================================
// SORT
// =====================================

report.sort(
  (a, b) =>
    b.total - a.total
);

// =====================================
// SAVE
// =====================================

ensureOutputDir();

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    report,
    null,
    2
  )
);

console.log(
  `✅ Generated: ${OUTPUT_FILE}`
);