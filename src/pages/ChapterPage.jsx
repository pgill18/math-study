import data from '../data/chapter7.json'
import { useProgress } from '../hooks/useProgress'
import ProgressBar from '../components/ProgressBar'
import SectionCard from '../components/SectionCard'

export default function ChapterPage() {
  const { reviewed, problems, reviewedCount } = useProgress()

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-mono text-orange-500 dark:text-orange-400 mb-2">Chapter {data.chapter.number}</p>
        <h1 className="text-3xl font-bold mb-2">{data.chapter.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">Core Concepts and Monitoring Progress for each section.</p>
      </div>
      <ProgressBar reviewed={reviewedCount} total={data.sections.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            isReviewed={!!reviewed[section.id]}
            problems={problems}
          />
        ))}
      </div>
    </div>
  )
}
