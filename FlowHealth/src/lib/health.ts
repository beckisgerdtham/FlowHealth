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
  caloriePlans.find((p) => p.adjustment === adjustment)?.label ?? 'Safe minimum plan'

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

/** Mifflin–St Jeor. Returns null until sex, age, height and weight are all known. */
export function estimateBmr(profile: {
  sex: Profile['sex']
  age: number | null
  height: number | null
  currentWeight: number | null
}): number | null {
  if (profile.sex === null || profile.age === null || profile.height === null || profile.currentWeight === null) return null
  const sexOffset = profile.sex === 'Male' ? 5 : -161
  return Math.round(10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age + sexOffset)
}

/**
 * Lowest daily intake the app will recommend: never below BMR, and never below
 * the commonly used guideline of 1,200 kcal (women) / 1,500 kcal (men).
 */
export function minimumCalories(profile: Pick<Profile, 'bmr' | 'sex'>) {
  return Math.max(profile.bmr, profile.sex === 'Male' ? 1500 : 1200)
}

export const maintenanceCalories = (profile: Pick<Profile, 'bmr' | 'activity'>) =>
  Math.round(profile.bmr * activityMultipliers[profile.activity])

export const isSafeAdjustment = (profile: Pick<Profile, 'bmr' | 'sex' | 'activity'>, adjustment: number) =>
  maintenanceCalories(profile) + adjustment >= minimumCalories(profile)

/**
 * The plan to use toward the goal that stays at or above the minimum.
 * Prefers the current adjustment, then progressively milder plans, ending at maintenance.
 */
export function safeAdjustment(profile: Pick<Profile, 'bmr' | 'sex' | 'activity' | 'currentWeight' | 'targetWeight' | 'adjustment'>) {
  const dir = goalDirection(profile.currentWeight, profile.targetWeight)
  if (Math.sign(profile.adjustment) === dir && isSafeAdjustment(profile, profile.adjustment)) return profile.adjustment
  const candidates = dir < 0 ? [-500, -300] : dir > 0 ? [250] : []
  const preset = candidates.find((a) => isSafeAdjustment(profile, a))
  if (preset !== undefined) return preset
  // No preset fits: use the largest deficit that keeps intake at the minimum (rounded to 10 kcal).
  const room = Math.ceil((minimumCalories(profile) - maintenanceCalories(profile)) / 10) * 10
  return dir < 0 && room < 0 ? room : 0
}

export function calculateHealth(profile: Profile, today = new Date()) {
  const tdee = maintenanceCalories(profile)
  const targetCalories = tdee + profile.adjustment
  const minimum = minimumCalories(profile)
  /** true when the chosen plan goes below the safe minimum (e.g. after BMR or activity changed). */
  const belowMinimum = targetCalories < minimum
  /** Planned change in kg per week (negative = loss). Not rounded. */
  const weeklyChange = (profile.adjustment * 7) / KCAL_PER_KG
  const dir = goalDirection(profile.currentWeight, profile.targetWeight)
  const atGoal = dir === 0
  const movingTowardGoal = atGoal || (weeklyChange !== 0 && Math.sign(weeklyChange) === dir)
  /** null = the plan never reaches the goal. */
  const weeks = atGoal ? 0 : movingTowardGoal ? Math.abs((profile.targetWeight - profile.currentWeight) / weeklyChange) : null
  const goalDate = weeks === null ? null : addDays(today, weeks * 7)
  return { tdee, targetCalories, minimum, belowMinimum, weeklyChange, atGoal, movingTowardGoal, weeks, goalDate }
}

export type HealthPlan = ReturnType<typeof calculateHealth>

/** Share of the way from start to target, 0–1. */
export function goalProgress(start: number, current: number, target: number) {
  if (Math.abs(start - target) < 0.05) return 1
  return Math.min(1, Math.max(0, (start - current) / (start - target)))
}
