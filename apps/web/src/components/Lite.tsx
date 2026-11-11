'use client'
import { useEffect, useState } from 'react'

const COOKIE = 'hemat'
const setLite = (on: boolean) => {
  document.cookie = `${COOKIE}=${on ? '1' : '0'}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
  window.location.reload()
}

/** On/off switch for low-bandwidth mode (stored on this device). */
export function LiteToggle({ on, locale }: { on: boolean; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={on} onChange={(e) => setLite(e.target.checked)} />
      {id ? 'Mode hemat data: gambar dan video dimuat hanya bila diminta' : 'Data saver: images and videos load only when you ask'}
    </label>
  )
}

/** Suggests data saver once on slow or metered connections (navigator.connection), unless already decided. */
export function LiteSuggest({ on, locale }: { on: boolean; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (on || document.cookie.includes(`${COOKIE}=`)) return
    const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (c && (c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? ''))) setShow(true)
  }, [on])
  if (!show) return null
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-4 py-2 text-sm">
      <span>{id ? 'Koneksi tampaknya lambat. Aktifkan mode hemat data?' : 'Your connection looks slow. Turn on data saver?'}</span>
      <span className="flex gap-3">
        <button type="button" className="font-semibold underline" onClick={() => setLite(true)}>{id ? 'Aktifkan' : 'Turn on'}</button>
        <button type="button" className="underline" onClick={() => { document.cookie = `${COOKIE}=0; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`; setShow(false) }}>{id ? 'Tidak' : 'No'}</button>
      </span>
    </div>
  )
}

/** A lesson video: plays normally, or in data saver shows a button with the file size first. */
export function LessonVideo({ src, type, size, lite, locale }: { src: string; type?: string | null; size: string; lite: boolean; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [load, setLoad] = useState(!lite)
  if (!load)
    return (
      <button type="button" onClick={() => setLoad(true)} className="w-full rounded-2xl border border-line bg-paper p-4 text-left">
        <span className="font-semibold">▶ {id ? 'Putar video' : 'Play video'}</span>
        {size && <span className="text-sm text-muted"> · {size}</span>}
        <span className="block text-xs text-muted">{id ? 'Mode hemat data aktif: video dimuat setelah ditekan.' : 'Data saver is on: the video loads when you tap.'}</span>
      </button>
    )
  return (
    <video controls preload="metadata" className="w-full rounded-2xl bg-black" autoPlay={lite}>
      <source src={src} type={type ?? undefined} />
    </video>
  )
}
