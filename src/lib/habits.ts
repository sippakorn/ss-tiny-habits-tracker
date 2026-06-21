import type { AppData, Habit, HabitRule, HabitType, Todo } from './types'
import { addDays, isoDate } from './dates'

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

/** Alpha levels 0..5 used to shade heatmap cells. */
export const ALPHAS = [0, 0.25, 0.4, 0.55, 0.75, 1]

export function newHabit(name: string, type: HabitType, color: string): Habit {
  return { id: uid(), name, type, color, entries: {} }
}

export function addHabit(data: AppData, habit: Habit): AppData {
  return { ...data, habits: [...data.habits, habit] }
}

export function patchHabit(data: AppData, id: string, patch: Partial<Habit>): AppData {
  return { ...data, habits: data.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) }
}

export function removeHabit(data: AppData, id: string): AppData {
  return { ...data, habits: data.habits.filter((h) => h.id !== id) }
}

export function setEntry(data: AppData, id: string, day: string, value: number): AppData {
  return {
    ...data,
    habits: data.habits.map((h) => {
      if (h.id !== id) return h
      const entries = { ...h.entries }
      if (value <= 0) delete entries[day]
      else entries[day] = value
      return { ...h, entries }
    })
  }
}

export function maxValue(type: HabitType): number {
  return type === 'scale' ? 5 : 1
}

/** Cycle a value on click: 0 -> 1 -> ... -> max -> 0. */
export function nextValue(type: HabitType, current: number): number {
  const max = maxValue(type)
  return current >= max ? 0 : current + 1
}

/** Heatmap intensity level 0..5 for a logged value. */
export function intensity(value: number, type: HabitType): number {
  if (value <= 0) return 0
  if (type === 'check') return 5
  return Math.min(5, Math.max(1, value))
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** The active auto-rule for a habit, migrating the legacy `autoCategoryId`. */
export function effectiveRule(habit: Habit): HabitRule | null {
  if (habit.autoRule) return habit.autoRule
  if (habit.autoCategoryId) return { kind: 'category', id: habit.autoCategoryId }
  return null
}

function matchesRule(todo: Todo, rule: HabitRule): boolean {
  return rule.kind === 'category' ? todo.categoryId === rule.id : todo.projectId === rule.id
}

/** Map a completion ratio (0..1) to a stored value for the habit type. */
function valueForRatio(type: HabitType, done: number, total: number): number {
  if (total === 0 || done === 0) return 0
  const ratio = done / total
  if (type === 'check') return ratio >= 1 ? 1 : 0
  return Math.max(1, Math.round(ratio * 5))
}

/**
 * Apply habit auto-rules. For each habit with a rule, any day (up to today) that
 * has matching to-dos is "governed": the entry is set to a value weighted by the
 * share of those to-dos completed (scale: 1..5; checkbox: done only when all are
 * complete), or cleared when none are done. Returns the same reference when
 * nothing changes (loop-safe).
 */
export function applyHabitRules(data: AppData): AppData {
  const today = isoDate(new Date())
  let changed = false

  const habits = data.habits.map((habit) => {
    const rule = effectiveRule(habit)
    if (!rule) return habit

    const byDate: Record<string, { total: number; done: number }> = {}
    for (const t of data.todos) {
      if (!t.date || t.date > today || !matchesRule(t, rule)) continue
      const e = byDate[t.date] ?? { total: 0, done: 0 }
      e.total++
      if (t.done) e.done++
      byDate[t.date] = e
    }

    const entries = { ...habit.entries }
    let localChanged = false
    for (const [date, { total, done }] of Object.entries(byDate)) {
      const desired = valueForRatio(habit.type, done, total)
      const cur = entries[date] ?? 0
      if (desired === 0) {
        if (date in entries) {
          delete entries[date]
          localChanged = true
        }
      } else if (cur !== desired) {
        entries[date] = desired
        localChanged = true
      }
    }

    if (localChanged) {
      changed = true
      return { ...habit, entries }
    }
    return habit
  })

  return changed ? { ...data, habits } : data
}

/** Consecutive-day streak ending today (today may still be unlogged). */
export function currentStreak(habit: Habit): number {
  let streak = 0
  let d = new Date()
  if (!(habit.entries[isoDate(d)] > 0)) d = addDays(d, -1)
  while (habit.entries[isoDate(d)] > 0) {
    streak++
    d = addDays(d, -1)
  }
  return streak
}
