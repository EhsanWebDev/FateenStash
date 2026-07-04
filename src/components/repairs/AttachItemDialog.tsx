import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Package, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { attachItemToRepair, fetchAllInventory } from "@/lib/queries"
import { cn, formatPKR } from "@/lib/utils"
import { CATEGORY_OPTIONS, type Category, type InventoryRow } from "@/types/database.types"

export interface PendingItem {
  inventoryId: number
  inventoryName: string
  qty: number
  unitCost: number
  customerPrice: number
}

interface AttachItemDialogProps {
  repairId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  onAttachLocal?: (item: PendingItem) => void
  defaultPrice?: string
}

const categoryLabels = new Map(CATEGORY_OPTIONS.map((category) => [category.value, category.label] as const))
const categoryFilters: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "All" },
  ...CATEGORY_OPTIONS,
]

export function AttachItemDialog({
  repairId,
  open,
  onOpenChange,
  onSuccess,
  onAttachLocal,
  defaultPrice = "",
}: Readonly<AttachItemDialogProps>) {
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all")
  const [selected, setSelected] = useState<InventoryRow | null>(null)
  const [qty, setQty] = useState("1")
  const [price, setPrice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qtyError, setQtyError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)

  const loadInventory = useCallback(async () => {
    setLoadingInventory(true)
    setError(null)
    try {
      const data = await fetchAllInventory()
      setInventory(data as InventoryRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory")
    } finally {
      setLoadingInventory(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInventory()
  }, [open, loadInventory])

  const displayPrice = price ?? defaultPrice

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase()
    return inventory.filter((item) => {
      if (item.qty_in_stock <= 0) return false
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false
      return query.length === 0 || item.name.toLowerCase().includes(query)
    })
  }, [categoryFilter, inventory, search])

  function reset() {
    setSearch("")
    setCategoryFilter("all")
    setSelected(null)
    setQty("1")
    setPrice(null)
    setError(null)
    setQtyError(null)
    setPriceError(null)
  }

  function handleClose() {
    if (submitting) return
    reset()
    onOpenChange(false)
  }

  async function handleConfirm() {
    if (!selected) {
      setError("Select an item")
      return
    }

    const qtyNumber = Number(qty)
    if (!Number.isInteger(qtyNumber) || qtyNumber <= 0) {
      setQtyError("Quantity must be a whole number greater than 0")
      return
    }
    if (qtyNumber > selected.qty_in_stock) {
      setQtyError(`Only ${selected.qty_in_stock} in stock`)
      return
    }

    const customerPrice = Number(displayPrice)
    if (!Number.isInteger(customerPrice) || customerPrice <= 0) {
      setPriceError("Customer price must be a whole number greater than 0")
      return
    }

    if (onAttachLocal) {
      onAttachLocal({
        inventoryId: selected.id,
        inventoryName: selected.name,
        qty: qtyNumber,
        unitCost: Number(selected.price_per_unit),
        customerPrice,
      })
      await onSuccess()
      handleClose()
      return
    }

    if (repairId === null) return

    try {
      setSubmitting(true)
      setError(null)
      setQtyError(null)
      setPriceError(null)
      await attachItemToRepair({
        repairId,
        inventoryId: selected.id,
        qty: qtyNumber,
        customerPrice,
      })
      await onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach item")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach Item</DialogTitle>
          <DialogDescription>
            Pick an inventory item and quantity to attach to this repair job.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!selected && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search stock..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {categoryFilters.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setCategoryFilter(category.value)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    categoryFilter === category.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border p-1.5">
              {loadingInventory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredInventory.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No stock items available
                </p>
              ) : (
                filteredInventory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/60"
                    onClick={() => setSelected(item)}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Package className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.name}</span>
                        <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 py-0 text-[10px]">
                          {categoryLabels.get(item.category) ?? item.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="text-sm font-medium">{formatPKR(item.price_per_unit)}</p>
                      <p className="text-xs text-muted-foreground">{item.qty_in_stock} in stock</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{selected.name}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cost {formatPKR(selected.price_per_unit)} - {selected.qty_in_stock} in stock
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Change
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="attach-qty" className="text-sm font-medium">
                Quantity
              </label>
              <Input
                id="attach-qty"
                type="number"
                inputMode="numeric"
                min={1}
                max={selected.qty_in_stock}
                step={1}
                value={qty}
                disabled={submitting}
                className={cn(qtyError && "border-red-500 focus-visible:ring-red-500")}
                onChange={(event) => {
                  setQty(event.target.value)
                  setQtyError(null)
                }}
              />
              {qtyError && <p className="text-xs text-red-600 dark:text-red-400">{qtyError}</p>}
            </div>

            <div className="space-y-3">
              <label htmlFor="attach-price" className="text-sm font-medium">
                Price including repair fee
              </label>
              <Input
                id="attach-price"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={displayPrice}
                disabled={submitting}
                className={cn(priceError && "border-red-500 focus-visible:ring-red-500")}
                onChange={(event) => {
                  setPrice(event.target.value)
                  setPriceError(null)
                }}
              />
              {priceError && <p className="text-xs text-red-600 dark:text-red-400">{priceError}</p>}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Close
          </Button>
          {selected && (
            <Button type="button" onClick={handleConfirm} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Adding..." : "Add Item"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
