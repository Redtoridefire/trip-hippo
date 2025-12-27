import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start)
  const e = new Date(end)
  const startMonth = s.toLocaleDateString("en-US", { month: "short" })
  const endMonth = e.toLocaleDateString("en-US", { month: "short" })

  if (startMonth === endMonth) {
    return `${startMonth} ${s.getDate()} - ${e.getDate()}, ${e.getFullYear()}`
  }
  return `${startMonth} ${s.getDate()} - ${endMonth} ${e.getDate()}, ${e.getFullYear()}`
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim()
}
