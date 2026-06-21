import { useEffect, useState } from 'react'
import { useSystemTheme } from '@/hooks/useTheme'
import { useAppData } from '@/hooks/useAppData'
import { applyHabitRules } from '@/lib/habits'
import { LockScreen } from '@/components/LockScreen'
import { Sidebar } from '@/components/Sidebar'
import { Dashboard } from '@/components/Dashboard'
import { WeeklyGoals } from '@/components/WeeklyGoals'
import { Planner } from '@/components/Planner'
import { Daily } from '@/components/Daily'
import { Habits } from '@/components/Habits'
import { Projects } from '@/components/Projects'
import { Settings } from '@/components/Settings'
import type { View } from '@/lib/types'

export default function App(): JSX.Element {
  useSystemTheme()
  const [unlocked, setUnlocked] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const { data, update } = useAppData()

  useEffect(() => {
    if (!data) return
    const next = applyHabitRules(data)
    if (next !== data) update(() => next)
  }, [data, update])

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />
  }

  if (!data) {
    return (
      <div className="grid h-screen place-items-center text-muted-foreground">Loading…</div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar view={view} onChange={setView} onLock={() => setUnlocked(false)} />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-8 py-8">
          {view === 'dashboard' && <Dashboard data={data} update={update} />}
          {view === 'goals' && <WeeklyGoals data={data} update={update} />}
          {view === 'planner' && <Planner data={data} update={update} />}
          {view === 'daily' && <Daily data={data} update={update} />}
          {view === 'habits' && <Habits data={data} update={update} />}
          {view === 'projects' && <Projects data={data} update={update} />}
          {view === 'settings' && <Settings data={data} update={update} />}
        </div>
      </main>
    </div>
  )
}
