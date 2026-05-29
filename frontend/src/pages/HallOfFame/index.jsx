import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DATA_URLS } from '../../config/urls'

const BASE = import.meta.env.BASE_URL

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

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

// Visual-only props — text comes dynamically from archetype_registry_v1.json
const ARCH_STYLE = {
  front_runner:        { color: '#FBBF24', border: 'rgba(251,191,36,0.35)',  bg: 'rgba(251,191,36,0.06)',  imgUrl: `${BASE}assets/archetypes/front_runner.png` },
  sharpshooter:        { color: '#38BDF8', border: 'rgba(56,189,248,0.35)',  bg: 'rgba(56,189,248,0.06)',  imgUrl: `${BASE}assets/archetypes/sharpshooter.png` },
  clutch_hunter:       { color: '#FB923C', border: 'rgba(251,146,60,0.35)',  bg: 'rgba(251,146,60,0.06)',  imgUrl: `${BASE}assets/archetypes/clutch_hunter.png` },
  consistency_machine: { color: '#34D399', border: 'rgba(52,211,153,0.35)', bg: 'rgba(52,211,153,0.06)', imgUrl: `${BASE}assets/archetypes/consistency_machine.png` },
}
const ARCH_ORDER = ['front_runner', 'sharpshooter', 'clutch_hunter', 'consistency_machine']

// ── SVGs ────────────────────────────────────────────────────────────────────

function TrophyWithLaurel({ size = 160 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hofGlow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="rgba(251,191,36,0.25)" />
          <stop offset="100%" stopColor="rgba(251,191,36,0)" />
        </radialGradient>
        <linearGradient id="hofCupGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="hofCupShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="95" rx="55" ry="5" fill="url(#hofGlow)" />
      {/* Laurel left */}
      <path d="M50 130 Q40 110 38 90 Q36 70 45 55" stroke="#78716C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="44" cy="125" rx="9" ry="5" transform="rotate(-40 44 125)" fill="#A16207" opacity="0.85"/>
      <ellipse cx="39" cy="113" rx="9" ry="5" transform="rotate(-50 39 113)" fill="#92400E" opacity="0.85"/>
      <ellipse cx="36" cy="101" rx="9" ry="5" transform="rotate(-55 36 101)" fill="#A16207" opacity="0.85"/>
      <ellipse cx="36" cy="89"  rx="9" ry="5" transform="rotate(-60 36 89)"  fill="#92400E" opacity="0.85"/>
      <ellipse cx="39" cy="78"  rx="9" ry="5" transform="rotate(-50 39 78)"  fill="#A16207" opacity="0.85"/>
      <ellipse cx="44" cy="67"  rx="8" ry="4" transform="rotate(-40 44 67)"  fill="#92400E" opacity="0.85"/>
      <ellipse cx="44" cy="125" rx="9" ry="5" transform="rotate(-40 44 125)" fill="#FBBF24" opacity="0.12"/>
      <ellipse cx="39" cy="101" rx="9" ry="5" transform="rotate(-55 39 101)" fill="#FBBF24" opacity="0.12"/>
      {/* Laurel right */}
      <path d="M110 130 Q120 110 122 90 Q124 70 115 55" stroke="#78716C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="116" cy="125" rx="9" ry="5" transform="rotate(40 116 125)"  fill="#A16207" opacity="0.85"/>
      <ellipse cx="121" cy="113" rx="9" ry="5" transform="rotate(50 121 113)"  fill="#92400E" opacity="0.85"/>
      <ellipse cx="124" cy="101" rx="9" ry="5" transform="rotate(55 124 101)"  fill="#A16207" opacity="0.85"/>
      <ellipse cx="124" cy="89"  rx="9" ry="5" transform="rotate(60 124 89)"   fill="#92400E" opacity="0.85"/>
      <ellipse cx="121" cy="78"  rx="9" ry="5" transform="rotate(50 121 78)"   fill="#A16207" opacity="0.85"/>
      <ellipse cx="116" cy="67"  rx="8" ry="4" transform="rotate(40 116 67)"   fill="#92400E" opacity="0.85"/>
      <ellipse cx="116" cy="125" rx="9" ry="5" transform="rotate(40 116 125)"  fill="#FBBF24" opacity="0.12"/>
      <ellipse cx="124" cy="101" rx="9" ry="5" transform="rotate(55 124 101)"  fill="#FBBF24" opacity="0.12"/>
      {/* Base */}
      <rect x="62" y="118" width="36" height="8" rx="2" fill="url(#hofCupGold)" opacity="0.9"/>
      <rect x="55" y="126" width="50" height="7" rx="3" fill="url(#hofCupShade)" opacity="0.9"/>
      <rect x="73" y="108" width="14" height="12" fill="url(#hofCupGold)" opacity="0.9"/>
      {/* Cup */}
      <path d="M52 55 Q80 48 108 55 L102 108 H58 Z" fill="url(#hofCupGold)" opacity="0.9"/>
      <path d="M52 55 L58 108 H102 L108 55 Z" fill="url(#hofCupShade)" opacity="0.3"/>
      <path d="M50 55 Q80 47 110 55" stroke="#FDE68A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M63 62 Q72 58 76 62 L74 100 H66 Z" fill="#FDE68A" opacity=""/>
      {/* Handles */}
      <path d="M52 65 Q36 70 37 82 Q38 94 52 94" stroke="url(#hofCupGold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M108 65 Q124 70 123 82 Q122 94 108 94" stroke="url(#hofCupGold)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Crown */}
      <rect x="66" y="40" width="28" height="12" rx="2" fill="url(#hofCupGold)"/>
      <polygon points="66,40 70,28 75,40" fill="url(#hofCupGold)"/>
      <polygon points="77,40 80,24 83,40" fill="url(#hofCupGold)"/>
      <polygon points="85,40 90,28 94,40" fill="url(#hofCupGold)"/>
      <circle cx="70" cy="27" r="2.5" fill="#FDE68A"/>
      <circle cx="80" cy="23" r="3"   fill="#FDE68A"/>
      <circle cx="90" cy="27" r="2.5" fill="#FDE68A"/>
      <rect x="66" y="40" width="28" height="5" rx="2" fill="#FDE68A" opacity="0.3"/>
      {/* Sparkles */}
      <path d="M30 48 L31.5 44 L33 48 L37 49.5 L33 51 L31.5 55 L30 51 L26 49.5 Z" fill="#FDE68A" opacity="0.6"/>
      <path d="M125 52 L126 49 L127 52 L130 53 L127 54 L126 57 L125 54 L122 53 Z" fill="#FDE68A" opacity="0.5"/>
    </svg>
  )
}

function CoinsSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <ellipse cx="13" cy="6" rx="5.5" ry="3.5" fill="rgba(251,191,36,0.18)" stroke="#FBBF24" strokeWidth="1.2"/>
      <path d="M7.5 6C7.5 6 7.5 8 13 8C18.5 8 18.5 6 18.5 6" stroke="#FBBF24" strokeWidth="1.2"/>
      <ellipse cx="11" cy="11.5" rx="5.5" ry="3.5" fill="rgba(251,191,36,0.18)" stroke="#FBBF24" strokeWidth="1.2"/>
      <path d="M5.5 11.5C5.5 11.5 5.5 13.5 11 13.5C16.5 13.5 16.5 11.5 16.5 11.5" stroke="#FBBF24" strokeWidth="1.2"/>
      <ellipse cx="9" cy="17" rx="5.5" ry="3.5" fill="rgba(251,191,36,0.22)" stroke="#FBBF24" strokeWidth="1.2"/>
      <path d="M3.5 17C3.5 17 3.5 19 9 19C14.5 19 14.5 17 14.5 17" stroke="#FBBF24" strokeWidth="1.2"/>
    </svg>
  )
}

function ArchBadge({ id, archMeta }) {
  const style = ARCH_STYLE[id]
  const meta  = archMeta?.[id]
  if (!id || !style) return null
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 6,
      border: `1px solid ${style.border}`, background: style.bg,
      color: style.color, fontSize: 12, fontWeight: 600,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>{meta?.display_name ?? id}</span>
  )
}

function ArchLabel({ id, archMeta }) {
  const style = ARCH_STYLE[id]
  const meta  = archMeta?.[id]
  if (!id || !style) return <span style={{ color: 'var(--color-text-3)', fontSize: 13 }}>—</span>
  return <span style={{ color: style.color, fontSize: 13, fontWeight: 500 }}>{meta?.display_name ?? id}</span>
}

