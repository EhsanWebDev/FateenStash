import { supabase } from "./supabase"
import { TABLE } from "./table-names"
import type {
  InventoryInsert,
  OutOfStockItemRow,
  InventoryRow,
  InventoryUpdate,
  RepairInsert,
  RepairRow,
  RepairUpdate,
} from "@/types/database.types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => supabase.from(table as any)

function isMissingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205"
}

function isMissingColumn(error: { code?: string } | null) {
  return error?.code === "PGRST204"
}

function legacyRepairWrite(data: RepairInsert | RepairUpdate) {
  return {
    ...(data.job_type ? { job_type: data.job_type } : {}),
    fee: Number(data.gross_profit ?? data.fee ?? 0),
  }
}

function repairWrite(data: RepairInsert | RepairUpdate) {
  return {
    ...(data.job_type ? { job_type: data.job_type } : {}),
    ...(data.fee !== undefined || data.gross_profit !== undefined
      ? { fee: Number(data.gross_profit ?? data.fee ?? 0) }
      : {}),
    ...(data.inventory_item_id !== undefined ? { inventory_item_id: data.inventory_item_id } : {}),
    ...(data.inventory_item_qty !== undefined ? { inventory_item_qty: data.inventory_item_qty } : {}),
    ...(data.inventory_item_name !== undefined ? { inventory_item_name: data.inventory_item_name } : {}),
    ...(data.inventory_item_price !== undefined ? { inventory_item_price: data.inventory_item_price } : {}),
  }
}

export interface RepairListItem {
  id: number
  job_type: RepairRow["job_type"]
  fee: number
  inventory_item_id: number | null
  inventory_item_qty: number | null
  inventory_item_name: string | null
  inventory_item_price: number | null
  gross_profit: number
  item_price: number
  profit: number
  item_details: string | null
  created_at: string
  updated_at: string
}

export interface RepairItemWithInventory {
  id: number
  repair_id: number
  inventory_id: number
  qty: number
  unit_cost: number
  created_at: string
  inventory_name: string | null
}

export interface RepairWithItems {
  repair: RepairRow
  items: RepairItemWithInventory[]
}

function normalizeRepair(repair: Partial<RepairRow>): RepairListItem {
  const grossProfit = Number(repair.gross_profit ?? repair.fee ?? 0)
  const itemQty = Number(repair.inventory_item_qty ?? 0)
  const itemUnitPrice = Number(repair.inventory_item_price ?? 0)
  const itemPrice = Number(repair.item_price ?? itemQty * itemUnitPrice)
  const itemDetails = repair.inventory_item_name
    ? itemQty > 1 ? `${repair.inventory_item_name} x${itemQty}` : repair.inventory_item_name
    : repair.item_details?.replace(/\s+x1$/, "") ?? null

  return {
    id: Number(repair.id),
    job_type: repair.job_type ?? "repair",
    fee: grossProfit,
    gross_profit: grossProfit,
    inventory_item_id: repair.inventory_item_id ?? null,
    inventory_item_qty: repair.inventory_item_qty ?? null,
    inventory_item_name: repair.inventory_item_name ?? null,
    inventory_item_price: repair.inventory_item_price ?? null,
    item_price: itemPrice,
    profit: grossProfit - itemPrice,
    item_details: itemDetails,
    created_at: repair.created_at ?? "",
    updated_at: repair.updated_at ?? "",
  }
}

export async function fetchStockValue(): Promise<number> {
  const { data, error } = await from(TABLE.inventory).select("qty_in_stock, price_per_unit")

  if (error) throw error
  if (!data) return 0

  return (data as { qty_in_stock: number; price_per_unit: number }[]).reduce(
    (sum, row) => sum + Number(row.qty_in_stock) * Number(row.price_per_unit),
    0,
  )
}

export async function fetchTotalStockQty(): Promise<number> {
  const { data, error } = await from(TABLE.inventory).select("qty_in_stock")

  if (error) throw error
  if (!data) return 0

  return (data as { qty_in_stock: number }[]).reduce(
    (sum, row) => sum + Number(row.qty_in_stock),
    0,
  )
}

export async function fetchAllRepairs(): Promise<RepairListItem[]> {
  const { data, error } = await from(TABLE.repairs)
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }

  return (data ?? []).map((repair) => normalizeRepair(repair as Partial<RepairRow>))
}

export async function fetchRecentRepairs(limit = 5): Promise<RepairListItem[]> {
  const { data, error } = await from(TABLE.repairs)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }

  return (data ?? []).map((repair) => normalizeRepair(repair as Partial<RepairRow>))
}

export async function fetchLowStockItems(threshold = 2, limit = 5) {
  const { data, error } = await from(TABLE.inventory)
    .select("id, name, qty_in_stock")
    .lte("qty_in_stock", threshold)
    .gt("qty_in_stock", 0)
    .order("qty_in_stock", { ascending: true })
    .limit(limit)

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return data ?? []
}

