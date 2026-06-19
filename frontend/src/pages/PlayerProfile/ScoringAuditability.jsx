import { useState, useEffect } from 'react'

function useIsMobile(bp = 680) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}
import { motion, AnimatePresence } from 'framer-motion'

// ─── Load contract ─────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL ?? '/'
async function loadContract() {
  const r = await fetch(BASE + 'data/scoring_integrity_v1.json')
  return r.json()
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  mono:    'var(--font-mono)',
  display: 'var(--font-display)',
  primary: 'var(--color-primary)',
  accent:  'var(--color-accent)',
  text1:   'var(--color-text-1)',
  text2:   'var(--color-text-2)',
  text3:   'var(--color-text-3)',
  surface: 'var(--color-surface)',
  surface2:'var(--color-surface-2)',
  border:  'var(--color-border)',
  success: '#00E676',
  error:   '#FF3D57',
}

// ─── Meta → visual atmosphere ──────────────────────────────────────────────────
// Each tab's meta drives container-level spacing, typography weight and atmosphere.
function resolveMetaStyles(meta = {}, visual = {}) {
  const { tone, density, layout } = meta

  const spacing = density === 'low'    ? { sectionGap: '2.5rem', lineHeight: 1.85, bodySize: '1rem' }
                : density === 'medium' ? { sectionGap: '1.75rem', lineHeight: 1.7,  bodySize: '0.9rem' }
                :                        { sectionGap: '1.25rem', lineHeight: 1.6,  bodySize: '0.85rem' }

  // Tone → background atmosphere tint (very subtle)
  const atmosphereBg = 'transparent'

  // Layout → max-width and prose feel
  const maxWidth =
    layout === 'editorial'          ? 580
  : layout === 'terminal-editorial' ? 640
  : layout === 'terminal-grid'      ? 720
  : layout === 'modular'            ? 680
  : 620

  // Tone → hero headline size
  const heroSize =
    tone === 'cinematic'  ? 'clamp(1.75rem, 3.5vw, 2.5rem)'
  : tone === 'financial'  ? 'clamp(1.4rem, 2.5vw, 1.9rem)'
  : tone === 'systemic'   ? 'clamp(1.3rem, 2.5vw, 1.8rem)'
  :                          'clamp(1.4rem, 2.8vw, 2rem)'

  // Monospace weight for financial/systemic tones
  const monoHeavy = tone === 'financial' || tone === 'systemic'

  // visual overrides from tab.visual
  const rowStyle         = visual.row_style         ?? null
  const numberAlign      = visual.number_align       ?? 'left'
  const pipelineAnim     = visual.pipeline_animation ?? null
  const pipelineDelayMs  = visual.pipeline_delay_ms  ?? 0
  const moduleStyle      = visual.module_style       ?? null
  const matrixOpacity    = visual.matrix_opacity      ?? 0

  return {
    ...spacing, atmosphereBg, maxWidth, heroSize, monoHeavy, tone, layout,
    rowStyle, numberAlign, pipelineAnim, pipelineDelayMs, moduleStyle, matrixOpacity,
  }
}

