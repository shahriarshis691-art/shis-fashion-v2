import { createContext } from 'react'

export interface ThemeContextValue {
  theme: 'luxury' | 'midnight'
  setTheme: (value: 'luxury' | 'midnight') => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
