import { useState, useEffect } from 'react'
import { loadTimelineRace, loadHistorialRanking } from '@/data/loaders'

export function useTimeline() {
  const [race, setRace]           = useState(null)
  const [ranking, setRanking]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    Promise.all([
      loadTimelineRace(),
      loadHistorialRanking(),
    ])
      .then(([raceData, rankingData]) => {
        setRace(raceData)
        setRanking(rankingData)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { race, ranking, loading, error }
}
