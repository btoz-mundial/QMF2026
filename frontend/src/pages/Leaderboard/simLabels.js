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

// Nombre legible de la ronda de eliminatorias.
const STAGE_LABELS = {
  R32: 'Dieciseisavos', OF: 'Octavos', QF: 'Cuartos',
  SF: 'Semifinal', '3P': 'Tercer lugar', Final: 'Final',
}
export function stageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage ?? 'Eliminatoria'
}

// Texto del escenario knockout para el banner: "Brasil 2 - 1 Noruega".
export function knockoutScenarioLabel(score, nextMatch) {
  if (!nextMatch || !score) return ''
  return `${nextMatch.home_team} ${score.home_goals} - ${score.away_goals} ${nextMatch.away_team}`
}

// Abreviatura de equipo para espacios compactos: "Canada"→"CAN", "P Bajos"→"PB".
export function teamAbbrev(name) {
  if (!name) return ''
  const parts = String(name).trim().split(/\s+/)
  if (parts.length > 1) return parts.map(p => p[0]).join('').slice(0, 3).toUpperCase()
  return name.slice(0, 3).toUpperCase()
}
