import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Info } from 'lucide-react'
import { DATA_URLS } from '@/config/urls'
import { fetchJSON } from '@/data/loaders/fetchJSON'
import { loadTeamMap, flagUrl, getTeam } from '@/utils/teams'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function isPending(m) { return !m || m.status !== 'final' }

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ─── User Selector ─────────────────────────────────────────────────────────────

function UserSelector({ users, selectedId, onSelect }) {
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)
  const ref                 = useRef(null)
  const selected = users.find(u => u.user_id === selectedId)
  const filtered = search.trim()
    ? users.filter(u => (u.display_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : users

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: 220, flexShrink: 0 }}>
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
          background: 'var(--color-surface)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
        }}
      >
        <span style={{ fontSize: '0.8rem', color: selected ? 'var(--color-text-1)' : 'var(--color-text-3)' }}>
          {selected ? selected.display_name : 'Ver puntos de usuario...'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {selected && (
            <button
              onClick={e => { e.stopPropagation(); onSelect(null); setSearch('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: 0, display: 'flex' }}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={13} color="var(--color-text-3)"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ padding: '0.5rem' }}>
            <input
              autoFocus placeholder="Buscar..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.375rem 0.625rem',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 6, color: 'var(--color-text-1)', fontSize: '0.78rem', outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(u => (
              <div
                key={u.user_id}
                onMouseDown={() => { onSelect(u.user_id); setOpen(false); setSearch('') }}
                style={{
                  padding: '0.5rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem',
                  color: u.user_id === selectedId ? 'var(--color-primary)' : 'var(--color-text-1)',
                  background: u.user_id === selectedId ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
                }}
                onMouseEnter={e => { if (u.user_id !== selectedId) e.currentTarget.style.background = 'var(--color-surface)' }}
                onMouseLeave={e => { if (u.user_id !== selectedId) e.currentTarget.style.background = 'transparent' }}
              >
                {u.display_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Group Tab Selector ────────────────────────────────────────────────────────

function GroupTabs({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {GROUPS.map(g => (
        <button
          key={g}
          onClick={() => onChange(g)}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: `1px solid ${selected === g ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: selected === g
              ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
              : 'var(--color-surface)',
            color: selected === g ? 'var(--color-primary)' : 'var(--color-text-2)',
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

// ─── Form Dot ─────────────────────────────────────────────────────────────────

function FormDot({ result }) {
  const color = result === 'W' ? 'var(--color-success)' : result === 'L' ? '#EF4444' : 'var(--color-text-3)'
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} title={result} />
}

// ─── Pos Chip ─────────────────────────────────────────────────────────────────

function PosChip({ pts, correct }) {
  if (pts === null || pts === undefined) return null
  return (
    <span style={{
      fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700,
      color: correct ? 'var(--color-success)' : 'var(--color-text-3)',
      background: correct
        ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
        : 'color-mix(in srgb, var(--color-text-3) 10%, transparent)',
      borderRadius: 4, padding: '1px 5px', flexShrink: 0,
    }}>
      {correct ? `+${pts}` : '–'}
    </span>
  )
}

// ─── Standings Table ───────────────────────────────────────────────────────────

function StandingsTable({ group, temporalGroup, officialGroup, userStandings, teamMap, isMobile }) {
  if (!temporalGroup && !officialGroup) return (
    <div style={{ color: 'var(--color-text-3)', fontSize: '0.8rem', padding: '1rem' }}>
      Sin datos para Grupo {group}
    </div>
  )

  // If official standings exist, reorder temporal rows to match official positions
  const rawTable = temporalGroup?.table ?? []
  const table = officialGroup
    ? officialGroup.positions.map(op => {
        const row = rawTable.find(r => r.team === op.team) ?? { team: op.team }
        return { ...row, position: op.position }
      })
    : rawTable
  const userGroupStandings = userStandings?.find(s => s.group === group)
  const hasUser = !!userGroupStandings

  // Mobile: show only # | Equipo | PJ | PTS | DG (hide PG/PE/PP/Forma/Pred)
  const cols = isMobile
    ? '28px 1fr 26px 36px 36px'
    : hasUser
      ? '36px 1fr 32px 32px 32px 32px 44px 52px 72px 72px'
      : '36px 1fr 32px 32px 32px 32px 44px 52px 72px'

  const headers = isMobile
    ? ['#', 'Equipo', 'PJ', 'PTS', 'DG']
    : ['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'DG', 'PTS', 'Forma', ...(hasUser ? ['Pred'] : [])]

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: cols,
        padding: isMobile ? '8px 12px' : '10px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'color-mix(in srgb, var(--color-bg) 60%, transparent)',
      }}>
        {headers.map((h, i) => (
          <div key={i} style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            textAlign: h === 'Equipo' ? 'left' : 'center',
            fontWeight: 700,
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {table.map((row, idx) => {
        const td = getTeam(row.team, teamMap)
        const flag = flagUrl(td?.iso2)
        const isQ = row.position <= 2
        const userPos = userGroupStandings?.positions?.find(p => p.position === row.position)

        return (
          <div key={row.team} style={{
            display: 'grid', gridTemplateColumns: cols,
            padding: isMobile ? '10px 12px' : '13px 16px',
            borderBottom: idx < table.length - 1 ? '1px solid var(--color-border)' : 'none',
            alignItems: 'center',
            background: isQ ? 'color-mix(in srgb, var(--color-primary) 4%, transparent)' : 'transparent',
          }}>
            {/* Position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 3, height: 24, borderRadius: 2, flexShrink: 0,
                background: isQ ? 'var(--color-primary)' : 'var(--color-border)',
              }} />
              <span style={{
                fontSize: 12, color: isQ ? 'var(--color-primary)' : 'var(--color-text-3)',
                fontFamily: 'var(--font-mono)', fontWeight: isQ ? 700 : 400,
              }}>
                {row.position}
              </span>
            </div>

            {/* Team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {flag && (
                <img src={flag} alt="" style={{
                  width: 22, height: 14, objectFit: 'cover', borderRadius: 2, flexShrink: 0,
                }} />
              )}
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: isQ ? 'var(--color-text-1)' : 'var(--color-text-2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {row.team}
              </span>
            </div>

            {/* PJ */}
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-2)' }}>{row.pj}</div>

            {/* Mobile: PTS next, then DG — skip PG/PE/PP/Form */}
            {isMobile ? (
              <>
                <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isQ ? 'var(--color-text-1)' : 'var(--color-text-2)' }}>{row.pts}</div>
                <div style={{ textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: row.dg > 0 ? 'var(--color-success)' : row.dg < 0 ? '#EF4444' : 'var(--color-text-3)' }}>
                  {row.dg > 0 ? `+${row.dg}` : row.dg}
                </div>
              </>
            ) : (
              <>
                {/* PG */}
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-2)' }}>{row.pg}</div>
                {/* PE */}
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-2)' }}>{row.pe}</div>
                {/* PP */}
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-2)' }}>{row.pp}</div>
                {/* DG */}
                <div style={{ textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: row.dg > 0 ? 'var(--color-success)' : row.dg < 0 ? '#EF4444' : 'var(--color-text-3)' }}>
                  {row.dg > 0 ? `+${row.dg}` : row.dg}
                </div>
                {/* PTS */}
                <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isQ ? 'var(--color-text-1)' : 'var(--color-text-2)' }}>{row.pts}</div>
                {/* Form */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {(row.form ?? []).map((r, i) => <FormDot key={i} result={r} />)}
                </div>
              </>
            )}

            {/* User pred — desktop only */}
            {!isMobile && hasUser && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {userPos ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {(() => {
                        const pTd = getTeam(userPos.predicted_team, teamMap)
                        const pFlag = flagUrl(pTd?.iso2)
                        return pFlag
                          ? <img src={pFlag} alt="" style={{ width: 16, height: 10, objectFit: 'cover', borderRadius: 1, opacity: userPos.correct ? 1 : 0.5 }} />
                          : null
                      })()}
                      <PosChip pts={userPos.points} correct={userPos.correct} />
                    </div>
                    {!userPos.correct && (
                      <span style={{ fontSize: 9, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>
                        {userPos.predicted_team}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        )
      })}

      {/* Qualifier legend */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--color-border)',
        background: 'color-mix(in srgb, var(--color-bg) 60%, transparent)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: 'var(--color-primary)' }} />
        <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Clasifica a R32</span>
      </div>
    </div>
  )
}

// ─── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({ match, userPick, teamMap, meta }) {
  const [showMeta, setShowMeta] = useState(false)
  const pending = isPending(match)
  const home = match.home_team
  const away = match.away_team
  const homeFlag = flagUrl(getTeam(home, teamMap)?.iso2)
  const awayFlag = flagUrl(getTeam(away, teamMap)?.iso2)

  const result  = match.result
  const pred    = userPick?.prediction
  const pts     = userPick?.points ?? null
  const correct = userPick?.breakdown?.correct ?? false

  const homeWon = result === 'L'
  const awayWon = result === 'V'

  const borderColor = userPick && !pending
    ? (correct ? 'color-mix(in srgb, var(--color-success) 30%, transparent)' : 'var(--color-border)')
    : 'var(--color-border)'

  const predLabel = { V: 'Vis', E: 'Emp', L: 'Loc' }

  function TeamRow({ name, flag, isWinner, isLoser, goals }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 10px', minHeight: 34,
        borderBottom: '1px solid var(--color-border)',
        opacity: isLoser ? 0.45 : 1,
        background: isWinner && !pending ? 'color-mix(in srgb, var(--color-success) 5%, transparent)' : 'transparent',
      }}>
        {flag && <img src={flag} alt="" style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />}
        <span style={{
          flex: 1, fontSize: 11, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: isWinner && !pending ? 'var(--color-success)' : 'var(--color-text-2)',
        }}>
          {name}
        </span>
        {!pending ? (
          <div style={{ width: 24, height: 20, background: '#FFF', border: '1px solid var(--color-border)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1, display: 'block' }}>{goals}</span>
          </div>
        ) : (
          <div style={{ width: 24, height: 20, background: 'color-mix(in srgb, var(--color-border) 40%, transparent)', border: '1px solid var(--color-border)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>-</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: `1px solid ${borderColor}`, borderRadius: 8, overflow: 'hidden' }}>
      <TeamRow name={home} flag={homeFlag} isWinner={homeWon} isLoser={!pending && awayWon} goals={match.home_goals} />
      <TeamRow name={away} flag={awayFlag} isWinner={awayWon} isLoser={!pending && homeWon} goals={match.away_goals} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 10px',
        background: 'color-mix(in srgb, var(--color-bg) 50%, transparent)',
        borderTop: '1px solid var(--color-border)',
        minHeight: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }}
          onMouseEnter={() => setShowMeta(true)}
          onMouseLeave={() => setShowMeta(false)}
        >
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>
            #{match.match_id}
          </span>
          {!pending && (
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>
              · {result === 'E' ? 'EMP' : homeWon ? 'LOC' : 'VIS'}
            </span>
          )}
          {meta && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', cursor: 'help',
              color: showMeta ? 'var(--color-primary)' : 'var(--color-text-3)',
              transition: 'color 0.15s',
              opacity: showMeta ? 1 : 0.55,
            }}>
              <Info size={9} strokeWidth={2} />
            </span>
          )}
          {meta && showMeta && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, zIndex: 50,
              marginBottom: 6, minWidth: 190,
              background: 'var(--color-surface-2, #1e2030)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column', gap: 4,
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-1)', lineHeight: 1.3 }}>
                🏟 {meta.venue}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', lineHeight: 1.4 }}>
                📍 {meta.city}, {meta.country}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                🗓 {meta.match_date} · {meta.kickoff_utc} UTC
              </div>
            </div>
          )}
        </div>
        {userPick && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {pred && (
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-mono)',
                color: !pending && correct ? 'var(--color-success)' : 'var(--color-text-3)',
                background: !pending && correct
                  ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                  : 'color-mix(in srgb, var(--color-text-3) 10%, transparent)',
                borderRadius: 3, padding: '1px 4px',
              }}>
                {predLabel[pred] ?? pred}
              </span>
            )}
            {!pending && (
              <span style={{ fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700, color: correct ? 'var(--color-success)' : 'var(--color-text-3)' }}>
                {correct ? `+${pts}` : '–'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Groups() {
  const isMobile = useIsMobile()

  const [selectedGroup, setSelectedGroup] = useState('A')
  const [selectedUser, setSelectedUser]   = useState(null)

  const [leaderboard, setLeaderboard]             = useState(null)
  const [scoreDetails, setScoreDetails]           = useState(null)
  const [groupResults, setGroupResults]           = useState(null)
  const [temporalStandings, setTemporalStandings] = useState(null)
  const [standingsResults, setStandingsResults]     = useState(null)
  const [teamMap, setTeamMap]                     = useState(null)
  const [loading, setLoading]                     = useState(true)
  const [matchesMeta, setMatchesMeta]             = useState(null)

  useEffect(() => {
    Promise.all([
      fetchJSON(DATA_URLS.leaderboard),
      fetchJSON(DATA_URLS.scoreDetails),
      fetchJSON(DATA_URLS.groupResults),
      fetchJSON(DATA_URLS.temporalGroupStandings),
      loadTeamMap(DATA_URLS.teams),
      fetchJSON(DATA_URLS.matchesMetadata).catch(() => null),
      fetchJSON(DATA_URLS.standingsResults).catch(() => null),
    ]).then(([lb, sd, gr, ts, tm, mm, sr]) => {
      setLeaderboard(lb)
      setScoreDetails(sd)
      setGroupResults(gr)
      setTemporalStandings(ts)
      setTeamMap(tm)
      setMatchesMeta(mm)
      setStandingsResults(sr)
      setLoading(false)
    }).catch(err => {
      console.error('Groups load error:', err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
        Cargando grupos...
      </div>
    )
  }

  const users = leaderboard ?? []

  const userScoreDetail = selectedUser
    ? scoreDetails?.find(u => u.user_id === selectedUser)
    : null

  const userMatchPicks = {}
  if (userScoreDetail?.group) {
    userScoreDetail.group.forEach(pick => { userMatchPicks[pick.match_id] = pick })
  }

  const metaMap = matchesMeta ?? {}

  const groupMatches = (groupResults ?? [])
    .filter(m => m.group === selectedGroup)
    .sort((a, b) => a.match_id - b.match_id)

  const jornadas = [
    groupMatches.slice(0, 2),
    groupMatches.slice(2, 4),
    groupMatches.slice(4, 6),
  ]

  const temporalGroup  = temporalStandings?.groups?.find(g => g.group === selectedGroup)
  // isOfficial solo si status=final Y al menos un equipo tiene real_team no-nulo
  const hasRealTeams   = standingsResults?.groups?.some(g => g.positions?.some(p => p.real_team != null))
  const isOfficial     = standingsResults?.status === 'final' && hasRealTeams
  const officialGroup  = isOfficial
    ? standingsResults.groups?.find(g => g.group === selectedGroup)
    : null
  const userStandings = userScoreDetail?.standings ?? null

  const userGroupMatchPts    = groupMatches.reduce((s, m) => s + (userMatchPicks[m.match_id]?.points ?? 0), 0)
  const userGroupStandingPts = userStandings?.find(s => s.group === selectedGroup)?.total_points ?? 0
  const userTotalGroupPts    = userGroupMatchPts + userGroupStandingPts

  const userName = users.find(u => u.user_id === selectedUser)?.display_name

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: 1500, margin: '0 auto' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-text-1)', textTransform: 'uppercase', margin: 0 }}>
            Grupos
          </h1>
          <span style={{ width: 1, height: 18, background: 'var(--color-border)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>
            72 partidos · Fase de grupos
          </span>
          {selectedUser && (
            <>
              <span style={{ width: 1, height: 18, background: 'var(--color-border)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                Puntos de {userName}
              </span>
            </>
          )}
        </div>
        <UserSelector users={users} selectedId={selectedUser} onSelect={setSelectedUser} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem', marginBottom: '1.25rem', fontSize: '0.7rem', color: 'var(--color-text-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)' }} />
          <span>Ganó</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
          <span>Perdió</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-text-3)' }} />
          <span>Empató</span>
        </div>
        {selectedUser && (
          <>
            <span style={{ color: 'var(--color-border)' }}>·</span>
            <span style={{ fontStyle: 'italic' }}>
              Posición: 1°=4pts · 2°=3pts · 3°=2pts · 4°=1pt · Resultado=1pt
            </span>
          </>
        )}
      </div>

      {/* Group selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <GroupTabs selected={selectedGroup} onChange={setSelectedGroup} />
      </div>

      {/* User group summary */}
      {selectedUser && (
        <motion.div
          key={`summary-${selectedGroup}-${selectedUser}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.625rem 1rem', borderRadius: 8,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            marginBottom: '1rem', flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-2)', fontWeight: 600 }}>Grupo {selectedGroup}</span>
          <span style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-3)' }}>Resultados</span>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: userGroupMatchPts > 0 ? 'var(--color-success)' : 'var(--color-text-3)' }}>
              {userGroupMatchPts > 0 ? `+${userGroupMatchPts}` : '0'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-3)' }}>Posiciones</span>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: userGroupStandingPts > 0 ? 'var(--color-success)' : 'var(--color-text-3)' }}>
              {userGroupStandingPts > 0 ? `+${userGroupStandingPts}` : '0'}
            </span>
          </div>
          <span style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 600 }}>Total Grupo {selectedGroup}</span>
            <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-accent)' }}>
              {userTotalGroupPts > 0 ? `+${userTotalGroupPts}` : '0'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Main content — 2 cols desktop, 1 col mobile */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGroup}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '1.5rem' : '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* Standings */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-2)' }}>
                Tabla Grupo {selectedGroup}
              </span>
              {isOfficial ? (
                <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34D399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 4, padding: '1px 6px' }}>
                  ✓ OFICIAL FIFA
                </span>
              ) : temporalStandings ? (
                <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F87171', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, padding: '1px 6px' }}>
                  ✕ NO OFICIAL
                </span>
              ) : null}
            </div>
            <StandingsTable
              group={selectedGroup}
              temporalGroup={temporalGroup}
              officialGroup={officialGroup}
              userStandings={userStandings}
              teamMap={teamMap}
              isMobile={isMobile}
            />
          </div>

          {/* Matches by Jornada */}
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-2)' }}>
                Partidos Grupo {selectedGroup}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {groupMatches.map(match => (
                <MatchCard
                  key={match.match_id}
                  match={match}
                  userPick={userMatchPicks[match.match_id] ?? null}
                  teamMap={teamMap}
                  meta={metaMap[match.match_id] ?? null}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Disclaimer */}
      <div style={{ marginTop: '2rem', padding: '0.625rem 0', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.8rem', color: isOfficial ? 'var(--color-text-2)' : 'var(--color-text-3)', margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>
          {isOfficial
            ? '\u2713 Posiciones definitivas \u2014 standings oficiales FIFA aplicados al scoring.'
            : temporalStandings?.snapshot_match_id
              ? `Tabla temporal \u00b7 resultados al juego #${temporalStandings.snapshot_match_id}. Las posiciones oficiales se confirman al concluir el juego #72.`
              : 'Tabla estimada \u00b7 el torneo a\u00fan no ha comenzado. Las posiciones se actualizar\u00e1n con los resultados oficiales.'}
        </p>
      </div>

    </div>
  )
}
