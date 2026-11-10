/** Renders help-article text: blank lines separate paragraphs, lines starting with "- " form a list. */
export function HelpBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}>{l.trim().slice(2)}</li>)}
            </ul>
          )
        }
        return <p key={i} className="whitespace-pre-line">{b}</p>
      })}
    </div>
  )
}
