import { useMemo } from 'react'
import { Link } from 'react-router-dom'

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function SectionCard({ section, isReviewed, problems }) {
  const { totalProblems, correctCount, percent } = useMemo(() => {
    let total = 0
    let correct = 0
    section.monitoringProgress.forEach(mp => {
      mp.problems.forEach(p => {
        total++
        const key = mp.id + '.' + p.num
        const state = problems[key]
        if (state && state.status === 'correct') correct++
      })
    })
    return { totalProblems: total, correctCount: correct, percent: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }, [section, problems])

  const isComplete = percent === 100
  const borderClass = isComplete
    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'

  return (
    <Link
      to={`/section/${section.id}`}
      className={`group block p-5 rounded-xl border hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-200 ${borderClass}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-orange-500 dark:text-orange-400">
          {section.id}
        </span>
        {(isReviewed || isComplete) && (
          <span className="text-emerald-500"><CheckIcon /></span>
        )}
      </div>
      <h3 className="font-semibold text-base mb-1 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
        {section.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        {section.coreConcepts.length > 0
          ? `${section.coreConcepts.length} Core Concept${section.coreConcepts.length > 1 ? 's' : ''}`
          : ''}
        {section.coreConcepts.length > 0 && section.monitoringProgress.length > 0 ? ' · ' : ''}
        {totalProblems > 0
          ? `${totalProblems} Problems`
          : ''}
      </p>
      {totalProblems > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={percent > 0 ? (isComplete ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400') : 'text-gray-400 dark:text-gray-600'}>
              {correctCount}/{totalProblems} correct
            </span>
            <span className={isComplete ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'}>
              {percent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : percent > 0 ? 'bg-orange-500' : ''}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  )
}
