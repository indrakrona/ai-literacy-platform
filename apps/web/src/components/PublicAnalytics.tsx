'use client'
import { useEffect, useState } from 'react'

const COOKIE = 'analytics_consent'

function readConsent(): 'yes' | 'no' | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(yes|no)`))
  return (m?.[1] as 'yes' | 'no' | undefined) ?? null
}

function loadGa(gaId: string) {
  if (document.getElementById('ga4')) return
  const s = document.createElement('script')
  s.id = 'ga4'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
  document.head.appendChild(s)
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  // No advertising features; IP handling follows GA4 defaults.
  w.gtag('config', gaId, { allow_google_signals: false, allow_ad_personalization_signals: false })
}

/**
 * Google Analytics 4 for the PUBLIC website only (never inside the student area), loaded only after
 * the visitor accepts analytics cookies. Renders nothing when no GA ID is configured.
 */
export function PublicAnalytics({ gaId, locale }: { gaId?: string; locale: 'id' | 'en' }) {
  const [consent, setConsent] = useState<'yes' | 'no' | null | 'unknown'>('unknown')
  useEffect(() => {
    const c = readConsent()
    setConsent(c)
    // Data saver skips optional third-party scripts.
    if (c === 'yes' && gaId && !document.cookie.includes('hemat=1')) loadGa(gaId)
  }, [gaId])
  if (!gaId || consent !== null) return null
  const id = locale === 'id'
  const decide = (v: 'yes' | 'no') => {
    document.cookie = `${COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`
    setConsent(v)
    if (v === 'yes') loadGa(gaId)
  }
  return (
    <div role="dialog" aria-label={id ? 'Persetujuan cookie' : 'Cookie consent'} className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-white p-4 shadow-lg">
      <p className="text-sm">
        {id
          ? 'Kami ingin memakai cookie analitik (Google Analytics) di situs publik ini untuk memahami dari mana pengunjung datang. Tidak dipakai di area belajar siswa dan tidak untuk iklan.'
          : 'We would like to use analytics cookies (Google Analytics) on this public site to understand where visitors come from. They are never used in the student area or for advertising.'}
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => decide('yes')} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper">{id ? 'Izinkan' : 'Allow'}</button>
        <button onClick={() => decide('no')} className="rounded-xl border border-ink px-4 py-2 text-sm font-semibold">{id ? 'Tolak' : 'Decline'}</button>
      </div>
    </div>
  )
}
