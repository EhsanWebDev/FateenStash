import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatPKR, jobKindLabel } from "@/lib/utils"
import type { RepairListItem } from "@/hooks/useRepairsData"

export function repairColumns(): ColumnDef<RepairListItem>[] {
  return [
    {
      accessorFn: (row) => [row.job_type, jobKindLabel(row.job_type)].join(" "),
      id: "job_type",
      header: () => <div className="text-left text-xs font-medium text-muted-foreground sm:text-sm">Job Type</div>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={row.original.job_type === "labor" ? "border-primary/30 bg-primary/10 text-primary" : ""}
        >
          {jobKindLabel(row.original.job_type)}
        </Badge>
      ),
    },
    {
      accessorKey: "item_details",
      id: "item_details",
      header: () => <div className="text-left text-xs font-medium text-muted-foreground sm:text-sm">Items</div>,
      cell: ({ row }) => (
        <div className="max-w-48 truncate text-left text-xs sm:text-sm">
          {row.original.item_details?.trim() || "---"}
        </div>
      ),
    },
    {
      accessorKey: "gross_profit",
      id: "gross_profit",
      header: () => <div className="text-center text-xs font-medium text-muted-foreground sm:text-sm">Gross Profit</div>,
      cell: ({ row }) => (
        <div className="text-center text-xs tabular-nums sm:text-sm">
          {formatPKR(row.original.gross_profit)}
        </div>
      ),
    },
    {
      accessorKey: "item_price",
      id: "item_price",
      header: () => <div className="text-center text-xs font-medium text-muted-foreground sm:text-sm">Item Price</div>,
      cell: ({ row }) => (
        <div className="text-center text-xs tabular-nums sm:text-sm">
          {row.original.job_type === "labor" ? "---" : formatPKR(row.original.item_price)}
        </div>
      ),
    },
    {
      accessorKey: "profit",
      id: "profit",
      header: () => <div className="text-center text-xs font-medium text-muted-foreground sm:text-sm">Profit</div>,
      cell: ({ row }) => (
        <div className="text-center text-xs tabular-nums sm:text-sm">
          {formatPKR(row.original.profit)}
        </div>
      ),
    },
  ]
}
