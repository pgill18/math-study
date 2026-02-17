import { InlineMath } from 'react-katex'

export default function MathText({ children, className = '' }) {
  if (!children || typeof children !== 'string') return <span className={className}>{children}</span>
  
  const parts = children.split(/(\$[^$]+\$)/)
  
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const latex = part.slice(1, -1)
          try {
            return <InlineMath key={i} math={latex} />
          } catch {
            return <code key={i} className="text-red-400">{latex}</code>
          }
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
