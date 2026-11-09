'use client'
import { useEffect } from 'react'

/** Marks everything read once the list has been seen, so the bell count clears on the next page. */
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) void fetch('/api/notifications/read', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  }, [hasUnread])
  return null
}
