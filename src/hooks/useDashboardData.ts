import { useCallback, useEffect, useState } from "react"
import {
  fetchAllRepairs,
  fetchAllInventory,
  fetchLowStockItems,
  fetchLowStockCount,
} from "@/lib/queries"
import {
  filterRepairsToMonth,
  summarizeRepairs,
  type RepairSummary,
} from "@/lib/repair-metrics"
import type { RepairListItem } from "@/lib/queries"
import type { InventoryRow } from "@/types/database.types"

interface LowStockItem {
  id: number
  name: string
  qty_in_stock: number
}

interface DashboardData {
  metrics: RepairSummary
  stockValue: number
  inventory: InventoryRow[]
  repairs: RepairListItem[]
  monthRepairs: RepairListItem[]
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
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [repairs, setRepairs] = useState<RepairListItem[]>([])
  const [monthRepairs, setMonthRepairs] = useState<RepairListItem[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [lowStockTotal, setLowStockTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [repairs, inventory, low, lowCount] = await Promise.all([
        fetchAllRepairs(),
        fetchAllInventory(),
        fetchLowStockItems(2, 5),
        fetchLowStockCount(2),
      ])

      const currentMonthRepairs = filterRepairsToMonth(repairs)
      setMetrics(summarizeRepairs(currentMonthRepairs))
      setRepairs(repairs)
      setMonthRepairs(currentMonthRepairs)
      setInventory(inventory as InventoryRow[])
      setStockValue(
        (inventory as InventoryRow[]).reduce(
          (sum, item) => sum + Number(item.qty_in_stock) * Number(item.price_per_unit),
          0,
        ),
      )
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
    inventory,
    repairs,
    monthRepairs,
    lowStock,
    lowStockTotal,
    loading,
    error,
    refresh: load,
  }
}
