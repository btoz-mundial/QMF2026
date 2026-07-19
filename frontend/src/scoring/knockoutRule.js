/**
 * scoring/knockoutRule.js
 *
 * Estrategia de delta para la simulación de ELIMINATORIAS (Fase 2).
 * Espejo exacto de la regla oficial de un partido de knockout
 * (scoring/knockout_stage_score.js): máx 5 pts por partido —
 *   equipo local +1, visitante +1, goles local +1, goles visitante +1, marcador exacto +1.
 * `advance_team` da 0 puntos en el cálculo del PARTIDO (se conserva en los datos).
 *
 * Igual que groupRule: simula UN partido (no propaga a rondas siguientes).
 * EXCEPCIÓN: el partido por el campeón (104) y por el tercer lugar (103) SÍ
 * otorgan el bono oficial (+15 / +5) a quien acertó el ganador — vía bonusPoints.
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
 * Ganador de un cruce a partir del marcador simulado (para el bono de campeón /
 * tercer lugar). Devuelve null si es empate (penales no se simulan) o si faltan
 * equipos/goles — en ese caso no se otorga bono.
 */
export function winnerFromScore(realTeams, input) {
  const hg = input?.home_goals, ag = input?.away_goals
  if (hg == null || ag == null || !realTeams?.home_team || !realTeams?.away_team) return null
  if (hg > ag) return realTeams.home_team
  if (ag > hg) return realTeams.away_team
  return null
}

/**
 * Proyecta el leaderboard oficial aplicando un único resultado hipotético de un
 * partido de knockout. Mismo contrato que projectLeaderboard (grupos):
 * devuelve { projected, deltas: user_id → { ptsGain, rankDelta } }.
 *
 * BONO (espejo de scoring/bonus_score.js): solo el partido por el CAMPEÓN
 * (match 104, +15) y el TERCER LUGAR (match 103, +5) otorgan un bono al usuario
 * cuyo `advance_team` coincide con el ganador simulado. Se pasa `bonusPoints`
 * (0 para cualquier otro partido). El bono va al bucket `breakdown.bonus`, los
 * puntos del partido (0..5) al bucket `breakdown.knockout`.
 *
 * @param officialLb   leaderboard oficial (rank, total_points, breakdown)
 * @param picks        predicciones crudas: [{ user_id, home_team, away_team, home_goals, away_goals, advance_team }]
 * @param realTeams    equipos REALES del cruce: { home_team, away_team } (null si TBD)
 * @param input        marcador simulado: { home_goals, away_goals }
 * @param bonusPoints  bono a otorgar a quien acertó el ganador (15 final / 5 tercer lugar / 0 resto)
 */
export function projectKnockout(officialLb, picks, realTeams, input, bonusPoints = 0) {
  const real = {
    home_team: realTeams?.home_team ?? null,
    away_team: realTeams?.away_team ?? null,
    home_goals: input?.home_goals ?? null,
    away_goals: input?.away_goals ?? null,
  }
  const winner = bonusPoints > 0 ? winnerFromScore(realTeams, input) : null

  const matchByUser = {}
  const bonusByUser = {}
  for (const p of (picks ?? [])) {
    matchByUser[p.user_id] = scoreKnockoutMatch(p, real).points
    bonusByUser[p.user_id] = (winner && p.advance_team === winner) ? bonusPoints : 0
  }

  const projected = officialLb.map(u => {
    const mp = matchByUser[u.user_id] ?? 0
    const bp = bonusByUser[u.user_id] ?? 0
    const gain = mp + bp
    return {
      ...u,
      total_points: (u.total_points ?? 0) + gain,
      breakdown: {
        ...(u.breakdown ?? {}),
        knockout: (u.breakdown?.knockout ?? 0) + mp,
        bonus: (u.breakdown?.bonus ?? 0) + bp,
      },
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
