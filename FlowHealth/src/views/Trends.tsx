import { useState } from 'react'
import type { WeightEntry } from '../types'
import { Icon } from '../components/Icon'
import { WeightChart } from '../components/WeightChart'
import { formatDayLabel, formatKg, formatSignedKg, formatSpan, parseIso } from '../lib/format'
import { lastDays, rangeDays, summarize, type Range } from '../lib/trends'

const RANGES: Range[] = ['1M', '3M', '6M', '1Y']
const PREVIEW_ROWS = 7

export function Trends({
  entries,
  onDelete,
}: {
  entries: WeightEntry[]
  onDelete: (id: string) => void
}) {
  const [range, setRange] = useState<Range>('3M')
  const [showAll, setShowAll] = useState(false)

  const all = summarize(entries)
  const inRange = summarize(lastDays(entries, rangeDays[range]))
  const history = [...all.sorted].reverse()
  const visible = showAll ? history : history.slice(0, PREVIEW_ROWS)

  return (
    <>
      <section className="page-head">
        <p className="eyebrow">YOUR PROGRESS</p>
        <p className="screen-title">Weight trends</p>
        <p className="screen-copy">See the signal beyond daily fluctuations.</p>
      </section>

      {all.count === 0 ? (
        <section className="content-card empty-state">
          <p className="card-title">No weigh-ins yet</p>
          <p className="card-subtitle">Log your weight on the Today screen to start your history.</p>
        </section>
      ) : (
        <>
          <div className="range-tabs">
            {RANGES.map((item) => (
              <button key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>
                {item}
              </button>
            ))}
          </div>
          <section className="content-card chart-card">
            <div className="chart-summary">
              <div>
                <span>Average weight</span>
                <strong>
                  {inRange.average !== null ? inRange.average.toFixed(1) : '—'} <small>kg</small>
                </strong>
              </div>
              <div>
                <span>Total change</span>
                <strong className="positive">{inRange.totalChange !== null ? formatSignedKg(inRange.totalChange) : '—'}</strong>
              </div>
            </div>
            <WeightChart entries={inRange.sorted} />
          </section>
          <div className="metric-row triple">
            <article className="mini-stat">
              <span>Weekly trend</span>
              <strong>{inRange.kgPerWeek !== null ? formatSignedKg(inRange.kgPerWeek) : '—'}</strong>
              <small>{inRange.kgPerWeek !== null ? 'per week' : 'Needs ~1 week'}</small>
            </article>
            <article className="mini-stat">
              <span>Lowest</span>
              <strong>{inRange.lowest ? formatKg(inRange.lowest.weightKg) : '—'}</strong>
              <small>{inRange.lowest ? formatDayLabel(inRange.lowest.date) : ''}</small>
            </article>
            <article className="mini-stat">
              <span>Entries</span>
              <strong>{inRange.count}</strong>
              <small>{formatSpan(inRange.spanDays)}</small>
            </article>
          </div>

          <section className="content-card history">
            <div className="card-heading">
              <p className="card-title">Weight history</p>
              {history.length > PREVIEW_ROWS && (
                <button className="text-button" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show less' : `View all (${history.length})`}
                </button>
              )}
            </div>
            {visible.map((entry) => {
              const index = all.sorted.indexOf(entry)
              const prev = index > 0 ? all.sorted[index - 1] : null
              const year = parseIso(entry.date).getFullYear()
              const label = formatDayLabel(entry.date) + (year !== new Date().getFullYear() ? ` ${year}` : '')
              return (
                <div className="history-row with-actions" key={entry.id}>
                  <span className="history-dot">
                    <span />
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <small>{entry.note || new Date(entry.loggedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                  <div className="history-value">
                    <strong>{formatKg(entry.weightKg)}</strong>
                    <small>{prev ? formatSignedKg(entry.weightKg - prev.weightKg) : 'Starting point'}</small>
                  </div>
                  <button className="icon-button" aria-label={`Delete entry ${label}`} onClick={() => onDelete(entry.id)}>
                    <Icon name="close" />
                  </button>
                </div>
              )
            })}
          </section>
        </>
      )}
    </>
  )
}
