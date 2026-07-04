import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { JobType } from "@/types/database.types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function jobTitle(jobType: JobType) {
  return jobType === "labor" ? "Labor job" : "Repair job"
}

export function jobKindLabel(jobType: JobType) {
  return jobType === "labor" ? "Labor" : "Repair"
}
