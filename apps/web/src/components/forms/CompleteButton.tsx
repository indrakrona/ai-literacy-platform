'use client'
import { useState } from 'react'
import { Button } from '../ui'
import { api } from './api'
import { queueCompletion } from '../Offline'

export function CompleteButton({ lessonId, done, labels }: { lessonId: number; done: boolean; labels: { markDone: string; done: string } }) {
  const [isDone, setDone] = useState(done)
  const [busy, setBusy] = useState(false)
  const [queued, setQueued] = useState(false)
  if (queued) return <p className="rounded-xl bg-paper px-4 py-3 text-center font-semibold">✓ {labels.done} · <span className="font-normal text-muted">offline</span></p>
  if (isDone) return <p className="rounded-xl bg-ok/10 px-4 py-3 text-center font-semibold text-ok">✓ {labels.done}</p>
  return (
    <Button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const res = await api('/api/lesson-progress/complete', { body: { lessonId } })
          if (res.ok) setDone(true)
        } catch {
          // No connection: remember it and send it when back online.
          queueCompletion(lessonId)
          setQueued(true)
        }
        setBusy(false)
      }}
    >
      {labels.markDone}
    </Button>
  )
}
