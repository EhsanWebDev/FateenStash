import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatPKR, jobKindLabel } from "@/lib/utils"
import type { RepairListItem } from "@/hooks/useRepairsData"

export function repairColumns(): ColumnDef<RepairListItem>[] {
  return [
    {
      accessorFn: (row) => [row.job_type, jobKindLabel(row.job_type), row.item_details].join(" "),
      id: "job_type",
      header: () => <div className="text-left text-xs font-medium text-muted-foreground sm:text-sm">Job / Item</div>,
      cell: ({ row }) => {
        const item = row.original.item_details?.trim().replace(/\s+x1$/, "")
        const shortItem = item && item.length > 25 ? `${item.slice(0, 22)}...` : item

        return (
          <div className="flex min-w-0 items-center gap-2 text-left text-xs sm:text-sm">
            <Badge
              variant="outline"
              className={row.original.job_type === "labor" ? "border-primary/30 bg-primary/10 text-primary" : ""}
            >
              {jobKindLabel(row.original.job_type)}
            </Badge>
            <span className="truncate text-[11px] text-muted-foreground sm:text-xs" title={item || undefined}>
              {shortItem || "---"}
            </span>
          </div>
        )
      },
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
