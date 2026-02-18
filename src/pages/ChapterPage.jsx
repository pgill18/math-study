import { useState } from 'react'
import data from '../data/chapter7.json'
import { useProgress } from '../hooks/useProgress'
import ProgressBar from '../components/ProgressBar'
import SectionCard from '../components/SectionCard'
import ReportModal from '../components/ReportModal'

export default function ChapterPage({ settings }) {
  const { reviewed, problems, reviewedCount } = useProgress()
  const [reportSections, setReportSections] = useState(null)

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-mono text-orange-500 dark:text-orange-400 mb-2">Chapter {data.chapter.number}</p>
        <h1 className="text-3xl font-bold mb-2">{data.chapter.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">Core Concepts and Monitoring Progress for each section.</p>
      </div>
      <ProgressBar reviewed={reviewedCount} total={data.sections.length} />

      <button
        onClick={() => setReportSections(data.sections)}
        className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        Chapter 7 Full Report
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            isReviewed={!!reviewed[section.id]}
            problems={problems}
            onReport={(s) => setReportSections([s])}
          />
        ))}
      </div>

      {reportSections && (
        <ReportModal
          sections={reportSections}
          problems={problems}
          correctionScore={settings?.correctionScore || '0'}
          onClose={() => setReportSections(null)}
        />
      )}
    </div>
  )
}
