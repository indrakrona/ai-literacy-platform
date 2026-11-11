'use client'
import { useEffect, useState } from 'react'

const PENDING = 'ailit-pending-complete'

function readPending(): number[] {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING) ?? '[]') as number[]
  } catch {
    return []
  }
}
function writePending(ids: number[]) {
  try {
    window.localStorage.setItem(PENDING, JSON.stringify([...new Set(ids)]))
  } catch {
    /* storage unavailable */
  }
}

/** Remember a lesson completion made offline; it is sent when the connection returns. */
export function queueCompletion(lessonId: number) {
  writePending([...readPending(), lessonId])
}

async function flushPending() {
  const ids = readPending()
  if (!ids.length || !navigator.onLine) return
  const left: number[] = []
  for (const lessonId of ids) {
    try {
      const res = await fetch('/api/lesson-progress/complete', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId }) })
      if (!res.ok && res.status >= 500) left.push(lessonId)
    } catch {
      left.push(lessonId)
    }
  }
  writePending(left)
}

/** Registers the service worker and sends offline completions when back online. Renders an offline banner. */
export function OfflineSupport({ locale }: { locale: 'id' | 'en' }) {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    const on = () => {
      setOffline(false)
      void flushPending()
    }
    const off = () => setOffline(true)
    setOffline(!navigator.onLine)
    void flushPending()
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (!offline) return null
  return (
    <div role="status" className="bg-ink px-4 py-2 text-center text-sm font-semibold text-paper">
      {locale === 'id' ? 'Kamu sedang offline. Pelajaran yang disimpan tetap bisa dibaca; kemajuan dikirim saat online lagi.' : 'You are offline. Saved lessons can still be read; progress is sent when you are back online.'}
    </div>
  )
}

/** "Save this track for offline": stores every session page of the track in the service worker cache. */
export function SaveOffline({ urls, locale }: { urls: string[]; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [state, setState] = useState<{ done: number; total: number } | null>(null)
  const [unsupported, setUnsupported] = useState(false)
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('caches' in window)) setUnsupported(true)
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'save-progress') setState({ done: e.data.done, total: e.data.total })
    }
    navigator.serviceWorker?.addEventListener('message', onMsg)
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg)
  }, [])
  if (unsupported) return null
  const saving = state && state.done < state.total
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={Boolean(saving)}
        className="rounded-xl border border-ink px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        onClick={async () => {
          const reg = await navigator.serviceWorker.register('/sw.js')
          await navigator.serviceWorker.ready
          setState({ done: 0, total: urls.length })
          ;(reg.active ?? navigator.serviceWorker.controller)?.postMessage({ type: 'save-pages', urls })
        }}
      >
        {id ? '⤓ Simpan semua sesi untuk dibaca offline' : '⤓ Save every session for offline reading'}
      </button>
      {state && (
        <span className="text-sm text-muted" aria-live="polite">
          {state.done < state.total ? (id ? `Menyimpan ${state.done}/${state.total}…` : `Saving ${state.done}/${state.total}…`) : id ? `${state.total} sesi tersimpan di perangkat ini.` : `${state.total} sessions saved on this device.`}
        </span>
      )}
    </div>
  )
}
