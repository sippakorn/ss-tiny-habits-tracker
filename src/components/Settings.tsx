import { useState } from 'react'
import type { AppData } from '@/lib/types'
import { Categories } from '@/components/Categories'
import { Templates } from '@/components/Templates'
import { cn } from '@/lib/utils'

type SectionId = 'categories' | 'templates'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'categories', label: 'Categories' },
  { id: 'templates', label: 'Day Templates' }
]

export function Settings({
  data,
  update
}: {
  data: AppData
  update: (u: (p: AppData) => AppData) => void
}): JSX.Element {
  const [section, setSection] = useState<SectionId>('categories')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="flex flex-wrap gap-1 border-b">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
              section === s.id && 'border-primary text-primary'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'categories' && <Categories data={data} update={update} />}
      {section === 'templates' && <Templates data={data} update={update} />}
    </div>
  )
}
