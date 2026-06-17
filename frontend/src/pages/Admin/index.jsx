import { useState, useEffect, useCallback } from 'react'

// ─── Config del repo ────────────────────────────────────────────────────────────
const OWNER  = 'btoz-mundial'
const REPO   = 'QMF2026'
const BRANCH = 'main'
const TOKEN_KEY = 'qmf_admin_token'

const PATHS = {
  group:     'data/results/group_results.json',
  standings: 'data/results/standings_results.json',
  knockout:  'data/results/knockout_results.json',
  teams:     'data/teams/teams.json',
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const WINNER_TYPES = ['REGULAR_TIME', 'EXTRA_TIME', 'PENALTIES']
const WT_LABEL = { REGULAR_TIME: 'Tiempo regular', EXTRA_TIME: 'Tiempo extra', PENALTIES: 'Penales' }

// ─── Utilidades base64 UTF-8 ────────────────────────────────────────────────────
function b64encode(str) { return btoa(unescape(encodeURIComponent(str))) }
function b64decode(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── GitHub Contents API ────────────────────────────────────────────────────────
async function ghGet(path, token) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  })
  if (!res.ok) { const e = new Error('GET ' + path); e.status = res.status; throw e }
  const data = await res.json()
  return { json: JSON.parse(b64decode(data.content)), sha: data.sha }
}

async function ghPut(path, obj, sha, message, token) {
  const content = b64encode(JSON.stringify(obj, null, 2))
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, sha, branch: BRANCH }),
  })
  if (!res.ok) { const e = new Error('PUT ' + path); e.status = res.status; throw e }
  return res.json()
}

// Flujo SHA: GET fresco → patch → PUT; reintenta ante conflicto (409/422).
async function saveWithRetry(path, patchFn, message, token, attempts = 4) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    const { json, sha } = await ghGet(path, token)
    patchFn(json)
    try {
      return await ghPut(path, json, sha, message, token)
    } catch (e) {
      lastErr = e
      if (e.status === 409 || e.status === 422) { await sleep(300 * (i + 1)); continue }
      throw e
    }
  }
  throw lastErr
}

// ─── Hook responsive ─────────────────────────────────────────────────────────────
function useIsMobile(bp = 680) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

// ─── Átomos UI ───────────────────────────────────────────────────────────────────
const inputStyle = {
  width: 64, padding: '0.55rem', fontSize: '1.1rem', textAlign: 'center',
  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 8, color: 'var(--color-text-1)', outline: 'none',
}
const btn = (bg, fg) => ({
  padding: '0.6rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: '0.85rem', fontWeight: 700, background: bg, color: fg,
})

function Pill({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer',
      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
      background: active ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-surface)',
      color: active ? 'var(--color-primary)' : 'var(--color-text-2)',
      fontSize: '0.82rem', fontWeight: 700,
    }}>{children}</button>
  )
}

function Toast({ msg }) {
  if (!msg) return null
  const color = msg.type === 'ok' ? '#34D399' : msg.type === 'err' ? '#F87171' : 'var(--color-primary)'
  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
      background: 'var(--color-surface-2)', border: `1px solid ${color}`, color,
      padding: '0.6rem 1rem', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxWidth: '90vw', textAlign: 'center',
    }}>{msg.text}</div>
  )
}

// ─── Token gate ──────────────────────────────────────────────────────────────────
function TokenGate({ onSave }) {
  const [val, setVal] = useState('')
  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
      <h2 style={{ fontSize: '1rem', color: 'var(--color-text-1)', marginBottom: '0.75rem' }}>Token de administración</h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', lineHeight: 1.6, marginBottom: '1rem' }}>
        Pega tu GitHub token (fine-grained, solo este repo, permiso Contents: read/write). Se guarda en este dispositivo.
      </p>
      <input
        type="password" value={val} onChange={e => setVal(e.target.value)}
        placeholder="github_pat_..." autoComplete="off"
        style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.875rem' }}
      />
      <button onClick={() => val.trim() && onSave(val.trim())} style={{ ...btn('var(--color-primary)', '#07111F'), width: '100%' }}>
        Guardar token
      </button>
    </div>
  )
}

