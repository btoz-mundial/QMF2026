/**
 * sync_to_public.js
 *
 * Copia los archivos generados hacia frontend/public/data/
 * Correr antes de build o deploy: node scripts/sync_to_public.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT        = path.resolve(__dirname, '..')
const PUBLIC      = path.join(ROOT, 'frontend', 'public', 'data')
const PUBLIC_ROOT = path.join(ROOT, 'frontend', 'public')

const COPIES = [
  { from: 'output/scores/tournament_status.json', to: 'scores/tournament_status.json' },
  { from: 'output/scores/leaderboard.json',       to: 'scores/leaderboard.json' },
  { from: 'output/scores/score_details.json', to: 'scores/score_details.json' },
  { from: 'output/scores/snapshots', to: 'scores/snapshots', dir: true },
  { from: 'output/users', to: 'users', dir: true },
  { from: 'data/results/group_results.json',     to: 'results/group_results.json' },
  { from: 'data/results/knockout_results.json',  to: 'results/knockout_results.json' },
  { from: 'data/results/standings_results.json', to: 'results/standings_results.json' },
  { from: 'data/teams/teams.json', to: 'teams/teams.json' },
  { from: 'data/metadata/matches_metadata.json',   to: 'metadata/matches_metadata.json' },
  { from: 'data/metadata/standings_metadata.json', to: 'metadata/standings_metadata.json' },
  { from: 'data/metadata/bracket_graph.json',      to: 'metadata/bracket_graph.json' },
  { from: 'data/metadata/r32_render_order.json',   to: 'metadata/r32_render_order.json' },
  { from: 'analytics/outputs/user_metrics.json', to: 'analytics/user_metrics.json' },
  { from: 'analytics/core/outputs',        to: 'analytics/core',        dir: true },
  { from: 'analytics/timeline/outputs',    to: 'analytics/timeline',    dir: true },
  { from: 'analytics/engagement/outputs',  to: 'analytics/engagement',  dir: true },
  { from: 'analytics/intelligence/outputs',to: 'analytics/intelligence',dir: true },
  { from: 'contracts/analytics/metric_registry_v2.json', to: 'analytics/metric_registry_v2.json' },
  { from: 'contracts/analytics/analytics_presentation_v2.json', to: 'analytics/analytics_presentation_v2.json' },
  { from: 'contracts/analytics/runtime_profiles/archetype_registry_v1.json', to: 'analytics/archetype_registry_v1.json' },
  { from: 'analytics/runtime_profiles/outputs', to: 'analytics/runtime_profiles', dir: true },
  { from: 'payout/outputs/payouts.json', to: 'payout/payouts.json' },
]

// Assets estáticos: se copian a frontend/public/assets/ (no a /data/)
const ASSET_COPIES = [
  { from: 'assets/hall_of_fame', to: 'assets/hall_of_fame', dir: true },
]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn('  WARN  No existe: ' + srcDir)
    return
  }
  ensureDir(destDir)
  const entries = fs.readdirSync(srcDir)
  for (const entry of entries) {
    const srcPath  = path.join(srcDir, entry)
    const destPath = path.join(destDir, entry)
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

console.log('\nSync output -> frontend/public/data\n')

for (const item of COPIES) {
  const src  = path.join(ROOT, item.from)
  const dest = path.join(PUBLIC, item.to)
  try {
    if (item.dir) {
      copyDir(src, dest)
      console.log('  [dir]  ' + item.from + '  ->  data/' + item.to)
    } else {
      copyFile(src, dest)
      console.log('         ' + item.from + '  ->  data/' + item.to)
    }
  } catch (err) {
    console.error('  ERROR copiando ' + item.from + ': ' + err.message)
  }
}

console.log('\nSync assets -> frontend/public/assets\n')

for (const item of ASSET_COPIES) {
  const src  = path.join(ROOT, item.from)
  const dest = path.join(PUBLIC_ROOT, item.to)
  try {
    if (item.dir) {
      copyDir(src, dest)
      console.log('  [dir]  ' + item.from + '  ->  ' + item.to)
    } else {
      copyFile(src, dest)
      console.log('         ' + item.from + '  ->  ' + item.to)
    }
  } catch (err) {
    console.error('  ERROR copiando ' + item.from + ': ' + err.message)
  }
}

console.log('\nSync completo\n')
