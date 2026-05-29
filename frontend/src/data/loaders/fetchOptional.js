export function fetchOptional(url) {
  return fetch(url)
    .then(r => {
      if (!r.ok) return null
      return r.text().then(t => (t.trim() ? JSON.parse(t) : null))
    })
    .catch(() => null)
}
