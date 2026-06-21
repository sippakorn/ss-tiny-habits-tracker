import type { Habit } from '@/lib/types'
import { addDays, isoDate, startOfWeek } from '@/lib/dates'
import { ALPHAS, intensity, hexToRgba, nextValue } from '@/lib/habits'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

export function HabitTodayItem({
  habit,
  onSet,
  readOnly = false
}: {
  habit: Habit
  onSet: (day: string, value: number) => void
  readOnly?: boolean
}): JSX.Element {
  const today = isoDate(new Date())
  const v = habit.entries[today] ?? 0
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: habit.color }} />
        <span className="truncate">{habit.name}</span>
        {readOnly && (
          <span
            className="flex-shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            title="Auto-completed from linked to-dos"
          >
            auto
          </span>
        )}
      </span>
      {habit.type === 'check' ? (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onSet(today, v > 0 ? 0 : 1)}
          className={cn(
            'grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border transition-colors disabled:cursor-default',
            v > 0 ? 'border-transparent text-white' : 'border-input text-transparent hover:border-primary',
            readOnly && 'hover:border-input'
          )}
          style={v > 0 ? { background: habit.color } : undefined}
          title={readOnly ? 'Auto-completed' : 'Toggle today'}
        >
          <Check className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex flex-shrink-0 gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = v >= n
            return (
              <button
                key={n}
                type="button"
                disabled={readOnly}
                onClick={() => onSet(today, v === n ? 0 : n)}
                className={cn(
                  'h-7 w-7 rounded-md border text-xs font-medium transition-colors disabled:cursor-default',
                  active
                    ? 'border-transparent text-white'
                    : 'border-input text-muted-foreground hover:border-primary',
                  readOnly && !active && 'hover:border-input'
                )}
                style={active ? { background: habit.color } : undefined}
              >
                {n}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function HabitHeatmap({
  habit,
  onSet,
  weeks = 53
}: {
  habit: Habit
  onSet: (day: string, value: number) => void
  weeks?: number
}): JSX.Element {
  const today = new Date()
  const todayISO = isoDate(today)
  const end = startOfWeek(today)
  const start = addDays(end, -(weeks - 1) * 7)

  const cols: { day: string; month: number; future: boolean }[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: { day: string; month: number; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      col.push({
        day: isoDate(date),
        month: date.getMonth(),
        future: date.getTime() > today.getTime()
      })
    }
    cols.push(col)
  }

  let lastMonth = -1
  const monthLabels = cols.map((col) => {
    const m = col[0].month
    if (m !== lastMonth) {
      lastMonth = m
      return MONTHS[m]
    }
    return ''
  })

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[3px] pl-8 text-[10px] text-muted-foreground">
          {monthLabels.map((label, i) => (
            <div key={i} className="w-[13px] overflow-visible whitespace-nowrap">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex w-8 flex-col gap-[3px] pr-1 text-right text-[10px] text-muted-foreground">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[13px] leading-[13px]">
                {d}
              </div>
            ))}
          </div>
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell) => {
                const value = habit.entries[cell.day] ?? 0
                const level = intensity(value, habit.type)
                const isToday = cell.day === todayISO
                return (
                  <button
                    key={cell.day}
                    type="button"
                    disabled={cell.future}
                    onClick={() => onSet(cell.day, nextValue(habit.type, value))}
                    title={`${cell.day}${value ? ` · ${value}` : ''}`}
                    className={cn(
                      'h-[13px] w-[13px] rounded-[3px] border border-black/5 transition-transform hover:scale-110 disabled:cursor-default disabled:opacity-30 dark:border-white/5',
                      level === 0 && 'bg-muted',
                      isToday && 'ring-1 ring-primary ring-offset-1 ring-offset-background'
                    )}
                    style={level > 0 ? { backgroundColor: hexToRgba(habit.color, ALPHAS[level]) } : undefined}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-muted-foreground">
          Less
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <span
              key={l}
              className={cn('h-[11px] w-[11px] rounded-[3px]', l === 0 && 'bg-muted')}
              style={l > 0 ? { backgroundColor: hexToRgba(habit.color, ALPHAS[l]) } : undefined}
            />
          ))}
          More
        </div>
      </div>
    </div>
  )
}
