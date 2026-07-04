import type { JobType } from "@/types/database.types"

interface RepairMetricInput {
  job_type: JobType
  fee: number
  created_at: string
}

export interface RepairSummary {
  totalJobs: number
  repairJobs: number
  laborJobs: number
  totalFees: number
  averageFee: number
}

export function summarizeRepairs<T extends RepairMetricInput>(repairs: T[]): RepairSummary {
  const summary = repairs.reduce(
    (totals, repair) => {
      totals.totalJobs += 1
      totals.totalFees += Number(repair.fee)
      if (repair.job_type === "labor") {
        totals.laborJobs += 1
      } else {
        totals.repairJobs += 1
      }
      return totals
    },
    {
      totalJobs: 0,
      repairJobs: 0,
      laborJobs: 0,
      totalFees: 0,
      averageFee: 0,
    },
  )

  return {
    ...summary,
    averageFee: summary.totalJobs === 0 ? 0 : summary.totalFees / summary.totalJobs,
  }
}

export function filterRepairsToMonth<T extends { created_at: string }>(
  repairs: T[],
  date = new Date(),
): T[] {
  const month = date.getMonth()
  const year = date.getFullYear()

  return repairs.filter((repair) => {
    const createdAt = new Date(repair.created_at)
    return createdAt.getMonth() === month && createdAt.getFullYear() === year
  })
}

export function formatMonthLabel(date = new Date()): string {
  return new Intl.DateTimeFormat("en-PK", {
    month: "long",
    year: "numeric",
  }).format(date)
}
