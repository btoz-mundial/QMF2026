const fs = require('fs');

const { getGroupScores, getGroupDetails } = require('./group_stage_score');
const { getKnockoutScores, getKnockoutDetails } = require('./knockout_stage_score');
const { getStandingsScores } = require('./standings_score');
const { getBonusScores } = require('./bonus_score');

const users = JSON.parse(fs.readFileSync('./data/predictions/users.json'));

//=====================================
// Obtener scores
//=====================================
const groupScores = getGroupScores();
const knockoutScores = getKnockoutScores();
const standingsScores = getStandingsScores();
const bonusScores = getBonusScores();

const groupDetails = getGroupDetails();
const knockoutDetails = getKnockoutDetails();

//=====================================
// Crear mapa user_id → name
//=====================================
const userMap = {};
users.forEach(u => {
  userMap[u.user_id] = u.name || u.user_id;
});

//=====================================
// Construir resultado final
//=====================================
const final = [];

users.forEach(u => {
  const userId = u.user_id;

  const total =
    (groupScores[userId] || 0) +
    (knockoutScores[userId] || 0) +
    (standingsScores[userId] || 0) +
    (bonusScores[userId] || 0);

  final.push({
    user_id: userId,
    name: userMap[userId],   // AGREGAR EL NOMBRE
    total: total,
    breakdown: {
      group_stage: groupScores[userId] || 0,
      knockout: knockoutScores[userId] || 0,
      standings: standingsScores[userId] || 0,
      bonus: bonusScores[userId] || 0
    },
    matches: [
      ...(groupDetails[userId] || []),
      ...(knockoutDetails[userId] || [])
    ]
  });
});

//=====================================
// MEJORAS FINALES
//=====================================

// Ordenar por puntos
final.sort((a, b) => b.total - a.total);

// Rank
final.forEach((u, idx) => {
  u.rank = idx + 1;
});

// Ordenar partidos
final.forEach(u => {
  u.matches.sort((a, b) => {
    if (a.phase === b.phase) return a.match_id - b.match_id;
    return a.phase === "group" ? -1 : 1;
  });
});

//=====================================
// Guardar JSON
//=====================================
fs.writeFileSync(
  './output/leaderboard.json',
  JSON.stringify(final, null, 2)
);

//=====================================
// OUTPUT CONSOLA (opcional)
//=====================================
console.log('--- TOTAL SCORE ---');

final.forEach(u => {
  console.log(`${u.name}: ${u.total} puntos`);
});