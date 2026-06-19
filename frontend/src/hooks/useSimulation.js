/**
 * hooks/useSimulation.js
 *
 * Orquesta la simulación temporal del Leaderboard (100% en memoria).
 * - La orquestación (estado, próximo partido, proyección) es stage-agnostic:
 *   a futuro, knockout solo reemplaza la "estrategia de delta" (projectLeaderboard).
 * - consenso_partidos: barra de % del campo (contexto), carga al saber el partido.
 * - consenso_votantes: fuente del delta; LAZY — solo al primer click en una opción.
 *
 * Nunca escribe nada ni toca leaderboard/resultados/snapshots oficiales.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { loadConsensoPartidos, loadConsensoVotantes } from '@/data/loaders'
import { useNextMatch } from './useNextMatch'
import { projectLeaderboard } from '@/scoring/groupRule'

export function useSimulation(officialLb) {
  const { nextMatch, isLastGroupMatch, loading: matchLoading } = useNextMatch()
  const [consensus, setConsensus] = useState(null)
  const [votersAll, setVotersAll] = useState(null)
  const [outcome, setOutcomeState] = useState(null)
  const [fetching, setFetching] = useState(false)

  // Consenso del campo (porcentajes) para el partido objetivo — contexto en la tarjeta.
  useEffect(() => {
    if (!nextMatch) return
    let alive = true
    loadConsensoPartidos()
      .then(c => {
        if (!alive) return
        const entry = (c?.matches ?? []).find(m => m.match_id === nextMatch.match_id)
        setConsensus(entry?.distribution ?? null)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [nextMatch])

  // Lazy-fetch del archivo pesado de votantes; cachea un mapa match_id → voters.
  const ensureVoters = useCallback(async () => {
    if (votersAll) return votersAll
    setFetching(true)
    try {
      const c = await loadConsensoVotantes()
      const map = {}
      for (const m of (c?.matches ?? [])) map[m.match_id] = m.voters
      setVotersAll(map)
      return map
    } finally {
      setFetching(false)
    }
  }, [votersAll])

  const setOutcome = useCallback(async (o) => {
    if (isLastGroupMatch) return            // guard: cierre de fase activaría standings
    if (o == null) { setOutcomeState(null); return }
    await ensureVoters()
    setOutcomeState(o)
  }, [ensureVoters, isLastGroupMatch])

  const reset = useCallback(() => setOutcomeState(null), [])

  const { projected, deltas } = useMemo(() => {
    if (!outcome || !votersAll || !nextMatch || !officialLb) {
      return { projected: null, deltas: null }
    }
    const voters = votersAll[nextMatch.match_id]
    if (!voters) return { projected: null, deltas: null }
    return projectLeaderboard(officialLb, voters, outcome)
  }, [outcome, votersAll, nextMatch, officialLb])

  return {
    nextMatch,
    isLastGroupMatch,
    matchLoading,
    consensus,
    outcome,
    setOutcome,
    reset,
    fetching,
    active: !!projected,
    projected,
    deltas,
  }
}
