import { useMemo, useState } from 'react'
import type { AppData, WeekPlan } from '@/lib/types'
import { startOfWeek, isoDate, addDays, formatWeekRange } from '@/lib/dates'
import { getOrCreateWeek, categoryTotals, weekGoal, hasWeekGoal } from '@/lib/calc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function WeeklyGoals({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const [offset, setOffset] = useState(0)
  const base = startOfWeek(new Date())
  const weekStart = isoDate(addDays(base, offset * 7))
  const week = useMemo(() => getOrCreateWeek(weekStart, data), [weekStart, data])
  const planned = categoryTotals(week)

  function setGoal(catId: string, value: number): void {
    update((prev) => {
      const w = prev.weeks[weekStart] ?? getOrCreateWeek(weekStart, prev)
      return {
        ...prev,
        weeks: {
          ...prev.weeks,
          [weekStart]: { ...w, goals: { ...(w.goals ?? {}), [catId]: value } }
        }
      }
    })
  }

  function clearGoal(catId: string): void {
    update((prev) => {
      const w = prev.weeks[weekStart] ?? getOrCreateWeek(weekStart, prev)
      const goals = { ...(w.goals ?? {}) }
      delete goals[catId]
      return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...w, goals } } }
    })
  }

  function resetAll(): void {
    update((prev) => {
      const w = prev.weeks[weekStart] ?? getOrCreateWeek(weekStart, prev)
      const next: WeekPlan = { ...w }
      delete next.goals
      return { ...prev, weeks: { ...prev.weeks, [weekStart]: next } }
    })
  }

  function setDefault(catId: string, value: number): void {
    update((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, weeklyTarget: value } : c
      )
    }))
  }

  const totalGoal = data.categories.reduce((a, c) => a + weekGoal(week, c.id, c.weeklyTarget), 0)
  const totalDefault = data.categories.reduce((a, c) => a + c.weeklyTarget, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Goals</h1>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset to defaults
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target hours for this week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.categories.map((c) => {
            const goal = weekGoal(week, c.id, c.weeklyTarget)
            const custom = hasWeekGoal(week, c.id)
            const plan = planned[c.id] ?? 0
            const met = goal > 0 && plan >= goal
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1.6fr_110px_1.1fr_130px] items-center gap-3 max-sm:grid-cols-2"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </div>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={goal}
                  onChange={(e) => setGoal(c.id, Number(e.target.value))}
                />
                <span
                  className={met ? 'text-sm font-medium text-emerald-600' : 'text-sm text-muted-foreground'}
                >
                  {plan.toFixed(1)}h planned
                </span>
                {custom ? (
                  <Button variant="outline" size="sm" onClick={() => clearGoal(c.id)}>
                    custom · reset
                  </Button>
                ) : (
                  <Badge variant="secondary" className="justify-self-start">
                    default
                  </Badge>
                )}
              </div>
            )
          })}
          <div className="border-t pt-3 text-sm text-muted-foreground">
            Total goal: <span className="font-semibold text-foreground">{totalGoal.toFixed(1)}h</span> / 168h
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default weekly goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="-mt-2 text-sm text-muted-foreground">
            Applied to every week without a custom goal above.
          </p>
          {data.categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                {c.name}
              </div>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={c.weeklyTarget}
                onChange={(e) => setDefault(c.id, Number(e.target.value))}
                className="w-24 text-center"
              />
            </div>
          ))}
          <div className="border-t pt-3 text-sm text-muted-foreground">
            Total default goal:{' '}
            <span className="font-semibold text-foreground">{totalDefault.toFixed(1)}h</span> / 168h
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
