const suffix = (import.meta.env.VITE_TABLE_SUFFIX as string) ?? ''

export const TABLE = {
  inventory: `inventory${suffix}`,
  out_of_stock_items: `out_of_stock_items${suffix}`,
  repairs: `repairs${suffix}`,
  repair_items: `repair_items${suffix}`,
} as const
