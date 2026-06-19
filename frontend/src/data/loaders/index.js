/**
 * data/loaders/index.js
 *
 * Thin loaders sobre DATA_URLS. Cada loader es un adaptador sin lógica.
 * Solo expone lo que el frontend usa activamente (auditable).
 */

import { fetchJSON } from './fetchJSON'
import { DATA_URLS } from '@/config/urls'

// ─── Scoring ─────────────────────────────────────────────────────────────────
export const loadLeaderboard      = () => fetchJSON(DATA_URLS.leaderboard)
export const loadScoreDetails     = () => fetchJSON(DATA_URLS.scoreDetails)

// ─── Teams ───────────────────────────────────────────────────────────────────
export const loadTeams            = () => fetchJSON(DATA_URLS.teams)

// ─── Users ───────────────────────────────────────────────────────────────────
export const loadUserIndex        = () => fetchJSON(DATA_URLS.userIndex)
// Cargar perfil individual a partir de profile_file de index.json
export const loadUserProfile      = (profileFile) =>
  fetchJSON(DATA_URLS.userProfile(profileFile))

// ─── Results ─────────────────────────────────────────────────────────────────
export const loadGroupResults     = () => fetchJSON(DATA_URLS.groupResults)
export const loadKnockoutResults  = () => fetchJSON(DATA_URLS.knockoutResults)
export const loadStandingsResults = () => fetchJSON(DATA_URLS.standingsResults)

// ─── Metadata ────────────────────────────────────────────────────────────────
export const loadMatchesMetadata    = () => fetchJSON(DATA_URLS.matchesMetadata)
export const loadStandingsMetadata  = () => fetchJSON(DATA_URLS.standingsMetadata)
export const loadBracketGraph       = () => fetchJSON(DATA_URLS.bracketGraph)
export const loadR32RenderOrder     = () => fetchJSON(DATA_URLS.r32RenderOrder)

// ─── Analytics — contratos ───────────────────────────────────────────────────
export const loadMetricRegistry        = () => fetchJSON(DATA_URLS.metricRegistry)
export const loadAnalyticsPresentation = () => fetchJSON(DATA_URLS.analyticsPresentation)

// ─── Analytics — consolidado ─────────────────────────────────────────────────
export const loadUserMetrics = () => fetchJSON(DATA_URLS.userMetrics)

// ─── Analytics — timeline ────────────────────────────────────────────────────
export const loadTimelineRace        = () => fetchJSON(DATA_URLS.timelineRace)
export const loadConsistenciaRanking = () => fetchJSON(DATA_URLS.consistenciaRanking)
// TODO: historial_ranking aún no se genera en pipeline; archivo huérfano
export const loadHistorialRanking    = () => fetchJSON(DATA_URLS.historialRanking)

// ─── Analytics — core ────────────────────────────────────────────────────────
export const loadPrecisionGeneral           = () => fetchJSON(DATA_URLS.precisionGeneral)
export const loadPrecisionAvance            = () => fetchJSON(DATA_URLS.precisionAvance)
export const loadPrecisionTabla             = () => fetchJSON(DATA_URLS.precisionTabla)
export const loadPrecisionMarcadoresExactos = () => fetchJSON(DATA_URLS.precisionMarcadoresExactos)
export const loadEficienciaDePuntos         = () => fetchJSON(DATA_URLS.eficienciaDePuntos)

// ─── Analytics — engagement ──────────────────────────────────────────────────
export const loadConsensoPartidos = () => fetchJSON(DATA_URLS.consensoPartidos)
export const loadConsensoVotantes = () => fetchJSON(DATA_URLS.consensoVotantes)

// ─── Analytics — intelligence ────────────────────────────────────────────────
export const loadCampeonVivo      = () => fetchJSON(DATA_URLS.campeonVivo)

// ─── Payouts ─────────────────────────────────────────────────────────────────
export const loadPayouts          = () => fetchJSON(DATA_URLS.payouts)
