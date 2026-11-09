'use client'
import { useEffect } from 'react'

/** Send one of the browser-only analytics events. Silent on failure; only for signed-in users. */
export function trackClient(name: 'lesson_started' | 'quiz_submitted' | 'certificate_shared', props?: Record<string, string | number>, track?: string) {
  void fetch('/api/analytics-events/track', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, props, track }),
    keepalive: true,
  }).catch(() => undefined)
}

/** Fires an event once when the page mounts. */
export function TrackOnMount({ name, props, track }: { name: 'lesson_started'; props?: Record<string, string | number>; track?: string }) {
  useEffect(() => {
    trackClient(name, props, track)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
