/**
 * School report (spec I3): results by grade, class and big idea, plus coverage of KKA learning outcomes.
 * Everything here is aggregated; no individual student appears in the report.
 */
import type { Payload } from 'payload'
import { BIG_IDEAS, bigIdeaOf, SCORE_DOMAINS, type BigIdea, type Competency } from '@ailit/shared'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null)

const ROMAN: Record<string, number> = { VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }
/** Grade from the class field, or from names like "8B", "Kelas 9A", "XI IPA 2". */
export function gradeOf(c: { grade?: number | string | null; name: string }): number | null {
  if (c.grade) return Number(c.grade)
  const name = c.name.toUpperCase().replace(/^KELAS\s*/, '')
  const roman = name.match(/^(XII|XI|X|IX|VIII|VII)\b/)
  if (roman) return ROMAN[roman[1]!] ?? null
  const num = name.match(/^(1[0-2]|[7-9])(?!\d)/)
  return num ? Number(num[1]) : null
}

/** The KKA phase a grade belongs to. */
export function phaseOf(grade: number | null, level: string | null): 'D' | 'E' | 'F' | null {
  if (grade && grade >= 7 && grade <= 9) return 'D'
  if (grade === 10) return 'E'
  if (grade && grade >= 11) return 'F'
  if (level === 'smp') return 'D'
  return level === 'sma_smk' ? 'E' : null
}

export interface GroupStats {
  key: string
  label: string
  students: number
  active30: number
  completion: number // average % of the track's lessons completed
  byBigIdea: Record<BigIdea, number>
  aiSessions: number
  projectsGraded: number
  projectAvg: number | null // average % of rubric points
  tested: number
  bandAvg: number | null
  domains: Record<string, number | null>
}

export interface KkaRow {
  code: string
  phase: string
  element: string
  description: string
  competencies: string[]
  status: string
  lessons: number
  students: number // students in classes of this phase
  reached: number // % of them who completed at least one mapped lesson
}

