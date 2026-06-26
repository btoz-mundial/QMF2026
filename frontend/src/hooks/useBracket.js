import { useState, useEffect } from 'react'
import { fetchJSON } from '@/data/loaders/fetchJSON'
import { fetchOptional } from '@/data/loaders/fetchOptional'
import { DATA_URLS } from '@/config/urls'
import { loadTeamMap } from '@/utils/teams'

function buildChampionPath(champion, bracketGraph, resultsMap) {
  if (!champion) return new Set()
  const path = new Set()
  function trace(matchId) {
    const result = resultsMap[parseInt(matchId)]
    if (!result || result.advance_team !== champion) return
    path.add(parseInt(matchId))
    Object.entries(bracketGraph).forEach(([feederId, info]) => {
      if (info.feeds_into?.match_id === parseInt(matchId)) trace(feederId)
    })
  }
  const finalEntry = Object.entries(bracketGraph).find(([, info]) => info.stage === 'FINAL')
  if (finalEntry) trace(finalEntry[0])
  return path
}

/**
 * Build a map of slot → feeder match.
 * For every match that feeds_into {match_id, slot}, record which match fills that slot.
 * Lets empty downstream slots show "Gan. M##" instead of a bare TBD.
 * R32 slots fed from the group stage are not in feeds_into, so they remain unlabeled.
 */
function buildOriginMap(bracketGraph) {
  const origin = {}
  const add = (target, feederId, type) => {
    if (!target?.match_id || !target.slot) return
    if (!origin[target.match_id]) origin[target.match_id] = {}
    origin[target.match_id][target.slot] = { matchId: parseInt(feederId), type }
  }
  Object.entries(bracketGraph).forEach(([feederId, info]) => {
    add(info.feeds_into, feederId, 'winner')
    add(info.loser_feeds_into, feederId, 'loser')
  })
  return origin
}

/**
 * Build the full visual layout from r32_render_order.
 * Returns: { left: { col1:[], col2:[], col3:[], col4:[] }, right: { col1:[], col2:[], col3:[], col4:[] }, center: { final, third } }
 * Each array is ordered top-to-bottom with { matchId, centerY }.
 */
function buildLayout(r32RenderOrder, bracketGraph) {
  const CARD_H = 70
  const GAP    = 10
  const SLOT   = CARD_H + GAP

  const r32Left  = r32RenderOrder?.left  ?? []
  const r32Right = r32RenderOrder?.right ?? []

  // Compute centerY for every match
  const pos = {}

  // R32 left
  r32Left.forEach((id, i)  => { pos[id] = i * SLOT + CARD_H / 2 })
  // R32 right
  r32Right.forEach((id, i) => { pos[id] = i * SLOT + CARD_H / 2 })

  // Determine which side each match belongs to by tracing from R32
  const sideMap = {}
  r32Left.forEach(id  => { sideMap[id] = 'left'  })
  r32Right.forEach(id => { sideMap[id] = 'right' })

  // Propagate sides and positions through feeds_into
  for (let pass = 0; pass < 8; pass++) {
    Object.entries(bracketGraph).forEach(([matchId, info]) => {
      const id = parseInt(matchId)
      if (pos[id] !== undefined) return
      if (info.stage === 'FINAL' || info.stage === 'THIRD_PLACE') return

      const feeders = Object.entries(bracketGraph)
        .filter(([, fi]) => fi.feeds_into?.match_id === id)
        .map(([fid]) => parseInt(fid))
        .filter(fid => pos[fid] !== undefined)

      if (feeders.length === 2) {
        pos[id] = (pos[feeders[0]] + pos[feeders[1]]) / 2
        // Inherit side from feeders (they should be same side)
        sideMap[id] = sideMap[feeders[0]] ?? sideMap[feeders[1]] ?? 'left'
      }
    })
  }

  // Now group by side and round depth
  // Round depth: R32=0, R16=1, QF=2, SF=3
  const STAGE_DEPTH = { ROUND_OF_32:0, ROUND_OF_16:1, QUARTER_FINAL:2, SEMI_FINAL:3 }

  const left  = { 0:[], 1:[], 2:[], 3:[] }
  const right = { 0:[], 1:[], 2:[], 3:[] }

  Object.entries(bracketGraph).forEach(([matchId, info]) => {
    const id    = parseInt(matchId)
    const depth = STAGE_DEPTH[info.stage]
    const side  = sideMap[id]
    if (depth === undefined || !side) return

    const entry = { matchId: id, centerY: pos[id] ?? 0 }
    if (side === 'left')  left[depth].push(entry)
    if (side === 'right') right[depth].push(entry)
  })

  // Sort each depth by centerY
  for (let d = 0; d < 4; d++) {
    left[d].sort((a, b) => a.centerY - b.centerY)
    right[d].sort((a, b) => a.centerY - b.centerY)
  }

  // Final and 3rd
  const finalId = parseInt(Object.entries(bracketGraph).find(([, i]) => i.stage === 'FINAL')?.[0] ?? '0')
  const thirdId = parseInt(Object.entries(bracketGraph).find(([, i]) => i.stage === 'THIRD_PLACE')?.[0] ?? '0')

  const totalHeight = 8 * SLOT

  return { left, right, finalId, thirdId, pos, totalHeight, CARD_H }
}

export function useBracket(userId = null) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    Promise.all([
      fetchJSON(DATA_URLS.knockoutResults),
      fetchJSON(DATA_URLS.bracketGraph),
      fetchOptional(DATA_URLS.matchesMetadata),
      fetchOptional(DATA_URLS.scoreDetails),
      fetchJSON(DATA_URLS.userIndex),
      loadTeamMap(DATA_URLS.teams),
      fetchJSON(DATA_URLS.r32RenderOrder),
      fetchOptional(DATA_URLS.leaderboard),
    ])
      .then(([knockoutResults, bracketGraph, matchesMeta, scoreDetails, userIndex, teamMap, r32RenderOrder, leaderboard]) => {
        const resultsMap = {}
        if (Array.isArray(knockoutResults)) knockoutResults.forEach(m => { resultsMap[m.match_id] = m })

        const metaMap = {}
        if (Array.isArray(matchesMeta)) matchesMeta.forEach(m => { metaMap[m.match_id] = m })

        let userPicksMap = {}
        if (userId && scoreDetails) {
          const userDetail = scoreDetails.find(u => u.user_id === userId)
          if (userDetail?.knockout) userDetail.knockout.forEach(m => { userPicksMap[m.match_id] = m })
        }

        const finalEntry = Object.entries(bracketGraph).find(([, i]) => i.stage === 'FINAL')
        const champion   = finalEntry ? resultsMap[parseInt(finalEntry[0])]?.advance_team ?? null : null
        const championPath = buildChampionPath(champion, bracketGraph, resultsMap)
        const layout = buildLayout(r32RenderOrder, bracketGraph)
        const originMap = buildOriginMap(bracketGraph)

        // Fusiona el ranking del leaderboard en userIndex (para mostrar "#N" junto al nombre)
        const rankMap = {}
        if (Array.isArray(leaderboard)) leaderboard.forEach(u => { rankMap[u.user_id] = u.rank })
        const userIndexRanked = (userIndex ?? []).map(u => ({ ...u, rank: rankMap[u.user_id] }))

        setData({
          bracketGraph, resultsMap, metaMap, userPicksMap,
          userIndex: userIndexRanked, teamMap, champion, championPath,
          layout, r32RenderOrder, originMap,
        })
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  return { data, loading, error }
}
