const XLSX = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');


// =================================
// CONSTANTS
// =================================

const EXPECTED_GROUP_MATCHES = 72;
const EXPECTED_KNOCKOUT_MATCHES = 32;
const EXPECTED_STANDINGS_ROWS = 48;
const EXPECTED_GROUPS = 12;
const EXPECTED_POSITIONS = 4;


// =================================
// HELPERS
// =================================

function safeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30);
}

function generateUserId(buffer) {
  return crypto
    .createHash('sha1')
    .update(buffer)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
}

function normalizeNumber(val) {

  if (
    val === undefined ||
    val === null ||
    val === ''
  ) {
    return null;
  }

  const n = Number(val);

  return isNaN(n)
    ? null
    : n;
}

function normalizeRowKeys(row) {

  const o = {};

  Object.keys(row).forEach(k => {

    o[k.trim().toLowerCase()] = row[k];

  });

  return o;
}

function error(file, ref, stage, msg) {

  throw new Error(
    `[${file}] [ref:${ref}] [stage:${stage}] → ${msg}`
  );

}


// =================================
// VALIDATIONS
// =================================

function validateUniqueMatchIds(
  rows,
  file,
  stage
) {

  const ids = rows.map(r => Number(r.match_id));

  const unique = new Set(ids);

  if (ids.length !== unique.size) {

    throw new Error(
      `[${file}] [stage:${stage}] → Duplicate match_id`
    );

  }

}


function validateGroupCount(rows, file) {

  if (rows.length !== EXPECTED_GROUP_MATCHES) {

    throw new Error(
      `[${file}] → Debe contener ${EXPECTED_GROUP_MATCHES} partidos de grupos`
    );

  }

}


function validateKnockoutCount(rows, file) {

  if (rows.length !== EXPECTED_KNOCKOUT_MATCHES) {

    throw new Error(
      `[${file}] → Debe contener ${EXPECTED_KNOCKOUT_MATCHES} partidos knockout`
    );

  }

}


function validateStandingsCount(rows, file) {

  if (rows.length !== EXPECTED_STANDINGS_ROWS) {

    throw new Error(
      `[${file}] → Debe contener ${EXPECTED_STANDINGS_ROWS} posiciones de standings`
    );

  }

}


// =================================
// PARSERS
// =================================

function parseGroup(rows, file) {

  validateGroupCount(rows, file);

  validateUniqueMatchIds(
    rows,
    file,
    'group'
  );

  return rows.map(r => {

    const L =
      normalizeNumber(r.lwin);

    const E =
      normalizeNumber(r.tie);

    const V =
      normalizeNumber(r.awin);

    if ([L, E, V].some(v => v === null)) {

      error(
        file,
        r.match_id,
        'group',
        'Missing L/E/V'
      );

    }

    if (L + E + V !== 1) {

      error(
        file,
        r.match_id,
        'group',
        'Invalid L/E/V'
      );

    }

    return {

      match_id:
        Number(r.match_id),

      prediction:
        L === 1
          ? 'L'
          : E === 1
            ? 'E'
            : 'V'

    };

  });

}


function parseKnockout(rows, file) {

  validateKnockoutCount(rows, file);

  validateUniqueMatchIds(
    rows,
    file,
    'knockout'
  );

  return rows.map(r => {

    // =================================
    // LEGACY EXCEL COLUMN MAPPING
    // =================================

    const homeGoals =
      normalizeNumber(
        r.home_goals ?? r.home_score
      );

    const awayGoals =
      normalizeNumber(
        r.away_goals ?? r.away_score
      );

    const advanceTeam =
      (
        r.advance_team ??
        r.advance
      )
        ?.toString()
        .trim();

    // =================================
    // VALIDATIONS
    // =================================

    if (
      homeGoals === null ||
      awayGoals === null
    ) {

      error(
        file,
        r.match_id,
        r.stage,
        'Missing score'
      );

    }

    if (
      homeGoals < 0 ||
      awayGoals < 0
    ) {

      error(
        file,
        r.match_id,
        r.stage,
        'Negative score'
      );

    }

    if (!advanceTeam) {

      error(
        file,
        r.match_id,
        r.stage,
        'Missing advance'
      );

    }

    // =================================
    // OUTPUT
    // =================================

    return {

      match_id:
        Number(r.match_id),

      home_team:
        r.home_team,

      away_team:
        r.away_team,

      home_goals:
        homeGoals,

      away_goals:
        awayGoals,

      advance_team:
        advanceTeam

    };

  });

}


