// =====================================
// IMPORTS
// =====================================

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');


// =====================================
// PATHS
// =====================================

const BASE_DIR =
  path.resolve(__dirname, '..');

const FIXTURE_FILE =
  path.join(
    BASE_DIR,
    'data',
    'fixture_master.xlsx'
  );

const TEAMS_FILE =
  path.join(
    BASE_DIR,
    'data',
    'teams',
    'teams.json'
  );

const GROUP_RESULTS_OUTPUT =
  path.join(
    BASE_DIR,
    'data',
    'results',
    'group_results.json'
  );

const STANDINGS_RESULTS_OUTPUT =
  path.join(
    BASE_DIR,
    'data',
    'results',
    'standings_results.json'
  );

const KNOCKOUT_RESULTS_OUTPUT =
  path.join(
    BASE_DIR,
    'data',
    'results',
    'knockout_results.json'
  );

const MATCHES_METADATA_OUTPUT =
  path.join(
    BASE_DIR,
    'data',
    'metadata',
    'matches_metadata.json'
  );


// =====================================
// LOAD FILES
// =====================================

const workbook =
  xlsx.readFile(FIXTURE_FILE);

const fixtureSheet =
  workbook.Sheets[
    workbook.SheetNames[0]
  ];

const standingsSheet =
  workbook.Sheets[
    'standings'
  ];

const rows =
  xlsx.utils.sheet_to_json(
    fixtureSheet,
    { defval: null }
  ).map(normalizeRowKeys);

const standingsRows =
  xlsx.utils.sheet_to_json(
    standingsSheet,
    { defval: null }
  ).map(normalizeRowKeys);

const teams =
  JSON.parse(
    fs.readFileSync(
      TEAMS_FILE,
      'utf-8'
    )
  );


// =====================================
// TEAM LOOKUP
// =====================================

const validTeams =
  new Set(
    teams.map(
      t => t.name
    )
  );


// =====================================
// HELPERS
// =====================================

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

    JSON.stringify(
      data,
      null,
      2
    )

  );

}


function normalizeString(value) {

  if (
    value === undefined ||
    value === null
  ) {

    return null;

  }

  const normalized =
    String(value)
      .trim();

  if (
    normalized === '' ||
    normalized.toLowerCase() === 'null'
  ) {

    return null;

  }

  return normalized;

}


function normalizeNumber(value) {

  const normalized =
    normalizeString(value);

  if (
    normalized === null
  ) {

    return null;

  }

  const parsed =
    Number(normalized);

  if (
    Number.isNaN(parsed)
  ) {

    return null;

  }

  return parsed;

}

function normalizeRowKeys(row) {

  const normalized = {};

  Object.keys(row).forEach(key => {

    normalized[
      key
        .toString()
        .trim()
        .toLowerCase()
    ] = row[key];

  });

  return normalized;

}

// =====================================
// EXCEL DATE/TIME HELPERS
// =====================================

function normalizeExcelDate(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value === 'number') {

    return xlsx.SSF.format(
      'dd-mmm',
      value
    );

  }

  return String(value).trim();

}


function normalizeExcelTime(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value === 'number') {

    return xlsx.SSF.format(
      'hh:mm',
      value
    );

  }

  return String(value).trim();

}

// =====================================
// VALIDATIONS
// =====================================

