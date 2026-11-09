'use client'
import { useEffect, useState } from 'react'
import { trackClient } from './Track'

export interface QuizQuestion {
  id?: string | null
  prompt: string
  options: { id?: string | null; text: string; correct?: boolean | null }[]
  explanation?: string | null
}

export function QuizBlock({ questions, labels, lessonId, track }: { questions: QuizQuestion[]; labels: { title: string; correct: string; wrong: string; score: string }; lessonId?: number; track?: string }) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  const answered = Object.keys(picked).length
  const right = Object.entries(picked).filter(([q, o]) => questions[Number(q)]?.options[o]?.correct).length
  const finished = questions.length > 0 && answered === questions.length
  useEffect(() => {
    if (finished && lessonId) trackClient('quiz_submitted', { lessonId, score: right, max: questions.length }, track)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">{labels.title}</h2>
      {questions.map((q, qi) => {
        const choice = picked[qi]
        const done = choice !== undefined
        return (
          <fieldset key={q.id ?? qi} className="rounded-2xl border border-line bg-white p-4">
            <legend className="sr-only">{q.prompt}</legend>
            <p className="font-semibold">{qi + 1}. {q.prompt}</p>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((o, oi) => {
                const isPicked = choice === oi
                const tone = !done ? 'border-line hover:border-ink' : o.correct ? 'border-ok bg-ok/10' : isPicked ? 'border-danger bg-danger/10' : 'border-line opacity-70'
                return (
                  <button
                    key={o.id ?? oi}
                    type="button"
                    disabled={done}
                    onClick={() => setPicked({ ...picked, [qi]: oi })}
                    className={`rounded-xl border px-3.5 py-3 text-left ${tone}`}
                  >
                    {o.text}
                    {done && o.correct && <span className="ml-2 font-semibold text-ok">✓</span>}
                  </button>
                )
              })}
            </div>
            {done && (
              <div role="status" className="mt-3 text-sm">
                <p className={`font-semibold ${q.options[choice]?.correct ? 'text-ok' : 'text-danger'}`}>
                  {q.options[choice]?.correct ? labels.correct : labels.wrong}
                </p>
                {q.explanation && <p className="mt-1 text-muted">{q.explanation}</p>}
              </div>
            )}
          </fieldset>
        )
      })}
      {answered === questions.length && questions.length > 0 && (
        <p className="rounded-xl bg-paper p-4 font-semibold">
          {labels.score.replace('{right}', String(right)).replace('{total}', String(questions.length))}
        </p>
      )}
    </section>
  )
}
