import { useMemo, useState, type FormEvent } from 'react'
import type { AppData, Todo } from '@/lib/types'
import { startOfWeek, isoDate, formatWeekRange, formatDayLabel, shiftISODay, DAY_NAMES } from '@/lib/dates'
import { getOrCreateWeek, categoryTotals, dayTotal, weekGoal } from '@/lib/calc'
import { minutesToTime } from '@/lib/time'
import { newTodo, todosForDay, addTodo, patchTodo, removeTodo } from '@/lib/todos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setEntry, effectiveRule } from '@/lib/habits'
import { TodoItem } from '@/components/TodoItem'
import { TodoModal, type TodoFields } from '@/components/TodoModal'
import { HabitTodayItem } from '@/components/HabitControls'

export function Dashboard({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const weekStart = isoDate(startOfWeek(new Date()))
  const week = useMemo(() => getOrCreateWeek(weekStart, data), [weekStart, data])
  const totals = categoryTotals(week)
  const weekTotal = week.days.reduce((a, d) => a + dayTotal(d), 0)

  const todayISO = isoDate(new Date())
  const todayIdx = (new Date().getDay() + 6) % 7
  const todayBlocks = [...(week.days[todayIdx].blocks ?? [])].sort((a, b) => a.start - b.start)
  const catMap = Object.fromEntries(data.categories.map((c) => [c.id, c]))
  const todayTodos = todosForDay(data.todos, todayISO)
  const openCount = todayTodos.filter((t) => !t.done).length

  const [todoText, setTodoText] = useState('')
  const [modalTodo, setModalTodo] = useState<Partial<Todo> | null>(null)

  function addToday(e: FormEvent): void {
    e.preventDefault()
    if (!todoText.trim()) return
    update((prev) => addTodo(prev, newTodo(todoText.trim(), todayISO, null)))
    setTodoText('')
  }

  function saveTodo(fields: TodoFields): void {
    const cur = modalTodo
    if (cur && cur.id) {
      const id = cur.id
      update((p) => patchTodo(p, id, fields))
    } else {
      update((p) =>
        addTodo(p, { id: Math.random().toString(36).slice(2, 9), done: false, ...fields })
      )
    }
    setModalTodo(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <span className="text-sm text-muted-foreground">{formatWeekRange(weekStart)}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&rsquo;s focus — {formatDayLabel(todayISO)}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Schedule
            </h3>
            {todayBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled today.</p>
            ) : (
              <div className="space-y-1.5">
                {todayBlocks.map((b) => {
                  const c = catMap[b.categoryId]
                  return (
                    <div key={b.id} className="flex items-center gap-2 text-sm">
                      <span className="w-[104px] flex-shrink-0 tabular-nums text-muted-foreground">
                        {minutesToTime(b.start)}–{minutesToTime(b.end)}
                      </span>
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: c?.color ?? '#94a3b8' }}
                      />
                      <span className="truncate">{c?.name ?? 'Unknown'}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              To-dos {openCount > 0 && <span className="text-foreground">({openCount} open)</span>}
            </h3>
            <div className="space-y-2">
              {todayTodos.length === 0 && (
                <p className="text-sm text-muted-foreground">No to-dos for today.</p>
              )}
              {todayTodos.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  categories={data.categories}
                  showDate={false}
                  onOpen={() => setModalTodo(t)}
                  onToggle={() => update((p) => patchTodo(p, t.id, { done: !t.done }))}
                  onText={(v) => update((p) => patchTodo(p, t.id, { text: v }))}
                  onDate={(d) => update((p) => patchTodo(p, t.id, { date: d }))}
                  onTomorrow={() =>
                    update((p) => patchTodo(p, t.id, { date: shiftISODay(todayISO, 1) }))
                  }
                  onBacklog={() => update((p) => patchTodo(p, t.id, { date: null }))}
                  onDelete={() => update((p) => removeTodo(p, t.id))}
                />
              ))}
              <form onSubmit={addToday} className="flex gap-2 pt-1">
                <Input
                  placeholder="Add a to-do for today…"
                  value={todoText}
                  onChange={(e) => setTodoText(e.target.value)}
                />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-3xl font-bold text-primary">{weekTotal.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Planned hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-3xl font-bold">{Math.max(0, 168 - weekTotal).toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Unplanned hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-3xl font-bold">{data.categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
      </div>

      {data.habits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Habits today</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 max-md:grid-cols-1">
            {data.habits.map((h) => (
              <HabitTodayItem
                key={h.id}
                habit={h}
                readOnly={!!effectiveRule(h)}
                onSet={(day, v) => update((p) => setEntry(p, h.id, day, v))}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Targets vs Planned</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.categories.map((c) => {
            const planned = totals[c.id] ?? 0
            const goal = weekGoal(week, c.id, c.weeklyTarget)
            const pct = goal > 0 ? Math.min(100, (planned / goal) * 100) : 0
            const diff = planned - goal
            return (
              <div
                key={c.id}
                className="grid grid-cols-[150px_1fr_150px] items-center gap-4 max-sm:grid-cols-[110px_1fr]"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: c.color }}
                  />
                </div>
                <div className="text-right text-sm text-muted-foreground max-sm:col-span-2 max-sm:text-left">
                  {planned.toFixed(1)} / {goal}h{' '}
                  <span
                    className={
                      diff >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-destructive'
                    }
                  >
                    {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hours per day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-3">
            {week.days.map((d, i) => {
              const t = dayTotal(d)
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                  <div className="flex w-3/5 flex-1 items-end overflow-hidden rounded-md bg-muted">
                    <div
                      className="w-full rounded-t-md bg-primary transition-all"
                      style={{ height: `${Math.min(100, (t / 24) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{DAY_NAMES[i]}</div>
                  <div className="text-xs font-semibold">{t.toFixed(0)}h</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
                  update((p) => removeTodo(p, id))
                  setModalTodo(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
