const CIRCUMFERENCE = 2 * Math.PI * 47

export function ProgressRing({ progress, value, caption }: { progress: number; value: string; caption: string }) {
  const clamped = Math.min(1, Math.max(0, progress))
  return (
    <div className="progress-ring" aria-label={`${value} ${caption}, ${Math.round(clamped * 100)}% of the way to your goal`}>
      <svg viewBox="0 0 110 110">
        <circle className="ring-track" cx="55" cy="55" r="47" />
        {clamped > 0 && (
        <circle
          className="ring-progress"
          cx="55"
          cy="55"
          r="47"
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE * (1 - clamped) }}
        />
        )}
      </svg>
      <div className="ring-label">
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </div>
  )
}
