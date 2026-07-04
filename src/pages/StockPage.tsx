import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import { stockColumns } from "@/pages/stock/columns"
import { AddPartDialog } from "@/components/stock/AddPartDialog"
import { cn } from "@/lib/utils"
import { useStockData } from "@/hooks/useStockData"
import { CATEGORY_OPTIONS, type Category } from "@/types/database.types"
import type { ColumnFiltersState } from "@tanstack/react-table"

const LOW_STOCK_THRESHOLD = 2

const categories: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...CATEGORY_OPTIONS,
]

export function StockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all")
  const { items, loading, error, refresh } = useStockData()

  const [lowFilter, setLowFilter] = useState(
    () => searchParams.get("filter") === "low",
  )

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (activeCategory !== "all") {
      filters.push({ id: "category", value: activeCategory })
    }
    if (lowFilter) {
      filters.push({ id: "qty_in_stock", value: LOW_STOCK_THRESHOLD })
    }
    return filters
  }, [activeCategory, lowFilter])

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
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5",
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
          columns={stockColumns}
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
