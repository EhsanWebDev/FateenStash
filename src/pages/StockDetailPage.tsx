import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  deleteInventoryItem,
  fetchInventoryById,
  updateInventoryItem,
} from "@/lib/queries"
import { CATEGORY_OPTIONS, type Category } from "@/types/database.types"

const categories = CATEGORY_OPTIONS

interface StockFormState {
  name: string
  category: Category
  qty_in_stock: string
  price_per_unit: string
}

export function StockDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const itemId = useMemo(() => Number(id), [id])

  const [form, setForm] = useState<StockFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(itemId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Invalid item id")
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadItem() {
      setLoading(true)
      setError(null)
      try {
        const item = await fetchInventoryById(itemId)
        if (!isMounted) return
        setForm({
          name: item.name,
          category: item.category,
          qty_in_stock: String(item.qty_in_stock),
          price_per_unit: String(item.price_per_unit),
        })
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load item")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadItem()

    return () => {
      isMounted = false
    }
  }, [itemId])

  async function handleUpdate() {
    if (!form) return

    const trimmedName = form.name.trim()
    const qty = Number(form.qty_in_stock)
    const price = Number(form.price_per_unit)

    if (!trimmedName) {
      setError("Name is required")
      return
    }

    if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
      setError("Quantity must be a whole number")
      return
    }

    if (!Number.isInteger(price) || price < 0) {
      setError("Price must be a whole number")
      return
    }

    try {
      setSaving(true)
      setError(null)
      await updateInventoryItem(itemId, {
        name: trimmedName,
        category: form.category,
        qty_in_stock: qty,
        price_per_unit: price,
      })
      navigate("/stock")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      setError(null)
      await deleteInventoryItem(itemId)
      navigate("/stock")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Go back to stock list"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-xs font-bold text-balance sm:text-2xl">
            {form?.name ?? "Item Details"}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Edit item details
          </p>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive sm:text-sm"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {loading || !form ? (
        <div className="rounded-lg border p-4 text-muted-foreground">
          Loading…
        </div>
      ) : (
        <form
          className="space-y-5 rounded-lg border p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            handleUpdate()
          }}
        >
          <FieldLabel htmlFor="item-name">Name</FieldLabel>
          <Input
            id="item-name"
            name="name"
            value={form.name}
            autoComplete="off"
            className="text-xs sm:text-sm"
            onChange={(event) =>
              setForm((prev) =>
                prev ? { ...prev, name: event.target.value } : prev,
              )
            }
          />

          <FieldLabel htmlFor="item-category">Category</FieldLabel>
          <Select
            value={form.category}
            onValueChange={(value) =>
              setForm((prev) =>
                prev ? { ...prev, category: value as Category } : prev,
              )
            }
          >
            <SelectTrigger id="item-category" name="category">
              <SelectValue placeholder="Select category…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FieldLabel htmlFor="item-qty">Quantity</FieldLabel>
          <Input
            id="item-qty"
            name="qty_in_stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={form.qty_in_stock}
            autoComplete="off"
            className="text-xs sm:text-sm"
            onChange={(event) =>
              setForm((prev) =>
                prev ? { ...prev, qty_in_stock: event.target.value } : prev,
              )
            }
          />

          <FieldLabel htmlFor="item-price">Price Per Unit</FieldLabel>
          <Input
            id="item-price"
            name="price_per_unit"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={form.price_per_unit}
            autoComplete="off"
            className="text-xs sm:text-sm tabular-nums"
            onChange={(event) =>
              setForm((prev) =>
                prev ? { ...prev, price_per_unit: event.target.value } : prev,
              )
            }
          />

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={saving || deleting}
                >
                  {deleting ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The item will be removed from
                    stock permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleting}
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : null}
                    {deleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={saving || deleting}
            >
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              {saving ? "Updating…" : "Update"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function FieldLabel({
  htmlFor,
  children,
}: Readonly<{
  htmlFor: string
  children: ReactNode
}>) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-foreground/90 sm:text-sm">
      {children}
    </label>
  )
}
