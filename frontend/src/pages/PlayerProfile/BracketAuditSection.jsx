import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, ChevronDown, ChevronUp, ChevronRight, Check, X, Minus } from 'lucide-react'
import { flagUrl, getTeam } from '@/utils/teams'

// ─── Responsive hook ─────────────────────────────────────────────────────────

function useIsMobile(bp = 680) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_ORDER = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','THIRD_PLACE','FINAL']

const STAGE_LABEL = {
  ROUND_OF_32:   'Ronda de 32',
  ROUND_OF_16:   'Ronda de 16',
  QUARTER_FINAL: 'Cuartos de Final',
  SEMI_FINAL:    'Semifinal',
  THIRD_PLACE:   'Tercer Lugar',
  FINAL:         'Final',
}

const STAGE_SHORT = {
  ROUND_OF_32:   'R32',
  ROUND_OF_16:   'R16',
  QUARTER_FINAL: 'QF',
  SEMI_FINAL:    'SF',
  THIRD_PLACE:   '3P',
  FINAL:         'FIN',
}

const BD_FIELDS = [
  { key: 'home_team',   header: 'Lo', label: 'Local'      },
  { key: 'away_team',   header: 'Vi', label: 'Visitante'  },
  { key: 'home_goals',  header: 'GL', label: 'Gol Local'  },
  { key: 'away_goals',  header: 'GV', label: 'Gol Visit.' },
  { key: 'exact_goals', header: 'Ex', label: 'Exacto'     },
]

const PREVIEW_COUNT = 2
const GRID = '28px 1fr 70px 70px 100px 42px 128px'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchIsPending(result) {
  return !result || result.home_team === null || result.status === 'scheduled'
}

function predAdvance(pred) {
  return pred?.advance ?? pred?.advance_team ?? null
}

function resultAdvance(res) {
  return res?.advance_team ?? res?.advance ?? null
}


function ScoreBox({ value }) {
  return (
    <div style={{
      width: 20, height: 18,
      background: '#FFF', border: '1px solid var(--color-border)',
      borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#111', fontFamily: 'var(--font-mono)' }}>
        {value ?? '?'}
      </span>
    </div>
  )
}

function ScorePair({ home, away }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <ScoreBox value={home} />
      <span style={{ fontSize: 8, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>–</span>
      <ScoreBox value={away} />
    </div>
  )
}

function TeamFlag({ name, teamMap, size = 11, nameColor }) {
  const team = getTeam(name, teamMap)
  const flag = team ? flagUrl(team.iso2) : null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
      {flag && (
        <img src={flag} alt="" style={{ width: Math.round(size * 1.4), height: size, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
      )}
      <span style={{ fontSize: size, color: nameColor ?? 'var(--color-text-1)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name ?? 'TBD'}
      </span>
    </span>
  )
}

// ─── Breakdown Dot ────────────────────────────────────────────────────────────

function BreakdownDot({ val }) {
  if (val === undefined || val === null) {
    return (
      <span style={{ width: 15, height: 15, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Minus size={7} color="var(--color-text-3)" strokeWidth={2} />
      </span>
    )
  }
  return (
    <span style={{
      width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: val ? 'color-mix(in srgb, var(--color-success) 18%, transparent)' : 'color-mix(in srgb, var(--color-error) 18%, transparent)',
      border: `1px solid ${val ? 'color-mix(in srgb, var(--color-success) 40%, transparent)' : 'color-mix(in srgb, var(--color-error) 40%, transparent)'}`,
    }}>
      {val ? <Check size={8} color="var(--color-success)" strokeWidth={3} /> : <X size={8} color="var(--color-error)" strokeWidth={3} />}
    </span>
  )
}

// ─── Breakdown Legend ─────────────────────────────────────────────────────────

function BreakdownLegend() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.875rem', padding: '0.625rem 0.875rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, marginTop: '0.75rem' }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desglose:</span>
      {BD_FIELDS.map(f => (
        <span key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: 'var(--color-text-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-3)', fontSize: '0.65rem' }}>{f.header}</span>
          {f.label}
        </span>
      ))}
    </div>
  )
}

// ─── Stats Header ─────────────────────────────────────────────────────────────

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ value, total, color = 'var(--color-primary)', size = 68, strokeWidth = 6 }) {
  const R   = (size/2) - strokeWidth
  const cx  = size / 2
  const pct = total > 0 ? Math.min(1, value / total) : 0
  const C   = 2 * Math.PI * R
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cx} r={R} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - pct)}
        strokeLinecap="round" />
    </svg>
  )
}

