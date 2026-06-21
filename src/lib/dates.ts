export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday .. 6 = Saturday
  const diff = (day === 0 ? -6 : 1) - day // shift back to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Shift an ISO day string by a number of days, returning a new ISO day string. */
export function shiftISODay(iso: string, delta: number): string {
  return isoDate(addDays(parseISO(iso), delta))
}

/** Human-friendly weekday + date label for an ISO day string. */
export function formatDayLabel(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6)
  const fmt = (d: Date): string =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
}
