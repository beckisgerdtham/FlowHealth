import type { WeightEntry } from '../types'
import { daysBetween, todayIso } from './format'

export type Range = '1M' | '3M' | '6M' | '1Y'
export const rangeDays: Record<Range, number> = { '1M': 30, '3M': 91, '6M': 182, '1Y': 365 }

export const sortByDate = (entries: WeightEntry[]) => [...entries].sort((a, b) => a.date.localeCompare(b.date))

/** Entries from the last `days` days up to today. */
export function lastDays(entries: WeightEntry[], days: number, endIso = todayIso()) {
  return entries.filter((e) => {
    const age = daysBetween(e.date, endIso)
    return age >= 0 && age <= days
  })
}

/**
 * Trend in kg per week using least-squares linear regression.
 * Smooths out day-to-day fluctuations. Needs at least ~a week of data.
 */
export function kgPerWeek(sorted: WeightEntry[]): number | null {
  if (sorted.length < 2) return null
  const start = sorted[0]!.date
  const span = daysBetween(start, sorted[sorted.length - 1]!.date)
  if (span < 6) return null
  const xs = sorted.map((e) => daysBetween(start, e.date))
  const ys = sorted.map((e) => e.weightKg)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i]! - my)
    den += (x - mx) ** 2
  })
  return den === 0 ? null : (num / den) * 7
}

export function summarize(entries: WeightEntry[]) {
  const sorted = sortByDate(entries)
  const count = sorted.length
  const first = sorted[0] ?? null
  const latest = sorted[count - 1] ?? null
  const previous = sorted[count - 2] ?? null
  return {
    sorted,
    count,
    first,
    latest,
    previous,
    changeSincePrevious: latest && previous ? latest.weightKg - previous.weightKg : null,
    totalChange: latest && first && count > 1 ? latest.weightKg - first.weightKg : null,
    average: count ? sorted.reduce((sum, e) => sum + e.weightKg, 0) / count : null,
    lowest: count ? sorted.reduce((low, e) => (e.weightKg < low.weightKg ? e : low)) : null,
    spanDays: first && latest ? daysBetween(first.date, latest.date) : 0,
    kgPerWeek: kgPerWeek(sorted),
  }
}

export type Summary = ReturnType<typeof summarize>

/** Share of weeks (since the first entry) that have at least one weigh-in. */
export function checkInConsistency(sorted: WeightEntry[], endIso = todayIso()) {
  if (sorted.length === 0) return null
  const start = sorted[0]!.date
  const totalWeeks = Math.floor(daysBetween(start, endIso) / 7) + 1
  const weeks = new Set(sorted.map((e) => Math.floor(daysBetween(start, e.date) / 7)))
  return Math.min(1, weeks.size / totalWeeks)
}

/** Consecutive 7-day periods, counting back from today, that contain a weigh-in. */
export function weekStreak(sorted: WeightEntry[], endIso = todayIso()) {
  const buckets = new Set(sorted.map((e) => Math.floor(daysBetween(e.date, endIso) / 7)).filter((b) => b >= 0))
  let i = buckets.has(0) ? 0 : 1
  let streak = 0
  while (buckets.has(i)) {
    streak++
    i++
  }
  return streak
}
