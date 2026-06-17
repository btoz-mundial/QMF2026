import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import TitleManager from '@/components/common/TitleManager'

// ── Auto-reload ante chunks obsoletos (clásico de Vite tras un redeploy) ────────
// Un usuario con la pestaña vieja pide un chunk con hash que ya no existe → 404.
// Recargamos UNA vez por versión (BUILD_ID) para traer el index.html nuevo.
const BUILD_ID   = import.meta.env.VITE_BUILD_ID || 'dev'
const RELOAD_KEY = 'qmf_chunk_reloaded_' + BUILD_ID

function reloadOnce() {
  if (sessionStorage.getItem(RELOAD_KEY)) return false   // ya recargamos en esta versión → no loop
  sessionStorage.setItem(RELOAD_KEY, '1')
  window.location.reload()
  return true
}

function lazyWithReload(factory) {
  return lazy(() =>
    factory().catch(err => {
      if (reloadOnce()) return new Promise(() => {})       // queda colgado mientras recarga
      throw err                                            // si ya recargó y sigue fallando, propaga
    })
  )
}

// Mecanismo oficial de Vite para fallos de preload de módulos.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); reloadOnce() })
}

const Leaderboard   = lazyWithReload(() => import('@/pages/Leaderboard'))
const PlayerProfile = lazyWithReload(() => import('@/pages/PlayerProfile'))
const Bracket       = lazyWithReload(() => import('@/pages/Bracket'))
const Timeline      = lazyWithReload(() => import('@/pages/Timeline'))
const Analytics     = lazyWithReload(() => import('@/pages/Analytics'))
const Groups        = lazyWithReload(() => import('@/pages/Groups'))
const HallOfFame    = lazyWithReload(() => import('@/pages/HallOfFame'))
const Admin         = lazyWithReload(() => import('@/pages/Admin'))
const NotFound      = lazyWithReload(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-bg)',
      color: 'var(--color-text-2)',
      fontFamily: 'var(--font-body)',
      fontSize: '14px',
      letterSpacing: '0.1em',
    }}>
      Cargando...
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <TitleManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/leaderboard" replace />} />
            <Route path="leaderboard"    element={<Leaderboard />} />
            <Route path="player/:userId" element={<PlayerProfile />} />
            <Route path="groups"         element={<Groups />} />
            <Route path="bracket"        element={<Bracket />} />
            <Route path="timeline"       element={<Timeline />} />
            <Route path="analytics"      element={<Analytics />} />
            <Route path="halloffame"     element={<HallOfFame />} />
            <Route path="admin-qm2026"   element={<Admin />} />
            <Route path="*"              element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
