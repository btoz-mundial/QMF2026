const BASE = import.meta.env.BASE_URL

export const DATA_URLS = {
  // --- Scoring (oficial) ---
  leaderboard:              `${BASE}data/scores/leaderboard.json`,
  scoreDetails:             `${BASE}data/scores/score_details.json`,
  temporalGroupStandings:   `${BASE}data/scores/temporal_group_standings.json`,

  // --- Teams ---
  teams:            `${BASE}data/teams/teams.json`,

  // --- Users (predicciones) ---
  userIndex:        `${BASE}data/users/index.json`,
  userProfile:      (profileFile) => `${BASE}data/users/${profileFile}`,

  // --- Results (canonical sports truth) ---
  groupResults:     `${BASE}data/results/group_results.json`,
  knockoutResults:  `${BASE}data/results/knockout_results.json`,
  standingsResults: `${BASE}data/results/standings_results.json`,

  // --- Metadata ---
  matchesMetadata:    `${BASE}data/metadata/matches_metadata.json`,
  standingsMetadata:  `${BASE}data/metadata/standings_metadata.json`,
  bracketGraph:       `${BASE}data/metadata/bracket_graph.json`,
  r32RenderOrder:     `${BASE}data/metadata/r32_render_order.json`,

  // --- Analytics -- contratos ---
  metricRegistry:        `${BASE}data/analytics/metric_registry_v2.json`,
  analyticsPresentation: `${BASE}data/analytics/analytics_presentation_v2.json`,

  // --- Analytics -- consolidado ---
  userMetrics:      `${BASE}data/analytics/user_metrics.json`,

  // --- Analytics -- timeline ---
  timelineRace:        `${BASE}data/analytics/timeline/timeline_race.json`,
  consistenciaRanking: `${BASE}data/analytics/timeline/consistencia_ranking.json`,
  // TODO(historialRanking): generar desde timeline_race en pipeline o pivotar en frontend
  historialRanking:    `${BASE}data/analytics/timeline/historial_ranking.json`,

  // --- Analytics -- core ---
  precisionGeneral:           `${BASE}data/analytics/core/precision_general.json`,
  precisionAvance:            `${BASE}data/analytics/core/precision_avance.json`,
  precisionTabla:             `${BASE}data/analytics/core/precision_tabla.json`,
  precisionMarcadoresExactos: `${BASE}data/analytics/core/precision_marcadores_exactos.json`,
  eficienciaDePuntos:         `${BASE}data/analytics/core/eficiencia_de_puntos.json`,

  // --- Analytics -- engagement ---
  consensoPartidos: `${BASE}data/analytics/engagement/consenso_partidos.json`,

  // --- Analytics -- intelligence ---
  campeonVivo:      `${BASE}data/analytics/intelligence/campeon_vivo.json`,

  // --- Runtime Profiles ---
  archetypes:        `${BASE}data/analytics/runtime_profiles/archetypes.json`,
  traits:            `${BASE}data/analytics/runtime_profiles/traits.json`,
  archetypeRegistry: `${BASE}data/analytics/archetype_registry_v1.json`,

  // --- Payouts ---
  payouts:          `${BASE}data/payout/payouts.json`,
}
