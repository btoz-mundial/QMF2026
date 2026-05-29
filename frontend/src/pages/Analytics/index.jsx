import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DATA_URLS } from '../../config/urls'

const BASE = import.meta.env.BASE_URL

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
const ARCH_STYLE = {
  front_runner:        { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.28)',  img: `${BASE}assets/archetypes/front_runner.png` },
  sharpshooter:        { color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.28)',  img: `${BASE}assets/archetypes/sharpshooter.png` },
  clutch_hunter:       { color: '#FB923C', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.28)',  img: `${BASE}assets/archetypes/clutch_hunter.png` },
  consistency_machine: { color: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.28)', img: `${BASE}assets/archetypes/consistency_machine.png` },
}
const ARCH_ORDER = ['front_runner', 'sharpshooter', 'clutch_hunter', 'consistency_machine']
const RARITY_LABEL = { elite: 'ÉLITE', uncommon_rare: 'RARO', moderately_rare: 'MENOS RARO', rare: 'RARO' }
const RARITY_COLOR = { elite: '#FBBF24', uncommon_rare: '#FB923C', moderately_rare: '#34D399', rare: '#A78BFA' }
// Archetypes that are locked until a specific phase (shown only when count === 0)
const ARCH_LOCK = {
  sharpshooter:        { chip: 'PENDIENTE',             sub: 'Se desbloquea en fase eliminatoria', chipColor: '#64748B' },
  clutch_hunter:       { chip: 'PENDIENTE',             sub: 'Se desbloquea en fase eliminatoria', chipColor: '#64748B' },
  consistency_machine: { chip: 'Requiere más historial', sub: null,                                chipColor: '#64748B' },
}
const PHASE_COLORS = { group: '#38BDF8', standings: '#A78BFA', knockout: '#FB923C' }

const TIER_CONFIG = [
  { id: 'elite',       label: 'ÉLITE',       color: '#FBBF24', minPct: 83 },
  { id: 'destacado',   label: 'DESTACADO',   color: '#38BDF8', minPct: 58 },
  { id: 'competitivo', label: 'COMPETITIVO', color: '#34D399', minPct: 33 },
  { id: 'promedio',    label: 'PROMEDIO',    color: '#94A3B8', minPct: 17 },
  { id: 'emergente',   label: 'EMERGENTE',   color: '#64748B', minPct: 0  },
]

const ANALYTICS_TABS = ['Overview', 'Competitive DNA', 'Mente Colectiva']

// ── Helpers ───────────────────────────────────────────────────────────────────
function fieldAvg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }

