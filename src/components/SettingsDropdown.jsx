import { useState, useRef, useEffect } from 'react'

const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

function ToggleSwitch({ label, color, checked, onChange }) {
  const bgOn = color === 'orange' ? 'bg-orange-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'purple' ? 'bg-purple-500' : color === 'cyan' ? 'bg-cyan-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-blue-500'
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? bgOn : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  )
}

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export default function SettingsDropdown({ settings, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [showHintConfirm, setShowHintConfirm] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Settings"
      >
        <GearIcon />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Settings</h3>
          
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Theme</span>
            <button
              onClick={() => onUpdate({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              {settings.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              {settings.theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Max retries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Max retries before answer</span>
              <span className="text-sm font-mono font-bold text-orange-500">{settings.maxRetries}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.maxRetries}
              onChange={(e) => onUpdate({ maxRetries: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>

          {/* Mark as reviewed toggle */}
          <ToggleSwitch
            label="Enable Mark as Reviewed"
            color="blue"
            checked={settings.enableMarkReviewed === true}
            onChange={(v) => onUpdate({ enableMarkReviewed: v })}
          />

          {/* Enable Hints toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable Hints</span>
              <button
                onClick={() => {
                  if (settings.enableHints) {
                    onUpdate({ enableHints: false })
                  } else {
                    setShowHintConfirm(true)
                  }
                }}
                className={`relative w-9 h-5 rounded-full transition-colors ${settings.enableHints ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.enableHints ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            {showHintConfirm && !settings.enableHints && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-2.5 space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">Viewing a hint will deduct <strong>1/4 point</strong> from your score for that problem. Do you want to enable hints?</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      onUpdate({ enableHints: true })
                      setShowHintConfirm(false)
                    }}
                    className="px-2.5 py-1 text-xs rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium"
                  >
                    Yes, enable
                  </button>
                  <button
                    onClick={() => setShowHintConfirm(false)}
                    className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {settings.enableHints && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Active — viewing hints deducts 1/4 point</p>
            )}
          </div>

          {/* Correction score */}
          <div>
            <span className="text-sm block mb-2">Correction score</span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: '0', label: '0' },
                { value: '1', label: '1' },
                { value: '0.5', label: '½' },
                { value: 'half_n', label: '(½)ⁿ' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ correctionScore: opt.value })}
                  className={`py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    (settings.correctionScore || '0') === opt.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Score for corrected answers</p>
          </div>

          {/* Dispute mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1.5">
                <LockIcon />
                Dispute Mode
              </span>
              <button
                onClick={() => {
                  if (settings.disputeMode) {
                    // Turn off — no password needed
                    onUpdate({ disputeMode: false })
                  } else {
                    // Turn on — prompt for password
                    setShowPasswordPrompt(true)
                    setPasswordInput('')
                    setPasswordError(false)
                  }
                }}
                className={`relative w-9 h-5 rounded-full transition-colors ${settings.disputeMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.disputeMode ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            {showPasswordPrompt && !settings.disputeMode && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 p-2.5 space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400">Enter admin password to enable:</p>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (passwordInput === (settings.disputePassword || 'admin123')) {
                          onUpdate({ disputeMode: true })
                          setShowPasswordPrompt(false)
                          setPasswordInput('')
                        } else {
                          setPasswordError(true)
                        }
                      }
                    }}
                    placeholder="Password..."
                    className={`flex-1 px-2 py-1 text-xs rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 ${passwordError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (passwordInput === (settings.disputePassword || 'admin123')) {
                        onUpdate({ disputeMode: true })
                        setShowPasswordPrompt(false)
                        setPasswordInput('')
                      } else {
                        setPasswordError(true)
                      }
                    }}
                    className="px-2.5 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                  >
                    Unlock
                  </button>
                  <button
                    onClick={() => { setShowPasswordPrompt(false); setPasswordInput('') }}
                    className="px-1.5 py-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                {passwordError && <p className="text-xs text-red-500">Incorrect password</p>}
              </div>
            )}
            {settings.disputeMode && (
              <p className="text-xs text-red-500 dark:text-red-400">Active — click answers in history to accept them</p>
            )}
          </div>

          {/* Category toggles */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Show Categories</span>
            <ToggleSwitch
              label="Core Concepts"
              color="orange"
              checked={settings.showCore !== false}
              onChange={(v) => onUpdate({ showCore: v })}
            />
            <ToggleSwitch
              label="Additional Examples"
              color="emerald"
              checked={settings.showExamples !== false}
              onChange={(v) => onUpdate({ showExamples: v })}
            />
            <ToggleSwitch
              label="Real-Life Problems"
              color="purple"
              checked={settings.showRealLife !== false}
              onChange={(v) => onUpdate({ showRealLife: v })}
            />
            <ToggleSwitch
              label="Edge Cases"
              color="cyan"
              checked={settings.showEdgeCases === true}
              onChange={(v) => onUpdate({ showEdgeCases: v })}
            />
            <ToggleSwitch
              label="Corner Cases"
              color="indigo"
              checked={settings.showCornerCases === true}
              onChange={(v) => onUpdate({ showCornerCases: v })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
