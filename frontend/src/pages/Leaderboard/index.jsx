import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Search, Medal, TrendingUp, Shield, Users, DollarSign } from 'lucide-react'
import { DATA_URLS } from '@/config/urls'
import { useSimulation } from '@/hooks/useSimulation'
import { useKnockoutSimulation } from '@/hooks/useKnockoutSimulation'
import SimulationCard from './SimulationCard'
import SimulationBanner from './SimulationBanner'
import KnockoutSimTile from './KnockoutSimTile'
import { scenarioLabel, knockoutScenarioLabel } from './simLabels'

// ── Fetch helpers ──────────────────────────────────────────────────────────────
async function fetchOptional(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

async function fetchRobust(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const text = await r.text()
    try { return JSON.parse(text) } catch { /* fallthrough */ }
    const opener = text.trimStart()[0]
    const closer = opener === '{' ? '}' : ']'
    let depth = 0, inStr = false, esc = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (esc) { esc = false; continue }
      if (c === '\\' && inStr) { esc = true; continue }
      if (c === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (c === opener) depth++
      else if (c === closer && --depth === 0) {
        try { return JSON.parse(text.slice(0, i + 1)) } catch { break }
      }
    }
    return null
  } catch { return null }
}

// ── Responsive hook ───────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ── Constants ──────────────────────────────────────────────────────────────────
const ARCH_COLORS = {
  front_runner:        '#FBBF24',
  sharpshooter:        '#38BDF8',
  clutch_hunter:       '#FB923C',
  consistency_machine: '#34D399',
}

const AVATAR_COLORS = [
  '#38BDF8','#FBBF24','#34D399','#F87171','#A78BFA','#F472B6',
  '#FB923C','#60A5FA','#E879F9','#4ADE80',
]
function avatarBg(i) { return AVATAR_COLORS[i % AVATAR_COLORS.length] }
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// Grid templates — desktop full / mobile compact
const GRID        = '32px 32px minmax(130px,1fr) 70px 64px 48px 120px 56px 56px 60px 54px minmax(80px,auto)'
const MOBILE_GRID = '32px 32px 1fr 70px'

const TH_STYLE = {
  fontSize: '0.53rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)',
  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, lineHeight: 1,
}

// Podium row visual config — #1 biggest, #2 medium, #3 smaller
const PODIUM = {
  1: { bg: 'rgba(255,184,0,0.06)',    border: 'rgba(255,184,0,0.22)',    stripe: '#FFB800', ptsColor: '#FFB800', ptsSz: '1.85rem' },
  2: { bg: 'rgba(192,192,192,0.04)', border: 'rgba(192,192,192,0.16)', stripe: '#A0A0A0', ptsColor: '#C8C8C8', ptsSz: '1.6rem'  },
  3: { bg: 'rgba(205,127,50,0.04)',  border: 'rgba(205,127,50,0.15)',  stripe: '#CD7F32', ptsColor: '#CD7F32', ptsSz: '1.4rem'  },
}

// ── Data helpers ───────────────────────────────────────────────────────────────
function computeStreak(recentSnaps, userId) {
  const history = recentSnaps
    .map(s => (s.users ?? []).find(u => u.user_id === userId))
    .filter(Boolean)
  if (history.length === 0) return null
  const last = history[history.length - 1]
  if (!last.movement || last.movement === 'new' || last.movement === 'same') return null
  let count = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].movement === last.movement) count++
    else break
  }
  return { direction: last.movement, count }
}

// Traits "negativos" que no se muestran como reconocimiento público.
const NEGATIVE_TRAITS = new Set(['falling'])

