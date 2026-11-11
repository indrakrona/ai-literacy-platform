'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '../ui'
import { api, errorText } from './api'

type Q = { prompt: string; options: string[]; answer: number; why: string }

/** Practice questions at the end of a module: instant feedback, nothing recorded. */
export function PracticeCheck({ questions, labels }: { questions: Q[]; labels: { title: string; right: string; wrong: string } }) {
  const [picks, setPicks] = useState<Record<number, number>>({})
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{labels.title}</h2>
      {questions.map((q, i) => {
        const pick = picks[i]
        return (
          <div key={i} className="rounded-2xl border border-line bg-white p-4">
            <p id={`pq-${i}`} className="font-medium">{i + 1}. {q.prompt}</p>
            <div role="radiogroup" aria-labelledby={`pq-${i}`} className="mt-2 flex flex-col gap-2">
              {q.options.map((o, j) => {
                const tone = pick === undefined ? 'border-line hover:border-ink' : j === q.answer ? 'border-ok bg-ok/5' : pick === j ? 'border-danger bg-danger/5' : 'border-line opacity-70'
                return (
                  <button key={j} type="button" role="radio" aria-checked={pick === j} disabled={pick !== undefined} onClick={() => setPicks({ ...picks, [i]: j })} className={`rounded-xl border-2 p-3 text-left ${tone}`}>
                    {o}
                  </button>
                )
              })}
            </div>
            {pick !== undefined && (
              <p role="status" className="mt-2 text-sm">
                <span className="font-semibold">{pick === q.answer ? labels.right : labels.wrong}</span> {q.why}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}

/** Mark a module as studied, then go to the next one (or back to the course page). */
export function MarkModuleDone({ module, done, next, labels }: { module: string; done: boolean; next: string; labels: { mark: string; done: string; next: string } }) {
  const [isDone, setDone] = useState(done)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="flex flex-col gap-2">
      {isDone ? (
        <p className="rounded-xl bg-ok/10 px-4 py-3 text-center font-semibold text-ok">✓ {labels.done}</p>
      ) : (
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const res = await api('/api/teacher-certifications/module', { body: { module } })
            setBusy(false)
            if (res.ok) setDone(true)
            else setError(errorText(res.data, 'Error'))
          }}
        >
          {labels.mark}
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {isDone && <Link href={next} className="text-center font-semibold underline">{labels.next} →</Link>}
    </div>
  )
}

type ExamQ = { id: string; prompt: string; options: string[] }
type Result = { passed: boolean; correct: number; total: number; results: { id: string; correct: boolean }[]; weakModules: string[]; code: string | null; retryAt: string | null }

/** The certification exam. Answers go to the server, which scores them; the page never has the key. */
export function ExamForm({ questions, moduleTitles, locale }: { questions: ExamQ[]; moduleTitles: Record<string, string>; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const answered = Object.keys(answers).length
  if (result) {
    const wrong = new Set(result.results.filter((r) => !r.correct).map((r) => r.id))
    return (
      <div className="flex flex-col gap-4" role="status">
        <div className={`rounded-2xl p-5 ${result.passed ? 'bg-ok/10' : 'bg-danger/5'}`}>
          <p className="text-2xl font-bold">{result.passed ? (id ? 'Selamat, Anda lulus!' : 'Congratulations, you passed!') : id ? 'Belum lulus kali ini' : 'Not passed this time'}</p>
          <p className="mt-1">{id ? `Skor: ${result.correct} dari ${result.total} benar (batas lulus 80%).` : `Score: ${result.correct} of ${result.total} correct (pass mark 80%).`}</p>
          {result.passed && result.code && <p className="mt-2">{id ? 'Kode sertifikat' : 'Certificate code'}: <span className="font-mono font-bold">{result.code}</span></p>}
          {!result.passed && result.retryAt && (
            <p className="mt-2 text-sm">{id ? `Anda dapat mencoba lagi mulai ${new Date(result.retryAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.` : `You can try again from ${new Date(result.retryAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`}</p>
          )}
        </div>
        {!result.passed && result.weakModules.length > 0 && (
          <div>
            <p className="font-semibold">{id ? 'Pelajari kembali modul ini:' : 'Review these modules:'}</p>
            <ul className="mt-1 list-disc pl-5">{result.weakModules.map((m) => <li key={m}><Link className="underline" href={`/guru/pelatihan/${m}`}>{moduleTitles[m] ?? m}</Link></li>)}</ul>
          </div>
        )}
        <p className="text-sm text-muted">{id ? `Soal yang belum tepat: ${wrong.size ? questions.map((q, i) => (wrong.has(q.id) ? i + 1 : null)).filter(Boolean).join(', ') : 'tidak ada'}.` : `Questions to revisit: ${wrong.size ? questions.map((q, i) => (wrong.has(q.id) ? i + 1 : null)).filter(Boolean).join(', ') : 'none'}.`}</p>
        <Button type="button" onClick={() => router.push('/guru/pelatihan')}>{id ? 'Kembali ke halaman pelatihan' : 'Back to the training page'}</Button>
      </div>
    )
  }
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (answered < questions.length) {
          setError(id ? 'Jawab semua soal terlebih dahulu.' : 'Answer every question first.')
          return
        }
        setBusy(true)
        setError('')
        const res = await api<Result>('/api/teacher-certifications/exam', { body: { answers } })
        setBusy(false)
        // No router.refresh() here: the exam page redirects certified teachers, which would hide the result.
        if (res.ok) setResult(res.data)
        else setError(errorText(res.data, id ? 'Gagal mengirim jawaban.' : 'Could not send your answers.'))
      }}
    >
      {questions.map((q, i) => (
        <fieldset key={q.id} className="rounded-2xl border border-line bg-white p-4">
          <legend className="sr-only">{id ? `Soal ${i + 1}` : `Question ${i + 1}`}</legend>
          <p className="font-medium">{i + 1}. {q.prompt}</p>
          <div className="mt-2 flex flex-col gap-2">
            {q.options.map((o, j) => (
              <label key={j} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${answers[q.id] === j ? 'border-ink' : 'border-line'}`}>
                <input type="radio" name={q.id} className="mt-1" checked={answers[q.id] === j} onChange={() => setAnswers((a) => ({ ...a, [q.id]: j }))} />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{answered}/{questions.length} {id ? 'terjawab' : 'answered'}</span>
        <Button type="submit" disabled={busy}>{busy ? '…' : id ? 'Kirim jawaban' : 'Submit answers'}</Button>
      </div>
    </form>
  )
}

/** Download the certificate PDF in either language. */
export function TeacherCertificateLinks({ code, locale }: { code: string; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  return (
    <p className="flex flex-wrap gap-4 text-sm">
      <a className="font-semibold underline" href={`/api/teacher-certifications/code/${code}/pdf?lang=${locale}`}>{id ? 'Unduh sertifikat (PDF)' : 'Download certificate (PDF)'}</a>
      <a className="underline" href={`/api/teacher-certifications/code/${code}/pdf?lang=${id ? 'en' : 'id'}`}>{id ? 'Versi bahasa Inggris' : 'Bahasa Indonesia version'}</a>
      <Link className="underline" href={`/verifikasi/${code}`}>{id ? 'Halaman verifikasi' : 'Verification page'}</Link>
    </p>
  )
}
