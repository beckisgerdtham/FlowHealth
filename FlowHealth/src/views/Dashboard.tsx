import type { Profile, WeightEntry } from '../types'
import { Icon } from '../components/Icon'
import { ProgressRing } from '../components/ProgressRing'
import { WeightChart } from '../components/WeightChart'
import {
  formatDayLabel,
  formatKg,
  formatLongToday,
  formatMonthYearShort,
  formatSignedKg,
  formatWeeks,
  greeting,
  initials,
} from '../lib/format'
import { calculateHealth, goalProgress } from '../lib/health'
import { getFlowInsight } from '../lib/insights'
import { lastDays, summarize } from '../lib/trends'

export function Dashboard({ profile, entries, onLog }: { profile: Profile; entries: WeightEntry[]; onLog: () => void }) {
  const health = calculateHealth(profile)
  const summary = summarize(entries)
  const recent = summarize(lastDays(entries, 42))
  const insight = getFlowInsight(summary, health, profile)

  const current = profile.currentWeight
  const start = summary.first?.weightKg ?? current
  const progress = goalProgress(start, current, profile.targetWeight)
  const remaining = Math.abs(current - profile.targetWeight)
  const firstName = profile.name.trim().split(/\s+/)[0] || 'there'

  const ring = health.atGoal
    ? { value: '✓', caption: 'goal reached' }
    : health.weeks !== null
      ? { value: String(Math.ceil(health.weeks)), caption: Math.ceil(health.weeks) === 1 ? 'week left' : 'weeks left' }
      : { value: `${Math.round(progress * 100)}%`, caption: 'to goal' }

  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">{formatLongToday()}</p>
          <p className="screen-title">
            {greeting()}, {firstName}
          </p>
          <p className="screen-copy">
            {summary.count < 2 ? 'Log your weight regularly to see your trend.' : 'Every check-in sharpens your trend.'}
          </p>
        </div>
        <div className="avatar">{initials(profile.name)}</div>
      </section>

      <section className="weight-hero">
        <div className="hero-heading">
          <span>Current weight</span>
          {summary.changeSincePrevious !== null && (
            <span className="success-pill">
              <Icon name="trend" /> {formatSignedKg(summary.changeSincePrevious)}
            </span>
          )}
        </div>
        <div className="hero-main">
          <div>
            <div className="big-weight">
              {current.toFixed(1)} <small>kg</small>
            </div>
            <p>{summary.latest ? `Updated ${formatDayLabel(summary.latest.date).toLowerCase()}` : 'No weigh-ins yet'}</p>
          </div>
          <ProgressRing progress={progress} value={ring.value} caption={ring.caption} />
        </div>
        <div className="hero-progress">
          <div>
            <span>Start</span>
            <strong>{formatKg(start)}</strong>
          </div>
          <div className="progress-line">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div>
            <span>Goal</span>
            <strong>{formatKg(profile.targetWeight)}</strong>
          </div>
        </div>
      </section>

      <div className="metric-row">
        <article className="metric-card">
          <span className="metric-icon mint">
            <Icon name="target" />
          </span>
          <span className="metric-label">Remaining</span>
          <strong>{formatKg(remaining)}</strong>
          <small>{health.movingTowardGoal ? `${formatWeeks(health.weeks)} remaining` : 'Plan not moving toward goal'}</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon sand">
            <Icon name="flame" />
          </span>
          <span className="metric-label">Daily target</span>
          <strong>{health.targetCalories.toLocaleString('en-GB')}</strong>
          <small>kcal per day</small>
        </article>
      </div>

      <div className="dashboard-energy-grid">
        <article>
          <span>BMR</span>
          <strong>{profile.bmr.toLocaleString('en-GB')}</strong>
          <small>kcal/day</small>
        </article>
        <article>
          <span>Maintenance</span>
          <strong>{health.tdee.toLocaleString('en-GB')}</strong>
          <small>kcal/day</small>
        </article>
        <article>
          <span>Goal date</span>
          <strong>{formatMonthYearShort(health.goalDate)}</strong>
          <small>At {Math.abs(health.weeklyChange).toFixed(1)} kg/week</small>
        </article>
      </div>

      <section className="content-card trend-preview">
        <div className="card-heading">
          <div>
            <p className="card-title">Weight trend</p>
            <p className="card-subtitle">Last 6 weeks</p>
          </div>
          {recent.totalChange !== null && <span className="trend-number">{formatSignedKg(recent.totalChange)}</span>}
        </div>
        <WeightChart entries={recent.sorted} compact />
      </section>

      <section className="insight-banner">
        <div className="insight-orb">
          <Icon name="spark" />
        </div>
        <div>
          <span className="tiny-label">FLOW INSIGHT</span>
          <p>{insight.title}</p>
          <small>{insight.detail}</small>
        </div>
      </section>

      <section className="product-overview">
        <span className="overview-mark">
          <Icon name="spark" />
        </span>
        <div>
          <span className="tiny-label">PRODUCT OVERVIEW</span>
          <p>FlowHealth helps users achieve body-weight goals using science-based calorie planning and progress tracking.</p>
        </div>
      </section>

      <button className="floating-log" onClick={onLog}>
        <Icon name="plus" /> Log weight
      </button>
    </>
  )
}
