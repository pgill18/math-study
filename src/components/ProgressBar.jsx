export default function ProgressBar({ reviewed, total }) {
  const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-400">Study Progress</span>
        <span className="font-medium">{reviewed}/{total} sections reviewed</span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
