'use client'
import { useState } from 'react'
import { ReportButton } from './ReportButton'
import { api } from './forms/api'

interface Msg {
  role: 'user' | 'assistant'
  content: string
  status?: string
}

const L = {
  id: { placeholder: 'Tulis pertanyaanmu…', send: 'Kirim', try: 'Coba mulai dengan:', mock: 'Mode uji: AI sungguhan belum diaktifkan, jawaban berasal dari simulasi.', shieldTip: 'Jangan pernah menulis data pribadi di AI Lab.', reflect: 'Refleksi', sending: 'Mengirim…', logNote: 'Percakapan ini disimpan dan dapat dibaca oleh gurumu.' },
  en: { placeholder: 'Type your question…', send: 'Send', try: 'Try starting with:', mock: 'Test mode: real AI is not switched on yet; replies are simulated.', shieldTip: 'Never write personal data in the AI Lab.', reflect: 'Reflection', sending: 'Sending…', logNote: 'This conversation is saved and your teacher can read it.' },
}

export function AiLabChat({ activityId, starters, reflection, locale }: { activityId: number; starters: string[]; reflection: string[]; locale: 'id' | 'en' }) {
  const t = L[locale]
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [convo, setConvo] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [mock, setMock] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(message: string) {
    if (!message.trim()) return
    setBusy(true)
    setError(null)
    setMsgs((m) => [...m, { role: 'user', content: message }])
    setText('')
    const res = await api<{ conversation: number; status: string; reply: string; mock: boolean }>('/api/ai-conversations/send', {
      body: { activity: activityId, conversation: convo, message, locale },
    })
    setBusy(false)
    if (!res.ok) {
      setMsgs((m) => m.slice(0, -1))
      return setError(res.data.error ?? 'Error')
    }
    setConvo(res.data.conversation)
    setMock(res.data.mock)
    setMsgs((m) => {
      const copy = [...m]
      if (res.data.status === 'shield') copy[copy.length - 1] = { role: 'user', content: '•••', status: 'shield' }
      return [...copy, { role: 'assistant', content: res.data.reply, status: res.data.status }]
    })
  }

  return (
    <section className="flex flex-col gap-4">
      {mock && <p className="rounded-xl bg-brand/10 p-3 text-sm">{t.mock}</p>}
      {msgs.length === 0 && starters.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{t.try}</p>
          {starters.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border border-line bg-white px-3 py-2 text-left text-sm">
              {s}
            </button>
          ))}
        </div>
      )}
      <ol className="flex flex-col gap-3" aria-live="polite">
        {msgs.map((m, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-line ${
              m.role === 'user' ? 'self-end bg-ink text-paper' : m.status && m.status !== 'answered' ? 'border border-brand/40 bg-brand/10' : 'border border-line bg-white'
            }`}
          >
            {m.content}
            {m.status === 'shield' && <p className="mt-2 text-xs font-semibold">{t.shieldTip}</p>}
            {m.role === 'assistant' && m.status === 'answered' && (
              <div className="mt-2"><ReportButton targetType="ai_reply" targetId={convo ? `${convo}:${i}` : undefined} locale={locale} compact /></div>
            )}
          </li>
        ))}
      </ol>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void send(text)
        }}
      >
        <label className="sr-only" htmlFor="lab-input">{t.placeholder}</label>
        <input id="lab-input" className="flex-1 rounded-xl border border-line bg-paper px-3.5 py-3" placeholder={t.placeholder} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        <button type="submit" disabled={busy || !text.trim()} className="rounded-xl bg-ink px-4 font-semibold text-paper disabled:opacity-60">
          {busy ? t.sending : t.send}
        </button>
      </form>
      <p className="text-xs text-muted">{t.logNote}</p>
      {msgs.length >= 4 && reflection.length > 0 && (
        <div className="rounded-2xl bg-paper p-4">
          <p className="font-semibold">{t.reflect}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {reflection.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
