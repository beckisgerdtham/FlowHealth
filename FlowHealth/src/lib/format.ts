const LOCALE = 'en-GB'
export const DAY_MS = 24 * 60 * 60 * 1000

const pad = (n: number) => String(n).padStart(2, '0')

/** Parse YYYY-MM-DD as a local date (at noon, to stay clear of DST edges). */
export function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const todayIso = () => toIso(new Date())

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + Math.round(days))
  return next
}

export function daysBetween(fromIso: string, toIsoDate: string) {
  return Math.round((parseIso(toIsoDate).getTime() - parseIso(fromIso).getTime()) / DAY_MS)
}

export const formatShortDate = (iso: string) =>
  parseIso(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })

export function formatDayLabel(iso: string) {
  const diff = daysBetween(iso, todayIso())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return formatShortDate(iso)
}

export const formatMonthYear = (date: Date | null) =>
  date ? date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }) : '—'

export const formatMonthYearShort = (date: Date | null) =>
  date ? date.toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' }) : '—'

export const formatLongToday = () =>
  new Date().toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()

export const round1 = (n: number) => Math.round(n * 10) / 10

export const formatKg = (n: number) => `${n.toFixed(1)} kg`

/** −0.4 kg / +0.4 kg / 0.0 kg (uses a real minus sign). */
export function formatSignedKg(n: number) {
  const r = round1(n)
  if (r === 0) return '0.0 kg'
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(1)} kg`
}

export function formatWeeks(weeks: number | null) {
  if (weeks === null) return '—'
  const w = Math.ceil(weeks)
  return `${w} ${w === 1 ? 'week' : 'weeks'}`
}

export function formatSpan(days: number) {
  if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'}`
  return `${Math.round(days / 7)} weeks`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

/** Accepts both "84.2" and the Swedish "84,2". Returns NaN for empty input. */
export function parseDecimal(value: string) {
  const cleaned = value.replace(',', '.').trim()
  return cleaned === '' ? NaN : Number(cleaned)
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
