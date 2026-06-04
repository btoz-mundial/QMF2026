export const BASE_TITLE = 'Quinela Mundial 2026'

// Mapa ruta → sección. Agregar nuevas páginas aquí.
export const ROUTE_TITLES = {
  '/leaderboard': 'Tabla General',
  '/groups':      'Fase de Grupos',
  '/bracket':     'Bracket',
  '/analytics':   'Estadísticas',
  '/timeline':    'Timeline',
  '/halloffame':  'Hall of Fame',
}

/**
 * setPageTitle('Bracket')  →  document.title = 'Bracket · Quinela Mundial 2026'
 * setPageTitle()           →  document.title = 'Quinela Mundial 2026'
 */
export function setPageTitle(section) {
  document.title = section ? `${section} · ${BASE_TITLE}` : BASE_TITLE
}
