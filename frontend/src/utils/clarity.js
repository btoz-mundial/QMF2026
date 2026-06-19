/**
 * utils/clarity.js
 *
 * Helper defensivo para eventos personalizados de Microsoft Clarity.
 * El script de Clarity se inyecta a nivel del sitio (no en este repo), así que
 * `window.clarity` puede no existir todavía: en ese caso no hace nada (no rompe).
 *
 * API de Clarity:
 *   clarity('set', key, value)   → etiqueta la sesión (filtrable en el dashboard)
 *   clarity('event', name)       → evento personalizado
 */
export function trackClarityEvent(name, tags = {}) {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') return
  try {
    for (const [key, value] of Object.entries(tags)) {
      if (value != null) window.clarity('set', key, String(value))
    }
    window.clarity('event', name)
  } catch {
    /* nunca interrumpir la UI por analytics */
  }
}
