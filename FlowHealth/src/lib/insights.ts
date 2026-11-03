import type { Profile } from '../types'
import { addDays, formatSpan } from './format'
import { goalDirection, type HealthPlan } from './health'
import type { Summary } from './trends'

/** Forecast for the Insights screen: real trend if available, otherwise the plan. */
export function getForecast(summary: Summary, health: HealthPlan, profile: Profile, today = new Date()) {
  const target = `${profile.targetWeight} kg`
  const dir = goalDirection(profile.currentWeight, profile.targetWeight)

  if (dir === 0) {
    return { title: `You’ve reached your goal of ${target}`, date: null as Date | null, basis: 'Keep logging to stay on track' }
  }
  if (summary.kgPerWeek !== null) {
    const rate = summary.kgPerWeek
    const basis = `Based on ${summary.count} weigh-ins over ${formatSpan(summary.spanDays)}`
    if (Math.sign(rate) === dir && Math.abs(rate) >= 0.05) {
      const weeks = Math.abs((profile.targetWeight - profile.currentWeight) / rate)
      return { title: `At your current pace you’ll reach ${target} by`, date: addDays(today, weeks * 7), basis }
    }
    return { title: `Your current trend isn’t moving toward ${target}`, date: null, basis }
  }
  if (health.goalDate) {
    return {
      title: `Following your plan, you’ll reach ${target} by`,
      date: health.goalDate,
      basis: 'Plan estimate · log for a week to use your real trend',
    }
  }
  return { title: `Your current plan doesn’t move you toward ${target}`, date: null, basis: 'Choose a different calorie target in Plan' }
}
