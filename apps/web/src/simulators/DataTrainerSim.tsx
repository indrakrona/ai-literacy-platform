'use client'
import { useState } from 'react'
import { trainerConfidence } from './logic'

type Kind = 'harumanis' | 'gedong' | 'muda'

const KINDS: Record<Kind, { id: string; en: string; color: string }> = {
  harumanis: { id: 'Mangga harum manis matang', en: 'Ripe harum manis mango', color: '#d4a017' },
  gedong: { id: 'Mangga gedong matang', en: 'Ripe gedong mango', color: '#e8772e' },
  muda: { id: 'Mangga muda', en: 'Unripe mango', color: '#5a9e3a' },
}

/**
 * Data trainer: students add labelled examples and test the "model" on a kind they choose.
 * fairness mode frames the same mechanics as "who is missing from the data".
 */
export function DataTrainerSim({ locale, fairness = false }: { locale: 'id' | 'en'; fairness?: boolean }) {
  const [counts, setCounts] = useState<Record<Kind, number>>({ harumanis: 0, gedong: 0, muda: 0 })
  const [wrong, setWrong] = useState(0)
  const [test, setTest] = useState<Kind>('gedong')
  const total = counts.harumanis + counts.gedong + counts.muda + wrong
  const conf = trainerConfidence(counts[test], total, wrong)
  const id = locale === 'id'

  const add = (k: Kind) => setCounts({ ...counts, [k]: counts[k] + 3 })
  const verdict =
    total === 0
      ? id ? 'Model belum dilatih. Tambahkan contoh data.' : 'The model has no training data yet. Add examples.'
      : counts[test] === 0
        ? id ? 'Model belum pernah melihat jenis ini, jadi tebakannya hampir asal.' : 'The model has never seen this kind, so it is mostly guessing.'
        : conf >= 75
          ? id ? 'Model cukup yakin karena sudah melihat banyak contoh jenis ini.' : 'The model is fairly confident because it has seen many examples of this kind.'
          : id ? 'Model masih ragu. Contoh jenis ini terlalu sedikit dibanding yang lain.' : 'The model is unsure. There are too few examples of this kind compared with the others.'

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xl font-bold">
        {fairness ? (id ? 'Simulator Data yang Tidak Seimbang' : 'Unbalanced data simulator') : id ? 'Simulator Pelatih Data' : 'Data trainer simulator'}
      </h2>
      <p className="text-muted">
        {fairness
          ? id
            ? 'Latih model hanya dengan satu jenis mangga, lalu uji jenis lain. Siapa yang "dirugikan" oleh data yang tidak seimbang?'
            : 'Train the model on one kind of mango only, then test another. Who is "left out" by unbalanced data?'
          : id
            ? 'Tambahkan contoh berlabel, pilih buah yang akan diuji, lalu amati tingkat keyakinan model.'
            : 'Add labelled examples, choose a fruit to test, and watch how confident the model is.'}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(KINDS) as Kind[]).map((k) => (
          <button key={k} type="button" onClick={() => add(k)} className="rounded-xl border border-line p-3 text-left">
            <span className="mr-2 inline-block size-3 rounded-full align-middle" style={{ background: KINDS[k].color }} />
            <span className="text-sm font-semibold">+3 {KINDS[k][locale]}</span>
            <span className="block text-sm text-muted">{counts[k]} {id ? 'contoh' : 'examples'}</span>
          </button>
        ))}
      </div>
      {!fairness && (
        <button type="button" onClick={() => setWrong(wrong + 2)} className="w-fit rounded-xl border border-danger px-3 py-2 text-sm font-semibold text-danger">
          {id ? '+2 contoh berlabel salah' : '+2 wrongly labelled examples'} ({wrong})
        </button>
      )}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Buah yang diuji' : 'Fruit to test'}
        <select className="rounded-xl border border-line bg-paper p-2.5" value={test} onChange={(e) => setTest(e.target.value as Kind)}>
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <option key={k} value={k}>{KINDS[k][locale]}</option>
          ))}
        </select>
      </label>
      <div className="rounded-2xl bg-paper p-4" role="status">
        <p className="text-sm font-semibold">{id ? 'Keyakinan model' : 'Model confidence'}: {conf}%</p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${conf}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{verdict}</p>
      </div>
      <button type="button" className="w-fit text-sm font-semibold underline" onClick={() => { setCounts({ harumanis: 0, gedong: 0, muda: 0 }); setWrong(0) }}>
        {id ? 'Mulai ulang' : 'Reset'}
      </button>
      <p className="text-xs text-muted">
        {id ? 'Simulasi ini menyederhanakan cara kerja AI untuk keperluan belajar.' : 'This simulation simplifies how AI works, for learning purposes.'}
      </p>
    </section>
  )
}
