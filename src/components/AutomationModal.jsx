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
  const savedDeduction = localState.automationDeduction || 0.5

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
    const newDeduction = deduction + 0.1
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
    const newDeduction = deduction + 0.1
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
          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Problem</span>
          <div className="text-sm text-gray-800 dark:text-gray-200 mt-1">
            <MathText>{text}</MathText>
          </div>
        </div>

        {/* Steps area */}
        <div className="px-5 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {/* Previously completed steps */}
          {stepStates.map((ss, i) => {
            if (i >= currentStep && phase !== 'final') return null
            if (!ss.revealed && ss.userTyped === null) return null
            return (
              <div key={i} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Step {i + 1} of {totalSteps}</span>
                  {ss.revealed ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">Revealed</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">You typed</span>
                  )}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {ss.revealed ? (
                    <MathText>{stepsToUse[i]}</MathText>
                  ) : (
                    <span className="italic">{ss.userTyped}</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Current step input */}
          {phase === 'steps' && currentStep < totalSteps && (
            <div className="rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 p-3 space-y-3">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Step {currentStep + 1} of {totalSteps}</span>

              {/* Type input */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userStepInput}
                    onChange={(e) => setUserStepInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTypeStep() }}
                    placeholder="Type the next step..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleTypeStep}
                    disabled={!userStepInput.trim()}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit
                  </button>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">No point deduction for typing it yourself</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>

              {/* Reveal button */}
              <button
                onClick={handleRevealStep}
                className="w-full py-2 text-sm font-medium rounded-lg border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
              >
                Reveal Step {currentStep + 1} <span className="text-xs opacity-70">(-1/10 pt)</span>
              </button>
            </div>
          )}

          {/* Final phase — all steps done */}
          {phase === 'final' && (
            <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">All steps complete!</span>
              </div>
              <button
                onClick={handlePostAnswer}
                className="w-full py-2.5 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                Post answer to answer box <span className="text-xs opacity-70">(-1/10 pt)</span>
              </button>
              <button
                onClick={handleTypeMyself}
                className="w-full py-2.5 text-sm font-medium rounded-lg border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                I'll type the answer myself <span className="text-xs opacity-70">(no cost)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer with deduction info */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total deduction: <span className="font-semibold text-indigo-600 dark:text-indigo-400">-{deduction.toFixed(1)} pts</span>
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {stepStates.filter(s => s.revealed).length} revealed / {stepStates.filter(s => s.userTyped !== null).length} typed
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
