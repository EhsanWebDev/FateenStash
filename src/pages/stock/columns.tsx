/* eslint-disable react-refresh/only-export-components */
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, cn } from "@/lib/utils";
import { CATEGORY_OPTIONS, type InventoryRow } from "@/types/database.types";

const LOW_STOCK_THRESHOLD = 2;
const categoryLabels = new Map(CATEGORY_OPTIONS.map((category) => [category.value, category.label]));

function SortHeader({
  label,
  column,
  align = "start",
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<InventoryRow, any>;
  align?: "start" | "center" | "end";
}) {
  "use no memo";
  const sorted = column.getIsSorted();
  const icon =
    sorted === "asc" ? (
      <ArrowUp className="ml-1 size-3" />
    ) : sorted === "desc" ? (
      <ArrowDown className="ml-1 size-3" />
    ) : (
      <ArrowUpDown className="ml-1 size-3 opacity-50" />
    );

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 w-full px-0 text-xs font-medium text-muted-foreground hover:text-foreground sm:h-8 sm:text-sm",
        align === "end" && "justify-end",
        align === "center" && "justify-center",
        align === "start" && "justify-start",
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      {icon}
    </Button>
  );
}

export const stockColumns: ColumnDef<InventoryRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <span className="block min-w-0 max-w-full truncate text-xs font-medium sm:text-sm">
        {row.getValue("name")}
      </span>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortHeader label="Category" column={column} />,
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className="px-2 py-0 text-[11px] font-medium capitalize sm:text-xs"
      >
        {categoryLabels.get(row.getValue("category")) ?? row.getValue("category")}
      </Badge>
    ),
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      return row.getValue("category") === filterValue;
    },
  },
  {
    accessorKey: "qty_in_stock",
    header: ({ column }) => <SortHeader label="Qty" column={column} align="center" />,
    cell: ({ row }) => {
      const qty = row.getValue<number>("qty_in_stock");
      return (
        <div
          className={cn(
            "text-center text-xs tabular-nums sm:text-sm",
            qty <= LOW_STOCK_THRESHOLD && "font-semibold text-yellow-600",
          )}
        >
          {qty}
        </div>
      );
    },
    filterFn: (row, _columnId, threshold) => {
      return row.getValue<number>("qty_in_stock") <= (threshold as number);
    },
  },
  {
    accessorKey: "price_per_unit",
    header: ({ column }) => <SortHeader label="Price" column={column} align="end" />,
    cell: ({ row }) => (
      <div className="text-right text-xs tabular-nums sm:text-sm">
        {formatPKR(row.getValue("price_per_unit"))}
      </div>
    ),
    enableColumnFilter: false,
  },
];
