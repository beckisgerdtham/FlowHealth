import type { WeightEntry } from '../types'
import { addDays, round1, toIso } from './format'
import { newId } from './storage'

/**
 * Six weeks of realistic-looking weigh-ins ending today at `currentWeight`,
 * moving toward `targetWeight`. Handy for exploring the app.
 */
export function makeSampleEntries(currentWeight: number, targetWeight: number): WeightEntry[] {
  const direction = targetWeight < currentWeight ? -1 : targetWeight > currentWeight ? 1 : 0
  const totalChange = direction * 2.4 // over six weeks
  const start = currentWeight - totalChange
  const today = new Date()
  const days = 42
  const entries: WeightEntry[] = []
  for (let d = days; d >= 0; d -= 3) {
    const t = (days - d) / days
    const wobble = d === 0 ? 0 : Math.sin(d * 1.7) * 0.25
    const date = addDays(today, -d)
    entries.push({
      id: newId(),
      date: toIso(date),
      weightKg: round1(start + totalChange * t + wobble),
      loggedAt: new Date(date.setHours(7, 30)).toISOString(),
    })
  }
  return entries
}
