'use client'
import { api } from './api'

export function LogoutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await api('/api/users/logout')
        window.location.href = '/'
      }}
    >
      {label}
    </button>
  )
}
