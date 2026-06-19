/**
 * SimulationBanner
 *
 * Aviso persistente mientras hay una simulación activa. Stage-agnostic:
 * recibe el texto del escenario y el reset, no sabe nada de grupos vs knockout.
 * Imposible confundir simulación con resultados oficiales.
 */
import { motion } from 'framer-motion'

export default function SimulationBanner({ scenario, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        background: 'color-mix(in srgb, #FBBF24 10%, var(--color-surface))',
        border: '1px solid color-mix(in srgb, #FBBF24 45%, var(--color-border))',
        borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1.125rem',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: '#FBBF24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          🧪 Modo simulación
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          Escenario: {scenario}. Los resultados mostrados son hipotéticos y no afectan el leaderboard oficial.
        </div>
      </div>
      <button
        onClick={onReset}
        style={{
          flexShrink: 0, padding: '0.45rem 0.85rem', borderRadius: 8, cursor: 'pointer',
          background: 'var(--color-surface)', border: '1px solid #FBBF24',
          color: '#FBBF24', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-body)',
        }}
      >
        Volver al leaderboard oficial
      </button>
    </motion.div>
  )
}
