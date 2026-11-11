'use client'
import { useState } from 'react'
import type { ChoiceRound } from './challenges'

type L = { id: string; en: string }

/** Rounds of "which is better?" choices with explanations (prompt battle, fix the biased output). */
export function ChoiceSim({ title, intro, rounds, showOutputs = false, locale }: { title: L; intro: L; rounds: ChoiceRound[]; showOutputs?: boolean; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [round, setRound] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const r = rounds[round]
  if (!r)
    return (
      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">{title[locale]}</h2>
        <p className="font-semibold">{id ? `Skor: ${score} dari ${rounds.length}` : `Score: ${score} of ${rounds.length}`}</p>
        <button type="button" className="self-start underline" onClick={() => { setRound(0); setPick(null); setScore(0) }}>{id ? 'Main lagi' : 'Play again'}</button>
      </section>
    )
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xl font-bold">{title[locale]}</h2>
      <p className="text-muted">{intro[locale]}</p>
      <p className="rounded-2xl bg-paper p-3 font-medium">{r.situation[locale]}</p>
      <ul className="flex flex-col gap-2">
        {r.options.map((o, i) => {
          const chosen = pick === i
          const tone = pick === null ? 'border-line hover:border-ink' : o.best ? 'border-ok bg-ok/5' : chosen ? 'border-danger bg-danger/5' : 'border-line opacity-70'
          return (
            <li key={i}>
              <button
                type="button"
                disabled={pick !== null}
                onClick={() => {
                  setPick(i)
                  if (o.best) setScore(score + 1)
                }}
                className={`w-full rounded-xl border-2 p-3 text-left ${tone}`}
              >
                <span className="font-medium">{o.text[locale]}</span>
                {showOutputs && o.output && pick !== null && <span className="mt-1 block text-sm text-muted">→ {o.output[locale]}</span>}
              </button>
              {pick !== null && (chosen || o.best) && <p className="mt-1 pl-3 text-sm">{o.best ? '✓ ' : '✗ '}{o.why[locale]}</p>}
            </li>
          )
        })}
      </ul>
      {pick !== null && (
        <button type="button" className="self-start rounded-xl bg-ink px-5 py-3 font-semibold text-paper" onClick={() => { setRound(round + 1); setPick(null) }}>
          {round < rounds.length - 1 ? (id ? 'Berikutnya →' : 'Next →') : id ? 'Lihat skor' : 'See score'}
        </button>
      )}
      <p className="text-xs text-muted">{id ? `Ronde ${round + 1} dari ${rounds.length}` : `Round ${round + 1} of ${rounds.length}`}</p>
    </section>
  )
}
