/**
 * Unit tests de la regla de knockout (5 pts/partido) contra la especificación
 * (scoring_integrity_v1.json + knockout_stage_score.js). No requiere snapshots
 * oficiales (aún no hay partidos de knockout finalizados); valida la regla pura.
 *
 *   node --test src/scoring/knockoutRule.test.js
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreKnockoutMatch, projectKnockout } from './knockoutRule.js'

const real = { home_team: 'Mexico', away_team: 'Korea', home_goals: 2, away_goals: 1 }

test('marcador y equipos exactos → 5 pts', () => {
  const r = scoreKnockoutMatch({ home_team: 'Mexico', away_team: 'Korea', home_goals: 2, away_goals: 1 }, real)
  assert.equal(r.points, 5)
  assert.equal(r.breakdown.exact_goals, true)
})

test('equipos correctos, goles incorrectos → 2 pts', () => {
  const r = scoreKnockoutMatch({ home_team: 'Mexico', away_team: 'Korea', home_goals: 1, away_goals: 0 }, real)
  assert.equal(r.points, 2)
  assert.equal(r.breakdown.exact_goals, false)
})

test('un equipo mal, goles exactos → 4 pts (no exact bonus perdido)', () => {
  const r = scoreKnockoutMatch({ home_team: 'Brasil', away_team: 'Korea', home_goals: 2, away_goals: 1 }, real)
  // away_team(1) + home_goals(1) + away_goals(1) + exact(1) = 4; home_team(0)
  assert.equal(r.points, 4)
})

test('todo incorrecto → 0 pts', () => {
  const r = scoreKnockoutMatch({ home_team: 'Brasil', away_team: 'Japon', home_goals: 0, away_goals: 0 }, real)
  assert.equal(r.points, 0)
})

test('advance_team no aporta puntos (se ignora en el cálculo)', () => {
  const base = { home_team: 'Mexico', away_team: 'Korea', home_goals: 2, away_goals: 1 }
  const a = scoreKnockoutMatch({ ...base, advance_team: 'Mexico' }, real)
  const b = scoreKnockoutMatch({ ...base, advance_team: 'Korea' }, real)
  assert.equal(a.points, b.points)
  assert.equal(a.points, 5)
})

test('equipos reales TBD (null) → solo goles puntúan (máx 3)', () => {
  const realTBD = { home_team: null, away_team: null, home_goals: 2, away_goals: 1 }
  const r = scoreKnockoutMatch({ home_team: 'Mexico', away_team: 'Korea', home_goals: 2, away_goals: 1 }, realTBD)
  assert.equal(r.points, 3) // home_goals + away_goals + exact
})

test('projectKnockout suma el delta y re-rankea', () => {
  const lb = [
    { user_id: 'a', total_points: 10, rank: 1, breakdown: { knockout: 0 } },
    { user_id: 'b', total_points: 9,  rank: 2, breakdown: { knockout: 0 } },
    { user_id: 'c', total_points: 8,  rank: 3, breakdown: { knockout: 0 } },
  ]
  const picks = [
    { user_id: 'a', home_team: 'X', away_team: 'Y', home_goals: 0, away_goals: 0 }, // 0 pts
    { user_id: 'b', home_team: 'Mexico', away_team: 'Korea', home_goals: 2, away_goals: 1 }, // 5 pts
    { user_id: 'c', home_team: 'Mexico', away_team: 'Korea', home_goals: 1, away_goals: 0 }, // 2 pts
  ]
  const { projected, deltas } = projectKnockout(lb, picks, { home_team: 'Mexico', away_team: 'Korea' }, { home_goals: 2, away_goals: 1 })

  const byId = Object.fromEntries(projected.map(u => [u.user_id, u]))
  assert.equal(byId.b.total_points, 14) // 9 + 5
  assert.equal(byId.c.total_points, 10) // 8 + 2
  assert.equal(byId.a.total_points, 10) // 10 + 0

  // b sube a #1 (14), a y c empatan en 10 → mismo rank #2
  assert.equal(byId.b.rank, 1)
  assert.equal(byId.a.rank, 2)
  assert.equal(byId.c.rank, 2)
  assert.equal(deltas.b.ptsGain, 5)
  assert.equal(deltas.b.rankDelta, 1) // de #2 a #1
  assert.equal(deltas.a.rankDelta, -1) // de #1 a #2
})

test('no muta el leaderboard oficial de entrada', () => {
  const lb = [{ user_id: 'a', total_points: 10, rank: 1, breakdown: { knockout: 0 } }]
  const snap = JSON.stringify(lb)
  projectKnockout(lb, [{ user_id: 'a', home_team: 'Mexico', away_team: 'Korea', home_goals: 2, away_goals: 1 }], { home_team: 'Mexico', away_team: 'Korea' }, { home_goals: 2, away_goals: 1 })
  assert.equal(JSON.stringify(lb), snap)
})
