export type View =
  | 'dashboard'
  | 'goals'
  | 'planner'
  | 'daily'
  | 'habits'
  | 'projects'
  | 'settings'

export type HabitType = 'check' | 'scale'

export interface HabitRule {
  kind: 'category' | 'project'
  id: string
}

export interface Habit {
  id: string
  name: string
  type: HabitType
  color: string
  /** ISO day (YYYY-MM-DD) -> value. check: 1; scale: 1..5. Absent = not done. */
  entries: Record<string, number>
  /**
   * Optional auto-rule. When set, each day's value is derived from the share of
   * that source's to-dos completed (scale habits are weighted 1..5; checkbox
   * habits complete only when all are done).
   */
  autoRule?: HabitRule | null
  /** @deprecated legacy field, superseded by autoRule (kept for migration). */
  autoCategoryId?: string | null
}

export type DayType = 'workday' | 'weekend'

export interface Category {
  id: string
  name: string
  color: string
  description: string
  /** Default target hours allocated to this category per week. */
  weeklyTarget: number
}

export interface TimeBlock {
  id: string
  categoryId: string
  /** Minutes from midnight, 0..1439. */
  start: number
  /** Minutes from midnight, 1..1439. If end <= start the block runs past midnight. */
  end: number
}

export interface DayPlan {
  dayType: DayType
  /** categoryId -> hours allocated that day. */
  allocations: Record<string, number>
  /** Concrete time-of-day blocks for the day (may cross midnight). */
  blocks?: TimeBlock[]
}

export interface WeekPlan {
  /** ISO date (YYYY-MM-DD) of the Monday that starts the week. */
  weekStart: string
  /** Always length 7, ordered Monday..Sunday. */
  days: DayPlan[]
  /** Optional per-week target hours, categoryId -> hours (falls back to category default). */
  goals?: Record<string, number>
}

export interface Templates {
  workday: Record<string, number>
  weekend: Record<string, number>
}

export interface Todo {
  id: string
  text: string
  done: boolean
  /** ISO day (YYYY-MM-DD) this to-do is scheduled for, or null for the backlog. */
  date: string | null
  /** Associated activity/category, or null if unassigned. */
  categoryId: string | null
  /** Optional long-form notes in Markdown. */
  details?: string
  /** Optional free-form tags. */
  tags?: string[]
  /** Owning project, if this to-do belongs to one. */
  projectId?: string | null
  /** Owning milestone within the project, if any. */
  milestoneId?: string | null
}

export interface Milestone {
  id: string
  title: string
  /** ISO day (YYYY-MM-DD) the milestone is due, or null. */
  dueDate: string | null
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  milestones: Milestone[]
}

export interface AppData {
  categories: Category[]
  templates: Templates
  /** weekStart (ISO) -> WeekPlan */
  weeks: Record<string, WeekPlan>
  todos: Todo[]
  projects: Project[]
  habits: Habit[]
}
