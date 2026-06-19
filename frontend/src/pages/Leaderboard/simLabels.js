/**
 * Etiquetas de la simulación (helpers puros, sin componentes) para no romper la
 * regla react-refresh/only-export-components al compartirlas entre archivos.
 * L = gana local · E = empate · V = gana visitante.
 */

export function optionLabel(outcome, nextMatch) {
  if (!nextMatch) return ''
  if (outcome === 'L') return `Gana ${nextMatch.home_team}`
  if (outcome === 'V') return `Gana ${nextMatch.away_team}`
  return 'Empate'
}

// Texto del escenario para el banner de modo simulación.
export function scenarioLabel(outcome, nextMatch) {
  if (!nextMatch || !outcome) return ''
  const { home_team: h, away_team: a } = nextMatch
  if (outcome === 'L') return `${h} vence a ${a}`
  if (outcome === 'V') return `${a} vence a ${h}`
  return `${h} empata con ${a}`
}
