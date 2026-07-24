import { createContext } from 'react'

export interface ThemeContextValue {
  theme: 'luxury'
  setTheme: (value: 'luxury') => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
