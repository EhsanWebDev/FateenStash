import { useCallback, useEffect, useState } from 'react'
import { fetchAllRepairs, type RepairListItem } from '@/lib/queries'

export type { RepairListItem }

export function useRepairsData() {
  const [repairs, setRepairs] = useState<RepairListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllRepairs()
      setRepairs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repairs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { repairs, loading, error, refresh: load }
}
