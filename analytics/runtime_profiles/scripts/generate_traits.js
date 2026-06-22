const fs = require('fs');
const path = require('path');


// ======================================
// HELPERS
// ======================================

const {
  getAdvanceAccuracy
} = require('./helpers/getAdvanceAccuracy');

const {
  getVolatilityScore
} = require('./helpers/getVolatilityScore');

const {
  getRankingMomentum
} = require('./helpers/getRankingMomentum');

const {
  getPhaseStrength
} = require('./helpers/getPhaseStrength');

const {
  assignTraits
} = require('./helpers/assignTraits');


// ======================================
// PATHS
// ======================================

const BASE_DIR =
  path.resolve(__dirname, '../../..');

const SCORE_DETAILS_PATH =
  path.join(
    BASE_DIR,
    'output',
    'scores',
    'score_details.json'
  );

const SNAPSHOTS_DIR =
  path.join(
    BASE_DIR,
    'output',
    'scores',
    'snapshots'
  );

const OUTPUT_PATH =
  path.join(
    BASE_DIR,
    'analytics',
    'runtime_profiles',
    'outputs',
    'traits.json'
  );


// ======================================
// GROUP SPECIALIST — CORTE RELATIVO
// ======================================
// "Amo de Grupos" no es un umbral fijo: es el top 35% del campo en acierto de
// grupos (se auto-calibra cada corrida). Mismo cálculo de acierto que getPhaseStrength.

const GROUP_SPECIALIST_TOP = 0.35;

function groupAccuracyOf(details) {
  const g = details?.group || [];
  if (!g.length) return 0;
  const ok = g.filter(m => m?.breakdown?.correct === true).length;
  return ok / g.length;
}

function computeGroupCutoff(users, topFraction) {
  const accs = users
    .map(u => groupAccuracyOf(u))
    .sort((a, b) => b - a);
  if (!accs.length) return 0.25;
  const idx = Math.min(accs.length - 1, Math.floor(accs.length * topFraction));
  return accs[idx];
}


// ======================================
// LOAD JSON
// ======================================

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


// ======================================
// LOAD SNAPSHOTS
// ======================================

function loadSnapshots() {

  const files =
    fs.readdirSync(SNAPSHOTS_DIR)
      .filter(file =>
        file.endsWith('.json')
      );

  return files
    .map(file => {

      return loadJSON(
        path.join(SNAPSHOTS_DIR, file)
      );

    })
    .sort(
      (a, b) =>
        a.snapshot_match_id -
        b.snapshot_match_id
    );

}


// ======================================
// BUILD USER TRAITS
// ======================================

function buildUserTraits({

  user,
  userDetails,
  snapshots,
  totalUsers,
  groupCutoff

}) {

  // ======================================
  // METRICS
  // ======================================

  const advanceMetrics =
    getAdvanceAccuracy(
      userDetails || {}
    );

  const volatilityMetrics =
    getVolatilityScore({

      userId:
        user.user_id,

      snapshots,
      totalUsers

    });

  const momentumMetrics =
    getRankingMomentum({

      userId:
        user.user_id,

      snapshots

    });

  const phaseStrength =
    getPhaseStrength(
      userDetails || {},
      groupCutoff
    );

  // ======================================
  // ASSIGN TRAITS
  // ======================================

  const traits =
    assignTraits({

      advanceMetrics,
      volatilityMetrics,
      momentumMetrics,
      phaseStrength,
      totalUsers

    });

  // ======================================
  // RETURN
  // ======================================

  return {

    user_id:
      user.user_id,

    display_name:
      user.display_name,

    traits,

    metrics: {

      advance_accuracy:
        advanceMetrics,

      volatility:
        volatilityMetrics,

      momentum:
        momentumMetrics,

      phase_strength:
        phaseStrength

    }

  };

}


// ======================================
// MAIN
// ======================================

function main() {

  console.log(
    '🚀 analytics/runtime_profiles/generate_traits.js'
  );

  // ======================================
  // LOAD
  // ======================================

  const scoreDetails =
    loadJSON(SCORE_DETAILS_PATH);

  const users =
    scoreDetails;

  const snapshots =
    loadSnapshots();

  // Corte relativo de "Amo de Grupos": top 35% del campo en acierto de grupos.
  const groupCutoff =
    computeGroupCutoff(users, GROUP_SPECIALIST_TOP);

  console.log(
    `   Amo de Grupos: corte top ${Math.round(GROUP_SPECIALIST_TOP * 100)}% → acierto >= ${Math.round(groupCutoff * 100)}%`
  );

  // ======================================
  // BUILD
  // ======================================

  const output = users.map(user => {

    // ======================================
    // USER DETAILS
    // ======================================

    const userDetails =
      scoreDetails.find(
        detail =>

          detail.user_id ===
          user.user_id

      );

    // ======================================
    // BUILD USER TRAITS
    // ======================================

    return buildUserTraits({

      user,
      userDetails,
      snapshots,

      totalUsers:
        users.length,

      groupCutoff

    });

  });

  // ======================================
  // SAVE
  // ======================================

  fs.writeFileSync(

    OUTPUT_PATH,

    JSON.stringify(
      output,
      null,
      2
    )

  );

  console.log(
    '✅ traits.json generado'
  );

}


// ======================================
// RUN
// ======================================

main();