import { useState, useEffect } from 'react'
import { loadLeaderboard } from '@/data/loaders'

export function useLeaderboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    loadLeaderboard()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
