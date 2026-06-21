import type { AppData, Milestone, Project, Todo } from './types'

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function newProject(name: string): Project {
  return { id: uid(), name, color: '#FDB515', milestones: [] }
}

export function newMilestone(title: string): Milestone {
  return { id: uid(), title, dueDate: null }
}

export function addProject(data: AppData, project: Project): AppData {
  return { ...data, projects: [...data.projects, project] }
}

export function patchProject(data: AppData, id: string, patch: Partial<Project>): AppData {
  return { ...data, projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }
}

export function removeProject(data: AppData, id: string): AppData {
  return {
    ...data,
    projects: data.projects.filter((p) => p.id !== id),
    todos: data.todos.filter((t) => t.projectId !== id)
  }
}

export function addMilestone(data: AppData, projectId: string, milestone: Milestone): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId ? { ...p, milestones: [...p.milestones, milestone] } : p
    )
  }
}

export function patchMilestone(
  data: AppData,
  projectId: string,
  milestoneId: string,
  patch: Partial<Milestone>
): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, ...patch } : m))
          }
        : p
    )
  }
}

export function removeMilestone(data: AppData, projectId: string, milestoneId: string): AppData {
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === projectId
        ? { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) }
        : p
    ),
    todos: data.todos.map((t) => (t.milestoneId === milestoneId ? { ...t, milestoneId: null } : t))
  }
}

export function projectTodos(todos: Todo[], projectId: string): Todo[] {
  return todos.filter((t) => t.projectId === projectId)
}

export function progress(todos: Todo[]): { done: number; total: number; pct: number } {
  const total = todos.length
  const done = todos.filter((t) => t.done).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}
