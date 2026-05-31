import { useState, useEffect } from 'react'
import { fetchJSON } from '@/data/loaders/fetchJSON'
import { fetchOptional } from '@/data/loaders/fetchOptional'
import { DATA_URLS } from '@/config/urls'
import { loadTeamMap } from '@/utils/teams'

// Robust fetch: handles truncated / trailing-garbage JSON files
async function fetchRobust(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const text = await r.text()
    if (!text.trim()) return null
    try { return JSON.parse(text) } catch { /* fallthrough */ }
    const opener = text.trimStart()[0]
    const closer = opener === '{' ? '}' : ']'
    let depth = 0, inStr = false, esc = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (esc) { esc = false; continue }
      if (c === '\\' && inStr) { esc = true; continue }
      if (c === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (c === opener) depth++
      else if (c === closer && --depth === 0) {
        try { return JSON.parse(text.slice(0, i + 1)) } catch { break }
      }
    }
    return null
  } catch { return null }
}

export function usePlayerProfile(userId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    ;(async () => {
      try {
        // Step 1: load user index to resolve profile file path
        const userIndex   = await fetchJSON(DATA_URLS.userIndex).catch(() => null)
        const userEntry   = Array.isArray(userIndex) ? userIndex.find(u => u.user_id === userId) : null
        const profileFile = userEntry?.profile_file ?? null

        // Step 2: load everything else in parallel
        const [
          leaderboard, scoreDetails, userMetrics, matchesMeta,
          historialRanking, payouts, timelineRace, groupResults,
          teamMap, archetypesData, traitsData, registryData,
          campeonVivoData, userProfile,
        ] = await Promise.all([
          fetchJSON(DATA_URLS.leaderboard),
          fetchRobust(DATA_URLS.scoreDetails),
          fetchJSON(DATA_URLS.userMetrics),
          fetchRobust(DATA_URLS.matchesMetadata),   // dict OR array, possibly truncated
          fetchOptional(DATA_URLS.historialRanking),  // huérfano — pipeline no lo genera, no debe romper
          fetchOptional(DATA_URLS.payouts),
          fetchRobust(DATA_URLS.timelineRace),
          fetchJSON(DATA_URLS.groupResults),
          loadTeamMap(DATA_URLS.teams),
          fetchOptional(DATA_URLS.archetypes),
          fetchOptional(DATA_URLS.traits),
          fetchOptional(DATA_URLS.archetypeRegistry),
          fetchOptional(DATA_URLS.campeonVivo),
          profileFile ? fetchOptional(DATA_URLS.userProfile(profileFile)) : Promise.resolve(null),
        ])

        if (cancelled) return

        const leaderboardEntry = leaderboard.find(u => u.user_id === userId) ?? null
        const scoreDetail      = (scoreDetails ?? []).find(u => u.user_id === userId) ?? null
        const metricsEntry     = userMetrics?.users?.find(u => u.user_id === userId) ?? null
        const rankingHistory   = historialRanking?.users?.find(u => u.user_id === userId) ?? null
        const payoutEntry      = payouts?.positions?.find(u => u.user_id === userId) ?? null

        // Build matchMap — handles both array and dict (string-keyed) formats
        const matchMap = {}
        if (Array.isArray(matchesMeta)) {
          matchesMeta.forEach(m => { matchMap[m.match_id] = m })
        } else if (matchesMeta && typeof matchesMeta === 'object') {
          Object.values(matchesMeta).forEach(m => { matchMap[m.match_id] = m })
        }

        // Fallback: enrich matchMap from groupResults for any missing match_id
        if (Array.isArray(groupResults)) {
          groupResults.forEach(m => {
            if (!matchMap[m.match_id]) {
              matchMap[m.match_id] = {
                match_id:   m.match_id,
                home_team:  m.home_team,
                away_team:  m.away_team,
                group:      m.group ?? null,
                stage:      'group',
              }
            } else {
              // Patch missing team names from groupResults
              if (!matchMap[m.match_id].home_team) matchMap[m.match_id].home_team = m.home_team
              if (!matchMap[m.match_id].away_team) matchMap[m.match_id].away_team = m.away_team
            }
          })
        }

        const snapshots      = timelineRace?.snapshots ?? []
        const latestSnapshot = snapshots[snapshots.length - 1] ?? null
        const snapUser       = latestSnapshot?.users?.find(u => u.user_id === userId) ?? null

        // Runtime identity — only active_archetype drives UI
        const userArchetypeEntry = archetypesData?.users?.find(u => u.user_id === userId)
        const activeArchetypeId  = userArchetypeEntry?.active_archetype ?? null

        const registryMap = {}
        if (Array.isArray(registryData?.archetypes)) {
          registryData.archetypes.forEach(a => { registryMap[a.id] = a })
        }
        const archetype = activeArchetypeId ? (registryMap[activeArchetypeId] ?? null) : null

        const userTraitsEntry = Array.isArray(traitsData)
          ? traitsData.find(u => u.user_id === userId)
          : null
        const traits = userTraitsEntry?.traits ?? []

        setData({
          leaderboard:            leaderboardEntry,
          scoreDetail,
          metrics:                metricsEntry,
          rankingHistory,
          payoutEntry,
          matchMap,
          snapUser,
          groupResults,
          teamMap,
          totalParticipants:      leaderboard.length,
          archetype,
          traits,
          campeonVivo:            campeonVivoData ?? null,
          timelineRaceSnapshots:  snapshots,
          allLeaderboard:         leaderboard,
          userProfile:            userProfile ?? null,
        })
      } catch(e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [userId])

  return { data, loading, error }
}
