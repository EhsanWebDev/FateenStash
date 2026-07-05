import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  deleteInventoryItem,
  fetchInventoryById,
  updateInventoryItem,
} from "@/lib/queries"
import { cn } from "@/lib/utils"
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
  const [savedForm, setSavedForm] = useState<StockFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasChanges =
    !!form &&
    !!savedForm &&
    (form.name !== savedForm.name ||
      form.category !== savedForm.category ||
      form.qty_in_stock !== savedForm.qty_in_stock ||
      form.price_per_unit !== savedForm.price_per_unit)

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
        const nextForm = {
          name: item.name,
          category: item.category,
          qty_in_stock: String(item.qty_in_stock),
          price_per_unit: String(item.price_per_unit),
        }
        setForm(nextForm)
        setSavedForm(nextForm)
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
    if (!form || !hasChanges) return

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
          Loading...
        </div>
      ) : (
        <form
          className="rounded-xl border bg-card/40 p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault()
            handleUpdate()
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="item-name" label="Name" className="sm:col-span-2">
              <Input
                id="item-name"
                name="name"
                placeholder="Part name"
                value={form.name}
                autoComplete="off"
                className="text-xs sm:text-sm"
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, name: event.target.value } : prev,
                  )
                }
              />
            </Field>

            <Field id="item-category" label="Category" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    disabled={saving || deleting}
                    aria-pressed={form.category === category.value}
                    onClick={() =>
                      setForm((prev) =>
                        prev ? { ...prev, category: category.value } : prev,
                      )
                    }
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      form.category === category.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field id="item-qty" label="Quantity">
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
            </Field>

            <Field id="item-price" label="Price Per Unit">
              <Input
                id="item-price"
                name="price_per_unit"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={form.price_per_unit}
                autoComplete="off"
                className="text-xs tabular-nums sm:text-sm"
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, price_per_unit: event.target.value } : prev,
                  )
                }
              />
            </Field>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
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
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={saving || deleting || !hasChanges}
            >
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              {saving ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function Field({
  id,
  label,
  children,
  className,
}: Readonly<{
  id: string
  label: string
  children: ReactNode
  className?: string
}>) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-foreground/85 sm:text-sm">
        {label}
      </label>
      {children}
    </div>
  )
}
