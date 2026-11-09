import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '../../payload-types'
import { PilotForm } from './PilotForm'

type Block = NonNullable<Page['layout']>[number]
type LinkVal = { label?: string | null; href?: string | null } | null | undefined

function Btn({ link, primary }: { link: LinkVal; primary?: boolean }) {
  if (!link?.label || !link.href) return null
  const cls = primary ? 'bg-ink text-paper' : 'border border-ink'
  return <Link href={link.href} className={`rounded-xl px-6 py-3.5 text-center font-semibold ${cls}`}>{link.label}</Link>
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-bold sm:text-3xl">{children}</h2>

export function Blocks({ blocks, locale }: { blocks: Page['layout']; locale: 'id' | 'en' }) {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {(blocks ?? []).map((b, i) => <BlockView key={b.id ?? i} block={b} locale={locale} first={i === 0} />)}
    </div>
  )
}

function BlockView({ block: b, locale, first }: { block: Block; locale: 'id' | 'en'; first: boolean }) {
  switch (b.blockType) {
    case 'hero': {
      const Heading = first ? 'h1' : 'h2'
      return (
        <section className="flex flex-col gap-5 pt-4 sm:pt-10">
          {b.eyebrow && <p className="text-sm font-semibold tracking-widest text-brand-deep uppercase">{b.eyebrow}</p>}
          <Heading className="max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">{b.heading}</Heading>
          {b.lead && <p className="max-w-2xl text-lg text-muted">{b.lead}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Btn link={b.primary} primary />
            <Btn link={b.secondary} />
          </div>
        </section>
      )
    }
    case 'notice':
      return <p className="rounded-2xl border border-brand/40 bg-brand/10 p-4 text-sm">{b.text}</p>
    case 'features':
      return (
        <section className="flex flex-col gap-5">
          {b.heading && <H2>{b.heading}</H2>}
          {b.intro && <p className="max-w-2xl text-muted">{b.intro}</p>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(b.items ?? []).map((it, i) => (
              <li key={it.id ?? i} className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-semibold">{it.title}</h3>
                {it.body && <p className="mt-1 text-sm text-muted">{it.body}</p>}
              </li>
            ))}
          </ul>
        </section>
      )
    case 'steps':
      return (
        <section className="flex flex-col gap-5">
          {b.heading && <H2>{b.heading}</H2>}
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(b.items ?? []).map((it, i) => (
              <li key={it.id ?? i} className="rounded-2xl border border-line bg-white p-5">
                <span className="text-sm font-bold text-brand-deep">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-1 font-semibold">{it.title}</h3>
                {it.body && <p className="mt-1 text-sm text-muted">{it.body}</p>}
              </li>
            ))}
          </ol>
        </section>
      )
    case 'text':
      return (
        <section className="max-w-3xl">
          {b.heading && <H2>{b.heading}</H2>}
          <div className="prose mt-2"><RichText data={b.body} /></div>
        </section>
      )
    case 'faq':
      return (
        <section className="flex max-w-3xl flex-col gap-4">
          {b.heading && <H2>{b.heading}</H2>}
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {(b.items ?? []).map((it, i) => (
              <details key={it.id ?? i} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="mr-2 inline-block text-brand-deep transition group-open:rotate-90" aria-hidden="true">›</span>
                  {it.question}
                </summary>
                <p className="mt-2 whitespace-pre-line text-muted">{it.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )
    case 'cta':
      return (
        <section className="flex flex-col items-start gap-4 rounded-3xl bg-ink p-8 text-paper sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">{b.heading}</h2>
          {b.body && <p className="max-w-2xl opacity-80">{b.body}</p>}
          {b.button?.label && b.button.href && <Link href={b.button.href} className="rounded-xl bg-paper px-6 py-3.5 font-semibold text-ink">{b.button.label}</Link>}
        </section>
      )
    case 'pilotForm':
      return (
        <section id="pilot" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 sm:p-8">
          {b.heading && <H2>{b.heading}</H2>}
          {b.intro && <p className="text-muted">{b.intro}</p>}
          <PilotForm locale={locale} />
        </section>
      )
    default:
      return null
  }
}
