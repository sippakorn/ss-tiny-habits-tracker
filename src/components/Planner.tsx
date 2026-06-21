import { useMemo, useState } from 'react'
import type { AppData, DayType } from '@/lib/types'
import { startOfWeek, isoDate, addDays, formatWeekRange, DAY_NAMES } from '@/lib/dates'
import { getOrCreateWeek, dayTotal, createWeek } from '@/lib/calc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Planner({
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

  function setCell(dayIdx: number, catId: string, value: number): void {
    update((prev) => {
      const w = prev.weeks[weekStart] ?? getOrCreateWeek(weekStart, prev)
      const days = w.days.map((d, i) =>
        i === dayIdx ? { ...d, allocations: { ...d.allocations, [catId]: value } } : d
      )
      return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...w, days } } }
    })
  }

  function setDayType(dayIdx: number, dayType: DayType): void {
    update((prev) => {
      const w = prev.weeks[weekStart] ?? getOrCreateWeek(weekStart, prev)
      const tmpl = dayType === 'workday' ? prev.templates.workday : prev.templates.weekend
      const days = w.days.map((d, i) =>
        i === dayIdx ? { ...d, dayType, allocations: { ...tmpl } } : d
      )
      return { ...prev, weeks: { ...prev.weeks, [weekStart]: { ...w, days } } }
    })
  }

  function resetWeek(): void {
    update((prev) => ({
      ...prev,
      weeks: { ...prev.weeks, [weekStart]: createWeek(weekStart, prev) }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Planner</h1>
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
          <Button variant="ghost" size="sm" onClick={resetWeek}>
            Reset from templates
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky left-0 z-10 bg-muted/60 p-2 text-left font-semibold">
                Category
              </th>
              {week.days.map((d, i) => (
                <th key={i} className="p-2 text-center font-semibold">
                  <div className="mb-1">{DAY_NAMES[i]}</div>
                  <Select
                    value={d.dayType}
                    onValueChange={(v) => setDayType(i, v as DayType)}
                  >
                    <SelectTrigger className="mx-auto h-7 w-[104px] text-xs font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workday">Workday</SelectItem>
                      <SelectItem value="weekend">Weekend</SelectItem>
                    </SelectContent>
                  </Select>
                </th>
              ))}
              <th className="p-2 text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c) => {
              const rowTotal = week.days.reduce((a, d) => a + (d.allocations[c.id] || 0), 0)
              return (
                <tr key={c.id} className="border-t">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-card p-2 text-left font-medium">
                    <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: c.color }} />
                    {c.name}
                  </td>
                  {week.days.map((d, i) => (
                    <td key={i} className="p-1 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={d.allocations[c.id] ?? 0}
                        onChange={(e) => setCell(i, c.id, Number(e.target.value))}
                        className="mx-auto h-8 w-16 px-1 text-center"
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold">{rowTotal.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/60 font-semibold">
              <td className="sticky left-0 z-10 bg-muted/60 p-2 text-left">Day total</td>
              {week.days.map((d, i) => {
                const t = dayTotal(d)
                return (
                  <td key={i} className={cn('p-2 text-center', t > 24 && 'text-destructive')}>
                    {t.toFixed(1)}
                  </td>
                )
              })}
              <td className="p-2 text-center">
                {week.days.reduce((a, d) => a + dayTotal(d), 0).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  )
}
