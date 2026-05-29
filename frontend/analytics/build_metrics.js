const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


// =====================================
// RUN ALL ANALYTICS
// =====================================

console.log('\n📊 Generando analytics...\n');

execSync('node generate_all_analytics.js', {
  stdio: 'inherit',
  cwd: __dirname,
});


// =====================================
// LOAD REGISTRY (v2)
// =====================================

const registryPath = path.join(
  __dirname, '..', 'contracts', 'analytics', 'metric_registry_v2.json'
);

const registryFile = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// v2 format: { version, metrics: [...] }
const metrics = registryFile.metrics || [];


// =====================================
// USER METRICS ACCUMULATOR
// =====================================

const userMetrics = {};


// =====================================
// PROCESS EACH METRIC
// =====================================

metrics.forEach(metricConfig => {

  // v2 uses lifecycle_status instead of enabled
  if (metricConfig.lifecycle_status !== 'active') return;

  // Category maps to folder name (core, timeline, engagement, intelligence)
  // In v2 there's no 'category' field that maps to folder — derive from source_layer or metric_id
  // The analytics scripts output to: analytics/{module}/outputs/{metric_id}.json
  // We need to find which module folder the output is in
  const possibleFolders = ['core', 'timeline', 'engagement', 'intelligence'];
  let metricPath = null;

  for (const folder of possibleFolders) {
    const candidate = path.join(
      __dirname, folder, 'outputs', `${metricConfig.metric_id}.json`
    );
    if (fs.existsSync(candidate)) {
      metricPath = candidate;
      break;
    }
  }

  if (!metricPath) {
    console.log(`⚠️  No existe output para: ${metricConfig.metric_id}`);
    return;
  }

  const metricData = JSON.parse(fs.readFileSync(metricPath, 'utf8'));
  const users = metricData.users || [];

  // Only users with a numeric value participate in ranking
  const valueUsers = users
    .filter(u => typeof u.value === 'number')
    .sort((a, b) => b.value - a.value); // default desc

  users.forEach(user => {

    if (!userMetrics[user.user_id]) {
      userMetrics[user.user_id] = {
        user_id:      user.user_id,
        display_name: user.display_name,
        metrics:      {},
      };
    }

    let ranking    = null;
    let percentile = null;
    let tier       = null;

    if (typeof user.value === 'number') {
      const position = valueUsers.findIndex(u => u.user_id === user.user_id);
      if (position >= 0) {
        ranking    = position + 1;
        percentile = valueUsers.length > 0
          ? Number(((valueUsers.length - position) / valueUsers.length * 100).toFixed(2))
          : null;
      }

      // v2 doesn't define tiers inline — skip tier logic unless extended later
    }

    userMetrics[user.user_id].metrics[metricConfig.metric_id] = {
      metric_id:  metricConfig.metric_id,
      value:      user.value ?? null,
      ranking,
      percentile,
      tier,
      extra:      user.extra || null,
    };
  });
});


// =====================================
// WRITE OUTPUT
// =====================================

const outputPath = path.join(__dirname, 'outputs', 'user_metrics.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(outputPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  users:        Object.values(userMetrics),
}, null, 2));

console.log('\n✅ user_metrics.json generado\n');
