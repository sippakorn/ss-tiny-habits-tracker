import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  Target,
  CalendarRange,
  Clock,
  Flame,
  FolderKanban,
  Settings,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { View } from '@/lib/types'

const ITEMS: { id: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'goals', label: 'Weekly Goals', icon: Target },
  { id: 'planner', label: 'Weekly Planner', icon: CalendarRange },
  { id: 'daily', label: 'Daily Schedule', icon: Clock },
  { id: 'habits', label: 'Habits', icon: Flame },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export function Sidebar({
  view,
  onChange,
  onLock
}: {
  view: View
  onChange: (v: View) => void
  onLock: () => void
}): JSX.Element {
  return (
    <aside className="flex w-60 flex-shrink-0 flex-col bg-berkeley-blue p-3 text-white">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-berkeley-gold text-lg font-bold text-berkeley-blue">
          H
        </div>
        <div className="leading-tight">
          <div className="text-base font-semibold">Tiny Habits</div>
          <div className="text-[11px] text-white/60">weekly planner</div>
        </div>
      </div>
      <nav className="mt-2 flex flex-col gap-1">
        {ITEMS.map((it) => {
          const Icon = it.icon
          const active = view === it.id
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cn(
                'flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white',
                active && 'border-berkeley-gold bg-white/15 text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </button>
          )
        })}
      </nav>
      <button
        onClick={onLock}
        className="mt-auto flex items-center gap-2 rounded-md border border-white/25 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Lock className="h-4 w-4" />
        Lock app
      </button>
    </aside>
  )
}
