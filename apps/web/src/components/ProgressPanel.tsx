import { BIG_IDEAS, BIG_IDEA_LABELS } from '@ailit/shared'
import type { Payload } from 'payload'
import { Card } from './ui'
import { JoinChallengeButton } from './forms/ChallengeForms'
import { challengeProgress, progressOf } from '../lib/gamification'

/** A student's own progress: levels per big idea, badges and class challenges. Never compared with others. */
export async function ProgressPanel({ payload, userId, classIds, locale }: { payload: Payload; userId: number; classIds: number[]; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const { xp, levels, total } = await progressOf(payload, userId)
  const badges = (await payload.find({ collection: 'badges', locale, overrideAccess: true, depth: 0, limit: 100, sort: 'order', where: { active: { equals: true } } })).docs
  const owned = new Set((await payload.find({ collection: 'user-badges', overrideAccess: true, depth: 0, limit: 200, where: { user: { equals: userId } } })).docs.map((u) => (typeof u.badge === 'object' ? u.badge.id : u.badge)))
  const now = new Date().toISOString()
  const challenges = classIds.length
    ? (await payload.find({ collection: 'challenges', overrideAccess: true, depth: 0, limit: 20, sort: 'endsAt', where: { and: [{ class: { in: classIds } }, { endsAt: { greater_than_equal: now } }] } })).docs
    : []
  const rows = await Promise.all(challenges.map(async (c) => ({
    c,
    joined: (c.participants ?? []).some((p) => (typeof p === 'object' ? p.id : p) === userId),
    done: await challengeProgress(payload, userId, c),
  })))

  return (
    <section id="kemajuan" className="flex flex-col gap-4">
      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{id ? 'Kemajuanku' : 'My progress'}</h2>
          <p className="text-sm text-muted tabular-nums">{total} XP</p>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {BIG_IDEAS.map((b) => {
            const l = levels[b]
            return (
              <li key={b} className="rounded-2xl border border-line bg-paper p-3">
                <p className="text-sm font-semibold">{BIG_IDEA_LABELS[b][locale]}</p>
                <p className="text-2xl font-bold">{id ? 'Lv' : 'Lv'} {l.level}</p>
                <div className="mt-2 h-2 rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(l.progress * 100)} aria-label={`${BIG_IDEA_LABELS[b][locale]}: ${xp[b]} XP`}>
                  <div className="h-2 rounded-full bg-brand-deep" style={{ width: `${Math.round(l.progress * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted tabular-nums">{xp[b]} XP{l.next !== null ? ` · ${l.next - xp[b]} ${id ? 'lagi ke Lv' : 'to Lv'} ${l.level + 1}` : ` · ${id ? 'level tertinggi' : 'top level'}`}</p>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">{id ? 'Lencana' : 'Badges'} <span className="text-sm font-normal text-muted">{owned.size}/{badges.length}</span></h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((b) => {
            const has = owned.has(b.id)
            return (
              <li key={b.id} className={`rounded-2xl border p-3 text-center ${has ? 'border-brand/40 bg-brand/5' : 'border-line bg-paper opacity-60'}`}>
                <p className={`text-3xl ${has ? '' : 'grayscale'}`} aria-hidden="true">{b.icon}</p>
                <p className="mt-1 text-sm font-semibold">{b.name}</p>
                {b.description && <p className="mt-0.5 text-xs text-muted">{b.description}</p>}
                <p className="sr-only">{has ? (id ? 'Sudah didapat' : 'Earned') : id ? 'Belum didapat' : 'Not earned yet'}</p>
              </li>
            )
          })}
        </ul>
      </Card>

      {rows.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Tantangan kelas' : 'Class challenges'}</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {rows.map(({ c, joined, done }) => {
              const target = c.target ?? 1
              const complete = done >= target
              return (
                <li key={c.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-sm text-muted">
                        {target} {id ? 'pelajaran' : 'lessons'}{c.bigIdea ? ` · ${BIG_IDEA_LABELS[c.bigIdea as keyof typeof BIG_IDEA_LABELS][locale]}` : ''} · {id ? 'sampai' : 'until'} {new Date(c.endsAt).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      {c.description && <p className="mt-1 text-sm">{c.description}</p>}
                    </div>
                    {!joined && <JoinChallengeButton challengeId={c.id} locale={locale} />}
                  </div>
                  {joined && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-paper"><div className="h-2 rounded-full bg-brand-deep" style={{ width: `${Math.min(100, (done / target) * 100)}%` }} /></div>
                      <p className="mt-1 text-xs text-muted">{complete ? (id ? 'Selesai! 🎉' : 'Done! 🎉') : `${Math.min(done, target)}/${target}`}</p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </section>
  )
}
