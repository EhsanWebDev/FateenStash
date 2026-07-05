export type Category =
  | 'jack'
  | 'mic'
  | 'speaker'
  | 'panel'
  | 'strip'
  | 'other'

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'jack', label: 'Jacks' },
  { value: 'mic', label: 'Mics' },
  { value: 'speaker', label: 'Speakers' },
  { value: 'panel', label: 'Panels' },
  { value: 'strip', label: 'Strips' },
  { value: 'other', label: 'Other' },
]

export interface InventoryRow {
  id: number
  name: string
  category: Category
  qty_in_stock: number
  price_per_unit: number
  created_at: string
  updated_at: string
}

export interface InventoryInsert {
  name: string
  category?: Category
  qty_in_stock?: number
  price_per_unit: number
}

export interface InventoryUpdate {
  name?: string
  category?: Category
  qty_in_stock?: number
  price_per_unit?: number
}

export type JobType = 'repair' | 'labor'

export interface RepairRow {
  id: number
  job_type: JobType
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

export interface OutOfStockItemRow extends InventoryRow {
  went_out_at: string
}

export type RepairInsert = {
  job_type: JobType
  fee?: number
  inventory_item_id?: number | null
  inventory_item_qty?: number | null
  inventory_item_name?: string | null
  inventory_item_price?: number | null
  gross_profit?: number
  item_price?: number
  item_details?: string | null
}
export type RepairUpdate = Partial<RepairInsert>

export interface RepairItemRow {
  id: number
  repair_id: number
  inventory_id: number
  qty: number
  unit_cost: number
  created_at: string
}

export type RepairItemInsert = Omit<RepairItemRow, 'id' | 'created_at'>
export type RepairItemUpdate = Partial<RepairItemInsert>

export interface Database {
  public: {
    Tables: {
      inventory: {
        Row: InventoryRow
        Insert: InventoryInsert
        Update: InventoryUpdate
      }
      out_of_stock_items: {
        Row: OutOfStockItemRow
        Insert: never
        Update: never
      }
      repairs: {
        Row: RepairRow
        Insert: RepairInsert
        Update: RepairUpdate
      }
      repair_items: {
        Row: RepairItemRow
        Insert: RepairItemInsert
        Update: RepairItemUpdate
      }
    }
  }
}
