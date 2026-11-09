import Link from 'next/link'

/** Top menu for visitors: inline on wide screens, a simple disclosure menu on phones. */
export function PublicNav({ items, menuLabel }: { items: { label: string; href: string }[]; menuLabel: string }) {
  if (!items.length) return null
  return (
    <>
      <div className="hidden items-center gap-4 md:flex">
        {items.map((i) => <Link key={i.href} href={i.href} className="font-medium text-muted hover:text-ink">{i.label}</Link>)}
      </div>
      <details className="relative md:hidden">
        <summary className="cursor-pointer list-none rounded-lg border border-line px-2.5 py-1">{menuLabel}</summary>
        <div className="absolute right-0 z-40 mt-2 flex w-56 flex-col rounded-xl border border-line bg-white p-2 shadow-lg">
          {items.map((i) => <Link key={i.href} href={i.href} className="rounded-lg px-3 py-2 hover:bg-paper">{i.label}</Link>)}
        </div>
      </details>
    </>
  )
}
