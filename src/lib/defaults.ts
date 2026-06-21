import type { AppData, Category, Templates, TimeBlock } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#003262', description: 'Paid hourly wage', weeklyTarget: 40 },
  { id: 'research', name: 'Research', color: '#3B7EA1', description: 'Part-time PhD', weeklyTarget: 15 },
  { id: 'side-project', name: 'Side Project', color: '#00B0DA', description: 'Extra income', weeklyTarget: 8 },
  { id: 'exercise', name: 'Exercise', color: '#FDB515', description: 'Running / HIIT / weights', weeklyTarget: 10 },
  { id: 'sleeping', name: 'Sleeping', color: '#859438', description: 'Rest & recovery', weeklyTarget: 56 },
  { id: 'commuting', name: 'Daily Commuting', color: '#ED4E33', description: 'Travel time', weeklyTarget: 7 }
]

export const DEFAULT_TEMPLATES: Templates = {
  workday: { work: 8, research: 2, 'side-project': 1, exercise: 1, sleeping: 8, commuting: 1 },
  weekend: { work: 0, research: 3, 'side-project': 3, exercise: 2, sleeping: 9, commuting: 0 }
}

const H = (hours: number, minutes = 0): number => hours * 60 + minutes

export const DEFAULT_WORKDAY_BLOCKS: Omit<TimeBlock, 'id'>[] = [
  { categoryId: 'sleeping', start: H(23), end: H(7) },
  { categoryId: 'commuting', start: H(7, 30), end: H(8) },
  { categoryId: 'work', start: H(8), end: H(17) },
  { categoryId: 'commuting', start: H(17), end: H(17, 30) },
  { categoryId: 'side-project', start: H(18), end: H(19) },
  { categoryId: 'exercise', start: H(19), end: H(20) },
  { categoryId: 'research', start: H(20), end: H(22) }
]

export const DEFAULT_WEEKEND_BLOCKS: Omit<TimeBlock, 'id'>[] = [
  { categoryId: 'sleeping', start: H(23), end: H(8) },
  { categoryId: 'exercise', start: H(9), end: H(11) },
  { categoryId: 'research', start: H(11), end: H(14) },
  { categoryId: 'side-project', start: H(15), end: H(18) }
]

export const DEFAULT_DATA: AppData = {
  categories: DEFAULT_CATEGORIES,
  templates: DEFAULT_TEMPLATES,
  weeks: {},
  todos: [],
  projects: [],
  habits: []
}
