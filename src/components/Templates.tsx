import type { AppData, DayType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function Templates({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  function setVal(type: DayType, catId: string, value: number): void {
    update((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [type]: { ...prev.templates[type], [catId]: value }
      }
    }))
  }

  const types: DayType[] = ['workday', 'weekend']

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Defaults applied when a new week is created.
      </p>

      <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
        {types.map((t) => {
          const total = data.categories.reduce((a, c) => a + (data.templates[t][c.id] || 0), 0)
          return (
            <Card key={t}>
              <CardHeader>
                <CardTitle>{t === 'workday' ? 'Workday (Mon–Fri)' : 'Weekend (Sat–Sun)'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={data.templates[t][c.id] ?? 0}
                      onChange={(e) => setVal(t, c.id, Number(e.target.value))}
                      className="w-20 text-center"
                    />
                  </div>
                ))}
                <div className="border-t pt-3 text-sm text-muted-foreground">
                  Total:{' '}
                  <span className={cn('font-semibold text-foreground', total > 24 && 'text-destructive')}>
                    {total.toFixed(1)}h
                  </span>{' '}
                  / 24h
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
