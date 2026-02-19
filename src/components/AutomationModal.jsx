import { useState, useEffect, useRef } from 'react'
import MathText from './Math'

export default function AutomationModal({ isOpen, onClose, steps, hint, answer, text, parts, onPostAnswer, localState, onUpdateState }) {
  const modalRef = useRef(null)
  const stepsToUse = steps && steps.length > 0
    ? steps
    : hint
      ? [hint]
      : ['Refer to the answer.']

  const totalSteps = stepsToUse.length

  // Restore state from localState if automation was previously used
  const savedStepStates = localState.automationStepStates || null
  const savedDeduction = localState.automationDeduction || 0

  const [stepStates, setStepStates] = useState(() =>
    savedStepStates || stepsToUse.map(() => ({ revealed: false, userTyped: null }))
  )
  const [currentStep, setCurrentStep] = useState(() => {
    if (savedStepStates) {
      const lastDone = savedStepStates.findLastIndex(s => s.revealed || s.userTyped !== null)
      return Math.min(lastDone + 1, totalSteps)
    }
    return 0
  })
  const [deduction, setDeduction] = useState(savedDeduction)
  const [userStepInput, setUserStepInput] = useState('')
  const [phase, setPhase] = useState(() => {
    if (savedStepStates && savedStepStates.every(s => s.revealed || s.userTyped !== null)) {
      return 'final'
    }
    return 'steps'
  })

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Cost schedule per step based on total steps
  const COST_SCHEDULES = {
    2: [0.2, 0.4],
    3: [0.1, 0.2, 0.3],
    4: [0.1, 0.1, 0.2, 0.2],
    5: [0.1, 0.1, 0.1, 0.1, 0.2],
  }
  const POST_COST = 0.2
  // For step counts outside 2-5, distribute evenly capped at 0.8 total
  const stepCosts = COST_SCHEDULES[totalSteps] || Array.from({ length: totalSteps }, (_, i) => {
    const base = Math.round((0.6 / totalSteps) * 10) / 10
    return Math.max(0.1, base)
  })
  const currentStepCost = currentStep < totalSteps ? stepCosts[currentStep] : 0

  const persistState = (newStepStates, newDeduction) => {
    onUpdateState({
      automationUsed: true,
      automationDeduction: newDeduction,
      automationStepStates: newStepStates,
    })
  }

  const handleRevealStep = () => {
    const newStates = [...stepStates]
    newStates[currentStep] = { revealed: true, userTyped: null }
    const newDeduction = Math.round((deduction + currentStepCost) * 10) / 10
    setStepStates(newStates)
    setDeduction(newDeduction)
    setUserStepInput('')
    persistState(newStates, newDeduction)

    if (currentStep + 1 >= totalSteps) {
      setPhase('final')
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleTypeStep = () => {
    if (!userStepInput.trim()) return
    const newStates = [...stepStates]
    newStates[currentStep] = { revealed: false, userTyped: userStepInput.trim() }
    setStepStates(newStates)
    setUserStepInput('')
    // No additional deduction for typing
    persistState(newStates, deduction)

    if (currentStep + 1 >= totalSteps) {
      setPhase('final')
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePostAnswer = () => {
    const newDeduction = Math.round((deduction + POST_COST) * 10) / 10
    setDeduction(newDeduction)
    persistState(stepStates, newDeduction)
    // Post the answer to the input box
    if (onPostAnswer) {
      const answerValues = parts.map(p => {
        let val = p.value
          .replace(/\$/g, '')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
          .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
          .replace(/\\cdot/g, '*')
          .replace(/\\text\{[^}]*\}/g, '')
          .replace(/\\/g, '')
          .replace(/\{/g, '').replace(/\}/g, '')
          .replace(/^(Not complete|Incomplete|Complete):\s*/i, '')
          .trim()
        return val
      })
      onPostAnswer(answerValues)
    }
    onClose()
  }

  const handleTypeMyself = () => {
    // No deduction — just close
    onClose()
  }

  // Determine step node status for the stepper
  const getStepStatus = (i) => {
    const ss = stepStates[i]
    if (ss.revealed) return 'revealed'
    if (ss.userTyped !== null) return 'typed'
    if (phase === 'steps' && i === currentStep) return 'current'
    return 'pending'
  }
  const answerStatus = phase === 'final' ? 'current' : 'pending'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div ref={modalRef} className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Step-by-Step Solution</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>

        {/* Problem */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Problem</span>
          <div className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">
            <MathText>{text}</MathText>
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {stepsToUse.map((_, i) => {
              const status = getStepStatus(i)
              const isLast = i === totalSteps - 1
              return (
                <div key={i} className="flex items-center" style={{ flex: isLast ? '0 0 auto' : '1 1 0' }}>
                  {/* Circle + label */}
                  <div className="flex flex-col items-center" style={{ minWidth: '28px' }}>
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${status === 'revealed'
                        ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900'
                        : status === 'typed'
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900'
                          : status === 'current'
                            ? 'bg-white dark:bg-gray-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900/50'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700'
                      }
                    `}>
                      {status === 'revealed' || status === 'typed' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-[9px] mt-1 font-medium whitespace-nowrap ${
                      status === 'revealed' ? 'text-indigo-500 dark:text-indigo-400'
                        : status === 'typed' ? 'text-emerald-500 dark:text-emerald-400'
                        : status === 'current' ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {totalSteps <= 4 ? (status === 'revealed' ? 'Revealed' : status === 'typed' ? 'Typed' : `Step ${i + 1}`) : ''}
                    </span>
                  </div>
                  {/* Connecting line (not after last step) */}
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 mt-[-14px] rounded transition-colors ${
                      (getStepStatus(i) === 'revealed' || getStepStatus(i) === 'typed')
                        ? (getStepStatus(i) === 'typed' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-indigo-300 dark:bg-indigo-700')
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              )
            })}
            {/* Answer node */}
            <div className="flex items-center" style={{ flex: '0 0 auto' }}>
              {/* Line before answer */}
              <div className={`w-4 h-0.5 mr-1 mt-[-14px] rounded transition-colors ${
                phase === 'final' ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              <div className="flex flex-col items-center" style={{ minWidth: '28px' }}>
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                  ${answerStatus === 'current'
                    ? 'bg-white dark:bg-gray-800 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700'
                  }
                `}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className={`text-[9px] mt-1 font-medium ${
                  answerStatus === 'current' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'
                }`}>Answer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="px-5 pb-4 space-y-2 max-h-[45vh] overflow-y-auto">
          {/* Completed steps content */}
          {stepStates.map((ss, i) => {
            if (i >= currentStep && phase !== 'final') return null
            if (!ss.revealed && ss.userTyped === null) return null
            return (
              <div key={i} className={`rounded-lg p-2.5 ${
                ss.revealed
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40'
              }`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-semibold ${ss.revealed ? 'text-indigo-500 dark:text-indigo-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                    Step {i + 1}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    ss.revealed
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400'
                      : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-400'
                  }`}>
                    {ss.revealed ? 'revealed' : 'you typed'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {ss.revealed ? (
                    <MathText>{stepsToUse[i]}</MathText>
                  ) : (
                    <span className="italic text-emerald-700 dark:text-emerald-300">{ss.userTyped}</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Current step input */}
          {phase === 'steps' && currentStep < totalSteps && (
            <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step {currentStep + 1}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">of {totalSteps}</span>
              </div>

              {/* Type input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userStepInput}
                  onChange={(e) => setUserStepInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTypeStep() }}
                  placeholder="Type this step yourself (free)..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
                <button
                  onClick={handleTypeStep}
                  disabled={!userStepInput.trim()}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Submit
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>

              <button
                onClick={handleRevealStep}
                className="w-full py-2 text-sm font-medium rounded-lg border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
              >
                Reveal Step {currentStep + 1} <span className="text-xs opacity-60">(-{currentStepCost} pt)</span>
              </button>
            </div>
          )}

          {/* Final phase — all steps done */}
          {phase === 'final' && (
            <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2.5">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All steps complete!</p>
              <button
                onClick={handlePostAnswer}
                className="w-full py-2.5 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                Post answer to answer box <span className="text-xs opacity-60">(-{POST_COST} pt)</span>
              </button>
              <button
                onClick={handleTypeMyself}
                className="w-full py-2.5 text-sm font-medium rounded-lg border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                I'll type the answer myself <span className="text-xs opacity-60">(no cost)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer with deduction info */}
        <div className="px-5 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Deduction: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{deduction > 0 ? `-${deduction.toFixed(1)}` : '0'} pts</span>
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {stepStates.filter(s => s.revealed).length} revealed · {stepStates.filter(s => s.userTyped !== null).length} typed
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