function buildEnrichment(timeline, archetypes, archRegistry, traits) {
  const snaps    = timeline?.snapshots ?? []
  const lastSnap = snaps[snaps.length - 1]
  const recentSnaps = snaps.slice(-8)

  const hasAnyMovement = (lastSnap?.users ?? []).some(
    u => u.rank_delta !== 0 || u.movement === 'up' || u.movement === 'down'
  )

  const archDisplayMap = {}
  ;(archRegistry?.archetypes ?? []).forEach(a => {
    archDisplayMap[a.id] = { label: a.display_name ?? a.id, color: ARCH_COLORS[a.id] ?? '#94A3B8' }
  })

  const archMap = {}
  ;(archetypes?.users ?? []).forEach(u => { archMap[u.user_id] = u.active_archetype })

  // Trait más distintivo (positivo) por usuario: el de MENOR población global,
  // excluyendo negativos. Se usa solo como fallback cuando no hay arquetipo.
  const traitsArr = Array.isArray(traits) ? traits : (traits?.users ?? [])
  const traitPop = {}
  traitsArr.forEach(u => (u.traits ?? []).forEach(t => { traitPop[t.id] = (traitPop[t.id] ?? 0) + 1 }))
  const traitMap = {}
  traitsArr.forEach(u => {
    const cands = (u.traits ?? []).filter(t => !NEGATIVE_TRAITS.has(t.id))
    if (!cands.length) return
    let best = cands[0]
    for (const t of cands) if ((traitPop[t.id] ?? Infinity) < (traitPop[best.id] ?? Infinity)) best = t
    traitMap[u.user_id] = { id: best.id, label: best.label }
  })

  const userEnrich = {}
  for (const u of (lastSnap?.users ?? [])) {
    userEnrich[u.user_id] = {
      lastDelta:    u.rank_delta,
      lastMovement: u.movement,
      streak:       computeStreak(recentSnaps, u.user_id),
      archetype:    archMap[u.user_id] ?? null,
      trait:        traitMap[u.user_id] ?? null,
    }
  }
  // Asegura el trait aun para usuarios fuera del último snapshot.
  for (const uid of Object.keys(traitMap)) {
    if (!userEnrich[uid]) userEnrich[uid] = { lastDelta: 0, lastMovement: 'same', streak: null, archetype: archMap[uid] ?? null }
    userEnrich[uid].trait = traitMap[uid]
  }
  return { userEnrich, hasAnyMovement, archDisplayMap }
}

// Returns map: userId → number[] (last 6 pts-gained per snapshot transition)
function buildRachaBoxes(timeline) {
  const snaps = timeline?.snapshots ?? []
  if (snaps.length < 2) return {}
  // Exclude standings snapshots — they inflate diffs with +100+ pts
  const matchOnly = snaps.filter(s => s.stage !== 'standings')
  const relevant  = matchOnly.slice(-7) // up to 7 snaps → up to 6 diffs
  const rachaMap  = {}
  for (let i = 1; i < relevant.length; i++) {
    const prevMap = {}
    for (const u of (relevant[i - 1].users ?? [])) prevMap[u.user_id] = u.total_points
    for (const u of (relevant[i].users ?? [])) {
      if (!rachaMap[u.user_id]) rachaMap[u.user_id] = []
      rachaMap[u.user_id].push(u.total_points - (prevMap[u.user_id] ?? u.total_points))
    }
  }
  return rachaMap
}

// Returns map: userId → { bonusPts }
function buildScoreMap(scoreDetails) {
  const map = {}
  for (const u of (scoreDetails ?? [])) {
    const bonusPts = (u.bonus?.champion?.points ?? 0) + (u.bonus?.third_place?.points ?? 0)
    map[u.user_id] = { bonusPts }
  }
  return map
}

// ── PreparationBanner ────────────────────────────────────────────────────────────
function PreparationBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'color-mix(in srgb, var(--color-primary) 7%, var(--color-surface))',
        border: '1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border))',
        borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.125rem',
      }}
    >
      <Shield size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.3 }}>
          Fase de Preparación
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          Todos los pronósticos están registradas. Las posiciones aparecerán cuando comiencen los partidos.
        </div>
      </div>
    </motion.div>
  )
}

