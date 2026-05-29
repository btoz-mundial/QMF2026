let teamMap = null

export async function loadTeamMap(teamsUrl) {
  if (teamMap) return teamMap
  try {
    const res  = await fetch(teamsUrl)
    const data = await res.json()
    teamMap = {}
    data.forEach(t => { teamMap[t.name] = t })
  } catch {
    teamMap = {}
  }
  return teamMap
}

export function getTeam(name, map) {
  if (!name || !map) return null
  return map[name] ?? null
}

export function flagUrl(iso2) {
  if (!iso2) return null
  return `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`
}
