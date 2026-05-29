import { lazy } from 'react'

const Leaderboard   = lazy(() => import('@/pages/Leaderboard'))
const PlayerProfile = lazy(() => import('@/pages/PlayerProfile'))
const Bracket       = lazy(() => import('@/pages/Bracket'))
const Analytics     = lazy(() => import('@/pages/Analytics'))
const NotFound      = lazy(() => import('@/pages/NotFound'))

export const routes = [
  { path: '/',                element: <Leaderboard /> },
  { path: '/leaderboard',     element: <Leaderboard /> },
  { path: '/player/:userId',  element: <PlayerProfile /> },
  { path: '/bracket',         element: <Bracket /> },
  { path: '/analytics',       element: <Analytics /> },
  { path: '*',                element: <NotFound /> },
]
