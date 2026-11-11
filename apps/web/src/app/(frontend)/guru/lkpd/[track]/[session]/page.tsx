import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { canDo, hasRole } from '@ailit/shared'
import { Shell } from '../../../../../../components/Shell'
import { PrintButton } from '../../../../../../components/forms/DataRightsForms'
import { getDict } from '../../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../../lib/session'
import { loadSession, REFLECTION_PROMPTS } from '../../../../../../lib/teaching-materials'

/**
 * Student worksheet (LKPD) for one session, for classes that work on paper or share devices (spec H3).
 * Questions are printed without the answer key; the key is in the lesson plan.
 */
export default async function WorksheetPage({ params }: { params: Promise<{ track: string; session: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'content_editor', 'content_reviewer', 'super_admin')) notFound()
  const { track: slug, session } = await params
  const { locale } = await getDict()
  const id = locale === 'id'
  const found = await loadSession(await getPayloadClient(), slug, Number(session), locale)
  if (!found) notFound()
  const { track, lesson } = found
  const lines = (count: number) => (
    <div aria-hidden>{Array.from({ length: count }).map((_, i) => <div key={i} className="h-8 border-b border-dotted border-muted" />)}</div>
  )
  const brief = lesson.projectBrief && typeof lesson.projectBrief === 'object' ? lesson.projectBrief : null
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span className="flex gap-4 text-sm">
            <Link className="underline" href={`/guru/rpp/${slug}/${lesson.order}`}>{id ? 'Rencana pembelajaran (kunci jawaban)' : 'Lesson plan (answer key)'}</Link>
            <Link className="underline" href={`/guru/slide/${slug}/${lesson.order}`}>{id ? 'Slide' : 'Slides'}</Link>
          </span>
          <PrintButton label={id ? 'Cetak / simpan PDF' : 'Print / save as PDF'} />
        </div>
        <article className="rounded-2xl border border-line bg-white p-6 print:rounded-none print:border-0 print:p-0">
          <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Lembar Kerja Peserta Didik' : 'Student worksheet'} · {track.title}</p>
          <h1 className="mt-1 text-2xl font-bold">{id ? 'Sesi' : 'Session'} {lesson.order}: {lesson.title}</h1>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {[id ? 'Nama' : 'Name', id ? 'Kelas' : 'Class', id ? 'Tanggal' : 'Date'].map((f) => (
              <div key={f} className="flex items-end gap-2"><span className="font-medium">{f}:</span><span className="h-6 flex-1 border-b border-muted" /></div>
            ))}
          </div>

          {lesson.objective && (
            <section className="mt-5">
              <h2 className="font-semibold">{id ? 'Tujuan' : 'Goal'}</h2>
              <p className="mt-1 text-sm">{lesson.objective}</p>
            </section>
          )}

          {lesson.activity && (
            <section className="mt-5 break-inside-avoid">
              <h2 className="font-semibold">{id ? 'Kegiatan' : 'Activity'}</h2>
              <p className="mt-1 text-sm">{lesson.activity}</p>
              <p className="mt-2 text-xs text-muted">{id ? 'Catat hasil kegiatanmu atau kelompokmu di bawah ini.' : 'Write down what you or your group found.'}</p>
              {lines(6)}
            </section>
          )}

          {brief && (
            <section className="mt-5 break-inside-avoid">
              <h2 className="font-semibold">{id ? 'Proyek' : 'Project'}: {brief.title}</h2>
              <p className="mt-1 text-sm">{brief.problem}</p>
              <p className="mt-2 text-xs text-muted">{id ? 'Rencana kelompok: siapa mengerjakan apa, dan bagian mana yang akan dibantu AI?' : 'Group plan: who does what, and which parts will AI help with?'}</p>
              {lines(4)}
            </section>
          )}

          {(lesson.quiz?.length ?? 0) > 0 && (
            <section className="mt-5">
              <h2 className="font-semibold">{id ? 'Latihan' : 'Practice'}</h2>
              <p className="text-xs text-muted">{id ? 'Lingkari satu jawaban yang paling tepat, lalu tulis alasanmu.' : 'Circle the best answer, then write your reason.'}</p>
              <ol className="mt-2 list-decimal space-y-4 pl-5 text-sm">
                {lesson.quiz!.map((q, i) => (
                  <li key={i} className="break-inside-avoid">
                    <p className="font-medium">{q.prompt}</p>
                    <ul className="mt-1 space-y-0.5">{(q.options ?? []).map((o, j) => <li key={j}><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-muted text-xs">{String.fromCharCode(65 + j)}</span>{o.text}</li>)}</ul>
                    <div className="mt-1 flex items-end gap-2 text-xs text-muted"><span>{id ? 'Alasan' : 'Reason'}:</span><span className="h-6 flex-1 border-b border-dotted border-muted" /></div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mt-5 break-inside-avoid">
            <h2 className="font-semibold">{id ? 'Refleksi' : 'Reflection'}</h2>
            {REFLECTION_PROMPTS[locale].map((p) => (
              <div key={p} className="mt-2 text-sm"><p>{p}</p>{lines(2)}</div>
            ))}
          </section>

          <section className="mt-5 break-inside-avoid">
            <h2 className="font-semibold">{id ? 'Seberapa yakin kamu?' : 'How confident are you?'}</h2>
            <p className="mt-1 text-sm">{canDo(lesson.competency, track.level, locale) ?? (id ? 'Saya bisa mencapai tujuan sesi ini.' : 'I can reach this session’s goal.')} <span className="text-xs text-muted">({lesson.competency})</span></p>
            <p className="mt-2 text-sm">☐ {id ? 'Belum' : 'Not yet'}   ☐ {id ? 'Hampir' : 'Nearly'}   ☐ {id ? 'Sudah bisa' : 'I can'}   ☐ {id ? 'Bisa mengajari teman' : 'I could teach a friend'}</p>
          </section>
          <p className="mt-6 text-xs text-muted">{id ? 'Ingat: jangan menulis data pribadi (alamat, nomor HP, kata sandi) di lembar ini atau di layanan AI.' : 'Remember: never write personal data (address, phone number, passwords) on this sheet or in an AI service.'}</p>
        </article>
      </div>
    </Shell>
  )
}