// ── SummaryCards ───────────────────────────────────────────────────────────────
function SummaryCards({ lb, paidPositions, payoutsTotal, isMobile, notStarted, extraTile = null }) {
  const leader = lb[0]
  const second = lb[1]
  const gap = (leader?.total_points ?? 0) - (second?.total_points ?? 0)
  // Empate en la cima: cuántos comparten el puntaje más alto (evita coronar a uno solo por orden alfabético)
  const leaderPts   = leader?.total_points ?? 0
  const tiedLeaders = lb.filter(u => (u?.total_points ?? 0) === leaderPts).length
  const cards = [
    {
      icon:   <Trophy size={15} color={notStarted ? 'var(--color-text-3)' : '#FFB800'} />,
      label:  'Líder',
      value:  notStarted ? 'Por definir' : (tiedLeaders > 1 ? `${tiedLeaders} empatados` : (leader?.display_name ?? '—')),
      sub:    notStarted ? 'al iniciar el torneo' : `${leaderPts} pts`,
      accent: notStarted ? 'var(--color-text-2)' : '#FFB800',
    },
    {
      icon:   <TrendingUp size={15} color={notStarted ? 'var(--color-text-3)' : 'var(--color-primary)'} />,
      label:  'Ventaja del Líder',
      value:  notStarted ? '—' : (gap > 0 ? `+${gap} pts` : 'Empatados'),
      sub:    notStarted ? 'sin partidos jugados' : `sobre ${second?.display_name ?? '—'}`,
      accent: notStarted ? 'var(--color-text-2)' : 'var(--color-primary)',
    },
    {
      icon:   <Users size={15} color="var(--color-accent)" />,
      label:  'Zona de Premio',
      value:  `Top ${paidPositions}`,
      sub:    `${lb.length} participantes`,
      accent: 'var(--color-accent)',
    },
    {
      icon:   <DollarSign size={15} color="#34D399" />,
      label:  'Premio Total',
      value:  payoutsTotal > 0 ? `$${payoutsTotal.toLocaleString()} MXN` : '—',
      sub:    'pozo acumulado',
      accent: '#34D399',
    },
  ]
  // Cuando hay tile de simulación (knockout, escritorio) reemplaza la 4ª métrica.
  const shownCards = extraTile ? cards.slice(0, 3) : cards
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '0.625rem', marginBottom: '1.125rem' }}>
      {shownCards.map((c, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          style={{
            background: 'var(--color-surface)', borderRadius: 10, padding: '0.7rem 0.875rem',
            border: `1px solid color-mix(in srgb, ${c.accent} 22%, var(--color-border))`,
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {c.icon}
            <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {c.label}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', lineHeight: 1.2, color: c.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.value}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            {c.sub}
          </div>
        </motion.div>
      ))}
      {extraTile}
    </div>
  )
}

// ── RankBadge ─────────────────────────────────────────────────────────────────
function RankBadge({ rank, neutral = false, listNum }) {
  // Pre-tournament: every participant gets the same neutral badge with a plain list number
  if (neutral) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-3)', fontWeight: 600 }}>{listNum}</span>
    </div>
  )
  if (rank === 1) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#FFB800,#FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,184,0,0.4)', flexShrink: 0 }}>
      <Trophy size={14} color="#0F1520" strokeWidth={2.5} />
    </div>
  )
  if (rank === 2) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#D4D4D4,#8A8A8A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Medal size={14} color="#0F1520" strokeWidth={2.5} />
    </div>
  )
  if (rank === 3) return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#CD7F32,#8B4513)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Medal size={13} color="#0F1520" strokeWidth={2.5} />
    </div>
  )
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-2)', fontWeight: 600 }}>{rank}</span>
    </div>
  )
}

// ── RachaBoxes ───────────────────────────────────────────────────────────────────────────────
function RachaBoxes({ pts }) {
  const items = [...Array(6)].map((_, i) => (pts ? pts[i] ?? null : null))
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {items.map((v, i) => {
        if (v === null) {
          return (
            <span key={i} style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', opacity:0.3, width:18, textAlign:'center', flexShrink:0 }}>
              ·
            </span>
          )
        }
        const color = v >= 6 ? '#34D399'
          : v >= 3 ? 'var(--color-primary)'
          : v >= 1 ? '#FBBF24'
          : 'rgba(148,163,184,0.35)'
        return (
          <span key={i} title={`+${v} pts`}
            style={{ fontSize:'.8rem', fontFamily:'var(--font-mono)', fontWeight:700, color, width:18, textAlign:'center', flexShrink:0, lineHeight:1 }}>
            +{v}
          </span>
        )
      })}
    </div>
  )
}