// ─── Sub-tab navigation ────────────────────────────────────────────────────────
function AuditSubTabs({ tabs, active, onChange }) {
  const isMobile = useIsMobile(680)
  return (
    <div style={{
      display: 'flex', gap: '0.25rem', marginBottom: '1.75rem',
      borderBottom: `1px solid ${T.border}`,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: isMobile ? '0.5rem 0.5rem 0.625rem' : '0.5rem 1rem 0.625rem',
            fontFamily: T.mono, fontSize: isMobile ? '0.58rem' : '0.68rem',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: isActive ? T.text1 : T.text3,
            borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'color 0.15s, border-color 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroBlock({ hero, ms }) {
  if (!hero) return null
  return (
    <div style={{ marginBottom: ms.density === 'low' ? '3rem' : '2rem' }}>
      <div style={{
        fontFamily: T.mono, fontSize: '0.58rem', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: T.accent, marginBottom: '0.75rem',
      }}>
        {hero.eyebrow}
      </div>
      <h2 style={{
        fontFamily: ms.monoHeavy ? T.mono : T.display,
        fontSize: ms.heroSize,
        fontWeight: 700, color: T.text1, margin: '0 0 0.75rem',
        lineHeight: 1.15, letterSpacing: ms.monoHeavy ? '-0.02em' : '-0.01em',
      }}>
        {hero.headline}
      </h2>
      <p style={{
        fontFamily: T.display, fontSize: ms.bodySize,
        color: T.text2, margin: 0, lineHeight: ms.lineHeight,
        maxWidth: ms.maxWidth,
      }}>
        {hero.subheadline}
      </p>
    </div>
  )
}

// ─── Paragraph ─────────────────────────────────────────────────────────────────
function ParagraphSection({ section, ms }) {
  const isHero = section.style === 'hero-body'
  return (
    <div style={{ marginBottom: ms.sectionGap }}>
      {section.title && (
        <div style={{
          fontFamily: T.mono, fontSize: '0.58rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: T.text3, marginBottom: '0.75rem',
        }}>
          {section.title}
        </div>
      )}
      {(section.content ?? []).map((line, i) => (
        <p key={i} style={{
          fontFamily: T.display,
          fontSize: isHero ? ms.bodySize : `calc(${ms.bodySize} - 0.05rem)`,
          color: isHero ? T.text1 : T.text2,
          lineHeight: ms.lineHeight, margin: 0,
          marginBottom: i < section.content.length - 1 ? '0.75rem' : 0,
          maxWidth: ms.maxWidth,
        }}>
          {line}
        </p>
      ))}
    </div>
  )
}

// ─── Quote ─────────────────────────────────────────────────────────────────────
function QuoteSection({ section, ms }) {
  return (
    <div style={{
      borderLeft: `2px solid ${T.accent}`,
      paddingLeft: '1.25rem',
      margin: `${ms.sectionGap} 0`,
    }}>
      <p style={{
        fontFamily: T.display,
        fontSize: ms.density === 'low' ? '1.05rem' : '0.92rem',
        fontStyle: 'italic', color: T.text2,
        margin: 0, lineHeight: ms.lineHeight, maxWidth: ms.maxWidth,
      }}>
        "{section.content}"
      </p>
    </div>
  )
}

// ─── Rotating Manifesto — driven by section.motion ────────────────────────────
function RotatingManifesto({ section, ms }) {
  const items    = section.items ?? []
  const motion_  = section.motion ?? {}
  // Read animation params from JSON
  const fadeDurationMs = motion_.duration_ms ?? 800
  const rotationMs     = (section.rotation_seconds ?? 6) * 1000
  const easingFn       = motion_.easing ?? 'easeInOut'

  const [idx, setIdx]         = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (items.length < 2) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % items.length)
        setVisible(true)
      }, fadeDurationMs)   // ← from JSON: duration_ms
    }, rotationMs)
    return () => clearInterval(interval)
  }, [items.length, rotationMs, fadeDurationMs])

  if (!items.length) return null

  return (
    <div style={{
      padding: ms.density === 'low' ? '2.5rem 0' : '1.5rem 0',
      margin: `0 0 ${ms.sectionGap}`,
      minHeight: 80, display: 'flex', alignItems: 'center',
    }}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: fadeDurationMs / 1000,  // ← from JSON
              ease: easingFn,                   // ← from JSON
            }}
            style={{
              fontFamily: T.display,
              fontSize: ms.density === 'low' ? 'clamp(1rem, 2.2vw, 1.35rem)' : '1rem',
              color: T.text2, margin: 0,
              lineHeight: ms.lineHeight,
              fontStyle: 'italic', maxWidth: ms.maxWidth,
            }}
          >
            {items[idx].text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Metrics Strip ─────────────────────────────────────────────────────────────
function MetricsStrip({ section, ms }) {
  const isTerminal  = section.style === 'terminal-metrics'
  const isFinancial = section.style === 'financial-grid'
  return (
    <div style={{
      display: 'flex', gap: isFinancial ? '2.5rem' : '2rem',
      flexWrap: 'wrap', margin: `0 0 ${ms.sectionGap}`,
      padding: isTerminal ? '1rem 1.25rem' : 0,
      background: isTerminal ? T.surface : 'transparent',
      border: isTerminal ? `1px solid ${T.border}` : 'none',
      borderRadius: isTerminal ? 10 : 0,
    }}>
      {(section.items ?? []).map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{
            fontFamily: T.mono,
            fontSize: isFinancial ? '1.15rem' : isTerminal ? '1.6rem' : '1.5rem',
            fontWeight: 700,
            color: isTerminal ? T.primary : ms.tone === 'financial' ? T.accent : T.text1,
            letterSpacing: '-0.02em',
          }}>
            {item.value}
          </span>
          <span style={{
            fontFamily: T.mono, fontSize: '0.56rem',
            textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text3,
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Scoring Block ─────────────────────────────────────────────────────────────
function ScoringBlock({ section }) {
  const isFeatured = section.style === 'featured-card'
  return (
    <div style={{
      background: isFeatured
        ? 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))'
        : T.surface,
      border: `1px solid ${isFeatured
        ? 'color-mix(in srgb, var(--color-primary) 22%, var(--color-border))'
        : T.border}`,
      borderRadius: 10, padding: '1.25rem 1.5rem',
      marginBottom: '0.875rem',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '1rem',
      }}>
        <span style={{
          fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isFeatured ? T.primary : T.text2,
        }}>
          {section.title}
        </span>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          {(section.metrics ?? []).map((m, i) => (
            <div key={i} style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: T.mono, fontSize: '1.05rem', fontWeight: 700,
                color: isFeatured ? T.primary : T.accent,
              }}>
                {m.value}
              </div>
              <div style={{
                fontFamily: T.mono, fontSize: '0.5rem', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: T.text3,
              }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      {(section.rules ?? []).map((rule, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.4rem 0',
          borderTop: `1px solid ${T.border}`,
        }}>
          <span style={{ fontFamily: T.display, fontSize: '0.82rem', color: T.text2 }}>
            {rule.label}
          </span>
          <span style={{
            fontFamily: T.mono, fontSize: '0.72rem', fontWeight: 700,
            color: rule.points > 0 ? T.success : T.text3,
          }}>
            +{rule.points}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Scoring Example ───────────────────────────────────────────────────────────
function ScoringExample({ section }) {
  const { prediction: pred, result: res, breakdown, total_points } = section
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem',
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: '0.58rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', color: T.text3, marginBottom: '1.25rem',
      }}>
        {section.title}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem',
      }}>
        {[{ data: pred, label: 'Pronóstico' }, { data: res, label: 'Resultado oficial' }].reduce((acc, side, si) => {
          acc.push(
            <div key={si} style={{ background: T.surface2, borderRadius: 8, padding: '0.875rem 1rem' }}>
              <div style={{ fontFamily: T.mono, fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text3, marginBottom: '0.6rem' }}>
                {side.label}
              </div>
              <div style={{ fontFamily: T.display, fontSize: '0.82rem', color: T.text1, fontWeight: 600 }}>
                {side.data?.home_team}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: '1.1rem', fontWeight: 700, color: T.text1, margin: '0.3rem 0' }}>
                {side.data?.home_score} – {side.data?.away_score}
              </div>
              <div style={{ fontFamily: T.display, fontSize: '0.82rem', color: T.text1, fontWeight: 600 }}>
                {side.data?.away_team}
              </div>
            </div>
          )
          if (si === 0) acc.push(
            <div key="vs" style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>vs</div>
          )
          return acc
        }, [])}
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1rem' }}>
        {(breakdown ?? []).map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.3rem 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: 4, fontSize: 9, flexShrink: 0,
                background: row.result ? '#00E67618' : '#FF3D5712',
                border: `1px solid ${row.result ? '#00E67632' : '#FF3D5728'}`,
                color: row.result ? T.success : T.error,
              }}>
                {row.result ? '✓' : '✕'}
              </span>
              <span style={{
                fontFamily: T.display, fontSize: '0.8rem',
                color: row.result ? T.text1 : T.text3,
              }}>
                {row.label}
              </span>
            </div>
            <span style={{
              fontFamily: T.mono, fontSize: '0.72rem', fontWeight: 700,
              color: row.result ? T.success : T.text3,
            }}>
              {row.result ? `+${row.points}` : '+0'}
            </span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${T.border}`,
        }}>
          <span style={{
            fontFamily: T.mono, fontSize: '0.58rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: T.text3,
          }}>
            Total
          </span>
          <span style={{ fontFamily: T.mono, fontSize: '1.1rem', fontWeight: 700, color: T.success }}>
            +{total_points} pts
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Info Strip ────────────────────────────────────────────────────────────────
function InfoStrip({ section, ms }) {
  return (
    <div style={{
      borderLeft: `2px solid ${T.border}`,
      paddingLeft: '1rem', margin: `0 0 ${ms.sectionGap}`,
    }}>
      {(section.content ?? []).map((line, i) => (
        <p key={i} style={{
          fontFamily: T.display, fontSize: '0.82rem',
          color: T.text3, margin: 0,
          marginBottom: i < section.content.length - 1 ? '0.4rem' : 0,
          lineHeight: ms.lineHeight,
        }}>
          {line}
        </p>
      ))}
    </div>
  )
}

// ─── Financial Example (Golf Split) — terminal-line when visual.row_style set ──
function FinancialExample({ section, ms }) {
  const numAlign = ms.numberAlign ?? 'left'
  return (
    <div style={{ marginBottom: ms.sectionGap }}>
      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem', marginBottom: '0',
      }}>
        <span style={{
          fontFamily: T.mono, fontSize: '1.2rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: T.text1,
        }}>{section.title}</span>
        <span style={{ fontFamily: T.mono, fontSize: '0.56rem', color: T.text1 }}>
          {section.scenario}
        </span>
      </div>

      {/* Position rows — terminal-line: no card, just ruled rows */}
      {(section.positions ?? []).map((pos, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '0.55rem 0',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <span style={{
            fontFamily: T.mono, fontSize: '0.62rem', letterSpacing: '0.08em',
            color: T.text3, textTransform: 'uppercase',
          }}>{pos.position}</span>
          <span style={{
            fontFamily: T.mono, fontSize: '1.15rem', fontWeight: 700,
            color: T.text1, textAlign: numAlign,
          }}>{pos.prize}</span>
        </div>
      ))}

      {/* Clearing line */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '0.7rem 0 0',
      }}>
        <span style={{
          fontFamily: T.mono, fontSize: '0.6rem', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: T.text3,
        }}>
          {section.combined_pool} ÷ 2
        </span>
        <span style={{
          fontFamily: T.mono, fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-accent)', textAlign: numAlign,
        }}>
          {section.final_distribution}
        </span>
      </div>
    </div>
  )
}

// ─── System Flow — sequential-fade when visual.pipeline_animation set ────────
function PipelineStep({ step, index, delayMs, accentColor, ms }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * delayMs)
    return () => clearTimeout(t)
  }, [index, delayMs])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -6 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          background: 'transparent',
          border: `1px solid color-mix(in srgb, ${accentColor} ${Math.round(30 + ms.matrixOpacity * 70)}%, ${T.border})`,
          borderRadius: 6, padding: '0.35rem 0.875rem',
          fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 600,
          color: `color-mix(in srgb, ${accentColor} ${Math.round(ms.matrixOpacity * 80)}%, ${T.text1})`,
          whiteSpace: 'nowrap',
        }}
      >
        {step}
      </motion.div>
    </div>
  )
}

function SystemFlow({ section, ms }) {
  const steps       = section.steps ?? []
  const isFinancial = section.style === 'financial-terminal'
  const accentColor = isFinancial ? T.accent : T.primary
  const useSeq      = ms.pipelineAnim === 'sequential-fade'
  const delayMs     = ms.pipelineDelayMs ?? 0

  return (
    <div style={{ marginBottom: ms.sectionGap }}>
      <div style={{
        fontFamily: T.mono, fontSize: '0.58rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', color: T.text3, marginBottom: '1rem',
      }}>
        {section.title}
      </div>
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0, marginBottom: '1rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {useSeq
              ? <PipelineStep step={step} index={i} delayMs={delayMs} accentColor={accentColor} ms={ms} />
              : (
                <div style={{
                  background: 'transparent',
                  border: `1px solid color-mix(in srgb, ${accentColor} ${Math.round(30 + ms.matrixOpacity * 70)}%, ${T.border})`,
                  borderRadius: 6, padding: '0.35rem 0.875rem',
                  fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 600,
                  color: `color-mix(in srgb, ${accentColor} ${Math.round(ms.matrixOpacity * 80)}%, ${T.text1})`,
                  whiteSpace: 'nowrap',
                }}>{step}</div>
              )
            }
            {i < steps.length - 1 && (
              <div style={{
                width: 1, height: 14,
                background: `linear-gradient(to bottom, ${accentColor}60, ${accentColor}20)`,
                marginLeft: 16,
              }} />
            )}
          </div>
        ))}
      </div>
      {(section.content ?? []).map((line, i) => (
        <p key={i} style={{
          fontFamily: T.display, fontSize: '0.85rem', color: T.text2,
          margin: 0, marginBottom: '0.4rem', lineHeight: ms.lineHeight,
          maxWidth: ms.maxWidth,
        }}>{line}</p>
      ))}
    </div>
  )
}

// ─── Code Modules — directory-listing when visual.module_style set ────────────
function CodeModules({ section, ms }) {
  const isDirListing = ms.moduleStyle === 'directory-listing'
  const mxOp         = ms.matrixOpacity ?? 0

  if (isDirListing) {
    return (
      <div style={{ marginBottom: ms.sectionGap }}>
        <div style={{
          fontFamily: T.mono, fontSize: '0.58rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: T.text3, marginBottom: '0.75rem',
        }}>
          {section.title}
        </div>
        {/* ls -la style listing */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 8, overflow: 'hidden', marginBottom: '1rem',
        }}>
          {/* header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '24px 1fr 1fr',
            padding: '0.4rem 0.875rem',
            borderBottom: `1px solid ${T.border}`,
            background: T.surface2,
          }}>
            {['#', 'archivo', 'módulo'].map((h, i) => (
              <span key={i} style={{
                fontFamily: T.mono, fontSize: '0.5rem', textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: `color-mix(in srgb, var(--color-primary) ${Math.round(mxOp * 100)}%, ${T.text3})`,
              }}>{h}</span>
            ))}
          </div>
          {(section.modules ?? []).map((mod, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 1fr',
              padding: '0.45rem 0.875rem',
              borderBottom: i < section.modules.length - 1 ? `1px solid ${T.border}` : 'none',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontFamily: T.mono, fontSize: '0.6rem', color: T.text3,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{
                fontFamily: T.mono, fontSize: '0.65rem',
                color: `color-mix(in srgb, var(--color-primary) ${Math.round(mxOp * 100)}%, ${T.text2})`,
              }}>{mod.name}</span>
              <span style={{
                fontFamily: T.display, fontSize: '0.75rem', color: T.text2,
              }}>{mod.label}</span>
            </div>
          ))}
        </div>
        {(section.content ?? []).map((line, i) => (
          <p key={i} style={{
            fontFamily: T.display, fontSize: '0.82rem', color: T.text3,
            margin: 0, lineHeight: ms.lineHeight,
          }}>{line}</p>
        ))}
      </div>
    )
  }

  // default grid
  return (
    <div style={{ marginBottom: ms.sectionGap }}>
      <div style={{
        fontFamily: T.mono, fontSize: '0.58rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', color: T.text3, marginBottom: '1rem',
      }}>
        {section.title}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: '0.625rem', marginBottom: '1rem',
      }}>
        {(section.modules ?? []).map((mod, i) => (
          <div key={i} style={{
            background: T.surface,
            border: `1px solid color-mix(in srgb, var(--color-primary) 15%, ${T.border})`,
            borderRadius: 8, padding: '0.875rem 1rem',
          }}>
            <div style={{
              fontFamily: T.mono, fontSize: '0.6rem', color: T.primary,
              marginBottom: '0.4rem', wordBreak: 'break-all',
            }}>{mod.name}</div>
            <div style={{ fontFamily: T.display, fontSize: '0.78rem', color: T.text2 }}>
              {mod.label}
            </div>
          </div>
        ))}
      </div>
      {(section.content ?? []).map((line, i) => (
        <p key={i} style={{
          fontFamily: T.display, fontSize: '0.82rem', color: T.text3,
          margin: 0, lineHeight: ms.lineHeight,
        }}>{line}</p>
      ))}
    </div>
  )
}

// ─── Section Dispatcher — passes meta styles down ──────────────────────────────
function SectionRenderer({ section, ms }) {
  switch (section.type) {
    case 'paragraph':          return <ParagraphSection   section={section} ms={ms} />
    case 'quote':              return <QuoteSection        section={section} ms={ms} />
    case 'rotating_manifesto': return <RotatingManifesto   section={section} ms={ms} />
    case 'metrics_strip':      return <MetricsStrip        section={section} ms={ms} />
    case 'scoring_block':      return <ScoringBlock        section={section} ms={ms} />
    case 'scoring_example':    return <ScoringExample      section={section} />
    case 'info_strip':         return <InfoStrip           section={section} ms={ms} />
    case 'financial_example':  return <FinancialExample    section={section} ms={ms} />
    case 'system_flow':        return <SystemFlow          section={section} ms={ms} />
    case 'code_modules':       return <CodeModules         section={section} ms={ms} />
    default:                   return null
  }
}

// ─── Tab Content — meta-driven container ───────────────────────────────────────
function TabContent({ tab }) {
  if (!tab) return null
  const ms = resolveMetaStyles(tab.meta, tab.visual ?? {})
  return (
    <motion.div
      key={tab.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: ms.atmosphereBg,
        maxWidth: ms.maxWidth,
      }}
    >
      <HeroBlock hero={tab.hero} ms={ms} />
      {(tab.sections ?? []).map(section => (
        <SectionRenderer key={section.id} section={section} ms={ms} />
      ))}
    </motion.div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ScoringAuditability() {
  const [contract, setContract] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadContract().then(setContract).catch(() => setContract(null))
  }, [])

  if (!contract) {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem 2rem',
        fontFamily: T.mono, fontSize: '0.65rem',
        color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        Cargando...
      </div>
    )
  }

  const tabs    = contract.tabs ?? []
  const current = tabs.find(t => t.id === activeTab) ?? tabs[0]

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <AuditSubTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="wait">
        {current && <TabContent key={activeTab} tab={current} />}
      </AnimatePresence>
    </div>
  )
}
