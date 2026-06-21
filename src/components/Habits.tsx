import { useState, type FormEvent } from 'react'
import type { AppData, HabitType } from '@/lib/types'
import {
  newHabit,
  addHabit,
  patchHabit,
  removeHabit,
  setEntry,
  currentStreak,
  effectiveRule
} from '@/lib/habits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { HabitTodayItem, HabitHeatmap } from '@/components/HabitControls'
import { Flame, Trash2 } from 'lucide-react'

const NONE = '__none__'

export function Habits({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const [name, setName] = useState('')
  const [type, setType] = useState<HabitType>('check')
  const [color, setColor] = useState('#107e3e')

  function add(e: FormEvent): void {
    e.preventDefault()
    if (!name.trim()) return
    update((d) => addHabit(d, newHabit(name.trim(), type, color)))
    setName('')
  }

  const setVal = (id: string, day: string, value: number): void =>
    update((d) => setEntry(d, id, day, value))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add a tiny habit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="e.g. Read research paper 30 min"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-[220px] flex-1"
            />
            <Select value={type} onValueChange={(v) => setType(v as HabitType)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check">Checkbox</SelectItem>
                <SelectItem value="scale">Scale (1–5)</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-11 cursor-pointer rounded-md border border-input bg-background p-1"
              title="Color"
            />
            <Button type="submit">Add habit</Button>
          </form>
        </CardContent>
      </Card>

      {data.habits.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No habits yet. Add a tiny habit you want to build — like “Don’t drink sweet” or “Go to
            bed on time”.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Log today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.habits.map((h) => (
              <HabitTodayItem
                key={h.id}
                habit={h}
                readOnly={!!effectiveRule(h)}
                onSet={(day, v) => setVal(h.id, day, v)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {data.habits.map((h) => {
        const streak = currentStreak(h)
        return (
          <Card key={h.id}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={h.color}
                  onChange={(e) => update((d) => patchHabit(d, h.id, { color: e.target.value }))}
                  className="h-8 w-9 flex-shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                />
                <Input
                  value={h.name}
                  onChange={(e) => update((d) => patchHabit(d, h.id, { name: e.target.value }))}
                  className="flex-1 font-semibold"
                />
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {h.type === 'scale' ? 'Scale 1–5' : 'Checkbox'}
                </span>
                {streak > 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium text-orange-500">
                    <Flame className="h-4 w-4" />
                    {streak}d
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update((d) => removeHabit(d, h.id))}
                  title="Delete habit"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Auto-complete from completed to-dos in:</span>
                <Select
                  value={(() => {
                    const r = effectiveRule(h)
                    return r ? `${r.kind}:${r.id}` : NONE
                  })()}
                  onValueChange={(v) =>
                    update((d) =>
                      patchHabit(d, h.id, {
                        autoCategoryId: null,
                        autoRule:
                          v === NONE
                            ? null
                            : { kind: v.split(':')[0] as 'category' | 'project', id: v.split(':')[1] }
                      })
                    )
                  }
                >
                  <SelectTrigger className="h-7 w-[190px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Manual</SelectItem>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
                      {data.categories.map((c) => (
                        <SelectItem key={c.id} value={`category:${c.id}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {data.projects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Projects</SelectLabel>
                        {data.projects.map((p) => (
                          <SelectItem key={p.id} value={`project:${p.id}`}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <HabitHeatmap habit={h} onSet={(day, v) => setVal(h.id, day, v)} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
