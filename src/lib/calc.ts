import type { AppData, DayPlan, DayType, TimeBlock, WeekPlan } from './types'
import { DEFAULT_WORKDAY_BLOCKS, DEFAULT_WEEKEND_BLOCKS } from './defaults'

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function dayTypeFor(index: number): DayType {
  return index >= 5 ? 'weekend' : 'workday'
}

export function createWeek(weekStart: string, data: AppData): WeekPlan {
  const days: DayPlan[] = []
  for (let i = 0; i < 7; i++) {
    const dayType = dayTypeFor(i)
    const template = dayType === 'workday' ? data.templates.workday : data.templates.weekend
    const blockTemplate = dayType === 'workday' ? DEFAULT_WORKDAY_BLOCKS : DEFAULT_WEEKEND_BLOCKS
    days.push({
      dayType,
      allocations: { ...template },
      blocks: blockTemplate.map((b) => ({ ...b, id: uid() }))
    })
  }
  return { weekStart, days }
}

export function getOrCreateWeek(weekStart: string, data: AppData): WeekPlan {
  return data.weeks[weekStart] ?? createWeek(weekStart, data)
}

export function categoryTotals(week: WeekPlan): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const day of week.days) {
    for (const [cat, hrs] of Object.entries(day.allocations)) {
      totals[cat] = (totals[cat] ?? 0) + (hrs || 0)
    }
  }
  return totals
}

export function dayTotal(day: DayPlan): number {
  return Object.values(day.allocations).reduce((a, b) => a + (b || 0), 0)
}

/** Duration of a time block in hours, accounting for blocks that cross midnight. */
export function blockDurationHours(b: TimeBlock): number {
  const minutes = b.end > b.start ? b.end - b.start : 1440 - b.start + b.end
  return minutes / 60
}

/** Effective weekly goal for a category: week override if set, else the global default. */
export function weekGoal(week: WeekPlan, categoryId: string, fallback: number): number {
  return week.goals?.[categoryId] ?? fallback
}

export function hasWeekGoal(week: WeekPlan, categoryId: string): boolean {
  return week.goals?.[categoryId] !== undefined
}