// ── DeltaBadge ────────────────────────────────────────────────────────────────
function DeltaBadge({ delta, movement }) {
  const isUp   = movement === 'up'   || delta > 0
  const isDown = movement === 'down' || delta < 0
  if (!isUp && !isDown) return (
    <span style={{ display: 'block', textAlign: 'center', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>—</span>
  )
  return (
    <span style={{ display: 'block', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isUp ? '#34D399' : '#F87171' }}>
      {isUp ? '↑' : '↓'}{Math.abs(delta) || ''}
    </span>
  )
}

// ── ZoneDivider ───────────────────────────────────────────────────────────────
function ZoneDivider({ label, color, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.35rem 0.75rem', margin: '0.2rem 0' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,color-mix(in srgb,${color} 40%,transparent),transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.6rem', borderRadius: 12, border: `1px solid color-mix(in srgb,${color} 28%,transparent)`, background: `color-mix(in srgb,${color} 7%,transparent)` }}>
        {icon && <span style={{ fontSize: '0.58rem' }}>{icon}</span>}
        <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,color-mix(in srgb,${color} 40%,transparent))` }} />
    </div>
  )
}

// ── TableHeader ───────────────────────────────────────────────────────────────
function TableHeader({ isMobile }) {
  const grid = isMobile ? MOBILE_GRID : GRID
  return (
    <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '0 0.5rem', alignItems: 'center', padding: '0.3rem 0.75rem 0.4rem', borderBottom: '1px solid var(--color-border)' }}>
      <div /><div />
      <span style={TH_STYLE}>Jugador</span>
      <span style={{ ...TH_STYLE, textAlign: 'right' }}>Total</span>
      {!isMobile && <>
        <span style={{ ...TH_STYLE, textAlign: 'right' }}>Dif. Ant.</span>
        <span style={{ ...TH_STYLE, textAlign: 'center' }}>Pos △</span>
        <span style={{ ...TH_STYLE, textAlign: 'center' }}>Racha</span>
        <span style={{ ...TH_STYLE, textAlign: 'right' }}>Grp</span>
        <span style={{ ...TH_STYLE, textAlign: 'right' }}>Tab</span>
        <span style={{ ...TH_STYLE, textAlign: 'right' }}>KO</span>
        <span style={{ ...TH_STYLE, textAlign: 'right' }}>Bonus</span>
        <span style={TH_STYLE}>Progreso</span>
      </>}
    </div>
  )
}

// ── TableRow ──────────────────────────────────────────────────────────────────
function TableRow({ entry, index, listNum, notStarted, scoreDetail, racha, enrich, archDisplayMap, paidPositions, hasAnyMovement, prevPts, lastZonePts, onClick, isMobile, sim }) {
  const isPodium = !notStarted && entry.rank <= 3
  const isInZone = !notStarted && !isPodium && paidPositions > 0 && entry.rank <= paidPositions
  const avatarColor = avatarBg((listNum ?? index + 1) - 1)

  const archId = enrich?.archetype
  const arch   = archId ? (archDisplayMap?.[archId] ?? { label: archId, color: '#94A3B8' }) : null
  // Sin arquetipo: chip de trait (reconocimiento más discreto, no "elite")
  const trait  = !arch ? (enrich?.trait ?? null) : null

  const bonusPts = scoreDetail?.bonusPts ?? 0

  // Gap to the person ranked just above
  const difAnterior = entry.rank === 1 ? null : (prevPts != null ? prevPts - entry.total_points : null)

  // Progreso narrative
  let progresoText, progresoColor
  if (notStarted) {
    progresoText  = '✓ Registrado'
    progresoColor = 'var(--color-text-3)'
  } else if (entry.rank === 1) {
    progresoText  = '🏆 Líder'
    progresoColor = '#FFB800'
  } else if (isPodium || isInZone) {
    progresoText  = difAnterior != null ? `▲ ${difAnterior} del ant.` : '—'
    progresoColor = '#34D399'
  } else {
    const needed  = lastZonePts != null ? lastZonePts - entry.total_points + 1 : null
    progresoText  = needed != null && needed > 0 ? `▲ ${needed} p. zona` : 'cerca'
    progresoColor = 'var(--color-text-3)'
  }

  // Row visual — no podium treatment before the tournament starts
  const pod      = notStarted ? null : PODIUM[entry.rank]
  const rowBg    = pod ? pod.bg : 'transparent'
  const rowBorder = pod ? `1px solid ${pod.border}` : '1px solid transparent'
  const ptsColor = pod?.ptsColor ?? 'var(--color-text-1)'
  const ptsSz    = pod?.ptsSz   ?? '1.25rem'
  const hoverBg  = pod ? `color-mix(in srgb,${pod.stripe} 10%,transparent)` : 'var(--color-surface-2)'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025, duration: 0.2 }}
      onClick={onClick}
      style={{ display: 'grid', gridTemplateColumns: isMobile ? MOBILE_GRID : GRID, gap: '0 0.5rem', alignItems: 'center', padding: '0.45rem 0.75rem', borderRadius: 8, cursor: 'pointer', background: rowBg, border: rowBorder, transition: 'background 0.15s', position: 'relative', overflow: 'hidden' }}
      whileHover={{ background: hoverBg }}
    >
      {/* Podium left stripe */}
      {pod && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: entry.rank === 1 ? 4 : 3, borderRadius: '8px 0 0 8px', background: pod.stripe }} />
      )}

      {/* Rank badge */}
      <RankBadge rank={entry.rank} neutral={notStarted} listNum={listNum} />

      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor + '22', border: `2px solid ${avatarColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: avatarColor, letterSpacing: '0.05em' }}>
          {getInitials(entry.display_name)}
        </span>
      </div>

      {/* Name + archetype chip + mobile breakdown */}
      <div style={{ minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: pod ? (entry.rank === 1 ? '0.95rem' : '0.9rem') : '0.85rem', fontWeight: 600, color: 'var(--color-text-1)', lineHeight: 1.3 }}>
          {entry.display_name}
        </div>
        {arch && (
          <span style={{ fontSize: '0.48rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: arch.color, background: arch.color + '14', border: `1px solid ${arch.color}30`, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.07em', display: 'inline-block', marginTop: 1 }}>
            {arch.label.toUpperCase()}
          </span>
        )}
        {trait && (
          <span title="Toca para ver su perfil" style={{ fontSize: '0.46rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '1px 4px', borderRadius: 3, letterSpacing: '0.06em', display: 'inline-block', marginTop: 1, opacity: 0.9 }}>
            {trait.label.toUpperCase()}
          </span>
        )}
        {isMobile && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: 2, alignItems: 'center' }}>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>G {entry.breakdown?.group ?? 0}</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--color-text-3)' }}>·</span>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>T {entry.breakdown?.standings ?? 0}</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--color-text-3)' }}>·</span>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>KO {entry.breakdown?.knockout ?? 0}</span>
            {bonusPts > 0 && <>
              <span style={{ fontSize: '0.5rem', color: 'var(--color-text-3)' }}>·</span>
              <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#A78BFA' }}>+{bonusPts}</span>
            </>}
            {sim && (sim.ptsGain > 0 || sim.rankDelta !== 0) && (
              <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: sim.rankDelta >= 0 ? '#34D399' : '#F87171' }}>
                {sim.rankDelta > 0 ? `↑${sim.rankDelta}` : sim.rankDelta < 0 ? `↓${Math.abs(sim.rankDelta)}` : ''}{sim.ptsGain > 0 ? ' +' + sim.ptsGain : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Total pts */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.25rem' : ptsSz, lineHeight: 1, color: ptsColor }}>
          {entry.total_points}
        </div>
        {sim && sim.ptsGain > 0
          ? <div style={{ fontSize: '0.6rem', color: '#34D399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+{sim.ptsGain}</div>
          : <div style={{ fontSize: '0.52rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>pts</div>
        }
      </div>

      {/* Desktop-only columns */}
      {!isMobile && <>
        {/* Dif anterior */}
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: difAnterior != null && difAnterior > 0 ? '#F87171' : 'var(--color-text-3)' }}>
          {difAnterior != null ? `-${difAnterior}` : '—'}
        </div>

        {/* Position delta — en simulación muestra el cambio proyectado vs oficial */}
        <div>
          {sim
            ? <DeltaBadge delta={sim.rankDelta} movement={sim.rankDelta > 0 ? 'up' : sim.rankDelta < 0 ? 'down' : 'same'} />
            : hasAnyMovement
              ? <DeltaBadge delta={enrich?.lastDelta ?? 0} movement={enrich?.lastMovement ?? 'same'} />
              : <span style={{ display: 'block', textAlign: 'center', fontSize: '0.65rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>—</span>
          }
        </div>

        {/* Racha boxes */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RachaBoxes pts={racha} />
        </div>

        {/* Grupos pts */}
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
          {entry.breakdown?.group ?? 0}
        </div>

        {/* Tabla pts */}
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-accent)' }}>
          {entry.breakdown?.standings ?? 0}
        </div>

        {/* KO pts */}
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-success)' }}>
          {entry.breakdown?.knockout ?? 0}
        </div>

        {/* Bonus pts */}
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: bonusPts > 0 ? '#A78BFA' : 'var(--color-text-3)' }}>
          {bonusPts > 0 ? `+${bonusPts}` : '—'}
        </div>

        {/* Progreso narrative */}
        <div style={{ fontSize: '0.67rem', fontFamily: 'var(--font-mono)', color: progresoColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {progresoText}
        </div>
      </>}
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [simOpen, setSimOpen]   = useState(false)  // tile knockout expandido (escritorio)
  const navigate  = useNavigate()
  const isMobile  = useIsMobile(680)
  const groupSim  = useSimulation(pageData?.lb)
  const koSim     = useKnockoutSimulation(pageData?.lb)
  // Grupos tiene prioridad mientras haya partido de grupos pendiente; al cerrarse
  // la fase (groupSim.nextMatch === null) el simulador pasa a eliminatorias.
  const isKnockoutSim = !groupSim.nextMatch && !!koSim.nextMatch
  const sim       = isKnockoutSim ? koSim : groupSim

  useEffect(() => {
    async function load() {
      const [lb, timeline, archetypes, archRegistry, payouts, scoreDetails, status, traits] = await Promise.all([
        fetchOptional(DATA_URLS.leaderboard),
        fetchRobust(DATA_URLS.timelineRace),
        fetchOptional(DATA_URLS.archetypes),
        fetchRobust(DATA_URLS.archetypeRegistry),
        fetchOptional(DATA_URLS.payouts),
        fetchRobust(DATA_URLS.scoreDetails),
        fetchOptional(DATA_URLS.tournamentStatus),
        fetchOptional(DATA_URLS.traits),
      ])
      if (!lb) { setLoading(false); return }

      // Pre-tournament gate: no official matches scored yet → neutral "preparation" state.
      // Robust fallback: if status missing, treat all-zero points as not started.
      const notStarted = (status?.completed_matches ?? 0) === 0
        && (lb.every(u => (u?.total_points ?? 0) === 0))

      const { userEnrich, hasAnyMovement, archDisplayMap } = buildEnrichment(timeline, archetypes, archRegistry, traits)
      const rachaMap   = buildRachaBoxes(timeline)
      const scoreMap   = buildScoreMap(scoreDetails)

      // Nº de LUGARES de premio (no de personas): con empates, varias personas
      // comparten un mismo lugar (covered_positions), así que contar filas infla
      // el total. La verdad = el mayor lugar cubierto entre las filas que pagan.
      const paidPositions = Array.isArray(payouts)
        ? payouts.reduce((mx, p) => {
            if ((p.payout ?? 0) <= 0) return mx
            const pos = Array.isArray(p.covered_positions) && p.covered_positions.length
              ? Math.max(...p.covered_positions)
              : (p.rank ?? 0)
            return Math.max(mx, pos)
          }, 0)
        : (payouts?.paid_positions ?? 0)
      const payoutsTotal = Array.isArray(payouts)
        ? payouts.reduce((s, p) => s + (p.payout ?? 0), 0)
        : 0

      // Last snapshot label for subtitle
      const snaps = timeline?.snapshots ?? []
      const lastSnap = snaps[snaps.length - 1]
      const snapshotLabel = lastSnap?.label ?? null

      setPageData({ lb, userEnrich, hasAnyMovement, archDisplayMap, paidPositions, payoutsTotal, rachaMap, scoreMap, snapshotLabel, notStarted })
      setLoading(false)
    }
    load()
  }, [])

  if (loading)   return <LoadingState />
  if (!pageData) return <ErrorState />

  const { lb, userEnrich, hasAnyMovement, archDisplayMap, paidPositions, payoutsTotal, rachaMap, scoreMap, snapshotLabel, notStarted } = pageData

  // Simulación activa: la MISMA tabla se alimenta del leaderboard proyectado (en memoria).
  const simActive = sim.active && !!sim.projected
  const baseLb    = simActive ? sim.projected : lb
  // En simulación mostramos un ranking proyectado real (con rank/posiciones), nunca el
  // estado neutral pre-torneo: el banner deja claro que es hipotético.
  const showNeutral = notStarted && !simActive

  // Presentación del simulador:
  //  - knockout + escritorio → tile compacto dentro de la fila resumen (sin banda).
  //  - grupos, o knockout en móvil → tarjeta full-width + banner (como antes).
  const koDesktopTile   = isKnockoutSim && !isMobile && !showNeutral
  const showFullWidthSim = (!isKnockoutSim && !!groupSim.nextMatch) || (isKnockoutSim && isMobile)

  let safeData = baseLb.filter(x => x?.user_id)
  // Pre-tournament: present everyone in neutral alphabetical order (no real ranking exists yet)
  if (showNeutral) {
    safeData = [...safeData].sort((a, b) =>
      (a.display_name ?? '').localeCompare(b.display_name ?? '', 'es', { sensitivity: 'base' })
    )
  }
  const total       = safeData.length
  const lastZonePts = paidPositions > 0 ? (safeData[paidPositions - 1]?.total_points ?? null) : null

  const filtered = safeData.filter(e =>
    (e.display_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Divisor de zona de premios: UNA sola línea, tras el último jugador dentro de
  // la zona (rank <= paidPositions). Robusto a empates en el borde — antes se
  // dibujaba una vez por cada empatado en el rank frontera (o ninguna si ese rank
  // no existía por un empate previo).
  const zoneDividerIdx = (!showNeutral && paidPositions > 0 && paidPositions < total)
    ? filtered.reduce((acc, u, i) => ((u.rank ?? Infinity) <= paidPositions ? i : acc), -1)
    : -1

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.2rem' }}>
          <Shield size={18} color="var(--color-primary)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--color-text-1)', letterSpacing: '0.05em' }}>
            TABLA GENERAL
          </h1>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          {total} participantes
          {showNeutral
            ? ' · Torneo sin iniciar'
            : <>
                {paidPositions > 0 && ` · Top ${paidPositions} en zona de premios`}
                {snapshotLabel && ` · hasta ${snapshotLabel}`}
                {simActive && koDesktopTile && ' · simulación activa'}
              </>}
        </p>
      </motion.div>

      {/* ── Pre-tournament banner ── */}
      {showNeutral && <PreparationBanner />}

      {/* ── Simulación: tarjeta full-width (grupos / knockout móvil) + banner ── */}
      {showFullWidthSim && (
        <SimulationCard
          variant={isKnockoutSim ? 'knockout' : 'group'}
          nextMatch={sim.nextMatch}
          consensus={groupSim.consensus}
          outcome={groupSim.outcome}
          onSelect={groupSim.setOutcome}
          isLastGroupMatch={groupSim.isLastGroupMatch}
          fetching={sim.fetching}
          score={koSim.score}
          onScore={koSim.setScore}
        />
      )}
      {simActive && !koDesktopTile && (
        <SimulationBanner
          scenario={isKnockoutSim
            ? knockoutScenarioLabel(koSim.score, koSim.nextMatch)
            : scenarioLabel(groupSim.outcome, groupSim.nextMatch)}
          onReset={sim.reset}
        />
      )}

      {/* ── Summary cards (en knockout+escritorio, la 4ª celda es el simulador) ── */}
      <SummaryCards
        lb={safeData} paidPositions={paidPositions} payoutsTotal={payoutsTotal}
        isMobile={isMobile} notStarted={showNeutral}
        extraTile={koDesktopTile ? (
          <KnockoutSimTile
            nextMatch={koSim.nextMatch}
            score={koSim.score}
            expanded={simOpen}
            onToggle={setSimOpen}
            onScore={koSim.setScore}
            onReset={() => { koSim.reset(); setSimOpen(false) }}
          />
        ) : null}
      />

      {/* ── Aviso: Rasgos del Jugador desbloqueados (se oculta tras 6-jul-2026) ── */}
      {!search && !simActive && new Date() < new Date(2026, 6, 6) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'color-mix(in srgb, var(--color-accent) 7%, var(--color-surface))',
            border: '1px solid color-mix(in srgb, var(--color-accent) 28%, var(--color-border))',
            borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>🎖️</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--color-accent)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.3 }}>
              Rasgos del Jugador desbloqueados
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              La madurez del torneo ha desbloqueado los rasgos de cada jugador. Selecciona el renglón de un jugador para descubrirlos.
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Search ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={14} color="var(--color-text-3)"
          style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text" placeholder="Buscar participante..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.55rem 0.8rem 0.55rem 2.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
        />
      </motion.div>

      {/* ── Table ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>

        {/* Horizontal scroll wrapper — desktop only; mobile uses compact layout */}
        <div style={{ overflowX: isMobile ? 'visible' : 'auto' }}>
          <div style={{ minWidth: isMobile ? 'auto' : 880 }}>
            <TableHeader isMobile={isMobile} />
            <div style={{ padding: '0.3rem' }}>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                    No se encontró &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filtered.map((entry, index) => {
                    // Divider una sola vez, tras el último jugador dentro de la zona
                    // (índice precomputado, robusto a empates). Nunca durante búsqueda.
                    const showPremiosLabel = !search && index === zoneDividerIdx

                    // Stable alphabetical list number (independent of search filter)
                    const listNum = safeData.findIndex(u => u.user_id === entry.user_id) + 1

                    // Points of person ranked immediately above (rank-1, 0-indexed: rank-2)
                    const prevPts = entry.rank > 1 ? (safeData[entry.rank - 2]?.total_points ?? null) : null

                    // Racha: en simulación, anexa la ganancia proyectada como casilla más
                    // reciente (ventana de 6); fuera de simulación, la racha oficial.
                    const baseRacha = rachaMap[entry.user_id]
                    const rachaForRow = simActive
                      ? [...(baseRacha ?? []), sim.deltas?.[entry.user_id]?.ptsGain ?? 0].slice(-6)
                      : baseRacha

                    return (
                      <div key={entry.user_id}>
                        <TableRow
                          entry={entry}
                          index={index}
                          listNum={listNum}
                          notStarted={showNeutral}
                          sim={simActive ? sim.deltas?.[entry.user_id] : null}
                          scoreDetail={scoreMap[entry.user_id]}
                          racha={rachaForRow}
                          enrich={userEnrich[entry.user_id]}
                          archDisplayMap={archDisplayMap}
                          paidPositions={paidPositions}
                          hasAnyMovement={hasAnyMovement}
                          prevPts={prevPts}
                          lastZonePts={lastZonePts}
                          onClick={() => navigate(`/player/${entry.user_id}`)}
                          isMobile={isMobile}
                        />
                        {showPremiosLabel && (
                          <ZoneDivider
                            label={`Zona de Premios · Top ${paidPositions}`}
                            color="var(--color-accent)"
                            icon="💰"
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </motion.div>

      {!search && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: '0.875rem' }}>
          Toca un nombre para ver su quiniela completa
        </motion.p>
      )}
    </div>
  )
}

// ── Loading / Error states ─────────────────────────────────────────────────────
function LoadingState() {
  const isMobile = useIsMobile(680)
  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '0.625rem', marginBottom: '1.125rem' }}>
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            style={{ height: 72, borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
        ))}
      </div>
      {[...Array(7)].map((_, i) => (
        <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
          style={{ height: 52, borderRadius: 8, background: 'var(--color-surface)', marginBottom: '0.375rem', border: '1px solid var(--color-border)' }} />
      ))}
    </div>
  )
}

function ErrorState() {
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '2rem', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-error)', textAlign: 'center' }}>
      <TrendingUp size={32} color="var(--color-error)" style={{ marginBottom: '1rem' }} />
      <p style={{ color: 'var(--color-text-2)', fontSize: '0.875rem' }}>No se pudo cargar el leaderboard.</p>
      <p style={{ color: 'var(--color-text-3)', fontSize: '0.75rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
        Verifica que los archivos JSON están sincronizados.
      </p>
    </div>
  )
}
