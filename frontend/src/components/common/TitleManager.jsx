import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BASE_TITLE, ROUTE_TITLES, setPageTitle } from '@/utils/pageTitle'

export default function TitleManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Ruta exacta primero; si no, buscar prefijo (ej. /player/:userId)
    const section = ROUTE_TITLES[pathname] ?? null
    setPageTitle(section)
  }, [pathname])

  return null
}
