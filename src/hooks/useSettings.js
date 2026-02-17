import { useState, useCallback } from 'react'

const STORAGE_KEY = 'mathStudySettings'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { maxRetries: 2, theme: 'dark', showCore: true, showExamples: true, showRealLife: true }
  } catch { return { maxRetries: 2, theme: 'dark', showCore: true, showExamples: true, showRealLife: true } }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates }
      save(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
