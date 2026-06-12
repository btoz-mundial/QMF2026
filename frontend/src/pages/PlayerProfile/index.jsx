import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ChevronUp, ChevronDown, Minus,
  Trophy, Check, X, Target, GitMerge, Crown,
} from 'lucide-react'
import { usePlayerProfile } from '@/hooks/usePlayerProfile'
import { flagUrl, getTeam } from '@/utils/teams'
import BracketAuditSection from './BracketAuditSection'
import ScoringAuditability from './ScoringAuditability'

// ─── Constants ─────────────────────────────────────────────────────────────────

const USER_COLORS = [
  '#00D4FF','#FFB800','#00E676','#FF3D57',
  '#A78BFA','#F472B6','#34D399','#FB923C',
  '#60A5FA','#E879F9','#FBBF24','#4ADE80','#F87171',
]

const RARITY_LABELS = {
  elite:         'ÉLITE',
  rare:          'DESTACADO',
  uncommon_rare: 'DESTACADO',
}

const PHASE_LABELS = {
  group:     'Grupos',
  standings: 'Tabla',
  knockout:  'Knockout',
}

function classificationCutoff(total) { return Math.round(total / 5) }
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function userColor(rank) { return USER_COLORS[(rank - 1) % USER_COLORS.length] }

// ─── Responsive hook ───────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ─── Shared atoms ──────────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '1.5rem',
      marginBottom: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.58rem',
      fontFamily: 'var(--font-mono)',
      color: 'var(--color-text-3)',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '0.875rem',
    }}>
      {children}
    </div>
  )
}

function MovementChip({ movement, delta, large = false }) {
  const size = large ? 14 : 12
  const fontSize = large ? '0.85rem' : '0.72rem'
  if (!movement || movement === 'same' || delta === 0)
    return <span style={{ display:'flex', alignItems:'center', gap:2, color:'var(--color-text-3)', fontSize, fontFamily:'var(--font-mono)' }}><Minus size={size} /></span>
  if (movement === 'up')
    return <span style={{ display:'flex', alignItems:'center', gap:2, color:'#00E676', fontSize, fontFamily:'var(--font-mono)', fontWeight:700 }}>
      <ChevronUp size={size} strokeWidth={3} />+{delta}
    </span>
  return <span style={{ display:'flex', alignItems:'center', gap:2, color:'#FF3D57', fontSize, fontFamily:'var(--font-mono)', fontWeight:700 }}>
    <ChevronDown size={size} strokeWidth={3} />-{Math.abs(delta)}
  </span>
}

