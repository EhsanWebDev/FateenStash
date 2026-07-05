export const TABLE_SUFFIX_STORAGE_KEY = "tableSuffix"

const envSuffix = (import.meta.env.VITE_TABLE_SUFFIX as string) ?? ""
const suffix = localStorage.getItem(TABLE_SUFFIX_STORAGE_KEY) ?? envSuffix

export const TABLE = {
  inventory: `inventory${suffix}`,
  out_of_stock_items: `out_of_stock_items${suffix}`,
  repairs: `repairs${suffix}`,
  repair_items: `repair_items${suffix}`,
} as const
