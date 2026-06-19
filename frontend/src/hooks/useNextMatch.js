/**
 * hooks/useNextMatch.js
 *
 * Determina el PRÓXIMO partido de grupos pendiente por FECHA/HORA real
 * (match_date + kickoff_utc de matches_metadata), NO por match_id —
 * porque match_id ≠ orden cronológico (misma lección que standings).
 *
 * Fuente de verdad de "pendiente": group_results con status !== 'final'.
 * Devuelve también isLastGroupMatch para bloquear el caso borde del cierre de
 * fase (que activaría el scoring de standings y rompería la equivalencia del delta).
 */
import { useState, useEffect } from 'react'
import { loadGroupResults, loadMatchesMetadata } from '@/data/loaders'

const MONTHS = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4,
  jun: 5, jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11,
}

function metaArray(meta) {
  if (Array.isArray(meta)) return meta
  if (Array.isArray(meta?.matches)) return meta.matches
  return Object.values(meta ?? {})
}

// "18-Jun" + "19:00" → epoch ms (año 2026). Devuelve Infinity si no parsea
// (un partido sin fecha nunca debe colarse como "el próximo").
function kickoffTs(md) {
  if (!md) return Infinity
  const [d, mon] = String(md.match_date ?? '').split('-')
  const month = MONTHS[String(mon ?? '').trim().toLowerCase().slice(0, 3)]
  const day = parseInt(d, 10)
  if (month == null || Number.isNaN(day)) return Infinity
  const [hh, mm] = String(md.kickoff_utc ?? '00:00').split(':')
  return new Date(2026, month, day, parseInt(hh, 10) || 0, parseInt(mm, 10) || 0).getTime()
}

export function useNextMatch() {
  const [state, setState] = useState({ nextMatch: null, isLastGroupMatch: false, loading: true })

  useEffect(() => {
    let alive = true
    Promise.all([loadGroupResults(), loadMatchesMetadata()])
      .then(([results, meta]) => {
        if (!alive) return
        const metaMap = {}
        for (const m of metaArray(meta)) metaMap[m.match_id] = m

        const pending = (results ?? [])
          .filter(r => r.status !== 'final')
          .sort((a, b) => kickoffTs(metaMap[a.match_id]) - kickoffTs(metaMap[b.match_id]))

        if (pending.length === 0) {
          setState({ nextMatch: null, isLastGroupMatch: false, loading: false })
          return
        }

        const r = pending[0]
        const md = metaMap[r.match_id] ?? {}
        setState({
          nextMatch: {
            match_id: r.match_id,
            home_team: r.home_team,
            away_team: r.away_team,
            dateLabel: md.match_date ?? null,
            kickoffLabel: md.kickoff_utc ?? null,
          },
          isLastGroupMatch: pending.length === 1,
          loading: false,
        })
      })
      .catch(() => { if (alive) setState({ nextMatch: null, isLastGroupMatch: false, loading: false }) })
    return () => { alive = false }
  }, [])

  return state
}
