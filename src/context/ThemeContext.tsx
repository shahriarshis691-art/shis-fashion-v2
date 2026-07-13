import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeName = 'luxury' | 'midnight'

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (value: ThemeName) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'shis-fashion-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
