import { useState } from 'react'
import ProblemItem from './ProblemItem'
import MathText from './Math'

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

function NotationGuide({ open, onClose }) {
  if (!open) return null
  return (
    <div className="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 p-4 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-blue-700 dark:text-blue-300">How to type math notation</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">&times;</button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-gray-700 dark:text-gray-300">
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Exponents</span><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">x^2</code></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fractions</span><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">3/4</code></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Negative</span><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">-5x</code></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Parentheses</span><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">(x+3)(x-2)</code></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Multiplication</span><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">3x or 3*x</code></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Equals</span><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">x = 5</code></div>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tip: Answers are case-insensitive and ignore extra spaces. You don't need dollar signs or backslashes.</p>
    </div>
  )
}

export default function MonitoringProgress({ mp, maxRetries, progress = {}, onUpdateProgress, onResetAll, disputeMode }) {
  const [showGuide, setShowGuide] = useState(false)
  const safeProgress = progress || {}
  const allKeys = mp.problems.map(p => mp.id + '.' + p.num)
  const allDone = allKeys.every(k => {
    const s = safeProgress[k]
    return s && (s.status === 'correct' || s.status === 'revealed')
  })

  // Compute retry stats for completed problems
  const completedProblems = allKeys
    .map(k => safeProgress[k])
    .filter(s => s && (s.status === 'correct' || s.status === 'revealed'))
  const totalAttempts = completedProblems.reduce((sum, s) => sum + (s.attempts || 0), 0)
  const correctOnFirst = completedProblems.filter(s => s.status === 'correct' && s.attempts === 1).length
  const revealedCount = completedProblems.filter(s => s.status === 'revealed').length

  return (
    <div className="mb-6 rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 font-bold text-sm tracking-wide uppercase">Monitoring Progress</span>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            title="Notation guide"
          >
            <InfoIcon />
          </button>
        </div>
        {allDone && (
          <button
            onClick={() => onResetAll(allKeys)}
            className="text-xs px-3 py-1 rounded-full border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      <NotationGuide open={showGuide} onClose={() => setShowGuide(false)} />

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        <MathText>{mp.instruction}</MathText>
      </p>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {mp.problems.map(p => (
          <ProblemItem
            key={p.num}
            num={p.num}
            text={p.text}
            answer={p.answer}
            maxRetries={maxRetries}
            problemKey={mp.id + '.' + p.num}
            progress={safeProgress}
            onUpdateProgress={onUpdateProgress}
            disputeMode={disputeMode}
          />
        ))}
      </div>

      {completedProblems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{completedProblems.length}/{mp.problems.length} answered</span>
            <span>{totalAttempts} total {totalAttempts === 1 ? 'attempt' : 'attempts'}</span>
            {correctOnFirst > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">{correctOnFirst} correct on first try</span>
            )}
            {revealedCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400">{revealedCount} revealed</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
