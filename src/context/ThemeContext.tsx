import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContextValue'

export type ThemeName = 'luxury' | 'midnight'

export interface ThemeContextValue {
  theme: ThemeName
  setTheme: (value: ThemeName) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'shis-fashion-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') {
      return 'luxury'
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    return storedTheme === 'midnight' ? 'midnight' : 'luxury'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme === 'midnight' ? 'dark' : 'light'
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (value: ThemeName) => {
    setThemeState(value)
  }

  const toggleTheme = () => {
    setThemeState((current) => (current === 'luxury' ? 'midnight' : 'luxury'))
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
