const fs = require('fs');
const path = require('path');

// ======================================
// CONFIG
// ======================================

const REQUIRED_FILES = [

  // Scores
  'frontend/public/data/scores/leaderboard.json',
  'frontend/public/data/scores/score_details.json',

  // Results
  'frontend/public/data/results/group_results.json',
  'frontend/public/data/results/knockout_results.json',
  'frontend/public/data/results/standings_results.json',

  // Users
  'frontend/public/data/users/index.json',

  // Metadata
  'frontend/public/data/metadata/matches_metadata.json',
  'frontend/public/data/metadata/bracket_graph.json'

];

// ======================================
// VALIDATION
// ======================================

console.log('\n🔎 Validating repository...\n');

let errors = 0;

REQUIRED_FILES.forEach(file => {

  const fullPath = path.resolve(file);

  if (!fs.existsSync(fullPath)) {

    console.error(
      `❌ Missing file: ${file}`
    );

    errors++;

    return;
  }

  console.log(
    `✅ ${file}`
  );

});

// ======================================
// RESULT
// ======================================

if (errors > 0) {

  console.error(
    `\n❌ Validation failed (${errors} errors)\n`
  );

  process.exit(1);

}

console.log(
  '\n🎉 Repository validation passed\n'
);