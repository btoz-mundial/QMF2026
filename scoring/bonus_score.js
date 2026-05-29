// ===== BONUS SCORE =====
// Se calcula desde knockout:
// 103 -> 3P (tercer lugar)
// 104 -> F (campeon)

function getBonusScores(user, results) {
  if (!user || !user.knockout || !results) return { total: 0, detail: null };

  let score = 0;

  // ===== EXTRAER PREDICCIONES DEL USUARIO =====
  const user3P = user.knockout.find(m => m.match_id === 103);
  const userF  = user.knockout.find(m => m.match_id === 104);

  // ===== EXTRAER RESULTADOS REALES =====
  const result3P = results.find(m => m.match_id === 103);
  const resultF  = results.find(m => m.match_id === 104);

  // ===== DETAIL =====
  const detail = {

    champion: {
      predicted:         userF?.advance_team || null,
      actual:            resultF?.advance_team || null,
      correct:           userF?.advance_team === resultF?.advance_team,
      points:            userF?.advance_team === resultF?.advance_team ? 15 : 0,
    },

    third_place: {
      predicted:         user3P?.advance_team || null,
      actual:            result3P?.advance_team || null,
      correct:           user3P?.advance_team === result3P?.advance_team,
      points:            user3P?.advance_team === result3P?.advance_team ? 5 : 0,
    }

  };

  // ===== SI AUN NO EXISTEN RESULTADOS =====
  if (!result3P?.advance_team || !resultF?.advance_team) {
    return { total: 0, detail };
  }

  // ===== SCORING =====
  if (userF?.advance_team === resultF.advance_team)   score += 15;
  if (user3P?.advance_team === result3P.advance_team) score += 5;

  return { total: score, detail };
}

module.exports = { getBonusScores };