function validateRows(rows) {

  const matchIds =
    new Set();

  rows.forEach((row, index) => {

    const rowNumber =
      index + 2;

    // =====================================
    // MATCH ID
    // =====================================

    if (
      row.match_id === undefined ||
      row.match_id === null
    ) {

      throw new Error(
        `❌ Missing match_id at row ${rowNumber}`
      );

    }

    if (
      matchIds.has(row.match_id)
    ) {

      throw new Error(
        `❌ Duplicate match_id ${row.match_id}`
      );

    }

    matchIds.add(
      row.match_id
    );

  // =====================================
  // TEAM VALIDATION
  // =====================================

  const homeTeam =
    normalizeString(
      row.home_team
    );

  const awayTeam =
    normalizeString(
      row.away_team
    );

  if (
    homeTeam &&
    !validTeams.has(
      homeTeam
    )
  ) {

    throw new Error(
      `❌ Invalid home_team "${homeTeam}" at row ${rowNumber}`
    );

  }

  if (
    awayTeam &&
    !validTeams.has(
      awayTeam
    )
  ) {

    throw new Error(
      `❌ Invalid away_team "${awayTeam}" at row ${rowNumber}`
    );

  }

    // =====================================
    // WINNER TYPE VALIDATION
    // =====================================

    const winnerType =
      normalizeString(
        row.winner_type
      );

    if (
      winnerType !== null &&
      ![
        'REGULAR_TIME',
        'EXTRA_TIME',
        'PENALTIES'
      ].includes(
        winnerType
      )
    ) {

      throw new Error(
        `❌ Invalid winner_type at row ${rowNumber}`
      );

    }

    // =====================================
    // STATUS VALIDATION
    // =====================================

    const status =
      normalizeString(
        row.status
      );

    if (
      status !== null &&
      ![
        'scheduled',
        'live',
        'final',
        'postponed',
        'cancelled'
      ].includes(
        status
      )
    ) {

      throw new Error(
        `❌ Invalid status at row ${rowNumber}`
      );

    }

  });

}


// =====================================
// BUILD GROUP RESULTS
// =====================================

function buildGroupResults(rows) {

  return rows

    .filter(
      row =>
        row.stage === 'group'
    )

    .map(row => ({

      // =====================================
      // IDENTITY
      // =====================================

      match_id:
        row.match_id,

      stage:
        row.stage,

      group:
        normalizeString(
          row.group
        ),

      status:
        normalizeString(
          row.status
        ),

      // =====================================
      // TEAMS
      // =====================================

      home_team:
        normalizeString(
          row.home_team
        ),

      away_team:
        normalizeString(
          row.away_team
        ),

      // =====================================
      // RESULT
      // =====================================

      home_goals:
        normalizeNumber(
          row.home_goals
        ),

      away_goals:
        normalizeNumber(
          row.away_goals
        ),

      result:
        normalizeString(
          row.result
        )?.toUpperCase() || null

    }));

}

// =====================================
// BUILD STANDINGS RESULTS
// =====================================

function buildStandingsResults(
  standingsRows
) {

  // =====================================
  // GROUPED STANDINGS
  // =====================================

  const grouped = {};

  const bestThirds = [];

  standingsRows.forEach((row) => {

  const group =
    normalizeString(row.group);

  const position =
    normalizeNumber(row.position);

  const team =
    normalizeString(row.team);

  // =====================================
  // IGNORE EMPTY ROWS
  // =====================================

  const isEmptyRow =
    !group &&
    position === null &&
    !team;

  if (isEmptyRow) {
    return;
  }

  // =====================================
  // INVALID PARTIAL ROW
  // =====================================

  if (!group || !team) {

    throw new Error(
      'Invalid standings row'
    );

  }

  // =====================================
  // GROUP INIT
  // =====================================

  if (!grouped[group]) {

    grouped[group] = [];

  }

  const positionData = {
    position,
    team
  };

  grouped[group].push(
    positionData
  );

  // =====================================
  // BEST THIRD
  // =====================================

  const isBestThird =
    String(row.best_third)
      .trim()
      .toUpperCase() === 'TRUE';

  if (isBestThird) {

    bestThirds.push(team);

  }

  });


  // =====================================
  // BUILD GROUPS
  // =====================================

  const groups =

    Object.entries(grouped)

      .map(([group, rows]) => {

        const ordered =

          rows.sort(

            (a, b) =>

              a.position - b.position

          );

        return {

          group,

          positions:
            ordered

        };

      });

  // =====================================
  // RETURN
  // =====================================

  return {

    snapshot_match_id:
      72.5,

    stage:
      'standings',

    status:
      'final',

    groups,

    best_thirds:
      bestThirds

  };

}

