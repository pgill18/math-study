import { Routes, Route } from 'react-router-dom'
import { useSettings } from './hooks/useSettings'
import Layout from './components/Layout'
import ChapterPage from './pages/ChapterPage'
import SectionPage from './pages/SectionPage'

export default function App() {
  const { settings, updateSettings } = useSettings()

  return (
    <div className={settings.theme}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Layout settings={settings} onUpdateSettings={updateSettings}>
          <Routes>
            <Route path="/" element={<ChapterPage settings={settings} />} />
            <Route path="/section/:sectionId" element={<SectionPage settings={settings} />} />
          </Routes>
        </Layout>
      </div>
    </div>
  )
}