function StatsHeader({ knockoutDetail, matchMap, teamMap, finalMatch, predictedChamp, bonus, isMobile }) {
  const played    = knockoutDetail.filter(m => !matchIsPending(m.result))
  const exactHits = played.filter(m => m.breakdown?.exact_goals).length
  const matchPts  = knockoutDetail.reduce((s, m) => s + (m.points ?? 0), 0)
  const bonusPts  = (bonus?.champion?.points ?? 0) + (bonus?.third_place?.points ?? 0)
  const totalPts  = matchPts + bonusPts
  const maxPts    = knockoutDetail.length * 5 + 20

  const realChamp    = !matchIsPending(finalMatch?.result) ? resultAdvance(finalMatch?.result) : null
  const champCorrect = !!(realChamp && predictedChamp === realChamp)
  const champWrong   = !!(realChamp && predictedChamp !== realChamp)
  const champTeam    = predictedChamp ? getTeam(predictedChamp, teamMap) : null
  const champFlag    = champTeam ? flagUrl(champTeam.iso2) : null

  const exactPct = played.length > 0 ? ((exactHits / played.length) * 100).toFixed(0) : null

  const cardBase = { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10 }

  // ── Shared card content builders ──────────────────────────────────────────
  const card1 = (
    <div style={{ ...cardBase, padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <DonutChart value={played.length} total={knockoutDetail.length} color="var(--color-primary)" size={72} strokeWidth={6} />
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-1)', lineHeight: 1 }}>{played.length}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-3)', lineHeight: 1 }}>/ {knockoutDetail.length}</span>
        </div>
      </div>
      <span style={{ fontSize: isMobile ? '0.62rem' : '0.9rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>Partidos Completados</span>
    </div>
  )

  const card2 = (
    <div style={{ ...cardBase, padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.0rem', fontWeight: 700, color: 'var(--color-success)', lineHeight: 1 }}>+{totalPts}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--color-text-3)', marginTop: '0.2rem' }}>{totalPts} / {maxPts} pts posibles</div>
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)' }} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{exactPct != null ? `${exactPct}%` : '—'}</div>
          <div style={{ fontSize: '0.52rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>Marcador Exacto</div>
        </div>
      </div>
    </div>
  )

  const card3 = (
    <div style={{
      ...cardBase,
      background: champCorrect ? 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface-2))' : champWrong ? 'color-mix(in srgb, var(--color-error) 8%, var(--color-surface-2))' : 'var(--color-surface-2)',
      border: `1px solid ${champCorrect ? 'color-mix(in srgb, var(--color-success) 30%, transparent)' : champWrong ? 'color-mix(in srgb, var(--color-error) 30%, transparent)' : 'var(--color-border)'}`,
      padding: '0.875rem 0.75rem', display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? '0.75rem' : '0.4rem', textAlign: isMobile ? 'left' : 'center',
    }}>
      {predictedChamp ? (
        <>
          {champFlag && <img src={champFlag} alt="" style={{ width: 34, height: 23, objectFit: 'cover', borderRadius: 3, boxShadow: '0 1px 6px rgba(0,0,0,0.45)', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 700, lineHeight: 1.2, color: champCorrect ? 'var(--color-success)' : champWrong ? 'var(--color-error)' : 'var(--color-text-1)', display: 'block' }}>
              {predictedChamp}
            </span>
            {champCorrect && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.6rem', color: 'var(--color-success)', fontFamily: 'var(--font-mono)', marginTop: 3 }}><Check size={10} strokeWidth={3} /> Acertaste</span>}
            {champWrong && realChamp && <span style={{ fontSize: '0.58rem', color: 'var(--color-error)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'block' }}>Ganó: {realChamp}</span>}
            {!realChamp && <span style={{ fontSize: '0.56rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'block' }}>pendiente · 15 pts</span>}
          </div>
        </>
      ) : (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', fontSize: '0.9rem' }}>—</span>
      )}
      {!isMobile && <div style={{ fontSize: '0.55rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>CAMPEÓN PRED.</div>}
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {card1}
          {card2}
        </div>
        {card3}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>

      {card1}
      {card2}
      {card3}
    </div>
  )
}

// ─── Table Headers + Match Row ────────────────────────────────────────────────

function TableHeaders() {
  const s = { fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '0.375rem', padding: '0.3rem 0.625rem 0.375rem', marginBottom: '0.125rem' }}>
      <span style={s}>#</span>
      <span style={s}>PRON → REAL</span>
      <span style={{ ...s, textAlign: 'center' }}>Pron.</span>
      <span style={{ ...s, textAlign: 'center' }}>Result.</span>
      <span style={{ ...s, textAlign: 'center' }}>Avanza</span>
      <span style={{ ...s, textAlign: 'right' }}>Pts</span>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
        {BD_FIELDS.map(f => <span key={f.key} style={{ ...s, width: 15, textAlign: 'center' }}>{f.header}</span>)}
      </div>
    </div>
  )
}

function MatchRow({ m, teamMap, predictedChamp, bonusDetail }) {
  const pending  = matchIsPending(m.result)
  const pred     = m.prediction ?? {}
  const res      = m.result     ?? {}
  const bd       = m.breakdown  ?? {}
  const totalPts = m.points ?? 0
  const isChamp  = predAdvance(pred) === predictedChamp

  // Achievement tiers — mutually exclusive, PERFECT takes priority
  const isPerfect = !pending && !!(bd.home_team && bd.away_team && bd.home_goals && bd.away_goals && bd.exact_goals)
  const isExact   = !pending && !!bd.exact_goals && !isPerfect

  const rowBg = isPerfect
    ? 'color-mix(in srgb, #FBBF24 6%, transparent)'
    : isExact
    ? 'color-mix(in srgb, #38BDF8 4%, transparent)'
    : !pending && totalPts > 0 ? 'color-mix(in srgb, var(--color-success) 4%, transparent)' : 'transparent'

  const rowBorder = isPerfect
    ? '#FBBF2460'
    : isExact
    ? '#38BDF848'
    : isChamp
    ? 'color-mix(in srgb, var(--color-accent) 20%, var(--color-border))'
    : !pending && totalPts === 0 ? 'color-mix(in srgb, var(--color-error) 10%, var(--color-border))' : 'var(--color-border)'

  const rowShadow = isPerfect
    ? '0 0 10px #FBBF2420, inset 0 0 20px #FBBF2408'
    : 'none'

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 7, marginBottom: '0.25rem', border: `1px solid ${rowBorder}`, boxShadow: rowShadow }}>
      {isPerfect && (
        <motion.div
          style={{ position: 'absolute', top: 0, bottom: 0, width: '55%', background: 'linear-gradient(90deg, transparent, #FBBF2422, transparent)', pointerEvents: 'none', zIndex: 0 }}
          animate={{ left: ['-55%', '155%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
        />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '0.375rem', padding: '0.45rem 0.625rem', background: rowBg, alignItems: 'center', position: 'relative', zIndex: 1 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-text-3)', textAlign: 'right' }}>{m.match_id}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {/* Home: solo muestra real si es diferente al pronóstico */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
          <TeamFlag name={pred.home_team} teamMap={teamMap} size={10} nameColor={!pending && bd.home_team ? '#FBBF24' : undefined} />
          {!pending && !bd.home_team && res.home_team && (<>
            <span style={{ fontSize: 8, color: 'var(--color-text-3)', flexShrink: 0, margin: '3px', letterSpacing: '-1px' }}>──▶</span>
            <TeamFlag name={res.home_team} teamMap={teamMap} size={10} nameColor='#FF3D57' />
          </>)}
        </div>
        {/* Away: solo muestra real si es diferente al pronóstico */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
          <TeamFlag name={pred.away_team} teamMap={teamMap} size={10} nameColor={!pending && bd.away_team ? '#FBBF24' : undefined} />
          {!pending && !bd.away_team && res.away_team && (<>
            <span style={{ fontSize: 8, color: 'var(--color-text-3)', flexShrink: 0, margin: '3px', letterSpacing: '-1px' }}>──▶</span>
            <TeamFlag name={res.away_team} teamMap={teamMap} size={10} nameColor='#FF3D57' />
          </>)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ScorePair home={pred.home_goals} away={pred.away_goals} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {pending ? <span style={{ fontSize: '0.65rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>—</span> : <ScorePair home={res.home_goals} away={res.away_goals} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <span style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--color-primary)', maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{predAdvance(pred) ?? '—'}</span>
        {!pending && <span style={{ fontSize: '0.6rem', color: bd.advance ? 'var(--color-success)' : 'var(--color-error)', maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resultAdvance(res) ?? '—'}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: pending ? 'var(--color-text-3)' : totalPts > 0 ? 'var(--color-success)' : 'var(--color-text-3)' }}>
          {pending ? '—' : `+${totalPts}`}
        </span>
        {bonusDetail && !pending && (() => {
          const earned  = bonusDetail.correct
          const pts     = bonusDetail.points
          const pending2 = bonusDetail.actual === null
          if (pending2) return <span style={{ fontSize:'0.55rem',fontFamily:'var(--font-mono)',color:'var(--color-text-3)',marginTop:2 }}>+{pts} si acierta</span>
          return (
            <span style={{ fontSize:'0.6rem',fontFamily:'var(--font-mono)',fontWeight:700,padding:'1px 5px',borderRadius:3,marginTop:2,
              background: earned ? 'rgba(212,160,23,0.15)' : 'rgba(100,116,139,0.10)',
              border: `1px solid ${earned ? 'rgba(212,160,23,0.4)' : 'rgba(100,116,139,0.2)'}`,
              color: earned ? '#D4A017' : 'var(--color-text-3)',
            }}>{earned ? `+${pts} BONO` : '+0 BONO'}</span>
          )
        })()}
        {isPerfect && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.44rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#FBBF24', background: '#FBBF2418', border: '1px solid #FBBF2450', borderRadius: 3, padding: '1px 5px', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            <Crown size={7} color="#FBBF24" strokeWidth={2.5} style={{ flexShrink: 0 }} /> PERFECTO
          </span>
        )}
        {isExact && (
          <span style={{ fontSize: '0.44rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#38BDF8', background: '#38BDF815', border: '1px solid #38BDF840', borderRadius: 3, padding: '1px 4px', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            ⚽ EXACTO
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
        {BD_FIELDS.map(f => <BreakdownDot key={f.key} val={pending ? undefined : bd[f.key]} />)}
      </div>
    </div>
  </div>
  )
}

// ─── Mobile Match Card ────────────────────────────────────────────────────────

function MobileMatchCard({ m, teamMap, predictedChamp, bonusDetail }) {
  const [expanded, setExpanded] = useState(false)
  const pending      = matchIsPending(m.result)
  const pred         = m.prediction ?? {}
  const res          = m.result     ?? {}
  const bd           = m.breakdown  ?? {}
  const totalPts     = m.points ?? 0
  const isPerfect    = !pending && !!(bd.home_team && bd.away_team && bd.home_goals && bd.away_goals && bd.exact_goals)
  const isExact      = !pending && !!bd.exact_goals && !isPerfect
  const advancePred  = predAdvance(pred)
  const advanceReal  = resultAdvance(res)
  const advanceOk    = !pending && advancePred != null && advancePred === advanceReal

  const rowBg = isPerfect
    ? 'color-mix(in srgb, #FBBF24 6%, transparent)'
    : !pending && totalPts > 0 ? 'color-mix(in srgb, var(--color-success) 4%, transparent)' : 'transparent'
  const rowBorder = isPerfect ? '#FBBF2460'
    : !pending && totalPts === 0 ? 'color-mix(in srgb, var(--color-error) 12%, var(--color-border))'
    : 'var(--color-border)'

  return (
    <div
      onClick={() => !pending && setExpanded(e => !e)}
      style={{ background: rowBg, border: `1px solid ${rowBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: pending ? 'default' : 'pointer' }}
    >
      {/* Row 1: match ID + badges + pts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>#{m.match_id}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isPerfect && <span style={{ fontSize:'0.45rem',fontFamily:'var(--font-mono)',letterSpacing:'0.07em',textTransform:'uppercase',color:'#FBBF24',background:'#FBBF2418',border:'1px solid #FBBF2450',borderRadius:3,padding:'1px 4px',lineHeight:1.5 }}>PERFECTO</span>}
          {isExact   && <span style={{ fontSize:'0.45rem',fontFamily:'var(--font-mono)',letterSpacing:'0.07em',textTransform:'uppercase',color:'#38BDF8',background:'#38BDF815',border:'1px solid #38BDF840',borderRadius:3,padding:'1px 4px',lineHeight:1.5 }}>EXACTO</span>}
          <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: pending ? 'var(--color-text-3)' : totalPts > 0 ? 'var(--color-success)' : 'var(--color-text-3)' }}>
            {pending ? '—' : `+${totalPts}`}
          </span>
        </div>
      </div>

      {/* Row 2: home vs away + predicted score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: !pending && bd.home_team ? '#FBBF24' : 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pred.home_team ?? '—'}
        </span>
        <ScorePair home={pred.home_goals} away={pred.away_goals} />
        <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: !pending && bd.away_team ? '#FBBF24' : 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
          {pred.away_team ?? '—'}
        </span>
      </div>

      {/* Row 3: advance + hint */}
      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>Avanza:</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: pending ? 'var(--color-primary)' : advanceOk ? 'var(--color-success)' : 'var(--color-error)' }}>
          {advancePred ?? '—'}
        </span>
        {!pending && !advanceOk && advanceReal && (
          <span style={{ fontSize: '0.58rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            → <span style={{ color: 'var(--color-error)' }}>{advanceReal}</span>
          </span>
        )}
        {!pending && (
          <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            {expanded ? '▲ cerrar' : '▼ desglose'}
          </span>
        )}
      </div>

      {/* Expanded: real result + breakdown dots */}
      {expanded && !pending && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>REAL:</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.home_team}</span>
            <ScorePair home={res.home_goals} away={res.away_goals} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{res.away_team}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {BD_FIELDS.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <BreakdownDot val={bd[f.key]} />
                <span style={{ fontSize: '0.5rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{f.header}</span>
              </div>
            ))}
          </div>
          {bonusDetail && (() => {
            const earned = bonusDetail.correct
            const pts    = bonusDetail.points
            if (bonusDetail.actual === null)
              return <div style={{ marginTop: 6, fontSize:'0.55rem',fontFamily:'var(--font-mono)',color:'var(--color-text-3)' }}>+{pts} pts si acierta el campeón</div>
            return (
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize:'0.6rem',fontFamily:'var(--font-mono)',fontWeight:700,padding:'1px 5px',borderRadius:3,
                  background: earned ? 'rgba(212,160,23,0.15)' : 'rgba(100,116,139,0.10)',
                  border: `1px solid ${earned ? 'rgba(212,160,23,0.4)' : 'rgba(100,116,139,0.2)'}`,
                  color: earned ? '#D4A017' : 'var(--color-text-3)',
                }}>{earned ? `+${pts} BONO` : '+0 BONO'}</span>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─── Stage Section ────────────────────────────────────────────────────────────

function StageSection({ stage, matches, teamMap, predictedChamp, bonus, isMobile }) {
  const [open, setOpen]         = useState(true)
  const [expanded, setExpanded] = useState(false)
  const visible  = expanded ? matches : matches.slice(0, PREVIEW_COUNT)
  const hidden   = matches.length - PREVIEW_COUNT
  const played   = matches.filter(m => !matchIsPending(m.result))
  const correct  = played.filter(m => (m.points ?? 0) > 0).length
  const totalPts = matches.reduce((s, m) => s + (m.points ?? 0), 0)

  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: open ? '8px 8px 0 0' : 8, padding: '0.45rem 0.75rem', cursor: 'pointer' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, textAlign: 'left' }}>
          {STAGE_LABEL[stage] ?? stage}
        </span>
        {played.length > 0 ? (
          <>
            <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{correct}/{played.length} aciertos</span>
            {(() => {
              const bonusForStage = stage === 'FINAL' ? bonus?.champion
                                  : stage === 'THIRD_PLACE' ? bonus?.third_place
                                  : null
              const bonusPts = bonusForStage?.points ?? 0
              const totalWithBonus = totalPts + bonusPts
              return <span style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: totalWithBonus > 0 ? 'var(--color-success)' : 'var(--color-text-3)' }}>+{totalWithBonus}pts</span>
            })()}
          </>
        ) : (
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>pendiente</span>
        )}
        {open ? <ChevronUp size={12} color="var(--color-text-3)" style={{ flexShrink: 0 }} /> : <ChevronDown size={12} color="var(--color-text-3)" style={{ flexShrink: 0 }} />}
      </button>
      {open && (isMobile ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '0.5rem' }}>
          {visible.map(m => {
            const bonusDetail = m.match_id === 104 ? bonus?.champion
                              : m.match_id === 103 ? bonus?.third_place
                              : null
            return <MobileMatchCard key={m.match_id} m={m} teamMap={teamMap} predictedChamp={predictedChamp} bonusDetail={bonusDetail} />
          })}
          {hidden > 0 && !expanded && (
            <button onClick={e => { e.stopPropagation(); setExpanded(true) }} style={{ width: '100%', marginTop: '0.25rem', padding: '0.375rem', background: 'transparent', border: '1px dashed var(--color-border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
              Ver {hidden} partido{hidden !== 1 ? 's' : ''} más ▼
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '0.5rem 0.375rem 0.375rem', overflowX: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            <TableHeaders />
            {visible.map(m => {
              const bonusDetail = m.match_id === 104 ? bonus?.champion
                                : m.match_id === 103 ? bonus?.third_place
                                : null
              return <MatchRow key={m.match_id} m={m} teamMap={teamMap} predictedChamp={predictedChamp} bonusDetail={bonusDetail} />
            })}
            {hidden > 0 && !expanded && (
              <button onClick={() => setExpanded(true)} style={{ width: '100%', marginTop: '0.375rem', padding: '0.375rem', background: 'transparent', border: '1px dashed var(--color-border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                Ver {hidden} partido{hidden !== 1 ? 's' : ''} más
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BracketAuditSection({ knockoutDetail, matchMap, teamMap, bonus }) {
  const isMobile  = useIsMobile(680)
  const [champOnly, setChampOnly] = useState(false)

  if (!knockoutDetail?.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.8rem' }}>
        Sin datos de eliminatoria disponibles.
      </div>
    )
  }

  // Group by stage using matchMap, then by whatever key matchMap provides
  // Build byStage from whatever stage data is available in matchMap
  const byStage = {}
  knockoutDetail.forEach(m => {
    const meta  = matchMap?.[m.match_id] ?? matchMap?.[String(m.match_id)]
    const stage = meta?.stage ?? `match_${m.match_id}`  // use raw key if no stage
    if (!byStage[stage]) byStage[stage] = []
    byStage[stage].push(m)
  })
  Object.values(byStage).forEach(arr => arr.sort((a, b) => a.match_id - b.match_id))

  // Show stages in STAGE_ORDER first, then any unknown stages at end
  const knownStages   = STAGE_ORDER.filter(s => byStage[s])
  const unknownStages = Object.keys(byStage).filter(s => !STAGE_ORDER.includes(s))
  const stagesToShow  = [...knownStages, ...unknownStages]

  // Predicted champion
  const finalMatch     = byStage['FINAL']?.[0] ?? knockoutDetail[knockoutDetail.length - 1]
  const predictedChamp = predAdvance(finalMatch?.prediction) ?? null

  // Champion path IDs
  const champPathIds = new Set(
    predictedChamp
      ? knockoutDetail.filter(m => predAdvance(m.prediction) === predictedChamp).map(m => m.match_id)
      : []
  )

  return (
    <div>
      <StatsHeader
        knockoutDetail={knockoutDetail}
        matchMap={matchMap}
        teamMap={teamMap}
        finalMatch={finalMatch}
        predictedChamp={predictedChamp}
        bonus={bonus}
        isMobile={isMobile}
      />

      {predictedChamp && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '0.625rem', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>Mostrar solo mi camino del campeón</span>
          <button
            onClick={() => setChampOnly(v => !v)}
            style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: champOnly ? 'var(--color-accent)' : 'var(--color-border)', position: 'relative', transition: 'background 0.2s', padding: 0 }}
          >
            <span style={{ position: 'absolute', top: 2, left: champOnly ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#FFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </button>
        </div>
      )}

      {stagesToShow.map(stage => {
        const matches  = byStage[stage]
        const filtered = champOnly ? matches.filter(m => champPathIds.has(m.match_id)) : matches
        if (champOnly && filtered.length === 0) return null
        return (
          <StageSection
            key={stage}
            stage={stage}
            matches={filtered}
            teamMap={teamMap}
            predictedChamp={predictedChamp}
            bonus={bonus}
            isMobile={isMobile}
          />
        )
      })}

      {!isMobile && <BreakdownLegend />}
    </div>
  )
}
