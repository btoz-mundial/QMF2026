const path = require('path');

const {
  loadUsers
} = require('../helpers/loadUsers');

const {
  saveOutput
} = require('../../helpers/saveOutput');


// =====================================
// LOAD
// =====================================

const users = loadUsers();

// =====================================
// MATCHES MAP
// =====================================

const matchesMap = {};
const votersMap = {};

// =====================================
// BUILD CONSENSUS
// =====================================

users.forEach(user => {

  // GROUP STAGE
  (user.group_stage || [])
    .forEach(match => {

      if (!matchesMap[match.match_id]) {

        matchesMap[match.match_id] = {
          match_id: match.match_id,
          total_picks: 0,
          distribution: { L: 0, E: 0, V: 0 }
        };
      }
      
      if (!votersMap[match.match_id]) {
        votersMap[match.match_id] = {
        match_id: match.match_id,
        voters: {
          L: [],
          E: [],
          V: []
         }
       };
      }
      const result = match.prediction;
      matchesMap[match.match_id].total_picks += 1;
      matchesMap[match.match_id].distribution[result] += 1;
      votersMap[match.match_id].voters[result].push(
        user.user_id
        );

    });

  // KNOCKOUT STAGE
  (user.knockout || [])
    .forEach(match => {

      if (match.home_goals === null || match.away_goals === null) return;

      if (!matchesMap[match.match_id]) {
        matchesMap[match.match_id] = {
          match_id: match.match_id,
          total_picks: 0,
          distribution: { L: 0, E: 0, V: 0 }
        };
      }
      if (!votersMap[match.match_id]) {
        votersMap[match.match_id] = {
          match_id: match.match_id,
          voters: {
              L: [],
              E: [],
              V: []
            }
          };
        }
      let result = null;
      if (match.home_goals > match.away_goals)       result = 'L';
      else if (match.home_goals < match.away_goals)  result = 'V';
      else                                            result = 'E';

      matchesMap[match.match_id].total_picks += 1;
      matchesMap[match.match_id].distribution[result] += 1;
      if (!['L','E','V'].includes(result)) return;
      votersMap[match.match_id].voters[result].push(
        user.user_id
      );

    });

});


// =====================================
// BUILD OUTPUT
// =====================================

const matches = Object.values(matchesMap)
  .map(match => {

    const total = match.total_picks;

    const pct = (n) => total > 0 ? Number((n / total * 100).toFixed(2)) : 0;

    const percentages = {
      L: pct(match.distribution.L),
      E: pct(match.distribution.E),
      V: pct(match.distribution.V),
    };

    // Consensus pick (highest %)
    let consensusPick = 'L';
    let highest = percentages.L;
    if (percentages.E > highest) { highest = percentages.E; consensusPick = 'E'; }
    if (percentages.V > highest) { highest = percentages.V; consensusPick = 'V'; }

    // Least common pick (lowest %)
    let leastCommonPick = 'L';
    let lowest = percentages.L;
    if (percentages.E < lowest) { lowest = percentages.E; leastCommonPick = 'E'; }
    if (percentages.V < lowest) { lowest = percentages.V; leastCommonPick = 'V'; }

    return {
      match_id:       match.match_id,
      total_picks:    total,
      distribution: {
        L: { count: match.distribution.L, percentage: percentages.L },
        E: { count: match.distribution.E, percentage: percentages.E },
        V: { count: match.distribution.V, percentage: percentages.V },
      },
      consensus_pick:          consensusPick,
      least_common_pick:       leastCommonPick,
      consensus_strength:      highest,
      divisiveness:            100 - highest,
      unique_pick_count: {
        L: match.distribution.L === 1 ? 1 : 0,
        E: match.distribution.E === 1 ? 1 : 0,
        V: match.distribution.V === 1 ? 1 : 0,
      },
      rare_pick_threshold:       10,
      ultra_rare_pick_threshold: 5,
    };

  })
  .sort((a, b) => a.match_id - b.match_id);

  const voterMatches = Object.values(votersMap)
  .sort((a, b) => a.match_id - b.match_id);

  const votersOutput = {
  generated_at: new Date().toISOString(),
  metric: 'consenso_votantes',
  matches: voterMatches,
};
// =====================================
// SAVE
// =====================================

const output = {
  generated_at: new Date().toISOString(),
  metric: 'consenso_partidos',
  matches,
};

const outputPath = path.join(__dirname, '..', 'outputs', 'consenso_partidos.json');
const votersOutputPath = path.join( __dirname, '..', 'outputs', 'consenso_votantes.json');

saveOutput(outputPath, output);
saveOutput(votersOutputPath, votersOutput);

console.log('✅ consenso_partidos.json generado —', matches.length, 'partidos');
