import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, ChevronDown, Info } from 'lucide-react'
import { useBracket } from '@/hooks/useBracket'
import { flagUrl, getTeam } from '@/utils/teams'

const STAGE_ORDER = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','FINAL','THIRD_PLACE']
const STAGE_LABEL = { ROUND_OF_32:'R32', ROUND_OF_16:'R16', QUARTER_FINAL:'QF', SEMI_FINAL:'SF', FINAL:'Final', THIRD_PLACE:'3er Lugar' }
const STAGE_FULL  = { ROUND_OF_32:'Ronda de 32', ROUND_OF_16:'Ronda de 16', QUARTER_FINAL:'Cuartos', SEMI_FINAL:'Semifinal', FINAL:'Final', THIRD_PLACE:'Tercer Lugar' }
const DEPTH_LABEL = { 0:'R32', 1:'R16', 2:'QF', 3:'SF' }
const WINNER_LABEL = { REGULAR_TIME:'TR', EXTRA_TIME:'TE', PENALTIES:'Pen' }

// Desktop card dimensions — increase these to scale the whole bracket
const COL_W  = 150   // column width px (was 118)
const COL_GAP = 8    // gap between columns px (was 6)

function isPending(r) { return !r || r.status === 'scheduled' || r.home_team === null }

// ─── User Selector ────────────────────────────────────────────────────────────

