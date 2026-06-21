import { useState } from 'react'
import type { AppData, Milestone, Todo } from '@/lib/types'
import { isoDate } from '@/lib/dates'
import {
  newProject,
  newMilestone,
  addProject,
  patchProject,
  removeProject,
  addMilestone,
  patchMilestone,
  removeMilestone,
  projectTodos,
  progress
} from '@/lib/projects'
import { addTodo, patchTodo, removeTodo } from '@/lib/todos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { TodoModal, type TodoFields } from '@/components/TodoModal'
import { Check, FileText, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NONE = '__none__'

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function ProgressBar({ done, total }: { done: number; total: number }): JSX.Element {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 flex-shrink-0 text-right text-xs text-muted-foreground">
        {done}/{total} ({pct}%)
      </span>
    </div>
  )
}

export function Projects({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const projects = data.projects
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null)
  const [newName, setNewName] = useState('')
  const [newMs, setNewMs] = useState('')
  const [todoInputs, setTodoInputs] = useState<Record<string, string>>({})
  const [modalTodo, setModalTodo] = useState<Partial<Todo> | null>(null)

  const today = isoDate(new Date())
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null
  const allTodos = selected ? projectTodos(data.todos, selected.id) : []

  function createProject(): void {
    const name = newName.trim()
    if (!name) return
    const p = newProject(name)
    update((d) => addProject(d, p))
    setSelectedId(p.id)
    setNewName('')
  }

  function createMilestone(): void {
    if (!selected) return
    const title = newMs.trim()
    if (!title) return
    update((d) => addMilestone(d, selected.id, newMilestone(title)))
    setNewMs('')
  }

  function createTodo(milestoneId: string | null): void {
    if (!selected) return
    const key = milestoneId ?? NONE
    const text = (todoInputs[key] ?? '').trim()
    if (!text) return
    update((d) =>
      addTodo(d, {
        id: uid(),
        text,
        done: false,
        date: null,
        categoryId: null,
        projectId: selected.id,
        milestoneId
      })
    )
    setTodoInputs((s) => ({ ...s, [key]: '' }))
  }

  function saveTodo(fields: TodoFields): void {
    const cur = modalTodo
    if (cur && cur.id) {
      const id = cur.id
      update((d) => patchTodo(d, id, fields))
    }
    setModalTodo(null)
  }

  function renderRow(todo: Todo): JSX.Element {
    return (
      <div key={todo.id} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => update((d) => patchTodo(d, todo.id, { done: !todo.done }))}
          className={cn(
            'grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border transition-colors',
            todo.done
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input hover:border-primary'
          )}
        >
          {todo.done && <Check className="h-3.5 w-3.5" />}
        </button>
        <input
          value={todo.text}
          onChange={(e) => update((d) => patchTodo(d, todo.id, { text: e.target.value }))}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-sm outline-none',
            todo.done && 'text-muted-foreground line-through'
          )}
        />
        {selected && selected.milestones.length > 0 && (
          <Select
            value={todo.milestoneId ?? NONE}
            onValueChange={(v) =>
              update((d) => patchTodo(d, todo.id, { milestoneId: v === NONE ? null : v }))
            }
          >
            <SelectTrigger className="h-8 w-[150px] flex-shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No milestone</SelectItem>
              {selected.milestones.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="date"
          value={todo.date ?? ''}
          onChange={(e) => update((d) => patchTodo(d, todo.id, { date: e.target.value || null }))}
          className="h-8 w-[150px] flex-shrink-0"
          title="Schedule to pick up later"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setModalTodo(todo)}
          title="Details & tags"
        >
          <FileText />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => update((d) => removeTodo(d, todo.id))}
          title="Delete"
        >
          <X />
        </Button>
      </div>
    )
  }

  function renderGroup(milestone: Milestone | null): JSX.Element {
    const mId = milestone?.id ?? null
    const todos = allTodos.filter((t) => (t.milestoneId ?? null) === mId)
    const pr = progress(todos)
    const key = mId ?? NONE
    const overdue = !!milestone?.dueDate && milestone.dueDate < today && pr.pct < 100

    return (
      <Card key={key}>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            {milestone ? (
              <>
                <Input
                  value={milestone.title}
                  onChange={(e) =>
                    update((d) => patchMilestone(d, selected!.id, milestone.id, { title: e.target.value }))
                  }
                  className="flex-1 font-semibold"
                />
                <Input
                  type="date"
                  value={milestone.dueDate ?? ''}
                  onChange={(e) =>
                    update((d) =>
                      patchMilestone(d, selected!.id, milestone.id, { dueDate: e.target.value || null })
                    )
                  }
                  className={cn('w-[160px]', overdue && 'border-destructive text-destructive')}
                  title="Milestone due date"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update((d) => removeMilestone(d, selected!.id, milestone.id))}
                  title="Delete milestone"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </>
            ) : (
              <CardTitle className="flex-1">Unassigned</CardTitle>
            )}
          </div>
          {overdue && <span className="text-xs font-medium text-destructive">Overdue</span>}
          <ProgressBar done={pr.done} total={pr.total} />
        </CardHeader>
        <CardContent className="space-y-2">
          {todos.length === 0 && <p className="text-sm text-muted-foreground">No to-dos yet.</p>}
          {todos.map((t) => renderRow(t))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createTodo(mId)
            }}
            className="flex gap-2 pt-1"
          >
            <Input
              placeholder="Add a to-do…"
              value={todoInputs[key] ?? ''}
              onChange={(e) => setTodoInputs((s) => ({ ...s, [key]: e.target.value }))}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const overall = progress(allTodos)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>

      <div className="flex gap-6 max-md:flex-col">
        <aside className="w-60 flex-shrink-0 space-y-2 max-md:w-full">
          <div className="flex gap-2">
            <Input
              placeholder="New project"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createProject()
              }}
            />
            <Button size="icon" onClick={createProject} title="Create project">
              <Plus />
            </Button>
          </div>
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
          {projects.map((p) => {
            const pr = progress(projectTodos(data.todos, p.id))
            const active = selected?.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                  active && 'border-primary bg-accent'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="truncate text-sm font-medium">{p.name}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar done={pr.done} total={pr.total} />
                </div>
              </button>
            )
          })}
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          {!selected ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Create a project to start planning milestones and to-dos.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => update((d) => patchProject(d, selected.id, { color: e.target.value }))}
                      className="h-9 w-11 flex-shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                      title="Project color"
                    />
                    <Input
                      value={selected.name}
                      onChange={(e) => update((d) => patchProject(d, selected.id, { name: e.target.value }))}
                      className="flex-1 text-lg font-semibold"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        update((d) => removeProject(d, selected.id))
                        setSelectedId(null)
                      }}
                      title="Delete project"
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={selected.description ?? ''}
                    onChange={(e) => update((d) => patchProject(d, selected.id, { description: e.target.value }))}
                  />
                  <div>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Overall progress
                    </div>
                    <ProgressBar done={overall.done} total={overall.total} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Input
                  placeholder="New milestone…"
                  value={newMs}
                  onChange={(e) => setNewMs(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createMilestone()
                  }}
                />
                <Button onClick={createMilestone}>
                  <Plus /> Add milestone
                </Button>
              </div>

              {selected.milestones.map((m) => renderGroup(m))}
              {renderGroup(null)}
            </>
          )}
        </div>
      </div>

      {modalTodo && (
        <TodoModal
          initial={modalTodo}
          categories={data.categories}
          onClose={() => setModalTodo(null)}
          onSubmit={saveTodo}
          onDelete={
            modalTodo.id
              ? () => {
                  const id = modalTodo.id as string
                  update((d) => removeTodo(d, id))
                  setModalTodo(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
