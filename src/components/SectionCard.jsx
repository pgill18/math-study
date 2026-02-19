import { useMemo } from 'react'
import { Link } from 'react-router-dom'

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)

function computeScore(attempts, correctionScore) {
  if (attempts <= 0) return null
  if (attempts === 1) return 1
  switch (correctionScore) {
    case '0': return 0
    case '1': return 1
    case '0.5': return 0.5
    case 'half_n': return Math.pow(0.5, attempts - 1)
    default: return 0
  }
}

function formatScore(score) {
  if (score === null) return '—'
  if (score === 1) return '1'
  if (score === 0) return '0'
  return score.toFixed(3).replace(/\.?0+$/, '')
}

export default function SectionCard({ section, isReviewed, problems, onReport, settings }) {
  const correctionScore = settings?.correctionScore || '0'
  const showEdgeCases = settings?.showEdgeCases === true
  const showCornerCases = settings?.showCornerCases === true

  const { totalProblems, correctCount, percent, earned, scorePercent } = useMemo(() => {
    let total = 0
    let correct = 0
    let pts = 0

    function processMpList(mpList) {
      if (!mpList) return
      mpList.forEach(mp => {
        mp.problems.forEach(p => {
          total++
          const key = mp.id + '.' + p.num
          const state = problems[key]
          if (state && state.status === 'correct') {
            correct++
            let attempts = state.attempts || 1
            if (state.history && state.history.length > 0) {
              const idx = state.history.findIndex(h => h.correct)
              if (idx >= 0) attempts = idx + 1
            }
            let s = computeScore(attempts, correctionScore)
            if (s !== null) {
              if (state.hintUsed) s = Math.max(0, s - 0.25)
              if (state.automationUsed) s = Math.max(0, s - (state.automationDeduction || 0.5))
              pts += s
            }
          }
        })
      })
    }

    processMpList(section.monitoringProgress)
    if (showEdgeCases) processMpList(section.edgeCases)
    if (showCornerCases) processMpList(section.cornerCases)

    return {
      totalProblems: total,
      correctCount: correct,
      percent: total > 0 ? Math.round((correct / total) * 100) : 0,
      earned: pts,
      scorePercent: total > 0 ? Math.round((pts / total) * 100) : 0,
    }
  }, [section, problems, correctionScore, showEdgeCases, showCornerCases])

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
          {correctCount > 0 && (
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-gray-400 dark:text-gray-600">
                Score: <span className={`font-medium ${scorePercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500'}`}>{formatScore(earned)}/{totalProblems}</span>
              </span>
              <span className={`font-bold ${scorePercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500'}`}>
                {scorePercent}%
              </span>
            </div>
          )}
        </div>
      )}
      {totalProblems > 0 && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReport(section) }}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
        >
          <ReportIcon /> View Report
        </button>
      )}
    </Link>
  )
}
