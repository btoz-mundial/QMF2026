/**
 * scoring/knockoutRule.js
 *
 * Estrategia de delta para la simulación de ELIMINATORIAS (Fase 2).
 * Espejo exacto de la regla oficial de un partido de knockout
 * (scoring/knockout_stage_score.js): máx 5 pts por partido —
 *   equipo local +1, visitante +1, goles local +1, goles visitante +1, marcador exacto +1.
 * `advance_team` da 0 puntos directos (se conserva en los datos, no en el cálculo).
 *
 * Igual que groupRule: simula UN partido (no propaga, no toca bonos 103/104).
 * Reusa `rerank` para no duplicar el tie-break oficial.
 *
 * NOTA: a diferencia de grupos, no hay todavía partidos de knockout finalizados,
 * así que la equivalencia "delta == motor oficial" sobre snapshot real queda
 * pendiente del primer resultado de eliminatorias. Estos unit tests validan la
 * regla de 5 pts contra la especificación.
 */
import { rerank } from './groupRule.js'

/**
 * Puntos de un partido de knockout para una predicción vs el resultado.
 * @param pred  predicción del usuario: { home_team, away_team, home_goals, away_goals }
 * @param real  resultado: { home_team, away_team (REALES), home_goals, away_goals (simulados) }
 * @returns { points (0..5), breakdown }
 */
export function scoreKnockoutMatch(pred, real) {
  if (!pred || !real) {
    return { points: 0, breakdown: { home_team: false, away_team: false, home_goals: false, away_goals: false, exact_goals: false } }
  }
  const homeTeam  = pred.home_team  != null && pred.home_team  === real.home_team
  const awayTeam  = pred.away_team  != null && pred.away_team  === real.away_team
  const homeGoals = pred.home_goals != null && pred.home_goals === real.home_goals
  const awayGoals = pred.away_goals != null && pred.away_goals === real.away_goals
  const exact     = homeGoals && awayGoals
  const points =
    (homeTeam ? 1 : 0) +
    (awayTeam ? 1 : 0) +
    (homeGoals ? 1 : 0) +
    (awayGoals ? 1 : 0) +
    (exact ? 1 : 0)
  return { points, breakdown: { home_team: homeTeam, away_team: awayTeam, home_goals: homeGoals, away_goals: awayGoals, exact_goals: exact } }
}

/**
 * Proyecta el leaderboard oficial aplicando un único resultado hipotético de un
 * partido de knockout. Mismo contrato que projectLeaderboard (grupos):
 * devuelve { projected, deltas: user_id → { ptsGain, rankDelta } }.
 *
 * @param officialLb  leaderboard oficial (rank, total_points, breakdown)
 * @param picks       predicciones crudas del partido: [{ user_id, home_team, away_team, home_goals, away_goals, advance_team }]
 * @param realTeams   equipos REALES del cruce: { home_team, away_team } (null si TBD)
 * @param input       marcador simulado: { home_goals, away_goals }
 */
export function projectKnockout(officialLb, picks, realTeams, input) {
  const real = {
    home_team: realTeams?.home_team ?? null,
    away_team: realTeams?.away_team ?? null,
    home_goals: input?.home_goals ?? null,
    away_goals: input?.away_goals ?? null,
  }

  const gainByUser = {}
  for (const p of (picks ?? [])) {
    gainByUser[p.user_id] = scoreKnockoutMatch(p, real).points
  }

  const projected = officialLb.map(u => {
    const gain = gainByUser[u.user_id] ?? 0
    return {
      ...u,
      total_points: (u.total_points ?? 0) + gain,
      breakdown: { ...(u.breakdown ?? {}), knockout: (u.breakdown?.knockout ?? 0) + gain },
      _gain: gain,
      _officialRank: u.rank,
    }
  })

  projected.sort((a, b) => b.total_points - a.total_points)
  rerank(projected)

  const deltas = {}
  for (const u of projected) {
    deltas[u.user_id] = { ptsGain: u._gain, rankDelta: (u._officialRank ?? u.rank) - u.rank }
    delete u._gain
    delete u._officialRank
  }

  return { projected, deltas }
}
