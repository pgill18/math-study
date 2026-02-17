import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('mathStudyTheme') || 'dark'
    } catch { return 'dark' }
  })

  useEffect(() => {
    try { localStorage.setItem('mathStudyTheme', theme) } catch {}
  }, [theme])

  return { theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}
