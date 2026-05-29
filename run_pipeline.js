const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function cleanDir(relativePath) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return;
  console.log('Limpiando ' + relativePath);
  fs.rmSync(full, { recursive: true, force: true });
  fs.mkdirSync(full, { recursive: true });
}

function run(step, command) {
  console.log('\n=================================');
  console.log(step);
  console.log('=================================\n');
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('\n' + step + ' COMPLETADO');
  } catch (err) {
    console.error('\nERROR EN ' + step);
    process.exit(1);
  }
}

console.log('\nCLEANUP INICIAL\n');

cleanDir('output/scores');
cleanDir('analytics/core/output');
cleanDir('analytics/engagement/output');
cleanDir('analytics/intelligence/output');
cleanDir('analytics/timeline/output');
cleanDir('payout/output');

run('INGEST FIXTURE MASTER', 'node scripts/ingest_fixture_master.js');
run('BUILD SCORES', 'node scripts/score.js');
run('BUILD TEMPORAL STANDINGS', 'node scripts/temporal_group_standings.js');
run('BUILD METRICS', 'node analytics/build_metrics.js');
run('BUILD PRESENTATION', 'node scripts/build_presentation.js');
run('BUILD PAYOUTS', 'node payout/scripts/calculated_payouts.js');
run('SYNC TO PUBLIC', 'node scripts/sync_to_public.js');

console.log('\n=================================');
console.log('PIPELINE COMPLETO');
console.log('=================================\n');
