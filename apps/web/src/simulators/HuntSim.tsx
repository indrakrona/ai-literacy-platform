'use client'
import { useState } from 'react'
import { HALLUCINATION_HUNT } from './challenges'
import { scoreHunt } from './logic'

/** Hallucination hunt: tap the sentences you think the AI made up, then check. */
export function HuntSim({ locale }: { locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [round, setRound] = useState(0)
  const [flags, setFlags] = useState<boolean[]>([])
  const [checked, setChecked] = useState(false)
  const r = HALLUCINATION_HUNT[round]!
  const score = scoreHunt(flags, r.sentences.map((s) => s.wrong))
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xl font-bold">{id ? 'Berburu halusinasi AI' : 'Hallucination hunt'}</h2>
      <p className="text-muted">{id ? 'AI kadang mengarang fakta dengan sangat meyakinkan. Tandai kalimat yang menurutmu salah atau dikarang, lalu periksa.' : 'AI sometimes makes up facts very convincingly. Mark the sentences you think are wrong or invented, then check.'}</p>
      <p className="text-sm font-semibold">{r.topic[locale]}</p>
      <div className="rounded-2xl bg-paper p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{id ? 'Jawaban AI' : 'AI answer'}</p>
        <ol className="flex flex-col gap-2">
          {r.sentences.map((s, i) => {
            const on = Boolean(flags[i])
            const tone = !checked ? (on ? 'border-brand-deep bg-brand/10' : 'border-transparent') : s.wrong ? (on ? 'border-ok bg-ok/10' : 'border-danger bg-danger/5') : on ? 'border-danger bg-danger/5' : 'border-transparent'
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={checked}
                  onClick={() => setFlags(r.sentences.map((_, j) => (j === i ? !on : Boolean(flags[j]))))}
                  className={`w-full rounded-xl border-2 px-3 py-2 text-left ${tone}`}
                >
                  {on ? '🚩 ' : ''}{s.text[locale]}
                </button>
                {checked && s.wrong && s.why && <p className="mt-1 pl-3 text-sm">{s.why[locale]}</p>}
              </li>
            )
          })}
        </ol>
      </div>
      {checked ? (
        <div className="rounded-xl bg-paper p-3 text-sm">
          <p className="font-semibold">
            {id ? `Ditemukan ${score.found} dari ${score.found + score.missed} kalimat karangan` : `Found ${score.found} of ${score.found + score.missed} invented sentences`}
            {score.falseAlarms ? (id ? ` · ${score.falseAlarms} kalimat benar ikut ditandai` : ` · ${score.falseAlarms} true sentences flagged`) : ''}
          </p>
          <p className="mt-1">{id ? 'Cara memeriksa: cari sumber resmi, curigai angka yang terlalu “pas”, dan pastikan buku atau ahli yang dikutip benar-benar ada.' : 'How to check: find an official source, distrust suspiciously neat numbers, and make sure quoted books or experts really exist.'}</p>
          {round < HALLUCINATION_HUNT.length - 1 ? (
            <button type="button" className="mt-2 font-semibold underline" onClick={() => { setRound(round + 1); setFlags([]); setChecked(false) }}>{id ? 'Ronde berikutnya →' : 'Next round →'}</button>
          ) : (
            <button type="button" className="mt-2 underline" onClick={() => { setRound(0); setFlags([]); setChecked(false) }}>{id ? 'Ulangi dari awal' : 'Start again'}</button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => setChecked(true)} className="self-start rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Periksa' : 'Check'}</button>
      )}
      <p className="text-xs text-muted">{id ? `Ronde ${round + 1} dari ${HALLUCINATION_HUNT.length}` : `Round ${round + 1} of ${HALLUCINATION_HUNT.length}`}</p>
    </section>
  )
}