// =====================================
// BUILD KNOCKOUT RESULTS
// =====================================

function buildKnockoutResults(rows) {

  const roundOrderMap = {

    R32: 1,
    OF: 2,
    QF: 3,
    SF: 4,
    '3P': 5,
    Final: 6

  };

  let slotCounter = 1;

  return rows

    .filter(
      row =>
        row.stage !== 'group'
    )

    .map(row => {

      const knockoutMatch = {

        // =====================================
        // IDENTITY
        // =====================================

        match_id:
          row.match_id,

        stage:
          normalizeString(
            row.stage
          ),

        slot:
          slotCounter++,

        round_order:
          roundOrderMap[
            row.stage
          ] || null,

        status:
          normalizeString(
            row.status
          ),

        // =====================================
        // TEAMS
        // =====================================

        home_team:
          normalizeString(
            row.home_team
          ),

        away_team:
          normalizeString(
            row.away_team
          ),

        // =====================================
        // SCORE
        // =====================================

        home_goals:
          normalizeNumber(
            row.home_goals
          ),

        away_goals:
          normalizeNumber(
            row.away_goals
          ),

        // =====================================
        // PENALTIES
        // =====================================

        home_penalties:
          normalizeNumber(
            row.home_penalties
          ),

        away_penalties:
          normalizeNumber(
            row.away_penalties
          ),

        // =====================================
        // ADVANCEMENT
        // =====================================

        advance_team:
          normalizeString(
            row.advance_team
          ),

        winner_type:
          normalizeString(
            row.winner_type
          )

      };

      return knockoutMatch;

    });

}

// =====================================
// BUILD MATCHES METADATA
// =====================================

function buildMatchesMetadata(rows) {

  const metadata = {};

  rows.forEach(row => {

    metadata[row.match_id] = {

      match_id:
        row.match_id,

      stage:
        normalizeString(
          row.stage
        ),

      group:
        normalizeString(
          row.group
        ),

      group_order:
        normalizeNumber(
          row.group_order
        ),

      matchday:
        normalizeNumber(
          row.matchday
        ),

      home_team:
        normalizeString(
          row.home_team
        ),

      away_team:
        normalizeString(
          row.away_team
        ),

      match_date:
        normalizeExcelDate(
          row.match_date
        ),

      kickoff_utc:
        normalizeExcelTime(
          row.kickoff_utc
        ),

      timezone:
        normalizeString(
          row.timezone
        ),

      venue:
        normalizeString(
          row.venue
        ),

      city:
        normalizeString(
          row.city
        ),

      country:
        normalizeString(
          row.country
        )

    };

  });

  return metadata;

}

// =====================================
// MAIN
// =====================================

function main() {

  console.log(
    '\n📥 Ingesting fixture_master.xlsx...\n'
  );

  // =====================================
  // VALIDATE
  // =====================================

  validateRows(rows);

  console.log(
    '✅ Validations passed'
  );

  // =====================================
  // BUILD OUTPUTS
  // =====================================

  const groupResults =
    buildGroupResults(
      rows
    );

  const standingsResults =
    buildStandingsResults(
      standingsRows
    );

  const knockoutResults =
    buildKnockoutResults(
      rows
    );
  
  const matchesMetadata =
    buildMatchesMetadata(
      rows
    );

  // =====================================
  // SAVE OUTPUTS
  // =====================================

  saveJSON(
    GROUP_RESULTS_OUTPUT,
    groupResults
  );

  saveJSON(
    STANDINGS_RESULTS_OUTPUT,
    standingsResults
  );

  saveJSON(
    KNOCKOUT_RESULTS_OUTPUT,
    knockoutResults
  );

  saveJSON(
    MATCHES_METADATA_OUTPUT,
    matchesMetadata
  );
  
  console.log(
    '\n✅ Fixture ingestion completed\n'
  );

}


// =====================================
// RUN
// =====================================

main();