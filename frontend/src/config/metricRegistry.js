/**
 * metricRegistry.js
 *
 * Une dos contratos generados por el pipeline:
 *
 *   1. metric_registry_v2.json          ← contrato técnico (lifecycle_status,
 *                                          supports_ranking_tiers, value_range, etc.)
 *   2. analytics_presentation_v2.json   ← display_name, short_description,
 *                                          featured, unit (derivado del .md)
 *
 * El resultado es un dict keyed por metric_id, donde cada entry tiene:
 *   - Todos los campos técnicos del registry v2
 *   - + display_name, short_description, featured, unit (de presentation)
 *
 * Si un metric existe en uno pero no en el otro, se loguea warning.
 * NO se inventan defaults — la idea es detectar drift, no esconderlo.
 */

import registryV2     from '../../public/data/analytics/metric_registry_v2.json'
import presentationV2 from '../../public/data/analytics/analytics_presentation_v2.json'

const metricsArray    = registryV2.metrics ?? []
const presentationMap = presentationV2.metrics ?? {}

const merged   = {}
const warnings = []

for (const tech of metricsArray) {
  const pres = presentationMap[tech.metric_id]
  if (!pres) {
    warnings.push(`metricRegistry: "${tech.metric_id}" en registry pero no en presentation`)
    merged[tech.metric_id] = { ...tech }
    continue
  }
  merged[tech.metric_id] = {
    ...tech,
    display_name:      pres.display_name,
    short_description: pres.short_description,
    featured:          pres.featured,
    unit:              pres.unit,
  }
}

for (const presId of Object.keys(presentationMap)) {
  if (!metricsArray.find(m => m.metric_id === presId)) {
    warnings.push(`metricRegistry: "${presId}" en presentation pero no en registry`)
  }
}

if (warnings.length > 0 && typeof console !== 'undefined') {
  warnings.forEach(w => console.warn(w))
}

// ─── Public API ──────────────────────────────────────────────────────────────

// Dict keyed por metric_id (uso histórico: metricRegistry[metricId])
export const metricRegistry = merged

// Selectores helpers
export const getMetric       = (metricId) => merged[metricId] ?? null
export const allMetrics      = ()         => Object.values(merged)
export const activeMetrics   = ()         => allMetrics().filter(m => m.lifecycle_status === 'active')
export const featuredMetrics = ()         => allMetrics().filter(m => m.featured === true)

// Versiones de los contratos (para debugging / audit)
export const registryVersion     = registryV2.version ?? null
export const presentationVersion = presentationV2.version ?? null

export default merged
