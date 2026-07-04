import { useCallback, useEffect, useState } from 'react'
import { fetchAllInventory } from '@/lib/queries'
import type { InventoryRow } from '@/types/database.types'

interface StockData {
  items: InventoryRow[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useStockData(): StockData {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllInventory()
      setItems(data as InventoryRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { items, loading, error, refresh: load }
}
