import type { Profile } from '../types'
import { addDays, formatSpan } from './format'
import { goalDirection, type HealthPlan } from './health'
import type { Summary } from './trends'

/** The short message on the Today screen. */
export function getFlowInsight(summary: Summary, health: HealthPlan, profile: Profile) {
  if (summary.count < 2) {
    return { title: 'Start building your trend.', detail: 'Log your weight a few times a week.' }
  }
  if (summary.kgPerWeek === null) {
    return { title: 'Keep logging.', detail: 'About a week of weigh-ins is needed to estimate your pace.' }
  }
  const dir = goalDirection(profile.currentWeight, profile.targetWeight)
  const actual = summary.kgPerWeek
  const pace = `${Math.abs(actual).toFixed(1)} kg/week`
  const planned = `${Math.abs(health.weeklyChange).toFixed(1)} kg/week`

  if (dir === 0) {
    return Math.abs(actual) < 0.2
      ? { title: 'Your weight is stable.', detail: 'You’re holding your goal weight.' }
      : { title: 'Your weight is drifting.', detail: `Your trend is ${actual > 0 ? '+' : '−'}${pace}.` }
  }
  const towardGoal = actual * dir // positive = moving toward the goal
  const plannedRate = Math.abs(health.weeklyChange)
  const verb = dir < 0 ? 'losing' : 'gaining'

  if (towardGoal <= 0.05) {
    return { title: 'Your trend has stalled.', detail: `Your trend is flat or moving away from your goal. Planned: ${planned}.` }
  }
  if (towardGoal > 1) {
    return { title: `You’re ${verb} faster than recommended.`, detail: `Your trend is ${pace}. Consider a milder plan.` }
  }
  if (plannedRate > 0 && towardGoal < plannedRate * 0.6) {
    return { title: 'Progress is slower than planned.', detail: `Your trend is ${pace} vs planned ${planned}.` }
  }
  return { title: `You’re ${verb} weight at a sustainable pace.`, detail: `Your trend is ${pace}. Planned: ${planned}.` }
}

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