function UserSelector({ userIndex, selectedId, onSelect }) {
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)
  const ref                 = useRef(null)
  const selected = userIndex.find(u => u.user_id === selectedId)
  const filtered = search.trim() ? userIndex.filter(u => (u.display_name??'').toLowerCase().includes(search.toLowerCase())) : userIndex
  useEffect(() => { function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false)} document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h) },[])
  return (
    <div ref={ref} style={{ position:'relative', width:220 }}>
      <div onClick={() => setOpen(p=>!p)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0.75rem', borderRadius:8, cursor:'pointer', background:'var(--color-surface)', border:`1px solid ${open?'var(--color-primary)':'var(--color-border)'}` }}>
        <span style={{ fontSize:'0.8rem', color:selected?'var(--color-text-1)':'var(--color-text-3)' }}>{selected?selected.display_name:'Ver puntos de usuario...'}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {selected && <button onClick={e=>{e.stopPropagation();onSelect(null);setSearch('')}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-text-3)',padding:0,display:'flex' }}><X size={12}/></button>}
          <ChevronDown size={13} color="var(--color-text-3)" style={{ transform:open?'rotate(180deg)':'none',transition:'transform 0.15s' }}/>
        </div>
      </div>
      {open && (
        <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:100,background:'var(--color-surface-2)',border:'1px solid var(--color-border)',borderRadius:8,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ padding:'0.5rem' }}><input autoFocus placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:'100%',padding:'0.375rem 0.625rem',background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:6,color:'var(--color-text-1)',fontSize:'0.78rem',outline:'none' }}/></div>
          <div style={{ maxHeight:200,overflowY:'auto' }}>
            {filtered.map(u=>(
              <div key={u.user_id} onMouseDown={()=>{onSelect(u.user_id);setOpen(false);setSearch('')}}
                style={{ padding:'0.5rem 0.875rem',cursor:'pointer',fontSize:'0.8rem',color:u.user_id===selectedId?'var(--color-primary)':'var(--color-text-1)',background:u.user_id===selectedId?'color-mix(in srgb, var(--color-primary) 8%, transparent)':'transparent' }}
                onMouseEnter={e=>{if(u.user_id!==selectedId)e.currentTarget.style.background='var(--color-surface)'}}
                onMouseLeave={e=>{if(u.user_id!==selectedId)e.currentTarget.style.background='transparent'}}>
                {u.display_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Breakdown Chip ──────────────────────────────────────────────────────────────
function BdChip({ label, earned }) {
  return (
    <span style={{
      fontSize:'8px',fontFamily:'var(--font-mono)',fontWeight:700,
      padding:'1px 4px',borderRadius:3,
      background: earned ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.07)',
      border: `1px solid ${earned ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.15)'}`,
      color: earned ? 'var(--color-success)' : 'var(--color-text-3)',
    }}>{label}</span>
  )
}

// ─── Team Row (desktop) ───────────────────────────────────────────────────────

function TeamRow({ team, goals, penalties, isWinner, isLoser, isChampPath, breakdown, slot, teamMap }) {
  const td      = getTeam(team, teamMap)
  const flag    = flagUrl(td?.iso2)
  const goalKey = slot==='home'?'home_goals':'away_goals'
  // Show +1/+0 only when breakdown exists (pick + result both present)
  const goalPt  = breakdown ? (breakdown[goalKey] ? '+1' : '+0') : null
  const goalClr = goalPt==='+1' ? '#E2B96A' : 'var(--color-text-3)'
  const accent  = isChampPath&&isWinner?'#D4A017':isWinner?'var(--color-success)':isLoser?'rgba(148,163,184,0.15)':'var(--color-border-light)'
  const nameClr = isWinner&&isChampPath?'#F5C518':isWinner?'var(--color-success)':isLoser?'var(--color-text-3)':'var(--color-text-2)'
  const scoreBg = isLoser?'rgba(30,35,50,0.7)':'#FFF'
  const scoreClr= isLoser?'var(--color-text-3)':'#111'
  return (
    <div style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 7px',minHeight:30,borderBottom:'1px solid var(--color-border)',background:isWinner&&isChampPath?'rgba(212,160,23,0.08)':isWinner?'color-mix(in srgb, var(--color-success) 5%, transparent)':'transparent' }}>
      <div style={{ width:3,minHeight:22,borderRadius:1,flexShrink:0,background:accent }}/>
      {flag&&<img src={flag} alt="" style={{ width:18,height:12,objectFit:'cover',borderRadius:1,flexShrink:0,opacity:isLoser?0.4:1 }}/>}
      <span style={{ flex:1,fontSize:'11px',fontWeight:isWinner?700:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:nameClr }}>{team??'TBD'}</span>
      {goals!==null&&goals!==undefined?(
        <div style={{ display:'flex',alignItems:'center',gap:2,flexShrink:0 }}>
          {goalPt&&<span style={{ fontSize:'9px',color:goalClr,fontFamily:'var(--font-mono)',fontWeight:700 }}>{goalPt}</span>}
          <div style={{ width:22,height:20,background:scoreBg,border:'1px solid var(--color-border)',borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ fontSize:'13px',fontWeight:700,color:scoreClr }}>{goals}</span></div>
          {penalties!==null&&penalties!==undefined&&<span style={{ fontSize:'9px',color:'var(--color-accent)',fontFamily:'var(--font-mono)',fontWeight:700 }}>({penalties})</span>}
        </div>
      ):(
        <div style={{ width:22,height:20,background:'color-mix(in srgb, var(--color-border) 40%, transparent)',border:'1px solid var(--color-border)',borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><span style={{ fontSize:'10px',color:'var(--color-text-3)' }}>-</span></div>
      )}
    </div>
  )
}

// ─── Match Card (desktop) ─────────────────────────────────────────────────────

function MatchCard({ matchId, result, pick, isChampPath, teamMap, meta }) {
  const [showMeta, setShowMeta] = useState(false)
  const [tipRect, setTipRect] = useState(null)
  const wrapRef = React.useRef(null)
  const pending = isPending(result)
  const home    = result?.home_team??pick?.home_team??'TBD'
  const away    = result?.away_team??pick?.away_team??'TBD'
  const adv     = result?.advance_team??null
  const pts     = pick?.points??0
  const wt      = !pending&&result ? (result.winner_type ? WINNER_LABEL[result.winner_type] : 'TR') : null
  const bd      = pick?.breakdown
  const border  = isChampPath&&!pending?'rgba(212,160,23,0.5)':pts>0?'color-mix(in srgb, var(--color-success) 20%, transparent)':'var(--color-border)'
  return (
    <div ref={wrapRef} style={{ position:'relative', width:'100%' }}
      onMouseEnter={()=>{
        if(wrapRef.current) setTipRect(wrapRef.current.getBoundingClientRect())
        setShowMeta(true)
      }}
      onMouseLeave={()=>{ setShowMeta(false); setTipRect(null) }}>
      <div style={{ background:'var(--color-surface)',border:`1px solid ${border}`,borderRadius:5,overflow:'hidden',boxShadow:isChampPath&&!pending?'0 0 10px rgba(212,160,23,0.2)':'none',width:'100%' }}>
        <TeamRow team={home} goals={result?.home_goals} penalties={result?.home_penalties} isWinner={adv===home} isLoser={!pending&&adv!==null&&adv!==home} isChampPath={isChampPath} breakdown={pick?.breakdown} slot="home" teamMap={teamMap}/>
        <TeamRow team={away} goals={result?.away_goals} penalties={result?.away_penalties} isWinner={adv===away} isLoser={!pending&&adv!==null&&adv!==away} isChampPath={isChampPath} breakdown={pick?.breakdown} slot="away" teamMap={teamMap}/>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 7px',background:'color-mix(in srgb, var(--color-bg) 50%, transparent)',borderTop:'1px solid var(--color-border)',minHeight:18,gap:3 }}>
          <div style={{ display:'flex',alignItems:'center',gap:3,flexWrap:'nowrap' }}>
            {wt?<span style={{ fontSize:'8px',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--color-text-1)',background:'rgba(226,232,240,0.10)',border:'1px solid rgba(226,232,240,0.22)',padding:'1px 4px',borderRadius:3,flexShrink:0 }}>{wt}</span>:null}
            {meta&&<span style={{ display:'inline-flex',alignItems:'center',cursor:'help',color:showMeta?'var(--color-primary)':'var(--color-text-3)',opacity:showMeta?1:0.5,transition:'color 0.15s,opacity 0.15s',flexShrink:0 }}><Info size={9} strokeWidth={2}/></span>}
            {bd&&!pending&&<>
              <BdChip label="EX" earned={bd.exact_goals||bd.exact_score} />
              <BdChip label="LC" earned={bd.home_team} />
              <BdChip label="VS" earned={bd.away_team} />
            </>}
          </div>
          {pick&&!pending&&<span style={{ fontSize:'10px',fontFamily:'var(--font-mono)',fontWeight:700,color:pts>0?'var(--color-success)':'var(--color-text-3)',flexShrink:0 }}>+{pts}</span>}
        </div>
      </div>
      {meta&&showMeta&&tipRect&&(()=>{
        const above = tipRect.top > 140
        return (
          <div style={{ position:'fixed', zIndex:9999, left:tipRect.left, ...(above?{bottom:window.innerHeight-tipRect.top+5}:{top:tipRect.bottom+5}), minWidth:195, maxWidth:240, background:'#1a1d2e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'9px 11px', boxShadow:'0 12px 32px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column', gap:4, pointerEvents:'none' }}>
            <div style={{ fontSize:11,fontWeight:600,color:'#e2e8f0',lineHeight:1.3 }}>🏟 {meta.venue}</div>
            <div style={{ fontSize:10,fontFamily:'var(--font-mono)',color:'#94a3b8' }}>📍 {meta.city}, {meta.country}</div>
            <div style={{ fontSize:10,fontFamily:'var(--font-mono)',color:'#94a3b8' }}>🗓 {meta.match_date} · {meta.kickoff_utc} UTC</div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Champion Box ─────────────────────────────────────────────────────────────

function ChampionBox({ result, pick, teamMap }) {
  const champ = result?.advance_team??null
  const uPick = pick?.prediction?.advance_team??pick?.prediction?.advance??pick?.advance_team??pick?.advance??null
  const ok    = champ&&uPick&&champ===uPick
  const td    = getTeam(champ, teamMap)
  const flag  = flagUrl(td?.iso2)
  return (
    <div style={{ border:`2px solid ${champ?'#D4A017':'rgba(212,160,23,0.3)'}`,borderRadius:10,padding:'4px 10px',textAlign:'center',background:'var(--color-surface)',boxShadow:champ?'0 0 24px rgba(212,160,23,0.35)':'none',width:'100%' }}>
      <div style={{ fontFamily:'var(--font-display)',fontSize:'20px',color:'#D4A017',letterSpacing:'1px',marginBottom:6 }}>CAMPEÓN</div>
      {champ?(
        <>
          {flag&&<img src={flag} alt="" style={{ width:60,height:40,objectFit:'cover',borderRadius:2,marginBottom:2,display:'block',margin:'0 auto 2px' }}/>}
          <div style={{ fontSize:'20px',fontWeight:700,color:'#F5C518',marginBottom:5 }}>{champ}</div>
          {uPick&&<div style={{ fontSize:'10px',fontFamily:'var(--font-mono)',color:ok?'var(--color-success)':'var(--color-error)',display:'flex',alignItems:'center',justifyContent:'center',gap:2 }}>{ok?'✓':'✗'} {uPick}</div>}
          {uPick&&ok&&<div style={{ marginTop:5,display:'inline-block',padding:'2px 8px',borderRadius:4,background:'rgba(212,160,23,0.15)',border:'1px solid rgba(212,160,23,0.4)',fontSize:'11px',fontFamily:'var(--font-mono)',fontWeight:700,color:'#D4A017' }}>+15 BONO 🏆</div>}
          {uPick&&!ok&&champ&&<div style={{ marginTop:5,display:'inline-block',padding:'2px 8px',borderRadius:4,background:'rgba(100,116,139,0.1)',border:'1px solid rgba(100,116,139,0.25)',fontSize:'11px',fontFamily:'var(--font-mono)',color:'var(--color-text-3)' }}>+0 BONO</div>}
        </>
      ):(
        <>
          {uPick&&<div style={{ fontSize:'12px',color:'var(--color-primary)',fontWeight:600,marginBottom:2 }}>{uPick}</div>}
          <div style={{ fontSize:'11px',color:'var(--color-text-3)',fontFamily:'var(--font-mono)' }}>Por definir</div>
          {uPick&&<div style={{ marginTop:5,display:'inline-block',padding:'2px 8px',borderRadius:4,background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',fontSize:'11px',fontFamily:'var(--font-mono)',color:'var(--color-text-3)' }}>+15 si acierta 🏆</div>}
        </>
      )}
    </div>
  )
}

// ─── Desktop Bracket ──────────────────────────────────────────────────────────

function BracketColumn({ label, matches, pos, CARD_H, totalHeight, resultsMap, userPicksMap, championPath, teamMap, metaMap }) {
  return (
    <div style={{ width:COL_W, flexShrink:0 }}>
      <div style={{ background:'var(--color-surface-2)',borderRadius:'5px 5px 0 0',padding:'6px 4px',textAlign:'center',fontSize:'11px',fontWeight:700,letterSpacing:'0.5px',color:'#D4A017',fontFamily:'var(--font-mono)',marginBottom:4 }}>{label}</div>
      <div style={{ position:'relative', height:totalHeight }}>
        {matches.map(({ matchId, centerY }) => (
          <div key={matchId} style={{ position:'absolute', top: centerY - CARD_H/2, left:0, right:0 }}>
            <MatchCard matchId={matchId} result={resultsMap[matchId]} pick={userPicksMap[matchId]} isChampPath={championPath.has(matchId)} teamMap={teamMap} meta={metaMap?.[matchId]}/>
          </div>
        ))}
      </div>
    </div>
  )
}

function DesktopBracket({ layout, resultsMap, userPicksMap, championPath, teamMap, metaMap }) {
  const { left, right, finalId, thirdId, pos, totalHeight, CARD_H } = layout
  const totalCols = 9
  const minW = totalCols * COL_W + (totalCols - 1) * COL_GAP + 24

  return (
    <div style={{ overflowX:'auto', overflowY:'hidden', paddingBottom:16 }}>
      <div style={{ display:'flex', gap:COL_GAP, minWidth:minW, padding:'0 12px', alignItems:'flex-start' }}>

        {/* Left side: R32 → R16 → QF → SF */}
        {[0,1,2,3].map(depth => (
          <BracketColumn key={`L${depth}`} label={DEPTH_LABEL[depth]} matches={left[depth]} pos={pos} CARD_H={CARD_H} totalHeight={totalHeight} resultsMap={resultsMap} userPicksMap={userPicksMap} championPath={championPath} teamMap={teamMap} metaMap={metaMap}/>
        ))}

        {/* Center: Final + 3rd */}
        <div style={{ width:COL_W, flexShrink:0 }}>
          {/* #07111F como texto es intencional: texto oscuro sobre fondo dorado */}
          <div style={{ background:'#D4A017',borderRadius:'5px 5px 0 0',padding:'6px 4px',textAlign:'center',fontSize:'11px',fontWeight:700,color:'#07111F',fontFamily:'var(--font-mono)',marginBottom:4 }}>FINAL</div>
          <div style={{ position:'relative', height:totalHeight }}>
            <div style={{ position:'absolute', top:totalHeight*0.51 - CARD_H, left:0, right:0 }}>
              <ChampionBox result={finalId?resultsMap[finalId]:null} pick={finalId?userPicksMap[finalId]:null} teamMap={teamMap}/>
            </div>
            {thirdId && (
              <div style={{ position:'absolute', top:totalHeight*0.72, left:0, right:0 }}>
                <div style={{ fontSize:'9px',fontFamily:'var(--font-mono)',color:'var(--color-text-3)',textAlign:'center',marginBottom:4,letterSpacing:'0.5px' }}>3ER LUGAR</div>
                <MatchCard matchId={thirdId} result={resultsMap[thirdId]} pick={userPicksMap[thirdId]} isChampPath={false} teamMap={teamMap} meta={metaMap?.[thirdId]}/>
                {(()=>{
                  const r3=resultsMap[thirdId]; const p3=userPicksMap[thirdId]
                  if(!p3) return null
                  const adv3=r3?.advance_team??null
                  const pAdv3=p3?.prediction?.advance_team??p3?.prediction?.advance??p3?.advance_team??p3?.advance??null
                  if(!pAdv3) return null
                  const ok3=adv3&&pAdv3===adv3
                  if(adv3===null) return <div style={{ textAlign:'center',marginTop:3,fontSize:'9px',fontFamily:'var(--font-mono)',color:'var(--color-text-3)' }}>+5 si acierta 3°</div>
                  return <div style={{ textAlign:'center',marginTop:3,fontSize:'9px',fontFamily:'var(--font-mono)',fontWeight:700,color:ok3?'#D4A017':'var(--color-text-3)' }}>{ok3?'+5 BONO 🥉':'+0 BONO'}</div>
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right side: SF → QF → R16 → R32 */}
        {[3,2,1,0].map(depth => (
          <BracketColumn key={`R${depth}`} label={DEPTH_LABEL[depth]} matches={right[depth]} pos={pos} CARD_H={CARD_H} totalHeight={totalHeight} resultsMap={resultsMap} userPicksMap={userPicksMap} championPath={championPath} teamMap={teamMap} metaMap={metaMap}/>
        ))}

      </div>
    </div>
  )
}

// ─── Mobile ───────────────────────────────────────────────────────────────────

function MobileMatchCard({ matchId, result, pick, isChampPath, bracketGraph, teamMap, meta }) {
  const pending = isPending(result)
  const gi      = bracketGraph[matchId.toString()]
  const is3rd   = gi?.stage==='THIRD_PLACE'
  const home    = result?.home_team??pick?.home_team??'TBD'
  const away    = result?.away_team??pick?.away_team??'TBD'
  const adv     = result?.advance_team??null
  const pickAdv = pick?.prediction?.advance??pick?.advance??null
  const pts     = pick?.points??0
  const wt      = result?.winner_type?WINNER_LABEL[result.winner_type]:null
  const border  = isChampPath&&!pending?'rgba(212,160,23,0.45)':pts>0?'color-mix(in srgb, var(--color-success) 20%, transparent)':'var(--color-border)'
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{ background:'var(--color-surface)',border:`1px solid ${border}`,borderRadius:10,overflow:'hidden',marginBottom:'0.625rem',boxShadow:isChampPath&&!pending?'0 0 14px rgba(212,160,23,0.18)':'none' }}>
      <div style={{ padding:'5px 12px',background:'color-mix(in srgb, var(--color-bg) 50%, transparent)',borderBottom:'1px solid var(--color-border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <span style={{ fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--color-text-3)' }}>#{matchId}</span>
          {isChampPath&&!pending&&<span style={{ fontSize:'0.6rem',color:'#D4A017',fontFamily:'var(--font-mono)' }}>★ Ruta Campeón</span>}
          {is3rd&&<span style={{ fontSize:'0.6rem',color:'#A78BFA',fontFamily:'var(--font-mono)' }}>3er Lugar</span>}
          {meta&&<span style={{ fontSize:'0.58rem',color:'var(--color-text-3)',fontFamily:'var(--font-mono)' }}>· {meta.venue}, {meta.city}</span>}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          {wt&&<span style={{ fontSize:'0.6rem',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--color-text-1)',background:'rgba(226,232,240,0.10)',border:'1px solid rgba(226,232,240,0.22)',padding:'1px 5px',borderRadius:3 }}>{wt}</span>}
          {pick&&!pending&&<span style={{ fontSize:'0.7rem',fontFamily:'var(--font-mono)',fontWeight:700,color:pts>0?'var(--color-success)':'var(--color-text-3)' }}>+{pts} pts</span>}
        </div>
      </div>
      <div style={{ padding:'8px 12px' }}>
        {[{team:home,goals:result?.home_goals,pen:result?.home_penalties,slot:'home'},{team:away,goals:result?.away_goals,pen:result?.away_penalties,slot:'away'}].map(({team,goals,pen,slot},i)=>{
          const isW=adv===team, isL=!pending&&adv!==null&&adv!==team, isPick=pickAdv===team
          const td=getTeam(team,teamMap), flag=flagUrl(td?.iso2)
          const mbd=pick?.breakdown
          const goalPt=mbd?(mbd[slot==='home'?'home_goals':'away_goals']?'+1':'+0'):null
          const goalClr=goalPt==='+1'?'#E2B96A':'var(--color-text-3)'
          const mScoreBg = isL?'rgba(30,35,50,0.7)':'#FFF'
          const mScoreClr= isL?'var(--color-text-3)':'#111'
          const mNameClr = isW&&isChampPath?'#F5C518':isW?'var(--color-success)':isL?'var(--color-text-3)':'var(--color-text-2)'
          const mBarClr  = isW&&isChampPath?'#D4A017':isW?'var(--color-success)':isL?'rgba(148,163,184,0.15)':'var(--color-border-light)'
          return (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:'0.5rem',padding:'7px 0',borderBottom:i===0?'1px solid var(--color-border)':'none' }}>
              <div style={{ width:4,height:34,borderRadius:2,flexShrink:0,background:mBarClr }}/>
              {flag&&<img src={flag} alt="" style={{ width:22,height:15,objectFit:'cover',borderRadius:2,flexShrink:0,opacity:isL?0.4:1 }}/>}
              <span style={{ flex:1,fontSize:'0.88rem',fontWeight:isW?700:500,color:mNameClr,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{team??'TBD'}</span>
              <div style={{ display:'flex',alignItems:'center',gap:3,flexShrink:0 }}>
                {isPick&&!pending&&<span style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',padding:'2px 6px',borderRadius:4,background:isW?'color-mix(in srgb, var(--color-success) 15%, transparent)':'color-mix(in srgb, var(--color-error) 10%, transparent)',color:isW?'var(--color-success)':'var(--color-error)',border:`1px solid ${isW?'color-mix(in srgb, var(--color-success) 30%, transparent)':'color-mix(in srgb, var(--color-error) 20%, transparent)'}`,flexShrink:0}}>{isW?'✓':'✗'}</span>}
                {isPick&&pending&&<span style={{fontSize:'0.62rem',color:'var(--color-primary)',padding:'2px 6px',borderRadius:4,background:'color-mix(in srgb, var(--color-primary) 8%, transparent)',border:'1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)',flexShrink:0}}>pick</span>}
                {!pending?(
                  <div style={{display:'flex',alignItems:'center',gap:2,flexShrink:0}}>
                    {goalPt&&<span style={{fontSize:'0.62rem',color:goalClr,fontFamily:'var(--font-mono)',fontWeight:700}}>{goalPt}</span>}
                    <div style={{width:26,height:22,background:mScoreBg,border:'1px solid var(--color-border)',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:'12px',fontWeight:700,color:mScoreClr}}>{goals??'-'}</span></div>
                    {pen!==null&&pen!==undefined&&<span style={{fontSize:'0.65rem',color:'var(--color-accent)',fontFamily:'var(--font-mono)',fontWeight:700}}>({pen})</span>}
                  </div>
                ):(
                  <div style={{width:26,height:22,background:'color-mix(in srgb, var(--color-border) 40%, transparent)',border:'1px solid var(--color-border)',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:'10px',color:'var(--color-text-3)'}}>?</span></div>
                )}
              </div>
            </div>
          )
        })}
        {pick&&!pending&&(()=>{
          const mbd=pick?.breakdown
          if(!mbd) return null
          const pts2=pick?.points??0
          return (
            <div style={{ display:'flex',alignItems:'center',gap:4,paddingTop:'6px',flexWrap:'wrap' }}>
              <BdChip label="EX" earned={mbd.exact_goals||mbd.exact_score} />
              <BdChip label="LC" earned={mbd.home_team} />
              <BdChip label="VS" earned={mbd.away_team} />
              <span style={{ marginLeft:'auto',fontSize:'0.7rem',fontFamily:'var(--font-mono)',fontWeight:700,color:pts2>0?'var(--color-success)':'var(--color-text-3)' }}>+{pts2} pts</span>
            </div>
          )
        })()}
      </div>
    </motion.div>
  )
}

function MobileBracket({ bracketGraph, resultsMap, userPicksMap, championPath, teamMap, metaMap }) {
  const stages = STAGE_ORDER.filter(s=>Object.values(bracketGraph).some(m=>m.stage===s))
  const [active, setActive] = useState(stages[0])
  const matches = Object.entries(bracketGraph).filter(([,i])=>i.stage===active).sort(([,a],[,b])=>a.bracket_position-b.bracket_position).map(([id])=>parseInt(id))
  return (
    <div>
      <div style={{ display:'flex',gap:4,overflowX:'auto',paddingBottom:8,scrollbarWidth:'none' }}>
        {stages.map(s=>(
          <button key={s} onClick={()=>setActive(s)} style={{ padding:'0.375rem 0.75rem',borderRadius:20,border:'1px solid',borderColor:active===s?'var(--color-primary)':'var(--color-border)',background:active===s?'color-mix(in srgb, var(--color-primary) 10%, transparent)':'transparent',color:active===s?'var(--color-primary)':'var(--color-text-3)',fontSize:'0.72rem',fontFamily:'var(--font-mono)',fontWeight:active===s?700:400,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap' }}>
            {STAGE_LABEL[s]}
          </button>
        ))}
      </div>
      <div style={{ marginTop:'0.625rem' }}>
        <div style={{ fontFamily:'var(--font-display)',fontSize:'0.95rem',color:'var(--color-text-1)',letterSpacing:'0.05em',marginBottom:'0.625rem' }}>
          {STAGE_FULL[active]}<span style={{ fontSize:'0.62rem',color:'var(--color-text-3)',fontFamily:'var(--font-mono)',marginLeft:'0.5rem' }}>{matches.length} partido{matches.length!==1?'s':''}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:0.18}}>
            {matches.map(id=>(<MobileMatchCard key={id} matchId={id} result={resultsMap[id]} pick={userPicksMap[id]} isChampPath={championPath.has(id)} bracketGraph={bracketGraph} teamMap={teamMap} meta={metaMap?.[id]}/>))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Legend({ hasUser }) {
  return (
    <div style={{ display:'flex',gap:'0.875rem',flexWrap:'wrap',marginBottom:'0.875rem',padding:'0.5rem 0.875rem',background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:8 }}>
      {[{color:'#D4A017',label:'Ruta campeón'},{color:'var(--color-success)',label:'Ganó'},{color:'var(--color-text-3)',label:'Eliminado'}].map(({color,label})=>(
        <span key={label} style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.68rem',color:'var(--color-text-2)'}}>
          <span style={{width:7,height:7,borderRadius:2,background:color}}/>{label}
        </span>
      ))}
      {hasUser&&(
        <>
          <span style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.68rem',color:'var(--color-text-2)'}}>
            <span style={{fontSize:'8px',fontFamily:'var(--font-mono)',fontWeight:700,padding:'1px 4px',borderRadius:3,background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.3)',color:'var(--color-success)'}}>EX</span>
            Punto marcador exacto
          </span>
          <span style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.68rem',color:'var(--color-text-2)'}}>
            <span style={{fontSize:'8px',fontFamily:'var(--font-mono)',fontWeight:700,padding:'1px 4px',borderRadius:3,background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.3)',color:'var(--color-success)'}}>LC</span>
            Punto Eq. local
          </span>
          <span style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.68rem',color:'var(--color-text-2)'}}>
            <span style={{fontSize:'8px',fontFamily:'var(--font-mono)',fontWeight:700,padding:'1px 4px',borderRadius:3,background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.3)',color:'var(--color-success)'}}>VS</span>
            Punto Eq. visita
          </span>
          <span style={{fontSize:'0.68rem',color:'#E2B96A',fontFamily:'var(--font-mono)',fontWeight:700}}>+1/+0 marcador</span>
        </>
      )}
      <span style={{ fontSize:'0.65rem',color:'var(--color-text-3)',fontFamily:'var(--font-mono)' }}>TR = Tiempo regular · TE = Tiempo Extra · Pen = Penales</span>
    </div>
  )
}

// ─── Loading State ────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div style={{ maxWidth:840, margin:'4rem auto', textAlign:'center', color:'var(--color-text-3)', fontFamily:'var(--font-mono)', fontSize:'0.85rem' }}>
      Error cargando el bracket. Intenta recargar la página.
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ maxWidth:840, margin:'0 auto' }}>
      {[...Array(3)].map((_,i) => (
        <motion.div key={i} animate={{opacity:[0.3,0.6,0.3]}} transition={{duration:1.5,repeat:Infinity,delay:i*0.15}}
          style={{ height:i===0?60:300, borderRadius:12, background:'var(--color-surface)', marginBottom:'1rem', border:'1px solid var(--color-border)' }}/>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BracketPage() {
  const [selectedUser, setSelectedUser] = useState(null)
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 900)
  const [metaMap, setMetaMap]           = useState({})
  const { data, loading, error }        = useBracket(selectedUser)
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<900);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[])
  useEffect(()=>{
    import('../../config/urls').then(({ DATA_URLS }) => {
      fetch(DATA_URLS.matchesMetadata).then(r=>r.json()).then(d=>{
        const m={};Object.values(d).forEach(e=>{m[e.match_id]=e});setMetaMap(m)
      }).catch(()=>{})
    })
  },[])

  if (loading) return <LoadingState/>
  if (error || !data?.layout) return <ErrorState/>

  const { bracketGraph, resultsMap, userPicksMap, userIndex, teamMap, champion, championPath, layout } = data

  return (
    <div style={{ maxWidth:isMobile?600:'93%', margin:'0 auto' }}>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:'1rem'}}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.75rem',marginBottom:'0.375rem' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'0.625rem' }}>
            <Trophy size={18} color="#D4A017"/>
            <h1 style={{ fontFamily:'var(--font-display)',fontSize:'1.9rem',color:'var(--color-text-1)',letterSpacing:'0.05em' }}>BRACKET</h1>
            {champion&&<span style={{ fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:'#D4A017',background:'rgba(212,160,23,0.1)',border:'1px solid rgba(212,160,23,0.25)',padding:'0.2rem 0.6rem',borderRadius:20 }}>★ {champion}</span>}
          </div>
          <UserSelector userIndex={userIndex} selectedId={selectedUser} onSelect={setSelectedUser}/>
        </div>
        <p style={{ fontSize:'0.72rem',color:'var(--color-text-3)',fontFamily:'var(--font-mono)' }}>
          32 partidos · Fase eliminatoria · {selectedUser&&userIndex.find(u=>u.user_id===selectedUser)&&<span style={{ color:'var(--color-primary)' }}>Puntos de {userIndex.find(u=>u.user_id===selectedUser)?.display_name}</span>}
        </p>
        <Legend hasUser={!!selectedUser&&Object.keys(userPicksMap).length>0}/>
      </motion.div>
      <div style={{ overflowX:'auto', paddingBottom:'1rem' }}>
        {isMobile
          ? <MobileBracket bracketGraph={bracketGraph} resultsMap={resultsMap} userPicksMap={userPicksMap} championPath={championPath} teamMap={teamMap} metaMap={metaMap}/>
          : <DesktopBracket layout={layout} resultsMap={resultsMap} userPicksMap={userPicksMap} championPath={championPath} teamMap={teamMap} metaMap={metaMap}/>}
      </div>
    </div>
  )
}
