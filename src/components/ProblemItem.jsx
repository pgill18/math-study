import { useState, useEffect, useRef } from 'react'
import MathText from './Math'

function normalizeAnswer(str) {
  return str
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\cdot/g, '*')
    .replace(/\\text\{[^}]*\}/g, '')
    .replace(/[\\{}\s]/g, '')
    .toLowerCase()
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
}

// Strip variable name and equals sign: "x = 0" → "0", "t = -2" → "-2"
function stripVariable(str) {
  return str.replace(/^[a-z]\s*=\s*/i, '').trim()
}

// Extract factors from expressions like "2(x+4)(x+3)" → ["2", "(x+4)", "(x+3)"]
function extractFactors(str) {
  const s = str.replace(/\s/g, '')
  const factors = []
  let i = 0
  while (i < s.length) {
    if (s[i] === '(') {
      let depth = 0, start = i
      while (i < s.length) {
        if (s[i] === '(') depth++
        else if (s[i] === ')') depth--
        i++
        if (depth === 0) break
      }
      factors.push(s.slice(start, i))
    } else {
      let start = i
      while (i < s.length && s[i] !== '(') i++
      const coeff = s.slice(start, i)
      if (coeff) factors.push(coeff)
    }
  }
  return factors
}

// Check if two expressions match with factors in any order
// e.g. "2(x+4)(x+3)" matches "2(x+3)(x+4)"
function factorsMatch(a, b) {
  const fa = extractFactors(a)
  const fb = extractFactors(b)
  if (fa.length !== fb.length || fa.length < 2) return false
  // Separate coefficients (non-parenthesized) from parenthesized factors
  const coeffA = fa.filter(f => !f.startsWith('(')).join('*')
  const coeffB = fb.filter(f => !f.startsWith('(')).join('*')
  if (coeffA !== coeffB) return false
  const parensA = fa.filter(f => f.startsWith('(')).sort()
  const parensB = fb.filter(f => f.startsWith('(')).sort()
  if (parensA.length !== parensB.length) return false
  return parensA.every((f, i) => f === parensB[i])
}

// Evaluate a math expression string at a given x value
// Supports: numbers, x, +, -, *, ^, ², ³, parentheses, implicit multiplication
function evalExpr(expr, xVal) {
  try {
    let s = expr
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
    // Insert * for implicit multiplication: 2x, 2(, )(, x(, )x, number-after-paren
    s = s.replace(/(\d)([a-wyz])/gi, '$1*$2')        // 2x → 2*x
    s = s.replace(/(\d)\(/g, '$1*(')                   // 2( → 2*(
    s = s.replace(/\)\(/g, ')*(')                      // )( → )*(
    s = s.replace(/([a-wyz])\(/gi, '$1*(')             // x( → x*(
    s = s.replace(/\)([a-wyz\d])/gi, ')*$1')           // )x → )*x, )2 → )*2
    // Replace ^ with ** for JS exponentiation
    s = s.replace(/\^/g, '**')
    // Replace x with value
    s = s.replace(/x/gi, `(${xVal})`)
    // Evaluate safely
    const result = Function('"use strict"; return (' + s + ')')()
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch {
    return null
  }
}

// Check if two expressions are numerically equivalent polynomials
// Test at several points - if they agree at enough points, they're equivalent
function numericallyEquivalent(exprA, exprB) {
  const testPoints = [0, 1, -1, 2, -2, 3, 0.5, -0.5]
  let matchCount = 0
  let validCount = 0
  for (const x of testPoints) {
    const a = evalExpr(exprA, x)
    const b = evalExpr(exprB, x)
    if (a === null || b === null) continue
    validCount++
    if (Math.abs(a - b) < 1e-9) matchCount++
  }
  // Need at least 5 valid test points and all must match
  return validCount >= 5 && matchCount === validCount
}

function answersMatch(userAnswer, correctAnswer) {
  // Strip prefixes like "Not complete: " from answer strings
  const cleanCorrect = correctAnswer.replace(/^(Not complete|Incomplete|Complete):\s*/i, '')
  const normUser = normalizeAnswer(userAnswer)
  const normCorrect = normalizeAnswer(cleanCorrect)
  if (normUser === normCorrect) return true
  // Also match without variable prefix (e.g. "0" matches "x=0")
  if (stripVariable(normUser) === stripVariable(normCorrect)) return true
  if (normUser === stripVariable(normCorrect)) return true
  if (stripVariable(normUser) === normCorrect) return true
  // Check if factors match in any order (e.g. 2(x+4)(x+3) = 2(x+3)(x+4))
  if (factorsMatch(normUser, normCorrect)) return true
  const stripped = cleanCorrect.replace(/\$/g, '').replace(/\\/g, '').replace(/\s/g, '').toLowerCase()
  const strippedUser = userAnswer.replace(/\$/g, '').replace(/\\/g, '').replace(/\s/g, '').toLowerCase()
  if (stripped === strippedUser) return true
  if (stripVariable(stripped) === stripVariable(strippedUser)) return true
  if (strippedUser === stripVariable(stripped)) return true
  if (factorsMatch(strippedUser, stripped)) return true
  // Fallback: numerical evaluation for equivalent expressions
  // e.g. (x-2)(x+2)(x-1)(x+1) vs (x²-1)(x²-4)
  if (numericallyEquivalent(normUser, normCorrect)) return true
  if (numericallyEquivalent(strippedUser, stripped)) return true
  return false
}

// For multi-solution problems, check if user answers match correct answers in any order
function checkMultiSolutionAnswers(userInputs, parts) {
  if (parts.length <= 1) {
    return parts.map((part, i) => answersMatch(userInputs[i] || '', part.value))
  }
  // Try to find best assignment: each user input matched to a correct answer
  const n = parts.length
  const used = new Array(n).fill(false)
  const results = new Array(n).fill(false)
  const assignment = new Array(n).fill(-1)

  // First pass: find exact matches
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!used[j] && answersMatch(userInputs[i] || '', parts[j].value)) {
        results[i] = true
        used[j] = true
        assignment[i] = j
        break
      }
    }
  }
  return results
}

