/**
 * Test de contrato: la proyección del frontend (delta) debe reproducir EXACTAMENTE
 * el motor oficial. Usa datos publicados reales, sin nuevas dependencias.
 *
 *   node --test src/scoring/groupRule.test.js     (desde frontend/)
 *
 * Toma el snapshot oficial previo a un partido, aplica el resultado REAL de ese
 * partido vía projectLeaderboard usando consenso_votantes, y verifica que el
 * total_points y el rank de cada usuario coinciden con el snapshot oficial posterior.
 * Si la regla oficial cambiara, este test falla (detecta drift).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { projectLeaderboard, scoreGroupOutcome } from './groupRule.js'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '../../public/data')
const read = p => JSON.parse(readFileSync(join(DATA, p), 'utf-8'))

test('regla de grupos: 1 si acierta, 0 si no', () => {
  assert.equal(scoreGroupOutcome('L', 'L'), 1)
  assert.equal(scoreGroupOutcome('E', 'L'), 0)
})

test('projectLeaderboard reproduce el snapshot oficial (delta == motor)', () => {
  // El 25 está pendiente, así que entre el snapshot 24 y el 26 el único partido
  // nuevo realmente scoreado es el 26.
  const before = read('scores/snapshots/24_score.json').leaderboard
  const after = read('scores/snapshots/26_score.json').leaderboard
  const result26 = read('results/group_results.json').find(m => m.match_id === 26).result
  const voters26 = read('analytics/engagement/consenso_votantes.json')
    .matches.find(m => m.match_id === 26).voters

  const { projected } = projectLeaderboard(before, voters26, result26)

  const officialByUser = Object.fromEntries(after.map(u => [u.user_id, u]))
  assert.equal(projected.length, after.length)
  for (const u of projected) {
    const off = officialByUser[u.user_id]
    assert.ok(off, `usuario ${u.user_id} ausente en snapshot oficial`)
    assert.equal(u.total_points, off.total_points, `total_points de ${u.user_id}`)
    assert.equal(u.rank, off.rank, `rank de ${u.user_id}`)
  }
})

test('no muta el leaderboard oficial de entrada', () => {
  const before = read('scores/snapshots/24_score.json').leaderboard
  const snapshot = JSON.stringify(before)
  const voters26 = read('analytics/engagement/consenso_votantes.json')
    .matches.find(m => m.match_id === 26).voters
  projectLeaderboard(before, voters26, 'L')
  assert.equal(JSON.stringify(before), snapshot, 'projectLeaderboard mutó la entrada')
})
