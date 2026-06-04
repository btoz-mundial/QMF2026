// =====================================
// TEMPORAL GROUP STANDINGS
// =====================================
//
// Genera standings temporales dinámicos
// desde los snapshots reales del torneo.
//
// NO afecta scoring.
// NO modifica standings finales.
// SOLO sirve para visualización.
//
// Output:
// output/scores/temporal_group_standings.json
//
// =====================================


// =====================================
// IMPORTS
// =====================================

const fs = require('fs');
const path = require('path');


// =====================================
// PATHS
// =====================================

const BASE_DIR =
  path.resolve(__dirname, '..');

const GROUP_RESULTS_PATH =
  path.join(
    BASE_DIR,
    'data',
    'results',
    'group_results.json'
  );

const OUTPUT_PATH =
  path.join(
    BASE_DIR,
    'output',
    'scores',
    'temporal_group_standings.json'
  );


// =====================================
// HELPERS
// =====================================

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


function ensureDir(filePath) {

  const dir =
    path.dirname(filePath);

  if (!fs.existsSync(dir)) {

    fs.mkdirSync(
      dir,
      { recursive: true }
    );

  }

}


function saveJSON(filePath, data) {

  ensureDir(filePath);

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2)
  );

}


// =====================================
// EMPTY TEAM TEMPLATE
// =====================================

function createEmptyTeam(teamName) {

  return {

    team: teamName,

    // =====================================
    // TABLE
    // =====================================

    pts: 0,

    pj: 0,

    pg: 0,

    pe: 0,

    pp: 0,

    gf: 0,

    gc: 0,

    dg: 0,

    // =====================================
    // VISUAL / UX
    // =====================================

    position: null,

    form: []

  };

}


// =====================================
// APPLY MATCH RESULT
// =====================================

function applyMatch(home, away, match) {

  const homeGoals = match.home_goals;
  const awayGoals = match.away_goals;

  // =====================================
  // PJ
  // =====================================

  home.pj += 1;
  away.pj += 1;

  // =====================================
  // GOALS
  // =====================================

  home.gf += homeGoals;
  home.gc += awayGoals;

  away.gf += awayGoals;
  away.gc += homeGoals;

  // =====================================
  // DG
  // =====================================

  home.dg = home.gf - home.gc;
  away.dg = away.gf - away.gc;

  // =====================================
  // RESULT
  // =====================================

  if (homeGoals > awayGoals) {

    // HOME WIN

    home.pg += 1;
    away.pp += 1;

    home.pts += 3;

    home.form.push('W');
    away.form.push('L');

  }

  else if (homeGoals < awayGoals) {

    // AWAY WIN

    away.pg += 1;
    home.pp += 1;

    away.pts += 3;

    away.form.push('W');
    home.form.push('L');

  }

  else {

    // DRAW

    home.pe += 1;
    away.pe += 1;

    home.pts += 1;
    away.pts += 1;

    home.form.push('D');
    away.form.push('D');

  }

}


// =====================================
// SORT GROUP TABLE
// =====================================

function sortGroupTable(table) {

  return table.sort((a, b) => {

    // =====================================
    // PTS
    // =====================================

    if (b.pts !== a.pts) {

      return b.pts - a.pts;

    }

    // =====================================
    // DG
    // =====================================

    if (b.dg !== a.dg) {

      return b.dg - a.dg;

    }

    // =====================================
    // GF
    // =====================================

    if (b.gf !== a.gf) {

      return b.gf - a.gf;

    }

    // =====================================
    // STABLE SORT
    // =====================================

    return a.team.localeCompare(b.team);

  });

}


// =====================================
// POSITION ASSIGNMENT
// =====================================

function assignPositions(table) {

  table.forEach((team, index) => {

    team.position = index + 1;

  });

}


// =====================================
// BUILD STANDINGS
// =====================================

function buildTemporalStandings(matches) {

  // =====================================
  // GROUP CONTAINER
  // =====================================

  const groups = {};

  // =====================================
  // INIT ALL GROUPS & TEAMS
  // (ensures table renders even pre-torneo)
  // =====================================

  matches.forEach(match => {

    const group = match.group;

    if (!groups[group]) {
      groups[group] = {};
    }

    if (!groups[group][match.home_team]) {
      groups[group][match.home_team] =
        createEmptyTeam(match.home_team);
    }

    if (!groups[group][match.away_team]) {
      groups[group][match.away_team] =
        createEmptyTeam(match.away_team);
    }

  });

  // =====================================
  // APPLY FINAL MATCH RESULTS
  // =====================================

  matches.forEach(match => {

    // =====================================
    // ONLY FINAL MATCHES
    // =====================================

    if (match.status !== 'final') {
      return;
    }

    // =====================================
    // VALIDATE
    // =====================================

    if (
      match.home_goals === null ||
      match.away_goals === null
    ) {
      return;
    }
    // =====================================
    // APPLY RESULT
    // =====================================

    applyMatch(

      groups[match.group][match.home_team],
      groups[match.group][match.away_team],
      match

    );

  });

  // =====================================
  // BUILD OUTPUT
  // =====================================

  const finalGroups =

    Object.entries(groups)

      .map(([group, teams]) => {

        const table =
          Object.values(teams);

        const sorted =
          sortGroupTable(table);

        assignPositions(sorted);

        return {

          group,

          table: sorted

        };

      });

  // =====================================
  // RETURN
  // =====================================

  return finalGroups;

}


// =====================================
// SNAPSHOT MATCH ID
// =====================================

function getLatestMatchId(matches) {

  const completed =

    matches
      .filter(m => m.status === 'final');

  if (completed.length === 0) {

    return null;

  }

  return Math.max(
    ...completed.map(m => m.match_id)
  );

}


// =====================================
// MAIN
// =====================================

function main() {

  console.log(
    '\n📊 Building temporal group standings...\n'
  );

  // =====================================
  // LOAD MATCHES
  // =====================================

  const matches =
    loadJSON(GROUP_RESULTS_PATH);

  // =====================================
  // BUILD
  // =====================================

  const groups =
    buildTemporalStandings(matches);

  // =====================================
  // OUTPUT
  // =====================================

  const output = {

    generated_at:
      new Date().toISOString(),

    snapshot_match_id:
      getLatestMatchId(matches),

    stage:
      'group_temporal',

    deterministic:
      true,

    disclaimer:
      'Standings temporales utilizados exclusivamente para visualización competitiva.',

    tiebreakers: [
      'PTS',
      'DG',
      'GF',
      'Alphabetical'
    ],

    groups

  };

  // =====================================
  // SAVE
  // =====================================

  saveJSON(
    OUTPUT_PATH,
    output
  );

  console.log(
    '✅ temporal_group_standings.json generated\n'
  );

}


// =====================================
// RUN
// =====================================

main();