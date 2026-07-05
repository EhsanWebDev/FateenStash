import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AlertTriangle, Search, WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import { stockColumns } from "@/pages/stock/columns"
import { AddPartDialog } from "@/components/stock/AddPartDialog"
import { cn, formatPKR } from "@/lib/utils"
import { useStockData } from "@/hooks/useStockData"
import { CATEGORY_OPTIONS, type Category, type InventoryRow } from "@/types/database.types"
import type { ColumnFiltersState } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"

const categories: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...CATEGORY_OPTIONS,
]

function getLowStockThreshold() {
  const threshold = Number(localStorage.getItem("lowStockThreshold") ?? "2")
  return Number.isFinite(threshold) && threshold >= 0 ? threshold : 2
}

interface StockMetricTileProps {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  onClick?: () => void
  active?: boolean
  actionLabel?: string
  onAction?: () => void
}

function StockMetricTile({
  label,
  value,
  hint,
  icon: Icon,
  onClick,
  active,
  actionLabel,
  onAction,
}: Readonly<StockMetricTileProps>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/15 bg-card/55 p-4 text-left shadow-[0_10px_24px_-22px_hsl(var(--primary)/0.35)] ring-1 ring-foreground/5 backdrop-blur-xl transition-colors",
        active && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground sm:text-xs">
        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-3.5" />
        </span>
        <span>{label}</span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground sm:text-xs">{hint}</p>
        <span className="flex gap-1.5">
          {onClick ? (
            <Button type="button" size="sm" variant="ghost" onClick={onClick}>
              {active ? "Show all" : "Filter"}
            </Button>
          ) : null}
          {onAction ? (
            <Button type="button" size="sm" variant="outline" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </span>
      </div>
    </div>
  )
}

function summarizeStock(items: InventoryRow[], lowStockThreshold: number) {
  let totalUnits = 0
  let totalValue = 0
  const lowStockItems: InventoryRow[] = []

  for (const item of items) {
    totalUnits += item.qty_in_stock
    totalValue += item.qty_in_stock * Number(item.price_per_unit)
    if (item.qty_in_stock <= lowStockThreshold) lowStockItems.push(item)
  }

  lowStockItems.sort((a, b) => a.qty_in_stock - b.qty_in_stock)

  return {
    totalUnits,
    totalValue,
    lowStockCount: lowStockItems.length,
  }
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-primary/15 bg-card/55 p-4 shadow-[0_10px_24px_-22px_hsl(var(--primary)/0.35)] ring-1 ring-foreground/5 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mt-3 h-8 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
      ))}
    </div>
  )
}

export function StockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all")
  const { items, loading, error, refresh } = useStockData()
  const [lowStockThreshold] = useState(getLowStockThreshold)

  const [lowFilter, setLowFilter] = useState(
    () => searchParams.get("filter") === "low",
  )
  const columns = useMemo(() => stockColumns(lowStockThreshold), [lowStockThreshold])
  const stockSummary = useMemo(
    () => summarizeStock(items, lowStockThreshold),
    [items, lowStockThreshold],
  )

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (activeCategory !== "all") {
      filters.push({ id: "category", value: activeCategory })
    }
    if (lowFilter) {
      filters.push({ id: "qty_in_stock", value: lowStockThreshold })
    }
    return filters
  }, [activeCategory, lowFilter, lowStockThreshold])

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Stock</h2>
          {lowFilter && (
            <Badge
              variant="outline"
              className="text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-800 cursor-pointer"
              onClick={() => setLowFilter(false)}
            >
              Low stock ×
            </Badge>
          )}
        </div>
        <AddPartDialog onCreated={refresh} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <StockMetricTile
            label="Stock Value"
            value={formatPKR(stockSummary.totalValue)}
            hint={`${items.length} active items - ${stockSummary.totalUnits} units`}
            icon={WalletCards}
          />
          <StockMetricTile
            label="Low Stock"
            value={String(stockSummary.lowStockCount)}
            hint={`At or below ${lowStockThreshold} units`}
            icon={AlertTriangle}
            active={lowFilter}
            onClick={() => setLowFilter((current) => !current)}
            actionLabel="Zero stock"
            onAction={() => navigate("/stock/out-of-stock")}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          globalFilter={search}
          columnFilters={columnFilters}
          onRowClick={(item) => navigate(`/stock/${item.id}`)}
        />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {["Name", "Category", "Qty", "Price"].map((label) => (
                <th key={label} className="px-1.5 py-2 sm:px-3 sm:py-3 text-left">
                  <Skeleton className="h-4 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, idx) => idx + 1).map((rowNumber) => (
              <tr key={rowNumber} className="border-b last:border-b-0">
                <td className="px-1.5 py-2 sm:px-3 sm:py-3"><Skeleton className="h-4 w-24 sm:w-36" /></td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3"><Skeleton className="h-5 w-14 sm:w-16 rounded-full" /></td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3"><Skeleton className="mx-auto h-4 w-6" /></td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3"><Skeleton className="ml-auto h-4 w-16 sm:w-20" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t px-2 py-2 sm:px-4 sm:py-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-48" />
      </div>
    </div>
  )
}
