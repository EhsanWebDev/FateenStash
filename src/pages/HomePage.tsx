import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  CircleDollarSign,
  Package,
  ReceiptText,
  Warehouse,
  Wrench,
} from "lucide-react"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPKR, jobKindLabel, jobTitle } from "@/lib/utils"
import { formatMonthLabel } from "@/lib/repair-metrics"
import { useDashboardData } from "@/hooks/useDashboardData"

const monthLabel = formatMonthLabel()

export function HomePage() {
  const navigate = useNavigate()
  const { metrics, stockValue, recentRepairs, lowStock, lowStockTotal, loading, error } =
    useDashboardData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">{monthLabel} at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/repairs")}>
          <Wrench className="mr-1.5 size-4" />
          Repair Jobs
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="This Month Fees"
              value={formatPKR(metrics.totalFees)}
              icon={CircleDollarSign}
              trend={`${metrics.totalJobs} jobs recorded`}
            />
            <MetricCard
              title="Repair Jobs"
              value={String(metrics.repairJobs)}
              icon={Wrench}
              trend="Hardware and device work"
            />
            <MetricCard
              title="Labor Jobs"
              value={String(metrics.laborJobs)}
              icon={ReceiptText}
              trend="Service-only work"
            />
            <MetricCard
              title="Stock Value"
              value={formatPKR(stockValue)}
              icon={Warehouse}
              trend={`Avg ticket ${formatPKR(metrics.averageFee)}`}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Repair Jobs</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/repairs")}>
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))
          ) : recentRepairs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No jobs recorded yet.</p>
          ) : (
            recentRepairs.map((repair) => (
              <div
                key={repair.id}
                className="flex items-center justify-between rounded-lg border bg-background/60 p-3 transition-colors hover:bg-primary/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{jobTitle(repair.job_type)}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{jobKindLabel(repair.job_type)}</p>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">
                    {jobKindLabel(repair.job_type)}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPKR(repair.fee)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!loading && lowStock.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            </div>
            {lowStockTotal > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => navigate("/stock?filter=low")}
              >
                See all ({lowStockTotal})
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-yellow-100 bg-yellow-50/60 p-3 transition-colors hover:bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10"
              >
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <Badge
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400"
                >
                  {item.qty_in_stock} left
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
