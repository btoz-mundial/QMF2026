/**
 * hooks/useKnockoutSimulation.js
 *
 * Simulación temporal del Leaderboard para ELIMINATORIAS (Fase 2), 100% en memoria.
 * Espejo del contrato de useSimulation (grupos), pero la "estrategia de delta" es
 * projectKnockout: el usuario elige un MARCADOR hipotético del próximo cruce y se
 * aplica la regla oficial de 5 pts (knockoutRule) sobre las predicciones crudas de
 * cada participante.
 *
 * Fuente de datos: simulacion_knockout.json (builder analytics/engagement) — trae,
 * para los próximos N partidos pendientes, los equipos REALES del cruce + los picks
 * crudos por usuario. matches[0] es el próximo (ya viene ordenado cronológicamente).
 *
 * Nunca escribe nada ni toca leaderboard/resultados/snapshots oficiales.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { loadSimulacionKnockout } from '@/data/loaders'
import { projectKnockout } from '@/scoring/knockoutRule'
import { trackClarityEvent } from '@/utils/clarity'

export function useKnockoutSimulation(officialLb) {
  const [match, setMatch] = useState(null)   // { match_id, stage, home_team, away_team, match_date, kickoff_utc, picks }
  const [loading, setLoading] = useState(true)
  const [score, setScoreState] = useState(null)  // { home_goals, away_goals } | null

  // Carga el próximo cruce pendiente + sus picks. matches[0] = próximo (ordenado en el builder).
  useEffect(() => {
    let alive = true
    loadSimulacionKnockout()
      .then(d => {
        if (!alive) return
        const next = (d?.matches ?? [])[0] ?? null
        setMatch(next)
        setLoading(false)
      })
      .catch(() => { if (alive) { setMatch(null); setLoading(false) } })
    return () => { alive = false }
  }, [])

  const setScore = useCallback((s) => {
    if (s == null) { setScoreState(null); return }
    const next = {
      home_goals: Math.max(0, s.home_goals ?? 0),
      away_goals: Math.max(0, s.away_goals ?? 0),
    }
    setScoreState(next)
    trackClarityEvent('simular_knockout', {
      sim_marcador: `${next.home_goals}-${next.away_goals}`,
      sim_partido: match ? `${match.home_team} vs ${match.away_team}` : undefined,
    })
  }, [match])

  const reset = useCallback(() => setScoreState(null), [])

  const { projected, deltas } = useMemo(() => {
    if (!score || !match || !officialLb) return { projected: null, deltas: null }
    // Bono oficial: match 104 (campeón) +15, match 103 (tercer lugar) +5, resto 0.
    const bonusPoints = match.match_id === 104 ? 15 : match.match_id === 103 ? 5 : 0
    return projectKnockout(
      officialLb,
      match.picks ?? [],
      { home_team: match.home_team, away_team: match.away_team },
      score,
      bonusPoints,
    )
  }, [score, match, officialLb])

  // nextMatch: forma compatible con SimulationCard (dateLabel/kickoffLabel).
  const nextMatch = useMemo(() => {
    if (!match) return null
    return {
      match_id: match.match_id,
      stage: match.stage,
      home_team: match.home_team,
      away_team: match.away_team,
      dateLabel: match.match_date ?? null,
      kickoffLabel: match.kickoff_utc ?? null,
    }
  }, [match])

  return {
    nextMatch,
    matchLoading: loading,
    score,
    setScore,
    reset,
    fetching: false,
    active: !!projected,
    projected,
    deltas,
  }
}
