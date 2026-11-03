import type { Profile, WeightEntry } from '../types'
import type { IconName } from '../components/Icon'
import { daysBetween, todayIso } from './format'
import { goalDirection, goalProgress, type HealthPlan } from './health'
import { weekStreak, type Summary } from './trends'

/**
 * Becky Boost: encouraging messages and unlockable badges, all derived from
 * the user's own weigh-ins. Tone: warm, short, never pushy.
 */

const kg = (n: number) => `${Math.abs(n).toFixed(1)} kg`

// ---------------------------------------------------------------- Today's boost

export type Boost = { title: string; detail: string }

export function getTodaysBoost(summary: Summary, health: HealthPlan, profile: Profile): Boost {
  const { count, sorted, latest, kgPerWeek } = summary

  if (count === 0 || !latest) {
    return { title: 'Welcome! Let’s get you started.', detail: 'Log a few weigh-ins this week and I’ll start spotting your trend.' }
  }

  const dir = goalDirection(profile.currentWeight, profile.targetWeight)
  if (dir === 0) {
    return { title: 'You made it!', detail: 'Switch to Maintenance in Plan to hold your goal weight.' }
  }

  // New low (or high, for a gain goal), logged in the last couple of days.
  const earlier = sorted.slice(0, -1)
  const recent = daysBetween(latest.date, todayIso()) <= 1
  if (recent && earlier.length >= 2) {
    const best = dir < 0 ? Math.min(...earlier.map((e) => e.weightKg)) : Math.max(...earlier.map((e) => e.weightKg))
    if ((dir < 0 && latest.weightKg < best) || (dir > 0 && latest.weightKg > best)) {
      return { title: dir < 0 ? 'New low! That’s your best number so far.' : 'New high! Your best number so far.', detail: 'Nice work. Keep doing what you’re doing.' }
    }
  }

  // Streak milestones.
  const streak = weekStreak(sorted)
  if ([2, 4, 8, 12, 26, 52].includes(streak)) {
    return { title: `${streak} weeks of check-ins in a row!`, detail: 'Consistency is your superpower.' }
  }

  if (kgPerWeek === null) {
    return { title: 'Nice start!', detail: 'A few more days of weigh-ins and I can tell you your pace.' }
  }

  const towardGoal = kgPerWeek * dir // positive = moving toward the goal
  const planned = Math.abs(health.weeklyChange)

  if (towardGoal <= 0.05) {
    return {
      title: 'The scale’s been flat for a while.',
      detail: 'Totally normal. Stick with your plan and give it another week before changing anything.',
    }
  }
  if (towardGoal > 1) {
    return { title: 'You’re moving fast!', detail: `Your trend is ${kg(towardGoal)}/week. A slightly milder plan might be easier to keep up.` }
  }
  if (planned > 0 && towardGoal < planned * 0.6) {
    return { title: 'A bit slower than planned, and that’s okay.', detail: `Your trend is ${kg(towardGoal)}/week. Small steps still count.` }
  }
  return { title: 'Right on track. Keep it rolling!', detail: `Your trend is ${kg(towardGoal)}/week, just as planned.` }
}

// ---------------------------------------------------------------- Badges

export type Badge = { id: string; title: string; detail: string; icon: IconName; unlocked: boolean }

/** Longest run of consecutive 7-day periods (counted from the first weigh-in) that each contain a weigh-in. */
function longestWeekStreak(sorted: WeightEntry[]) {
  if (sorted.length === 0) return 0
  const start = sorted[0]!.date
  const weeks = [...new Set(sorted.map((e) => Math.floor(daysBetween(start, e.date) / 7)))].sort((a, b) => a - b)
  let best = 1
  let run = 1
  for (let i = 1; i < weeks.length; i++) {
    run = weeks[i] === weeks[i - 1]! + 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

export function getBadges(summary: Summary, profile: Profile): Badge[] {
  const { sorted, count, first } = summary
  const start = first?.weightKg ?? profile.currentWeight
  const target = profile.targetWeight
  const dir = Math.sign(target - start) // direction of the goal from the starting point
  const weights = sorted.map((e) => e.weightKg)
  // Badges stay unlocked: use the best weight reached, not today's.
  const bestWeight = weights.length ? (dir < 0 ? Math.min(...weights) : dir > 0 ? Math.max(...weights) : weights[weights.length - 1]!) : start
  const progress = dir === 0 ? 0 : goalProgress(start, bestWeight, target)
  const kgCloser = dir === 0 ? 0 : (bestWeight - start) * dir
  const firstWeek = first ? sorted.filter((e) => daysBetween(first.date, e.date) <= 6).length : 0
  const longest = longestWeekStreak(sorted)
  // A real new best: at least 0.2 kg past every earlier weigh-in (ignores tiny day-to-day wobble).
  const hadNewLow = sorted.some((e, i) =>
    i > 0 && (dir < 0 ? e.weightKg <= Math.min(...weights.slice(0, i)) - 0.2 : dir > 0 && e.weightKg >= Math.max(...weights.slice(0, i)) + 0.2),
  )

  return [
    { id: 'first', title: 'First step', detail: 'Logged your first weigh-in', icon: 'scale', unlocked: count >= 1 },
    { id: 'going', title: 'Getting going', detail: '3 weigh-ins in your first week', icon: 'plus', unlocked: firstWeek >= 3 },
    { id: 'kg1', title: '1 kg closer', detail: 'One kilo toward your goal', icon: 'trend', unlocked: kgCloser >= 1 },
    { id: 'newbest', title: dir > 0 ? 'New high' : 'New low', detail: 'Beat your best number', icon: 'spark', unlocked: hadNewLow },
    { id: 'q25', title: 'Quarter way', detail: '25% of the way to your goal', icon: 'target', unlocked: progress >= 0.25 },
    { id: 'q50', title: 'Halfway', detail: '50% of the way to your goal', icon: 'target', unlocked: progress >= 0.5 },
    { id: 'q75', title: 'Almost there', detail: '75% of the way to your goal', icon: 'target', unlocked: progress >= 0.75 },
    { id: 'goal', title: 'Goal reached', detail: 'You hit your target weight', icon: 'check', unlocked: dir !== 0 && progress >= 1 },
    { id: 's2', title: 'On a roll', detail: '2 weeks of check-ins in a row', icon: 'calendar', unlocked: longest >= 2 },
    { id: 's4', title: 'Steady habit', detail: '4 weeks of check-ins in a row', icon: 'calendar', unlocked: longest >= 4 },
    { id: 's8', title: 'Unstoppable', detail: '8 weeks of check-ins in a row', icon: 'flame', unlocked: longest >= 8 },
  ]
}

