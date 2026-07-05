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
const pieColors = ["#f6c343", "#38bdf8", "#34d399", "#f97316", "#a78bfa", "#f43f5e"]

function buildSoldCategories(repairs: RepairListItem[], inventory: InventoryRow[]) {
  const categoryById = new Map(inventory.map((item) => [item.id, item.category]))
  const sold = new Map(CATEGORY_OPTIONS.map((category) => [category.value, 0]))

  for (const repair of repairs) {
    if (!repair.inventory_item_id) continue
    const category = categoryById.get(repair.inventory_item_id) ?? "other"
    sold.set(category, (sold.get(category) ?? 0) + Number(repair.inventory_item_qty ?? 1))
  }

  return CATEGORY_OPTIONS.map((category) => ({
    name: category.label,
    qty: sold.get(category.value) ?? 0,
  }))
}

function SoldCategoriesChart({ repairs, inventory }: { repairs: RepairListItem[]; inventory: InventoryRow[] }) {
  const categories = buildSoldCategories(repairs, inventory)
  const soldCategories = categories.filter((category) => category.qty > 0)
  const total = soldCategories.reduce((sum, category) => sum + category.qty, 0)
  let offset = 0
  const chart = total
    ? soldCategories.map((category, index) => {
        const start = offset
        offset += (category.qty / total) * 100
        return `${pieColors[index % pieColors.length]} ${start}% ${offset}%`
      }).join(", ")
    : "hsl(var(--muted)) 0 100%"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Inventory Types Sold</CardTitle>
        <p className="text-3xl font-bold tabular-nums">{total} items</p>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center">
        <div className="relative mx-auto grid size-56 place-items-center rounded-full" style={{ background: `conic-gradient(${chart})` }}>
          <div className="grid size-28 place-items-center rounded-full bg-card text-center shadow-inner">
            <div>
              <p className="text-2xl font-bold tabular-nums">{soldCategories.length}</p>
              <p className="text-xs text-muted-foreground">types</p>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="grid gap-2">
            {categories.map((category, index) => (
              <div key={category.name} className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto] items-center gap-2 text-sm">
                <span className="size-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                <span className="truncate">{category.name}</span>
                <span className="text-muted-foreground tabular-nums">{category.qty}</span>
              </div>
            ))}
          </div>
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
  const { metrics, stockValue, inventory, monthRepairs, lowStock, lowStockTotal, loading, error } =
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
          <div className="grid gap-4 lg:gap-6">
            <SoldCategoriesChart repairs={monthRepairs} inventory={inventory} />
            {lowStock.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-primary" />
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
                      className="flex items-center justify-between rounded-lg border bg-muted/25 p-3 transition-colors hover:bg-primary/5"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/10 text-primary"
                      >
                        {item.qty_in_stock} left
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
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
    </div>
  )
}
