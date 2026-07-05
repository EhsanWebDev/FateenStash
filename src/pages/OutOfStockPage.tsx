import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import { stockColumns } from "@/pages/stock/columns"
import { fetchOutOfStockItems } from "@/lib/queries"
import type { OutOfStockItemRow } from "@/types/database.types"

export function OutOfStockPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<OutOfStockItemRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const columns = useMemo(() => stockColumns(0), [])

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        const data = await fetchOutOfStockItems()
        if (isMounted) setItems(data)
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load zero stock items")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back to stock"
          onClick={() => navigate("/stock")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Zero Stock</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Items kept for 3 months
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search zero stock parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 shadow-sm"
        />
      </div>

      {loading ? <LoadingSkeleton /> : (
        <DataTable
          columns={columns}
          data={items}
          globalFilter={search}
          onRowClick={(item) => navigate(`/stock/${item.id}`)}
        />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
