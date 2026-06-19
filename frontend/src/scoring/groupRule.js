/**
 * scoring/groupRule.js
 *
 * Fuente ÚNICA de la regla de fase de grupos en el frontend, espejo exacto del
 * motor oficial (scoring/group_stage_score.js + el re-rank de scripts/score.js).
 *
 * Se usa SOLO para la simulación temporal en memoria del Leaderboard. No escribe
 * nada, no toca resultados ni snapshots oficiales. Verificado contra los snapshots
 * publicados (delta == motor oficial, 73/73; tie-break idéntico).
 *
 * Sin imports con alias a propósito: es lógica hoja, importable tanto por Vite
 * como por `node --test` para el test de contrato.
 */

// Resultados posibles de un partido de grupos (Local / Empate / Visitante).
export const OUTCOMES = ['L', 'E', 'V']

/**
 * Regla oficial de grupos: 1 punto si el pronóstico coincide con el resultado.
 * Idéntica a scoring/group_stage_score.js.
 */
export function scoreGroupOutcome(prediction, result) {
  return prediction === result ? 1 : 0
}

/**
 * Re-rank con el mismo tie-break que scripts/score.js:
 * mismo puntaje → mismo rank; al cambiar el puntaje, rank = index + 1.
 * Asume `list` ya ordenada de mayor a menor total_points.
 * Muta y devuelve la misma lista.
 */
export function rerank(list) {
  let currentRank = 1
  list.forEach((u, index) => {
    if (index === 0) { u.rank = currentRank; return }
    const prev = list[index - 1]
    if (u.total_points === prev.total_points) {
      u.rank = currentRank
    } else {
      currentRank = index + 1
      u.rank = currentRank
    }
  })
  return list
}

/**
 * Proyecta el leaderboard oficial aplicando un único resultado hipotético de un
 * partido de grupos. NO recalcula standings/knockout/bonus porque un solo partido
 * de grupos no los afecta (equivalencia demostrada con los snapshots oficiales).
 *
 * @param {Array}  officialLb  leaderboard.json oficial (con rank, total_points, breakdown)
 * @param {Object} voters      { L:[user_id], E:[user_id], V:[user_id] } del partido
 * @param {String} outcome     'L' | 'E' | 'V'
 * @returns {{ projected: Array, deltas: Object }}
 *   projected: nueva lista (copia) reordenada y re-rankeada
 *   deltas:    user_id → { ptsGain, rankDelta }  (rankDelta>0 = sube de posición)
 */
export function projectLeaderboard(officialLb, voters, outcome) {
  const winners = new Set(voters?.[outcome] ?? [])

  // Copia temporal: nunca mutamos el leaderboard oficial.
  const projected = officialLb.map(u => {
    const gain = winners.has(u.user_id) ? 1 : 0
    return {
      ...u,
      total_points: (u.total_points ?? 0) + gain,
      breakdown: { ...(u.breakdown ?? {}), group: (u.breakdown?.group ?? 0) + gain },
      _gain: gain,
      _officialRank: u.rank,
    }
  })

  // Mismo criterio de orden que score.js (por puntos desc). El re-rank aplica el
  // tie-break; el orden entre empatados se mantiene estable (mismo input).
  projected.sort((a, b) => b.total_points - a.total_points)
  rerank(projected)

  const deltas = {}
  for (const u of projected) {
    deltas[u.user_id] = {
      ptsGain: u._gain,
      // rankDelta > 0 ⇒ mejoró (subió) respecto al oficial.
      rankDelta: (u._officialRank ?? u.rank) - u.rank,
    }
    delete u._gain
    delete u._officialRank
  }

  return { projected, deltas }
}
