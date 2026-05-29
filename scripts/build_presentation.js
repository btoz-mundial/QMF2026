/**
 * build_presentation.js
 *
 * Parsea contracts/analytics/analytics_contracts_v2.md (governance humano)
 * y genera contracts/analytics/analytics_presentation_v2.json (estructurado).
 *
 * Source of truth: el .md.
 * Output: artifact derivado, determinístico, auditable.
 *
 * Esto permite que el frontend consuma display_name, short_description,
 * featured y unit sin contaminar metric_registry_v2.json (contrato técnico).
 *
 * NO editar el JSON a mano. Regenerar siempre vía pipeline.
 */

const fs   = require('fs')
const path = require('path')

// ───── Paths ─────────────────────────────────────────────────────────────────
const ROOT   = path.resolve(__dirname, '..')
const SOURCE = path.join(ROOT, 'contracts', 'analytics', 'analytics_contracts_v2.md')
const OUTPUT = path.join(ROOT, 'contracts', 'analytics', 'analytics_presentation_v2.json')

// ───── Constants ─────────────────────────────────────────────────────────────
const METRIC_HEADER_RE = /^# ([a-z][a-z0-9_]*)\s*$/gm
const VALID_UNITS      = ['percent', 'count', 'rank', 'boolean', 'timeline']

// ───── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extrae el body de una sección `## SectionName` dentro de un bloque de metric.
 * Devuelve la primera línea no vacía y distinta de "---" del body.
 * Si la sección no existe o está vacía, devuelve null.
 */
function extractSectionFirstLine(block, sectionName) {
  const headerRe = new RegExp(`^## ${sectionName}\\s*$`, 'm')
  const headerMatch = block.match(headerRe)
  if (!headerMatch) return null

  const sectionStart = headerMatch.index + headerMatch[0].length
  const rest = block.slice(sectionStart)

  // Próximo header `## ` marca el fin de esta sección
  const nextHeaderMatch = rest.match(/^## /m)
  const sectionEnd = nextHeaderMatch ? nextHeaderMatch.index : rest.length

  const body = rest.slice(0, sectionEnd)

  const lines = body
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l !== '---')

  return lines[0] || null
}

/**
 * Parsea valor booleano de "yes" / "no" (case-insensitive).
 * Cualquier otro valor lanza error.
 */
function parseFeatured(raw, metricId) {
  if (raw === null) {
    throw new Error(`Metric "${metricId}" no tiene sección "## Featured"`)
  }
  const normalized = raw.toLowerCase()
  if (normalized === 'yes') return true
  if (normalized === 'no')  return false
  throw new Error(`Metric "${metricId}" tiene Featured inválido: "${raw}" (esperado "yes" o "no")`)
}

/**
 * Valida que el unit esté en el conjunto permitido.
 */
function validateUnit(raw, metricId) {
  if (raw === null) {
    throw new Error(`Metric "${metricId}" no tiene sección "## Unit"`)
  }
  if (!VALID_UNITS.includes(raw)) {
    throw new Error(
      `Metric "${metricId}" tiene Unit inválido: "${raw}". ` +
      `Valores permitidos: ${VALID_UNITS.join(', ')}`
    )
  }
  return raw
}

// ───── Main ──────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Source no existe: ${SOURCE}`)
    process.exit(1)
  }

  const md = fs.readFileSync(SOURCE, 'utf8')

  // Encontrar todos los headers de métrica (snake_case)
  const matches = [...md.matchAll(METRIC_HEADER_RE)]

  if (matches.length === 0) {
    console.error('❌ No se encontró ninguna métrica en el .md')
    process.exit(1)
  }

  const result = {}
  const errors = []

  for (let i = 0; i < matches.length; i++) {
    const metricId = matches[i][1]
    const start    = matches[i].index
    const end      = i + 1 < matches.length ? matches[i + 1].index : md.length
    const block    = md.slice(start, end)

    try {
      const display_name      = extractSectionFirstLine(block, 'Gaming Name')
      const featuredRaw       = extractSectionFirstLine(block, 'Featured')
      const unitRaw           = extractSectionFirstLine(block, 'Unit')
      const short_description = extractSectionFirstLine(block, 'Qué mide')

      if (!display_name) {
        throw new Error(`Metric "${metricId}" no tiene Gaming Name`)
      }
      if (!short_description) {
        throw new Error(`Metric "${metricId}" no tiene "Qué mide"`)
      }

      const featured = parseFeatured(featuredRaw, metricId)
      const unit     = validateUnit(unitRaw, metricId)

      result[metricId] = {
        metric_id:         metricId,
        display_name,
        short_description,
        featured,
        unit,
      }
    } catch (err) {
      errors.push(err.message)
    }
  }

  if (errors.length > 0) {
    console.error('❌ Errores parseando analytics_contracts_v2.md:')
    errors.forEach(e => console.error('   - ' + e))
    process.exit(1)
  }

  // Determinismo: ordenar keys alfabéticamente
  const sortedKeys = Object.keys(result).sort()
  const sortedMetrics = {}
  for (const k of sortedKeys) sortedMetrics[k] = result[k]

  const output = {
    version:        'v2',
    registry_type:  'analytics_presentation',
    description:    'Presentation hints derivados de analytics_contracts_v2.md. NO editar a mano.',
    source:         'contracts/analytics/analytics_contracts_v2.md',
    generated_at:   new Date().toISOString(),
    metric_count:   sortedKeys.length,
    metrics:        sortedMetrics,
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n')
  console.log(`✅ Generado ${sortedKeys.length} metric presentations`)
  console.log(`   → ${path.relative(ROOT, OUTPUT)}`)
}

main()
