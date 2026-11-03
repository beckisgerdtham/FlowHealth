import { useId } from 'react'
import type { WeightEntry } from '../types'
import { daysBetween, formatDayLabel, formatKg, formatShortDate, parseIso, toIso } from '../lib/format'

const W = 340
const PAD_Y = 16

/** Line chart drawn from real weigh-ins. Expects entries sorted by date. */
export function WeightChart({ entries, compact = false }: { entries: WeightEntry[]; compact?: boolean }) {
  const gradientId = `chart-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Match the container's aspect ratio so the chart fills the card in both sizes.
  const H = compact ? 100 : 150

  if (entries.length < 2) {
    return (
      <div className={compact ? 'chart-wrap compact' : 'chart-wrap'}>
        <div className="chart-empty">Log at least two weigh-ins to see your trend.</div>
      </div>
    )
  }

  const first = entries[0]!
  const last = entries[entries.length - 1]!
  const spanDays = Math.max(1, daysBetween(first.date, last.date))
  const weights = entries.map((e) => e.weightKg)
  const min = Math.min(...weights) - 0.3
  const max = Math.max(...weights) + 0.3

  const points = entries.map((e) => ({
    x: (daysBetween(first.date, e.date) / spanDays) * W,
    y: PAD_Y + ((max - e.weightKg) / (max - min)) * (H - PAD_Y * 2),
  }))

  // Smooth curve that never overshoots: control points share each endpoint's height.
  const line = points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    const prev = points[i - 1]!
    const mid = (prev.x + p.x) / 2
    return `${d} C${mid.toFixed(1)} ${prev.y.toFixed(1)} ${mid.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }, '')
  const area = `${line} V${H} H0 Z`
  const end = points[points.length - 1]!

  const labels = [0, 1 / 3, 2 / 3, 1].map((t, i) => {
    if (i === 3) return formatDayLabel(last.date)
    const date = parseIso(first.date)
    date.setDate(date.getDate() + Math.round(spanDays * t))
    return formatShortDate(toIso(date))
  })

  return (
    <>
      <div className={compact ? 'chart-wrap compact' : 'chart-wrap'}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Weight from ${formatKg(first.weightKg)} on ${formatShortDate(first.date)} to ${formatKg(last.weightKg)} on ${formatShortDate(last.date)}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sage-500)" stopOpacity=".25" />
              <stop offset="100%" stopColor="var(--sage-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="chart-grid" d={[0.15, 0.5, 0.85].map((t) => `M0 ${(H * t).toFixed(0)}H${W}`).join('')} />
          <path className="chart-fill" fill={`url(#${gradientId})`} d={area} />
          <path className="chart-line" d={line} />
          <circle className="chart-halo" cx={end.x} cy={end.y} r="9" />
          <circle className="chart-point" cx={end.x} cy={end.y} r="4" />
        </svg>
      </div>
      <div className="chart-axis">
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </>
  )
}