// ─── TAB: Grupos ─────────────────────────────────────────────────────────────────
function GruposTab({ token, notify }) {
  const [matches, setMatches] = useState(null)
  const [filter, setFilter]   = useState('pendientes')
  const [editId, setEditId]   = useState(null)
  const [draft, setDraft]     = useState({ h: '', a: '' })
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    try { const { json } = await ghGet(PATHS.group, token); setMatches(json) }
    catch (e) { setErr(e.status === 401 ? 'Token inválido' : 'No se pudo cargar (' + (e.status || '?') + ')') }
  }, [token])

  useEffect(() => { load() }, [load])

  if (err) return <ErrorBox msg={err} onRetry={load} />
  if (!matches) return <Loading />

  const isPending = m => m.status !== 'final'
  const list = [...matches].sort((a, b) => a.match_id - b.match_id)
    .filter(m => filter === 'todos' || isPending(m))

  function openEdit(m) {
    setEditId(m.match_id)
    setDraft({ h: m.home_goals ?? '', a: m.away_goals ?? '' })
  }

  async function save(m) {
    const h = parseInt(draft.h, 10), a = parseInt(draft.a, 10)
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) { notify('Marcador inválido', 'err'); return }
    setSaving(true)
    try {
      await saveWithRetry(PATHS.group, json => {
        const row = json.find(x => x.match_id === m.match_id)
        if (!row) throw new Error('match not found')
        row.home_goals = h; row.away_goals = a
        row.result = h > a ? 'L' : h < a ? 'V' : 'E'
        row.status = 'final'
      }, `Resultado #${m.match_id}: ${m.home_team} ${h}-${a} ${m.away_team}`, token)
      notify(`✓ Guardado #${m.match_id}`, 'ok')
      setEditId(null)
      await load()
    } catch (e) {
      notify(e.status === 401 ? 'Token inválido' : 'Error al guardar (' + (e.status || '?') + ')', 'err')
    } finally { setSaving(false) }
  }

  const pendCount = matches.filter(isPending).length

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <Pill active={filter === 'pendientes'} onClick={() => setFilter('pendientes')}>Pendientes ({pendCount})</Pill>
        <Pill active={filter === 'todos'} onClick={() => setFilter('todos')}>Todos ({matches.length})</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {list.map(m => {
          const editing = editId === m.match_id
          const final = m.status === 'final'
          return (
            <div key={m.match_id} style={{ background: 'var(--color-surface)', border: `1px solid ${final ? 'color-mix(in srgb, var(--color-success) 30%, var(--color-border))' : 'var(--color-border)'}`, borderRadius: 10, padding: '0.75rem 0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', minWidth: 30 }}>#{m.match_id}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', borderRadius: 4, padding: '1px 5px' }}>{m.group}</span>
                <span style={{ flex: 1, minWidth: 140, fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-1)' }}>
                  {m.home_team} <span style={{ color: 'var(--color-text-3)' }}>vs</span> {m.away_team}
                </span>
                {final && !editing && (
                  <span style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-success)' }}>
                    {m.home_goals}–{m.away_goals}
                  </span>
                )}
                {!editing && (
                  <button onClick={() => openEdit(m)} style={btn('var(--color-surface-2)', 'var(--color-text-1)')}>
                    {final ? 'Editar' : 'Capturar'}
                  </button>
                )}
              </div>
              {editing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', minWidth: 90 }}>{m.home_team}</span>
                  <input type="number" min="0" inputMode="numeric" value={draft.h} onChange={e => setDraft(d => ({ ...d, h: e.target.value }))} style={inputStyle} />
                  <span style={{ color: 'var(--color-text-3)' }}>–</span>
                  <input type="number" min="0" inputMode="numeric" value={draft.a} onChange={e => setDraft(d => ({ ...d, a: e.target.value }))} style={inputStyle} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', minWidth: 90 }}>{m.away_team}</span>
                  <button disabled={saving} onClick={() => save(m)} style={{ ...btn('var(--color-primary)', '#07111F'), opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando…' : 'Guardar'}</button>
                  <button disabled={saving} onClick={() => setEditId(null)} style={btn('transparent', 'var(--color-text-3)')}>Cancelar</button>
                </div>
              )}
            </div>
          )
        })}
        {list.length === 0 && <Empty text="No hay partidos en este filtro." />}
      </div>
    </div>
  )
}