function parseStandings(rows, file) {

  validateStandingsCount(rows, file);

  const groups = {};

  rows.forEach(r => {

    const g =
      r.group
        ?.toString()
        .trim();

    const pos =
      Number(r.position);

    const team =
      r.team
        ?.toString()
        ?.trim();

    if (!g) {

      throw new Error(
        `[${file}] → Missing standings group`
      );

    }

    if (
      !Number.isInteger(pos) ||
      pos < 1 ||
      pos > 4
    ) {

      throw new Error(
        `[${file}] [group:${g}] → Invalid position ${r.position}`
      );

    }

    if (!team) {

      throw new Error(
        `[${file}] [group:${g}] → Missing team`
      );

    }

    if (!groups[g]) {

      groups[g] = [
        null,
        null,
        null,
        null
      ];

    }

    if (groups[g][pos - 1]) {

      throw new Error(
        `[${file}] [group:${g}] → Duplicate position ${pos}`
      );

    }

    groups[g][pos - 1] = team;

  });

  if (
    Object.keys(groups).length !==
    EXPECTED_GROUPS
  ) {

    throw new Error(
      `[${file}] → Debe contener ${EXPECTED_GROUPS} grupos`
    );

  }

  Object.entries(groups).forEach(
    ([group, positions]) => {

      if (
        positions.some(p => !p)
      ) {

        throw new Error(
          `[${file}] [group:${group}] → Grupo incompleto`
        );

      }

      const unique =
        new Set(positions);

      if (
        unique.size !==
        EXPECTED_POSITIONS
      ) {

        throw new Error(
          `[${file}] [group:${group}] → Equipos duplicados`
        );

      }

    }
  );

  return Object
    .entries(groups)
    .map(([group, positions]) => ({

      group,
      positions

    }));

}


// =================================
// MAIN
// =================================

