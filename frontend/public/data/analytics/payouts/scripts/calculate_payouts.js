const fs = require('fs');
const path = require('path');


// =====================================
// PATHS
// =====================================

const BASE_DIR = path.resolve(__dirname, '..', '..');

const LEADERBOARD_PATH = path.join(
  BASE_DIR,
  'output',
  'scores',
  'leaderboard.json'
);

const OUTPUT_DIR = path.join(
  BASE_DIR,
  'analytics',
  'output'
);

const OUTPUT_PATH = path.join(
  OUTPUT_DIR,
  'calculated_payouts.json'
);


// =====================================
// PRIZE STRUCTURE
// =====================================

// ejemplo:
// 40 jugadores
// top 8 cobran

const PRIZES = {

  1: 4500,
  2: 3000,
  3: 2500,
  4: 2000,
  5: 1500,
  6: 1000

};


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


// =====================================
// GROUP USERS BY RANK
// =====================================

function groupByRank(leaderboard) {

  const grouped = {};

  leaderboard.forEach(user => {

    if (!grouped[user.rank]) {

      grouped[user.rank] = [];

    }

    grouped[user.rank].push(user);

  });

  return grouped;

}


// =====================================
// GET TIED POSITIONS
// =====================================

function getCoveredPositions(
  startRank,
  tieCount
) {

  const positions = [];

  for (
    let i = 0;
    i < tieCount;
    i++
  ) {

    positions.push(startRank + i);

  }

  return positions;

}


// =====================================
// CALCULATE PAYOUTS
// =====================================

function calculatePayouts(
  leaderboard
) {

  const grouped =
    groupByRank(leaderboard);

  const payouts = [];

  Object.entries(grouped).forEach(
    ([rankStr, users]) => {

      const rank =
        Number(rankStr);

      const tieCount =
        users.length;

      // =====================================
      // POSITIONS COVERED
      // =====================================

      const coveredPositions =
        getCoveredPositions(
          rank,
          tieCount
        );

      // =====================================
      // TOTAL PRIZE POOL
      // =====================================

      let totalPrize = 0;

      coveredPositions.forEach(position => {

        totalPrize +=
          PRIZES[position] || 0;

      });

      // =====================================
      // INDIVIDUAL PAYOUT
      // =====================================

      const individualPrize =
        totalPrize / tieCount;

      // =====================================
      // USERS
      // =====================================

      users.forEach(user => {

        payouts.push({

          rank: user.rank,

          display_name:
            user.display_name,

          total_points:
            user.total_points,

          tied_with:
            tieCount,

          covered_positions:
            coveredPositions,

          total_prize_pool:
            totalPrize,

          payout:
            individualPrize

        });

      });

    }
  );

  // =====================================
  // SORT
  // =====================================

  payouts.sort(
    (a, b) =>
      a.rank - b.rank
  );

  return payouts;

}


// =====================================
// MAIN
// =====================================

function main() {

  console.log(
    '💰 Calculando payouts...\n'
  );

  ensureOutputDir();

  // =====================================
  // LOAD LEADERBOARD
  // =====================================

  const leaderboard =
    loadJSON(
      LEADERBOARD_PATH
    );

  // =====================================
  // CALCULATE
  // =====================================

  const payouts =
    calculatePayouts(
      leaderboard
    );

  // =====================================
  // SAVE
  // =====================================

  fs.writeFileSync(

    OUTPUT_PATH,

    JSON.stringify(
      payouts,
      null,
      2
    )

  );

  console.log(
    `✅ Payouts generados → ${OUTPUT_PATH}`
  );

}


// =====================================
// RUN
// =====================================

main();