function MedalIcon({ rank }) {
  const base = { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)', flexShrink: 0 }
  if (rank === 1) return <div style={{ ...base, background: 'rgba(251,191,36,0.22)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.5)' }}>1</div>
  if (rank === 2) return <div style={{ ...base, background: 'rgba(200,210,230,0.12)', color: '#C8D2E6', border: '1px solid rgba(200,210,230,0.3)' }}>2</div>
  if (rank === 3) return <div style={{ ...base, background: 'rgba(200,140,80,0.12)', color: '#C88C50', border: '1px solid rgba(200,140,80,0.3)' }}>3</div>
  return <span style={{ color: 'var(--color-text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', width: 22, textAlign: 'center' }}>{rank}</span>
}

function rowBg(rank) {
  if (rank === 1) return 'linear-gradient(90deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.02) 100%)'
  if (rank === 2) return 'linear-gradient(90deg, rgba(192,210,235,0.06) 0%, rgba(192,210,235,0.01) 100%)'
  if (rank === 3) return 'linear-gradient(90deg, rgba(200,140,80,0.07) 0%, rgba(200,140,80,0.01) 100%)'
  return 'transparent'
}
function rowBorderLeft(rank) {
  if (rank === 1) return '3px solid rgba(251,191,36,0.7)'
  if (rank === 2) return '3px solid rgba(192,210,235,0.35)'
  if (rank === 3) return '3px solid rgba(200,140,80,0.4)'
  return '3px solid transparent'
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function HallOfFame() {
  const isMobile = useIsMobile()
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const [lb, pay, arch, exactData, genData, registry, knockout] = await Promise.all([
        fetchOptional(DATA_URLS.leaderboard),
        fetchOptional(DATA_URLS.payouts),
        fetchOptional(DATA_URLS.archetypes),
        fetchRobust(DATA_URLS.precisionMarcadoresExactos),
        fetchRobust(DATA_URLS.precisionGeneral),
        fetchRobust(DATA_URLS.archetypeRegistry),
        fetchOptional(DATA_URLS.knockoutResults),
      ])
      if (!lb) return

      // Tournament is over only when match 104 (Final) has status 'final'
      const tournamentOver = Array.isArray(knockout)
        && knockout.some(m => m.match_id === 104 && m.status === 'final')

      // Build archMeta: id → registry entry (display_name, short_description, identity_formula, …)
      const archMeta = {}
      if (registry?.archetypes) {
        registry.archetypes.forEach(a => { archMeta[a.id] = a })
      }

      const payMap = {}, archMap = {}, exactMap = {}, genMap = {}
      if (pay)              pay.forEach(p => { payMap[p.display_name] = p.payout })
      if (arch?.users)      arch.users.forEach(u => { archMap[u.display_name] = u.active_archetype })
      if (exactData?.users) exactData.users.forEach(u => { exactMap[u.display_name] = u })
      if (genData?.users)   genData.users.forEach(u => { genMap[u.display_name] = u })

      const rows = lb.map(u => ({
        ...u,
        payout:    payMap[u.display_name] ?? 0,
        archetype: archMap[u.display_name] ?? null,
      }))

      const champion    = rows[0]
      const champExact  = exactMap[champion.display_name]
      const champGen    = genMap[champion.display_name]
      const champStats  = {
        exactosPct:      champExact ? Math.round(champExact.extra.exact_score_precision * 100) : null,
        consistenciaPct: champGen   ? Math.round(champGen.extra.category_breakdown.group.accuracy) : null,
      }

      const archetypeGroups = {}
      ARCH_ORDER.forEach(id => { archetypeGroups[id] = [] })
      rows.forEach(u => { if (u.archetype && archetypeGroups[u.archetype]) archetypeGroups[u.archetype].push(u) })

      setData({ rows, champion, champStats, archetypeGroups, archMeta, tournamentOver })
    }
    load()
  }, [])

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
        Cargando...
      </div>
    )
  }

  const { rows, champion, champStats, archetypeGroups, archMeta, tournamentOver } = data
  const payoutCutoff = rows.findIndex(r => r.payout === 0)
  // Gap reference point: points of the last paid position
  const lastPaidPts = payoutCutoff > 0
    ? rows[payoutCutoff - 1].total_points
    : rows[rows.length - 1].total_points

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #06060d 0%, #0d0d1c 60%, var(--color-surface) 100%)',
        padding: tournamentOver
          ? (isMobile ? '44px 20px 36px' : '52px 48px 42px')
          : (isMobile ? '28px 20px 24px' : '32px 48px 28px'),
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: '50%', top: isMobile ? '42%' : '38%', transform: 'translate(-50%, -50%)',
            width: isMobile ? 420 : 900,
            height: isMobile ? 220 : 420,
            background: tournamentOver
              ? 'radial-gradient(circle, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.06) 35%, rgba(251,191,36,0) 72%)'
              : 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, rgba(56,189,248,0.02) 35%, rgba(56,189,248,0) 72%)',
            filter: 'blur(30px)',
          }} />
          {tournamentOver && [...Array(18)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              width: i % 5 === 0 ? 3 : 2, height: i % 5 === 0 ? 3 : 2,
              background: `rgba(251,191,36,${0.06 + (i % 5) * 0.07})`,
              left: `${(i * 43 + 11) % 97}%`, top: `${(i * 67 + 9) % 86}%`,
            }} />
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {tournamentOver && (
              <img src={`${BASE}assets/hall_of_fame/LeftLaurel.png`} alt=""
                style={{ width: isMobile ? 86 : 185, height: 'auto', opacity: 0.92, position: 'absolute',
                  left: isMobile ? -25 : -30, top: '64%', transform: 'translateY(-50%) rotate(10deg)', zIndex: 0 }} />
            )}
            <div style={{
              position: 'relative', zIndex: 2,
              padding: tournamentOver ? (isMobile ? '0 26px' : '0 70px') : '0',
              fontSize: tournamentOver ? (isMobile ? 42 : 76) : (isMobile ? 26 : 38),
              fontWeight: 900, letterSpacing: tournamentOver ? '0.15em' : '0.12em',
              textTransform: 'uppercase',
              background: tournamentOver
                ? 'linear-gradient(135deg, #FBBF24 0%, #FDE68A 45%, #F59E0B 100%)'
                : 'linear-gradient(135deg, rgba(251,191,36,0.70) 0%, rgba(253,230,138,0.55) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1, fontFamily: 'var(--font-mono)',
            }}>
              Hall of Fame
            </div>
            {tournamentOver && (
              <img src={`${BASE}assets/hall_of_fame/RightLaurel.png`} alt=""
                style={{ width: isMobile ? 86 : 185, height: 'auto', opacity: 0.92, position: 'absolute',
                  right: isMobile ? -25 : -10, top: '64%', transform: 'translateY(-50%) rotate(-10deg)', zIndex: 0 }} />
            )}
          </div>
          <div style={{ marginTop: tournamentOver ? 12 : 8, fontSize: isMobile ? (tournamentOver ? 15 : 12) : (tournamentOver ? 13 : 12), letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
            {tournamentOver
              ? <span style={{ color: 'rgba(255,255,255,0.35)' }}>QMF 2026 · Cierre oficial de resultados</span>
              : <span style={{ color: 'rgba(56,189,248,0.50)' }}>QMF 2026 · Torneo en curso — tabla provisional, actualizada después de cada partido</span>
            }
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: isMobile ? '72%' : '48%', height: 1,
          background: tournamentOver
            ? 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.7) 20%, rgba(253,230,138,1) 50%, rgba(251,191,36,0.7) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.3) 20%, rgba(56,189,248,0.5) 50%, rgba(56,189,248,0.3) 80%, transparent 100%)',
          opacity: 0.55,
        }} />
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: isMobile ? '28px 12px' : '44px 32px', display: 'flex', flexDirection: 'column', gap: 52 }}>

        {/* ── CHAMPION CARD — solo visible cuando el torneo ha concluido ── */}
        {tournamentOver && <section>
          <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: 14,
            background: 'linear-gradient(135deg, #12100e 0%, #1a1508 40%, #12100e 100%)',
            border: '1px solid rgba(251,191,36,0.35)',
            boxShadow: '0 0 40px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'stretch', position: 'relative' }}>
              {/* Trophy */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '28px 24px 0' : '24px 8px 24px 24px', flexShrink: 0 }}>
                <img
                  src={`${BASE}assets/hall_of_fame/ChampionCup.png`}
                  alt="Champion Cup"
                  style={{ width: isMobile ? 190 : 320, height: isMobile ? 190 : 200, objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(251,191,36,0.35))' }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: isMobile ? '12px 24px 28px' : '28px 24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Campeón QMF 2026
                </div>
                <div style={{ fontSize: isMobile ? 20 : 37, fontWeight: 900, color: '#FDE68A', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: 18 }}>
                  {champion.display_name}
                </div>
                <div style={{ display: 'flex', gap: isMobile ? 15 : 32, flexWrap: 'wrap', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Puntaje Final</div>
                    <div style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, color: '#FDE68A', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{champion.total_points} <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>pts</span></div>
                  </div>
                  {champStats.exactosPct !== null && (
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Exactos</div>
                      <div style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, color: '#FDE68A', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{champStats.exactosPct}<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>%</span></div>
                    </div>
                  )}
                  {champStats.consistenciaPct !== null && (
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Consistencia</div>
                      <div style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, color: '#FDE68A', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{champStats.consistenciaPct}<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>%</span></div>
                    </div>
                  )}
                </div>
                {champion.archetype && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <ArchBadge id={champion.archetype} archMeta={archMeta} />
                  </div>
                )}
              </div>

              {/* Prize */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: isMobile ? '0 24px 32px' : '28px 32px 28px 16px',
                borderLeft: isMobile ? 'none' : '1px solid rgba(251,191,36,0.12)',
                minWidth: isMobile ? 'auto' : 160,
              }}>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }}>— Premio —</div>
                <div style={{
                  fontSize: isMobile ? 58 : 62, fontWeight: 900, lineHeight: 1,
                  background: 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 50%, #F59E0B 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  fontFamily: 'var(--font-mono)',
                }}>${champion.payout.toLocaleString()}</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: '0.08em' }}>MXN</div>
              </div>
            </div>
          </div>
        </section>}

        {/* ── ZONA DE PAGO ────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CoinsSVG />
              <div>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: 'var(--color-text-1)', letterSpacing: '0.02em' }}>ZONA DE PAGO</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {tournamentOver ? 'Los mejores del torneo. Cierre oficial de resultados.' : 'Clasificación provisional — se actualiza con cada partido jugado.'}
                </div>
              </div>
            </div>
            <div style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
              {rows.length} PARTICIPANTES
            </div>
          </div>

          <div style={{ borderRadius: 15, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
            {!isMobile && (
              <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 200px 110px 130px 100px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                {['#', 'USUARIO', 'ARQUETIPO PRINCIPAL', 'PUNTAJE FINAL', 'BRECHA', 'PREMIO (USD)'].map((h, i) => (
                  <div key={h} style={{ fontSize: 13, fontWeight: 600, color: i === 4 ? 'rgba(255,255,255,0.35)' : 'var(--color-text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</div>
                ))}
              </div>
            )}

            {rows.map((u, i) => {
              const inPayout = u.payout > 0
              const interval    = i === 0 ? 0 : rows[i - 1].total_points - u.total_points
              const gapToPrize  = inPayout ? 0 : lastPaidPts - u.total_points
              const showSep = payoutCutoff > 0 && i === payoutCutoff - 1
              return (
                <div key={u.user_id}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '40px 1fr auto' : '52px 1fr 200px 110px 130px 100px',
                    alignItems: 'center', gap: isMobile ? 10 : 0,
                    padding: isMobile ? '12px 14px' : '13px 20px',
                    background: rowBg(u.rank), borderLeft: rowBorderLeft(u.rank),
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    opacity: inPayout ? 1 : 0.65,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><MedalIcon rank={u.rank} /></div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: u.rank <= 3 ? 15 : 14, fontWeight: u.rank <= 3 ? 800 : 600, color: u.rank === 1 ? '#FDE68A' : 'var(--color-text-1)' }}>{u.display_name}</span>
                        {u.rank === 1 && <span style={{ fontSize: 13 }}>👑</span>}
                      </div>
                      {isMobile && <div style={{ marginTop: 2 }}><ArchLabel id={u.archetype} archMeta={archMeta} /></div>}
                    </div>
                    {!isMobile && <div><ArchLabel id={u.archetype} archMeta={archMeta} /></div>}

                    {/* PUNTAJE FINAL */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{u.total_points} pts</div>
                      {isMobile && u.rank > 1 && (
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                          {u.payout > 0 ? `−${interval} pts` : `a ${gapToPrize} pts de premio`}
                        </div>
                      )}
                    </div>

                    {/* BRECHA — desktop only */}
                    {!isMobile && (
                      <div style={{ textAlign: 'right' }}>
                        {u.rank === 1 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>LÍDER</span>
                        ) : u.payout > 0 ? (
                          <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {'−'}{interval} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-3)' }}>pts</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
                            a {gapToPrize} pts de premio
                          </span>
                        )}
                      </div>
                    )}

                    {/* PREMIO — desktop only */}
                    {!isMobile && (
                      <div style={{ textAlign: 'right' }}>
                        {inPayout
                          ? <span style={{ fontSize: 15, fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>${u.payout.toLocaleString()}</span>
                          : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>—</span>
                        }
                      </div>
                    )}
                  </div>
                  {showSep && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>SIN PREMIO</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {isMobile && payoutCutoff > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
              {rows.slice(0, payoutCutoff).map(r => `$${r.payout.toLocaleString()}`).join(' · ')}
            </div>
          )}
        </section>

        {/* ── MENCIONES HONORÍFICAS ───────────────────────────── */}
        <section>
          <div style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Menciones Honoríficas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {ARCH_ORDER.map(archId => {
              const style   = ARCH_STYLE[archId]
              const meta    = archMeta[archId] || {}
              const label   = meta.display_name   || archId
              const desc    = meta.identity_formula || meta.short_description || ''
              const users   = archetypeGroups[archId] || []
              const isEmpty = users.length === 0

              return (
                <div key={archId} style={{
                  borderRadius: 12, overflow: 'hidden',
                  background: isEmpty ? 'rgba(255,255,255,0.015)' : style.bg,
                  border: `1px solid ${isEmpty ? 'rgba(255,255,255,0.07)' : style.border}`,
                }}>
                  {/* Image header */}
                  <div style={{
                    position: 'relative', height: 120,
                    background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={style.imgUrl}
                      alt={label}
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center top',
                        opacity: isEmpty ? 0.25 : 0.55,
                        mixBlendMode: 'luminosity',
                      }}
                    />
                    {/* Color tint overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(135deg, ${style.bg} 0%, transparent 60%)`,
                    }} />
                    {/* Bottom fade */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                      background: `linear-gradient(to top, ${isEmpty ? 'rgba(10,10,14,0.95)' : 'rgba(10,10,14,0.85)'}, transparent)`,
                    }} />
                    {/* Archetype name overlay */}
                    <div style={{ position: 'relative', textAlign: 'center', padding: '0 16px' }}>
                      <div style={{
                        fontSize: 13, fontWeight: 800,
                        color: isEmpty ? 'rgba(255,255,255,0.3)' : style.color,
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase',
                        textShadow: `0 0 20px ${style.color}40`,
                      }}>{label}</div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '14px 18px 18px' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.5, marginBottom: 14 }}>
                      {desc}
                    </div>

                    {isEmpty ? (
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.09)', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontStyle: 'italic', lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}>
                          Nadie alcanzó este nivel en QMF 2026
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: users.length > 5 ? 200 : 'none', overflowY: users.length > 5 ? 'auto' : 'visible' }}>
                        {users.map(u => (
                          <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${style.border}` }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)' }}>{u.display_name}</span>
                            <span style={{ fontSize: 12, color: style.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{u.total_points} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── CLOSING QUOTE ───────────────────────────────────── */}
        <section style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ fontSize: isMobile ? 14 : 18, color: 'var(--color-text-3)', fontStyle: 'italic', letterSpacing: '0.02em', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 44 }}>
            "Las predicciones desaparecen. Los nombres permanecen."
          </div>
        </section>

      </div>
    </motion.div>
  )
}