export async function fetchLowStockCount(threshold = 2): Promise<number> {
  const { count, error } = await from(TABLE.inventory)
    .select("id", { count: "exact", head: true })
    .lte("qty_in_stock", threshold)
    .gt("qty_in_stock", 0)

  if (error) {
    if (isMissingTable(error)) return 0
    throw error
  }
  return count ?? 0
}

export async function fetchAllInventory() {
  const { data, error } = await from(TABLE.inventory)
    .select("*")
    .gt("qty_in_stock", 0)
    .order("name", { ascending: true })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return data ?? []
}

export async function fetchOutOfStockItems(): Promise<OutOfStockItemRow[]> {
  const { data, error } = await from(TABLE.out_of_stock_items)
    .select("id:inventory_id, name, category, qty_in_stock, price_per_unit, created_at:went_out_at, updated_at, went_out_at")
    .order("went_out_at", { ascending: false })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []) as unknown as OutOfStockItemRow[]
}

export async function fetchInventoryById(id: number): Promise<InventoryRow> {
  const { data, error } = await from(TABLE.inventory).select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createInventoryItem(data: InventoryInsert): Promise<number> {
  const { data: row, error } = await from(TABLE.inventory).insert(data as never).select("id").single()

  if (error) throw error
  if (!row) throw new Error("Failed to create inventory item")
  return (row as unknown as { id: number }).id
}

export async function updateInventoryItem(id: number, updates: InventoryUpdate): Promise<void> {
  const { error } = await from(TABLE.inventory).update(updates as never).eq("id", id)

  if (error) throw error
}

export async function deleteInventoryItem(id: number): Promise<void> {
  let { count, error: linkedError } = await from(TABLE.repairs)
    .select("id", { count: "exact", head: true })
    .eq("inventory_item_id", id)

  if (isMissingColumn(linkedError)) {
    const legacy = await from(TABLE.repair_items)
      .select("id", { count: "exact", head: true })
      .eq("inventory_id", id)
    count = legacy.count
    linkedError = legacy.error
  }

  if (linkedError && !isMissingTable(linkedError)) throw linkedError
  if ((count ?? 0) > 0) {
    throw new Error("This item is attached to a repair job and cannot be deleted.")
  }

  const { error } = await from(TABLE.inventory).delete().eq("id", id)

  if (error) throw error
}

export async function consumeInventoryItem(id: number): Promise<void> {
  const item = await fetchInventoryById(id)
  const nextQty = Math.max(0, item.qty_in_stock - 1)

  if (nextQty === item.qty_in_stock) return

  await updateInventoryItem(id, { qty_in_stock: nextQty })
}

export async function createRepair(data: RepairInsert): Promise<number> {
  const attachedItem = data.inventory_item_id ? await fetchInventoryById(data.inventory_item_id) : null
  const attachedQty = Number(data.inventory_item_qty ?? 1)

  if (attachedItem) {
    if (!Number.isInteger(attachedQty) || attachedQty <= 0) {
      throw new Error("Quantity must be a whole number greater than 0")
    }
    if (attachedQty > attachedItem.qty_in_stock) {
      throw new Error(`Only ${attachedItem.qty_in_stock} item(s) in stock`)
    }
  }

  let { data: row, error } = await from(TABLE.repairs)
    .insert(repairWrite(attachedItem
      ? {
          ...data,
          inventory_item_qty: attachedQty,
          inventory_item_name: data.inventory_item_name ?? attachedItem.name,
          inventory_item_price: data.inventory_item_price ?? Number(attachedItem.price_per_unit),
        }
      : data) as never)
    .select("id")
    .single()
  let attached = Boolean(attachedItem)

  if (isMissingColumn(error)) {
    const fallback = await from(TABLE.repairs).insert(legacyRepairWrite(data) as never).select("id").single()
    row = fallback.data
    error = fallback.error
    attached = false
  }

  if (error) throw error
  if (!row) throw new Error("Failed to create repair")
  if (attachedItem && attached) {
    await updateInventoryItem(attachedItem.id, {
      qty_in_stock: attachedItem.qty_in_stock - attachedQty,
    })
  }
  return (row as unknown as { id: number }).id
}

export async function fetchRepairById(id: number): Promise<RepairRow> {
  const { data, error } = await from(TABLE.repairs).select("*").eq("id", id).single()

  if (error) throw error
  return normalizeRepair(data as Partial<RepairRow>) as RepairRow
}

export async function fetchRepairItems(repairId: number): Promise<RepairItemWithInventory[]> {
  const repair = await fetchRepairById(repairId)
  if (!repair.inventory_item_id) return []

  return [{
    id: repair.id,
    repair_id: repair.id,
    inventory_id: repair.inventory_item_id,
    qty: Number(repair.inventory_item_qty ?? 1),
    unit_cost: Number(repair.inventory_item_price ?? 0),
    created_at: repair.created_at,
    inventory_name: repair.inventory_item_name,
  }]
}

export async function fetchRepairWithItems(id: number): Promise<RepairWithItems> {
  const [repair, items] = await Promise.all([
    fetchRepairById(id),
    fetchRepairItems(id),
  ])

  return { repair, items }
}

export async function updateRepair(id: number, data: RepairUpdate): Promise<void> {
  let { error } = await from(TABLE.repairs)
    .update(repairWrite(data) as never)
    .eq("id", id)

  if (isMissingColumn(error)) {
    error = (await from(TABLE.repairs).update(legacyRepairWrite(data) as never).eq("id", id)).error
  }

  if (error) throw error
}

export async function deleteRepair(id: number): Promise<void> {
  const repairItems = await fetchRepairItems(id)

  for (const item of repairItems) {
    const inventory = await fetchInventoryById(item.inventory_id)
    await updateInventoryItem(item.inventory_id, {
      qty_in_stock: inventory.qty_in_stock + item.qty,
    })
  }

  const { error } = await from(TABLE.repairs).delete().eq("id", id)

  if (error) throw error
}

export async function attachItemToRepair(params: {
  repairId: number
  inventoryId: number
  qty: number
  customerPrice?: number
}): Promise<void> {
  const item = await fetchInventoryById(params.inventoryId)

  if (!Number.isInteger(params.qty) || params.qty <= 0) {
    throw new Error("Quantity must be a whole number greater than 0")
  }
  if (params.customerPrice !== undefined && (!Number.isInteger(params.customerPrice) || params.customerPrice <= 0)) {
    throw new Error("Customer price must be a whole number greater than 0")
  }
  if (params.qty > item.qty_in_stock) {
    throw new Error(`Only ${item.qty_in_stock} item(s) in stock`)
  }

  const repair = await fetchRepairById(params.repairId)
  if (repair.inventory_item_id) throw new Error("Remove the attached item before adding another.")

  await updateInventoryItem(params.inventoryId, {
    qty_in_stock: item.qty_in_stock - params.qty,
  })
  await updateRepair(params.repairId, {
    ...(params.customerPrice !== undefined ? { fee: params.customerPrice } : {}),
    inventory_item_id: params.inventoryId,
    inventory_item_qty: params.qty,
    inventory_item_name: item.name,
    inventory_item_price: Number(item.price_per_unit),
  })
}

export async function updateAttachedItemOnRepair(params: {
  repairId: number
  inventoryId: number
  qty: number
  customerPrice?: number
}): Promise<void> {
  const repair = await fetchRepairById(params.repairId)
  if (!repair.inventory_item_id) {
    await attachItemToRepair(params)
    return
  }

  if (!Number.isInteger(params.qty) || params.qty <= 0) {
    throw new Error("Quantity must be a whole number greater than 0")
  }
  if (params.customerPrice !== undefined && (!Number.isInteger(params.customerPrice) || params.customerPrice <= 0)) {
    throw new Error("Customer price must be a whole number greater than 0")
  }

  const oldInventoryId = repair.inventory_item_id
  const oldQty = Number(repair.inventory_item_qty ?? 1)
  const item = await fetchInventoryById(params.inventoryId)
  const availableQty = item.qty_in_stock + (params.inventoryId === oldInventoryId ? oldQty : 0)

  if (params.qty > availableQty) {
    throw new Error(`Only ${availableQty} item(s) in stock`)
  }

  if (params.inventoryId === oldInventoryId) {
    await updateInventoryItem(params.inventoryId, {
      qty_in_stock: item.qty_in_stock + oldQty - params.qty,
    })
  } else {
    const oldInventory = await fetchInventoryById(oldInventoryId)
    await updateInventoryItem(oldInventoryId, {
      qty_in_stock: oldInventory.qty_in_stock + oldQty,
    })
    await updateInventoryItem(params.inventoryId, {
      qty_in_stock: item.qty_in_stock - params.qty,
    })
  }

  await updateRepair(params.repairId, {
    ...(params.customerPrice !== undefined ? { fee: params.customerPrice } : {}),
    inventory_item_id: params.inventoryId,
    inventory_item_qty: params.qty,
    inventory_item_name: item.name,
    inventory_item_price: Number(item.price_per_unit),
  })
}

export async function detachItemFromRepair(repairItemId: number): Promise<void> {
  const repair = await fetchRepairById(repairItemId)
  if (!repair.inventory_item_id) return

  const inventory = await fetchInventoryById(repair.inventory_item_id)
  await updateInventoryItem(repair.inventory_item_id, {
    qty_in_stock: inventory.qty_in_stock + Number(repair.inventory_item_qty ?? 1),
  })
  await updateRepair(repair.id, {
    inventory_item_id: null,
    inventory_item_qty: null,
    inventory_item_name: null,
    inventory_item_price: null,
  })
}
