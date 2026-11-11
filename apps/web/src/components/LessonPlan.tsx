import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Payload } from 'payload'
import { BIG_IDEA_LABELS, type BigIdea } from '@ailit/shared'
import { KKA_ELEMENTS } from '../collections/KkaOutcomes'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
type Lesson = Record<string, unknown> & { id: number; order: number; title: string; competency: string; alsoCovers?: string[] | null; objective?: string | null; activity?: string | null; content?: unknown; estimatedMinutes?: number | null; quiz?: { prompt: string; options?: { text: string; correct?: boolean | null }[] | null; explanation?: string | null }[] | null; aiActivity?: unknown; projectBrief?: unknown; simulator?: string | null; unit?: unknown }

/** Data a lesson plan needs beyond the lesson itself: unit, KKA outcomes, linked AI Lab activity and brief. */
export async function lessonPlanContext(payload: Payload, lessons: Lesson[], level: string, locale: 'id' | 'en') {
  const units = new Map((await payload.find({ collection: 'units', overrideAccess: true, depth: 0, locale, limit: 20 })).docs.map((u) => [u.id, u]))
  const phases = level === 'smp' ? ['D'] : ['E', 'F']
  const outcomes = (await payload.find({ collection: 'kka-outcomes', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', limit: 100, where: { phase: { in: phases } } })).docs
  return { units, outcomes }
}

/**
 * One printable lesson plan (spec H3, "modul ajar" style): goals, timing, preparation, steps, assessment with
 * answer key, differentiation and AI safety notes. Rendered on screen and printed to PDF by the browser.
 */
export function LessonPlan({ lesson, trackTitle, level, ctx, locale }: { lesson: Lesson; trackTitle: string; level: string; ctx: Awaited<ReturnType<typeof lessonPlanContext>>; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const unit = ctx.units.get(idOf(lesson.unit) ?? -1)
  const comps = [lesson.competency, ...(lesson.alsoCovers ?? [])]
  const kka = ctx.outcomes.filter((o) => ((o.competencies as string[] | null) ?? []).some((c) => comps.includes(c)))
  const minutes = lesson.estimatedMinutes ?? 80
  const intro = Math.round(minutes * 0.15)
  const close = Math.round(minutes * 0.2)
  const ai = lesson.aiActivity && typeof lesson.aiActivity === 'object' ? (lesson.aiActivity as { title: string; goal?: string }) : null
  const brief = lesson.projectBrief && typeof lesson.projectBrief === 'object' ? (lesson.projectBrief as { title: string; rubric?: { criterion: string; description?: string | null }[] | null }) : null
  const row = (k: string, v: React.ReactNode) => (
    <tr className="border-b border-line align-top"><th className="w-44 py-1.5 pr-3 text-left font-medium text-muted">{k}</th><td className="py-1.5">{v}</td></tr>
  )
  return (
    <article className="break-after-page rounded-2xl border border-line bg-white p-6 print:rounded-none print:border-0 print:p-0">
      <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Rencana pembelajaran' : 'Lesson plan'} · {trackTitle}</p>
      <h2 className="mt-1 text-2xl font-bold">{id ? 'Sesi' : 'Session'} {lesson.order}: {lesson.title}</h2>
      <table className="mt-4 w-full text-sm">
        <tbody>
          {row(id ? 'Jenjang / fase' : 'Level / phase', level === 'smp' ? (id ? 'SMP · Fase D' : 'Junior secondary · Phase D') : id ? 'SMA/SMK · Fase E–F' : 'Senior secondary · Phase E–F')}
          {row(id ? 'Gagasan besar' : 'Big idea', unit ? `${BIG_IDEA_LABELS[unit.bigIdea as BigIdea]?.[locale] ?? ''} · ${unit.title}` : '—')}
          {row(id ? 'Kompetensi (can-do)' : 'Can-do statements', comps.join(', '))}
          {row(id ? 'Alokasi waktu' : 'Time', `${minutes} ${id ? 'menit' : 'minutes'}`)}
          {row(id ? 'Capaian KKA terkait' : 'Related KKA outcomes', kka.length ? (
            <ul className="list-disc pl-4">{kka.map((o) => <li key={o.code}><span className="font-mono text-xs">{o.code}</span> {KKA_ELEMENTS.find((e) => e.value === o.element)?.[locale]}: {o.description}{o.status !== 'checked' ? (id ? ' (draf)' : ' (draft)') : ''}</li>)}</ul>
          ) : '—')}
        </tbody>
      </table>

      <h3 className="mt-5 font-semibold">{id ? 'Tujuan pembelajaran' : 'Learning goal'}</h3>
      <p className="mt-1">{lesson.objective ?? '—'}</p>

      <h3 className="mt-5 font-semibold">{id ? 'Persiapan' : 'Preparation'}</h3>
      <ul className="mt-1 list-disc pl-5 text-sm">
        <li>{id ? 'Proyektor atau layar untuk mode presentasi (satu perangkat cukup); siswa dapat mengikuti dari ponsel lewat Kelas Langsung.' : 'A projector or screen for presentation mode (one device is enough); students can follow on phones via Live Class.'}</li>
        {lesson.simulator && <li>{id ? 'Simulator interaktif di halaman sesi (berjalan tanpa internet setelah halaman terbuka).' : 'The interactive simulator on the session page (works without internet once the page is open).'}</li>}
        {ai && <li>{id ? `Akun siswa untuk AI Lab: “${ai.title}”. Pastikan izin orang tua sudah lengkap untuk siswa di bawah 18 tahun.` : `Student accounts for the AI Lab: “${ai.title}”. Check parent consent for under-18s.`}</li>}
        <li>{id ? 'Untuk sekolah dengan koneksi terbatas: simpan sesi untuk dibaca offline sebelum kelas.' : 'With limited connectivity: save the sessions for offline reading before class.'}</li>
      </ul>

      <h3 className="mt-5 font-semibold">{id ? 'Langkah pembelajaran' : 'Steps'}</h3>
      <ol className="mt-1 list-decimal space-y-3 pl-5 text-sm">
        <li><span className="font-semibold">{id ? `Pembuka (${intro} menit)` : `Opening (${intro} min)`}:</span> {id ? 'sampaikan tujuan; tanyakan pengalaman siswa yang terkait dengan topik ini.' : 'share the goal; ask about students’ own experiences with the topic.'}</li>
        <li>
          <span className="font-semibold">{id ? `Kegiatan inti (${minutes - intro - close} menit)` : `Main activity (${minutes - intro - close} min)`}:</span>
          {lesson.activity && <p className="mt-1">{lesson.activity}</p>}
          {Boolean(lesson.content) && <div className="prose prose-sm mt-2 max-w-none"><RichText data={lesson.content as never} /></div>}
          {ai && <p className="mt-1">{id ? `AI Lab: ${ai.goal ?? ai.title}` : `AI Lab: ${ai.goal ?? ai.title}`}</p>}
        </li>
        <li><span className="font-semibold">{id ? `Penutup (${close} menit)` : `Closing (${close} min)`}:</span> {id ? 'kuis singkat, refleksi “apa yang akan kamu lakukan berbeda saat memakai AI?”, dan tandai sesi selesai.' : 'short quiz, reflection “what will you do differently when using AI?”, and mark the session complete.'}</li>
      </ol>

      {(lesson.quiz?.length ?? 0) > 0 && (
        <>
          <h3 className="mt-5 font-semibold">{id ? 'Asesmen: kuis dan kunci jawaban' : 'Assessment: quiz and answer key'}</h3>
          <ol className="mt-1 list-decimal space-y-2 pl-5 text-sm">
            {lesson.quiz!.map((q, i) => (
              <li key={i}>
                {q.prompt}
                <ul className="mt-0.5 pl-1">{(q.options ?? []).map((o, j) => <li key={j}>{String.fromCharCode(65 + j)}. {o.text}{o.correct ? ' ✓' : ''}</li>)}</ul>
                {q.explanation && <p className="text-muted">{q.explanation}</p>}
              </li>
            ))}
          </ol>
        </>
      )}
      {brief && (
        <>
          <h3 className="mt-5 font-semibold">{id ? `Proyek: ${brief.title}` : `Project: ${brief.title}`}</h3>
          <ul className="mt-1 list-disc pl-5 text-sm">{(brief.rubric ?? []).map((r, i) => <li key={i}><span className="font-medium">{r.criterion}</span>{r.description ? ` — ${r.description}` : ''}</li>)}</ul>
        </>
      )}

      <h3 className="mt-5 font-semibold">{id ? 'Diferensiasi' : 'Differentiation'}</h3>
      <ul className="mt-1 list-disc pl-5 text-sm">
        <li>{id ? 'Perlu dukungan: kerjakan berpasangan, beri contoh jawaban, gunakan mode presentasi bersama.' : 'Needs support: work in pairs, show a worked example, use shared presentation mode.'}</li>
        <li>{id ? 'Siap tantangan: minta siswa membuat contoh sendiri dari kehidupan di sekitarnya dan menjelaskan risikonya.' : 'Ready for more: students create their own local example and explain its risks.'}</li>
      </ul>
      <h3 className="mt-5 font-semibold">{id ? 'Catatan keamanan' : 'Safety notes'}</h3>
      <p className="mt-1 text-sm">{id ? 'Ingatkan siswa untuk tidak memasukkan data pribadi ke layanan AI. Percakapan AI Lab dapat dibaca guru kelas; tanda bahaya muncul di Ruang Guru.' : 'Remind students not to type personal data into AI services. Teachers can read AI Lab chats in their class; flagged messages appear in the Teacher space.'}</p>
    </article>
  )
}
