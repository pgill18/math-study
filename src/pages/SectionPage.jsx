import { useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import data from '../data/chapter7.json'
import { useProgress } from '../hooks/useProgress'
import CoreConceptCard from '../components/CoreConceptCard'
import MonitoringProgress from '../components/MonitoringProgress'
import ConceptSummary from '../components/ConceptSummary'
import MathText from '../components/Math'

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
)
const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
)

// Classify a coreConcept entry into a category
function classifyCC(cc) {
  if (!cc.type || cc.type !== 'example') return 'core'
  if (/real[- ]?life/i.test(cc.title || '')) return 'reallife'
  return 'example'
}

export default function SectionPage({ settings }) {
  const { sectionId } = useParams()
  const { reviewed, problems, toggleReviewed, updateProblem, resetProblems } = useProgress()
  const section = data.sections.find(s => s.id === sectionId)
  const [pageIndex, setPageIndex] = useState(0)

  if (!section) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Section not found</h2>
        <Link to="/" className="text-orange-500 hover:underline">Back to Chapter 7</Link>
      </div>
    )
  }

  const sectionIndex = data.sections.findIndex(s => s.id === sectionId)
  const prevSection = sectionIndex > 0 ? data.sections[sectionIndex - 1] : null
  const nextSection = sectionIndex < data.sections.length - 1 ? data.sections[sectionIndex + 1] : null

  const showCore = settings.showCore !== false
  const showExamples = settings.showExamples !== false
  const showRealLife = settings.showRealLife !== false

  // Build pages: each page = one CC + its paired MP
  // Filter by category settings
  const pages = useMemo(() => {
    const result = []
    let mpIdx = 0

    section.coreConcepts.forEach((cc) => {
      const cat = classifyCC(cc)
      const mp = mpIdx < section.monitoringProgress.length ? section.monitoringProgress[mpIdx] : null
      mpIdx++

      // Check visibility
      if (cat === 'core' && !showCore) return
      if (cat === 'example' && !showExamples) return
      if (cat === 'reallife' && !showRealLife) return

      result.push({ cc, mp, cat })
    })

    // Any remaining MPs (unpaired)
    while (mpIdx < section.monitoringProgress.length) {
      result.push({ cc: null, mp: section.monitoringProgress[mpIdx], cat: 'extra' })
      mpIdx++
    }

    // Add concept summary as a separate page at the end
    if (section.conceptSummary) {
      result.push({ cc: null, mp: null, cs: section.conceptSummary, cat: 'summary' })
    }

    return result
  }, [section, showCore, showExamples, showRealLife])

  // Reset page index when section changes
  useEffect(() => { setPageIndex(0) }, [sectionId])

  // Clamp page index
  const safePageIndex = pages.length > 0 ? Math.min(pageIndex, pages.length - 1) : 0
  useEffect(() => {
    if (pageIndex !== safePageIndex) setPageIndex(safePageIndex)
  }, [pageIndex, safePageIndex])

  const currentPage = pages[safePageIndex] || null

  // Category badge
  function categoryBadge(cat) {
    if (cat === 'core') return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-medium">Core Concept</span>
    if (cat === 'example') return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-medium">Example</span>
    if (cat === 'reallife') return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-medium">Real-Life Problem</span>
    if (cat === 'summary') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">Concept Summary</span>
    return null
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
          <ChevronLeft /> Chapter 7
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">{section.id}</span>
      </div>

      <div className="mb-8">
        <p className="text-sm font-mono text-orange-500 dark:text-orange-400 mb-1">Section {section.id}</p>
        <h1 className="text-2xl font-bold mb-3"><MathText>{section.title}</MathText></h1>
      </div>

      {/* Current page content */}
      {currentPage && (
        <div>
          {currentPage.cc && <CoreConceptCard concept={currentPage.cc} />}
          {currentPage.mp && (
            <MonitoringProgress
              mp={currentPage.mp}
              maxRetries={settings.maxRetries}
              progress={problems}
              onUpdateProgress={updateProblem}
              onResetAll={resetProblems}
            />
          )}
          {currentPage.cs && <ConceptSummary summary={currentPage.cs} />}
        </div>
      )}

      {pages.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <p className="text-lg mb-2">No content visible</p>
          <p className="text-sm">Enable at least one category in Settings to see content.</p>
        </div>
      )}

      {/* Page navigation bar — bottom */}
      {pages.length > 0 && (
        <div className="flex items-center justify-between mt-8 mb-4 py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setPageIndex(Math.max(0, safePageIndex - 1))}
            disabled={safePageIndex === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft /> Prev
          </button>

          <div className="flex items-center gap-3">
            {categoryBadge(currentPage?.cat)}
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {safePageIndex + 1} / {pages.length}
            </span>
          </div>

          <button
            onClick={() => setPageIndex(Math.min(pages.length - 1, safePageIndex + 1))}
            disabled={safePageIndex >= pages.length - 1}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ChevronRight />
          </button>
        </div>
      )}

      {/* Dot navigation — bottom */}
      {pages.length > 1 && (
        <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
          {pages.map((p, i) => {
            const dotColor = p.cat === 'core' ? 'bg-orange-500' : p.cat === 'example' ? 'bg-emerald-500' : p.cat === 'reallife' ? 'bg-purple-500' : 'bg-gray-400'
            return (
              <button
                key={i}
                onClick={() => setPageIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === safePageIndex ? `${dotColor} scale-125` : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'}`}
                title={p.cc ? p.cc.title : p.cs ? 'Concept Summary' : `Problems`}
              />
            )
          })}
        </div>
      )}

      {/* Mark as reviewed — bottom (only if enabled in settings) */}
      {settings.enableMarkReviewed && (
        <div className="flex justify-center mb-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!reviewed[sectionId]}
              onChange={() => toggleReviewed(sectionId)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-gray-600 dark:text-gray-400">Mark as reviewed</span>
          </label>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        {prevSection ? (
          <Link to={'/section/' + prevSection.id} onClick={() => setPageIndex(0)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors">
            <ChevronLeft /> {prevSection.id} {prevSection.title}
          </Link>
        ) : <div />}
        {nextSection ? (
          <Link to={'/section/' + nextSection.id} onClick={() => setPageIndex(0)} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
            {nextSection.id} {nextSection.title} &rarr;
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}
