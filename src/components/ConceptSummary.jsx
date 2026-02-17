import MathText from './Math'

export default function ConceptSummary({ summary }) {
  return (
    <div className="mb-6 rounded-xl border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 p-5">
      <span className="text-purple-500 font-bold text-sm tracking-wide uppercase mb-3 block">Concept Summary</span>
      <h3 className="text-lg font-bold mb-3"><MathText>{summary.title}</MathText></h3>
      <ol className="space-y-3">
        {summary.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center font-bold">{i + 1}</span>
            <div className="leading-relaxed">
              <MathText>{step.text}</MathText>
              {step.example && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <MathText>{step.example}</MathText>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
