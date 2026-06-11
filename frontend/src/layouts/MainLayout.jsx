import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { DATA_URLS } from '@/config/urls'

// ── Tournament status bar ──────────────────────────────────────────────────────

function deriveStage(matchId, completed) {
  if (!completed || matchId === 0) return null
  if (matchId <= 72)   return 'Grupos'
  if (matchId <= 72.5) return 'Tabla'
  if (matchId <= 104)  return 'Eliminatoria'
  return 'Final'
}

function useTournamentStatus() {
  const [status, setStatus] = useState(null)
  useEffect(() => {
    fetch(DATA_URLS.tournamentStatus)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStatus(d) })
      .catch(() => {})
  }, [])
  return status
}

function TournamentSubBar({ status }) {
  if (!status || status.completed_matches === 0) return null

  const stage = deriveStage(status.last_match_id, status.completed_matches)
  const genDate = status.generated_at
    ? new Date(status.generated_at).toLocaleString('es-MX', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false })
    : null

  return (
    <div style={{
      background: 'color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 1rem',
      height: 28,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {/* Live dot */}
      <span className="qmf-live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />

      {/* Stage chip */}
      {stage && (
        <span style={{
          fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
          padding: '1px 6px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {stage}
        </span>
      )}

      {/* Last match label */}
      <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', flexShrink: 0 }}>
        {status.last_match_label}
      </span>

      <span style={{ color: 'var(--color-border)', fontSize: '0.6rem', flexShrink: 0 }}>·</span>

      {/* Completed matches */}
      <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', flexShrink: 0 }}>
        {status.completed_matches} / 104 partidos
      </span>

      {/* Timestamp */}
      {genDate && (
        <>
          <span style={{ color: 'var(--color-border)', fontSize: '0.6rem', flexShrink: 0 }}>·</span>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', flexShrink: 0 }}>
            Actualizado {genDate}
          </span>
        </>
      )}
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/leaderboard', label: 'Tabla' },
  { to: '/groups',      label: 'Grupos' },
  { to: '/bracket',     label: 'Bracket' },
  { to: '/analytics',   label: 'Analytics' },
  { to: '/halloffame',  label: 'Hall of Fame' },
]

function useIsMobile(bp = 640) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}

export default function MainLayout() {
  const { theme, toggle } = useTheme()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const tournamentStatus = useTournamentStatus()

  // Cierra el menú al cambiar de ruta
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Cierra el menú con Escape
  useEffect(() => {
    if (!menuOpen) return
    const h = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [menuOpen])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <nav style={{
        height: 'var(--nav-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo — acceso rápido a la Tabla General */}
        <Link
          id="home-logo"
          to="/leaderboard"
          className="qmf-home-link"
          aria-label="Ir a la Tabla General"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            color: 'var(--color-primary)',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            flex: isMobile ? 1 : 'none',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          QMF 26
        </Link>

        {/* Links — solo desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  padding: '0.375rem 0.875rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-2)',
                  background: isActive ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
                  transition: 'all 0.15s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text-2)',
            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-text-1)'
            e.currentTarget.style.borderColor = 'var(--color-border-light)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-2)'
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Hamburger — solo mobile */}
        {isMobile && (
          <button
            id="mobile-menu-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: menuOpen ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
              color: menuOpen ? 'var(--color-primary)' : 'var(--color-text-2)',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </nav>

      {/* Drawer mobile */}
      {isMobile && menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', top: 'var(--nav-height)', left: 0, right: 0, bottom: 0,
              zIndex: 98,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 'var(--nav-height)', left: 0, right: 0,
            zIndex: 99,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            paddingTop: '0.375rem',
            paddingBottom: '0.75rem',
          }}>
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '0.875rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-1)',
                  background: isActive ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'all 0.15s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </>
      )}

      <TournamentSubBar status={tournamentStatus} />

      <main style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
