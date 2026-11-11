import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { PrintButton } from '../../../../components/forms/DataRightsForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser } from '../../../../lib/session'
import { APPLIED_RUBRIC_LEVELS, BRIEF_TEMPLATE_FIELDS } from '../../../../lib/brief-template'

/** Printable project brief template for a teacher to fill in with a partner (spec F1). */
export default async function BriefTemplatePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'content_editor', 'content_reviewer', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/proyek" className="text-sm underline">{id ? 'Lihat contoh brief proyek' : 'See example project briefs'}</Link>
          <PrintButton label={id ? 'Cetak / simpan PDF' : 'Print / save as PDF'} />
        </div>
        <article className="rounded-2xl border border-line bg-white p-6 print:rounded-none print:border-0 print:p-0">
          <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">Impact Thinklab · AI Literacy</p>
          <h1 className="mt-1 text-2xl font-bold">{id ? 'Templat brief proyek nyata' : 'Real-world project brief template'}</h1>
          <p className="mt-2 text-sm text-muted">
            {id
              ? 'Isi bersama mitra (unit sekolah, komunitas, atau UMKM) sebelum proyek dimulai. Mitra tidak perlu memahami AI; cukup ceritakan masalahnya. Setelah diisi, guru atau editor dapat memasukkannya ke platform sebagai brief baru.'
              : 'Fill this in with the partner (a school unit, community group or small business) before the project starts. The partner does not need to understand AI; they only need to describe the problem. Once complete, a teacher or editor can enter it on the platform as a new brief.'}
          </p>
          <table className="mt-4 w-full text-sm">
            <tbody>
              <tr className="border-b border-line"><th className="w-48 py-2 pr-3 text-left font-medium">{id ? 'Sekolah / kelas' : 'School / class'}</th><td className="py-2" /></tr>
              <tr className="border-b border-line"><th className="py-2 pr-3 text-left font-medium">{id ? 'Jenjang dan jurusan' : 'Level and major'}</th><td className="py-2">{id ? '☐ SMP   ☐ SMA   ☐ SMK, jurusan: ' : '☐ SMP   ☐ SMA   ☐ SMK, major: '}</td></tr>
              <tr className="border-b border-line"><th className="py-2 pr-3 text-left font-medium">{id ? 'Guru pendamping' : 'Supervising teacher'}</th><td className="py-2" /></tr>
              <tr className="border-b border-line"><th className="py-2 pr-3 text-left font-medium">{id ? 'Kerja tim' : 'Teamwork'}</th><td className="py-2">{id ? '☐ Boleh berkelompok (2–4 siswa)   ☐ Individu' : '☐ Teams allowed (2–4 students)   ☐ Individual'}</td></tr>
            </tbody>
          </table>
          {BRIEF_TEMPLATE_FIELDS.map((f) => (
            <section key={f.key} className="mt-4 break-inside-avoid">
              <h2 className="font-semibold">{f.label[locale]}</h2>
              <p className="text-xs text-muted">{f.hint[locale]}</p>
              <div className="mt-1" aria-hidden>
                {Array.from({ length: f.lines }).map((_, i) => <div key={i} className="h-7 border-b border-dotted border-muted" />)}
              </div>
            </section>
          ))}
          <section className="mt-6 break-inside-avoid">
            <h2 className="font-semibold">{id ? 'Rubrik penilaian (skor 1–4 per kriteria)' : 'Scoring rubric (1–4 per criterion)'}</h2>
            <p className="text-xs text-muted">{id ? 'Rubrik bersama untuk proyek terapan, agar nilai sebanding antarsekolah dan antarjurusan. Kriteria khusus mitra boleh ditambahkan di baris kosong.' : 'The shared rubric for applied projects, so marks are comparable across schools and majors. Partner-specific criteria can be added in the blank row.'}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr className="bg-paper">
                    <th className="border border-line p-2 text-left">{id ? 'Kriteria' : 'Criterion'}</th>
                    {[1, 2, 3, 4].map((n) => <th key={n} className="border border-line p-2 text-left">{n}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {APPLIED_RUBRIC_LEVELS.map((r) => (
                    <tr key={r.criterion.en} className="align-top">
                      <th className="border border-line p-2 text-left font-medium">{r.criterion[locale]}</th>
                      {r.levels.map((l, i) => <td key={i} className="border border-line p-2">{l[locale]}</td>)}
                    </tr>
                  ))}
                  <tr><td className="h-12 border border-line p-2" /><td className="border border-line" /><td className="border border-line" /><td className="border border-line" /><td className="border border-line" /></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section className="mt-6 break-inside-avoid text-sm">
            <h2 className="font-semibold">{id ? 'Persetujuan mitra' : 'Partner agreement'}</h2>
            <ul className="mt-1 list-disc pl-5">
              <li>{id ? 'Mitra tidak membagikan data pribadi pelanggan, warga, atau karyawan kepada siswa tanpa disamarkan.' : 'The partner does not share personal data of customers, residents or staff with students unless anonymised.'}</li>
              <li>{id ? 'Siswa tidak dibayar dan tidak menanggung kewajiban hasil; mitra memakai hasil proyek atas pertimbangannya sendiri.' : 'Students are not paid and carry no liability for the result; the partner uses the project outcome at their own discretion.'}</li>
              <li>{id ? 'Nama mitra boleh/tidak boleh (coret salah satu) ditampilkan di galeri proyek sekolah.' : 'The partner’s name may / may not (cross one out) be shown in the school project gallery.'}</li>
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-8">
              <div><div className="h-12 border-b border-muted" /><p className="mt-1 text-xs">{id ? 'Mitra (nama dan tanda tangan)' : 'Partner (name and signature)'}</p></div>
              <div><div className="h-12 border-b border-muted" /><p className="mt-1 text-xs">{id ? 'Guru pendamping' : 'Supervising teacher'}</p></div>
            </div>
          </section>
        </article>
      </div>
    </Shell>
  )
}
