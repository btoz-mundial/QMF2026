/**
 * KnockoutSimTile
 *
 * Simulador de marcador de eliminatorias como 4ª tarjeta de la fila resumen
 * (solo escritorio). Altura constante: colapsado (pastilla) y expandido ocupan
 * lo mismo que las tarjetas métricas; al abrir cambia su contenido, no crece.
 * En móvil se usa el SimulationCard full-width (steppers apilados).
 */
import { stageLabel, teamAbbrev } from './simLabels'

const CARD = {
  border: '0.5px solid var(--color-primary)',
  borderRadius: 12, padding: '0.55rem 0.7rem', minHeight: 74, boxSizing: 'border-box',
  display: 'flex', flexDirection: 'column', justifyContent: 'center',
}
const HEAD = {
  display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.56rem',
  fontFamily: 'var(--font-mono)', color: 'var(--color-primary)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

function StepBtn({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 22, height: 22, borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        color: disabled ? 'var(--color-text-3)' : 'var(--color-primary)',
        fontSize: '0.95rem', fontWeight: 700, lineHeight: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  )
}

// Badge "Nuevo" para la pastilla: visible hasta el 21-Jul-2026 inclusive (se oculta el 22).
const NEW_BADGE = (
  <span style={{
    fontSize: '0.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
    color: '#FBBF24', background: 'color-mix(in srgb, #FBBF24 16%, transparent)',
    border: '1px solid color-mix(in srgb, #FBBF24 45%, transparent)',
    padding: '1px 5px', borderRadius: 999, textTransform: 'uppercase', whiteSpace: 'nowrap',
  }}>
    ✨ Nuevo
  </span>
)

export default function KnockoutSimTile({ nextMatch, score, expanded, onToggle, onScore, onReset }) {
  if (!nextMatch) return null
  const active = !!score
  const open = expanded || active
  const showNew = new Date() < new Date(2026, 6, 22)
  const cur = score ?? { home_goals: 0, away_goals: 0 }
  const bump = (side, d) => onScore({ ...cur, [side]: Math.max(0, (cur[side] ?? 0) + d) })

  // ── Colapsado: pastilla ────────────────────────────────────────────────────
  if (!open) {
    return (
      <div
        onClick={() => onToggle(true)}
        className={showNew ? 'qmf-new-glow' : undefined}
        style={{ ...CARD, gap: 2, cursor: 'pointer', background: 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))' }}
      >
        <div style={HEAD}>🔮 Simular marcador {showNew && NEW_BADGE}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--color-primary)', letterSpacing: '0.03em' }}>
            {stageLabel(nextMatch.stage)}
          </span>
          <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>▾</span>
        </div>
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', opacity: 0.8 }}>
          {teamAbbrev(nextMatch.home_team)} v {teamAbbrev(nextMatch.away_team)}
        </div>
      </div>
    )
  }

  // ── Expandido: steppers lado a lado, misma altura ──────────────────────────
  const stepper = (side) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <StepBtn label="−" onClick={() => bump(side, -1)} disabled={(cur[side] ?? 0) === 0} />
        <span style={{ minWidth: 14, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: active ? 'var(--color-primary)' : 'var(--color-text-3)' }}>
          {active ? cur[side] : '–'}
        </span>
        <StepBtn label="+" onClick={() => bump(side, +1)} />
      </div>
      <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', fontWeight: 600 }}>
        {teamAbbrev(side === 'home_goals' ? nextMatch.home_team : nextMatch.away_team)}
      </span>
    </div>
  )

  return (
    <div style={{ ...CARD, gap: 4 }}>
      <div style={HEAD}>
        🔮 {stageLabel(nextMatch.stage)}
        <span style={{ flex: 1 }} />
        <button
          onClick={() => onReset()}
          aria-label="Volver al leaderboard oficial"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', fontSize: '0.85rem', lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {stepper('home_goals')}
        <span style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>-</span>
        {stepper('away_goals')}
      </div>
    </div>
  )
}
