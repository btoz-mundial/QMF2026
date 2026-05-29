/**
 * fetchJSON — loader base para todos los archivos JSON estáticos.
 * Retorna null si el archivo está vacío (engagement PENDING).
 * Lanza error si el fetch falla (404, red, etc).
 */
export async function fetchJSON(url) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} — status ${res.status}`)
  }

  const text = await res.text()

  if (!text || text.trim() === '') {
    return null
  }

  return JSON.parse(text)
}
