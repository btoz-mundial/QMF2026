const fs = require('fs');
const path = require('path');


// =====================================
// PATHS
// =====================================

const BASE_DIR = path.resolve(__dirname, '..');

const SCORE_DETAILS_PATH = path.join(
  BASE_DIR,
  'output',
  'scores',
  'score_details.json'
);

const METRIC_DEFINITIONS_PATH = path.join(
  BASE_DIR,
  'data',
  'metrics',
  'metric_definitions.json'
);

const OUTPUT_PATH = path.join(
  BASE_DIR,
  'output',
  'metrics',
  'user_metrics.json'
);


// =====================================
// LOAD FILES
// =====================================

const scoreDetails = JSON.parse(
  fs.readFileSync(
    SCORE_DETAILS_PATH,
    'utf-8'
  )
);

const metricDefinitions = JSON.parse(
  fs.readFileSync(
    METRIC_DEFINITIONS_PATH,
    'utf-8'
  )
);


// =====================================
// LOAD PREVIOUS STATE
// =====================================

let previousMetrics = [];

if (fs.existsSync(OUTPUT_PATH)) {

  const raw =
    fs.readFileSync(
      OUTPUT_PATH,
      'utf-8'
    );

  if (raw.trim()) {
    previousMetrics = JSON.parse(raw);
  }

}


// =====================================
// HELPERS
// =====================================

function getExactScoreCount(user) {

  let total = 0;

  user.knockout.forEach(match => {

    if (
      match.breakdown &&
      match.breakdown.exact_score
    ) {
      total++;
    }

  });

  return total;

}


function assignTier(rank, totalUsers, tiers) {

  const percent =
    (rank / totalUsers) * 100;

  for (const tier of tiers) {

    if (percent <= tier.top_percent) {

      return {
        stars: tier.stars,
        name: tier.name
      };

    }

  }

  return null;

}


function getPreviousMetric(
  userId,
  metricId
) {

  return previousMetrics.find(m =>
    m.user_id === userId &&
    m.metric_id === metricId
  );

}


// =====================================
// METRIC
// =====================================

const metric = metricDefinitions.find(
  m => m.metric_id === 'precision_exact_scores'
);


// =====================================
// BUILD
// =====================================

const results = scoreDetails.map(user => {

  const value =
    getExactScoreCount(user);

  return {

    user_id: user.user_id,

    display_name:
      user.display_name,

    metric_id:
      metric.metric_id,

    metric_name:
      metric.display_name,

    value

  };

});


// =====================================
// SORT
// =====================================

results.sort(
  (a, b) => b.value - a.value
);


// =====================================
// RANK + TIERS
// =====================================

results.forEach((user, index) => {

  const rank =
    index + 1;

  const tier =
    assignTier(
      rank,
      results.length,
      metric.tiers
    );

  const previous =
    getPreviousMetric(
      user.user_id,
      metric.metric_id
    );

  user.current_rank = rank;

  user.previous_rank =
    previous?.current_rank || null;

  user.current_tier = tier;

  user.previous_tier =
    previous?.current_tier || null;

});


// =====================================
// SAVE
// =====================================

fs.writeFileSync(
  OUTPUT_PATH,
  JSON.stringify(results, null, 2)
);

console.log(
  '✅ user_metrics.json generado'
);