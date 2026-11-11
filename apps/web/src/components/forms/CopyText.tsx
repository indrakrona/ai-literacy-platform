'use client'
import { useState } from 'react'

export function CopyText({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="text-sm font-semibold underline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? done : label}
    </button>
  )
}
