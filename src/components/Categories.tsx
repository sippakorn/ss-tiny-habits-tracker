import { useState, type FormEvent } from 'react'
import type { AppData, Category } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function Categories({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#003262')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState(0)

  function addCategory(e: FormEvent): void {
    e.preventDefault()
    if (!name.trim()) return
    const cat: Category = {
      id: uid(),
      name: name.trim(),
      color,
      description,
      weeklyTarget: target
    }
    update((prev) => ({ ...prev, categories: [...prev.categories, cat] }))
    setName('')
    setDescription('')
    setTarget(0)
  }

  function updateCat(id: string, patch: Partial<Category>): void {
    update((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }))
  }

  function removeCat(id: string): void {
    update((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={addCategory}
            className="grid grid-cols-[1.4fr_56px_2fr_120px_auto] items-center gap-3 max-md:grid-cols-2"
          >
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1"
              title="Color"
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="Target h/wk"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.categories.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[56px_1.4fr_2fr_120px_auto] items-center gap-3 max-md:grid-cols-2"
            >
              <input
                type="color"
                value={c.color}
                onChange={(e) => updateCat(c.id, { color: e.target.value })}
                className="h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input value={c.name} onChange={(e) => updateCat(c.id, { name: e.target.value })} />
              <Input
                value={c.description}
                onChange={(e) => updateCat(c.id, { description: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step={0.5}
                value={c.weeklyTarget}
                onChange={(e) => updateCat(c.id, { weeklyTarget: Number(e.target.value) })}
              />
              <Button variant="outline" size="icon" onClick={() => removeCat(c.id)} title="Delete">
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
