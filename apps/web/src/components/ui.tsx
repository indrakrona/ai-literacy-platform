import React from 'react'

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">{children}</div>
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="text-sm text-muted">{hint}</span>}
      {error && <span className="text-sm font-medium text-danger">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-base outline-none focus:border-ink focus:ring-2 focus:ring-brand/40'

export function Button({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const base = 'w-full rounded-xl px-5 py-3.5 text-base font-semibold transition disabled:opacity-60'
  const style =
    variant === 'primary' ? 'bg-ink text-paper hover:bg-black' : 'border border-ink bg-transparent text-ink hover:bg-ink/5'
  return (
    <button {...props} className={`${base} ${style} ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'ok'; title?: string; children?: React.ReactNode }) {
  const tones = {
    info: 'border-line bg-paper',
    warn: 'border-brand/40 bg-brand/10',
    ok: 'border-ok/40 bg-ok/10',
  }
  return (
    <div role="status" className={`rounded-2xl border p-4 ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  )
}