function FlagImg({ iso2, size = 24 }) {
  if (!iso2) return null
  return (
    <img
      src={`https://flagcdn.com/w40/${iso2}.png`}
      alt={iso2}
      onError={e => { e.target.style.display = 'none' }}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        display: 'inline-block',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    />
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCheck({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.3" />
      <path d="M4.5 7l2 2 3-3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconBars({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1" y="9" width="2.5" height="4" rx="0.8" fill={color} />
      <rect x="5.5" y="6" width="2.5" height="7" rx="0.8" fill={color} opacity="0.8" />
      <rect x="10" y="3" width="2.5" height="10" rx="0.8" fill={color} opacity="0.6" />
    </svg>
  )
}
function IconTrend({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 10.5L5 6.5L8 8.5L13 3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3.5h3v3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconTarget({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.2" />
      <circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1" opacity="0.55" />
      <circle cx="7" cy="7" r="1.3" fill={color} />
    </svg>
  )
}
function IconArrow({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 7h9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 4l3 3-3 3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconCrown({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1.5 10L3 4.5L7 7.5L11 2.5L13 8" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1.5" y="10" width="11" height="2" rx="0.8" fill={color} opacity="0.65" />
    </svg>
  )
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function SectionHeader({ label, sub }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '0.67rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function StatusChip({ status }) {
  const cfg =
    status === 'alive'
      ? { label: 'VIVO',      color: '#34D399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.28)' }
    : status === 'pending'
      ? { label: 'PENDIENTE', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.28)' }
      : { label: 'ELIMINADO', color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' }
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
      padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function AnalyticsTabBar({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--color-border)',
      marginBottom: '1.25rem',
    }}>
      {ANALYTICS_TABS.map(tab => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: active ? 700 : 400,
              color: active ? 'var(--color-text-1)' : 'var(--color-text-3)',
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: -1,
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB — components
// ══════════════════════════════════════════════════════════════════════════════

// ── Métricas Destacadas ───────────────────────────────────────────────────────
function MetricasDestacadas({ lb, avgPrecGen, avgEfic, avgMarcadores, avgAvance, isMobile, hasResults, twoCol = false }) {
  const leader = lb?.[0]
  const avgPts = lb ? Math.round(fieldAvg(lb.map(u => u.total_points))) : 0

  const CARDS = [
    { Icon: IconCheck, color: '#A78BFA', title: 'Acierto\nGeneral',       value: hasResults ? `${Math.round(avgPrecGen * 100)}%` : '—', sub: hasResults ? 'promedio de la comunidad' : 'inicia con el torneo' },
    { Icon: IconBars,  color: '#38BDF8', title: 'Puntos\nPromedio',       value: `${avgPts}`, sub: `líder: ${leader?.total_points ?? '—'} pts` },
    { Icon: IconTrend, color: '#34D399', title: 'Conversion\nde Puntos',  value: hasResults ? `${Math.round(avgEfic)}%` : '—', sub: hasResults ? 'Puntos obtenidos vs posibles' : 'inicia con el torneo' },
    { Icon: IconTarget,color: '#FB923C', title: 'Marcadores\nExacto',     value: hasResults ? `${Math.round(avgMarcadores * 100)}%` : '—', sub: hasResults ? 'promedio de la comunidad' : 'inicia con el torneo' },
    { Icon: IconArrow, color: '#67E8F9', title: 'Clasificados\nCorrectos', value: hasResults ? `${Math.round(avgAvance)}%` : '—', sub: hasResults ? 'Precisión en los 32 cupos' : 'inicia con el torneo' },
    { Icon: IconCrown, color: '#FBBF24', title: 'Líder\ndel Torneo',      value: `${leader?.total_points ?? '—'}`, sub: leader?.display_name ?? '—' },
  ]

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', height: '100%', boxSizing: 'border-box' }}>
      <SectionHeader label="Métricas Destacadas" sub={`${lb?.length ?? 0} participantes · QMF 2026`} />
      <div style={{ display: 'grid', gridTemplateColumns: (isMobile || twoCol) ? '1fr 1fr' : 'repeat(6, 1fr)', gap: '.5rem' }}>
        {CARDS.map((card, idx) => {
          const { Icon, color, title, value, sub } = card
          return (
            <div key={idx} style={{
              border: '1px solid var(--color-border)', borderRadius: 9,
              padding: '0.875rem 0.625rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `${color}70`, borderRadius: '9px 9px 0 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `${color}14`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon color={color} size={12} />
                </div>
                <div style={{
                  fontSize: '0.55rem', fontFamily: 'var(--font-mono)',
                  color, letterSpacing: '0.07em', textTransform: 'uppercase',
                  lineHeight: 1.3, whiteSpace: 'pre-line',
                }}>
                  {title}
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color, lineHeight: 1, marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                {value}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 1, lineHeight: 1.3 }}>
                {sub}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Campeón del Pueblo ────────────────────────────────────────────────────────
const CHAMP_TOP = 5

function CampeonDelPueblo({ champList, teamIso2, isMobile }) {
  const [showAll, setShowAll] = useState(false)
  if (!champList || champList.length === 0) return null
  const displayed = showAll ? champList : champList.slice(0, CHAMP_TOP)
  const remaining = champList.length - CHAMP_TOP
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      {!isMobile && (
        <img src={`${BASE}assets/analytics/fifa_world_cup.png`} alt=""
          style={{ position: 'absolute', right: -10, top: '45%', transform: 'translateY(-40%)', width: 110, height: 220, objectFit: 'contain', opacity: 0.8, pointerEvents: 'none' }}
          onError={e => { e.target.style.display = 'none' }} />
      )}
      <SectionHeader label="El Campeón del Pueblo" sub="¿Qué selecciones lideran las predicciones de campeón?" />
      <div style={{ display: 'grid', gridTemplateColumns: '20px .6fr 30px 70px', gap: '0.35rem', padding: '0 0 0.4rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }}>
        {['#', 'CAMPEÓN', 'USR', 'STATUS'].map((h, i) => (
          <div key={i} style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.1em', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {displayed.map(([team, info], i) => {
          const iso2 = teamIso2?.[team]
          return (
            <div key={team} style={{ display: 'grid', gridTemplateColumns: '20px .6fr 30px 70px', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0', borderBottom: i < displayed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{i + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', minWidth: 0 }}>
                <FlagImg iso2={iso2} size={22} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-1)' }}>{info.count}</span>
              </div>
              <div style={{ textAlign: 'center' }}><StatusChip status={info.status} /></div>
            </div>
          )
        })}
      </div>
      {remaining > 0 && (
        <button
          onClick={() => setShowAll(o => !o)}
          style={{ marginTop: '0.75rem', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '0.4rem', cursor: 'pointer', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-3)', letterSpacing: '0.07em' }}
        >{showAll ? '↑ COLAPSAR' : `VER ${remaining} MÁS ↓`}</button>
      )}
      <div style={{ marginTop: '0.75rem', fontSize: '0.62rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        Basado en todas las predicciones participante.
      </div>
    </div>
  )
}

// ── Censo de Archetypes ───────────────────────────────────────────────────────
function CensoArchetypes({ archetypeCounts, archRegistry, totalUsers }) {
  const regMap = {}
  archRegistry?.archetypes?.forEach(a => { regMap[a.id] = a })
  const fallbackCount = archetypeCounts['__fallback__'] ?? 0
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="Censo de Archetypes" sub="Identidades competitivas activas en el torneo" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        {ARCH_ORDER.map(id => {
          const style  = ARCH_STYLE[id]
          const meta   = regMap[id]
          const count  = archetypeCounts[id] ?? 0
          const rarity = meta?.rarity_tier ?? 'rare'
          const rLabel = RARITY_LABEL[rarity] ?? rarity.toUpperCase()
          const rColor = RARITY_COLOR[rarity] ?? style.color
          const active = count > 0
          return (
            <div key={id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, border: `1px solid ${active ? style.border : 'rgba(255,255,255,0.06)'}`, background: 'rgba(255,255,255,0.018)', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {active && <img src={style.img} alt="" style={{ position: 'absolute', top: '-6px', right: '-6px', width: 68, height: 68, objectFit: 'cover', opacity: 0.38, mixBlendMode: 'luminosity', pointerEvents: 'none' }} />}
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: active ? style.color : 'var(--color-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>{meta?.display_name ?? id}</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: active ? style.color : 'var(--color-text-3)', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{count === 1 ? 'usuario' : 'usuarios'}</div>
                <div style={{ display: 'inline-block', marginTop: '0.5rem', padding: '2px 8px', borderRadius: 4, background: `${rColor}16`, border: `1px solid ${rColor}35`, fontSize: '0.58rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: rColor, letterSpacing: '0.06em' }}>{rLabel}</div>
                {active && <div style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{((count / totalUsers) * 100).toFixed(1)}% del torneo</div>}
              </div>
            </div>
          )
        })}
      </div>
      {fallbackCount > 0 && (
        <div style={{ marginTop: '0.625rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>Sin identidad revelada aún</span>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', fontWeight: 600 }}>{fallbackCount} usuarios</span>
        </div>
      )}
    </div>
  )
}

// ── Estado del Torneo ─────────────────────────────────────────────────────────
function EstadoTorneo({ lb, efMap, isMobile, compact = false }) {
  if (!lb) return null
  const leader = lb[0]
  const bd = leader?.breakdown ?? {}
  const currentStage = bd.knockout > 0 ? 'Eliminatoria' : bd.standings > 0 ? 'Standings' : 'Grupos'
  const availablePts = efMap?.[leader?.user_id]?.extra?.available_points ?? null
  const avgPts = lb.length ? Math.round(fieldAvg(lb.map(u => u.total_points))) : null
  const STATS = [
    { label: 'PARTICIPANTES',      value: lb.length,           unit: null },
    { label: 'FASE ACTUAL',        value: currentStage,        unit: null, small: true },
    { label: 'PTS DISPONIBLES',    value: availablePts ?? '—', unit: availablePts ? 'en el torneo' : null },
    { label: 'LÍDER ACTUAL',       value: leader?.total_points ?? '—', unit: leader?.display_name ?? null },
    { label: 'PROMEDIO',           value: avgPts ?? '—',       unit: 'pts promedio de la comunidad' },
  ]
  return (
    <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 12, padding: '1rem 1.2rem', height: '100%', boxSizing: 'border-box' }}>
      <SectionHeader label="Estado del Torneo" />
      <div style={{ display: 'grid', gridTemplateColumns: (isMobile || compact) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: (isMobile || compact) ? '0.75rem' : '2rem' }}>
        {STATS.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10}}>{s.label}</div>
            <div style={{ fontSize: s.small ? '1rem' : '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)', lineHeight: 1 }}>{s.value}</div>
            {s.unit && <div style={{ fontSize: '.85rem', color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{s.unit}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Próximo / Último Partido ──────────────────────────────────────────────────
const STAGE_LABELS = { R32: 'Octavos de Final', R16: 'Cuartos de Final', QF: 'Cuartos de Final', SF: 'Semifinal', Final: 'GRAN FINAL', group: 'Fase de Grupos' }

function ProximoPartido({ matchToShow, isUpcoming, teamIso2, matchMeta, isMobile }) {
  if (!matchToShow) return null
  const homeGoals   = matchToShow.home_goals
  const awayGoals   = matchToShow.away_goals
  const stageLabel  = STAGE_LABELS[matchToShow.stage] ?? matchToShow.stage
  const homeIso2    = teamIso2?.[matchToShow.home_team]
  const awayIso2    = teamIso2?.[matchToShow.away_team]
  const winner      = (!isUpcoming && homeGoals != null) ? (homeGoals > awayGoals ? matchToShow.home_team : awayGoals > homeGoals ? matchToShow.away_team : 'Empate') : null
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: isUpcoming ? 'rgba(56,189,248,0.5)' : 'rgba(251,191,36,0.5)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '0.5rem' }}>
        <div style={{ fontSize: isMobile ? '0.85rem' : '1.02rem', fontWeight: 800, color: 'var(--color-text-1)', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>{isUpcoming ? 'Próximo Partido' : 'Último Partido'}</div>
        <span style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', padding: isMobile ? '4px 8px' : '8px 12px', borderRadius: 5, letterSpacing: '0.06em', color: isUpcoming ? '#38BDF8' : '#FBBF24', background: isUpcoming ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${isUpcoming ? 'rgba(56,189,248,0.3)' : 'rgba(251,191,36,0.3)'}`, textAlign: 'right' }}>{stageLabel}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <FlagImg iso2={homeIso2} size={50} />
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-1)', textAlign: 'center', lineHeight: 1.2 }}>{matchToShow.home_team ?? '?'}</div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {isUpcoming ? (
            <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', fontWeight: 700 }}>vs</div>
          ) : (
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--color-text-1)', lineHeight: 1, letterSpacing: '0.02em' }}>
              {homeGoals}<span style={{ color: 'var(--color-text-3)', margin: '0 2px' }}>–</span>{awayGoals}
            </div>
          )}
          <div style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: 4 }}>Partido #{matchToShow.match_id}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <FlagImg iso2={awayIso2} size={50} />
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-1)', textAlign: 'center', lineHeight: 1.2 }}>{matchToShow.away_team ?? '?'}</div>
        </div>
      </div>
      {winner && winner !== 'Empate' && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#FBBF24', fontWeight: 700, letterSpacing: '0.06em' }}>🏆 {winner}</span>
        </div>
      )}
      {matchMeta && (
        <div style={{ marginTop: '2.875rem', padding: '0rem 0.875rem', background: 'transparent', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ fontSize: '.70rem', fontWeight: 600, color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏟 {matchMeta.venue}</div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.80rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>📍 {matchMeta.city}, {matchMeta.country}</span>
            <span style={{ fontSize: '0.80rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>· {matchMeta.match_date} · {matchMeta.kickoff_utc} UTC-6</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COLLECTIVE MIND TAB — components
// ══════════════════════════════════════════════════════════════════════════════

const PICK_COLORS = { L: '#38BDF8', E: '#94A3B8', V: '#FB923C' }
const PICK_LABEL  = { L: 'Local', E: 'Empate', V: 'Visitante' }

function consensoText(pct) {
  if (pct < 40) return 'La comunidad ha tenido dificultades para predecir.'
  if (pct < 50) return 'El consenso no siempre acierta.'
  if (pct < 65) return 'La comunidad ha leído bien el torneo.'
  return 'Cuando la comunidad coincide, suele acertar.'
}

function HitChip({ hit }) {
  if (hit === null || hit === undefined) return null
  return (
    <span style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em', color: hit ? '#34D399' : '#F87171', background: hit ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${hit ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
      {hit ? '✓ Acertó' : '✗ Falló'}
    </span>
  )
}

function DistBar({ distribution, total }) {
  if (!total) return null
  return (
    <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      {['L', 'E', 'V'].map(k => {
        const pct = distribution[k]?.percentage ?? 0
        if (!pct) return null
        return <div key={k} style={{ width: `${pct}%`, background: PICK_COLORS[k], opacity: 0.85, borderRadius: 2 }} title={`${PICK_LABEL[k]}: ${pct}%`} />
      })}
    </div>
  )
}

function DistLabels({ distribution }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {['L', 'E', 'V'].map(k => {
        const pct = distribution[k]?.percentage ?? 0
        if (!pct) return null
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: PICK_COLORS[k], flexShrink: 0 }} />
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>{PICK_LABEL[k]} {pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function MainMatchCard({ match, label, accentColor, teamIso2 }) {
  if (!match) return null
  const { home_team, away_team, distribution, consensus_hit } = match
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem 1.25rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
        <HitChip hit={consensus_hit} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FlagImg iso2={teamIso2?.[home_team]} size={20} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home_team ?? '?'}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>vs</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{away_team ?? '?'}</span>
        <FlagImg iso2={teamIso2?.[away_team]} size={20} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <DistBar distribution={distribution} total={match.total_picks} />
        <DistLabels distribution={distribution} />
      </div>
    </div>
  )
}

function MatchRow({ match, teamIso2 }) {
  const { home_team, away_team, distribution, consensus_hit, match_id } = match
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', flexShrink: 0 }}>#{match_id}</span>
          <FlagImg iso2={teamIso2?.[home_team]} size={14} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home_team ?? '?'}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', flexShrink: 0 }}>vs</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away_team ?? '?'}</span>
          <FlagImg iso2={teamIso2?.[away_team]} size={14} />
        </div>
        <DistBar distribution={distribution} total={match.total_picks} />
      </div>
      <HitChip hit={consensus_hit} />
    </div>
  )
}

function MenteColectiva({ consensoStats, teamIso2, isMobile }) {
  if (!consensoStats) return null
  if (consensoStats.empty) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.75rem', opacity: 0.5 }}>🧠</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mente Colectiva</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-2)', lineHeight: 1.6, maxWidth: 320 }}>Las predicciones ya están registradas. Los consensos y aciertos colectivos aparecerán en cuanto arranquen los partidos.</div>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: 4 }}>{consensoStats.totalMatches} partidos con predicciones · pendientes de resultado</div>
      </div>
    )
  }
  const { precision, avgConsensus, divididos, unanimes } = consensoStats
  if (!precision && !avgConsensus) return null
  const STATS = [
    { label: 'Sabiduría Colectiva', value: `${precision.toFixed(1)}%`, sub: consensoText(precision), color: precision >= 50 ? '#34D399' : '#FB923C' },
    { label: 'Consenso Promedio',   value: `${avgConsensus.toFixed(1)}%`, sub: 'Apoyo promedio del favorito', color: '#38BDF8' },
    { label: 'Partidos Divididos',  value: divididos, sub: 'Sin favorito claro', color: '#FBBF24' },
    { label: 'Partidos Unánimes',   value: unanimes, sub: 'Todos escogieron lo mismo', color: '#A78BFA' },
  ]
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="Mente Colectiva" sub="Cómo piensa el torneo" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: i === 0 ? '1.6rem' : '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', lineHeight: 1.35, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BatallasPuebloCard({ consensoStats, teamIso2 }) {
  if (!consensoStats || consensoStats.empty) return null
  const { mostDivisive } = consensoStats
  return <MainMatchCard match={mostDivisive} label="La Mayor Discusión" accentColor="rgba(251,191,36,0.5)" teamIso2={teamIso2} />
}

function VozUnanimeCard({ consensoStats, teamIso2 }) {
  if (!consensoStats || consensoStats.empty) return null
  const { mostUnanimous } = consensoStats
  const hit   = mostUnanimous?.consensus_hit
  const label = hit === true ? 'Todos lo Vieron Venir' : hit === false ? 'Nadie lo Vio Venir' : 'La Esperanza de Todos'
  return <MainMatchCard match={mostUnanimous} label={label} accentColor="rgba(167,139,250,0.5)" teamIso2={teamIso2} />
}

function strengthChip(strength) {
  if (strength < 42) return { label: '⚔ BATALLA',   color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.3)' }
  if (strength < 58) return { label: '⚖ PAREJO',    color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' }
  if (strength < 75) return { label: '📣 INCLINADO', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.3)' }
  return               { label: '🔒 VOZ CLARA', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' }
}

function VeredictoAnticipado({ matches, teamIso2 }) {
  if (!matches || matches.length === 0) return null
  const cols = matches.length <= 2 ? matches.length : matches.length <= 4 ? 2 : 3
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="El Veredicto Anticipado" sub={`Próximos ${matches.length} partidos · cómo votó la comunidad`} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.625rem' }}>
        {matches.map(m => {
          const chip     = strengthChip(m.consensus_strength ?? 0)
          const dominant = ['L','E','V'].reduce((best, k) => (m.distribution?.[k]?.percentage ?? 0) > (m.distribution?.[best]?.percentage ?? 0) ? k : best, 'L')
          return (
            <div key={m.match_id} style={{ border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: chip.color + '55', borderRadius: '9px 9px 0 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
                <FlagImg iso2={teamIso2?.[m.home_team]} size={16} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{m.home_team}</span>
                <span style={{ fontSize: '0.58rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>vs</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, textAlign: 'right' }}>{m.away_team}</span>
                <FlagImg iso2={teamIso2?.[m.away_team]} size={16} />
              </div>
              <DistBar distribution={m.distribution} total={m.total_picks} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['L','E','V'].map(k => {
                    const pct = m.distribution?.[k]?.percentage ?? 0
                    if (!pct) return null
                    return <span key={k} style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: k === dominant ? PICK_COLORS[k] : 'var(--color-text-3)', fontWeight: k === dominant ? 700 : 400 }}>{PICK_LABEL[k][0]}{pct}%</span>
                  })}
                </div>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em', color: chip.color, background: chip.bg, border: `1px solid ${chip.border}`, whiteSpace: 'nowrap' }}>{chip.label}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        Resultados pendientes · se actualiza al cierre de cada partido
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPETITIVE DNA TAB — components
// ══════════════════════════════════════════════════════════════════════════════

// ── S1: Quienes Somos ──────────────────────────────────────────────────
function CompetitiveIdentityCard({ archetypeCounts, archRegistry, totalUsers }) {
  const [hoveredTile, setHoveredTile] = useState(null)
  const regMap = {}
  archRegistry?.archetypes?.forEach(a => { regMap[a.id] = a })

  const fallbackCount = archetypeCounts['__fallback__'] ?? 0
  const revealedCount = totalUsers - fallbackCount

  let dominantId = null, dominantCount = 0
  ARCH_ORDER.forEach(id => {
    const c = archetypeCounts[id] ?? 0
    if (c > dominantCount) { dominantCount = c; dominantId = id }
  })
  const dominant      = dominantId ? regMap[dominantId] : null
  const dominantStyle = dominantId ? ARCH_STYLE[dominantId] : null
  const dominantRarity = dominant ? (RARITY_LABEL[dominant.rarity_tier] ?? '—') : '—'

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="Quienes Somos" sub="Calculamos el perfil de cada jugador basado en su desempeño global y por etapas" />

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        {[
          { label: 'PARTICIPANTES', value: totalUsers,    color: 'var(--color-text-1)', large: true,  sub: null },
          { label: 'CON PERFIL REVELADO',     value: revealedCount, color: '#34D399',             large: true,  sub: null },
          { label: 'EN CONSTRUCCION',    value: fallbackCount, color: 'var(--color-text-3)', large: true,  sub: null },
          { label: 'PERFIL DOMINANTE',     value: dominant?.display_name ?? '—', color: dominantStyle?.color ?? 'var(--color-text-2)', large: false, sub: dominantRarity },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: s.large ? '1.5rem' : '0.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Archetype grid — 3 cols (4 archetypes + 1 fallback = 5 tiles) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {ARCH_ORDER.map(id => {
          const meta   = regMap[id]
          const count  = archetypeCounts[id] ?? 0
          const pct    = totalUsers ? ((count / totalUsers) * 100).toFixed(0) : 0
          const s      = ARCH_STYLE[id]
          const rarity = meta?.rarity_tier ?? 'rare'
          const rLabel = RARITY_LABEL[rarity] ?? rarity.toUpperCase()
          const rColor = RARITY_COLOR[rarity] ?? s.color
          const active = count > 0
          const lock   = !active ? ARCH_LOCK[id] : null
          const isHovered = hoveredTile === id
          const tooltip   = meta?.short_metric
          return (
            <div key={id} style={{ position: 'relative', overflow: 'visible', border: `1px solid ${active ? s.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
              onMouseEnter={() => setHoveredTile(id)}
              onMouseLeave={() => setHoveredTile(null)}
            >
              {tooltip && isHovered && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '10%', transform: 'translateX(-10%)', zIndex: 50, background: 'var(--color-surface)', border: `1px solid ${s.border}`, borderRadius: 7, padding: '5px 9px', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: active ? s.color : 'var(--color-text-2)', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', maxWidth: 200, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.4 }}>
                  {tooltip}
                </div>
              )}
              {active && <img src={s.img} alt="" style={{ position: 'absolute', top: -4, right: -4, width: 52, height: 52, objectFit: 'cover', opacity: 0.28, mixBlendMode: 'luminosity', pointerEvents: 'none', borderRadius: '0 10px 10px 0', overflow: 'hidden' }} />}
              <div style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: active ? s.color : 'var(--color-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>{meta?.display_name ?? id}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: 2 }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: active ? s.color : 'var(--color-text-3)', lineHeight: 1 }}>{count}</span>
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>· {pct}%</span>
              </div>
              {lock ? (
                <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.3)', fontSize: '0.53rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#64748B', letterSpacing: '0.06em', alignSelf: 'flex-start' }}>{lock.chip}</div>
                  {lock.sub && <div style={{ fontSize: '0.5rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic', lineHeight: 1.3 }}>{lock.sub}</div>}
                </div>
              ) : (
                <div style={{ display: 'inline-block', marginTop: 3, padding: '1px 6px', borderRadius: 4, background: `${rColor}16`, border: `1px solid ${rColor}35`, fontSize: '0.53rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: rColor, letterSpacing: '0.06em', alignSelf: 'flex-start' }}>{rLabel}</div>
              )}
            </div>
          )
        })}
        {/* Fallback tile */}
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>En construcción</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: 2 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', lineHeight: 1 }}>{fallbackCount}</span>
            <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>· {totalUsers ? ((fallbackCount / totalUsers) * 100).toFixed(0) : 0}%</span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic', marginTop: 3, lineHeight: 1.3 }}>El torneo aún no revela su identidad.</div>
        </div>
      </div>
    </div>
  )
}

// ── S2: Tier Distribution ─────────────────────────────────────────────────────
function TierDistributionCard({ lb }) {
  const total      = lb.length
  const tierCounts = Object.fromEntries(TIER_CONFIG.map(t => [t.id, 0]))

  lb.forEach(u => {
    const p    = u.percentile_general ?? 0
    const tier = TIER_CONFIG.find(t => p >= t.minPct) ?? TIER_CONFIG[TIER_CONFIG.length - 1]
    tierCounts[tier.id]++
  })

  const maxCount = Math.max(...Object.values(tierCounts), 1)

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="Mapa Competitivo" sub="¿Dónde se concentra el talento del torneo?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {TIER_CONFIG.map(tier => {
          const count = tierCounts[tier.id]
          const pct   = total ? (count / total * 100) : 0
          const barW  = count / maxCount * 100
          return (
            <div key={tier.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 84, flexShrink: 0, fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: count > 0 ? tier.color : 'var(--color-text-3)', letterSpacing: '0.09em', fontWeight: 700 }}>{tier.label}</div>
              <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 3.5, overflow: 'hidden' }}>
                <div style={{ width: `${barW}%`, height: '100%', background: tier.color, borderRadius: 3.5, opacity: 0.82 }} />
              </div>
              <div style={{ width: 20, textAlign: 'right', flexShrink: 0, fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: count > 0 ? tier.color : 'var(--color-text-3)' }}>{count}</div>
              <div style={{ width: 38, flexShrink: 0, fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textAlign: 'right' }}>{pct.toFixed(0)}%</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '0.875rem', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        Basado en tabla general · ÉLITE ≥83% · DESTACADO ≥58% · EMERGENTE &lt;17%
      </div>
    </div>
  )
}

// ── S3+S4: Community Strengths & Weaknesses ───────────────────────────────────
function CommunityStrengthsCard({ avgPhaseAccuracy, hasResults }) {
  if (!hasResults || !avgPhaseAccuracy?.hasData) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
        <SectionHeader label="Community Strengths & Weaknesses" sub="¿Dónde acierta y dónde falla esta comunidad?" />
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
          Disponible cuando comiencen los partidos.
        </div>
      </div>
    )
  }

  const PHASES = [
    { id: 'group',     label: 'Grupos',        color: PHASE_COLORS.group },
    { id: 'standings', label: 'Standings',     color: PHASE_COLORS.standings },
    { id: 'knockout',  label: 'Eliminatorias', color: PHASE_COLORS.knockout },
  ]
    .filter(p => avgPhaseAccuracy[p.id] > 0)
    .sort((a, b) => avgPhaseAccuracy[b.id] - avgPhaseAccuracy[a.id])

  if (PHASES.length === 0) return null

  const best      = PHASES[0]
  const narrative = `La comunidad muestra mayor capacidad predictiva en ${best.label.toLowerCase()}.`

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="Community Strengths & Weaknesses" sub="¿Dónde acierta y dónde falla esta comunidad?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
        {PHASES.map((p, i) => {
          const acc      = avgPhaseAccuracy[p.id]
          const isFirst  = i === 0
          const isLast   = i === PHASES.length - 1 && PHASES.length > 1
          const accent   = isFirst ? p.color : isLast ? '#F87171' : 'var(--color-text-3)'
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: isFirst ? `${p.color}18` : isLast ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isFirst ? p.color + '45' : isLast ? 'rgba(248,113,113,0.32)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: accent }}>{i + 1}</span>
              </div>
              <div style={{ width: 110, flexShrink: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: accent }}>{p.label}</div>
                {isFirst && <div style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: p.color, letterSpacing: '0.07em', marginTop: 1 }}>MAYOR FORTALEZA</div>}
                {isLast && PHASES.length > 1 && <div style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: '#F87171', letterSpacing: '0.07em', marginTop: 1 }}>MAYOR DEBILIDAD</div>}
              </div>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(acc, 100)}%`, height: '100%', background: accent, borderRadius: 3, opacity: 0.85 }} />
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent }}>{acc.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '0.5rem 0.875rem', background: `${best.color}08`, border: `1px solid ${best.color}20`, borderRadius: 8, fontSize: '0.72rem', color: 'var(--color-text-2)', lineHeight: 1.55, fontStyle: 'italic' }}>
        {narrative}
      </div>
    </div>
  )
}

// ── S5: Risk Profile ──────────────────────────────────────────────────────────
function RiskProfileCard({ consensoStats }) {
  if (!consensoStats || consensoStats.empty || consensoStats.avgConsensus == null) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
        <SectionHeader label="Risk Profile" sub="¿Cómo juega esta comunidad?" />
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>Disponible cuando haya resultados de partidos.</div>
      </div>
    )
  }

  const { avgConsensus, divididos, unanimes } = consensoStats
  const riskLabel = avgConsensus >= 65 ? 'Muy conservadora' : avgConsensus >= 50 ? 'Balanceada' : 'Muy agresiva'
  const riskColor = avgConsensus >= 65 ? '#34D399' : avgConsensus >= 50 ? '#38BDF8' : '#FB923C'
  const riskDesc  = avgConsensus >= 65
    ? 'La comunidad tiende a elegir favoritos claros y picks convencionales.'
    : avgConsensus >= 50
    ? 'La comunidad divide sus picks de forma equilibrada, con tendencia al consenso.'
    : 'La comunidad difiere más do que coincide. Perfil de riesgo elevado.'

  const STATS = [
    { label: 'CONSENSO PROMEDIO',  value: `${avgConsensus.toFixed(1)}%`, color: riskColor,  sub: 'Apoyo promedio del favorito' },
    { label: 'PARTIDOS DIVIDIDOS', value: divididos ?? '—',              color: '#FBBF24', sub: 'Sin favorito claro (<42%)' },
    { label: 'PARTIDOS UNÁNIMES',  value: unanimes ?? '—',               color: '#A78BFA', sub: 'Todos eligieron lo mismo' },
  ]

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
      <SectionHeader label="Risk Profile" sub="¿Cómo juega esta comunidad?" />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.3rem 0.875rem', borderRadius: 6, flexShrink: 0, background: `${riskColor}14`, border: `1px solid ${riskColor}35`, fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: riskColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{riskLabel}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-2)', lineHeight: 1.5, fontStyle: 'italic', paddingTop: '0.2rem' }}>{riskDesc}</div>
      </div>
      {/* Consensus spectrum */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#FB923C' }}>DIVERGENTES</span>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>ESPECTRO DE CONSENSO</span>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#34D399' }}>CONSERVADORA</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'visible' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(251,146,60,0.3), rgba(56,189,248,0.15) 50%, rgba(52,211,153,0.3))', borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${Math.min(Math.max(avgConsensus, 2), 98)}%`, transform: 'translateX(-50%)', width: 3, background: riskColor, borderRadius: 2, boxShadow: `0 0 6px ${riskColor}80` }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.3rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: riskColor, fontWeight: 700 }}>{avgConsensus.toFixed(1)}%</div>
      </div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--color-text-3)', lineHeight: 1.35 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── S6: Competitive Summary ───────────────────────────────────────────────────
function CompetitiveSummaryCard({ lb, archetypeCounts, totalUsers, avgPhaseAccuracy, consensoStats, hasResults }) {
  const findings = []

  // Finding 1: Phase strength
  if (hasResults && avgPhaseAccuracy?.hasData) {
    const phases = [
      { id: 'group',     label: 'grupos',        color: PHASE_COLORS.group },
      { id: 'standings', label: 'standings',     color: PHASE_COLORS.standings },
      { id: 'knockout',  label: 'eliminatorias', color: PHASE_COLORS.knockout },
    ].filter(p => avgPhaseAccuracy[p.id] > 0).sort((a, b) => avgPhaseAccuracy[b.id] - avgPhaseAccuracy[a.id])
    if (phases.length > 0) {
      findings.push({ text: `La comunidad muestra mayor capacidad predictiva en ${phases[0].label} (${avgPhaseAccuracy[phases[0].id].toFixed(1)}% de precisión promedio).`, color: phases[0].color })
    }
  } else {
    findings.push({ text: 'Las fortalezas colectivas se revelarán cuando comiencen los partidos.', color: 'var(--color-text-3)' })
  }

  // Finding 2: Archetype revelation
  const fallbackCount = archetypeCounts['__fallback__'] ?? 0
  const revealedCount = totalUsers - fallbackCount
  if (revealedCount / totalUsers >= 0.5) {
    findings.push({ text: `${revealedCount} de ${totalUsers} participantes tienen identidad competitiva definida. la comunidad está tomando forma.`, color: '#34D399' })
  } else {
    findings.push({ text: `Solo ${revealedCount} de ${totalUsers} participantes tienen identidad revelada. La mayoría de la comunidad está pendiente.`, color: 'var(--color-text-3)' })
  }

  // Finding 3: Risk or tier
  if (consensoStats && !consensoStats.empty && consensoStats.avgConsensus != null) {
    const avg = consensoStats.avgConsensus
    if (avg >= 65)      findings.push({ text: 'La comunidad favorece picks consensuados y conservadores. Bajo perfil de riesgo colectivo.', color: '#34D399' })
    else if (avg >= 50) findings.push({ text: 'La comunidad mantiene un perfil de riesgo equilibrado entre picks seguros y arriesgados.', color: '#38BDF8' })
    else                findings.push({ text: 'La comunidad toma picks divergentes con frecuencia. Alto perfil de riesgo colectivo.', color: '#FB923C' })
  } else {
    const topPct = totalUsers ? Math.round(lb.filter(u => (u.percentile_general ?? 0) >= 58).length / totalUsers * 100) : 0
    findings.push({ text: `El ${topPct}% de la comuinidad está en tiers superiores de rendimiento (Destacado o Élite).`, color: '#38BDF8' })
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, #38BDF8, #A78BFA 50%, #FB923C)', opacity: 0.65 }} />
      <SectionHeader label="Competitive Summary" sub="Hallazgos automáticos de la comunidad competitiva" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {findings.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: f.color, marginTop: 8, boxShadow: `0 0 5px ${f.color}60` }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-2)', lineHeight: 1.65 }}>{f.text}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        Derivado exclusivamente de datos del pipeline · No editorial
      </div>
    </div>
  )
}

// ── Community Traits ──────────────────────────────────────────────────────────
const ARCH_DISPLAY_NAMES = {
  front_runner:        'Front Runner',
  sharpshooter:        'Sharpshooter',
  clutch_hunter:       'Clutch Hunter',
  consistency_machine: 'Consistency Machine',
}

function CommunityTraitsCard({ enrichedMatches, lb, archetypeCounts, totalUsers, champList, avgEfic, avgPrecGen }) {
  if (!enrichedMatches || enrichedMatches.length === 0 || !lb) return null

  const withTeams      = enrichedMatches.filter(m => m.home_team && m.away_team)
  const groupAll       = withTeams.filter(m => m.phase === 'group')
  const standingsAll   = withTeams.filter(m => m.phase === 'standings')
  const koAll          = withTeams.filter(m => m.phase === 'knockout')
  const groupCompleted = groupAll.filter(m => m.actual_result != null)
  const standingsCompleted = standingsAll.filter(m => m.actual_result != null)
  const koCompleted    = koAll.filter(m => m.actual_result != null)

  // Umbral de activación: max match_id concluido (excl. standings)
  const concludedNS = withTeams.filter(m => m.phase !== 'standings' && m.actual_result != null)
  const maxMatchId  = concludedNS.length > 0 ? Math.max(...concludedNS.map(m => m.match_id)) : 0

  // ── T1: Sesgo de fase ───────────────────────────────────────────────────────
  const groupAcc     = groupCompleted.length > 0 ? groupCompleted.filter(m => m.consensus_hit).length / groupCompleted.length * 100 : null
  const standingsAcc = standingsCompleted.length > 0 ? standingsCompleted.filter(m => m.consensus_hit).length / standingsCompleted.length * 100 : null
  let t1Title, t1Sub, t1Color
  if (groupAcc === null && standingsAcc === null) {
    t1Title = 'Pendiente'; t1Sub = 'Sin resultados de grupos aún'; t1Color = 'var(--color-text-3)'
  } else if (groupAcc !== null && standingsAcc !== null) {
    const gap = Math.abs(groupAcc - standingsAcc)
    if (gap > 12) {
      const better  = groupAcc > standingsAcc ? 'grupos' : 'standings'
      const worse   = better === 'grupos' ? 'standings' : 'grupos'
      const betterV = Math.round(Math.max(groupAcc, standingsAcc))
      const worseV  = Math.round(Math.min(groupAcc, standingsAcc))
      t1Title = `Domina ${better}`; t1Sub = `${betterV}% en ${better} vs ${worseV}% en ${worse}`; t1Color = '#38BDF8'
    } else {
      t1Title = 'Rendimiento parejo'; t1Sub = `Grupos ${Math.round(groupAcc)}% · Standings ${Math.round(standingsAcc)}%`; t1Color = '#34D399'
    }
  } else {
    const acc = groupAcc ?? standingsAcc ?? 0
    t1Title = `${groupAcc !== null ? 'Grupos' : 'Standings'}: ${Math.round(acc)}% de acierto`
    t1Sub   = groupAcc !== null ? 'Standings pendiente de inicio' : 'Grupos pendiente de inicio'
    t1Color = '#38BDF8'
  }

  // ── T2: Sesgo de empate ─────────────────────────────────────────────────────
  const groupEPct  = groupAll.length > 0 ? groupAll.filter(m => m.consensus_pick === 'E').length / groupAll.length * 100 : null
  const koDrawPct  = koCompleted.length > 0 ? koCompleted.filter(m => m.actual_result === 'E').length / koCompleted.length * 100 : null
  const globalEPct = withTeams.length > 0 ? withTeams.filter(m => m.consensus_pick === 'E').length / withTeams.length * 100 : null
  let t2Title, t2Sub, t2Color
  if (globalEPct === null) {
    t2Title = 'Pendiente'; t2Sub = 'Sin datos de predicción aún'; t2Color = 'var(--color-text-3)'
  } else {
    if      (globalEPct < 15) { t2Title = 'La comunidad evita el empate';      t2Color = '#FBBF24' }
    else if (globalEPct > 28) { t2Title = 'La comunidad le teme al empate'; t2Color = '#34D399' }
    else                      { t2Title = 'Relación neutra con el empate';  t2Color = '#94A3B8' }
    const parts = []
    if (groupEPct  != null) parts.push(`Grupos: ${Math.round(groupEPct)}% picks en E`)
    if (koDrawPct  != null) parts.push(`Knockout: ${Math.round(koDrawPct)}% a tiempo extra`)
    t2Sub = parts.length ? parts.join(' · ') : `Global: ${Math.round(globalEPct)}%`
  }

  // ── T3: Perfil de riesgo (excl. standings, activa match 12) ────────────────
  const nsAll          = withTeams.filter(m => m.phase !== 'standings')
  const avgConsensusNS = nsAll.length > 0 ? nsAll.reduce((s, m) => s + (m.consensus_strength ?? 0), 0) / nsAll.length : null
  let t3Title, t3Sub, t3Color
  if (maxMatchId < 12 || avgConsensusNS === null) {
    t3Title = 'Pendiente'; t3Sub = 'Disponible tras los primeros 12 partidos'; t3Color = 'var(--color-text-3)'
  } else {
    if      (avgConsensusNS >= 65) { t3Title = 'Campo conservador'; t3Color = '#34D399' }
    else if (avgConsensusNS >= 50) { t3Title = 'Perfil equilibrado'; t3Color = '#38BDF8' }
    else                           { t3Title = 'Campo arriesgado';   t3Color = '#FB923C' }
    t3Sub = `Consenso promedio ${Math.round(avgConsensusNS)}% — excluye fase de standings`
  }

  // ── T4: Compresión de la comunidad (activa match 12) ──────────────────────────────
  let t4Title, t4Sub, t4Color
  if (maxMatchId < 12 || lb.length < 4) {
    t4Title = 'Pendiente'; t4Sub = 'Disponible tras los primeros 12 partidos'; t4Color = 'var(--color-text-3)'
  } else {
    const leader = lb[0]
    const median = lb[Math.floor(lb.length / 2)]
    const gap    = leader.total_points - median.total_points
    const gapPct = leader.total_points > 0 ? gap / leader.total_points * 100 : 0
    if      (gapPct < 15) { t4Title = 'Campo comprimido'; t4Sub = `${gap} pts entre líder y mediana — el torneo está abierto`; t4Color = '#A78BFA' }
    else if (gapPct < 35) { t4Title = 'Brecha moderada';  t4Sub = `${gap} pts de ventaja del líder — top definido sin fuga`;  t4Color = '#38BDF8' }
    else                  { t4Title = 'Líder en fuga';    t4Sub = `${gap} pts de distancia — la brecha sigue creciendo`;       t4Color = '#FBBF24' }
  }

  // ── T5: Arquetipo dominante ──────────────────────────────────────────────────
  const fallbackCount = archetypeCounts?.['__fallback__'] ?? 0
  const revealed      = totalUsers - fallbackCount
  let t5Title, t5Sub, t5Color
  if (revealed === 0) {
    t5Title = 'En construcción'; t5Sub = `0 de ${totalUsers} participantes han revelado arquetipo`; t5Color = 'var(--color-text-3)'
  } else {
    let domId = null, domCount = 0
    ARCH_ORDER.forEach(id => { const c = archetypeCounts?.[id] ?? 0; if (c > domCount) { domCount = c; domId = id } })
    const domPct   = revealed > 0 ? domCount / revealed * 100 : 0
    const domName  = domId ? (ARCH_DISPLAY_NAMES[domId] ?? domId) : '—'
    const domColor = domId ? ARCH_STYLE[domId]?.color : '#A78BFA'
    if (domPct > 40) {
      t5Title = `ADN: ${domName}`; t5Sub = `${Math.round(domPct)}% de revelados · ${revealed} de ${totalUsers} participantes`; t5Color = '#c059f7' ?? '#A78BFA'
    } else {
      t5Title = 'Identidades diversas'; t5Sub = `Sin arquetipo dominante · ${revealed} de ${totalUsers} revelados`; t5Color = '#A78BFA'
    }
  }

  // ── T6: Eficiencia vs precisión (activa match 75) ───────────────────────────
  let t6Title, t6Sub, t6Color
  if (maxMatchId < 75) {
    t6Title = 'Disponible en fase eliminatoria'; t6Sub = 'Se activa cuando el torneo avanza a knockout'; t6Color = 'var(--color-text-3)'
  } else {
    const precPct = (avgPrecGen ?? 0) * 100
    const diff    = (avgEfic ?? 0) - precPct
    if      (diff >  8) { t6Title = 'Alta conversión';                 t6Sub = `${Math.round(avgEfic)}% eficiencia vs ${Math.round(precPct)}% acierto — aciertan donde vale más`;          t6Color = '#34D399' }
    else if (diff < -8) { t6Title = 'Aciertan, pero no donde importa'; t6Sub = `${Math.round(avgEfic)}% eficiencia vs ${Math.round(precPct)}% acierto — pierden puntos en partidos clave`; t6Color = '#FB923C' }
    else                { t6Title = 'Conversión equilibrada';           t6Sub = `${Math.round(avgEfic)}% de eficiencia · proporcional al acierto general`;                                   t6Color = '#38BDF8' }
  }

  // ── T7: Concentración de campeones ──────────────────────────────────────────
  let t7Title, t7Sub, t7Color
  if (!champList || champList.length === 0) {
    t7Title = 'Sin predicciones de campeón'; t7Sub = 'No hay datos disponibles aún'; t7Color = 'var(--color-text-3)'
  } else {
    const top2Count = champList.slice(0, 2).reduce((s, [, i]) => s + i.count, 0)
    const top2Pct   = totalUsers > 0 ? top2Count / totalUsers * 100 : 0
    const t1n = champList[0]?.[0] ?? '—'
    const t2n = champList[1]?.[0] ?? '—'
    if      (top2Pct > 60) { t7Title = 'Apuestas concentradas';  t7Sub = `${t1n} y ${t2n} acaparan el ${Math.round(top2Pct)}% de prefrencias`; t7Color = '#FBBF24' }
    else if (top2Pct > 40) { t7Title = 'Favoritos con ventaja';  t7Sub = `${t1n} y ${t2n} lideran las apuestas (${Math.round(top2Pct)}%)`;  t7Color = '#38BDF8' }
    else                   { t7Title = 'Apuestas diversificadas'; t7Sub = 'Ningún equipo domina las quinielas — el campeón es una incógnita'; t7Color = '#34D399' }
  }

  const TRAITS = [
    { title: t1Title, sub: t1Sub, color: t1Color },
    { title: t2Title, sub: t2Sub, color: t2Color },
    { title: t3Title, sub: t3Sub, color: t3Color },
    { title: t4Title, sub: t4Sub, color: t4Color },
    { title: t5Title, sub: t5Sub, color: t5Color },
    { title: t6Title, sub: t6Sub, color: t6Color },
    { title: t7Title, sub: t7Sub, color: t7Color },
  ]

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', height: '100%', boxSizing: 'border-box' }}>
      <SectionHeader label="Rasgos del Torneo" sub="Comportamiento colectivo de la comunidad" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {TRAITS.map((t, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.018)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderLeft: `3px solid ${t.color}`,
            borderRadius: '0 8px 8px 0',
            padding: '0.8rem 0.75rem',
          }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: t.color, marginBottom: 2 }}>{t.title}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-2)', lineHeight: 1.4 }}>{t.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        De partidos concluidos · se actualiza con cada resultado
      </div>
    </div>
  )
}

// ── Competitive DNA Tab ───────────────────────────────────────────────────────
function CompetitiveDnaTab({ lb, archetypeCounts, archRegistry, totalUsers, consensoStats, avgPhaseAccuracy, hasResults, enrichedMatches, champList, avgEfic, avgPrecGen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Row 1-2: Identity + Tier left col; Rasgos spanning right col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <CompetitiveIdentityCard archetypeCounts={archetypeCounts} archRegistry={archRegistry} totalUsers={totalUsers} />
          <TierDistributionCard lb={lb} />
        </div>
        <CommunityTraitsCard enrichedMatches={enrichedMatches} lb={lb} archetypeCounts={archetypeCounts} totalUsers={totalUsers} champList={champList} avgEfic={avgEfic} avgPrecGen={avgPrecGen} />
      </div>
      {/* Row 3: Community S&W + Risk Profile side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
        <CommunityStrengthsCard avgPhaseAccuracy={avgPhaseAccuracy} hasResults={hasResults} />
        <RiskProfileCard consensoStats={consensoStats} />
      </div>
      {/* Row 4: Competitive Summary full width */}
      <CompetitiveSummaryCard lb={lb} archetypeCounts={archetypeCounts} totalUsers={totalUsers} avgPhaseAccuracy={avgPhaseAccuracy} consensoStats={consensoStats} hasResults={hasResults} />
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// MENTE COLECTIVA TAB — drill-down completo de consenso_partidos
// ══════════════════════════════════════════════════════════════════════════════

// ── Match explorer block (unánimes o divididos) ──────────────────────────────
const PHASE_CHIP = {
  group:    { label: 'GRUPOS', color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)' },
  knockout: { label: 'KO',     color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)' },
  standings:{ label: 'TABLA',  color: '#94A3B8', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.25)' },
}

function MatchExplorerBlock({ title, subtitle, accentColor, matches, teamIso2 }) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? matches : matches.slice(0, 5)
  const remaining = matches.length - 5

  return (
    <div style={{ background: 'var(--color-surface)', border: `1px solid var(--color-border)`, borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: accentColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '0.58rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{subtitle} · {matches.length} partidos</div>
      </div>

      {/* Match rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {displayed.map((m, idx) => {
          const phase = PHASE_CHIP[m.phase] ?? PHASE_CHIP.standings
          return (
            <div
              key={m.match_id}
              style={{
                display: 'grid', gridTemplateColumns: '22px 1fr auto',
                gap: '0.5rem', alignItems: 'center',
                padding: '0.55rem 0',
                borderBottom: idx < displayed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Rank */}
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textAlign: 'center' }}>{idx + 1}</div>

              {/* Match info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', flexShrink: 0 }}>#{m.match_id}</span>
                  <span style={{ fontSize: '0.45rem', fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '1px 4px', borderRadius: 3, color: phase.color, background: phase.bg, border: `1px solid ${phase.border}`, flexShrink: 0, letterSpacing: '0.05em' }}>{phase.label}</span>
                  <FlagImg iso2={teamIso2?.[m.home_team]} size={12} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home_team ?? '?'}</span>
                  <span style={{ fontSize: '0.5rem', color: 'var(--color-text-3)', flexShrink: 0 }}>vs</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away_team ?? '?'}</span>
                  <FlagImg iso2={teamIso2?.[m.away_team]} size={12} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                    {['L', 'E', 'V'].map(k => {
                      const pct = m.distribution?.[k]?.percentage ?? 0
                      if (!pct) return null
                      return <div key={k} style={{ width: `${pct}%`, height: '100%', background: PICK_COLORS[k], opacity: 0.85 }} />
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    {['L', 'E', 'V'].map(k => {
                      const pct = m.distribution?.[k]?.percentage ?? 0
                      if (!pct) return null
                      const isCons = k === m.consensus_pick
                      return (
                        <span key={k} style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: isCons ? PICK_COLORS[k] : 'var(--color-text-3)', fontWeight: isCons ? 700 : 400 }}>{k}{pct.toFixed(0)}%</span>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right: hit only */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
                <HitChip hit={m.consensus_hit} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Expand / collapse */}
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '0.5rem', cursor: 'pointer', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-3)', letterSpacing: '0.07em' }}
        >VER {remaining} PARTIDOS MÁS ↓</button>
      )}
      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '0.5rem', cursor: 'pointer', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-3)', letterSpacing: '0.07em' }}
        >↑ COLAPSAR</button>
      )}
    </div>
  )
}

function MenteColectivaTab({ enrichedMatches, teamIso2, consensoStats }) {
  if (!enrichedMatches || enrichedMatches.length === 0) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.75rem', opacity: 0.5 }}>🧠</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mente Colectiva</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>No hay datos de consenso disponibles.</div>
      </div>
    )
  }

  const withTeams = enrichedMatches.filter(m => m.home_team && m.away_team)
  const completed = withTeams.filter(m => m.actual_result != null)
  const total     = withTeams.length

  // ── Global stats ────────────────────────────────────────────────────────────
  const precision   = completed.length > 0 ? completed.filter(m => m.consensus_hit).length / completed.length * 100 : null
  const avgStrength = total > 0 ? withTeams.reduce((s, m) => s + m.consensus_strength, 0) / total : null
  const splitCount  = withTeams.filter(m => m.consensus_strength < 42).length

  const pickDist = { L: 0, E: 0, V: 0 }
  withTeams.forEach(m => { if (m.consensus_pick) pickDist[m.consensus_pick]++ })
  const maxPickCount = Math.max(...Object.values(pickDist), 1)

  // ── 50/50 non-overlapping split by consensus_strength ───────────────────────
  const sortedByStrength = [...withTeams].sort((a, b) => a.consensus_strength - b.consensus_strength)
  const mid        = Math.ceil(sortedByStrength.length / 2)
  const byDivided  = sortedByStrength.slice(0, mid)              // bottom 50% — least unanimous
  const byUnanimous = sortedByStrength.slice(mid).reverse()      // top 50% — most unanimous first

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Resumen global ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
        <SectionHeader label="Mente Colectiva · Explorador" sub="Distribución del pensamiento colectivo por partido" />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          {[
            { label: 'PARTIDOS ANALIZADOS', value: total,                                                   color: 'var(--color-text-1)' },
            { label: 'PRECISIÓN CONSENSO',  value: precision   != null ? `${precision.toFixed(1)}%`   : '—', color: precision != null ? (precision >= 50 ? '#34D399' : '#FB923C') : 'var(--color-text-3)' },
            { label: 'FUERZA PROMEDIO',     value: avgStrength != null ? `${avgStrength.toFixed(1)}%` : '—', color: '#38BDF8' },
            { label: 'PARTIDOS DIVIDIDOS',  value: splitCount,                                                color: '#FBBF24' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Distribución global L / E / V */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Consenso dominante por partido</div>
          {['L', 'E', 'V'].map(k => {
            const count = pickDist[k] ?? 0
            const pct   = total ? count / total * 100 : 0
            const barW  = count / maxPickCount * 100
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 64, flexShrink: 0, fontSize: '0.62rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: PICK_COLORS[k] }}>{PICK_LABEL[k]}</div>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${barW}%`, height: '100%', background: PICK_COLORS[k], borderRadius: 3, opacity: 0.82 }} />
                </div>
                <div style={{ width: 26, textAlign: 'right', flexShrink: 0, fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: PICK_COLORS[k] }}>{count}</div>
                <div style={{ width: 38, flexShrink: 0, fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textAlign: 'right' }}>{pct.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── La Mayor Discusión | Todos lo Vieron Venir ──────────────────────── */}
      {consensoStats && !consensoStats.empty && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
          <BatallasPuebloCard consensoStats={consensoStats} teamIso2={teamIso2} />
          <VozUnanimeCard consensoStats={consensoStats} teamIso2={teamIso2} />
        </div>
      )}

      {/* ── Partidos Divididos | Partidos Unánimes ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <MatchExplorerBlock
          title="⚔ Batallas del Pueblo"
          subtitle="Menor consenso primero"
          accentColor="#FBBF24"
          matches={byDivided}
          teamIso2={teamIso2}
        />
        <MatchExplorerBlock
          title="📢 Voz Unánime"
          subtitle="Mayor consenso primero"
          accentColor="#34D399"
          matches={byUnanimous}
          teamIso2={teamIso2}
        />
      </div>

    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[180, 320, 100].map((h, i) => (
        <motion.div key={i} animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12 }}
          style={{ height: h, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Analytics() {
  const isMobile              = useIsMobile()
  const [activeTab, setActiveTab] = useState('Overview')
  const [data, setData]           = useState(null)

  useEffect(() => {
    async function load() {
      const [lb, ef, pg, marcadores, avance, campeon, arch, registry, teams, koResults, groupResults, consenso, matchesMeta] = await Promise.all([
        fetchOptional(DATA_URLS.leaderboard),
        fetchRobust(DATA_URLS.eficienciaDePuntos),
        fetchRobust(DATA_URLS.precisionGeneral),
        fetchOptional(DATA_URLS.precisionMarcadoresExactos),
        fetchOptional(DATA_URLS.precisionAvance),
        fetchOptional(DATA_URLS.campeonVivo),
        fetchOptional(DATA_URLS.archetypes),
        fetchRobust(DATA_URLS.archetypeRegistry),
        fetchOptional(DATA_URLS.teams),
        fetchOptional(DATA_URLS.knockoutResults),
        fetchOptional(DATA_URLS.groupResults),
        fetchOptional(DATA_URLS.consensoPartidos),
        fetchOptional(DATA_URLS.matchesMetadata),
      ])

      if (!lb) return

      const efMap   = {}; (ef?.users  ?? []).forEach(u => { efMap[u.user_id]   = u })
      const pgMap   = {}; (pg?.users  ?? []).forEach(u => { pgMap[u.user_id]   = u })
      const marcMap = {}; (marcadores?.users ?? []).forEach(u => { marcMap[u.user_id] = u })
      const avMap   = {}; (Array.isArray(avance) ? avance : []).forEach(u => { avMap[u.user_id] = u })

      const teamIso2 = {}
      ;(teams ?? []).forEach(t => { teamIso2[t.name] = t.iso2 })

      const pgVals   = Object.values(pgMap).map(u => u.value).filter(v => v != null)
      const efVals   = Object.values(efMap).map(u => u.value).filter(v => v != null)
      const marcVals = Object.values(marcMap).map(u => u.value).filter(v => v != null)
      const avVals   = Object.values(avMap).map(u => u.value).filter(v => v != null)

      const avgPrecGen    = fieldAvg(pgVals)
      const avgEfic       = fieldAvg(efVals)
      const avgMarcadores = fieldAvg(marcVals)
      const avgAvance     = fieldAvg(avVals)

      const phaseAccG = [], phaseAccS = [], phaseAccK = []
      Object.values(pgMap).forEach(u => {
        const bd = u.extra?.category_breakdown ?? {}
        if ((bd.group?.possible     ?? 0) > 0) phaseAccG.push(bd.group.accuracy)
        if ((bd.standings?.possible ?? 0) > 0) phaseAccS.push(bd.standings.accuracy)
        if ((bd.knockout?.possible  ?? 0) > 0) phaseAccK.push(bd.knockout.accuracy)
      })
      const avgPhaseAccuracy = {
        group:     fieldAvg(phaseAccG),
        standings: fieldAvg(phaseAccS),
        knockout:  fieldAvg(phaseAccK),
        hasData:   phaseAccG.length > 0,
      }

      const STATUS_RANK = { alive: 2, pending: 1, eliminated: 0 }
      const champGroups = {}
      ;(campeon?.users ?? []).forEach(u => {
        const team   = u.extra?.champion
        const status = u.extra?.champion_status ?? 'pending'
        if (!team) return
        if (!champGroups[team]) champGroups[team] = { count: 0, status }
        else if ((STATUS_RANK[status] ?? 0) > (STATUS_RANK[champGroups[team].status] ?? 0)) champGroups[team].status = status
        champGroups[team].count++
      })
      const champList = Object.entries(champGroups).sort((a, b) => b[1].count - a[1].count)

      const archetypeCounts = {}
      ;(arch?.users ?? []).forEach(u => {
        const id = u.active_archetype ?? '__fallback__'
        archetypeCounts[id] = (archetypeCounts[id] ?? 0) + 1
      })

      const metaMap = {}
      if (matchesMeta) Object.values(matchesMeta).forEach(m => { metaMap[m.match_id] = m })

      let consensoStats    = null
      let upcomingMatches  = []
      let enrichedMatches  = []
      const cMatches = consenso?.matches ?? []
      if (cMatches.length > 0) {
        const resultMap = {}
        const phaseMap  = {}
        ;(groupResults ?? []).forEach(m => {
          const r = m.result ?? (m.home_goals != null ? (m.home_goals > m.away_goals ? 'L' : m.home_goals < m.away_goals ? 'V' : 'E') : null)
          resultMap[m.match_id] = { result: r, home_team: m.home_team, away_team: m.away_team }
          phaseMap[m.match_id]  = 'group'
        })
        ;(koResults ?? []).forEach(m => {
          const r = m.result ?? (m.home_goals != null ? (m.home_goals > m.away_goals ? 'L' : m.home_goals < m.away_goals ? 'V' : 'E') : null)
          resultMap[m.match_id] = { result: r, home_team: m.home_team, away_team: m.away_team }
          phaseMap[m.match_id]  = 'knockout'
        })
        const enriched = cMatches.map(m => {
          const real      = resultMap[m.match_id] ?? {}
          const meta      = metaMap[m.match_id] ?? {}
          const home_team = real.home_team ?? meta.home_team
          const away_team = real.away_team ?? meta.away_team
          const hit       = real.result != null ? (real.result === m.consensus_pick) : null
          const phase     = phaseMap[m.match_id] ?? 'standings'
          return { ...m, home_team, away_team, actual_result: real.result, consensus_hit: hit, phase }
        })
        enrichedMatches = enriched
        const completed = enriched.filter(m => m.actual_result != null)
        upcomingMatches = enriched
          .filter(m => m.actual_result === null && m.home_team && m.away_team && m.home_team !== 'TBD' && m.away_team !== 'TBD')
          .sort((a, b) => a.match_id - b.match_id)
          .slice(0, 5)
        if (completed.length === 0) {
          consensoStats = { empty: true, totalMatches: cMatches.length }
        } else {
          const precision    = completed.filter(m => m.consensus_hit).length / completed.length * 100
          const avgConsensus = enriched.reduce((s, m) => s + m.consensus_strength, 0) / enriched.length
          const divididos    = enriched.filter(m => m.consensus_strength < 42).length
          const unanimes     = enriched.filter(m => m.consensus_strength === 100).length
          const sorted       = [...completed].sort((a, b) => a.consensus_strength - b.consensus_strength)
          const topDivided   = sorted.slice(0, 5)
          const topUnanimous = [...completed].sort((a, b) => b.consensus_strength - a.consensus_strength).slice(0, 5)
          consensoStats = { empty: false, precision, avgConsensus, divididos, unanimes, topDivided, topUnanimous, mostDivisive: sorted[0] ?? null, mostUnanimous: topUnanimous[0] ?? null }
        }
      }

      const koList      = Array.isArray(koResults) ? koResults : []
      const nextMatch   = koList.find(m => m.home_goals === null || m.home_goals === undefined)
      const lastMatch   = koList.length > 0 ? koList[koList.length - 1] : null
      const matchToShow = nextMatch ?? lastMatch
      const isUpcoming  = !!nextMatch
      const matchToShowMeta = matchToShow ? (metaMap[matchToShow.match_id] ?? null) : null

      const hasResults = (groupResults ?? []).some(m => m.status === 'final' || m.home_goals != null)

      setData({
        lb, efMap, teamIso2,
        avgPrecGen, avgEfic, avgMarcadores, avgAvance,
        avgPhaseAccuracy,
        champList, archetypeCounts, archRegistry: registry,
        totalUsers: lb.length,
        matchToShow, isUpcoming, matchToShowMeta,
        consensoStats, hasResults, upcomingMatches, enrichedMatches,
      })
    }
    load()
  }, [])

  if (!data) return <LoadingState />

  const {
    lb, efMap, teamIso2,
    avgPrecGen, avgEfic, avgMarcadores, avgAvance,
    avgPhaseAccuracy,
    champList, archetypeCounts, archRegistry, totalUsers,
    matchToShow, isUpcoming, matchToShowMeta,
    consensoStats, hasResults, upcomingMatches, enrichedMatches,
  } = data

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: 56 }}
    >
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.6rem' : '2.1rem', fontWeight: 900, color: 'var(--color-text-1)', letterSpacing: '0.06em', lineHeight: 1 }}>
            ANALYTICS
          </h1>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', letterSpacing: '0.06em' }}>/ QMF 2026</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block', flexShrink: 0 }} />
          Inteligencia competitiva en tiempo real
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <AnalyticsTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ══ OVERVIEW ═════════════════════════════════════════════════════════ */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Fila 1: [Estado del Torneo] [Próximo Partido] [Campeón del Pueblo] */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
            <EstadoTorneo lb={lb} efMap={efMap} isMobile={isMobile} compact />
            <ProximoPartido matchToShow={matchToShow} isUpcoming={isUpcoming} teamIso2={teamIso2} matchMeta={matchToShowMeta} isMobile={isMobile} />
            <CampeonDelPueblo champList={champList} teamIso2={teamIso2} isMobile={isMobile} />
          </div>

          {/* Fila 2: Métricas Destacadas — full width, 6 cards en 1 fila */}
          <MetricasDestacadas lb={lb} avgPrecGen={avgPrecGen} avgEfic={avgEfic} avgMarcadores={avgMarcadores} avgAvance={avgAvance} isMobile={isMobile} hasResults={hasResults} />

          {/* Fila 3: Mente Colectiva — full width */}
          <MenteColectiva consensoStats={consensoStats} teamIso2={teamIso2} isMobile={isMobile} />

        </div>
      )}

      {/* ══ COMPETITIVE DNA ═══════════════════════════════════════════════ */}
      {activeTab === 'Competitive DNA' && (
        <CompetitiveDnaTab
          lb={lb}
          archetypeCounts={archetypeCounts}
          archRegistry={archRegistry}
          totalUsers={totalUsers}
          consensoStats={consensoStats}
          avgPhaseAccuracy={avgPhaseAccuracy}
          hasResults={hasResults}
          enrichedMatches={enrichedMatches}
          champList={champList}
          avgEfic={avgEfic}
          avgPrecGen={avgPrecGen}
        />
      )}

      {/* ══ MENTE COLECTIVA ═══════════════════════════════════════════════ */}
      {activeTab === 'Mente Colectiva' && (
        <MenteColectivaTab enrichedMatches={enrichedMatches} teamIso2={teamIso2} consensoStats={consensoStats} />
      )}
    </motion.div>
  )
}
