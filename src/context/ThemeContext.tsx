import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContextValue'

const STORAGE_KEY = 'shis-fashion-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'luxury'>(() => {
    if (typeof window === 'undefined') {
      return 'luxury'
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    return storedTheme === 'luxury' ? 'luxury' : 'luxury'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = 'light'
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (value: 'luxury') => {
    setThemeState(value)
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
