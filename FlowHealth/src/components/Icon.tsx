import type { ReactNode } from 'react'

export type IconName =
  | 'home'
  | 'chart'
  | 'target'
  | 'spark'
  | 'data'
  | 'plus'
  | 'arrow'
  | 'scale'
  | 'flame'
  | 'calendar'
  | 'trend'
  | 'check'
  | 'code'
  | 'close'
  | 'chevron'

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    home: <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9Z" />,
    chart: <path d="M4 19V9m5 10V5m6 14v-7m5 7V8" />,
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="m15 9 5-5m-1 0h1v1" />
      </>
    ),
    spark: <path d="m4 15 4-4 3 3 7-8m-4 0h4v4" />,
    data: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    scale: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M8 10a4.5 4.5 0 0 1 8 0m-4-2v3" />
      </>
    ),
    flame: <path d="M13 3c1 4-2 5-2 8 0 1.2.8 2 2 2 2 0 3-2.2 2.5-4.5 2.2 1.8 3.5 4 3.5 6.3A7 7 0 0 1 5 16c0-3.8 2.3-6.7 5.8-9.8-.2 2.8.8 3.4 2.2 4.3" />,
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4m8-4v4M4 10h16" />
      </>
    ),
    trend: <path d="m4 15 5-5 4 4 7-8m-5 0h5v5" />,
    check: <path d="m5 12.5 4.2 4.2L19 7" />,
    code: <path d="m9 7-5 5 5 5m6-10 5 5-5 5m-1-13-4 16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 6 6 6-6 6" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
