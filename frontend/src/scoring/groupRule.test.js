/**
 * Test de contrato: la proyección del frontend (delta) debe reproducir EXACTAMENTE
 * el motor oficial. Usa datos publicados reales, sin nuevas dependencias.
 *
 *   node --test src/scoring/groupRule.test.js     (desde frontend/)
 *
 * Toma dos snapshots oficiales de partidos de grupo CONSECUTIVOS (cur, cur-1) —
 * elegidos dinámicamente para ser inmune a cómo avance el torneo —, aplica el
 * resultado REAL del partido `cur` vía projectLeaderboard usando consenso_votantes,
 * y verifica que total_points y rank de cada usuario coinciden con el snapshot
 * oficial posterior. Si la regla oficial cambiara, este test falla (detecta drift).
 *
 * Por qué consecutivos: snapshot(N) incluye todos los partidos finales con id<=N;
 * snapshot(N-1) los de id<=N-1. Como los snapshots solo existen para partidos
 * finalizados, exigir que cur y cur-1 estén finales garantiza un paso de UN partido.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { projectLeaderboard, scoreGroupOutcome } from './groupRule.js'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '../../public/data')
const read = p => JSON.parse(readFileSync(join(DATA, p), 'utf-8'))

// Elige el par consecutivo (prev, cur) de partidos de grupo finalizados más
// reciente (cur === prev+1, ambos final → ambos con snapshot).
function pickConsecutiveFinalPair() {
  const finals = read('results/group_results.json')
    .filter(m => m.status === 'final' && m.result)
    .map(m => m.match_id)
    .sort((a, b) => a - b)
  const set = new Set(finals)
  for (let i = finals.length - 1; i >= 1; i--) {
    if (set.has(finals[i] - 1)) return { prev: finals[i] - 1, cur: finals[i] }
  }
  return null
}

test('regla de grupos: 1 si acierta, 0 si no', () => {
  assert.equal(scoreGroupOutcome('L', 'L'), 1)
  assert.equal(scoreGroupOutcome('E', 'L'), 0)
})

test('projectLeaderboard reproduce el snapshot oficial (delta == motor)', () => {
  const pair = pickConsecutiveFinalPair()
  assert.ok(pair, 'no hay par consecutivo de partidos de grupo finalizados para validar')
  const { prev, cur } = pair

  const before = read(`scores/snapshots/${prev}_score.json`).leaderboard
  const after = read(`scores/snapshots/${cur}_score.json`).leaderboard
  const result = read('results/group_results.json').find(m => m.match_id === cur).result
  const voters = read('analytics/engagement/consenso_votantes.json')
    .matches.find(m => m.match_id === cur).voters

  const { projected } = projectLeaderboard(before, voters, result)

  const officialByUser = Object.fromEntries(after.map(u => [u.user_id, u]))
  assert.equal(projected.length, after.length)
  for (const u of projected) {
    const off = officialByUser[u.user_id]
    assert.ok(off, `usuario ${u.user_id} ausente en snapshot oficial`)
    assert.equal(u.total_points, off.total_points, `total_points de ${u.user_id} (match ${cur})`)
    assert.equal(u.rank, off.rank, `rank de ${u.user_id} (match ${cur})`)
  }
})

test('no muta el leaderboard oficial de entrada', () => {
  const pair = pickConsecutiveFinalPair()
  assert.ok(pair, 'sin par para validar')
  const before = read(`scores/snapshots/${pair.prev}_score.json`).leaderboard
  const snapshot = JSON.stringify(before)
  const voters = read('analytics/engagement/consenso_votantes.json')
    .matches.find(m => m.match_id === pair.cur).voters
  projectLeaderboard(before, voters, 'L')
  assert.equal(JSON.stringify(before), snapshot, 'projectLeaderboard mutó la entrada')
})
