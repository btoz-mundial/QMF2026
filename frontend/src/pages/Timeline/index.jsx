import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronUp, ChevronDown, Minus,
  Activity, TrendingUp, Zap
} from 'lucide-react'
import { useTimeline } from '@/hooks/useTimeline'

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_COLORS = [
  '#00D4FF','#FFB800','#00E676','#FF3D57',
  '#A78BFA','#F472B6','#34D399','#FB923C',
  '#60A5FA','#E879F9','#FBBF24','#4ADE80','#F87171',
]

const SPEEDS = [
  { label: '0.5×', ms: 2000 },
  { label: '1×',   ms: 1000 },
  { label: '2×',   ms: 500  },
  { label: '3×',   ms: 250  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userColor(index) { return USER_COLORS[index % USER_COLORS.length] }

function MovementIcon({ movement, delta }) {
  if (movement === 'up') return (
    <span style={{ display:'flex', alignItems:'center', gap:2, color:'#00E676', fontSize:'0.7rem', fontFamily:'var(--font-mono)', fontWeight:700 }}>
      <ChevronUp size={11} strokeWidth={3} />+{delta}
    </span>
  )
  if (movement === 'down') return (
    <span style={{ display:'flex', alignItems:'center', gap:2, color:'#FF3D57', fontSize:'0.7rem', fontFamily:'var(--font-mono)', fontWeight:700 }}>
      <ChevronDown size={11} strokeWidth={3} />-{delta}
    </span>
  )
  return <Minus size={10} color="var(--color-text-3)" />
}

// ─── Snapshot Controls ────────────────────────────────────────────────────────

function SnapshotControls({ snapshots, currentIndex, onIndexChange, playing, onPlayPause, speedIndex, onSpeedChange }) {
  const snap = snapshots[currentIndex]
  const total = snapshots.length

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '1.25rem',
    }}>
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.875rem' }}>

        {/* Prev */}
        <button onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{ ...btnStyle, opacity: currentIndex === 0 ? 0.3 : 1 }}>
          <SkipBack size={14} />
        </button>

        {/* Play/Pause */}
        <button onClick={onPlayPause} style={{ ...btnStyle, background:'var(--color-primary)', color:'#000', width:36, height:36 }}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* Next */}
        <button onClick={() => onIndexChange(Math.min(total - 1, currentIndex + 1))}
          disabled={currentIndex === total - 1}
          style={{ ...btnStyle, opacity: currentIndex === total - 1 ? 0.3 : 1 }}>
          <SkipForward size={14} />
        </button>

        {/* Snapshot info */}
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--color-text-2)' }}>
            Partido {snap?.snapshot_match_id}
          </span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--color-text-3)', marginLeft:'0.5rem' }}>
            {snap?.stage?.toUpperCase()}
          </span>
        </div>

        {/* Counter */}
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--color-text-3)', whiteSpace:'nowrap' }}>
          {currentIndex + 1} / {total}
        </span>

        {/* Speed */}
        <div style={{ display:'flex', gap:3 }}>
          {SPEEDS.map((s, i) => (
            <button key={s.label} onClick={() => onSpeedChange(i)}
              style={{
                padding:'0.2rem 0.45rem', borderRadius:5, border:'1px solid',
                borderColor: speedIndex === i ? 'var(--color-primary)' : 'var(--color-border)',
                background: speedIndex === i ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: speedIndex === i ? 'var(--color-primary)' : 'var(--color-text-3)',
                fontSize:'0.65rem', fontFamily:'var(--font-mono)', cursor:'pointer',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <input type="range" min={0} max={total - 1} value={currentIndex}
        onChange={e => onIndexChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:'var(--color-primary)', cursor:'pointer', height:4 }}
      />

      {/* Stage markers */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.3rem' }}>
        <span style={{ fontSize:'0.6rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>Partido 1</span>
        <span style={{ fontSize:'0.6rem', color:'#FFB800', fontFamily:'var(--font-mono)' }}>Grupos → Knockout</span>
        <span style={{ fontSize:'0.6rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>Final</span>
      </div>
    </div>
  )
}

const btnStyle = {
  width:32, height:32, borderRadius:8,
  border:'1px solid var(--color-border)',
  background:'var(--color-surface-2)',
  color:'var(--color-text-2)',
  display:'flex', alignItems:'center', justifyContent:'center',
  cursor:'pointer', flexShrink:0,
}

// ─── Race View ────────────────────────────────────────────────────────────────

function RaceView({ snapshot, allUsers, showAll, onToggleShowAll }) {
  const users = snapshot?.users ?? []
  const maxPoints = Math.max(...users.map(u => u.total_points), 1)
  const displayUsers = showAll ? users : users.slice(0, 5)

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '1.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Zap size={15} color="var(--color-primary)" />
          <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', letterSpacing:'0.05em', color:'var(--color-text-1)' }}>
            RACE VIEW
          </span>
        </div>
        <button onClick={onToggleShowAll} style={{
          padding:'0.25rem 0.75rem', borderRadius:20,
          border:'1px solid var(--color-border)',
          background:'transparent',
          color:'var(--color-text-2)', fontSize:'0.7rem',
          fontFamily:'var(--font-mono)', cursor:'pointer',
        }}>
          {showAll ? 'Top 5' : 'Ver todos'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        <AnimatePresence mode="popLayout">
          {displayUsers.map((user, i) => {
            const colorIndex = allUsers.indexOf(user.user_id)
            const color = userColor(colorIndex >= 0 ? colorIndex : i)
            const widthPct = maxPoints > 0 ? (user.total_points / maxPoints) * 100 : 0

            return (
              <motion.div
                key={user.user_id}
                layout
                initial={{ opacity:0, x:-20 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:20 }}
                transition={{ type:'spring', stiffness:300, damping:30 }}
                style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}
              >
                {/* Rank + movement */}
                <div style={{ width:52, display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:'0.75rem',
                    color: user.rank === 1 ? '#FFB800' : 'var(--color-text-2)',
                    fontWeight:700, width:18, textAlign:'right',
                  }}>
                    #{user.rank}
                  </span>
                  <MovementIcon movement={user.movement} delta={user.rank_delta} />
                </div>

                {/* Name */}
                <span style={{
                  width:72, fontSize:'0.78rem', fontWeight:600,
                  color:'var(--color-text-1)', overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0,
                }}>
                  {user.display_name}
                </span>

                {/* Bar */}
                <div style={{ flex:1, height:28, background:'var(--color-surface-2)', borderRadius:6, overflow:'hidden', position:'relative' }}>
                  <motion.div
                    layout
                    animate={{ width:`${widthPct}%` }}
                    transition={{ type:'spring', stiffness:200, damping:25 }}
                    style={{
                      height:'100%',
                      background:`linear-gradient(90deg, ${color}88, ${color})`,
                      borderRadius:6,
                      minWidth: user.total_points > 0 ? 8 : 0,
                      boxShadow: `0 0 8px ${color}44`,
                    }}
                  />
                </div>

                {/* Points */}
                <span style={{
                  width:36, textAlign:'right', flexShrink:0,
                  fontFamily:'var(--font-mono)', fontSize:'0.82rem',
                  fontWeight:700, color: user.rank === 1 ? '#FFB800' : 'var(--color-text-1)',
                }}>
                  {user.total_points}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Movement Feed ────────────────────────────────────────────────────────────

function MovementFeed({ snapshot, allUsers }) {
  const movers = (snapshot?.users ?? [])
    .filter(u => u.movement !== 'same' && u.previous_rank !== null)
    .sort((a, b) => b.rank_delta - a.rank_delta)
    .slice(0, 5)

  if (movers.length === 0) return null

  return (
    <div style={{
      background:'var(--color-surface)',
      border:'1px solid var(--color-border)',
      borderRadius:12,
      padding:'0.875rem 1.25rem',
      marginBottom:'1rem',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
        <Activity size={13} color="var(--color-accent)" />
        <span style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', letterSpacing:'0.05em', color:'var(--color-text-1)' }}>
          MOVIMIENTOS
        </span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
        {movers.map((u, i) => {
          const colorIndex = allUsers.indexOf(u.user_id)
          const color = userColor(colorIndex >= 0 ? colorIndex : i)
          return (
            <motion.div
              key={u.user_id}
              initial={{ opacity:0, scale:0.9 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display:'flex', alignItems:'center', gap:'0.375rem',
                padding:'0.25rem 0.625rem',
                borderRadius:20,
                background:`${color}11`,
                border:`1px solid ${color}33`,
              }}
            >
              <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
              <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-1)' }}>
                {u.display_name}
              </span>
              <MovementIcon movement={u.movement} delta={u.rank_delta} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Ranking Timeline Chart ───────────────────────────────────────────────────

function RankingTimeline({ rankingData, allUsers }) {
  const [selectedUsers, setSelectedUsers] = useState([])
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef(null)

  const users = rankingData?.users ?? []

  // Default: top 5 by final rank
  useEffect(() => {
    if (users.length > 0 && selectedUsers.length === 0) {
      const top5 = [...users]
        .sort((a, b) => {
          const aLast = a.history[a.history.length - 1]?.rank ?? 99
          const bLast = b.history[b.history.length - 1]?.rank ?? 99
          return aLast - bLast
        })
        .slice(0, 5)
        .map(u => u.user_id)
      setSelectedUsers(top5)
    }
  }, [users])

  function addUser(uid) {
    if (selectedUsers.includes(uid)) return
    if (selectedUsers.length >= 5) return
    setSelectedUsers(prev => [...prev, uid])
    setSearch('')
    setDropdownOpen(false)
  }

  function removeUser(uid) {
    setSelectedUsers(prev => prev.filter(id => id !== uid))
  }

  const suggestions = search.trim()
    ? users.filter(u =>
        u.display_name.toLowerCase().includes(search.toLowerCase()) &&
        !selectedUsers.includes(u.user_id)
      )
    : []

  const filtered = users.filter(u => selectedUsers.includes(u.user_id))

  // Build chart data — one point per snapshot
  const allSnapshots = users[0]?.history ?? []
  const chartData = allSnapshots.map((h, i) => {
    const point = {
      snap: h.snapshot_match_id,
      stage: h.stage,
    }
    filtered.forEach(u => {
      const entry = u.history[i]
      if (entry) point[u.user_id] = entry.rank
    })
    return point
  })

  const maxRank = users.length || 13

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background:'var(--color-surface-2)',
        border:'1px solid var(--color-border)',
        borderRadius:8, padding:'0.625rem 0.875rem',
        fontSize:'0.75rem',
      }}>
        <div style={{ color:'var(--color-text-3)', fontFamily:'var(--font-mono)', marginBottom:'0.375rem' }}>
          Partido {label}
        </div>
        {payload.map(p => {
          const user = users.find(u => u.user_id === p.dataKey)
          const colorIndex = allUsers.indexOf(p.dataKey)
          const color = userColor(colorIndex >= 0 ? colorIndex : 0)
          return (
            <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginBottom:2 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:color }} />
              <span style={{ color:'var(--color-text-1)', fontWeight:600 }}>{user?.display_name}</span>
              <span style={{ color:'var(--color-text-3)' }}>#{p.value}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      background:'var(--color-surface)',
      border:'1px solid var(--color-border)',
      borderRadius:12,
      padding:'1.25rem',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
        <TrendingUp size={15} color="var(--color-primary)" />
        <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', letterSpacing:'0.05em', color:'var(--color-text-1)' }}>
          EVOLUCIÓN DE RANKING
        </span>
        <span style={{ fontSize:'0.65rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)', marginLeft:4 }}>
          máx 5 usuarios
        </span>
      </div>

      {/* Selected chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem', marginBottom:'0.625rem', minHeight:28 }}>
        {selectedUsers.map(uid => {
          const user = users.find(u => u.user_id === uid)
          if (!user) return null
          const colorIndex = allUsers.indexOf(uid)
          const color = userColor(colorIndex >= 0 ? colorIndex : 0)
          return (
            <motion.div key={uid} initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
              style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.2rem 0.5rem 0.2rem 0.625rem', borderRadius:20, background:`${color}18`, border:`1px solid ${color}44` }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:color }} />
              <span style={{ fontSize:'0.72rem', fontWeight:600, color }}>{user.display_name}</span>
              <button onClick={() => removeUser(uid)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-3)', padding:0, display:'flex', alignItems:'center', marginLeft:2 }}>
                ×
              </button>
            </motion.div>
          )
        })}
        {selectedUsers.length < 5 && (
          <span style={{ fontSize:'0.65rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)', alignSelf:'center', marginLeft:2 }}>
            {selectedUsers.length}/5
          </span>
        )}
      </div>

      {/* Search input */}
      <div style={{ position:'relative', marginBottom:'1rem' }} ref={searchRef}>
        <input
          type='text'
          placeholder={selectedUsers.length >= 5 ? 'Máximo 5 usuarios' : 'Buscar participante...'}
          value={search}
          disabled={selectedUsers.length >= 5}
          onChange={e => { setSearch(e.target.value); setDropdownOpen(true) }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          style={{ width:'100%', padding:'0.5rem 0.75rem', background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:8, color:'var(--color-text-1)', fontSize:'0.8rem', fontFamily:'var(--font-body)', outline:'none', opacity: selectedUsers.length >= 5 ? 0.4 : 1 }}
          onFocus={e => { e.target.style.borderColor='var(--color-primary)'; setDropdownOpen(true) }}
          onBlur={e => { e.target.style.borderColor='var(--color-border)'; setTimeout(() => setDropdownOpen(false), 150) }}
        />
        {dropdownOpen && suggestions.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:8, zIndex:50, overflow:'hidden' }}>
            {suggestions.slice(0,6).map((u, i) => {
              const colorIndex = allUsers.indexOf(u.user_id)
              const color = userColor(colorIndex >= 0 ? colorIndex : i)
              return (
                <div key={u.user_id} onMouseDown={() => addUser(u.user_id)}
                  style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--color-border)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:color }} />
                  <span style={{ fontSize:'0.8rem', color:'var(--color-text-1)' }}>{u.display_name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height:260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top:8, right:8, bottom:0, left:-20 }}>
            <XAxis
              dataKey="snap"
              tick={{ fontSize:10, fill:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}
              tickLine={false}
              axisLine={{ stroke:'var(--color-border)' }}
            />
            <YAxis
              reversed
              domain={[1, maxRank]}
              tick={{ fontSize:10, fill:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `#${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {filtered.map((u, i) => {
              const colorIndex = allUsers.indexOf(u.user_id)
              const color = userColor(colorIndex >= 0 ? colorIndex : i)
              return (
                <Line
                  key={u.user_id}
                  type="monotone"
                  dataKey={u.user_id}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r:4, fill:color, strokeWidth:0 }}
                  animationDuration={400}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Timeline() {
  const { race, ranking, loading, error } = useTimeline()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying]           = useState(false)
  const [speedIndex, setSpeedIndex]     = useState(1)
  const [showAll, setShowAll]           = useState(false)
  const intervalRef                     = useRef(null)

  const snapshots = race?.snapshots ?? []

  // Build stable user color index from first snapshot order
  const allUsers = (snapshots[0]?.users ?? []).map(u => u.user_id)

  const advance = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev >= snapshots.length - 1) {
        setPlaying(false)
        return prev
      }
      return prev + 1
    })
  }, [snapshots.length])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advance, SPEEDS[speedIndex].ms)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speedIndex, advance])

  if (loading) return <LoadingState />
  if (error || !race) return <ErrorState />

  const currentSnapshot = snapshots[currentIndex]

  return (
    <div style={{ maxWidth:840, margin:'0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.25rem' }}>
          <Activity size={18} color="var(--color-primary)" />
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.9rem', color:'var(--color-text-1)', letterSpacing:'0.05em' }}>
            TIMELINE
          </h1>
        </div>
        <p style={{ fontSize:'0.75rem', color:'var(--color-text-3)', fontFamily:'var(--font-mono)' }}>
          {snapshots.length} snapshots · {allUsers.length} participantes
        </p>
      </motion.div>

      {/* Shared controls */}
      <SnapshotControls
        snapshots={snapshots}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        playing={playing}
        onPlayPause={() => setPlaying(p => !p)}
        speedIndex={speedIndex}
        onSpeedChange={setSpeedIndex}
      />

      {/* Race */}
      <RaceView
        snapshot={currentSnapshot}
        allUsers={allUsers}
        showAll={showAll}
        onToggleShowAll={() => setShowAll(p => !p)}
      />

      {/* Movement feed */}
      <MovementFeed snapshot={currentSnapshot} allUsers={allUsers} />

      {/* Ranking line chart */}
      {ranking && (
        <RankingTimeline
          rankingData={ranking}
          allUsers={allUsers}
          currentIndex={currentIndex}
        />
      )}

    </div>
  )
}

// ─── Loading / Error ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ maxWidth:840, margin:'0 auto' }}>
      {[...Array(3)].map((_,i) => (
        <motion.div key={i} animate={{ opacity:[0.3,0.6,0.3] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.15 }}
          style={{ height: i===0?80:200, borderRadius:12, background:'var(--color-surface)', marginBottom:'1rem', border:'1px solid var(--color-border)' }} />
      ))}
    </div>
  )
}

function ErrorState() {
  return (
    <div style={{ maxWidth:840, margin:'2rem auto', padding:'2rem', background:'var(--color-surface)', borderRadius:12, border:'1px solid var(--color-error)', textAlign:'center' }}>
      <Activity size={32} color="var(--color-error)" style={{ marginBottom:'1rem' }} />
      <p style={{ color:'var(--color-text-2)', fontSize:'0.875rem' }}>No se pudo cargar el timeline.</p>
      <p style={{ color:'var(--color-text-3)', fontSize:'0.75rem', marginTop:'0.5rem', fontFamily:'var(--font-mono)' }}>Verifica que timeline_race.json está sincronizado.</p>
    </div>
  )
}
