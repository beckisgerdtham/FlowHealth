import type { Profile, WeightEntry } from '../types'
import { Icon } from '../components/Icon'
import { formatMonthYear } from '../lib/format'
import { getBadges } from '../lib/boosts'
import { calculateHealth, goalProgress } from '../lib/health'
import { getForecast } from '../lib/insights'
import { checkInConsistency, summarize, weekStreak } from '../lib/trends'

const pct = (n: number | null) => (n === null ? null : Math.round(n * 100))

/** The "Boost" tab: forecast, boost meter and unlockable badges. */
export function Insights({ profile, entries }: { profile: Profile; entries: WeightEntry[] }) {
  const health = calculateHealth(profile)
  const summary = summarize(entries)
  const forecast = getForecast(summary, health, profile)
  const badges = getBadges(summary, profile)
  const unlocked = badges.filter((b) => b.unlocked)
  const nextUp = badges.find((b) => !b.unlocked)

  const consistency = pct(checkInConsistency(summary.sorted))
  const pace =
    summary.kgPerWeek !== null && health.weeklyChange !== 0
      ? Math.max(0, Math.round((summary.kgPerWeek / health.weeklyChange) * 100))
      : null
  const progress = pct(goalProgress(summary.first?.weightKg ?? profile.currentWeight, profile.currentWeight, profile.targetWeight))
  const streak = weekStreak(summary.sorted)

  const scores = [consistency, pace === null ? null : Math.min(pace, 100)].filter((n): n is number => n !== null)
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  const level = avg === null ? 'Building' : avg >= 80 ? 'Strong' : avg >= 50 ? 'Steady' : 'Building'

  const meters = [
    { label: 'Check-ins', value: consistency, hint: 'Weeks with at least one weigh-in' },
    { label: 'Pace vs plan', value: pace, hint: 'Your actual trend compared with your plan' },
    { label: 'Progress to goal', value: progress, hint: 'From your first weigh-in' },
  ]

  return (
    <>
      <section className="page-head">
        <p className="eyebrow">BECKY BOOST</p>
        <p className="screen-title">Your boost</p>
        <p className="screen-copy">Where you’re heading, and everything you’ve achieved so far.</p>
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
          <div>
            <p className="card-title">Boost meter</p>
            <p className="card-subtitle">{streak > 0 ? `${streak}-week check-in streak` : 'Log a weigh-in to start a streak'}</p>
          </div>
          <span className="success-pill dark">
            <Icon name="trend" /> {level}
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

      <div className="badges-head">
        <p className="section-label">YOUR BOOSTS</p>
        <span>
          {unlocked.length} of {badges.length} unlocked
        </span>
      </div>
      {nextUp && (
        <div className="next-boost">
          <span className="badge-icon">
            <Icon name={nextUp.icon} />
          </span>
          <div>
            <small>NEXT UP</small>
            <strong>{nextUp.title}</strong>
            <p>{nextUp.detail}</p>
          </div>
        </div>
      )}
      <div className="badge-grid">
        {badges.map((b) => (
          <article key={b.id} className={b.unlocked ? 'badge unlocked' : 'badge'} aria-label={`${b.title}: ${b.unlocked ? 'unlocked' : 'locked'}`}>
            <span className="badge-icon">
              <Icon name={b.unlocked ? b.icon : 'lock'} />
            </span>
            <strong>{b.title}</strong>
            <small>{b.detail}</small>
          </article>
        ))}
      </div>
    </>
  )
}