function main() {

  const mode =
    process.argv[2];

  if (
    !['validate', 'final', 'startover']
      .includes(mode)
  ) {

    throw new Error(
      'Usa: node scripts/parse_excel.js validate|final|startover'
    );

  }

  const BASE =
    process.cwd();
  // =================================
  // STARTOVER
  // =================================

  if (mode === 'startover') {

    const OUTPUT_USERS =
      path.join(
        BASE,
        'output',
        'users'
      );

    const PROFILES_DIR =
      path.join(
        OUTPUT_USERS,
        'profiles'
      );

    const INDEX_FILE =
      path.join(
        OUTPUT_USERS,
        'index.json'
      );

    const MATCHES_METADATA =
      path.join(
        BASE,
        'data',
        'metadata',
        'matches_metadata.json'
      );

    const GROUP_RESULTS =
      path.join(
        BASE,
        'data',
        'results',
        'group_results.json'
      );

    const KNOCKOUT_RESULTS =
      path.join(
        BASE,
        'data',
        'results',
        'knockout_results.json'
      );

    const STANDINGS_RESULTS =
      path.join(
        BASE,
        'data',
        'results',
        'standings_results.json'
      );

    // ================================
    // DELETE PROFILES
    // ================================

    if (fs.existsSync(PROFILES_DIR)) {

      fs.readdirSync(PROFILES_DIR)
        .forEach(file => {

        fs.unlinkSync(
          path.join(
            PROFILES_DIR,
            file
          )
        );

      });

    }

    // ================================
    // RESET INDEX
    // ================================

    fs.writeFileSync(
      INDEX_FILE,
      JSON.stringify([], null, 2)
    );

    // ================================
    // RESET METADATA
    // ================================

    fs.writeFileSync(
      MATCHES_METADATA,
      JSON.stringify({}, null, 2)
    );

    // ================================
    // RESET RESULTS
    // ================================

    fs.writeFileSync(
      GROUP_RESULTS,
      JSON.stringify([], null, 2)
    );

    fs.writeFileSync(
      KNOCKOUT_RESULTS,
      JSON.stringify([], null, 2)
    );

    fs.writeFileSync(
      STANDINGS_RESULTS,
      JSON.stringify([], null, 2)
    );

    console.log(
      '\n🧹 STARTOVER COMPLETADO'
    );

  return;

  }
  const INPUT_OPEN =
    path.join(BASE, 'input_open');

  const INPUT_LOCK =
    path.join(BASE, 'input_lock');

  const OUTPUT =
    path.join(
      BASE,
      'output',
      'users',
    );

  const SOURCE = INPUT_OPEN;

  const files =
    fs.readdirSync(SOURCE)
      .filter(f =>
        f.endsWith('.xlsx')
      );

  if (!files.length) {

    console.log(
      '⚠️ No hay archivos'
    );

    return;
  }

  if (!fs.existsSync(OUTPUT)) {

    fs.mkdirSync(
      OUTPUT,
      { recursive: true }
    );

  }

  // =================================
  // USER INDEX
  // =================================

  const indexPath =
  path.join(
    OUTPUT,
    'index.json'
  );

  let userIndex = [];

  if (fs.existsSync(indexPath)) {

   userIndex = JSON.parse(
    fs.readFileSync(indexPath, 'utf-8')
   );

  }

  files.forEach(file => {

    const full =
      path.join(
        SOURCE,
        file
      );

    const alreadyProcessed =
      fs.readdirSync(OUTPUT)
        .some(f =>
          f.includes(
            path.parse(file).name
          )
        );

    if (alreadyProcessed) {

      console.log(
        `⚠️ Ya procesado: ${file}`
      );

      return;
    }

    try {

      console.log(
        `\n📄 Procesando: ${file}`
      );

      const buffer =
        fs.readFileSync(full);

      const wb =
        XLSX.read(buffer, {
          type: 'buffer'
        });

      const groupSheet =
        wb.Sheets['R_Grupo'];

      const knockoutSheet =
        wb.Sheets['R_Knockout'];

      const standingsSheet =
        wb.Sheets['R_Standings'];

      if (!groupSheet) {

        throw new Error(
          `[${file}] Missing sheet R_Grupo`
        );

      }

      if (!knockoutSheet) {

        throw new Error(
          `[${file}] Missing sheet R_Knockout`
        );

      }

      if (!standingsSheet) {

        throw new Error(
          `[${file}] Missing sheet R_Standings`
        );

      }

      const groupRows =
        XLSX.utils
          .sheet_to_json(
            groupSheet,
            { defval: null }
          )
          .map(normalizeRowKeys);

      const knockoutRows =
        XLSX.utils
          .sheet_to_json(
            knockoutSheet,
            { defval: null }
          )
          .map(normalizeRowKeys);

      const standingsRows =
        XLSX.utils
          .sheet_to_json(
            standingsSheet,
            { defval: null }
          )
          .map(normalizeRowKeys);

      console.log(
        'Group:',
        groupRows.length
      );

      console.log(
        'Knockout:',
        knockoutRows.length
      );

      console.log(
        'Standings:',
        standingsRows.length
      );

      const display_name =
        groupRows?.[0]
          ?.display_name
          ?.toString()
          ?.trim()
        || 'Jugador';

      const user_id =
        generateUserId(buffer);

      const safe =
        safeFileName(
          display_name
        );

      const profileFile =
        `${safe}_${user_id}.json`;

      const output = {

        user_id,

        display_name,

        source_file:
          file,

        processed_at:
          new Date()
            .toISOString(),

        group_stage:
          parseGroup(
            groupRows,
            file
          ),

        knockout:
          parseKnockout(
            knockoutRows,
            file
          ),

        standings:
          parseStandings(
            standingsRows,
            file
          )

      };

      // Profiles viven en subfolder profiles/ — coherente con el contrato
      // declarado en index.json (profile_file: "profiles/...json")
      const profilesDir =
        path.join(
          OUTPUT,
          'profiles'
        );

      if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(
          profilesDir,
          { recursive: true }
        );
      }

      const out =
        path.join(
          profilesDir,
          profileFile
        );

      // =================================
      // FINAL MODE ONLY
      // =================================

      if (mode === 'final') {

        fs.writeFileSync(

          out,

          JSON.stringify(
            output,
            null,
            2
          )

        );

        console.log(
          `✅ OK → ${out}`
        );

        // ===============================
        // USER INDEX ENTRY
        // ===============================

        userIndex =
          userIndex.filter(
            user => user.user_id !== user_id
          );

        userIndex.push({

          user_id,

          display_name,

          safe_name:
            safe.toLowerCase(),

          profile_file:
            `profiles/${profileFile}`,

          source_file:
            file

        });

        const locked =
          path.join(
            INPUT_LOCK,
            file
          );

        try {

          fs.renameSync(
            full,
            locked
          );

          console.log(
            '🔒 Movido a lock'
          );

        } catch {

          console.log(
            '⚠️ Archivo abierto. No se movió a lock'
          );

        }

      }

    } catch (err) {

      console.error(
        `❌ ERROR:\n${err.message}`
      );

    }

  });

  
  // =================================
  // WRITE USER INDEX
  // =================================

  if (mode === 'final') {

    fs.writeFileSync(

      indexPath,

      JSON.stringify(
        userIndex,
        null,
        2
      )

    );

    console.log(
      `\n🗂️ User index generado → ${indexPath}`
    );

  }

  if (mode === 'validate') {

    console.log(
      '\n✅ VALIDACIÓN COMPLETADA'
    );

  }

}

main();