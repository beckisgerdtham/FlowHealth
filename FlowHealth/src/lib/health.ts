import type { ActivityLevel, Profile } from '../types'
import { addDays } from './format'

/** Approximate energy content of 1 kg body weight. */
export const KCAL_PER_KG = 7700

export const activityMultipliers: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
  'Extremely Active': 1.9,
}

export const activityLevels = Object.keys(activityMultipliers) as ActivityLevel[]

export const caloriePlans = [
  { label: 'Aggressive Fat Loss', adjustment: -750, tone: 'rose' },
  { label: 'Moderate Fat Loss', adjustment: -500, tone: 'sage' },
  { label: 'Mild Fat Loss', adjustment: -300, tone: 'blue' },
  { label: 'Maintenance', adjustment: 0, tone: 'neutral' },
  { label: 'Lean Bulk', adjustment: 250, tone: 'sand' },
  { label: 'Mass Gain', adjustment: 500, tone: 'amber' },
]

export const planLabel = (adjustment: number) =>
  caloriePlans.find((p) => p.adjustment === adjustment)?.label ?? 'Custom plan'

/** −1 = lose, +1 = gain, 0 = at goal. */
export function goalDirection(current: number, target: number) {
  const delta = target - current
  return Math.abs(delta) < 0.05 ? 0 : Math.sign(delta)
}

/** A sensible starting plan for the direction of the goal. */
export function defaultAdjustment(current: number, target: number) {
  const dir = goalDirection(current, target)
  return dir < 0 ? -500 : dir > 0 ? 250 : 0
}

/** Mifflin–St Jeor. */
export function estimateBmr(profile: Pick<Profile, 'sex' | 'age' | 'height' | 'currentWeight'>) {
  const sexOffset = profile.sex === 'Male' ? 5 : -161
  return Math.round(10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age + sexOffset)
}

export function calculateHealth(profile: Profile, today = new Date()) {
  const tdee = Math.round(profile.bmr * activityMultipliers[profile.activity])
  const targetCalories = tdee + profile.adjustment
  /** Planned change in kg per week (negative = loss). Not rounded. */
  const weeklyChange = (profile.adjustment * 7) / KCAL_PER_KG
  const dir = goalDirection(profile.currentWeight, profile.targetWeight)
  const atGoal = dir === 0
  const movingTowardGoal = atGoal || (weeklyChange !== 0 && Math.sign(weeklyChange) === dir)
  /** null = the plan never reaches the goal. */
  const weeks = atGoal ? 0 : movingTowardGoal ? Math.abs((profile.targetWeight - profile.currentWeight) / weeklyChange) : null
  const goalDate = weeks === null ? null : addDays(today, weeks * 7)
  return { tdee, targetCalories, weeklyChange, atGoal, movingTowardGoal, weeks, goalDate }
}

export type HealthPlan = ReturnType<typeof calculateHealth>

/** Share of the way from start to target, 0–1. */
export function goalProgress(start: number, current: number, target: number) {
  if (Math.abs(start - target) < 0.05) return 1
  return Math.min(1, Math.max(0, (start - current) / (start - target)))
}
