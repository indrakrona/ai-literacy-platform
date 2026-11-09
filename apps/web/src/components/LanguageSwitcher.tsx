'use client'
import { useRouter } from 'next/navigation'

export function LanguageSwitcher({ locale }: { locale: 'id' | 'en' }) {
  const router = useRouter()
  const set = (l: 'id' | 'en') => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }
  return (
    <div className="flex rounded-lg border border-line text-sm font-semibold" role="group" aria-label="Language">
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={locale === l}
          className={`px-2.5 py-1 ${locale === l ? 'bg-ink text-paper' : 'text-muted'} first:rounded-l-lg last:rounded-r-lg`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