function BreakdownBar({ breakdown, total }) {
  if (!breakdown || !total) return null
  const segments = [
    { key:'group',     color:'#00D4FF', label:'Grupos'   },
    { key:'standings', color:'#FFB800', label:'Tabla'    },
    { key:'knockout',  color:'#00E676', label:'Knockout' },
    { key:'bonus',     color:'#A78BFA', label:'Bonus'    },
  ]
  return (
    <div>
      <div style={{ display:'flex', height:5, borderRadius:3, overflow:'hidden', gap:1 }}>
        {segments.map(s => {
          const raw = breakdown[s.key] ?? 0
          const val = typeof raw === 'object' ? (raw?.total ?? 0) : raw
          const pct = total > 0 ? (val / total) * 100 : 0
          return pct > 0 ? <div key={s.key} style={{ width:`${pct}%`, background:s.color, borderRadius:3 }} /> : null
        })}
      </div>
      <div style={{ display:'flex', gap:'0.625rem', marginTop:'0.375rem', flexWrap:'wrap' }}>
        {segments.map(s => {
          const raw = breakdown[s.key] ?? 0
          // bonus is stored as {total, detail} — extract numeric total
          const val = typeof raw === 'object' ? (raw?.total ?? 0) : raw
          if (val === 0) return null
          return (
            <span key={s.key} style={{ display:'flex', alignItems:'center', gap:'0.2rem', fontSize:'0.65rem', color:'var(--color-text-3)' }}>
              <span style={{ width:5, height:5, borderRadius:1, background:s.color, flexShrink:0 }} />
              <span style={{ color:'var(--color-text-2)', fontFamily:'var(--font-mono)' }}>{val}</span> {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── HeroIdentitySection ──────────────────────────────────────────────────────
//
// Two-column layout: 38 (stats) / 62 (archetype identity).
// The archetype side is the emotional center of gravity.
// Typography scale creates the hierarchy — no illustrations, no gradients.

function HeroIdentitySection({ leaderboard, payoutEntry, totalParticipants, snapUser, archetype, traits, allLeaderboard, notStarted, alphaRank }) {
  const isMobile = useIsMobile(680)
  const rank    = leaderboard?.rank ?? '-'
  const cutoff  = classificationCutoff(totalParticipants)
  // Pre-tournament: no real ranking/zone exists yet — everything neutral
  const inZone  = !notStarted && typeof rank === 'number' && rank <= cutoff
  const displayRank = notStarted ? (alphaRank ?? '—') : rank
  const isGold  = !notStarted && rank === 1

  // Points gaps — informational context (suppressed pre-tournament)
  const allLB_h      = allLeaderboard ?? []
  const leaderPts    = allLB_h.find(u => u.rank === 1)?.total_points ?? null
  const zonePts      = allLB_h.find(u => u.rank === cutoff)?.total_points ?? null
  const myPts        = leaderboard?.total_points ?? 0
  const gapToLeader  = !notStarted && rank !== 1 && leaderPts != null ? leaderPts - myPts : null
  const gapToZone    = !notStarted && !inZone && zonePts != null ? Math.max(0, zonePts - myPts) : null
  const bubble  = !notStarted && typeof rank === 'number' && (rank === cutoff + 1 || rank === cutoff + 2)
  const color   = notStarted ? 'var(--color-text-2)' : (typeof rank === 'number' ? userColor(rank) : 'var(--color-text-2)')

  const borderColor = notStarted
    ? 'var(--color-border)'
    : rank === 1
    ? 'rgba(255,184,0,0.35)'
    : rank <= 3  ? 'rgba(192,192,192,0.2)'
    : inZone     ? 'rgba(0,230,118,0.2)'
    : 'var(--color-border)'

  const visibleTraits = (traits ?? []).slice(0, 3)
  const rarityLabel   = archetype ? (RARITY_LABELS[archetype.rarity_tier] ?? null) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '38fr 62fr',
        background: 'var(--color-surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        marginBottom: '1.5rem',
        minHeight: isMobile ? 'auto' : 220,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── LEFT: Ranking / Performance ─────────────────────────── */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
        borderBottom: isMobile ? '1px solid var(--color-border)' : 'none',
      }}>

        {/* Player identity */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: `${color}18`, border: `2px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isGold ? '0 0 20px rgba(255,184,0,0.16)' : 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color }}>
              {getInitials(leaderboard?.display_name)}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.75rem', color: 'var(--color-text-1)', letterSpacing: '0.02em', margin: 0, lineHeight: 1.2 }}>
                {leaderboard?.display_name}
              </h2>
              <MovementChip movement={snapUser?.movement} delta={snapUser?.rank_delta} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text-3)' }}>
                #{displayRank} de {totalParticipants}
              </span>
              {notStarted && (
                <span style={{ fontSize: '0.57rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '0.1rem 0.4rem', borderRadius: 20 }}>
                  Sin posición aún
                </span>
              )}
              {inZone && (
                <span style={{ fontSize: '0.57rem', fontFamily: 'var(--font-mono)', color: '#FFB800', background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: 20 }}>
                  ★ Zona
                </span>
              )}
              {bubble && (
                <span style={{ fontSize: '0.57rem', fontFamily: 'var(--font-mono)', color: '#3cb5fb', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', padding: '0.1rem 0.4rem', borderRadius: 20 }}>
                  ⚡ Burbuja
                </span>
              )}
              {payoutEntry?.prize > 0 && (
                <span style={{ fontSize: '0.57rem', fontFamily: 'var(--font-mono)', color: '#00E676', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', padding: '0.1rem 0.4rem', borderRadius: 20 }}>
                  ${payoutEntry.prize.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Points + breakdown */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.75rem' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '2.5rem' : '3.25rem',
              lineHeight: 1,
              color: isGold ? '#FFB800' : 'var(--color-text-1)',
              letterSpacing: '0.01em',
            }}>
              {leaderboard?.total_points}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              pts
            </span>
          </div>
          {/* Points context — gap to leader and prize zone */}
          {(rank !== 1 || inZone) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem', marginBottom: '0.65rem' }}>
              {rank !== 1 && gapToLeader != null && gapToLeader > 0 && (
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', lineHeight: 1.3 }}>
                  <span style={{ color: '#FBBF24', fontWeight: 700 }}>+{gapToLeader}</span>
                  {' pts para '}<span style={{ color: '#FBBF24' }}>#1</span>
                </div>
              )}
              {inZone ? (
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#00E676', opacity: 0.80, lineHeight: 1.3 }}>
                  En zona de premios
                </div>
              ) : gapToZone != null && (
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', lineHeight: 1.3 }}>
                  <span style={{ color: '#00E676', fontWeight: 700 }}>+{gapToZone}</span>
                  {' pts para zona de premios'}
                </div>
              )}
            </div>
          )}

          {leaderboard?.breakdown && (
            <BreakdownBar breakdown={leaderboard.breakdown} total={leaderboard.total_points} />
          )}
        </div>

      </div>

      {/* ── RIGHT: Archetype Identity ─────────────────────────────── */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.75rem 2rem 1.75rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.625rem',
        position: 'relative',
      }}>

        {/* Archetype emblem — atmospheric, top-right */}
        {archetype?.asset && !isMobile && (
          <img
            src={`${import.meta.env.BASE_URL}${archetype.asset}`}
            alt=""
            draggable={false}
            style={{
              position:      'absolute',
              top:           '1rem',
              right:         '3.25rem',
              width:        180,
              height:        180,
              objectFit:     'contain',
              opacity:       0.9,
              userSelect:    'none',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* System label */}
        <div style={{
          fontSize: '0.58rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-3)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: '0.125rem',
        }}>
          Tu Identidad Competitiva
        </div>

        {archetype ? (
          <>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '1.5rem' : '2rem',
              lineHeight: 1.15,
              color: 'var(--color-primary)',
              fontWeight: 700,
              letterSpacing: '0.01em',
            }}>
              {archetype.display_name}
            </div>

            <div style={{
              fontSize: '0.92rem',
              fontStyle: 'italic',
              color: 'var(--color-text-1)',
              lineHeight: 1.55,
            }}>
              "{archetype.identity_formula}"
            </div>

            <div style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-3)',
              lineHeight: 1.55,
            }}>
              {archetype.short_description}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {visibleTraits.map(t => (
                  <span key={t.id} style={{
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-3)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: 8,
                  }}>
                    {t.label}
                  </span>
                ))}
              </div>
              {rarityLabel && (
                <span style={{
                  fontSize: '1rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.12em',
                  color: 'var(--color-text-3)',
                  flexShrink: 0,
                  marginRight: '-1.4rem',
                  transform: 'translateY(1.7rem)',
                }}>
                  {rarityLabel}
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', opacity: 0.50 }}>
            <svg viewBox="0 0 72 72" width="54" height="54" style={{ display: 'block', overflow: 'visible' }}>
              <circle cx="36" cy="36" r="33" fill="none" stroke="#3B82F6" strokeWidth="0.7" opacity="0.10" />
              <circle cx="36" cy="36" r="24" fill="none" stroke="#3B82F6" strokeWidth="0.7" opacity="0.18" />
              <circle cx="36" cy="36" r="15" fill="none" stroke="#3B82F6" strokeWidth="0.7" opacity="0.26" />
              <circle cx="36" cy="36" r="6"  fill="#3B82F6" opacity="0.10" />
              <circle cx="36" cy="36" r="2.8" fill="#3B82F6" opacity="0.48" />
            </svg>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', lineHeight: 1.65, maxWidth: '22ch' }}>
              El torneo aún no revela tu identidad.
            </div>
          </div>
        )}

      </div>

      {isGold && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at top left, rgba(255,184,0,0.05), transparent 55%)',
        }} />
      )}

    </motion.div>
  )
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const TAB_LIST = [
  { key: 'resumen',     label: 'Resumen',              shortLabel: 'Resumen'   },
  { key: 'predictions', label: 'Pronósticos',         shortLabel: 'Pron.'   },
  { key: 'timeline',    label: 'Línea de Tiempo',      shortLabel: 'Timeline' },
  { key: 'auditoria',   label: 'Scoring & Auditability', shortLabel: 'Scoring' },
]

function Tabs({ active, onChange }) {
  const isMobile = useIsMobile(680)
  return (
    <div style={{ display:'flex', gap:4, background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:10, padding:4, marginBottom:'1.75rem' }}>
      {TAB_LIST.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)} style={{
          flex:1, padding:'0.5rem', borderRadius:7, border:'none', cursor:'pointer',
          background: active === tab.key ? 'var(--color-surface-2)' : 'transparent',
          color: active === tab.key ? 'var(--color-text-1)' : 'var(--color-text-3)',
          fontFamily:'var(--font-body)', fontSize: isMobile ? '0.7rem' : '0.82rem', fontWeight: active === tab.key ? 600 : 400,
          transition:'all 0.15s',
          borderBottom: active === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {isMobile ? tab.shortLabel : tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Sub-tab system (Pronósticos) ────────────────────────────────────────────

function SubTabs({ active, onChange }) {
  const tabs = [
    { key: 'grupos',  label: 'Grupos'  },
    { key: 'tabla',   label: 'Tabla'   },
    { key: 'bracket', label: 'Bracket' },
  ]
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '0.375rem 0.875rem',
            border: 'none',
            borderBottom: active === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            fontWeight: active === t.key ? 600 : 400,
            color: active === t.key ? 'var(--color-text-1)' : 'var(--color-text-3)',
            transition: 'all 0.15s',
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── TournamentStateCard — Player Field ───────────────────────────────────────
//
// Every participant visible. The tournament exists around the player.
// Zone = gold territory. Player mark = dominant. Ghost = best historical.
// Density communicates competition before any label is read.

function TournamentStateCard({ leaderboard, metrics, totalParticipants, snapshots, userId, notStarted, alphaRank }) {
  // Pre-tournament: no positions exist yet — show a neutral preparation state
  if (notStarted) {
    return (
      <Card style={{ padding: '1rem 1.75rem 1.25rem', marginBottom: '1rem' }}>
        <SectionLabel>Estado del Torneo</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Fase de Preparación
          </span>
          <span style={{ color: 'var(--color-border)', fontSize: '0.75rem' }}>|</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-3)' }}>
            orden alfabético <span style={{ color: 'var(--color-text-2)', fontWeight: 700 }}>#{alphaRank ?? '—'}</span> de {totalParticipants}
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Tus pronósticos están registradas. Tu posición aparecerá cuando comience el torneo.
        </p>
      </Card>
    )
  }

  const rank      = leaderboard?.rank
  const cutoff    = classificationCutoff(totalParticipants)
  const inZone    = typeof rank === 'number' && rank <= cutoff
  const gapToZone = typeof rank === 'number' && !inZone ? rank - cutoff : 0

  const NOISE_WINDOW            = 12  // First 12 matches = statistical noise window
  const extra                   = metrics?.metrics?.consistencia_ranking?.extra ?? {}
  const bestRankRaw             = extra.best_rank
  const bestRankMatchId         = extra.best_rank_match_id

  // Compute average rank during M1-M12 from actual snapshot data
  const earlySnaps = (snapshots ?? []).filter(s =>
    s.snapshot_match_id !== '+' && s.snapshot_match_id <= NOISE_WINDOW
  )
  const earlyRanks = earlySnaps
    .map(s => s.users?.find(u => u.user_id === userId)?.rank)
    .filter(r => r != null)
  const earlyAvgRank = earlyRanks.length > 0
    ? earlyRanks.reduce((a, b) => a + b, 0) / earlyRanks.length
    : null

  // Suppress bestRank if it was achieved in the noise window AND wasn't meaningfully
  // better than the player's average rank in that same window (delta < 20% improvement)
  const isNoiseBest = bestRankMatchId != null && bestRankMatchId <= NOISE_WINDOW
  const beatAvgMeaningfully = earlyAvgRank != null && bestRankRaw != null
    ? bestRankRaw < earlyAvgRank * 0.6   // best rank at least 40% better than early average
    : false
  const bestRank = isNoiseBest && !beatAvgMeaningfully ? null : bestRankRaw
  const consecutivePayoutSnaps = extra.consecutive_payout_snapshots ?? 0
  const percentile             = leaderboard?.percentile_general

  const N = totalParticipants || 1

  // ── 100-tick density field ─────────────────────────────────────
  // Always render DENSITY ticks uniformly across the full width.
  // Positions are percentile-based: rank 1 = left, rank N = right.
  // This works for any N — sparse or dense.
  const DENSITY   = 100
  const SVG_W     = 1000
  const SVG_H     = 48       // compact strip — secondary section
  const TICK_STEP = SVG_W / (DENSITY - 1)
  const TICK_W    = 2.5
  const ZONE_H    = SVG_H - 1  // zone ticks: nearly full height — dominant, warm
  const OTHER_H   = Math.round(SVG_H * 0.26)  // neutral ticks: low profile, recede
  const GHOST_H   = Math.round(SVG_H * 0.68)  // ghost: intermediate — phantom presence

  // Convert rank → x via percentile (rank 1 = x=0, rank N = x=SVG_W)
  function rankToX(r) {
    if (N <= 1) return SVG_W / 2
    return ((r - 1) / (N - 1)) * SVG_W
  }

  const zoneBoundX = rankToX(cutoff)
  const playerX    = typeof rank === 'number'    ? rankToX(rank)     : null
  const ghostX     = typeof bestRank === 'number' && bestRank !== rank ? rankToX(bestRank) : null

  return (
    <Card style={{
      padding:    '1rem 1.75rem 1rem',
      borderLeft: inZone ? '3px solid rgba(255,184,0,0.45)' : undefined,
      marginBottom: '1rem',
    }}>
      <SectionLabel>Estado del Torneo</SectionLabel>

      {/* ── DENSITY FIELD ── */}
      <div style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem', userSelect: 'none' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {/* Zone territory fill */}
          <rect
            x={0} y={0}
            width={zoneBoundX}
            height={SVG_H}
            fill="rgba(255,184,0,0.08)"
          />

          {/* 100 uniform ticks */}
          {Array.from({ length: DENSITY }, (_, i) => {
            const tickX = i * TICK_STEP
            const inZ   = tickX <= zoneBoundX
            // Skip space reserved for player/ghost markers
            if (playerX !== null && Math.abs(tickX - playerX) < TICK_W * 2.5) return null
            if (ghostX  !== null && Math.abs(tickX - ghostX)  < TICK_W * 2)   return null
            const h = inZ ? ZONE_H : OTHER_H
            const y = SVG_H / 2 - h / 2
            return (
              <rect
                key={i}
                x={tickX - TICK_W / 2}
                y={y}
                width={TICK_W}
                height={h}
                fill={inZ ? 'rgba(255,184,0,0.48)' : 'rgba(100,100,120,0.16)'}
                rx={0.5}
              />
            )
          })}

          {/* Zone boundary dashed line */}
          <line
            x1={zoneBoundX} y1={0}
            x2={zoneBoundX} y2={SVG_H}
            stroke="rgba(255,184,0,0.30)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* Ghost marker — intermediate height, phantom presence */}
          {ghostX !== null && (
            <rect
              x={ghostX - TICK_W / 2 - 1.5}
              y={SVG_H / 2 - GHOST_H / 2}
              width={TICK_W + 3}
              height={GHOST_H}
              fill="rgba(255,184,0,0.06)"
              stroke="rgba(255,184,0,0.42)"
              strokeWidth={1.5}
              strokeDasharray="3 2"
              rx={1.5}
            />
          )}

          {/* Player marker — bloom glow + dominant bar */}
          {playerX !== null && (
            <>
              {/* Outer bloom */}
              <rect
                x={playerX - 10} y={SVG_H / 2 - (SVG_H + 14) / 2}
                width={TICK_W + 20} height={SVG_H + 14}
                fill={inZone ? '#FFB800' : 'var(--color-primary)'}
                fillOpacity={0.07} rx={6}
              />
              {/* Mid bloom */}
              <rect
                x={playerX - 5} y={SVG_H / 2 - (SVG_H + 8) / 2}
                width={TICK_W + 10} height={SVG_H + 8}
                fill={inZone ? '#FFB800' : 'var(--color-primary)'}
                fillOpacity={0.13} rx={4}
              />
              {/* Core — extends slightly beyond SVG bounds */}
              <rect
                x={playerX - TICK_W / 2 - 1}
                y={-4}
                width={TICK_W + 4}
                height={SVG_H + 8}
                style={{ fill: inZone ? '#FFB800' : 'var(--color-primary)' }}
                rx={2}
              />
            </>
          )}

          {/* "ZONA DE PREMIO" label — above zone */}
          <text
            x={Math.min(zoneBoundX / 2, zoneBoundX - 4)}
            y={-18}
            textAnchor="middle"
            fontSize={7.5}
            fill="rgba(255,184,0,0.62)"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}
          >
            ZONA DE PREMIO
          </text>
          <text
            x={Math.min(zoneBoundX / 2, zoneBoundX - 4)}
            y={-8}
            textAnchor="middle"
            fontSize={6.5}
            fill="rgba(255,184,0,0.38)"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1 }}
          >
            TOP {cutoff}
          </text>

          {/* Ghost labels — above and below */}
          {ghostX !== null && (
            <>
              <text
                x={ghostX} y={-18}
                textAnchor="middle" fontSize={7.5}
                fill="rgba(255,184,0,0.45)"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}
              >
                MEJOR POSICIÓN
              </text>
              <text
                x={ghostX} y={SVG_H + 14}
                textAnchor="middle" fontSize={9}
                fill="rgba(255,184,0,0.45)"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                #{bestRank}
              </text>
            </>
          )}

          {/* Player labels — above and below */}
          {playerX !== null && (
            <>
              <text
                x={playerX} y={-18}
                textAnchor="middle" fontSize={9} fontWeight={700}
                style={{ fill: inZone ? '#FFB800' : 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
              >
                TÚ
              </text>
              <text
                x={playerX} y={SVG_H + 14}
                textAnchor="middle" fontSize={9} fontWeight={700}
                style={{ fill: inZone ? '#FFB800' : 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
              >
                #{rank}
              </text>
            </>
          )}

        </svg>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.75rem' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize:   '2.25rem',
            lineHeight: 1,
            color:      rank === 1 ? '#FFB800' : 'var(--color-text-1)',
          }}>
            #{rank ?? '—'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-text-3)' }}>
            de {N}
          </span>
        </div>

        <span style={{ color: 'var(--color-border)', fontSize: '0.75rem', flexShrink: 0 }}>|</span>

        {percentile != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-3)' }}>
            Percentil <span style={{ color: 'var(--color-text-2)', fontWeight: 700 }}>{percentile}</span>
          </span>
        )}

        {percentile != null && <span style={{ color: 'var(--color-border)', fontSize: '0.75rem', flexShrink: 0 }}>|</span>}

        {inZone ? (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
            color: '#FFB800', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            ★ En Zona
            {consecutivePayoutSnaps > 1 && (
              <span style={{ fontWeight: 400, fontSize: '0.6rem', marginLeft: '0.375rem' }}>
                · {consecutivePayoutSnaps} snapshots
              </span>
            )}
          </span>
        ) : gapToZone > 0 ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-3)' }}>
            A <span style={{ color: 'var(--color-text-2)', fontWeight: 700 }}>{gapToZone}</span>{' '}
            posición{gapToZone > 1 ? 'es' : ''} de zona de premios
          </span>
        ) : null}

        {bestRank != null && <span style={{ color: 'var(--color-border)', fontSize: '0.75rem', flexShrink: 0 }}>|</span>}

        {bestRank != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-3)' }}>
            Mejor:{' '}
            <span style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
              #{bestRank}
            </span>
            {bestRankMatchId != null && (
              <span style={{ fontSize: '0.58rem', marginLeft: '0.25rem' }}>
                M{bestRankMatchId}
              </span>
            )}
          </span>
        )}

      </div>
    </Card>
  )
}

// ─── PhasePerformanceCard — Territory Visualization ──────────────────────────────
//
// Three colored territory sections, each showing:
//   snapshot count  →  waveform sparkline  →  phase name + subtitle  →  efficiency %  →  editorial caption
// Dominant phase has warmth treatment. No Card wrapper — raw border.
// Data: eficiencia_de_puntos.extra.stage_breakdown + precision_general.extra.category_breakdown

function seededRng(seed) {
  let s = ((seed | 0) ^ 2654435761) >>> 0
  return () => {
    s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0)
    s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0)
    s ^= (s >>> 16)
    return (s >>> 0) / 0xffffffff
  }
}

function buildWavePoints(count, efficiency, volatility, seed, svgW, svgH) {
  if (count <= 1) {
    return [{ x: svgW / 2, y: Math.max(8, Math.min(svgH - 8, svgH * (1 - efficiency / 100))) }]
  }
  const rng  = seededRng(seed)
  const base = efficiency / 100
  let raw = Array.from({ length: count }, () =>
    Math.max(0.06, Math.min(0.94, base + (rng() - 0.5) * volatility * 2))
  )
  // One light smoothing pass — preserve amplitude, just remove harsh spikes
  const win = Math.max(1, Math.floor(count / 20))
  const copy = raw.slice()
  raw = copy.map((_, i) => {
    let sum = 0, n = 0
    for (let j = Math.max(0, i - win); j <= Math.min(copy.length - 1, i + win); j++) {
      sum += copy[j]; n++
    }
    return sum / n
  })
  return raw.map((y, i) => ({ x: (i / (count - 1)) * svgW, y: svgH * (1 - y) }))
}

const PHASE_COLORS = { group: '#3B82F6', standings: '#F59E0B', knockout: '#10B981' }
const PHASE_VOL    = { group: 0.65, standings: 0, knockout: 0.42 }

const PHASE_IDENTITY = {
  group: {
    label:    'Grupos',
    subtitle: 'Volatilidad alta · Muchos partidos',
    caption:  'Muchos partidos, Aqui Se construye la base.',
    icon:     '〜',
  },
  standings: {
    label:    'Tabla',
    subtitle: 'Checkpoint perfecto · Precisión total',
    caption:  'Momento de la verdad.',
    icon:     '◉',
  },
  knockout: {
    label:    'Eliminatoria',
    subtitle: 'Presión extrema · Supervivencia',
    caption:  'Cada partido elimina. Aquí se define la gloria.',
    icon:     '⚡',
  },
}

function PhaseWaveform({ count, efficiency, volatility, color, seed, isStandings }) {
  const SVG_W = 400, SVG_H = 92
  if (isStandings) {
    const cy = Math.max(10, Math.min(SVG_H - 10, SVG_H * (1 - efficiency / 100)))
    // Plateau fill: flat area from cy to bottom — mimics a horizontal waveform locked at efficiency level
    const plateauPath = `M 0,${SVG_H} L 0,${cy} L ${SVG_W},${cy} L ${SVG_W},${SVG_H} Z`
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
        {/* Flat plateau fill — the checkpoint has no variation, only absolute truth */}
        <path d={plateauPath} fill={color} fillOpacity={0.22} />
        {/* Flat horizon line */}
        <line x1={0} y1={cy} x2={SVG_W} y2={cy}
          stroke={color} strokeOpacity={0.7} strokeWidth={2} />
        {/* Center anchor dot */}
        <circle cx={SVG_W/2} cy={cy} r={16} fill={color} fillOpacity={0.06} />
        <circle cx={SVG_W/2} cy={cy} r={7}  fill={color} fillOpacity={0.18} />
        <circle cx={SVG_W/2} cy={cy} r={4}  fill={color} fillOpacity={0.95} />
      </svg>
    )
  }
  const pts = buildWavePoints(count, efficiency, volatility, seed, SVG_W, SVG_H)
  if (!pts.length) return null
  const first = pts[0], last = pts[pts.length - 1]
  let fillD   = `M ${first.x},${SVG_H} L ${first.x},${first.y}`
  let strokeD = `M ${first.x},${first.y}`
  pts.slice(1).forEach(p => { fillD += ` L ${p.x},${p.y}`; strokeD += ` L ${p.x},${p.y}` })
  fillD += ` L ${last.x},${SVG_H} Z`
  const step   = Math.max(1, Math.floor(pts.length / 18))
  const dotPts = pts.filter((_, i) => i % step === 0)
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
      <path d={fillD}   fill={color} fillOpacity={0.28} />
      <path d={strokeD} stroke={color} strokeWidth={2} strokeOpacity={0.85} fill="none" />
      {dotPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} fillOpacity={0.85} />
      ))}
    </svg>
  )
}

function PhasePerformanceCard({ metrics, snapshots, userId, totalParticipants }) {
  const isMobile = useIsMobile(680)
  const efExtra = metrics?.metrics?.eficiencia_de_puntos?.extra
  const pgExtra = metrics?.metrics?.precision_general?.extra

  if (!efExtra?.stage_breakdown) return null

  const stageBreakdown = efExtra.stage_breakdown
  const bestCategory   = pgExtra?.best_category ?? null
  const N              = totalParticipants || 1

  // Efficiency labels (kept for bottom band)
  const earnedG = stageBreakdown.group?.earned        ?? 0
  const availG  = stageBreakdown.group?.available     ?? 72
  const earnedS = stageBreakdown.standings?.earned    ?? 0
  const availS  = stageBreakdown.standings?.available ?? 120
  const earnedK = stageBreakdown.knockout?.earned     ?? 0
  const availK  = stageBreakdown.knockout?.available  ?? 192
  const cumEffG   = availG  > 0 ? (earnedG / availG) * 100 : 0
  const cumEffGS  = (availG + availS)  > 0 ? ((earnedG + earnedS) / (availG + availS)) * 100 : cumEffG
  const cumEffAll = (availG + availS + availK) > 0 ? ((earnedG + earnedS + earnedK) / (availG + availS + availK)) * 100 : cumEffGS

  // ── Real rank trajectory from snapshots ─────────────────────────
  const userLine = (snapshots ?? [])
    .filter(s => s.snapshot_match_id !== '+')
    .map(s => {
      const u = s.users?.find(u => u.user_id === userId)
      if (!u) return null
      return { idx: s.snapshot_index, matchId: s.snapshot_match_id, stage: s.stage ?? 'group', rank: u.rank }
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx)

  const gLine = userLine.filter(p => p.stage === 'group')
  const sLine = userLine.filter(p => p.stage === 'standings')
  const kLine = userLine.filter(p => p.stage === 'knockout')

  const snapG = gLine.length || availG
  const snapS = sLine.length || 1
  const snapK = kLine.length || Math.round(availK / 6)

  // ── SVG layout ──────────────────────────────────────────────────
  const SVG_W   = 1000
  const SVG_H   = 220
  const PAD_T   = 26
  const PAD_B   = 62
  const usableH = SVG_H - PAD_T - PAD_B
  const base    = PAD_T + usableH

  const G_W     = 500
  const S_W     = 120
  const K_W     = 380
  const G_END   = G_W
  const S_START = G_W,  S_END = G_W + S_W
  const K_START = G_W + S_W

  // Y scale: rank → y (rank 1 = top, rank N = bottom)
  const rankToY = r => PAD_T + ((r - 1) / Math.max(1, N - 1)) * usableH

  // ── Map real data to SVG coords ─────────────────────────────────
  // If no real data yet, fall back to a synthetic single point derived from efficiency
  const effToRank = eff => Math.round(N * (1 - Math.max(0, Math.min(100, eff)) / 100)) || 1

  const mapPhase = (line, xStart, xWidth) =>
    line.length === 0 ? [] :
    line.length === 1 ? [{ x: xStart + xWidth / 2, y: rankToY(line[0].rank) }] :
    line.map((p, i) => ({ x: xStart + (i / (line.length - 1)) * xWidth, y: rankToY(p.rank) }))

  const gPts = gLine.length
    ? mapPhase(gLine, 0, G_W)
    : [{ x: 0, y: rankToY(effToRank(cumEffG)) }, { x: G_W, y: rankToY(effToRank(cumEffG)) }]

  // Standings bridge point — single dot at center of S zone
  const standRank = sLine.length ? sLine[0].rank : effToRank(cumEffGS)
  const standY    = rankToY(standRank)
  const standDotX = S_START + S_W / 2

  const kPts = kLine.length
    ? mapPhase(kLine, K_START, K_W)
    : [{ x: K_START, y: rankToY(effToRank(cumEffAll)) }, { x: SVG_W, y: rankToY(effToRank(cumEffAll)) }]

  const gFirst = gPts[0]
  const gLast  = gPts[gPts.length - 1]
  const kFirst = kPts[0]

  // ── Fill paths ─────────────────────────────────────────────────
  // Both fills meet at standDotX so there's no gap in the standings zone
  let gFillD = `M 0,${base} L ${gFirst.x},${gFirst.y}`
  gPts.slice(1).forEach(p => { gFillD += ` L ${p.x},${p.y}` })
  gFillD += ` L ${standDotX},${standY} L ${standDotX},${base} Z`

  let kFillD = `M ${standDotX},${base} L ${standDotX},${standY} L ${kFirst.x},${kFirst.y}`
  kPts.slice(1).forEach(p => { kFillD += ` L ${p.x},${p.y}` })
  kFillD += ` L ${SVG_W},${base} Z`

  // ── Stroke: single continuous path, colored per phase ───────────
  // Group segment
  let gStrokeD = `M ${gFirst.x},${gFirst.y}`
  gPts.slice(1).forEach(p => { gStrokeD += ` L ${p.x},${p.y}` })
  // bridge: last group → standings dot
  gStrokeD += ` L ${standDotX},${standY}`

  // Knockout: standings dot → first KO point → rest
  let kStrokeD = `M ${standDotX},${standY} L ${kFirst.x},${kFirst.y}`
  kPts.slice(1).forEach(p => { kStrokeD += ` L ${p.x},${p.y}` })

  // ── Dots ────────────────────────────────────────────────────────
  const gStep = Math.max(1, Math.floor(gPts.length / 20))
  const gDots = gPts.filter((_, i) => i % gStep === 0)
  const kStep = Math.max(1, Math.floor(kPts.length / 16))
  const kDots = kPts.filter((_, i) => i % kStep === 0)

  const COLORS = PHASE_COLORS
  const isDom  = { group: bestCategory === 'group', standings: bestCategory === 'standings', knockout: bestCategory === 'knockout' }

  const PHASES_META = [
    { key: 'group',     x: G_W / 2,          label: PHASE_IDENTITY.group.label,     eff: cumEffG,   snaps: snapG, color: COLORS.group,     dom: isDom.group     },
    { key: 'standings', x: S_START + S_W / 2, label: PHASE_IDENTITY.standings.label, eff: cumEffGS,  snaps: snapS, color: COLORS.standings, dom: isDom.standings },
    { key: 'knockout',  x: K_START + K_W / 2, label: PHASE_IDENTITY.knockout.label,  eff: cumEffAll, snaps: snapK, color: COLORS.knockout,  dom: isDom.knockout  },
  ]

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <SectionLabel>Por Fase</SectionLabel>

      <div style={{
        border:       '1px solid var(--color-border)',
        borderRadius: 12,
        overflow:     'hidden',
        background:   'var(--color-surface)',
      }}>

        {/* ── Single unified waveform SVG ───────────────────────── */}
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>

          {/* Surface */}
          <rect width={SVG_W} height={SVG_H} style={{ fill: 'var(--color-surface)' }} />

          {/* Dominant territory background */}
          {isDom.group     && <rect x={0}       y={0} width={G_W} height={SVG_H} fill={COLORS.group}     fillOpacity={0.06} />}
          {isDom.standings && <rect x={S_START}  y={0} width={S_W} height={SVG_H} fill={COLORS.standings} fillOpacity={0.08} />}
          {isDom.knockout  && <rect x={K_START}  y={0} width={K_W} height={SVG_H} fill={COLORS.knockout}  fillOpacity={0.06} />}

          {/* Phase fills — single continuous area under the trajectory */}
          <path d={gFillD} fill={COLORS.group}    fillOpacity={isDom.group    ? 0.28 : 0.16} />
          <path d={kFillD} fill={COLORS.knockout} fillOpacity={isDom.knockout ? 0.32 : 0.20} />

          {/* Continuous strokes — group in blue, bridge+KO in green */}
          <path d={gStrokeD} stroke={COLORS.group}    strokeWidth={2.2} strokeOpacity={isDom.group    ? 0.92 : 0.65} fill="none" />
          <path d={kStrokeD} stroke={COLORS.knockout} strokeWidth={2.2} strokeOpacity={isDom.knockout ? 0.92 : 0.70} fill="none" />

          {/* Dots on waveforms */}
          {gDots.map((p, i) => <circle key={`g${i}`} cx={p.x} cy={p.y} r={2}   fill={COLORS.group}    fillOpacity={isDom.group    ? 0.88 : 0.55} />)}
          {kDots.map((p, i) => <circle key={`k${i}`} cx={p.x} cy={p.y} r={2}   fill={COLORS.knockout} fillOpacity={isDom.knockout ? 0.88 : 0.55} />)}

          {/* Standings bridge dot — the checkpoint pivot of the story */}
          <circle cx={standDotX} cy={standY} r={18} fill={COLORS.standings} fillOpacity={0.06} />
          <circle cx={standDotX} cy={standY} r={8}  fill={COLORS.standings} fillOpacity={0.18} />
          <circle cx={standDotX} cy={standY} r={4}  fill={COLORS.standings} fillOpacity={1.00} />

          {/* Phase dividers — very subtle */}
          <line x1={G_END}   y1={PAD_T} x2={G_END}   y2={base} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          <line x1={S_END}   y1={PAD_T} x2={S_END}   y2={base} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

          {/* Bottom label band */}
          <rect x={0} y={base} width={SVG_W} height={PAD_B} fill="rgba(0,0,0,0.16)" />

          {/* Snapshot counts — top of each territory */}
          {PHASES_META.map(({ x, snaps, color, dom, key }) => (
            <text
              key={`snap-${key}`} x={x} y={16}
              textAnchor="middle" fontSize={9}
              fill={color} fillOpacity={dom ? 0.95 : 0.52}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: 2 }}
            >
              {snaps} {snaps === 1 ? 'La Tabla' : 'JUEGOS'}
            </text>
          ))}

          {/* Phase names + efficiency */}
          {PHASES_META.map(({ x, label, eff, color, dom, key }) => (
            <g key={`label-${key}`}>
              <text
                x={x} y={base + 24}
                textAnchor="middle" fontSize={15} fontWeight={700}
                fill={color} fillOpacity={dom ? 1 : 0.60}
                style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
              >
                {label}
              </text>
              <text
                x={x} y={base + 46}
                textAnchor="middle" fontSize={14} fontWeight={700}
                fill={color} fillOpacity={dom ? 0.92 : 0.52}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {eff.toFixed(1)}%
              </text>
            </g>
          ))}

        </svg>

        {/* ── Caption row — hidden on mobile (too narrow to read) ── */}
        {!isMobile && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: `${G_W / SVG_W * 100}% ${S_W / SVG_W * 100}% ${K_W / SVG_W * 100}%`,
            borderTop:           '1px solid var(--color-border)',
          }}>
            {PHASES_META.map(({ key, color, dom }, i) => {
              const meta = PHASE_IDENTITY[key]
              return (
                <div key={key} style={{
                  padding:     '0.7rem 0.7rem',
                  borderRight: i < 2 ? '1px solid var(--color-border)' : 'none',
                  display:     'flex',
                  gap:         '0.4rem',
                  alignItems:  'flex-start',
                  opacity:     dom ? 0.92 : 0.52,
                }}>
                  <span style={{ fontSize: '0.72rem', flexShrink: 0, color, lineHeight: 1.4, marginTop: '0.05rem' }}>
                    {meta.icon}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-2)', lineHeight: 1.55, fontFamily: 'var(--font-mono)' }}>
                    {meta.caption}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}


// ─── ApuestasVivas ─────────────────────────────────────────────────────────────
// Reads the full campeon_vivo extra schema:
//   champion / champion_status / champion_eliminated_by_stage        (15 pts)
//   third_place / third_place_status / third_place_eliminated_by_stage (5 pts)
//   finalist1 / finalist1_status / finalist1_eliminated_by_stage
//   finalist2 / finalist2_status / finalist2_eliminated_by_stage
// Priority: Campeón → Tercer Lugar → La Final
// Renders always once pipeline data exists — alive = full presence, eliminated = muted + stage.

const STAGE_LABELS = {
  GROUP: 'fase de grupos',
  R32:   'ronda de 32',
  R16:   'ronda de 16',
  QF:    'cuartos de final',
  SF:    'semifinal',
  F:     'final',
}

// Single bet row: used for Campeón and Tercer Lugar
function ApuestaRow({ label, team, status, stage, teamMap, pointsBadge, large = false }) {
  const isAlive      = status === 'alive'
  const isEliminated = status === 'eliminated'
  const t            = getTeam(team, teamMap)
  const flag         = flagUrl(t?.iso2)
  const stageText    = stage ? (STAGE_LABELS[stage] ?? stage) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

      {/* Left: label + flag + team name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: '0.52rem', fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-3)', letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            {label}
          </span>
          {pointsBadge && (
            <span style={{
              fontSize: '0.5rem', fontFamily: 'var(--font-mono)',
              color: isAlive ? 'var(--color-primary)' : 'var(--color-text-3)',
              letterSpacing: '0.06em',
            }}>
              · {pointsBadge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {flag && (
            <img
              src={flag} alt=""
              style={{
                width: large ? 30 : 22, height: large ? 20 : 14,
                objectFit: 'cover', borderRadius: 2, flexShrink: 0,
                opacity: isAlive ? 1 : 0.35,
              }}
            />
          )}
          <span style={{
            fontFamily:    'var(--font-display)',
            fontSize:      large ? '1.6rem' : '1.1rem',
            lineHeight:    1,
            color:         isAlive ? 'var(--color-text-1)' : 'var(--color-text-3)',
            letterSpacing: '0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {team}
          </span>
        </div>
      </div>

      {/* Right: status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
        {isAlive ? (
          <span style={{
            fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: '#00E676', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            ✓ Vivo
          </span>
        ) : isEliminated ? (
          <>
            <span style={{
              fontSize: '0.63rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Eliminado
            </span>
            {stageText && (
              <span style={{ fontSize: '0.57rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                Cayó en {stageText}
              </span>
            )}
          </>
        ) : null}
      </div>

    </div>
  )
}

// La Final matchup row: finalist1 vs finalist2, each with independent status
function FinalMatchup({ finalist1, finalist1Status, finalist1Stage, finalist2, finalist2Status, finalist2Stage, teamMap }) {
  const f1Alive = finalist1Status === 'alive'
  const f2Alive = finalist2Status === 'alive'
  const f1Team  = getTeam(finalist1, teamMap)
  const f2Team  = getTeam(finalist2, teamMap)
  const f1Flag  = flagUrl(f1Team?.iso2)
  const f2Flag  = flagUrl(f2Team?.iso2)

  function FinalistChip({ flag, name, isAlive, stage }) {
    const isEliminated = !isAlive && stage != null
    const stageText    = stage ? (STAGE_LABELS[stage] ?? stage) : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: isEliminated ? 0.38 : 1 }}>
          {flag && (
            <img src={flag} alt="" style={{ width: 20, height: 13, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
          )}
          <span style={{
            fontSize: '0.82rem', fontFamily: 'var(--font-display)',
            color: isAlive ? 'var(--color-text-2)' : 'var(--color-text-3)',
            lineHeight: 1,
          }}>
            {name}
          </span>
        </div>
        {isEliminated && stageText && (
          <span style={{ fontSize: '0.53rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', paddingLeft: flag ? 28 : 0 }}>
            Cayó en {stageText}
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{
        fontSize: '0.52rem', fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-3)', letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>
        La Final
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        {finalist1 && (
          <FinalistChip flag={f1Flag} name={finalist1} isAlive={f1Alive} stage={finalist1Stage} />
        )}
        <span style={{
          fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-3)', alignSelf: 'center', flexShrink: 0,
        }}>
          vs
        </span>
        {finalist2 && (
          <FinalistChip flag={f2Flag} name={finalist2} isAlive={f2Alive} stage={finalist2Stage} />
        )}
      </div>
    </div>
  )
}

function ChampionAliveCard({ campeonVivo, userId, teamMap }) {
  const isMobile = useIsMobile(680)
  if (!campeonVivo?.users?.length) return null
  const userEntry = campeonVivo.users.find(u => u.user_id === userId)
  if (!userEntry) return null

  const ex = userEntry.extra ?? {}
  const champion      = ex.champion      ?? null
  const champStatus   = ex.champion_status ?? null
  const champStage    = ex.champion_eliminated_by_stage ?? null

  const thirdPlace    = ex.third_place    ?? null
  const thirdStatus   = ex.third_place_status ?? null
  const thirdStage    = ex.third_place_eliminated_by_stage ?? null

  const finalist1     = ex.finalist1     ?? null
  const f1Status      = ex.finalist1_status ?? null
  const f1Stage       = ex.finalist1_eliminated_by_stage ?? null

  const finalist2     = ex.finalist2     ?? null
  const f2Status      = ex.finalist2_status ?? null
  const f2Stage       = ex.finalist2_eliminated_by_stage ?? null

  if (!champion && !thirdPlace && !finalist1 && !finalist2) return null

  const champAlive = champStatus === 'alive'

  return (
    <Card style={{
      padding:    '1.25rem 1.75rem',
      borderLeft: champAlive ? '3px solid rgba(0,230,118,0.4)' : '1px solid var(--color-border)',
    }}>
      <SectionLabel>Apuestas Vivas</SectionLabel>

      {/* ── 3-column horizontal layout: Campeón | Tercer Lugar | La Final ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1px 1fr 1px 1fr',
        alignItems:          'start',
        gap:                 isMobile ? '1rem' : 0,
        marginTop:           '0.125rem',
      }}>

        {/* 1. Campeón — 15 pts */}
        <div style={{ paddingRight: '1.25rem', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
          {champion && (
            <ApuestaRow
              label="Campeón"
              team={champion}
              status={champStatus}
              stage={champStage}
              teamMap={teamMap}
              pointsBadge="15 pts"
              large={true}
            />
          )}
        </div>

        {/* Vertical divider */}
        {!isMobile && <div style={{ background: 'var(--color-border)', alignSelf: 'stretch' }} />}

        {/* 2. Tercer Lugar — 5 pts */}
        <div style={{ padding: isMobile ? '0.25rem 0' : '0.25rem 1.25rem' }}>
          {thirdPlace && (
            <ApuestaRow
              label="Tercer Lugar"
              team={thirdPlace}
              status={thirdStatus}
              stage={thirdStage}
              teamMap={teamMap}
              pointsBadge="5 pts"
              large={false}
            />
          )}
        </div>

        {/* Vertical divider */}
        {!isMobile && <div style={{ background: 'var(--color-border)', alignSelf: 'stretch' }} />}

        {/* 3. La Final */}
        <div style={{ paddingLeft: isMobile ? 0 : '1.25rem', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
          {(finalist1 || finalist2) && (
            <FinalMatchup
              finalist1={finalist1}     finalist1Status={f1Status} finalist1Stage={f1Stage}
              finalist2={finalist2}     finalist2Status={f2Status} finalist2Stage={f2Stage}
              teamMap={teamMap}
            />
          )}
        </div>

      </div>
    </Card>
  )
}

// ─── ResumenTab ────────────────────────────────────────────────────────────────

function ResumenTab({ data }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
      {/* Estado del Torneo — compact positional context strip */}
      <TournamentStateCard
        leaderboard={data.leaderboard}
        metrics={data.metrics}
        totalParticipants={data.totalParticipants}
        snapshots={data.timelineRaceSnapshots}
        userId={data.leaderboard?.user_id}
        notStarted={data.notStarted}
        alphaRank={data.alphaRank}
      />
      {/* Por Fase — hero section, main narrative of the Resumen */}
      <PhasePerformanceCard metrics={data.metrics} snapshots={data.timelineRaceSnapshots} userId={data.leaderboard?.user_id} totalParticipants={data.totalParticipants} />
      {/* ChampionAliveCard: renders only when campeon_vivo pipeline produces data */}
      <ChampionAliveCard campeonVivo={data.campeonVivo} userId={data.leaderboard?.user_id} teamMap={data.teamMap} />
    </motion.div>
  )
}

// ─── TimelineTab ─────────────────────────────────────────────────────────────

// ── Data helpers ──────────────────────────────────────────────────────────────

function tlBuildUserLine(snapshots, userId) {
  const line = []
  for (const s of snapshots) {
    if (s.snapshot_match_id === '+') continue
    const u = s.users.find(u => u.user_id === userId)
    if (!u) continue
    line.push({
      idx: s.snapshot_index, matchId: s.snapshot_match_id, stage: s.stage,
      rank: u.rank, delta: u.rank_delta, movement: u.movement, pts: u.total_points,
    })
  }
  return line
}

function tlBuildAllLines(snapshots) {
  const map = {}
  for (const s of snapshots) {
    if (s.snapshot_match_id === '+') continue
    for (const u of s.users) {
      if (!map[u.user_id]) map[u.user_id] = []
      map[u.user_id].push({
        idx: s.snapshot_index, matchId: s.snapshot_match_id, stage: s.stage,
        rank: u.rank, delta: u.rank_delta, movement: u.movement, pts: u.total_points,
      })
    }
  }
  return map
}

function tlBuildAverageLine(snapshots) {
  return snapshots.filter(s => s.snapshot_match_id !== '+').map(s => {
    const avg = s.users.reduce((a, u) => a + u.rank, 0) / s.users.length
    return { idx: s.snapshot_index, rank: avg }
  })
}

function tlBuildLeaderLine(snapshots) {
  const filtered = snapshots.filter(s => s.snapshot_match_id !== '+')
  const lastSnap = filtered[filtered.length - 1]
  const leaderId = lastSnap?.users.find(u => u.rank === 1)?.user_id ?? null
  if (!leaderId) return { line: [], uid: null, name: null }
  const line = []
  for (const s of filtered) {
    const u = s.users.find(u => u.user_id === leaderId)
    if (!u) continue
    line.push({ idx: s.snapshot_index, rank: u.rank })
  }
  const name = lastSnap.users.find(u => u.user_id === leaderId)?.display_name ?? null
  return { line, uid: leaderId, name }
}

function tlBuildPackLines(snapshots, packIds) {
  // Fixed pack based on last snapshot — each ID gets its own historical line
  const result = {}
  for (const uid of packIds) {
    result[uid] = tlBuildUserLine(snapshots, uid)
  }
  return result
}

// ── Story analysis ────────────────────────────────────────────────────────────

function tlDetectInflections(userLine, eliteCutoff = 3, max = 5) {
  if (userLine.length < 2) return []
  const events = []
  let wasInTop3 = userLine[0].rank <= eliteCutoff

  for (let i = 1; i < userLine.length; i++) {
    const p      = userLine[i]
    const inTop3 = p.rank <= eliteCutoff
    if (inTop3 && !wasInTop3) {
      events.push({ ...p, label: p.rank === 1 ? 'Liderato' : 'Top ' + eliteCutoff, priority: p.rank === 1 ? 10 : 8, positive: true })
    } else if (!inTop3 && wasInTop3) {
      events.push({ ...p, label: 'Sale', priority: 6, positive: false })
    } else if (p.movement === 'down' && Math.abs(p.delta) >= 3) {
      events.push({ ...p, label: 'Cae', priority: Math.abs(p.delta), positive: false })
    } else if (p.movement === 'up' && Math.abs(p.delta) >= 3) {
      events.push({ ...p, label: 'Sube', priority: Math.abs(p.delta), positive: true })
    }
    wasInTop3 = inTop3
  }

  const bestPt = userLine.reduce((b, p) => p.rank < b.rank ? p : b, userLine[0])
  const bestPtMeaningful = bestPt.snapshot_match_id == null || bestPt.snapshot_match_id >= 12
  if (bestPtMeaningful && !events.some(e => e.idx === bestPt.idx)) {
    events.push({ ...bestPt, label: bestPt.rank === 1 ? 'Liderato' : 'Mejor #' + bestPt.rank, priority: 4, positive: true })
  }

  const sorted = [...events].sort((a, b) => b.priority - a.priority)
  const deduped = []
  for (const ev of sorted) {
    if (!deduped.some(d => Math.abs(d.idx - ev.idx) < 5)) deduped.push(ev)
    if (deduped.length >= max) break
  }
  return deduped
}

// startRank: average rank over matchday 1 snapshot — more stable baseline than snapshot 1
function tlComputeVerdict(userLine, eliteCutoff = 3, startRank = null) {
  if (userLine.length < 2) return null
  const effStart = startRank ?? userLine[0].rank
  const last  = userLine[userLine.length - 1]
  const delta = last.rank - effStart
  const best  = userLine.reduce((b, p) => p.rank < b.rank ? p : b, userLine[0])
  if (last.rank === 1)             return { label: 'LIDERÓ',     color: '#FBBF24', sub: 'Finalizó en el tope' }
  if (last.rank <= eliteCutoff)    return { label: 'DOMINÓ',     color: '#FBBF24', sub: 'Top ' + eliteCutoff + ' al cierre' }
  if (delta <= -4)                 return { label: 'REMONTÓ',    color: '#34D399', sub: '+' + Math.abs(delta) + ' pos ganadas' }
  if (delta <= -2)                 return { label: 'AVANZÓ',     color: '#38BDF8', sub: Math.abs(delta) + ' posiciones arriba' }
  if (delta >= 4)                  return { label: 'COLAPSÓ',    color: '#EF4444', sub: '−' + delta + ' posiciones' }
  if (delta >= 2)                  return { label: 'CAYÓ',       color: '#F97316', sub: delta + ' posiciones abajo' }
  if (best.rank <= eliteCutoff && last.rank > eliteCutoff) return { label: 'SOBREVIVIÓ', color: 'var(--color-text-1)', sub: 'Perdió el top ' + eliteCutoff }
  return                                  { label: 'ESTABLE',    color: '#64748B', sub: 'Trayectoria plana' }
}

// Direction-coded segments: each segment gets color + width based on movement + territory
function tlBuildSegments(userLine, N, eliteCutoff = 3) {
  if (userLine.length < 2) return []
  const danger = Math.ceil(N * 0.65)
  return userLine.slice(1).map((b, i) => {
    const a = userLine[i]
    const rising  = b.rank < a.rank
    const falling = b.rank > a.rank
    const inElite  = a.rank <= 3 || b.rank <= 3
    const inDanger = a.rank > danger || b.rank > danger
    const mag = Math.abs(b.delta || 0)
    let color, width, opacity
    if (rising) {
      color = inElite ? '#FBBF24' : '#34D399'
      width = 1.8 + Math.min(mag * 0.45, 2.0)
      opacity = 1
    } else if (falling) {
      color = inDanger ? '#B85C5C' : '#F87171'
      width = 1.8 + Math.min(mag * 0.45, 2.0)
      opacity = 1
    } else {
      color = inElite ? '#D4A84B' : '#38BDF8'
      width = 1.8
      opacity = 1
    }
    // ── Temporal decay — older moments fade slightly ──
    const ageFactor =
     0.25 + (b.idx / TL_MAX_I) * 0.75

    opacity *= ageFactor
    width *= (0.85 + ageFactor * 0.5)
    
    return { a, b, color, width, opacity }
  })
}

// ── SVG utilities ─────────────────────────────────────────────────────────────

function tlPath(points, xs, ys) {
  let d = '', penDown = false
  for (const p of points) {
    if (p.rank == null) { penDown = false; continue }
    d += (penDown ? 'L' : 'M') + xs(p.idx).toFixed(1) + ',' + ys(p.rank).toFixed(1) + ' '
    penDown = true
  }
  return d.trim()
}

const TL_W = 680, TL_H = 200
const TL_PL = 40, TL_PR = 28, TL_PT = 36, TL_PB = 28
const TL_CW = TL_W - TL_PL - TL_PR
const TL_CH = TL_H - TL_PT - TL_PB
const TL_MIN_I = 1, TL_MAX_I = 104

function tlXS(idx) {
  return TL_PL + ((idx - TL_MIN_I) / (TL_MAX_I - TL_MIN_I)) * TL_CW
}

const TL_PH_COLOR = { group: '#38BDF8', standings: '#A78BFA', knockout: '#FB923C' }

const TL_CTX_OPTIONS = [
  { id: 'none',    label: '—',        sub: null },
  { id: 'leader',  label: 'LÍDER',    sub: 'Líder actual del torneo' },
  { id: 'average', label: 'PROMEDIO', sub: 'Trayectoria de la comunidad' },
  { id: 'pack',    label: 'Tu Zona - Ranking +2-2',     sub: 'Cerca de tu rango' },
]

function tlSegmentPath(a, b, tlXS, ys) {
  const x1 = tlXS(a.idx)
  const y1 = ys(a.rank)

  const x2 = tlXS(b.idx)
  const y2 = ys(b.rank)

  const mx = (x1 + x2) / 2

  return `
    M ${x1} ${y1}
    Q ${mx} ${y1}
      ${x2} ${y2}
  `
}
// ── EKG Pulse strip ───────────────────────────────────────────────────────────
// Feels like telemetry / heartbeat — spikes, not bars

function TLPulseStrip({ userLine }) {
  if (!userLine.length) return null
  const H = 22, base = H * 0.45
  const maxDelta = Math.max(...userLine.map(p => Math.abs(p.delta || 0)), 1)
  const maxH = H * 0.42

  return (
    <svg viewBox={'0 0 ' + TL_W + ' ' + H} width="100%" style={{ display: 'block', marginTop: 3 }}>
      <text x={TL_PL - 6} y={base + 3.5} textAnchor="end"
        fill="var(--color-text-3)" fontSize="6.5" fontFamily="var(--font-mono)"
        fillOpacity={0.28} letterSpacing="0.5">Δ</text>
      <line x1={TL_PL} y1={base} x2={TL_PL + TL_CW} y2={base}
        stroke="var(--color-border)" strokeWidth={0.4} strokeOpacity={0.35} />
      {userLine.map(p => {
        const d = p.delta || 0
        if (d === 0) return null
        const x = tlXS(p.idx)
        const h = Math.max(2.5, (Math.abs(d) / maxDelta) * maxH)
        const isUp = d < 0                          // rank# down = improved position
        const col  = isUp ? '#34D399' : '#F87171'
        const py   = isUp ? base - h : base + h
        return (
          <path key={p.idx}
            d={`M${(x - 1.5).toFixed(1)},${base.toFixed(1)} L${x.toFixed(1)},${py.toFixed(1)} L${(x + 1.5).toFixed(1)},${base.toFixed(1)}`}
            fill="none" stroke={col} strokeWidth={1.5}
            strokeOpacity={0.68} strokeLinecap="round" strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}

// ── TimelineTab ───────────────────────────────────────────────────────────────

function TimelineTab({ data, userId }) {
  const {
    timelineRaceSnapshots: snapshots = [],
    allLeaderboard: allLB = [],
    totalParticipants: N = 12,
  } = data

  const [mode,       setMode]       = useState('story')
  const [hovIdx,     setHovIdx]     = useState(null)
  const [lockIdx,    setLockIdx]    = useState(null)
  const [slots,      setSlots]      = useState([])
  const [ctx,        setCtx]        = useState('none')
  const [addSearch,  setAddSearch]  = useState('')
  const [addFocused, setAddFocused] = useState(false)

  // La línea de tiempo solo es relevante con una trayectoria real (≥3 snapshots).
  // Antes de eso muestra un empty state con progreso, en vez de pantalla en blanco.
  const TL_MIN_SNAPS = 3
  const realSnapsCount = snapshots.filter(s => s.snapshot_match_id !== '+').length
  if (realSnapsCount < TL_MIN_SNAPS) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card style={{ border: '1px dashed var(--color-border)', padding: '2.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.7rem', opacity: 0.55 }}>📈</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-text-1)', letterSpacing: '0.03em' }}>
            La historia aún no empieza
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', maxWidth: '44ch', lineHeight: 1.6 }}>
            Tu trayectoria de posiciones aparecerá tras los primeros partidos, cuando haya movimiento que contar.
          </div>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: '0.3rem', padding: '0.28rem 0.7rem', borderRadius: 20, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            {realSnapsCount} de {TL_MIN_SNAPS} partidos
          </div>
        </Card>
      </motion.div>
    )
  }

  const ys = rank => TL_PT + ((rank - 1) / Math.max(N - 1, 1)) * TL_CH

  const userLine   = tlBuildUserLine(snapshots, userId)
  const allLines   = mode === 'compare' ? tlBuildAllLines(snapshots) : {}
  const avgLine    = mode === 'compare' && ctx === 'average' ? tlBuildAverageLine(snapshots) : []
  const leaderData = mode === 'compare' && ctx === 'leader'  ? tlBuildLeaderLine(snapshots)  : { line: [], uid: null }
  const leaderEnd  = leaderData.line && leaderData.line.length ? leaderData.line[leaderData.line.length - 1] : null
  const { packMemberNames, packIds } = (() => {
    const lastSnap = snapshots.filter(s => s.snapshot_match_id !== '+').slice(-1)[0]
    if (!lastSnap) return { packMemberNames: [], packIds: [] }
    const sorted = [...lastSnap.users].sort((a, b) => a.rank - b.rank)
    const ui = sorted.findIndex(u => u.user_id === userId)
    if (ui < 0) return { packMemberNames: [], packIds: [] }
    const members = [
      ui >= 2 ? sorted[ui - 2] : null,
      ui >= 1 ? sorted[ui - 1] : null,
      sorted[ui + 1] ?? null,
      sorted[ui + 2] ?? null,
    ].filter(Boolean)
    return {
      packIds: members.map(u => u.user_id),
      packMemberNames: members.map(u => allLB.find(x => x.user_id === u.user_id)?.display_name ?? u.user_id),
    }
  })()
  const packLines  = mode === 'compare' && ctx === 'pack'    ? tlBuildPackLines(snapshots, packIds) : null

  const eliteCutoff = classificationCutoff(N)
  const inflections = mode === 'story' ? tlDetectInflections(userLine, eliteCutoff) : []
  // startRank: avg rank across matchday 1 (match_ids 1-12) — avoids noisy snapshot-1 ties
  const md12Pts   = userLine.filter(p => p.matchId <= 12 && p.stage !== 'standings')
  const startRank = md12Pts.length > 0
    ? Math.round(md12Pts.reduce((s, p) => s + p.rank, 0) / md12Pts.length)
    : (userLine[0]?.rank ?? 1)
  const verdict     = mode === 'story' ? tlComputeVerdict(userLine, eliteCutoff, startRank) : null
  const segments    = mode === 'story' ? tlBuildSegments(userLine, N, eliteCutoff)  : []

  // Phase boundaries
  const gSnaps = snapshots.filter(s => s.stage === 'group' && s.snapshot_match_id !== '+')
  const gEnd   = gSnaps.length ? gSnaps[gSnaps.length - 1].snapshot_index : 71
  const stIdx  = (snapshots.find(s => s.stage === 'standings') ?? {}).snapshot_index ?? 72
  const kSnaps = snapshots.filter(s => s.stage === 'knockout')
  const kStart = kSnaps.length ? kSnaps[0].snapshot_index : 73

  // Etapa Inicial: last group snapshot at or before match_id 12 (end of matchday 1)
  const md2Snaps = gSnaps.filter(s => s.snapshot_match_id <= 12)
  const md2End   = md2Snaps.length ? md2Snaps[md2Snaps.length - 1].snapshot_index : TL_MIN_I

  // Territory zone geometry
  const dangerThreshold = Math.ceil(N * 0.65)
  const eliteH  = Math.max(0, ys(eliteCutoff + 0.5) - TL_PT)
  const dangerY = ys(dangerThreshold + 0.5)

  const activeIdx = lockIdx != null ? lockIdx : hovIdx != null ? hovIdx
    : (userLine.length ? userLine[userLine.length - 1].idx : TL_MAX_I)
  const inspPt = userLine.find(p => p.idx === activeIdx)
    ?? (userLine.length ? userLine[userLine.length - 1] : null)

  // Points delta — change in pts since previous snapshot
  const inspPtPos = inspPt ? userLine.findIndex(p => p === inspPt) : -1
  const prevPt    = inspPtPos > 0 ? userLine[inspPtPos - 1] : null
  const ptsDelta  = inspPt && prevPt != null ? inspPt.pts - prevPt.pts : null

  const userPath = tlPath(userLine, tlXS, ys)
  const crossX   = (hovIdx != null || lockIdx != null)
    ? tlXS(lockIdx != null ? lockIdx : hovIdx) : null

  const areaPath = userLine.length > 0 ? (() => {
    const first = userLine[0], last = userLine[userLine.length - 1]
    const bot = TL_PT + TL_CH
    return userPath
      + ' L' + tlXS(last.idx).toFixed(1)  + ',' + bot
      + ' L' + tlXS(first.idx).toFixed(1) + ',' + bot + ' Z'
  })() : ''

  const stPt  = userLine.find(p => p.stage === 'standings') ?? null
  const lastPt = userLine.length ? userLine[userLine.length - 1] : null

  // Pack members from latest snapshot

  const endCol = lastPt
    ? (lastPt.rank <= eliteCutoff ? '#FBBF24' : lastPt.rank <= eliteCutoff * 2 ? '#38BDF8' : '#94A3B8')
    : '#38BDF8'

  function onSVGMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - r.left) / r.width) * TL_W
    const raw  = TL_MIN_I + ((svgX - TL_PL) / TL_CW) * (TL_MAX_I - TL_MIN_I)
    const cl   = Math.max(TL_MIN_I, Math.min(TL_MAX_I, Math.round(raw)))
    const near = userLine.reduce(
      (b, p) => Math.abs(p.idx - cl) < Math.abs(b.idx - cl) ? p : b, userLine[0])
    setHovIdx(near ? near.idx : null)
  }

  function onSVGClick(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - r.left) / r.width) * TL_W
    const raw  = TL_MIN_I + ((svgX - TL_PL) / TL_CW) * (TL_MAX_I - TL_MIN_I)
    const cl   = Math.max(TL_MIN_I, Math.min(TL_MAX_I, Math.round(raw)))
    const near = userLine.reduce(
      (b, p) => Math.abs(p.idx - cl) < Math.abs(b.idx - cl) ? p : b, userLine[0])
    const nIdx = near ? near.idx : null
    setLockIdx(prev => prev === nIdx ? null : nIdx)
  }

  function addSlot(uid) {
    if (!slots.includes(uid) && slots.length < 5) {
      setSlots(p => [...p, uid])
      setAddSearch('')
      setAddFocused(false)
    }
  }
  function removeSlot(uid)  { setSlots(p => p.filter(id => id !== uid)) }
  function setContext(c)    { setCtx(c); if (c === 'pack') setSlots([]) }

  const usedSet        = new Set([userId].concat(slots))
  const addSearchLower = addSearch.toLowerCase().trim()
  const availableUsers = allLB.filter(u => !usedSet.has(u.user_id))
  const filteredUsers  = addSearchLower
    ? availableUsers.filter(u =>
        u.display_name.toLowerCase().includes(addSearchLower) ||
        String(u.rank).includes(addSearchLower))
    : availableUsers

  const stageChip = { group: 'GRP', standings: 'TBL', knockout: 'KO' }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

      {/* ── Mode toggle ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[['story', 'Modo Historia'], ['compare', 'Modo Comparativo']].map(([m, label]) => (
          <button key={m}
            onClick={() => { setMode(m); setHovIdx(null); setLockIdx(null) }}
            style={{
              padding: '0.35rem 1rem', borderRadius: 6, cursor: 'pointer',
              border: mode === m ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: mode === m ? 'rgba(56,189,248,0.10)' : 'transparent',
              color: mode === m ? 'var(--color-primary)' : 'var(--color-text-3)',
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>{label}</button>
        ))}
      </div>

      {/* ── Verdict row — Story mode only ─────────────────────────────────── */}
      {mode === 'story' && verdict && userLine.length >= 2 && (() => {
        const postStartLine = userLine.filter( p => p.snapshot_match_id > 12 );
        const bestRank = postStartLine.length ? postStartLine.reduce( (b, p) => p.rank < b ? p.rank : b, postStartLine[0].rank ) : startRank;
        const worstRank = userLine.reduce((w, p) => p.rank > w ? p.rank : w, userLine[0].rank)
        const finalRank = userLine[userLine.length - 1].rank
        return (
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '0.8rem 1.5rem', marginBottom: '0.75rem',
            gap: 0,
          }}>
            <div style={{ flex: '0 0 auto', marginRight: '2.5rem' }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Veredicto</div>
              <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', color: verdict.color, letterSpacing: '0.08em', fontWeight: 700 }}>{verdict.label}</div>
              <div style={{ fontSize: '0.60rem', fontFamily: 'var(--font-mono)', color: verdict.color, opacity: 0.58, marginTop: 1 }}>{verdict.sub}</div>
            </div>
            {[
              bestRank < startRank
                ? { label: 'Mejor',     val: '#' + bestRank }
                : { label: 'P. Inicial', val: '#' + startRank },
              { label: 'Peor',  val: '#' + worstRank },
              { label: 'Final', val: '#' + finalRank },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex: '0 0 auto', marginRight: '2rem' }}>
                <div style={{ fontSize: '01rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)', fontWeight: 400 }}>{val}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ── Compare panel ──────────────────────────────────────────────────── */}
      {mode === 'compare' && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Comparar con
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              padding: '0.25rem 0.75rem', borderRadius: 6,
              background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.35)',
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)',
            }}>
              {(allLB.find(u => u.user_id === userId) || {}).display_name || 'Tú'}
            </div>
            {slots.map(uid => {
              const u   = allLB.find(x => x.user_id === uid) || {}
              const col = userColor(u.rank || 2)
              return (
                <div key={uid} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '0.25rem 0.5rem 0.25rem 0.75rem', borderRadius: 6,
                  background: col + '18', border: '1px solid ' + col + '55',
                  fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: col,
                }}>
                  {u.display_name || uid}
                  <span onClick={() => removeSlot(uid)} style={{ cursor: 'pointer', opacity: 0.6, fontSize: '0.9rem', lineHeight: 1 }}>×</span>
                </div>
              )
            })}
          </div>
          {slots.length < 5 && ctx !== 'pack' && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="+ Buscar jugador..."
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                onFocus={() => setAddFocused(true)}
                onBlur={() => setTimeout(() => setAddFocused(false), 150)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.45rem 0.75rem',
                  background: 'var(--color-surface-2)',
                  border: addFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 8, color: 'var(--color-text-1)',
                  fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
              />
              {addFocused && filteredUsers.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden',
                }}>
                  {filteredUsers.slice(0, 6).map(u => (
                    <div key={u.user_id}
                      onMouseDown={() => addSlot(u.user_id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.5rem 0.75rem', cursor: 'pointer',
                        borderBottom: '1px solid rgba(45,55,72,0.6)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', width: 26, flexShrink: 0 }}>#{u.rank}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-1)', fontFamily: 'var(--font-mono)' }}>{u.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4, paddingTop: '0.38rem',
            }}>Contexto</span>
            {TL_CTX_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setContext(opt.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '0.3rem 0.65rem', borderRadius: 6, cursor: 'pointer',
                border: ctx === opt.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: ctx === opt.id ? 'rgba(251,191,36,0.10)' : 'transparent',
                gap: 2,
              }}>
                <span style={{
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2,
                  color: ctx === opt.id ? 'var(--color-accent)' : 'var(--color-text-3)',
                }}>{opt.label}</span>
                {opt.sub && (
                  <span style={{
                    fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-3)', opacity: ctx === opt.id ? 1 : 0.5, lineHeight: 1.2,
                  }}>
                    {opt.id === 'pack' && packMemberNames.length > 0
                      ? packMemberNames.join(' · ')
                      : opt.sub}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main chart card ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '1rem 1.25rem 0.75rem', marginBottom: '0.75rem',
        overflow: 'hidden',
      }}>
        <svg
          viewBox={'0 0 ' + TL_W + ' ' + TL_H}
          width="100%"
          style={{ display: 'block', cursor: 'crosshair', userSelect: 'none', overflow: 'visible' }}
          onMouseMove={onSVGMove}
          onMouseLeave={() => setHovIdx(null)}
          onClick={onSVGClick}
        >
          <defs>
            <filter id="tl-ambient" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="tl-end-glow" x="-130%" y="-130%" width="360%" height="360%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Elite zone: radial gold glow from top */}
            <radialGradient id="tl-zone-elite" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
              <stop offset="0%"   stopColor="#FBBF24" stopOpacity="0.16" />
              <stop offset="65%"  stopColor="#FBBF24" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
            </radialGradient>
            {/* Danger zone: dark accumulation at bottom */}
            <linearGradient id="tl-zone-danger" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#450A0A" stopOpacity="0" />
              <stop offset="100%" stopColor="#450A0A" stopOpacity="0.24" />
            </linearGradient>
            {/* Knockout pressure: darkness closing from right */}
            <linearGradient id="tl-ko-pressure" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#110A00" stopOpacity="0" />
              <stop offset="100%" stopColor="#110A00" stopOpacity="0.26" />
            </linearGradient>
            {/* Area fill under user line — tinted by end rank */}
            <linearGradient id="tl-area-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor={endCol} stopOpacity="0.13" />
              <stop offset="70%"  stopColor={endCol} stopOpacity="0.02" />
              <stop offset="100%" stopColor={endCol} stopOpacity="0" />
            </linearGradient>
            <clipPath id="tl-chart-clip">
              <rect x={TL_PL} y={TL_PT} width={TL_CW} height={TL_CH} />
            </clipPath>
          </defs>

          {/* ── L0: Rank territory zones ─────────────────────────────────── */}
          {/* Elite zone — golden air at the top */}
          <rect x={TL_PL} y={TL_PT} width={TL_CW} height={eliteH + 14}
            fill="url(#tl-zone-elite)" />
          {/* Danger zone — dark weight at the bottom */}
          <rect x={TL_PL} y={dangerY} width={TL_CW}
            height={Math.max(0, TL_PT + TL_CH - dangerY)}
            fill="url(#tl-zone-danger)" />

          {/* ── L1: Phase column fills ───────────────────────────────────── */}
          {/* Groups — cool, open, exploratory */}
          <rect x={tlXS(TL_MIN_I)} y={TL_PT}
            width={Math.max(0, tlXS(gEnd) - tlXS(TL_MIN_I) + 2)} height={TL_CH}
            fill="#38BDF8" fillOpacity={0.04} />
          {/* Etapa Inicial — matchday 1 overlay */}
          {md2End > TL_MIN_I && <>
            <rect x={tlXS(TL_MIN_I)} y={TL_PT}
              width={Math.max(0, tlXS(md2End) - tlXS(TL_MIN_I) + 1)} height={TL_CH}
              fill="#38BDF8" fillOpacity={0.07} />
            <line x1={tlXS(md2End)} y1={TL_PT - 4} x2={tlXS(md2End)} y2={TL_PT + TL_CH}
              stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.32} strokeDasharray="2 4" />
          </>}
          {/* Standings — narrow, compressed, critical */}
          <rect x={tlXS(gEnd) + 2} y={TL_PT}
            width={Math.max(0, tlXS(kStart) - tlXS(gEnd) - 4)} height={TL_CH}
            fill="#A78BFA" fillOpacity={0.11} />
          {/* Knockout — tense, orange tint */}
          <rect x={tlXS(kStart) - 2} y={TL_PT}
            width={Math.max(0, tlXS(TL_MAX_I) - tlXS(kStart) + 2)} height={TL_CH}
            fill="#FB923C" fillOpacity={0.05} />
          {/* Knockout pressure — darkening rightward */}
          <rect x={tlXS(kStart) - 2} y={TL_PT}
            width={Math.max(0, tlXS(TL_MAX_I) - tlXS(kStart) + TL_PR)} height={TL_CH}
            fill="url(#tl-ko-pressure)" clipPath="url(#tl-chart-clip)" />

          {/* ── L2: Phase transition marks ───────────────────────────────── */}
          <line x1={tlXS(gEnd)} y1={TL_PT - 4} x2={tlXS(gEnd)} y2={TL_PT + TL_CH}
            stroke="#38BDF8" strokeWidth={0.75} strokeOpacity={0.22} />
          <line x1={tlXS(kStart)} y1={TL_PT - 4} x2={tlXS(kStart)} y2={TL_PT + TL_CH}
            stroke="#FB923C" strokeWidth={0.75} strokeOpacity={0.28} />

          {/* ── L3: ACT labels — narrative chapter markers ───────────────── */}
          {/* Etapa Inicial label — story mode only */}
          {mode === 'story' && md2End > TL_MIN_I && (
            <text x={(tlXS(TL_MIN_I) + tlXS(md2End)) / 2} y={TL_PT - 30}
              fill="#38BDF8" fontSize="7.5" fontFamily="var(--font-mono)"
              textAnchor="middle" fillOpacity={0.55} letterSpacing="1.5">
              INICIO
            </text>
          )}
          <text x={mode === 'story' && md2End > TL_MIN_I ? (tlXS(md2End) + tlXS(gEnd)) / 2 : tlXS(TL_MIN_I) + 155} y={TL_PT - 30}
            fill="#38BDF8" fontSize="8" fontFamily="var(--font-mono)"
            textAnchor={mode === 'story' && md2End > TL_MIN_I ? 'middle' : 'start'}
            fillOpacity={mode === 'story' ? 0.45 : 0.44} letterSpacing="1.2">
            {mode === 'story' ? 'ACT I · GRUPOS' : 'GRUPOS'}
          </text>
          <text x={tlXS(gEnd) -20} y={TL_PT - 30}
            fill="#A78BFA" fontSize="8" fontFamily="var(--font-mono)"
            fillOpacity={mode === 'story' ? 0.45 : 0.44} letterSpacing="1.2">
            {mode === 'story' ? 'TABLA' : 'TABLA'}
          </text>
          <text x={tlXS(kStart) + 55} y={TL_PT - 30}
            fill="#FB923C" fontSize="8" fontFamily="var(--font-mono)"
            fillOpacity={mode === 'story' ? 0.45 : 0.44} letterSpacing="1.2">
            {mode === 'story' ? 'ACT II · KO' : 'KNOCKOUT'}
          </text>

          {/* ── L4: Grid — sparse, zone-aware ───────────────────────────── */}
          {/* Rank 1 rail */}
          <line x1={TL_PL} y1={ys(1)} x2={TL_PL + TL_CW} y2={ys(1)}
            stroke="var(--color-border)" strokeWidth={0.4} strokeOpacity={0.45} />
          {/* Elite boundary — faint gold dashed */}
          <line x1={TL_PL} y1={ys(eliteCutoff + 0.5)} x2={TL_PL + TL_CW} y2={ys(eliteCutoff + 0.5)}
            stroke="#FBBF24" strokeWidth={0.5} strokeOpacity={0.16} strokeDasharray="3 8" />
          {/* Danger boundary — faint red dashed */}
          <line x1={TL_PL} y1={ys(dangerThreshold + 0.5)} x2={TL_PL + TL_CW} y2={ys(dangerThreshold + 0.5)}
            stroke="#EF4444" strokeWidth={0.5} strokeOpacity={0.14} strokeDasharray="3 8" />
          {/* Rank N rail */}
          <line x1={TL_PL} y1={ys(N)} x2={TL_PL + TL_CW} y2={ys(N)}
            stroke="var(--color-border)" strokeWidth={0.4} strokeOpacity={0.45} />

          {/* ── L5: Rank axis — territory-coded labels ───────────────────── */}
          <text x={TL_PL - 7} y={ys(1) + 3.5} textAnchor="end"
            fill="#FBBF24" fontSize="8.5" fontFamily="var(--font-mono)" fillOpacity={0.55}>1</text>
          <text x={TL_PL - 7} y={ys(3) + 3.5} textAnchor="end"
            fill="#FBBF24" fontSize="7.5" fontFamily="var(--font-mono)" fillOpacity={0.28}>3</text>
          <text x={TL_PL - 7} y={ys(dangerThreshold) + 3.5} textAnchor="end"
            fill="#EF4444" fontSize="7.5" fontFamily="var(--font-mono)" fillOpacity={0.28}>{dangerThreshold}</text>
          <text x={TL_PL - 7} y={ys(N) + 3.5} textAnchor="end"
            fill="var(--color-text-3)" fontSize="8" fontFamily="var(--font-mono)" fillOpacity={0.38}>{N}</text>

          {/* ── L6: Context reference lines — subtle, not protagonist ────── */}
          {avgLine.length > 0 && (
            <path d={tlPath(avgLine, tlXS, ys)} fill="none"
              stroke="#64748B" strokeWidth={1} strokeOpacity={0.28} strokeDasharray="4 5" />
          )}
          {leaderData.line.length > 0 && leaderData.uid !== userId && (
            <g>
              <path d={tlPath(leaderData.line, tlXS, ys)} fill="none"
                stroke="var(--color-accent)" strokeWidth={1.5}
                strokeOpacity={0.5} strokeDasharray="4 4" />
              {leaderEnd && (
                <>
                  <circle cx={tlXS(leaderEnd.idx)} cy={ys(leaderEnd.rank)} r={2.6}
                    fill="var(--color-accent)" fillOpacity={0.9} />
                  <text x={tlXS(leaderEnd.idx) + 6} y={ys(leaderEnd.rank) + 3}
                    fill="var(--color-accent)" fontSize="7.5" fontFamily="var(--font-mono)" fillOpacity={0.85}>
                    #{leaderEnd.rank} · LÍDER
                  </text>
                </>
              )}
            </g>
          )}
          {packLines && packIds.map((uid, ki) => (
            <path key={uid} d={tlPath(packLines[uid] || [], tlXS, ys)} fill="none"
              stroke="var(--color-primary)" strokeWidth={1}
              strokeOpacity={0.55 - ki * 0.05} />
          ))}
          {mode === 'compare' && slots.map((uid, si) => {
            const line = allLines[uid] || []
            const u    = allLB.find(x => x.user_id === uid) || {}
            return (
              <path key={uid} d={tlPath(line, tlXS, ys)} fill="none"
                stroke={userColor(u.rank || si + 2)} strokeWidth={1.5} strokeOpacity={0.40} />
            )
          })}

          {/* ── L7: Area fill (story mode) ───────────────────────────────── */}
          {mode === 'story' && areaPath && (
            <path d={areaPath} fill="url(#tl-area-fill)" clipPath="url(#tl-chart-clip)" />
          )}

          {/* ── L8: THE PROTAGONIST LINE ─────────────────────────────────── */}
          {mode === 'story' ? (
            <g>
              {/* Direction-coded segments: rising/falling/stable × territory */}
              {segments.map(({ a, b, color, width, opacity }, si) => (
               <g key={si}>
                   {/* sharp core line */}
                   <path
                     d={tlSegmentPath(a, b, tlXS, ys)}
                     fill="none"
                     stroke={color}
                     strokeWidth={width+.2}
                     strokeOpacity={opacity+.3}
                     strokeLinecap="round"
                   />

                 </g>
               ))}

            </g>
          ) : (
            <path d={userPath} fill="none" stroke="var(--color-primary)"
              strokeWidth={2.2} strokeOpacity={0.90} strokeLinejoin="round" />
          )}

          {/* ── L9: Standings checkpoint diamond ────────────────────────── */}
          {mode === 'story' && stPt && (() => {
            const sx = tlXS(stPt.idx), sy = ys(stPt.rank)
            return (
              <g>
                <line x1={tlXS(stIdx)} y1={TL_PT} x2={tlXS(stIdx)} y2={TL_PT + TL_CH}
                  stroke="#A78BFA" strokeWidth={1.2} strokeOpacity={0.42} />
                <path d={`M${sx},${sy - 5} L${sx + 4.5},${sy} L${sx},${sy + 5} L${sx - 4.5},${sy} Z`}
                  fill="#A78BFA" fillOpacity={0.62}
                  stroke="#A78BFA" strokeWidth={0.5} strokeOpacity={0.85} />
              </g>
            )
          })()}

          {/* ── L10: Story beats — editorial interruptions ──────────────── */}
          {mode === 'story' && inflections.map((inf, ii) => {
            const x         = tlXS(inf.idx), y = ys(inf.rank)
            const color     = inf.positive ? '#34D399' : '#FB7185'
            const topRail = ii % 2 === 0
            const labelY  = topRail ? y - 18 : y + 52
            const nearRight = x > TL_PL + TL_CW * 0.74
            const anchor    = nearRight ? 'end' : 'start'
            const textX     = nearRight ? x +2 : x -2
            return (
              <g key={'beat-' + ii}>
                {/* Vertical breath mark — dashed riser from bottom */}
                <line x1={x} y1={TL_PT + TL_CH} x2={x} y2={y + 7}
                  stroke={color} strokeWidth={1.6} strokeOpacity={0.08}
                  strokeDasharray="1.5 4" />
                {/* Bottom tick at the base */}
                <line x1={x - 2.5} y1={TL_PT + TL_CH} x2={x + 2.5} y2={TL_PT + TL_CH}
                  stroke={color} strokeWidth={1.2} strokeOpacity={0.24} />
                {/* Beat dot — hollow, surface-backed */}
                <circle cx={x} cy={y} r={2} fill="var(--color-surface)" fillOpacity={0.18} />
                <circle cx={x} cy={y} r={2} fill="none"
                  stroke={color} strokeWidth={1.5} strokeOpacity={0.82} />
                <circle cx={x} cy={y} r={1.5} fill={color} fillOpacity={0.18} />
                {/* Editorial label — broadcast mono */}
                <text x={textX} y={labelY}
                  textAnchor={anchor}
                  fill={color} fontSize="5.8" fontFamily="var(--font-mono)"
                  fillOpacity={1} letterSpacing="0.6em">
                  {inf.label.toUpperCase()}

                </text>
              </g>
            )
          })}

          {/* ── L11: Endpoint — journey terminus ────────────────────────── */}
          {lastPt && (() => {
            const ex = tlXS(lastPt.idx), ey = ys(lastPt.rank)
            return (
              <g>
                {/* Halo rings — concentric, dissipating */}
                <circle cx={ex} cy={ey} r={30} fill={endCol} fillOpacity={0.03}
                  filter="url(#tl-ambient)" />
                <circle cx={ex} cy={ey} r={14} fill={endCol} fillOpacity={0.06} />
                <circle cx={ex} cy={ey} r={7}  fill={endCol} fillOpacity={0.12} />
                {/* Outer ring */}
                <circle cx={ex} cy={ey} r={4.5} fill="none"
                  stroke={endCol} strokeWidth={1.5}
                  strokeOpacity={lastPt.rank <= eliteCutoff ? 0.85 : 0.55} />
                {/* Center dot */}
                <circle cx={ex} cy={ey} r={2.2} fill={endCol} fillOpacity={1} />
                {/* Labels */}
                <text x={ex + 10} y={ey - 5} textAnchor="start"
                  fill="var(--color-text-3)" fontSize="6" fontFamily="var(--font-mono)"
                  fillOpacity={0.50} letterSpacing="1.5">FINAL</text>
                <text x={ex + 10} y={ey + 9} textAnchor="start"
                  fill={endCol} fontSize="14" fontFamily="var(--font-mono)"
                  fontWeight="700" fillOpacity={lastPt.rank <= eliteCutoff ? 0.95 : 0.85}>
                  #{lastPt.rank}
                </text>
              </g>
            )
          })()}

          {/* ── L12: Compare hover dots ──────────────────────────────────── */}
          {mode === 'compare' && (hovIdx != null || lockIdx != null) && slots.map(uid => {
            const line    = allLines[uid] || []
            const activeI = lockIdx != null ? lockIdx : hovIdx
            const pt      = line.find(p => p.idx === activeI)
            if (!pt) return null
            const u = allLB.find(x => x.user_id === uid) || {}
            return (
              <circle key={uid} cx={tlXS(pt.idx)} cy={ys(pt.rank)} r={3.5}
                fill={userColor(u.rank || 2)} fillOpacity={0.85} />
            )
          })}

          {/* ── L13: User hover dot ──────────────────────────────────────── */}
          {(hovIdx != null || lockIdx != null) && (() => {
            const activeI = lockIdx != null ? lockIdx : hovIdx
            const pt = userLine.find(p => p.idx === activeI)
            if (!pt) return null
            return (
              <circle cx={tlXS(pt.idx)} cy={ys(pt.rank)} r={4.5}
                fill={endCol} fillOpacity={1} />
            )
          })()}

          {/* ── L14: Crosshair ───────────────────────────────────────────── */}
          {crossX != null && (
            <line x1={crossX} y1={TL_PT} x2={crossX} y2={TL_PT + TL_CH}
              stroke="var(--color-text-3)" strokeWidth={0.75}
              strokeOpacity={0.25} strokeDasharray="2 3" />
          )}
        </svg>

        {/* ── Pulse strip — telemetry residue ─────────────────────────────── */}
        {mode === 'story' && <TLPulseStrip userLine={userLine} />}
      </div>

      {/* ── Inspector panel ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '0.875rem 1.25rem',
      }}>
        {inspPt ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)', fontWeight: 600 }}>
                  M{inspPt.matchId}
                </span>
                <span style={{
                  fontSize: '0.60rem', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  padding: '0.1rem 0.4rem', borderRadius: 4,
                  color: TL_PH_COLOR[inspPt.stage] || 'var(--color-text-3)',
                  background: inspPt.stage === 'group'
                    ? 'rgba(56,189,248,0.12)'
                    : inspPt.stage === 'standings'
                    ? 'rgba(167,139,250,0.12)'
                    : 'rgba(251,146,60,0.12)',
                }}>
                  {stageChip[inspPt.stage] || inspPt.stage}
                </span>
              </div>
              {lockIdx != null && (
                <span onClick={() => setLockIdx(null)} style={{
                  fontSize: '0.60rem', fontFamily: 'var(--font-mono)',
                  color: 'var(--color-accent)', cursor: 'pointer',
                  border: '1px solid rgba(251,191,36,0.30)',
                  borderRadius: 4, padding: '0.1rem 0.4rem',
                }}>FIJADO ×</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.60rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Posición</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '1.35rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)', fontWeight: 700, lineHeight: 1 }}>#{inspPt.rank}</span>
                  <MovementChip movement={inspPt.movement} delta={Math.abs(inspPt.delta)} />
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: 'var(--color-border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.60rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Puntos</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '1.35rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)', fontWeight: 700, lineHeight: 1 }}>{inspPt.pts}</span>
                  {ptsDelta != null && ptsDelta > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#00E676', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <ChevronUp size={12} strokeWidth={3} />+{ptsDelta}
                    </span>
                  )}
                  {ptsDelta === 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--color-text-3)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      <Minus size={12} />
                    </span>
                  )}
                </div>
              </div>
            </div>
            {mode === 'compare' && (() => {
              // helper: get prev point before currentIdx in a line array
              const prevFor = (line, currentIdx) => {
                const before = line.filter(p => p.idx < currentIdx)
                return before.length ? before[before.length - 1] : null
              }
              // helper: compute rank movement + deltas given curr and prev points
              const deltas = (curr, prev) => {
                if (!curr) return { rankMov: null, rankDelta: 0, ptsDelta: null }
                const rankDelta = prev ? prev.rank - curr.rank : 0
                const rankMov   = rankDelta > 0 ? 'up' : rankDelta < 0 ? 'down' : 'same'
                const ptsDelta  = (prev && curr.pts != null && prev.pts != null) ? curr.pts - prev.pts : null
                return { rankMov, rankDelta: Math.abs(rankDelta), ptsDelta }
              }

              const rows = []

              // 1. Manually added slot users
              slots.forEach((uid, si) => {
                const line = allLines[uid] || []
                const pt   = line.find(p => p.idx === activeIdx)
                const prev = prevFor(line, activeIdx)
                const u    = allLB.find(x => x.user_id === uid) || {}
                const col  = userColor(u.rank || si + 2)
                rows.push({ key: uid, name: u.display_name || uid, col, rank: pt?.rank ?? null, pts: pt?.pts ?? null, ...deltas(pt, prev) })
              })

              // 2. Leader context
              if (ctx === 'leader' && leaderData.uid && leaderData.uid !== userId) {
                const line = allLines[leaderData.uid] || []
                const pt   = line.find(p => p.idx === activeIdx)
                const prev = prevFor(line, activeIdx)
                rows.push({ key: 'leader', name: leaderData.name || 'Líder', col: 'var(--color-accent)', rank: pt?.rank ?? null, pts: pt?.pts ?? null, ...deltas(pt, prev) })
              }

              // 3. Pack context — fixed members from last snapshot
              if (ctx === 'pack' && packLines) {
                packIds.forEach((uid, ki) => {
                  const lbEntry = allLB.find(x => x.user_id === uid) || {}
                  const line    = packLines[uid] || []
                  const pt      = line.find(p => p.idx === activeIdx)
                  const prev    = prevFor(line, activeIdx)
                  rows.push({ key: uid, name: lbEntry.display_name || uid, col: 'var(--color-primary)', rank: pt?.rank ?? null, pts: pt?.pts ?? null, ...deltas(pt, prev) })
                })
                rows.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
              }

              // 4. Average context
              if (ctx === 'average') {
                const avgIdx  = avgLine.findIndex(p => p.idx === activeIdx)
                const avgPt   = avgIdx >= 0 ? avgLine[avgIdx] : null
                const avgPrev = avgIdx > 0  ? avgLine[avgIdx - 1] : null
                if (avgPt) {
                  const rankDelta = avgPrev ? avgPrev.rank - avgPt.rank : 0
                  rows.push({ key: 'avg', name: 'Promedio', col: '#64748B', rank: avgPt.rank, pts: null,
                    rankMov: rankDelta > 0 ? 'up' : rankDelta < 0 ? 'down' : 'same',
                    rankDelta: Math.abs(rankDelta), ptsDelta: null })
                }
              }

              if (!rows.length) return null
              return (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {rows.map(({ key, name, col, rank, pts, rankMov, rankDelta, ptsDelta }) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.1rem 0' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: col, opacity: 0.85 }}>{name}</span>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* rank + rank delta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>
                            {rank != null ? '#' + Math.round(rank) : '—'}
                          </span>
                          {rankMov && <MovementChip movement={rankMov} delta={rankDelta} />}
                        </div>
                        {/* pts + pts delta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 60, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                            {pts != null ? pts + 'pts' : ''}
                          </span>
                          {ptsDelta != null && ptsDelta > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 1, color: '#00E676', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              <ChevronUp size={10} strokeWidth={3} />+{ptsDelta}
                            </span>
                          )}
                          {ptsDelta === 0 && (
                            <span style={{ color: 'var(--color-text-3)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}><Minus size={10} /></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        ) : (
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            Hover sobre el chart para explorar
          </div>
        )}
      </div>

    </motion.div>
  )
}

// ─── AuditoriaTab ─────────────────────────────────────────────────────────────

function AuditoriaTab() {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
      <ScoringAuditability />
    </motion.div>
  )
}

// ─── Predictions Tab ──────────────────────────────────────────────────────────

function TeamWithFlag({ name, teamMap, align = 'left' }) {
  const team  = getTeam(name, teamMap)
  const flag  = flagUrl(team?.iso2)
  const isRight = align === 'right'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', flexDirection: isRight ? 'row-reverse' : 'row', minWidth:0 }}>
      {flag && <img src={flag} alt="" style={{ width:18, height:12, objectFit:'cover', borderRadius:2, flexShrink:0 }} />}
      <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--color-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {name ?? 'TBD'}
      </span>
    </div>
  )
}

function GroupPredictionsSection({ groupDetail, matchMap, groupResults, teamMap }) {
  const isMobile = useIsMobile(680)
  if (!groupDetail?.length) return null

  const resultLookup = {}
  if (Array.isArray(groupResults)) {
    groupResults.forEach(m => { resultLookup[m.match_id] = m })
  }

  const byGroup = {}
  groupDetail.forEach(m => {
    const meta = matchMap[m.match_id]
    const grp  = meta?.group ?? '?'
    if (!byGroup[grp]) byGroup[grp] = []
    byGroup[grp].push({ ...m, meta, official: resultLookup[m.match_id] })
  })

  // Points per group + best group logic (same threshold as Tabla)
  const BEST_THRESHOLD = 3
  const groupTotals = {}
  Object.entries(byGroup).forEach(([grp, matches]) => {
    groupTotals[grp] = matches.reduce((s, m) => s + (m.points ?? 0), 0)
  })
  const maxGroupScore = Math.max(...Object.values(groupTotals))
  const isBestGroup   = maxGroupScore >= BEST_THRESHOLD
    ? (grp) => groupTotals[grp] === maxGroupScore
    : () => false

  // Prediction label mapping
  const PRED_LABEL = { L: 'LOCAL', E: 'EMPATE', V: 'VISITA' }

  const sortedKeys = Object.keys(byGroup).sort()
  // 3 columns × 4 groups
  const chunkSize  = Math.ceil(sortedKeys.length / 3)
  const columns    = [0, 1, 2].map(i =>
    sortedKeys.slice(i * chunkSize, (i + 1) * chunkSize)
  ).filter(col => col.length > 0)

  return (
    <Card>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
        <Target size={15} color="var(--color-primary)" />
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', letterSpacing:'0.05em', color:'var(--color-text-1)' }}>FASE DE GRUPOS</div>
          <div style={{ fontSize:'0.65rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>{groupDetail.length} partidos</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {columns.map((groupKeys, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {groupKeys.map(grp => {
              const matches  = byGroup[grp]
              const total    = groupTotals[grp]
              const best     = isBestGroup(grp)
              return (
                <div key={grp} style={{
                  background:   'var(--color-surface-2)',
                  borderRadius: 8,
                  border:       best ? '1px solid #FFB80066' : '1px solid var(--color-border)',
                  boxShadow:    best ? '0 0 0 1px #FFB80022, 0 0 12px 2px #FFB80026' : 'none',
                  overflow:     'hidden',
                }}>
                  {/* Group header */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.45rem 0.625rem 0.35rem' }}>
                    <span style={{ width:16, height:16, borderRadius:3, background:'var(--color-surface)', border:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.58rem', fontWeight:700, color: best ? '#FFB800' : 'var(--color-text-2)', flexShrink:0 }}>{grp}</span>
                    <span style={{ fontSize:'0.62rem', fontFamily:'var(--font-mono)', color: best ? '#FFB800' : 'var(--color-text-3)', letterSpacing:'0.08em', textTransform:'uppercase', flex:1 }}>Grupo {grp}</span>
                    {best && (
                      <span style={{ fontSize:'0.48rem', fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase', color:'#FFB800', background:'#FFB80018', border:'1px solid #FFB80040', borderRadius:3, padding:'1px 5px', lineHeight:'1.5', flexShrink:0 }}>★ MEJOR</span>
                    )}
                    <span style={{ fontSize:'0.65rem', fontFamily:'var(--font-mono)', fontWeight:700, color: best ? '#FFB800' : 'var(--color-text-2)', flexShrink:0 }}>+{total}</span>
                  </div>

                  {/* Column legend */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', padding:'0.2rem 0.625rem 0.2rem', borderTop:'1px solid var(--color-border)', borderBottom:'1px solid var(--color-border)', background:'var(--color-surface)' }}>
                    <span style={{ flex:1, fontSize:'0.47rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>PARTIDO</span>
                    <span style={{ fontSize:'0.47rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0, width:44, textAlign:'center' }}>RESULT. OFICIAL</span>
                    <span style={{ fontSize:'0.47rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0, width:46, textAlign:'center' }}>PRON.</span>
                    <span style={{ fontSize:'0.47rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0, width:20, textAlign:'right' }}>PTS</span>
                  </div>

                  {/* Match rows */}
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {matches.map((m, mi) => {
                      const official  = m.official
                      const isPending = !official || official.status === 'scheduled' || official.result === null
                      const correct   = m.breakdown?.correct
                      const homeGoals = official?.home_goals
                      const awayGoals = official?.away_goals
                      const predLabel = PRED_LABEL[m.prediction] ?? m.prediction
                      return (
                        <div key={m.match_id} style={{
                          display:'flex', alignItems:'center', gap:'0.25rem',
                          padding:'0.3rem 0.625rem',
                          borderTop: mi > 0 ? '1px solid var(--color-border)' : 'none',
                          background: correct ? '#00E67606' : isPending ? 'transparent' : '#FF3D5705',
                        }}>
                          {/* Teams */}
                          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:1 }}>
                            <TeamWithFlag name={m.meta?.home_team} teamMap={teamMap} align="left" />
                            <TeamWithFlag name={m.meta?.away_team} teamMap={teamMap} align="left" />
                          </div>

                          {/* Result oficial: score or pending */}
                          <div style={{ width:44, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {!isPending ? (
                              <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                                <div style={{ width:18, height:16, background:'#FFF', border:'1px solid var(--color-border)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <span style={{ fontSize:'9px', fontWeight:700, color:'#111', lineHeight:1, display:'block' }}>{homeGoals ?? '-'}</span>
                                </div>
                                <span style={{ fontSize:'8px', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>–</span>
                                <div style={{ width:18, height:16, background:'#FFF', border:'1px solid var(--color-border)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <span style={{ fontSize:'9px', fontWeight:700, color:'#111', lineHeight:1, display:'block' }}>{awayGoals ?? '-'}</span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize:'0.55rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>—</span>
                            )}
                          </div>

                          {/* Predicción chip */}
                          <div style={{ width:46, flexShrink:0, display:'flex', justifyContent:'center' }}>
                            <span style={{
                              fontSize:'0.5rem', fontFamily:'var(--font-mono)', fontWeight:700,
                              letterSpacing:'0.04em', textTransform:'uppercase',
                              padding:'2px 5px', borderRadius:4,
                              background: isPending ? 'var(--color-surface)' : correct ? '#00E67618' : '#FF3D5712',
                              border: `1px solid ${isPending ? 'var(--color-border)' : correct ? '#00E67632' : '#FF3D5728'}`,
                              color: isPending ? 'var(--color-text-3)' : correct ? '#00E676' : '#FF3D57',
                              whiteSpace:'nowrap',
                            }}>
                              {predLabel}
                            </span>
                          </div>

                          {/* Points */}
                          <span style={{ fontSize:'0.65rem', fontFamily:'var(--font-mono)', fontWeight:700, color: m.points > 0 ? '#00E676' : isPending ? 'var(--color-text-3)' : '#FF3D57', width:20, textAlign:'right', flexShrink:0 }}>
                            {isPending ? '—' : `+${m.points}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

function StandingsPredictionsSection({ standingsDetail, teamMap }) {
  if (!standingsDetail?.length) return null

  const isMobile = useIsMobile(640)

  const POSITION_POINTS = { 1:4, 2:3, 3:2, 4:1 }
  const BEST_THRESHOLD  = 5

  const maxScore = Math.max(...standingsDetail.map(g => g.total_points ?? 0))
  const isBest   = maxScore >= BEST_THRESHOLD
    ? (g) => g.total_points === maxScore
    : () => false

  const chunkSize = Math.ceil(standingsDetail.length / 4)
  const columns   = [0, 1, 2, 3].map(i =>
    standingsDetail.slice(i * chunkSize, (i + 1) * chunkSize)
  ).filter(col => col.length > 0)

  return (
    <Card>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
        <GitMerge size={15} color="#FFB800" />
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', letterSpacing:'0.05em', color:'var(--color-text-1)' }}>TABLA DE GRUPOS</div>
          <div style={{ fontSize:'0.65rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>{standingsDetail.length} grupos</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${columns.length}, 1fr)`, gap: '0.625rem' }}>
        {columns.map((chunk, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {chunk.map(grp => {
              const best = isBest(grp)
              const realPosMap = {}
              ;(grp.positions ?? []).forEach(p => {
                if (p.real_team) realPosMap[p.real_team] = p.position
              })
              return (
                <div key={grp.group} style={{
                  background:   'var(--color-surface-2)',
                  borderRadius: 8,
                  padding:      '0.625rem 0.75rem',
                  border:       best ? '1px solid #FFB80066' : '1px solid var(--color-border)',
                  boxShadow:    best ? '0 0 0 1px #FFB80022, 0 0 12px 2px #FFB80026' : 'none',
                }}>
                  {/* Header: group name | MEJOR chip (inline) | points */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginBottom:'0.35rem' }}>
                    <span style={{ fontSize:'0.65rem', fontFamily:'var(--font-mono)', color: best ? '#FFB800' : 'var(--color-text-3)', letterSpacing:'0.1em', textTransform:'uppercase', flex:1 }}>
                      Grupo {grp.group}
                    </span>
                    {best && (
                      <span style={{
                        fontSize:'0.5rem', fontFamily:'var(--font-mono)',
                        letterSpacing:'0.08em', textTransform:'uppercase',
                        color:'#FFB800', background:'#FFB80018',
                        border:'1px solid #FFB80040',
                        borderRadius:4, padding:'1px 5px', lineHeight:'1.5', flexShrink:0,
                      }}>★ MEJOR</span>
                    )}
                    <span style={{ fontSize:'0.68rem', fontFamily:'var(--font-mono)', color: best ? '#FFB800' : 'var(--color-text-2)', fontWeight:700, flexShrink:0 }}>
                      +{grp.total_points}
                    </span>
                  </div>
                  {/* Column legend */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', marginBottom:'0.3rem', paddingBottom:'0.25rem', borderBottom:'1px solid var(--color-border)' }}>
                    <span style={{ width:13, flexShrink:0 }} />
                    {!isMobile && <span style={{ width:16, flexShrink:0 }} />}
                    <span style={{ flex:1, fontSize:'0.48rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>PRON</span>
                    <span style={{ fontSize:'0.48rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0, width:22, textAlign:'right' }}>REAL</span>
                    <span style={{ fontSize:'0.48rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0, width:18, textAlign:'right' }}>PTS</span>
                  </div>
                  {/* Rows */}
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {(grp.positions ?? []).map(pos => {
                      const realPos   = pos.predicted_team ? realPosMap[pos.predicted_team] : undefined
                      const hasResult = pos.real_team != null
                      // Binary: acertaste (dorado) o fallaste (rojo)
                      const realColor = pos.correct ? '#FBBF24' : '#FF3D57'
                      const teamObj   = getTeam(pos.predicted_team, teamMap)
                      const flag      = flagUrl(teamObj?.iso2)
                      return (
                        <div key={pos.position} style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
                          {/* Prediction position */}
                          <span style={{ width:13, fontSize:'0.62rem', fontFamily:'var(--font-mono)', color:'var(--color-text-3)', flexShrink:0 }}>
                            {pos.position}.
                          </span>
                          {/* Flag (desktop only) */}
                          {!isMobile && flag && (
                            <img src={flag} alt="" style={{ width:16, height:11, objectFit:'cover', borderRadius:2, flexShrink:0, opacity:0.9 }} />
                          )}
                          {/* Team name */}
                          <span style={{ flex:1, fontSize:'0.72rem', color:'var(--color-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {pos.predicted_team}
                          </span>
                          {/* Real position — binary color */}
                          {hasResult ? (
                            <span style={{
                              fontSize:'0.62rem', fontFamily:'var(--font-mono)',
                              color: realColor, flexShrink:0,
                              width:22, textAlign:'right',
                              fontWeight: pos.correct ? 700 : 400,
                            }}>
                              #{realPos ?? '?'}
                            </span>
                          ) : (
                            <span style={{ fontSize:'0.58rem', color:'var(--color-text-3)', flexShrink:0, width:22, textAlign:'right' }}>—</span>
                          )}
                          {/* Points */}
                          <span style={{ fontSize:'0.62rem', fontFamily:'var(--font-mono)', color: pos.points > 0 ? '#00E676' : 'var(--color-text-3)', width:18, textAlign:'right', flexShrink:0 }}>
                            {hasResult ? `+${pos.points}` : `(${POSITION_POINTS[pos.position]})`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

function PredictionsTab({ data }) {
  const { scoreDetail, matchMap, groupResults, teamMap, userProfile } = data

  // Merge profile group predictions with scoreDetail (played games) so all 72 show from day 0
  const groupDetail = useMemo(() => {
    const fromProfile = userProfile?.group_stage ?? []
    const fromScore   = scoreDetail?.group ?? []
    if (!fromProfile.length) return fromScore
    // scoreDetail wins for scored matches (has points/breakdown); profile covers the rest
    const scoreMap = {}
    fromScore.forEach(m => { scoreMap[m.match_id] = m })
    return fromProfile.map(m =>
      scoreMap[m.match_id] ?? { match_id: m.match_id, prediction: m.prediction, points: 0, breakdown: null }
    )
  }, [userProfile, scoreDetail])

  // Merge profile knockout predictions with scoreDetail so full bracket shows from day 0
  const knockoutDetail = useMemo(() => {
    const fromProfile = userProfile?.knockout ?? []
    const fromScore   = scoreDetail?.knockout ?? []
    if (!fromProfile.length) return fromScore
    // scoreDetail wins for played matches; profile covers unplayed ones
    const scoreMap = {}
    fromScore.forEach(m => { scoreMap[m.match_id] = m })
    return fromProfile.map(m => {
      if (scoreMap[m.match_id]) return scoreMap[m.match_id]
      return {
        match_id:   m.match_id,
        prediction: { home_team: m.home_team, away_team: m.away_team, home_goals: m.home_goals, away_goals: m.away_goals, advance_team: m.advance_team },
        result:     null,
        points:     0,
        breakdown:  null,
      }
    })
  }, [userProfile, scoreDetail])

  // Merge profile standings predictions with scoreDetail
  // userProfile.standings[i] = { group, positions: ["TeamA","TeamB","TeamC","TeamD"] }
  // scoreDetail.standings[i]  = { group, total_points, positions: [{position,predicted_team,real_team,correct,points}] }
  const standingsDetail = useMemo(() => {
    const fromScore   = scoreDetail?.standings ?? []
    const fromProfile = userProfile?.standings  ?? []
    if (fromScore.length) return fromScore   // scored data wins
    if (!fromProfile.length) return []
    // Build from raw profile predictions (no results yet)
    return fromProfile.map(s => ({
      group:        s.group,
      total_points: 0,
      positions:    (s.positions ?? []).map((team, i) => ({
        position:       i + 1,
        predicted_team: team,
        real_team:      null,
        correct:        null,
        points:         null,
      })),
    }))
  }, [userProfile, scoreDetail])

  const [subTab, setSubTab] = useState(() => {
    const hasKnockoutResults = knockoutDetail.some(m => m.result?.home_team != null)
    return hasKnockoutResults ? 'bracket' : 'grupos'
  })

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
      <SubTabs active={subTab} onChange={setSubTab} />

      {subTab === 'grupos' && (
        <GroupPredictionsSection
          groupDetail={groupDetail}
          matchMap={matchMap}
          groupResults={groupResults}
          teamMap={teamMap}
        />
      )}

      {subTab === 'tabla' && (
        <StandingsPredictionsSection standingsDetail={standingsDetail} teamMap={teamMap} />
      )}

      {subTab === 'bracket' && (
        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
            <Crown size={15} color="#FFB800" />
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', letterSpacing:'0.05em', color:'var(--color-text-1)' }}>ELIMINATORIA</div>
              <div style={{ fontSize:'0.65rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>{knockoutDetail.length} partidos</div>
            </div>
          </div>
          <BracketAuditSection
            knockoutDetail={knockoutDetail}
            matchMap={matchMap}
            teamMap={teamMap}
            bonus={scoreDetail?.bonus}
          />
        </Card>
      )}
    </motion.div>
  )
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
      {[...Array(4)].map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12 }}
          style={{ height: i === 0 ? 220 : 80, borderRadius: 12, background: 'var(--color-surface)', marginBottom: '1rem', border: '1px solid var(--color-border)' }}
        />
      ))}
    </div>
  )
}

function ErrorState({ onBack }) {
  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
          Error al cargar el perfil
        </div>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.5rem 1.25rem', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            ← Volver a la tabla
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PlayerProfile() {
  const { userId } = useParams()
  const navigate   = useNavigate()
  const { data, loading, error } = usePlayerProfile(userId)
  const [activeTab, setActiveTab] = useState('resumen')

  if (loading) return <LoadingState />
  if (error || !data?.leaderboard) return <ErrorState onBack={() => navigate('/leaderboard')} />

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
      <motion.button
        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
        onClick={() => navigate('/leaderboard')}
        style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'none', border:'none', color:'var(--color-text-3)', cursor:'pointer', fontSize:'0.8rem', marginBottom:'1.25rem', padding:0 }}
      >
        <ArrowLeft size={14} /> Volver a la tabla
      </motion.button>

      <HeroIdentitySection
        leaderboard={data.leaderboard}
        metrics={data.metrics}
        payoutEntry={data.payoutEntry}
        totalParticipants={data.totalParticipants}
        snapUser={data.snapUser}
        archetype={data.archetype}
        traits={data.traits}
        allLeaderboard={data.allLeaderboard}
        notStarted={data.notStarted}
        alphaRank={data.alphaRank}
      />

      <Tabs active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'resumen'     && <ResumenTab     key="resumen"     data={data} />}
        {activeTab === 'predictions' && <PredictionsTab key="predictions" data={data} />}
        {activeTab === 'timeline'    && <TimelineTab    key="timeline"    data={data} userId={userId} />}
        {activeTab === 'auditoria'   && <AuditoriaTab   key="auditoria" />}
      </AnimatePresence>

    </div>
  )
}
