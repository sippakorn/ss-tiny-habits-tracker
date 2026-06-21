import { useEffect } from 'react'

/** Applies the OS light/dark preference by toggling the `dark` class, live. */
export function useSystemTheme(): void {
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (dark: boolean): void => {
      document.documentElement.classList.toggle('dark', dark)
    }
    apply(mql.matches)
    const listener = (e: MediaQueryListEvent): void => apply(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])
}
