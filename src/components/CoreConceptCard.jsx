import MathText from './Math'

function ExtraTable({ extra }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-3">
      {extra.label && <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2"><MathText>{extra.label}</MathText></p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {extra.headers.map((h, i) => (
                <th key={i} className="text-left pb-2 pr-4 font-semibold text-gray-500 dark:text-gray-400">
                  <MathText>{h}</MathText>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {extra.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-2 pr-4"><MathText>{cell}</MathText></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExtraSteps({ extra }) {
  const colors = { red: 'text-red-500', blue: 'text-blue-500', green: 'text-emerald-500', purple: 'text-purple-500' }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-3">
      {extra.label && <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3"><MathText>{extra.label}</MathText></p>}
      <div className="space-y-2">
        {extra.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`shrink-0 font-bold text-sm ${item.color ? colors[item.color] || '' : 'text-orange-500'}`}>
              {item.step}
            </span>
            <span className="text-sm"><MathText>{item.detail}</MathText></span>
          </div>
        ))}
      </div>
      {extra.result && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 font-medium">
          <MathText>{extra.result}</MathText>
        </div>
      )}
    </div>
  )
}

function ExtraDiagram({ extra }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-3">
      {extra.label && <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{extra.label}</p>}
      <div className="text-center py-2">
        <MathText>{extra.content}</MathText>
      </div>
    </div>
  )
}

function ExtraCallout({ extra }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-3">
      {extra.label && <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">{extra.label}</p>}
      <p className="text-sm text-gray-700 dark:text-gray-300"><MathText>{extra.content}</MathText></p>
    </div>
  )
}

function renderExtra(extra, i) {
  switch (extra.type) {
    case 'table': return <ExtraTable key={i} extra={extra} />
    case 'steps': return <ExtraSteps key={i} extra={extra} />
    case 'diagram': return <ExtraDiagram key={i} extra={extra} />
    case 'callout': return <ExtraCallout key={i} extra={extra} />
    default: return null
  }
}

export default function CoreConceptCard({ concept }) {
  const isExample = concept.type === 'example'
  const borderColor = isExample ? 'border-emerald-500' : 'border-orange-500'
  const bgColor = isExample ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-orange-50 dark:bg-orange-950/30'
  const labelColor = isExample ? 'text-emerald-500' : 'text-orange-500'
  const label = isExample ? 'Example' : 'Core Concept'

  return (
    <div className={`mb-6 rounded-xl border-l-4 ${borderColor} ${bgColor} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`${labelColor} font-bold text-sm tracking-wide uppercase`}>{label}</span>
      </div>
      <h3 className="text-lg font-bold mb-2"><MathText>{concept.title}</MathText></h3>
      {concept.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          <MathText>{concept.description}</MathText>
        </p>
      )}
      {concept.patterns && concept.patterns.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-3">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">{concept.patterns[0].example ? 'Algebra' : 'Pattern'}</th>
                {concept.patterns[0].example && <th className="pb-2">Example</th>}
              </tr>
            </thead>
            <tbody>
              {concept.patterns.map((p, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-2.5 pr-4"><MathText>{p.algebra}</MathText></td>
                  {p.example && <td className="py-2.5"><MathText>{p.example}</MathText></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {concept.extras && concept.extras.map((extra, i) => renderExtra(extra, i))}
      {concept.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <MathText>{concept.notes}</MathText>
        </p>
      )}
    </div>
  )
}
