import { useState, useCallback } from 'react'

const STORAGE_KEY = 'mathStudyProgress'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { reviewed: {}, problems: {} }
    const data = JSON.parse(raw)
    return { reviewed: data.reviewed || {}, problems: data.problems || {} }
  } catch { return { reviewed: {}, problems: {} } }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export function useProgress() {
  const [state, setState] = useState(load)

  const toggleReviewed = useCallback((sectionId) => {
    setState(prev => {
      const next = { ...prev, reviewed: { ...prev.reviewed, [sectionId]: !prev.reviewed[sectionId] } }
      save(next)
      return next
    })
  }, [])

  const updateProblem = useCallback((problemKey, data) => {
    setState(prev => {
      const next = { ...prev, problems: { ...prev.problems, [problemKey]: data } }
      save(next)
      return next
    })
  }, [])

  const resetProblems = useCallback((keys) => {
    setState(prev => {
      const problems = { ...prev.problems }
      keys.forEach(k => { delete problems[k] })
      const next = { ...prev, problems }
      save(next)
      return next
    })
  }, [])

  const reviewedCount = Object.values(state.reviewed).filter(Boolean).length

  return { ...state, toggleReviewed, updateProblem, resetProblems, reviewedCount }
}
