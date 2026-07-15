import React, { createContext, useContext, useEffect, useState } from 'react'
import { generateAccentRamp } from '../utils/theme.js'

const THEME_KEY = 'synapse:theme'
const EMBER_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

const DEFAULT_PREFS = { theme: 'dark', accent: 'orange', customColor: '#D9722E' }

function loadPrefs() {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch (e) { /* ignore */ }
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches
  return { ...DEFAULT_PREFS, theme: prefersLight ? 'light' : 'dark' }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme)
    document.documentElement.setAttribute('data-accent', prefs.accent)

    // Custom accent colors don't have a stylesheet ramp, so generate one
    // from the picked hex and apply it as inline vars (these win over the
    // [data-accent] rules automatically). Any other accent clears them so
    // the built-in stylesheet ramps take back over.
    if (prefs.accent === 'custom' && prefs.customColor) {
      const ramp = generateAccentRamp(prefs.customColor)
      EMBER_STEPS.forEach(step => document.documentElement.style.setProperty(`--ember-${step}`, ramp[step]))
    } else {
      EMBER_STEPS.forEach(step => document.documentElement.style.removeProperty(`--ember-${step}`))
    }

    localStorage.setItem(THEME_KEY, JSON.stringify(prefs))
  }, [prefs])

  const setTheme = (theme) => setPrefs(p => ({ ...p, theme }))
  const setAccent = (accent) => setPrefs(p => ({ ...p, accent }))
  const setCustomColor = (customColor) => setPrefs(p => ({ ...p, accent: 'custom', customColor }))
  const toggleTheme = () => setPrefs(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))

  return (
    <ThemeContext.Provider value={{ ...prefs, setTheme, setAccent, setCustomColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
