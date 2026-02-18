import { useMemo, Fragment } from 'react'
import MathText from './Math'


function computeScore(attempts, correctionScore) {
  if (attempts <= 0) return null // unanswered
  if (attempts === 1) return 1
  // corrected answer — extra attempts beyond first
  switch (correctionScore) {
    case '0': return 0
    case '1': return 1
    case '0.5': return 0.5
    case 'half_n': return Math.pow(0.5, attempts - 1)
    default: return 0
  }
}

function attemptsColor(attempts) {
  if (attempts <= 1) return ''
  if (attempts === 2) return 'bg-yellow-100 dark:bg-yellow-900/30'
  if (attempts === 3) return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

function attemptsTextColor(attempts) {
  if (attempts <= 1) return ''
  if (attempts === 2) return 'text-yellow-700 dark:text-yellow-400'
  if (attempts === 3) return 'text-orange-700 dark:text-orange-400'
  return 'text-red-700 dark:text-red-400'
}

function formatScore(score) {
  if (score === null) return '—'
  if (score === 1) return '1'
  if (score === 0) return '0'
  return score.toFixed(3).replace(/\.?0+$/, '')
}

// Shorten problem text for display while preserving mixed text/math format
function shortProblem(text) {
  if (!text) return ''
  if (text.length <= 60) return text
  // Truncate but keep $...$ boundaries intact — cut at a safe point
  let truncated = text.slice(0, 57)
  // If we're inside an unclosed $, close it
  const dollarCount = (truncated.match(/\$/g) || []).length
  if (dollarCount % 2 !== 0) truncated += '$'
  return truncated + '...'
}

export default function ReportModal({ sections, problems, correctionScore, onClose }) {
  const report = useMemo(() => {
    const sectionReports = sections.map(section => {
      // Build groups: each MP becomes a group with instruction header + problem rows
      const groups = []
      let sectionTotal = 0
      let sectionEarned = 0
      let sectionAnswered = 0

      section.monitoringProgress.forEach(mp => {
        const rows = []
        mp.problems.forEach(p => {
          const key = mp.id + '.' + p.num
          const state = problems[key]
          const status = state ? state.status : 'unanswered'

          // Find effective attempts: earliest correct entry in history, or fall back to state.attempts
          let attempts = state ? state.attempts : 0
          if (state && state.history && state.history.length > 0) {
            const earliestCorrectIdx = state.history.findIndex(h => h.correct)
            if (earliestCorrectIdx >= 0) {
              attempts = earliestCorrectIdx + 1
            }
          }

          const score = status === 'correct' ? computeScore(attempts, correctionScore) :
                        status === 'revealed' ? 0 : null

          sectionTotal++
          if (status !== 'unanswered') sectionAnswered++
          if (score !== null) sectionEarned += score

          rows.push({
            num: p.num,
            text: p.text,
            attempts,
            status,
            score,
          })
        })

        groups.push({
          instruction: mp.instruction || '',
          rows,
        })
      })

      return {
        id: section.id,
        title: section.title,
        groups,
        total: sectionTotal,
        answered: sectionAnswered,
        earned: sectionEarned,
        percent: sectionTotal > 0 ? Math.round((sectionEarned / sectionTotal) * 100) : 0,
      }
    })

    const grandTotal = sectionReports.reduce((s, r) => s + r.total, 0)
    const grandEarned = sectionReports.reduce((s, r) => s + r.earned, 0)
    const grandAnswered = sectionReports.reduce((s, r) => s + r.answered, 0)
    const grandPercent = grandTotal > 0 ? Math.round((grandEarned / grandTotal) * 100) : 0

    return { sectionReports, grandTotal, grandEarned, grandAnswered, grandPercent }
  }, [sections, problems, correctionScore])

  const corrLabel = correctionScore === '0' ? '0' : correctionScore === '1' ? '1' : correctionScore === '0.5' ? '½' : '(½)ⁿ'

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-3xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold">
              {sections.length === 1 ? `Section ${sections[0].id} Report` : 'Chapter 7 Report'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Correction score: <span className="font-mono font-medium text-orange-500">{corrLabel}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* Overall summary */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-500">{report.grandPercent}%</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Overall Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatScore(report.grandEarned)}<span className="text-sm text-gray-400">/{report.grandTotal}</span></div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Points Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{report.grandAnswered}<span className="text-sm text-gray-400">/{report.grandTotal}</span></div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Attempted</div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${report.grandPercent === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`}
              style={{ width: `${report.grandPercent}%` }}
            />
          </div>
        </div>

        {/* Color legend */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-800 inline-block" /> +1 attempt</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-800 inline-block" /> +2 attempts</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 dark:bg-red-800 inline-block" /> +3 or more</span>
        </div>

        {/* Section details */}
        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {report.sectionReports.map(sr => (
            <div key={sr.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  <span className="text-orange-500 font-mono mr-2">{sr.id}</span>
                  <MathText>{sr.title}</MathText>
                </h3>
                <span className={`text-sm font-bold ${sr.percent === 100 ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatScore(sr.earned)}/{sr.total} ({sr.percent}%)
                </span>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
                      <th className="text-left py-1.5 px-2 font-medium w-8">#</th>
                      <th className="text-left py-1.5 px-2 font-medium">Problem</th>
                      <th className="text-left py-1.5 px-2 font-medium w-20">Status</th>
                      <th className="text-center py-1.5 px-2 font-medium w-16">Tries</th>
                      <th className="text-right py-1.5 px-2 font-medium w-14">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sr.groups.map((group, gi) => (
                      <Fragment key={`grp-${gi}`}>
                        {/* Category instruction header */}
                        {group.instruction && (
                          <tr key={`hdr-${gi}`} className="bg-blue-50/60 dark:bg-blue-950/20">
                            <td colSpan={5} className="py-1.5 px-2 text-xs font-semibold text-blue-700 dark:text-blue-400 italic">
                              {group.instruction}
                            </td>
                          </tr>
                        )}
                        {/* Problem rows */}
                        {group.rows.map((row, ri) => (
                          <tr
                            key={`row-${gi}-${ri}`}
                            className={`border-t border-gray-100 dark:border-gray-800 ${row.attempts > 1 ? attemptsColor(row.attempts) : ''}`}
                          >
                            <td className="py-1.5 px-2 font-mono text-xs text-gray-500">{row.num}</td>
                            <td className="py-1.5 px-2 text-xs text-gray-600 dark:text-gray-400">
                              <MathText>{shortProblem(row.text)}</MathText>
                            </td>
                            <td className="py-1.5 px-2">
                              {row.status === 'correct' && <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Correct</span>}
                              {row.status === 'revealed' && <span className="text-red-500 text-xs font-medium">Revealed</span>}
                              {row.status === 'incorrect' && <span className="text-orange-500 text-xs font-medium">In progress</span>}
                              {row.status === 'unanswered' && <span className="text-gray-400 dark:text-gray-600 text-xs">Unanswered</span>}
                            </td>
                            <td className={`py-1.5 px-2 text-center text-xs font-mono ${row.attempts > 1 ? attemptsTextColor(row.attempts) + ' font-bold' : 'text-gray-500'}`}>
                              {row.attempts > 0 ? row.attempts : '—'}
                            </td>
                            <td className="py-1.5 px-2 text-right text-xs font-mono font-medium">
                              {row.score !== null ? (
                                <span className={row.score === 1 ? 'text-emerald-600 dark:text-emerald-400' : row.score === 0 ? 'text-red-500' : 'text-orange-500'}>
                                  {formatScore(row.score)}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
