import { useCallback, useEffect, useState } from 'react'
import type { AppData } from '@/lib/types'
import { loadData, saveData } from '@/lib/store'

export function useAppData(): {
  data: AppData | null
  update: (updater: (prev: AppData) => AppData) => void
} {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    setData(loadData())
  }, [])

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev
      const next = updater(prev)
      saveData(next)
      return next
    })
  }, [])

  return { data, update }
}
