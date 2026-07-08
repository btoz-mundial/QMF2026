/**
 * SimulationCard
 *
 * Punto de entrada inline de "Simular próximo partido", encima de la tabla.
 * Shell genérico (título, partido, contexto) + controles por fase:
 *   - variant "group"    → 3 opciones L/E/V (usa consenso del campo).
 *   - variant "knockout" → marcador (steppers), aplica regla de 5 pts.
 */
import { motion } from 'framer-motion'
import { optionLabel, stageLabel } from './simLabels'

const OPTION_COLOR = {
  L: 'var(--color-primary)',
  E: '#FBBF24',
  V: 'var(--color-accent)',
}

export default function SimulationCard({
  variant = 'group',
  nextMatch, consensus, outcome, onSelect, isLastGroupMatch, fetching,
  score, onScore,
}) {
  if (!nextMatch) return null

  const when = [nextMatch.dateLabel, nextMatch.kickoffLabel].filter(Boolean).join(' · ')
  // Etiqueta "NUEVO" visible solo hasta el 25-Jun-2026 inclusive (se oculta el 26).
  const showNew = new Date() < new Date(2026, 5, 26)
  const isKnockout = variant === 'knockout'

  const title = isKnockout
    ? `🔮 Predice el marcador · ${stageLabel(nextMatch.stage)}`
    : '🔮 Predice el próximo partido'

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))',
        border: '1px solid color-mix(in srgb, var(--color-primary) 26%, var(--color-border))',
        borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.125rem',
      }}
    >
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {showNew && (
          <span style={{
            fontSize: '0.55rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
            color: '#FBBF24', background: 'color-mix(in srgb, #FBBF24 16%, transparent)',
            border: '1px solid color-mix(in srgb, #FBBF24 45%, transparent)',
            padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            ✨ Nuevo
          </span>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-1)', fontWeight: 600 }}>
          {nextMatch.home_team} vs {nextMatch.away_team}
        </span>
        {when && (
          <span style={{ fontSize: '0.66rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{when}</span>
        )}
      </div>

      {isKnockout ? (
        <KnockoutControls nextMatch={nextMatch} score={score} onScore={onScore} />
      ) : isLastGroupMatch ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          Proyección no disponible para el cierre de la fase de grupos (activaría la tabla de posiciones).
        </div>
      ) : (
        <GroupControls nextMatch={nextMatch} consensus={consensus} outcome={outcome} onSelect={onSelect} fetching={fetching} />
      )}
    </motion.div>
  )
}

// ── Controles de grupos: 3 opciones L/E/V ──────────────────────────────────────
function GroupControls({ nextMatch, consensus, outcome, onSelect, fetching }) {
  const pct = o => Math.round(consensus?.[o]?.percentage ?? 0)
  return (
    <>
      {/* Consenso del campo (contexto) */}
      {consensus && (
        <div style={{ marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginBottom: 3 }}>
            <span>Pronósticos del campo</span>
            <span>{nextMatch.home_team} {pct('L')}% · Empate {pct('E')}% · {nextMatch.away_team} {pct('V')}%</span>
          </div>
          <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', background: 'var(--color-surface-2)' }}>
            {['L', 'E', 'V'].map(o => (
              <div key={o} style={{ width: `${pct(o)}%`, background: OPTION_COLOR[o] }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
        {['L', 'E', 'V'].map(o => {
          const selected = outcome === o
          const color = OPTION_COLOR[o]
          return (
            <button
              key={o}
              onClick={() => onSelect(selected ? null : o)}
              disabled={fetching}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.5rem 0.4rem', borderRadius: 8, cursor: fetching ? 'wait' : 'pointer',
                background: selected ? `color-mix(in srgb, ${color} 16%, transparent)` : 'var(--color-surface)',
                border: `1px solid ${selected ? color : 'var(--color-border)'}`,
                color: selected ? color : 'var(--color-text-2)',
                fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                transition: 'all 0.15s', minWidth: 0,
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>{selected ? '◉' : '○'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {optionLabel(o, nextMatch)}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Controles de knockout: marcador con steppers ───────────────────────────────
function KnockoutControls({ nextMatch, score, onScore }) {
  const active = !!score
  const cur = score ?? { home_goals: 0, away_goals: 0 }
  const bump = (side, d) => onScore({ ...cur, [side]: Math.max(0, (cur[side] ?? 0) + d) })

  const row = (team, side) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {team}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <Stepper label="−" onClick={() => bump(side, -1)} disabled={(cur[side] ?? 0) === 0} />
        <span style={{
          minWidth: 26, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1.35rem',
          lineHeight: 1, color: active ? 'var(--color-primary)' : 'var(--color-text-3)',
        }}>
          {active ? cur[side] : '–'}
        </span>
        <Stepper label="+" onClick={() => bump(side, +1)} />
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {row(nextMatch.home_team, 'home_goals')}
      {row(nextMatch.away_team, 'away_goals')}
      <div style={{ fontSize: '0.64rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
        {active
          ? 'Marcador hipotético · la tabla muestra la proyección.'
          : 'Ajusta el marcador para simular cómo cambiaría la tabla.'}
      </div>
    </div>
  )
}

function Stepper({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30, height: 30, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        color: disabled ? 'var(--color-text-3)' : 'var(--color-primary)',
        fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  )
}
