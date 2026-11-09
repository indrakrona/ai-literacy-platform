'use client'
import { useState } from 'react'
import type { SortDeck } from './data'
import { scoreSort } from './logic'

export function SortingSim({ deck, locale }: { deck: SortDeck; locale: 'id' | 'en' }) {
  const [answers, setAnswers] = useState<Record<string, 'a' | 'b'>>({})
  const score = scoreSort(deck.cards, answers)
  const t = (x: { id: string; en: string }) => x[locale]

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xl font-bold">{t(deck.title)}</h2>
      <p className="text-muted">{t(deck.instructions)}</p>
      <ul className="flex flex-col gap-3">
        {deck.cards.map((card) => {
          const pick = answers[card.id]
          const done = pick !== undefined
          const right = pick === card.bin
          return (
            <li key={card.id} className={`rounded-2xl border p-3 ${!done ? 'border-line' : right ? 'border-ok bg-ok/5' : 'border-danger bg-danger/5'}`}>
              <p className="font-medium">{t(card.text)}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['a', 'b'] as const).map((bin) => (
                  <button
                    key={bin}
                    type="button"
                    disabled={done}
                    onClick={() => setAnswers({ ...answers, [card.id]: bin })}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold ${pick === bin ? 'border-ink bg-ink text-paper' : 'border-line'}`}
                  >
                    {t(bin === 'a' ? deck.binA : deck.binB)}
                  </button>
                ))}
              </div>
              {done && (
                <p role="status" className="mt-2 text-sm">
                  <span className={`font-semibold ${right ? 'text-ok' : 'text-danger'}`}>{right ? '✓ ' : '✗ '}</span>
                  {t(card.why)}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between rounded-xl bg-paper p-3 text-sm font-semibold">
        <span>
          {score.correct} / {score.total}
        </span>
        <button type="button" className="underline" onClick={() => setAnswers({})}>
          {locale === 'id' ? 'Ulangi' : 'Start again'}
        </button>
      </div>
    </section>
  )
}
