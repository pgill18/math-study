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
  const bgOn = color === 'orange' ? 'bg-orange-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
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

export default function SettingsDropdown({ settings, onUpdate }) {
  const [open, setOpen] = useState(false)
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
          </div>
        </div>
      )}
    </div>
  )
}
