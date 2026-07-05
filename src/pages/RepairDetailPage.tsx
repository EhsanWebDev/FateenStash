import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BadgeDollarSign, Loader2, Package, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { AttachItemDialog, type PendingItem } from "@/components/repairs/AttachItemDialog"
import {
  createRepair,
  deleteRepair,
  detachItemFromRepair,
  fetchRepairWithItems,
  updateRepair,
  type RepairItemWithInventory,
} from "@/lib/queries"
import { cn, formatPKR, jobTitle } from "@/lib/utils"
import type { JobType, RepairRow } from "@/types/database.types"

interface RepairForm {
  job_type: JobType
  gross_profit: string
}

const EMPTY_FORM: RepairForm = {
  job_type: "repair",
  gross_profit: "0",
}

function formatDate(iso?: string | null) {
  if (!iso) return "-"
  return new Intl.DateTimeFormat("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function RepairDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = id === "new"
  const repairId = isNew ? null : Number(id)

  const [form, setForm] = useState<RepairForm>(EMPTY_FORM)
  const [repair, setRepair] = useState<RepairRow | null>(null)
  const [items, setItems] = useState<RepairItemWithInventory[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [attachOpen, setAttachOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loadRepair = useCallback(async () => {
    if (repairId === null) return
    setLoading(true)
    setError(null)
    try {
      const nextRepair = await fetchRepairWithItems(repairId)
      setRepair(nextRepair.repair)
      setItems(nextRepair.items)
      setPendingItems([])
      setForm({
        job_type: nextRepair.repair.job_type,
        gross_profit: String(nextRepair.repair.gross_profit),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repair")
    } finally {
      setLoading(false)
    }
  }, [repairId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRepair()
  }, [loadRepair])

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function setJobType(jobType: JobType) {
    if (jobType === "labor" && (items.length > 0 || pendingItems.length > 0)) {
      setError("Labor jobs cannot have attached items. Remove them first.")
      return
    }

    setForm((prev) => ({ ...prev, job_type: jobType }))
    setFieldErrors({})
    setError(null)
  }

  const allDisplayItems: Array<
    | {
        kind: "saved"
        id: number
        inventoryId: number
        name: string | null
        qty: number
        unitCost: number
      }
    | {
        kind: "pending"
        index: number
        inventoryId: number
        name: string
        qty: number
        unitCost: number
      }
  > = [
    ...items.map((item) => ({
      kind: "saved" as const,
      id: item.id,
      inventoryId: item.inventory_id,
      name: item.inventory_name,
      qty: item.qty,
      unitCost: item.unit_cost,
    })),
    ...pendingItems.map((item, index) => ({
      kind: "pending" as const,
      index,
      inventoryId: item.inventoryId,
      name: item.inventoryName,
      qty: item.qty,
      unitCost: item.unitCost,
    })),
  ]

  const itemPrice = allDisplayItems.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.unitCost),
    0,
  )
  const grossProfit = Number(form.gross_profit) || 0
  const profit = grossProfit - itemPrice
  const stats = [
    { label: "Price Charged", value: grossProfit, icon: ReceiptText },
    { label: "Items Cost", value: itemPrice, icon: Package },
    { label: "Earning", value: profit, icon: BadgeDollarSign },
  ] as const
  const itemDetails = allDisplayItems.length
    ? allDisplayItems.map((item) => item.qty > 1 ? `${item.name ?? "Unknown"} x${item.qty}` : item.name ?? "Unknown").join(", ")
    : repair?.item_details ?? null
  const hasChanges =
    isNew ||
    !repair ||
    form.job_type !== repair.job_type ||
    grossProfit !== Number(repair.gross_profit) ||
    itemPrice !== Number(repair.item_price)

  async function handleSave() {
    const nextGrossProfit = Number(form.gross_profit)

    if (!isNew && !hasChanges) return

    if (form.job_type === "repair" && allDisplayItems.length === 0) {
      toast.error("Attach an item before creating a repair job.")
      return
    }

    if (!Number.isInteger(nextGrossProfit) || nextGrossProfit <= 0) {
      setFieldErrors({ gross_profit: "Price must be a whole number greater than 0" })
      return
    }

    if (form.job_type === "labor" && (items.length > 0 || pendingItems.length > 0)) {
      setError("Labor jobs cannot have attached items.")
      return
    }
    try {
      setSaving(true)
      setError(null)
      setFieldErrors({})

      const payload = {
        job_type: form.job_type,
        fee: nextGrossProfit,
        gross_profit: nextGrossProfit,
        item_price: form.job_type === "labor" ? 0 : itemPrice,
        item_details: form.job_type === "labor" ? null : itemDetails,
      }
      const pendingItem = form.job_type === "repair" ? pendingItems[0] : undefined

      if (isNew) {
        await createRepair(pendingItem
          ? {
              ...payload,
              inventory_item_id: pendingItem.inventoryId,
              inventory_item_qty: pendingItem.qty,
              inventory_item_name: pendingItem.inventoryName,
              inventory_item_price: pendingItem.unitCost,
            }
          : payload)
        navigate("/repairs", { replace: true })
      } else {
        await updateRepair(repairId!, payload)
        await loadRepair()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save repair")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (repairId === null) return
    try {
      setDeleting(true)
      setError(null)
      await deleteRepair(repairId)
      navigate("/repairs")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete repair")
      setDeleting(false)
    }
  }

  async function handleDetach(repairItemId: number) {
    try {
      setError(null)
      await detachItemFromRepair(repairItemId)
      await loadRepair()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detach item")
    }
  }

  function handleRemovePending(index: number) {
    setPendingItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const isBusy = saving || deleting
  const details = [
    ["Created At", formatDate(repair?.created_at)],
    ["Updated At", formatDate(repair?.updated_at)],
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/repairs")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold sm:text-2xl">
            {isNew ? "New Repair Job" : jobTitle(form.job_type)}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isNew ? "Create a repair record." : "Update the repair job details."}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-4 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <form
            className="space-y-4 rounded-[1.75rem] border border-border/70 bg-card/95 p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault()
              handleSave()
            }}
          >
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              {([
                ["repair", "Repair Job"],
                ["labor", "Labor Job"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setJobType(value)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    form.job_type === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {form.job_type === "labor" && (
              <div className="flex flex-col gap-3">
                <label htmlFor="repair-gross-profit" className="text-sm font-medium">
                  Price Charged
                </label>
                <Input
                  id="repair-gross-profit"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={form.gross_profit}
                  disabled={isBusy}
                  className={cn(fieldErrors.gross_profit && "border-red-500 focus-visible:ring-red-500")}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, gross_profit: event.target.value }))
                    clearFieldError("gross_profit")
                  }}
                />
                {fieldErrors.gross_profit && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.gross_profit}</p>
                )}
              </div>
            )}

            {form.job_type === "repair" && (
              <>
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">Attached Items</h3>
                      {isNew && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Items will be attached when you create the job.
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={allDisplayItems.length > 0}
                      onClick={() => {
                        setEditingItem(null)
                        setAttachOpen(true)
                      }}
                    >
                      <Plus className="size-4" />
                      Add Item
                    </Button>
                  </div>

                  {allDisplayItems.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No items attached to this job yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allDisplayItems.map((item) => (
                        <div
                          key={item.kind === "saved" ? `saved-${item.id}` : `pending-${item.index}`}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Package className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-medium">{item.name ?? "Unknown item"}</span>
                              <span className="text-xs text-muted-foreground">
                                Qty: {item.qty} - Cost: {formatPKR(item.unitCost)} / unit
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatPKR(item.qty * item.unitCost)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => {
                                setEditingItem({
                                  inventoryId: item.inventoryId,
                                  inventoryName: item.name ?? "Unknown item",
                                  qty: item.qty,
                                  unitCost: item.unitCost,
                                  customerPrice: grossProfit,
                                })
                                setAttachOpen(true)
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() =>
                                item.kind === "saved"
                                  ? handleDetach(item.id)
                                  : handleRemovePending(item.index)
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                          <p className="mt-1 truncate text-base font-semibold tabular-nums">{formatPKR(stat.value)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {!isNew && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <h3 className="text-base font-semibold">Job Details</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {details.map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              {!isNew && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={isBusy}
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
                      <AlertDialogTitle>Delete this repair?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the repair job and restores attached stock quantities.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deleting}
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                        {deleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button type="submit" className="w-full sm:w-auto" disabled={isBusy || (!isNew && !hasChanges)}>
                {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                {isNew ? "Create Job" : "Update"}
              </Button>
            </div>
          </form>

          {form.job_type === "repair" && (
            <AttachItemDialog
              repairId={repairId}
              open={attachOpen}
              onOpenChange={(open) => {
                setAttachOpen(open)
                if (!open) setEditingItem(null)
              }}
              initialItem={editingItem}
              defaultPrice={form.gross_profit}
              onSuccess={repairId === null ? () => undefined : loadRepair}
              onAttachLocal={isNew
                ? (item) => {
                    setForm((prev) => ({ ...prev, gross_profit: String(item.customerPrice) }))
                    clearFieldError("gross_profit")
                    setPendingItems([item])
                  }
                : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}
