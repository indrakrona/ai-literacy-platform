'use client'
import { useState } from 'react'
import { Button } from '../ui'
import { api } from './api'

export function CompleteButton({ lessonId, done, labels }: { lessonId: number; done: boolean; labels: { markDone: string; done: string } }) {
  const [isDone, setDone] = useState(done)
  const [busy, setBusy] = useState(false)
  if (isDone) return <p className="rounded-xl bg-ok/10 px-4 py-3 text-center font-semibold text-ok">✓ {labels.done}</p>
  return (
    <Button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const res = await api('/api/lesson-progress/complete', { body: { lessonId } })
        setBusy(false)
        if (res.ok) setDone(true)
      }}
    >
      {labels.markDone}
    </Button>
  )
}
