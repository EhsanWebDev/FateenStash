import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter?: string;
  columnFilters?: ColumnFiltersState;
  mobileHiddenColumns?: string[];
  onRowClick?: (row: TData) => void;
}

function PaginationBar<TData>({ table }: { table: TanstackTable<TData> }) {
  "use no memo";

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-2 py-2 sm:px-4 sm:py-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="shrink-0">Rows</span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="h-7 rounded border bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <span className="text-xs shrink-0">
        Page {pageIndex + 1} of {pageCount || 1}
      </span>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Go to first page"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Go to previous page"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Go to next page"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Go to last page"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  columnFilters,
  mobileHiddenColumns = [],
  onRowClick,
}: DataTableProps<TData, TValue>) {
  "use no memo";

  const isMobile = useMediaQuery("(max-width: 767px)");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnVisibility = useMemo<VisibilityState>(() => {
    if (!isMobile) return {};
    return Object.fromEntries(mobileHiddenColumns.map((id) => [id, false]));
  }, [isMobile, mobileHiddenColumns]);

  const filtersKey = `${globalFilter ?? ""}|${JSON.stringify(columnFilters)}`;
  useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [filtersKey]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: globalFilter ?? "",
      columnFilters: columnFilters ?? [],
      pagination,
      columnVisibility,
    },
    onSortingChange: (updater) => {
      setSorting((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    onPaginationChange: (updater) => {
      setPagination((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    enableSortingRemoval: false,
  });

  return (
    <div className="overflow-hidden rounded-xl bg-card/95 shadow-sm ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/70">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-1.5 py-2 text-xs font-medium whitespace-nowrap sm:px-3 sm:py-3 sm:text-sm"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors last:border-b-0 hover:bg-primary/5 data-[clickable=true]:cursor-pointer data-[clickable=true]:touch-manipulation data-[clickable=true]:focus-visible:outline-none data-[clickable=true]:focus-visible:ring-2 data-[clickable=true]:focus-visible:ring-ring data-[clickable=true]:focus-visible:ring-offset-2"
                  data-clickable={Boolean(onRowClick)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-1.5 py-2 align-middle sm:px-3 sm:py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar table={table} />
    </div>
  );
}
