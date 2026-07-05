import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  Package,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPKR } from "@/lib/utils"
import { formatMonthLabel } from "@/lib/repair-metrics"
import { useDashboardData } from "@/hooks/useDashboardData"
import { CATEGORY_OPTIONS, type InventoryRow } from "@/types/database.types"
import type { RepairListItem } from "@/lib/queries"

const monthLabel = formatMonthLabel()
const monthFormatter = new Intl.DateTimeFormat("en-PK", { month: "short" })

function buildMonthlyFees(repairs: RepairListItem[]) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthFormatter.format(date),
      revenue: 0,
      jobs: 0,
    }
  })

  for (const repair of repairs) {
    const date = new Date(repair.created_at)
    const month = months.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`)
    if (!month) continue
    month.revenue += repair.fee
    month.jobs += 1
  }

  return months
}

function MonthlyFeesChart({ repairs }: { repairs: RepairListItem[] }) {
  const months = buildMonthlyFees(repairs)
  const maxRevenue = Math.max(...months.map((month) => month.revenue), 1)
  const current = months[months.length - 1]
  const previous = months[months.length - 2]
  const change = previous.revenue === 0 ? null : ((current.revenue - previous.revenue) / previous.revenue) * 100

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Monthly Fees</CardTitle>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <p className="text-3xl font-bold tabular-nums">{formatPKR(current.revenue)}</p>
          <p className="pb-1 text-xs text-muted-foreground">
            {change === null ? "No previous month to compare" : `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs previous month`}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-56 items-end gap-3">
          {months.map((month) => (
            <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-lg bg-muted/40 p-1">
                <div
                  className="w-full rounded-md bg-primary shadow-[0_8px_22px_-12px_hsl(var(--primary))]"
                  style={{ height: `${Math.max((month.revenue / maxRevenue) * 100, month.revenue ? 12 : 0)}%` }}
                />
              </div>
              <div className="w-full text-center">
                <p className="truncate text-[11px] font-medium tabular-nums">{formatPKR(month.revenue)}</p>
                <p className="text-[11px] text-muted-foreground">{month.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function buildStockValueByCategory(inventory: InventoryRow[]) {
  return CATEGORY_OPTIONS.map((category) => ({
    label: category.label,
    value: inventory
      .filter((item) => item.category === category.value)
      .reduce((sum, item) => sum + Number(item.qty_in_stock) * Number(item.price_per_unit), 0),
  }))
}

function StockValueChart({ stockValue, inventory }: { stockValue: number; inventory: InventoryRow[] }) {
  const categories = buildStockValueByCategory(inventory)
  const maxValue = Math.max(...categories.map((category) => category.value), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stock Value</CardTitle>
        <p className="text-3xl font-bold tabular-nums">{formatPKR(stockValue)}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category) => (
          <div key={category.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium">{category.label}</span>
              <span className="text-muted-foreground tabular-nums">{formatPKR(category.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-sky-500"
                style={{ width: `${Math.max((category.value / maxValue) * 100, category.value ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-x-3 gap-y-2 pt-1">
          {categories.map((category) => (
            <div key={category.label} className="min-w-0">
              <p className="truncate text-[11px] font-medium">{category.label}</p>
              <p className="truncate text-[11px] text-muted-foreground tabular-nums">{formatPKR(category.value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function JobMixChart({
  repairJobs,
  laborJobs,
  repairRevenue,
  laborRevenue,
}: {
  repairJobs: number
  laborJobs: number
  repairRevenue: number
  laborRevenue: number
}) {
  const totalJobs = Math.max(repairJobs + laborJobs, 1)
  const repairPct = (repairJobs / totalJobs) * 100
  const laborPct = 100 - repairPct

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Job Mix</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative mx-auto grid size-40 place-items-center">
          <svg viewBox="0 0 120 120" className="size-40 -rotate-90" role="img" aria-label="Repair and labor job mix">
            <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" className="text-muted" strokeWidth="16" />
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeLinecap="round"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray={`${repairPct} ${laborPct}`}
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-2xl font-bold tabular-nums">{repairJobs + laborJobs}</p>
            <p className="text-xs text-muted-foreground">jobs</p>
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Repair</span>
              <span className="text-xs text-muted-foreground">{repairJobs} jobs</span>
              <span className="tabular-nums">{formatPKR(repairRevenue)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${repairPct}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Labor</span>
              <span className="text-xs text-muted-foreground">{laborJobs} jobs</span>
              <span className="tabular-nums">{formatPKR(laborRevenue)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-sky-500" style={{ width: `${laborPct}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { metrics, stockValue, inventory, repairs, lowStock, lowStockTotal, loading, error } =
    useDashboardData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">{monthLabel} at a glance</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start lg:gap-6">
          <MonthlyFeesChart repairs={repairs} />
          <div className="grid gap-4 lg:gap-6">
            <StockValueChart
              stockValue={stockValue}
              inventory={inventory}
            />
            <JobMixChart
              repairJobs={metrics.repairJobs}
              laborJobs={metrics.laborJobs}
              repairRevenue={metrics.repairRevenue}
              laborRevenue={metrics.laborRevenue}
            />
          </div>
        </div>
      )}

      {!loading && lowStock.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            </div>
            {lowStockTotal > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => navigate("/stock?filter=low")}
              >
                See all ({lowStockTotal})
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-yellow-100 bg-yellow-50/60 p-3 transition-colors hover:bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10"
              >
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <Badge
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400"
                >
                  {item.qty_in_stock} left
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
