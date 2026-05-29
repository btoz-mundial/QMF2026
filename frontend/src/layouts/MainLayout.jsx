import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'

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
        {/* Logo */}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: 'var(--color-primary)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          flex: isMobile ? 1 : 'none',
        }}>
          QMF 26
        </span>

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

      <main style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