export async function schoolReport(payload: Payload, schoolId: number, locale: 'id' | 'en', now = new Date()) {
  const classes = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 500, sort: 'name', where: { school: { equals: schoolId } } })).docs
  const tracks = (await payload.find({ collection: 'tracks', overrideAccess: true, depth: 0, limit: 50 })).docs
  const trackLevel = new Map(tracks.map((t) => [t.id, t.level as string]))
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, pagination: false, limit: 0 })).docs
  const unitInfo = new Map(units.map((u) => [u.id, { track: idOf(u.track), bigIdea: u.bigIdea as BigIdea }]))
  const lessons = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { _status: { equals: 'published' } } })).docs.map((l) => {
    const u = unitInfo.get(idOf(l.unit)!)
    return { id: l.id, track: u?.track ?? null, bigIdea: (u?.bigIdea ?? bigIdeaOf(l.competency as Competency)) as BigIdea, competencies: [l.competency, ...((l.alsoCovers as string[] | null) ?? [])] as string[] }
  })
  const lessonsByTrack = new Map<number, typeof lessons>()
  for (const l of lessons) if (l.track) lessonsByTrack.set(l.track, [...(lessonsByTrack.get(l.track) ?? []), l])

  const studentIds = [...new Set(classes.flatMap((c) => (c.students ?? []).map(idOf)).filter((x): x is number => Boolean(x)))]
  const none = { docs: [] as never[] }
  const [progress, convos, subs, attempts] = studentIds.length
    ? await Promise.all([
        payload.find({ collection: 'lesson-progress', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ user: { in: studentIds } }, { status: { equals: 'completed' } }] } }),
        payload.find({ collection: 'ai-conversations', overrideAccess: true, depth: 0, pagination: false, limit: 0, select: { user: true, updatedAt: true } as never, where: { user: { in: studentIds } } }),
        payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { class: { in: classes.map((c) => c.id) } } }),
        payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ candidate: { in: studentIds } }, { status: { equals: 'scored' } }] } }),
      ])
    : [none, none, none, none]

  const done = new Map<number, Set<number>>()
  const lastSeen = new Map<number, number>()
  const seen = (u: number, at: string | null | undefined) => at && lastSeen.set(u, Math.max(lastSeen.get(u) ?? 0, new Date(at).getTime()))
  for (const p of progress.docs) {
    const u = idOf(p.user)!
    done.set(u, (done.get(u) ?? new Set()).add(idOf(p.lesson)!))
    seen(u, p.completedAt ?? p.updatedAt)
  }
  const aiByUser = new Map<number, number>()
  for (const c of convos.docs) {
    const u = idOf((c as { user: unknown }).user)!
    aiByUser.set(u, (aiByUser.get(u) ?? 0) + 1)
    seen(u, (c as { updatedAt: string }).updatedAt)
  }
  // Latest scored attempt per student.
  const latest = new Map<number, { band: number; subScores: Record<string, number> }>()
  for (const a of [...attempts.docs].sort((x, y) => x.updatedAt.localeCompare(y.updatedAt))) {
    const r = a.report as { band: number; subScores: Record<string, number> } | null
    if (r) latest.set(idOf(a.candidate)!, r)
  }
  const cutoff = now.getTime() - 30 * 86_400_000

  type ClassRow = { id: number; name: string; grade: number | null; phase: 'D' | 'E' | 'F' | null; students: number[]; trackLessons: typeof lessons }
  const classRows: ClassRow[] = classes.map((c) => {
    const grade = gradeOf(c as { grade?: number | null; name: string })
    const track = idOf(c.track)
    return { id: c.id, name: c.name, grade, phase: phaseOf(grade, track ? (trackLevel.get(track) ?? null) : null), students: (c.students ?? []).map(idOf).filter((x): x is number => Boolean(x)), trackLessons: track ? (lessonsByTrack.get(track) ?? []) : [] }
  })

  function stats(key: string, label: string, rows: ClassRow[]): GroupStats {
    const members = new Map<number, (typeof lessons)>() // student → lessons of their class track
    for (const r of rows) for (const s of r.students) members.set(s, [...(members.get(s) ?? []), ...r.trackLessons])
    const ids = [...members.keys()]
    const completion = avg(ids.map((s) => { const ls = members.get(s)!; return pct(ls.filter((l) => done.get(s)?.has(l.id)).length, ls.length) })) ?? 0
    const byBigIdea = Object.fromEntries(
      BIG_IDEAS.map((b) => [b, avg(ids.map((s) => { const ls = members.get(s)!.filter((l) => l.bigIdea === b); return ls.length ? pct(ls.filter((l) => done.get(s)?.has(l.id)).length, ls.length) : null }).filter((x): x is number => x !== null)) ?? 0]),
    ) as Record<BigIdea, number>
    const classIds = new Set(rows.map((r) => r.id))
    const graded = subs.docs.filter((x) => classIds.has(idOf(x.class)!) && x.status === 'graded')
    const tested = ids.filter((s) => latest.has(s))
    return {
      key,
      label,
      students: ids.length,
      active30: ids.filter((s) => (lastSeen.get(s) ?? 0) > cutoff).length,
      completion,
      byBigIdea,
      aiSessions: ids.reduce((a, s) => a + (aiByUser.get(s) ?? 0), 0),
      projectsGraded: graded.length,
      projectAvg: avg(graded.map((x) => { const sc = (x.scores ?? []) as number[]; return pct(sc.reduce((a, c) => a + c, 0), sc.length * 4) })),
      tested: tested.length,
      bandAvg: tested.length ? Math.round((tested.reduce((a, s) => a + latest.get(s)!.band, 0) / tested.length) * 10) / 10 : null,
      domains: Object.fromEntries(SCORE_DOMAINS.map((d) => [d, avg(tested.map((s) => latest.get(s)!.subScores[d] ?? 0))])),
    }
  }

  const id = locale === 'id'
  const school = stats('all', id ? 'Seluruh sekolah' : 'Whole school', classRows)
  const grades = [...new Set(classRows.map((r) => r.grade))].sort((a, b) => (a ?? 99) - (b ?? 99))
  const byGrade = grades.map((g) => stats(`g${g ?? 'x'}`, g ? `${id ? 'Kelas' : 'Grade'} ${g}` : id ? 'Kelas belum diatur' : 'Grade not set', classRows.filter((r) => r.grade === g)))
  const byClass = classRows.map((r) => stats(`c${r.id}`, r.name, [r]))

  // KKA coverage for the phases this school's classes are in.
  const phases = new Set(classRows.map((r) => r.phase).filter(Boolean) as string[])
  const outcomes = (await payload.find({ collection: 'kka-outcomes', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', pagination: false, limit: 0, sort: 'code' })).docs
  const kka: KkaRow[] = outcomes
    .filter((o) => phases.has(o.phase))
    .map((o) => {
      const comps = (o.competencies as string[] | null) ?? []
      const phaseRows = classRows.filter((r) => r.phase === o.phase)
      const mapped = new Set(phaseRows.flatMap((r) => r.trackLessons).filter((l) => l.competencies.some((c) => comps.includes(c))).map((l) => l.id))
      const students = [...new Set(phaseRows.flatMap((r) => r.students))]
      const reached = students.filter((s) => [...(done.get(s) ?? [])].some((l) => mapped.has(l))).length
      return { code: o.code, phase: o.phase, element: o.element, description: o.description, competencies: comps, status: o.status, lessons: mapped.size, students: students.length, reached: pct(reached, students.length) }
    })

  return { school, byGrade, byClass, kka, kkaDraft: kka.some((k) => k.status !== 'checked'), generatedAt: now.toISOString() }
}

/** CSV of the class table (Excel-friendly: BOM, semicolons are avoided by quoting). */
export function reportCsv(rows: GroupStats[], locale: 'id' | 'en'): string {
  const id = locale === 'id'
  const head = [id ? 'Kelompok' : 'Group', id ? 'Siswa' : 'Students', id ? 'Aktif 30 hari' : 'Active 30 days', id ? 'Penyelesaian %' : 'Completion %', ...BIG_IDEAS.map((b) => `${b} %`), id ? 'Sesi AI Lab' : 'AI Lab sessions', id ? 'Proyek dinilai' : 'Projects marked', id ? 'Rata-rata proyek %' : 'Project average %', id ? 'Ikut tes AILIS' : 'AILIS tested', id ? 'Rata-rata band' : 'Average band', ...SCORE_DOMAINS.map((d) => `AILIS ${d} %`)]
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((r) => [r.label, r.students, r.active30, r.completion, ...BIG_IDEAS.map((b) => r.byBigIdea[b]), r.aiSessions, r.projectsGraded, r.projectAvg ?? '', r.tested, r.bandAvg ?? '', ...SCORE_DOMAINS.map((d) => r.domains[d] ?? '')].map(q).join(','))
  return '﻿' + [head.map(q).join(','), ...lines].join('\n')
}
