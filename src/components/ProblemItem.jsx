import { useState } from 'react'
import MathText from './Math'

function normalizeAnswer(str) {
  return str
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\cdot/g, '*')
    .replace(/\\text\{[^}]*\}/g, '')
    .replace(/[\\{}\s]/g, '')
    .toLowerCase()
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
}

function answersMatch(userAnswer, correctAnswer) {
  const normUser = normalizeAnswer(userAnswer)
  const normCorrect = normalizeAnswer(correctAnswer)
  if (normUser === normCorrect) return true
  const stripped = correctAnswer.replace(/\$/g, '').replace(/\\/g, '').replace(/\s/g, '').toLowerCase()
  const strippedUser = userAnswer.replace(/\$/g, '').replace(/\\/g, '').replace(/\s/g, '').toLowerCase()
  return stripped === strippedUser
}

// Normalize answer prop into array of { label, value }
function toAnswerParts(answer) {
  if (Array.isArray(answer)) return answer
  return [{ label: '', value: answer }]
}

export default function ProblemItem({ num, text, answer, maxRetries, problemKey, progress, onUpdateProgress }) {
  const parts = toAnswerParts(answer)
  const saved = progress[problemKey] || { attempts: 0, status: 'unanswered', userAnswers: parts.map(() => ''), history: [] }
  const [inputs, setInputs] = useState(saved.userAnswers || parts.map(() => ''))
  const [localState, setLocalState] = useState(saved)
  const [showHistory, setShowHistory] = useState(false)

  const updateInput = (idx, val) => {
    setInputs(prev => {
      const next = [...prev]
      next[idx] = val
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputs.every(v => !v.trim())) return

    const results = parts.map((part, i) => answersMatch(inputs[i] || '', part.value))
    const allCorrect = results.every(Boolean)
    const newAttempts = localState.attempts + 1
    const cycleStart = localState.cycleStart || 0
    const cycleAttempts = newAttempts - cycleStart
    let newStatus = 'incorrect'

    if (allCorrect) {
      newStatus = 'correct'
    } else if (cycleAttempts >= maxRetries) {
      newStatus = 'revealed'
    }

    const historyEntry = { answers: [...inputs], results: [...results], correct: allCorrect }
    const history = [...(localState.history || []), historyEntry]

    const newState = { attempts: newAttempts, cycleStart, status: newStatus, userAnswers: [...inputs], results, history }
    setLocalState(newState)
    onUpdateProgress(problemKey, newState)
  }

  const handleReset = () => {
    // Keep accumulated attempts and history — only Reset All clears them
    const newState = { attempts: localState.attempts, cycleStart: localState.attempts, status: 'unanswered', userAnswers: parts.map(() => ''), results: null, history: localState.history || [] }
    setLocalState(newState)
    setInputs(parts.map(() => ''))
    onUpdateProgress(problemKey, newState)
  }

  const showAnswer = localState.status === 'correct' || localState.status === 'revealed'
  const isCorrect = localState.status === 'correct'
  const cycleAttempts = localState.attempts - (localState.cycleStart || 0)
  const retriesLeft = maxRetries - cycleAttempts
  const partResults = localState.results || null
  const isMultiPart = parts.length > 1

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <span className="font-mono text-sm text-gray-400 dark:text-gray-600 w-7 shrink-0 pt-0.5 text-right">{num}.</span>
        <div className="flex-1 min-w-0">
          <MathText className="leading-relaxed mb-2 block">{text}</MathText>

          {!showAnswer && (
            <form onSubmit={handleSubmit} className="mt-2 space-y-2">
              {parts.map((part, i) => (
                <div key={i} className="flex items-center gap-2">
                  {isMultiPart && part.label && (
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500 w-36 shrink-0 text-right">
                      {part.label}
                    </label>
                  )}
                  <input
                    type="text"
                    value={inputs[i]}
                    onChange={(e) => updateInput(i, e.target.value)}
                    placeholder={part.label ? `Enter ${part.label.toLowerCase()}...` : "Type your answer..."}
                    className={`w-full max-w-sm px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      localState.status === 'incorrect' && partResults && !partResults[i]
                        ? 'border-red-400 dark:border-red-600'
                        : localState.status === 'incorrect' && partResults && partResults[i]
                          ? 'border-emerald-400 dark:border-emerald-600'
                          : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {i === parts.length - 1 && (
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium shrink-0"
                    >
                      Check
                    </button>
                  )}
                </div>
              ))}
            </form>
          )}

          {localState.status === 'incorrect' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-red-500 dark:text-red-400">
                {partResults && partResults.some(r => r) && partResults.some(r => !r)
                  ? `Some parts are incorrect. ${retriesLeft > 0 ? `${retriesLeft} ${retriesLeft === 1 ? 'retry' : 'retries'} left.` : ''}`
                  : `Not quite. ${retriesLeft > 0 ? `${retriesLeft} ${retriesLeft === 1 ? 'retry' : 'retries'} left.` : ''}`
                }
              </span>
            </div>
          )}

          {showAnswer && (
            <div className="mt-2 space-y-2">
              {parts.map((part, i) => {
                const userVal = localState.userAnswers?.[i] || ''
                const partCorrect = partResults ? partResults[i] : isCorrect
                return (
                  <div key={i} className="space-y-1">
                    {part.label && isMultiPart && (
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{part.label}</span>
                    )}
                    <div className="flex flex-col gap-1">
                      {userVal && !partCorrect && (
                        <div className="pl-3 border-l-2 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 text-sm">
                          <span className="font-medium">Your answer: </span>{userVal}
                        </div>
                      )}
                      <div className={`pl-3 border-l-2 text-sm ${partCorrect ? 'border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400'}`}>
                        <span className="font-medium">{partCorrect ? 'Correct! ' : 'Answer: '}</span>
                        <MathText>{part.value}</MathText>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Try again
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline decoration-dotted cursor-pointer"
                  >
                    {localState.attempts === 1 ? '1 attempt used' : `${localState.attempts} attempts used`}
                  </button>
                  {showHistory && localState.history && localState.history.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-72 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Attempt History</span>
                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none">&times;</button>
                      </div>
                      <div className="space-y-1.5">
                        {localState.history.map((entry, idx) => (
                          <div
                            key={idx}
                            className={`px-2.5 py-1.5 rounded-md text-xs ${
                              entry.correct
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`font-medium ${entry.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                #{idx + 1} {entry.correct ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {entry.answers.map((a, ai) => (
                                <span key={ai}>
                                  {parts.length > 1 && parts[ai]?.label ? `${parts[ai].label}: ` : ''}
                                  <span className={entry.results[ai] ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                    {a || '(empty)'}
                                  </span>
                                  {ai < entry.answers.length - 1 ? ' · ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