// ─── TAB: Tabla (standings) ──────────────────────────────────────────────────────
function TablaTab({ token, notify }) {
  const [standings, setStandings] = useState(null)
  const [groupTeams, setGroupTeams] = useState(null)
  const [draft, setDraft] = useState({})  // { A: [t1,t2,t3,t4], ... }
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const [st, gr] = await Promise.all([ghGet(PATHS.standings, token), ghGet(PATHS.group, token)])
      setStandings(st.json)
      const gt = {}
      GROUPS.forEach(g => {
        const teams = [...new Set((gr.json || []).filter(m => m.group === g).flatMap(m => [m.home_team, m.away_team]).filter(Boolean))]
        gt[g] = teams
      })
      setGroupTeams(gt)
      const d = {}
      GROUPS.forEach(g => {
        const grp = (st.json.groups || []).find(x => x.group === g)
        d[g] = [1, 2, 3, 4].map(pos => grp?.positions?.find(p => p.position === pos)?.team ?? '')
      })
      setDraft(d)
    } catch (e) { setErr(e.status === 401 ? 'Token inválido' : 'No se pudo cargar (' + (e.status || '?') + ')') }
  }, [token])

  useEffect(() => { load() }, [load])

  if (err) return <ErrorBox msg={err} onRetry={load} />
  if (!standings || !groupTeams) return <Loading />

  function setPos(g, idx, team) { setDraft(d => ({ ...d, [g]: d[g].map((t, i) => i === idx ? team : t) })) }

  async function save() {
    // Validación: cada grupo con 4 equipos distintos
    for (const g of GROUPS) {
      const teams = draft[g].filter(Boolean)
      if (teams.length !== 4 || new Set(teams).size !== 4) { notify(`Grupo ${g}: faltan posiciones o hay repetidos`, 'err'); return }
    }
    setSaving(true)
    try {
      await saveWithRetry(PATHS.standings, json => {
        json.groups = GROUPS.map(g => ({ group: g, positions: draft[g].map((team, i) => ({ position: i + 1, team })) }))
        json.status = 'final'
      }, 'Posiciones finales de grupos capturadas', token)
      notify('✓ Tabla guardada', 'ok')
      await load()
    } catch (e) {
      notify(e.status === 401 ? 'Token inválido' : 'Error al guardar (' + (e.status || '?') + ')', 'err')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Captura única tras el partido #72. Selecciona el orden final 1°–4° de cada grupo.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
        {GROUPS.map(g => (
          <div key={g} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Grupo {g}</div>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 18, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{i + 1}°</span>
                <select value={draft[g][i]} onChange={e => setPos(g, i, e.target.value)}
                  style={{ flex: 1, padding: '0.45rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-1)', fontSize: '0.82rem' }}>
                  <option value="">—</option>
                  {groupTeams[g].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button disabled={saving} onClick={save} style={{ ...btn('var(--color-primary)', '#07111F'), marginTop: '1.25rem', width: '100%', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Guardando…' : 'Guardar posiciones finales'}
      </button>
    </div>
  )
}

// ─── TAB: Bracket (knockout) ─────────────────────────────────────────────────────
function BracketTab({ token, notify }) {
  const [matches, setMatches] = useState(null)
  const [filter, setFilter]   = useState('pendientes')
  const [editId, setEditId]   = useState(null)
  const [draft, setDraft]     = useState({})
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    try { const { json } = await ghGet(PATHS.knockout, token); setMatches(json) }
    catch (e) { setErr(e.status === 401 ? 'Token inválido' : 'No se pudo cargar (' + (e.status || '?') + ')') }
  }, [token])

  useEffect(() => { load() }, [load])

  if (err) return <ErrorBox msg={err} onRetry={load} />
  if (!matches) return <Loading />

  const isPending = m => m.status !== 'final'
  const list = [...matches].sort((a, b) => a.match_id - b.match_id)
    .filter(m => filter === 'todos' || isPending(m))

  function openEdit(m) {
    setEditId(m.match_id)
    setDraft({
      h: m.home_goals ?? '', a: m.away_goals ?? '',
      hp: m.home_penalties ?? '', ap: m.away_penalties ?? '',
      adv: m.advance_team ?? '', wt: m.winner_type ?? 'REGULAR_TIME',
    })
  }

  async function save(m) {
    const h = parseInt(draft.h, 10), a = parseInt(draft.a, 10)
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) { notify('Marcador inválido', 'err'); return }
    const tie = h === a
    let hp = null, ap = null
    if (tie) {
      hp = parseInt(draft.hp, 10); ap = parseInt(draft.ap, 10)
      if (Number.isNaN(hp) || Number.isNaN(ap)) { notify('Empate: captura los penales', 'err'); return }
    }
    const adv = (draft.adv || '').trim()
    if (!adv) { notify('Indica quién avanza', 'err'); return }
    const wt = draft.wt || 'REGULAR_TIME'
    setSaving(true)
    try {
      await saveWithRetry(PATHS.knockout, json => {
        const row = json.find(x => x.match_id === m.match_id)
        if (!row) throw new Error('match not found')
        row.home_goals = h; row.away_goals = a
        row.home_penalties = hp; row.away_penalties = ap
        row.advance_team = adv; row.winner_type = wt; row.status = 'final'
      }, `Knockout #${m.match_id}: avanza ${adv}`, token)
      notify(`✓ Guardado #${m.match_id}`, 'ok')
      setEditId(null)
      await load()
    } catch (e) {
      notify(e.status === 401 ? 'Token inválido' : 'Error al guardar (' + (e.status || '?') + ')', 'err')
    } finally { setSaving(false) }
  }

  const pendCount = matches.filter(isPending).length
  const tie = draft.h !== '' && draft.a !== '' && parseInt(draft.h, 10) === parseInt(draft.a, 10)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <Pill active={filter === 'pendientes'} onClick={() => setFilter('pendientes')}>Pendientes ({pendCount})</Pill>
        <Pill active={filter === 'todos'} onClick={() => setFilter('todos')}>Todos ({matches.length})</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {list.map(m => {
          const editing = editId === m.match_id
          const final = m.status === 'final'
          const teamsKnown = m.home_team && m.away_team
          return (
            <div key={m.match_id} style={{ background: 'var(--color-surface)', border: `1px solid ${final ? 'color-mix(in srgb, var(--color-success) 30%, var(--color-border))' : 'var(--color-border)'}`, borderRadius: 10, padding: '0.75rem 0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', minWidth: 30 }}>#{m.match_id}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', borderRadius: 4, padding: '1px 5px' }}>{m.stage}</span>
                <span style={{ flex: 1, minWidth: 140, fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-1)' }}>
                  {m.home_team || 'TBD'} <span style={{ color: 'var(--color-text-3)' }}>vs</span> {m.away_team || 'TBD'}
                </span>
                {final && !editing && (
                  <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                    {m.home_goals}–{m.away_goals}{m.home_penalties != null ? ` (${m.home_penalties}-${m.away_penalties})` : ''} · {m.advance_team}
                  </span>
                )}
                {!editing && (
                  <button onClick={() => openEdit(m)} style={btn('var(--color-surface-2)', 'var(--color-text-1)')}>{final ? 'Editar' : 'Capturar'}</button>
                )}
              </div>
              {editing && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', minWidth: 80 }}>{m.home_team || 'Local'}</span>
                    <input type="number" min="0" inputMode="numeric" value={draft.h} onChange={e => setDraft(d => ({ ...d, h: e.target.value }))} style={inputStyle} />
                    <span style={{ color: 'var(--color-text-3)' }}>–</span>
                    <input type="number" min="0" inputMode="numeric" value={draft.a} onChange={e => setDraft(d => ({ ...d, a: e.target.value }))} style={inputStyle} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', minWidth: 80 }}>{m.away_team || 'Visitante'}</span>
                  </div>
                  {tie && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', minWidth: 80 }}>Penales</span>
                      <input type="number" min="0" inputMode="numeric" value={draft.hp} onChange={e => setDraft(d => ({ ...d, hp: e.target.value }))} style={inputStyle} />
                      <span style={{ color: 'var(--color-text-3)' }}>–</span>
                      <input type="number" min="0" inputMode="numeric" value={draft.ap} onChange={e => setDraft(d => ({ ...d, ap: e.target.value }))} style={inputStyle} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-2)', minWidth: 80 }}>Avanza</span>
                    {teamsKnown ? (
                      <select value={draft.adv} onChange={e => setDraft(d => ({ ...d, adv: e.target.value }))}
                        style={{ padding: '0.5rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: '0.85rem' }}>
                        <option value="">—</option>
                        <option value={m.home_team}>{m.home_team}</option>
                        <option value={m.away_team}>{m.away_team}</option>
                      </select>
                    ) : (
                      <input value={draft.adv} onChange={e => setDraft(d => ({ ...d, adv: e.target.value }))} placeholder="equipo" style={{ ...inputStyle, width: 140, textAlign: 'left' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-2)', minWidth: 80 }}>Definición</span>
                    {WINNER_TYPES.map(w => (
                      <Pill key={w} active={draft.wt === w} onClick={() => setDraft(d => ({ ...d, wt: w }))}>{WT_LABEL[w]}</Pill>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={saving} onClick={() => save(m)} style={{ ...btn('var(--color-primary)', '#07111F'), opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando…' : 'Guardar'}</button>
                    <button disabled={saving} onClick={() => setEditId(null)} style={btn('transparent', 'var(--color-text-3)')}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {list.length === 0 && <Empty text="No hay partidos en este filtro." />}
      </div>
    </div>
  )
}

// ─── Estados ─────────────────────────────────────────────────────────────────────
function Loading() { return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.85rem' }}>Cargando…</div> }
function Empty({ text }) { return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.82rem' }}>{text}</div> }
function ErrorBox({ msg, onRetry }) {
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-error, #F87171)', borderRadius: 12 }}>
      <p style={{ color: 'var(--color-text-2)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{msg}</p>
      <button onClick={onRetry} style={btn('var(--color-surface-2)', 'var(--color-text-1)')}>Reintentar</button>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────────
export default function Admin() {
  const isMobile = useIsMobile()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [tab, setTab]     = useState('grupos')
  const [toast, setToast] = useState(null)

  const notify = useCallback((text, type) => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 2600)
  }, [])

  function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); setToken(t) }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); setToken('') }

  if (!token) return <TokenGate onSave={saveToken} />

  const TABS = [
    { k: 'grupos',  label: 'Grupos' },
    { k: 'tabla',   label: 'Tabla' },
    { k: 'bracket', label: 'Bracket' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-text-1)', textTransform: 'uppercase', margin: 0 }}>
          Admin · Captura
        </h1>
        <button onClick={clearToken} style={{ ...btn('transparent', 'var(--color-text-3)'), fontSize: '0.7rem', border: '1px solid var(--color-border)' }}>Cambiar token</button>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 4, marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            flex: 1, padding: '0.6rem', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: tab === t.k ? 'var(--color-surface-2)' : 'transparent',
            color: tab === t.k ? 'var(--color-primary)' : 'var(--color-text-3)',
            fontWeight: 700, fontSize: '0.85rem',
            borderBottom: tab === t.k ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'grupos'  && <GruposTab  token={token} notify={notify} />}
      {tab === 'tabla'   && <TablaTab   token={token} notify={notify} />}
      {tab === 'bracket' && <BracketTab token={token} notify={notify} />}

      <Toast msg={toast} />
    </div>
  )
}
