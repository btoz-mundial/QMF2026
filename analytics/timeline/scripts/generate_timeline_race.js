const fs = require('fs');
const path = require('path');


// =====================================
// PATHS
// =====================================

const BASE_DIR = path.resolve(__dirname, '../../..');

const SNAPSHOTS_DIR = path.join(
  BASE_DIR,
  'output',
  'scores',
  'snapshots'
);

const OUTPUT_DIR = path.join(
  BASE_DIR,
  'analytics',
  'timeline',
  'outputs'
);

const OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  'timeline_race.json'
);


// =====================================
// HELPERS
// =====================================

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


function ensureOutputDir() {

  if (!fs.existsSync(OUTPUT_DIR)) {

    fs.mkdirSync(
      OUTPUT_DIR,
      { recursive: true }
    );

  }

}


function loadSnapshots() {

  return fs.readdirSync(SNAPSHOTS_DIR)

    .filter(file => file.endsWith('.json'))

    .sort((a, b) => {

      const aNum = parseInt(a);
      const bNum = parseInt(b);

      return aNum - bNum;

    })

    .map(file => {

      const fullPath = path.join(
        SNAPSHOTS_DIR,
        file
      );

      return loadJSON(fullPath);

    });

}


// =====================================
// BUILD TIMELINE RACE
// =====================================

function buildTimelineRace(snapshots) {

  const timeline = [];

  // =====================================
  // PREVIOUS SNAPSHOT MAP
  // =====================================

  let previousRanks = {};

  snapshots.forEach((snapshot, index) => {

    const users = snapshot.leaderboard.map(user => {

      const previousRank =
        previousRanks[user.user_id] ?? null;

      // =====================================
      // DELTA
      // =====================================

      let rankDelta = 0;

      if (previousRank !== null) {

        rankDelta =
          previousRank - user.rank;

      }

      // =====================================
      // MOVEMENT
      // =====================================

      let movement =
        previousRank === null
        ? 'new'
        : 'same';

      if (rankDelta > 0) {
        movement = 'up';
      }

      if (rankDelta < 0) {
        movement = 'down';
      }

      // =====================================
      // SAVE CURRENT RANK
      // =====================================

      previousRanks[user.user_id] =
        user.rank;

      // =====================================
      // RETURN USER
      // =====================================

      return {

        user_id:
          user.user_id,

        display_name:
          user.display_name,

        rank:
          user.rank,

        previous_rank:
          previousRank,

        rank_delta:
          rankDelta,

        movement,

        total_points:
          user.total_points,

        is_leader:
          user.rank ===1

      };

    });

    // =====================================
    // SNAPSHOT ENTRY
    // =====================================

    timeline.push({

      snapshot_index:
        index,

      snapshot_match_id:
        snapshot.snapshot_match_id,

      stage:
        snapshot.stage,

      generated_at:
        snapshot.generated_at,

      users

    });

  });

  return {

    generated_at:
      new Date().toISOString(),

    metric:
      'timeline_race',

    snapshots:
      timeline

  };

}


// =====================================
// SAVE OUTPUT
// =====================================

function saveOutput(data) {

  fs.writeFileSync(

    OUTPUT_FILE,

    JSON.stringify(
      data,
      null,
      2
    )

  );

}


// =====================================
// MAIN
// =====================================

function main() {

  console.log(
    '📈 Generando timeline_race...\n'
  );

  ensureOutputDir();

  const snapshots =
    loadSnapshots();

  const timelineRace =
    buildTimelineRace(
      snapshots
    );

  saveOutput(
    timelineRace
  );

  console.log(
    '✅ timeline_race.json generado'
  );

}


// =====================================
// RUN
// =====================================

main();