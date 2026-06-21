import type { AppData, Todo } from './types'

export function newTodo(text: string, date: string | null, categoryId: string | null): Todo {
  return {
    id: Math.random().toString(36).slice(2, 9),
    text,
    done: false,
    date,
    categoryId
  }
}

export function todosForDay(todos: Todo[], dayISO: string): Todo[] {
  return todos.filter((t) => t.date === dayISO)
}

export function backlogTodos(todos: Todo[]): Todo[] {
  return todos.filter((t) => t.date === null)
}

export function addTodo(data: AppData, todo: Todo): AppData {
  return { ...data, todos: [...data.todos, todo] }
}

export function patchTodo(data: AppData, id: string, patch: Partial<Todo>): AppData {
  return { ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
}

export function removeTodo(data: AppData, id: string): AppData {
  return { ...data, todos: data.todos.filter((t) => t.id !== id) }
}
