import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInventoryItem } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { CATEGORY_OPTIONS, type Category } from "@/types/database.types"

interface AddPartDialogProps {
  onCreated: () => void
}

const EMPTY_FORM = {
  name: "",
  category: "other" as Category,
  qty_in_stock: "0",
  price_per_unit: "0",
}

export function AddPartDialog({ onCreated }: Readonly<AddPartDialogProps>) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function reset(nextOpen: boolean) {
    if (submitting) return
    setOpen(nextOpen)
    if (!nextOpen) {
      setForm(EMPTY_FORM)
      setError(null)
      setFieldErrors({})
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = form.name.trim()
    const qty = Number(form.qty_in_stock)
    const price = Number(form.price_per_unit)
    const errors: Record<string, string> = {}

    if (!name) errors.name = "Required"
    if (!Number.isInteger(qty) || qty < 0) errors.qty_in_stock = "Whole number"
    if (!Number.isInteger(price) || price < 0) errors.price_per_unit = "Whole number"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setFieldErrors({})
      await createInventoryItem({
        name,
        category: form.category,
        qty_in_stock: qty,
        price_per_unit: price,
      })
      onCreated()
      reset(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add part")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger render={<Button size="sm" aria-label="Add part" />}>
        <Plus className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Add Part</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="gap-1">
          <DialogTitle>Add Part</DialogTitle>
          <DialogDescription>
            Add a stock item with its opening quantity and unit price.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field id="part-name" label="Name" error={fieldErrors.name}>
            <Input
              id="part-name"
              value={form.name}
              disabled={submitting}
              autoComplete="off"
              className={cn(fieldErrors.name && "border-destructive")}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </Field>

          <Field id="part-category" label="Category">
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, category: value as Category }))
              }
              disabled={submitting}
            >
              <SelectTrigger id="part-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="part-qty" label="Quantity" error={fieldErrors.qty_in_stock}>
              <Input
                id="part-qty"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.qty_in_stock}
                disabled={submitting}
                className={cn(fieldErrors.qty_in_stock && "border-destructive")}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, qty_in_stock: event.target.value }))
                }
              />
            </Field>

            <Field id="part-price" label="Unit Price" error={fieldErrors.price_per_unit}>
              <Input
                id="part-price"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.price_per_unit}
                disabled={submitting}
                className={cn(
                  "tabular-nums",
                  fieldErrors.price_per_unit && "border-destructive",
                )}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, price_per_unit: event.target.value }))
                }
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => reset(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Adding..." : "Add Part"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: Readonly<{
  id: string
  label: string
  error?: string
  children: ReactNode
}>) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
