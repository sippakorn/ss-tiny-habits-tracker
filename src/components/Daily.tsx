import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { AppData, TimeBlock, Todo } from '@/lib/types'
import { startOfWeek, isoDate, addDays, formatWeekRange, shiftISODay, DAY_NAMES } from '@/lib/dates'
import { getOrCreateWeek, blockDurationHours } from '@/lib/calc'
import { minutesToTime, timeToMinutes } from '@/lib/time'
import { todosForDay, backlogTodos, addTodo, patchTodo, removeTodo } from '@/lib/todos'
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
import { TodoItem } from '@/components/TodoItem'
import { TodoModal, type TodoFields } from '@/components/TodoModal'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

const HOUR_PX = 40

export function Daily({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const [offset, setOffset] = useState(0)
  const [dayIdx, setDayIdx] = useState(() => (new Date().getDay() + 6) % 7)
  const [editingId, setEditingId] = useState<string | null>(null)
  const dragRef = useRef<{
    id: string
    edge: 'start' | 'end'
    startY: number
    origStart: number
    origEnd: number
    moved: boolean
  } | null>(null)
  const suppressClickRef = useRef(false)
  const [modalTodo, setModalTodo] = useState<Partial<Todo> | null>(null)
  const base = startOfWeek(new Date())
  const weekStart = isoDate(addDays(base, offset * 7))
  const week = useMemo(() => getOrCreateWeek(weekStart, data), [weekStart, data])
  const day = week.days[dayIdx]
  const blocks = day.blocks ?? []
  const dayISO = shiftISODay(weekStart, dayIdx)
  const dayTodos = todosForDay(data.todos, dayISO)
  const backlog = backlogTodos(data.todos)

  function saveTodo(fields: TodoFields): void {
    const cur = modalTodo
    if (cur && cur.id) {
      const id = cur.id
      update((p) => patchTodo(p, id, fields))
    } else {
      update((p) => addTodo(p, { id: uid(), done: false, ...fields }))
    }
    setModalTodo(null)
  }

  const catMap = useMemo(
    () => Object.fromEntries(data.categories.map((c) => [c.id, c])),
    [data.categories]
  )

  function writeBlocks(next: TimeBlock[]): void {
    update((prev) => {
      const w = prev.weeks[weekStart] ?? getOrCreateWeek(weekStart, prev)
      const days = w.days.map((d, i) => (i === dayIdx ? { ...d, blocks: next } : d))
      return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...w, days } } }
    })
  }

  function addBlock(): void {
    const catId = data.categories[0]?.id ?? ''
    writeBlocks([...blocks, { id: uid(), categoryId: catId, start: 9 * 60, end: 10 * 60 }])
  }

  function patchBlock(id: string, patch: Partial<TimeBlock>): void {
    writeBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function removeBlock(id: string): void {
    writeBlocks(blocks.filter((b) => b.id !== id))
  }

  const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

  function startResize(e: ReactPointerEvent<HTMLDivElement>, b: TimeBlock, edge: 'start' | 'end'): void {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: b.id,
      edge,
      startY: e.clientY,
      origStart: b.start,
      origEnd: b.end,
      moved: false
    }
  }

  function onResizeMove(e: ReactPointerEvent<HTMLDivElement>): void {
    const d = dragRef.current
    if (!d) return
    const deltaMin = Math.round((((e.clientY - d.startY) / HOUR_PX) * 60) / 15) * 15
    if (deltaMin !== 0) d.moved = true
    const wasOvernight = d.origEnd <= d.origStart
    if (d.edge === 'start') {
      const ns = wasOvernight
        ? clamp(d.origStart + deltaMin, 0, 1425)
        : clamp(d.origStart + deltaMin, 0, d.origEnd - 15)
      patchBlock(d.id, { start: ns })
    } else {
      const ne = wasOvernight
        ? clamp(d.origEnd + deltaMin, 15, 1439)
        : clamp(d.origEnd + deltaMin, d.origStart + 15, 1439)
      patchBlock(d.id, { end: ne })
    }
  }

  function endResize(e: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const moved = dragRef.current.moved
    dragRef.current = null
    if (moved) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }
  }

  const segments = blocks.flatMap((b) => {
    const color = catMap[b.categoryId]?.color ?? '#94a3b8'
    const name = catMap[b.categoryId]?.name ?? 'Unknown'
    if (b.end > b.start) {
      return [
        { key: b.id, block: b, color, name, top: b.start, height: b.end - b.start, startHandle: true, endHandle: true }
      ]
    }
    return [
      { key: `${b.id}-pm`, block: b, color, name, top: b.start, height: 1440 - b.start, startHandle: true, endHandle: false },
      { key: `${b.id}-am`, block: b, color, name, top: 0, height: b.end, startHandle: false, endHandle: true }
    ]
  })

  const editingBlock = blocks.find((b) => b.id === editingId) ?? null

  const totals: Record<string, number> = {}
  for (const b of blocks) {
    totals[b.categoryId] = (totals[b.categoryId] ?? 0) + blockDurationHours(b)
  }
  const scheduled = Object.values(totals).reduce((a, n) => a + n, 0)
  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Daily Schedule</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setOffset(offset - 1)}>
            <ChevronLeft />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-medium">
            {formatWeekRange(weekStart)}
          </span>
          <Button variant="outline" size="icon" onClick={() => setOffset(offset + 1)}>
            <ChevronRight />
          </Button>
          {offset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
              This week
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {DAY_NAMES.map((d, i) => (
          <button
            key={i}
            onClick={() => setDayIdx(i)}
            className={cn(
              'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
              i === dayIdx && 'border-primary text-primary'
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        Tip: click a block to edit it, or drag its top/bottom edge to resize (15-min steps).
      </p>

      <div className="grid grid-cols-[300px_1fr] gap-6 max-md:grid-cols-1">
        <Card className="p-4">
          <div className="relative ml-[52px] border-l" style={{ height: `${24 * HOUR_PX}px` }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-border"
                style={{ top: `${h * HOUR_PX}px` }}
              >
                <span className="absolute -left-[50px] -top-2 w-11 text-right text-[11px] text-muted-foreground">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
            {segments.map((s) => (
              <div
                key={s.key}
                onClick={() => {
                  if (!suppressClickRef.current) setEditingId(s.block.id)
                }}
                className="group absolute inset-x-2 cursor-pointer overflow-hidden rounded-md px-2 py-1 text-[11px] font-semibold text-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md hover:ring-2 hover:ring-white/60"
                style={{
                  top: `${(s.top / 60) * HOUR_PX}px`,
                  height: `${(s.height / 60) * HOUR_PX}px`,
                  background: s.color,
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                }}
                title={`${s.name} · ${minutesToTime(s.block.start)}–${minutesToTime(s.block.end)} — click to edit, drag edges to resize`}
              >
                {s.startHandle && (
                  <div
                    onPointerDown={(e) => startResize(e, s.block, 'start')}
                    onPointerMove={onResizeMove}
                    onPointerUp={endResize}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-x-0 top-0 z-10 flex h-2.5 cursor-ns-resize items-start justify-center"
                  >
                    <div className="mt-0.5 h-1 w-8 rounded-full bg-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                )}
                <span className="pointer-events-none block truncate">{s.name}</span>
                {s.height >= 28 && (
                  <span className="pointer-events-none block truncate text-[10px] font-normal text-white/85">
                    {minutesToTime(s.block.start)}–{minutesToTime(s.block.end)}
                  </span>
                )}
                {s.endHandle && (
                  <div
                    onPointerDown={(e) => startResize(e, s.block, 'end')}
                    onPointerMove={onResizeMove}
                    onPointerUp={endResize}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-x-0 bottom-0 z-10 flex h-2.5 cursor-ns-resize items-end justify-center"
                  >
                    <div className="mb-0.5 h-1 w-8 rounded-full bg-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Time blocks</CardTitle>
              <Button size="sm" onClick={addBlock}>
                <Plus /> Add block
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sorted.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No time blocks yet. Add one to schedule your day.
                </p>
              )}
              {sorted.length > 0 && (
                <div className="grid grid-cols-[minmax(0,1fr)_8rem_0.75rem_8rem_2.5rem_2.25rem] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Activity</span>
                  <span>Start</span>
                  <span />
                  <span>End</span>
                  <span />
                  <span />
                </div>
              )}
              {sorted.map((b) => {
                const overnight = b.end <= b.start
                return (
                  <div
                    key={b.id}
                    className="grid grid-cols-[minmax(0,1fr)_8rem_0.75rem_8rem_2.5rem_2.25rem] items-center gap-2"
                  >
                    <Select
                      value={b.categoryId}
                      onValueChange={(v) => patchBlock(b.id, { categoryId: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {data.categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={minutesToTime(b.start)}
                      onChange={(e) => patchBlock(b.id, { start: timeToMinutes(e.target.value) })}
                      className="w-full px-2"
                    />
                    <span className="text-center text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={minutesToTime(b.end)}
                      onChange={(e) => patchBlock(b.id, { end: timeToMinutes(e.target.value) })}
                      className="w-full px-2"
                    />
                    <div className="flex justify-center">
                      {overnight && (
                        <span
                          className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          title="Crosses midnight into the next day"
                        >
                          +1d
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="justify-self-end text-muted-foreground hover:text-destructive"
                      onClick={() => removeBlock(b.id)}
                    >
                      <X />
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>To-dos for {DAY_NAMES[dayIdx]}</CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  setModalTodo({ date: dayISO, categoryId: data.categories[0]?.id ?? null })
                }
              >
                <Plus /> Add to-do
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayTodos.length === 0 && (
                <p className="text-sm text-muted-foreground">No to-dos for this day yet.</p>
              )}
              {dayTodos.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  categories={data.categories}
                  onOpen={() => setModalTodo(t)}
                  onToggle={() => update((p) => patchTodo(p, t.id, { done: !t.done }))}
                  onText={(v) => update((p) => patchTodo(p, t.id, { text: v }))}
                  onDate={(d) => update((p) => patchTodo(p, t.id, { date: d }))}
                  onTomorrow={() => update((p) => patchTodo(p, t.id, { date: shiftISODay(dayISO, 1) }))}
                  onBacklog={() => update((p) => patchTodo(p, t.id, { date: null }))}
                  onDelete={() => update((p) => removeTodo(p, t.id))}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled vs planned</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.categories.map((c) => {
                const sched = totals[c.id] ?? 0
                const plan = day.allocations[c.id] ?? 0
                if (sched === 0 && plan === 0) return null
                const matched = Math.abs(sched - plan) < 0.05
                return (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className={matched ? 'text-emerald-600' : 'text-muted-foreground'}>
                      {sched.toFixed(1)}h scheduled / {plan}h planned
                    </span>
                  </div>
                )
              })}
              <div className="border-t pt-3 text-sm text-muted-foreground">
                Total scheduled:{' '}
                <span className={cn('font-semibold text-foreground', scheduled > 24 && 'text-destructive')}>
                  {scheduled.toFixed(1)}h
                </span>{' '}
                / 24h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backlog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {backlog.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Backlog is empty. Send a to-do here to deal with it later.
                </p>
              ) : (
                backlog.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    categories={data.categories}
                    onOpen={() => setModalTodo(t)}
                    onToggle={() => update((p) => patchTodo(p, t.id, { done: !t.done }))}
                    onText={(v) => update((p) => patchTodo(p, t.id, { text: v }))}
                    onDate={(d) => update((p) => patchTodo(p, t.id, { date: d }))}
                    onTomorrow={() => update((p) => patchTodo(p, t.id, { date: dayISO }))}
                    onBacklog={() => update((p) => patchTodo(p, t.id, { date: null }))}
                    onDelete={() => update((p) => removeTodo(p, t.id))}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingBlock && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setEditingId(null)}
        >
          <Card className="w-[340px]" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Edit time block</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                <X />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Activity</span>
                <Select
                  value={editingBlock.categoryId}
                  onValueChange={(v) => patchBlock(editingBlock.id, { categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Start</span>
                  <Input
                    type="time"
                    value={minutesToTime(editingBlock.start)}
                    onChange={(e) => patchBlock(editingBlock.id, { start: timeToMinutes(e.target.value) })}
                  />
                </div>
                <span className="pb-2 text-muted-foreground">–</span>
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">End</span>
                  <Input
                    type="time"
                    value={minutesToTime(editingBlock.end)}
                    onChange={(e) => patchBlock(editingBlock.id, { end: timeToMinutes(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold">{blockDurationHours(editingBlock).toFixed(2)} h</span>
              </div>
              {editingBlock.end <= editingBlock.start && (
                <p className="text-xs text-muted-foreground">
                  This block crosses midnight into the next day (+1d).
                </p>
              )}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  removeBlock(editingBlock.id)
                  setEditingId(null)
                }}
              >
                Delete block
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
