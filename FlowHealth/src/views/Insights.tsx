import type { Profile, WeightEntry } from '../types'
import { Icon } from '../components/Icon'
import { formatDayLabel, formatMonthYear, formatSignedKg, formatSpan, formatWeeks } from '../lib/format'
import { calculateHealth, goalProgress } from '../lib/health'
import { getForecast } from '../lib/insights'
import { checkInConsistency, summarize, weekStreak } from '../lib/trends'

const pct = (n: number | null) => (n === null ? null : Math.round(n * 100))

export function Insights({ profile, entries }: { profile: Profile; entries: WeightEntry[] }) {
  const health = calculateHealth(profile)
  const summary = summarize(entries)
  const forecast = getForecast(summary, health, profile)

  const consistency = pct(checkInConsistency(summary.sorted))
  const pace =
    summary.kgPerWeek !== null && health.weeklyChange !== 0
      ? Math.max(0, Math.round((summary.kgPerWeek / health.weeklyChange) * 100))
      : null
  const progress = pct(goalProgress(summary.first?.weightKg ?? profile.currentWeight, profile.currentWeight, profile.targetWeight))
  const streak = weekStreak(summary.sorted)

  const scores = [consistency, pace === null ? null : Math.min(pace, 100)].filter((n): n is number => n !== null)
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  const momentum = avg === null ? 'Building' : avg >= 80 ? 'Strong' : avg >= 50 ? 'Steady' : 'Building'

  const meters = [
    { label: 'Check-in consistency', value: consistency, hint: 'Weeks with at least one weigh-in' },
    { label: 'Goal pace', value: pace, hint: 'Actual trend compared with your plan' },
    { label: 'Progress to goal', value: progress, hint: 'From your first weigh-in' },
  ]

  return (
    <>
      <section className="page-head">
        <p className="eyebrow">HEALTH INTELLIGENCE</p>
        <p className="screen-title">Insights</p>
        <p className="screen-copy">Patterns and predictions shaped by your data.</p>
      </section>
      <section className="forecast-card">
        <span className="tiny-label">WEIGHT FORECAST</span>
        <p className="forecast-title">{forecast.title}</p>
        {forecast.date && <div className="forecast-date">{formatMonthYear(forecast.date)}</div>}
        <div className="confidence">
          <span>
            <i />
          </span>{' '}
          {forecast.basis}
        </div>
        <svg className="forecast-art" viewBox="0 0 200 90" aria-hidden="true">
          <path d="M4 20c35 7 46 15 72 22s41 12 64 23 36 15 56 17" />
          <path className="forecast-dash" d="M4 28c35 7 46 15 72 22s41 12 64 23 36 9 56 10" />
        </svg>
      </section>
      <section className="content-card">
        <div className="card-heading">
          <p className="card-title">Your momentum</p>
          <span className="success-pill dark">
            <Icon name="trend" /> {momentum}
          </span>
        </div>
        <div className="momentum-grid">
          {meters.map((m) => (
            <div key={m.label} title={m.hint}>
              <span>{m.label}</span>
              <strong>{m.value === null ? '—' : `${m.value}%`}</strong>
              <div className="meter">
                <i style={{ width: `${Math.min(100, m.value ?? 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="section-label">RECENT MILESTONES</p>
      <div className="milestone-list">
        {summary.totalChange !== null && summary.first && (
          <article>
            <span className="milestone-icon">
              <Icon name="check" />
            </span>
            <div>
              <strong>{formatSignedKg(summary.totalChange)} since start</strong>
              <p>
                From {summary.first.weightKg.toFixed(1)} kg over {formatSpan(summary.spanDays)}, moving toward {profile.targetWeight} kg.
              </p>
            </div>
            <small>{summary.latest ? formatDayLabel(summary.latest.date) : ''}</small>
          </article>
        )}
        {streak > 0 && (
          <article>
            <span className="milestone-icon soft">
              <Icon name="calendar" />
            </span>
            <div>
              <strong>
                {streak}-week streak
              </strong>
              <p>You’ve logged at least once a week for {streak === 1 ? 'the past week' : `${streak} weeks in a row`}.</p>
            </div>
            <small>Ongoing</small>
          </article>
        )}
        <article>
          <span className="milestone-icon warm">
            <Icon name="target" />
          </span>
          <div>
            <strong>{health.atGoal ? 'Goal reached' : health.movingTowardGoal ? `${formatWeeks(health.weeks)} remaining` : 'Plan needs adjusting'}</strong>
            <p>
              {health.atGoal
                ? 'Switch to Maintenance in Plan to hold your weight.'
                : health.movingTowardGoal
                  ? `Your plan projects ${formatMonthYear(health.goalDate)}.`
                  : 'Your calorie target doesn’t move you toward your goal.'}
            </p>
          </div>
          <small>Plan</small>
        </article>
      </div>
    </>
  )
}