// Normalize answer prop into array of { label, value }
function toAnswerParts(answer) {
  if (Array.isArray(answer)) return answer
  return [{ label: '', value: answer }]
}

const HintInfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/><path d="M10 22h4"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)

export default function ProblemItem({ num, text, answer, info, hint, maxRetries, problemKey, progress, onUpdateProgress, disputeMode, enableHints }) {
  const parts = toAnswerParts(answer)
  const rawSaved = progress[problemKey]
  const saved = rawSaved
    ? { history: [], ...rawSaved }
    : { attempts: 0, status: 'unanswered', userAnswers: parts.map(() => ''), history: [] }
  // Reconstruct history from existing state if it's missing (old progress data)
  if (saved.history.length === 0 && saved.attempts > 0 && saved.userAnswers) {
    const isCorrect = saved.status === 'correct'
    saved.history = [{
      answers: [...saved.userAnswers],
      results: saved.results || saved.userAnswers.map(() => isCorrect),
      correct: isCorrect,
    }]
  }
  const [inputs, setInputs] = useState(saved.userAnswers || parts.map(() => ''))
  const [localState, setLocalState] = useState(saved)
  const [showHistory, setShowHistory] = useState(false)
  const [showHintPopup, setShowHintPopup] = useState(false)
  const [showHintBtn, setShowHintBtn] = useState(false)
  const hintRef = useRef(null)
  const hintBtnRef = useRef(null)
  const historyRef1 = useRef(null)
  const historyRef2 = useRef(null)

  // Reset local state when progress is cleared (e.g. Reset All)
  useEffect(() => {
    if (!rawSaved) {
      const blank = { attempts: 0, status: 'unanswered', userAnswers: parts.map(() => ''), history: [] }
      setLocalState(blank)
      setInputs(parts.map(() => ''))
      setShowHistory(false)
      setShowHintPopup(false)
      setShowHintBtn(false)
    }
  }, [rawSaved])

  useEffect(() => {
    if (!showHintPopup && !showHistory && !showHintBtn) return
    const handler = (e) => {
      if (showHintPopup && hintRef.current && !hintRef.current.contains(e.target)) {
        setShowHintPopup(false)
      }
      if (showHintBtn && hintBtnRef.current && !hintBtnRef.current.contains(e.target)) {
        setShowHintBtn(false)
      }
      if (showHistory) {
        const r1 = historyRef1.current
        const r2 = historyRef2.current
        if ((!r1 || !r1.contains(e.target)) && (!r2 || !r2.contains(e.target))) {
          setShowHistory(false)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showHintPopup, showHistory, showHintBtn])

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

    const results = checkMultiSolutionAnswers(inputs, parts)
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

  // Dispute: accept a specific answer in a history entry as correct
  const handleDispute = (histIdx, ansIdx) => {
    const history = [...(localState.history || [])]
    const entry = { ...history[histIdx] }
    const newResults = [...entry.results]
    newResults[ansIdx] = true
    entry.results = newResults
    entry.correct = newResults.every(Boolean)
    entry.disputed = entry.disputed ? [...entry.disputed] : new Array(entry.results.length).fill(false)
    entry.disputed[ansIdx] = true
    history[histIdx] = entry

    let newState = { ...localState, history }

    // Find the earliest correct entry in history (original or disputed)
    const earliestCorrectIdx = history.findIndex(h => h.correct)
    if (earliestCorrectIdx >= 0) {
      const earliest = history[earliestCorrectIdx]
      newState.status = 'correct'
      newState.results = earliest.results
      newState.userAnswers = earliest.answers
      // Attempts = position of earliest correct entry for scoring
      newState.attempts = earliestCorrectIdx + 1
    }
    setLocalState(newState)
    onUpdateProgress(problemKey, newState)
  }

  const handleViewHint = () => {
    setShowHintBtn(!showHintBtn)
    if (!localState.hintUsed) {
      const newState = { ...localState, hintUsed: true }
      setLocalState(newState)
      onUpdateProgress(problemKey, newState)
    }
  }

  const showAnswer = localState.status === 'correct' || localState.status === 'revealed'
  const isCorrect = localState.status === 'correct'
  const cycleAttempts = localState.attempts - (localState.cycleStart || 0)
  const retriesLeft = maxRetries - cycleAttempts
  const partResults = localState.results || null
  const isMultiPart = parts.length > 1
  // Actual number of attempts made — use whichever is larger (history may be incomplete for old data)
  const histLen = localState.history ? localState.history.length : 0
  const displayAttempts = Math.max(histLen, localState.attempts || 0)

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <span className="font-mono text-sm text-gray-400 dark:text-gray-600 w-7 shrink-0 pt-0.5 text-right">{num}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5 mb-2">
            <MathText className="leading-relaxed">{text}</MathText>
            {/* Spacer to push hint button right */}
            <div className="flex-1" />
            {info && (
              <div ref={hintRef} className="relative shrink-0 mt-0.5 group">
                <button
                  onClick={() => setShowHintPopup(!showHintPopup)}
                  className="text-gray-300 dark:text-gray-600 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                  title={info}
                >
                  <HintInfoIcon />
                </button>
                {/* Hover tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <div className="font-medium mb-0.5 text-cyan-300">Why this is special</div>
                  {info}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700" />
                </div>
                {/* Click popup with detailed hint */}
                {showHintPopup && hint && (
                  <div className="absolute top-full right-0 mt-2 w-72 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-gray-900 shadow-xl z-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">Hint</span>
                      <button onClick={() => setShowHintPopup(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none">&times;</button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">{info}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      <MathText>{hint}</MathText>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Hint button — right edge */}
            {enableHints && !showAnswer && (
              <div ref={hintBtnRef} className="relative shrink-0 mt-0.5 group">
                <button
                  onClick={handleViewHint}
                  className={`p-1 rounded transition-colors ${localState.hintUsed ? 'text-amber-500 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400'}`}
                  title="Hint (deducts 1/4 point for viewing)"
                >
                  <LightbulbIcon />
                </button>
                {/* Hover tooltip */}
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-52 rounded-lg bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <div className="font-medium text-amber-300">Hint</div>
                  <div className="text-gray-300">Deducts 1/4 point for viewing</div>
                  <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700" />
                </div>
                {/* Click popup with hint content */}
                {showHintBtn && (
                  <div className="absolute top-full right-0 mt-2 w-72 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900 shadow-xl z-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Hint</span>
                      <button onClick={() => setShowHintBtn(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none">&times;</button>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {hint ? <MathText>{hint}</MathText> : (
                        <div className="space-y-1.5">
                          <p className="text-xs text-amber-600 dark:text-amber-400 italic">Answer format:</p>
                          {parts.map((part, i) => (
                            <div key={i} className="text-xs">
                              {part.label && <span className="font-medium text-gray-500 dark:text-gray-400">{part.label}: </span>}
                              <span className="text-gray-400 dark:text-gray-500">
                                <MathText>{part.value.replace(/[0-9]/g, '_').substring(0, Math.ceil(part.value.length * 0.4))}...</MathText>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] text-amber-500 dark:text-amber-600">-1/4 point deducted</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
              {disputeMode && localState.history && localState.history.length > 0 && (
                <div ref={historyRef1} className="relative">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-red-400 hover:text-red-500 transition-colors underline decoration-dotted cursor-pointer"
                  >
                    ⚖ Dispute
                  </button>
                  {showHistory && (
                    <div className="absolute bottom-full left-0 mb-2 w-80 max-h-56 overflow-y-auto rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-900 shadow-xl z-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dispute Mode — Click to Accept</span>
                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none">&times;</button>
                      </div>
                      <p className="text-xs text-red-500 dark:text-red-400 mb-2">Click any incorrect answer to accept it as correct.</p>
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
                                {entry.disputed && entry.disputed.some(Boolean) && <span className="ml-1 text-amber-500">⚖</span>}
                              </span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {entry.answers.map((a, ai) => {
                                const isCorrectPart = entry.results[ai]
                                const isDisputed = entry.disputed && entry.disputed[ai]
                                const canDispute = !isCorrectPart
                                return (
                                  <span key={ai} className="inline-flex items-center">
                                    {parts.length > 1 && parts[ai]?.label ? `${parts[ai].label}: ` : ''}
                                    {canDispute ? (
                                      <button
                                        onClick={() => handleDispute(idx, ai)}
                                        className="text-red-600 dark:text-red-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted cursor-pointer transition-colors"
                                        title="Click to accept this answer"
                                      >
                                        {a || '(empty)'}
                                      </button>
                                    ) : (
                                      <span className={`${isCorrectPart ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} ${isDisputed ? 'underline decoration-amber-500' : ''}`}>
                                        {a || '(empty)'}
                                        {isDisputed && <span className="ml-0.5 text-amber-500 text-[10px]">⚖</span>}
                                      </span>
                                    )}
                                    {ai < entry.answers.length - 1 ? <span className="mx-0.5"> · </span> : ''}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                        <MathText>{part.value.replace(/^(Not complete|Incomplete|Complete):\s*/i, '')}</MathText>
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
                <div ref={historyRef2} className="relative">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline decoration-dotted cursor-pointer"
                  >
                    {displayAttempts === 1 ? '1 attempt used' : `${displayAttempts} attempts used`}
                  </button>
                  {showHistory && localState.history && localState.history.length > 0 && (
                    <div className={`absolute bottom-full left-0 mb-2 ${disputeMode ? 'w-80' : 'w-72'} max-h-56 overflow-y-auto rounded-lg border ${disputeMode ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 shadow-xl z-50 p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {disputeMode ? 'Dispute Mode — Click to Accept' : 'Attempt History'}
                        </span>
                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none">&times;</button>
                      </div>
                      {disputeMode && (
                        <p className="text-xs text-red-500 dark:text-red-400 mb-2">Click any incorrect answer to accept it as correct.</p>
                      )}
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
                                {entry.disputed && entry.disputed.some(Boolean) && (
                                  <span className="ml-1 text-amber-500" title="Disputed">⚖</span>
                                )}
                              </span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {entry.answers.map((a, ai) => {
                                const isCorrectPart = entry.results[ai]
                                const isDisputed = entry.disputed && entry.disputed[ai]
                                const canDispute = disputeMode && !isCorrectPart
                                return (
                                  <span key={ai} className="inline-flex items-center">
                                    {parts.length > 1 && parts[ai]?.label ? `${parts[ai].label}: ` : ''}
                                    {canDispute ? (
                                      <button
                                        onClick={() => handleDispute(idx, ai)}
                                        className="text-red-600 dark:text-red-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted cursor-pointer transition-colors"
                                        title="Click to accept this answer"
                                      >
                                        {a || '(empty)'}
                                      </button>
                                    ) : (
                                      <span className={`${isCorrectPart ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} ${isDisputed ? 'underline decoration-amber-500' : ''}`}>
                                        {a || '(empty)'}
                                        {isDisputed && <span className="ml-0.5 text-amber-500 text-[10px]">⚖</span>}
                                      </span>
                                    )}
                                    {ai < entry.answers.length - 1 ? <span className="mx-0.5"> · </span> : ''}
                                  </span>
                                )
                              })}
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
