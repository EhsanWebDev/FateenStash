import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CircleDollarSign, Plus, ReceiptText, Search, Wrench, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import { useRepairsData } from "@/hooks/useRepairsData"
import { cn, formatPKR } from "@/lib/utils"
import { repairColumns } from "@/pages/repairs/columns"
import { filterRepairsToMonth, formatMonthLabel, summarizeRepairs } from "@/lib/repair-metrics"
import type { JobType } from "@/types/database.types"
import type { LucideIcon } from "lucide-react"

type RepairFilter = "all" | JobType

const FILTER_OPTIONS: Array<{ value: RepairFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "repair", label: "Repair" },
  { value: "labor", label: "Labor" },
]

const monthLabel = formatMonthLabel()

interface RepairMetricTileProps {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

function RepairMetricTile({ label, value, hint, icon: Icon }: Readonly<RepairMetricTileProps>) {
  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-card/95 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.5)]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[1.6rem] border border-border/70 bg-card/95 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.5)]"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="mt-4 h-10 w-32" />
          <Skeleton className="mt-3 h-4 w-40" />
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card/95 shadow-sm ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/70">
              {["Job Type", "Items", "Gross Profit", "Item Price", "Profit"].map((label) => (
                <th key={label} className="px-1.5 py-2 sm:px-3 sm:py-3">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, idx) => idx + 1).map((rowNumber) => (
              <tr key={rowNumber} className="border-b last:border-b-0">
                <td className="px-1.5 py-2 sm:px-3 sm:py-3">
                  <Skeleton className="h-8 w-24 sm:w-32" />
                </td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3">
                  <Skeleton className="ml-auto h-4 w-20" />
                </td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3">
                  <Skeleton className="ml-auto h-4 w-20" />
                </td>
                <td className="px-1.5 py-2 sm:px-3 sm:py-3">
                  <Skeleton className="ml-auto h-4 w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t px-2 py-2 sm:px-4 sm:py-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-48" />
      </div>
    </div>
  )
}

export function RepairsPage() {
  const navigate = useNavigate()
  const { repairs, loading, error } = useRepairsData()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<RepairFilter>("all")

  const columns = useMemo(() => repairColumns(), [])
  const filteredRepairs = useMemo(
    () => repairs.filter((repair) => filter === "all" || repair.job_type === filter),
    [filter, repairs],
  )
  const currentMonthSummary = useMemo(
    () => summarizeRepairs(filterRepairsToMonth(repairs)),
    [repairs],
  )

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repair Jobs</h2>
          <p className="text-sm text-muted-foreground">Every repair and labor job in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </div>
          <Button size="sm" onClick={() => navigate("/repairs/new")}>
            <Plus className="size-4" />
            <span className="ml-1">New Job</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <RepairMetricTile
            label="Gross Profit"
            value={formatPKR(currentMonthSummary.totalFees)}
            hint={`${currentMonthSummary.totalJobs} jobs this month`}
            icon={CircleDollarSign}
          />
          <RepairMetricTile
            label="Repair Jobs"
            value={String(currentMonthSummary.repairJobs)}
            hint="Device repair work logged this month"
            icon={Wrench}
          />
          <RepairMetricTile
            label="Labor Jobs"
            value={String(currentMonthSummary.laborJobs)}
            hint="Service-only work logged this month"
            icon={Workflow}
          />
          <RepairMetricTile
            label="Average Ticket"
            value={formatPKR(currentMonthSummary.averageFee)}
            hint="Average fee per recorded job"
            icon={ReceiptText}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search repair jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 shadow-sm"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5",
              filter === option.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRepairs}
          globalFilter={search}
          mobileHiddenColumns={[]}
          onRowClick={(repair) => navigate(`/repairs/${repair.id}`)}
        />
      )}
    </div>
  )
}
