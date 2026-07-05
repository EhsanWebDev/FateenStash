/* eslint-disable react-refresh/only-export-components */
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, cn } from "@/lib/utils";
import { CATEGORY_OPTIONS, type InventoryRow } from "@/types/database.types";

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
        "h-7 w-full px-0 text-xs font-medium text-muted-foreground shadow-none hover:translate-y-0 hover:text-foreground sm:h-8 sm:text-sm",
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

export function stockColumns(lowStockThreshold: number): ColumnDef<InventoryRow>[] {
  return [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader label="Name" column={column} />,
    cell: ({ row }) => {
      const name = String(row.getValue("name"));
      const shortName = name.length > 30 ? `${name.slice(0, 27)}...` : name;

      return (
        <span
          className="block min-w-0 max-w-full truncate text-[11px] font-medium sm:text-sm"
          title={name}
        >
          {shortName}
        </span>
      );
    },
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
            qty <= lowStockThreshold && "font-semibold text-yellow-600",
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
}
