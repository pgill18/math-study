import { Link } from 'react-router-dom'
import SettingsDropdown from './SettingsDropdown'

export default function Layout({ children, settings, onUpdateSettings }) {
  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Chapter 7
          </Link>
          <SettingsDropdown settings={settings} onUpdate={onUpdateSettings} />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-2 text-center text-xs text-gray-400 dark:text-gray-600">
        Chapter 7 study in progress
      </footer>
    </>
  )
}
