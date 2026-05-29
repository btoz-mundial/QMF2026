import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'

const Leaderboard   = lazy(() => import('@/pages/Leaderboard'))
const PlayerProfile = lazy(() => import('@/pages/PlayerProfile'))
const Bracket       = lazy(() => import('@/pages/Bracket'))
const Timeline      = lazy(() => import('@/pages/Timeline'))
const Analytics     = lazy(() => import('@/pages/Analytics'))
const Groups        = lazy(() => import('@/pages/Groups'))
const HallOfFame    = lazy(() => import('@/pages/HallOfFame'))
const NotFound      = lazy(() => import('@/pages/NotFound'))

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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            <Route path="*"              element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
