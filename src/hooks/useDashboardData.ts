import { useCallback, useEffect, useState } from "react"
import {
  fetchAllRepairs,
  fetchStockValue,
  fetchLowStockItems,
  fetchLowStockCount,
  type RepairListItem,
} from "@/lib/queries"
import {
  filterRepairsToMonth,
  summarizeRepairs,
  type RepairSummary,
} from "@/lib/repair-metrics"

interface LowStockItem {
  id: number
  name: string
  qty_in_stock: number
}

interface DashboardData {
  metrics: RepairSummary
  stockValue: number
  recentRepairs: RepairListItem[]
  lowStock: LowStockItem[]
  lowStockTotal: number
  loading: boolean
  error: string | null
  refresh: () => void
}

const emptyMetrics: RepairSummary = {
  totalJobs: 0,
  repairJobs: 0,
  laborJobs: 0,
  totalFees: 0,
  repairRevenue: 0,
  laborRevenue: 0,
  netProfit: 0,
  averageFee: 0,
}

export function useDashboardData(): DashboardData {
  const [metrics, setMetrics] = useState<RepairSummary>(emptyMetrics)
  const [stockValue, setStockValue] = useState(0)
  const [recentRepairs, setRecentRepairs] = useState<RepairListItem[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [lowStockTotal, setLowStockTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [repairs, stock, low, lowCount] = await Promise.all([
        fetchAllRepairs(),
        fetchStockValue(),
        fetchLowStockItems(2, 5),
        fetchLowStockCount(2),
      ])

      setMetrics(summarizeRepairs(filterRepairsToMonth(repairs)))
      setStockValue(stock)
      setRecentRepairs(repairs.slice(0, 5))
      setLowStock(low as LowStockItem[])
      setLowStockTotal(lowCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return {
    metrics,
    stockValue,
    recentRepairs,
    lowStock,
    lowStockTotal,
    loading,
    error,
    refresh: load,
  }
}
