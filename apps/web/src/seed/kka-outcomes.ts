/**
 * DRAFT mapping of KKA (Koding dan Kecerdasan Artifisial) learning outcomes to the programme's can-do
 * statements. Written from our lesson list, NOT from a verified copy of the official Capaian Pembelajaran:
 * a KKA teacher must check every row (wording, phase, element and mapping) and mark it "checked" in the CMS.
 * Rows with no competencies are outcomes the programme does not teach (mainly coding), shown as gaps.
 */
import type { Payload } from 'payload'

type Row = { code: string; phase: 'D' | 'E' | 'F'; element: string; id: string; en: string; c: string[] }

const ROWS: Row[] = [
  // Fase D — SMP
  { code: 'D-LEKA-1', phase: 'D', element: 'leka', id: 'Peserta didik mengenali sistem kecerdasan artifisial dalam kehidupan sehari-hari dan membedakannya dari program biasa.', en: 'Students recognise AI systems in daily life and tell them apart from conventional programs.', c: ['DIS-1', 'DIS-2'] },
  { code: 'D-LEKA-2', phase: 'D', element: 'leka', id: 'Peserta didik menjelaskan secara sederhana bagaimana mesin belajar dari data dan mengapa AI dapat keliru.', en: 'Students explain simply how machines learn from data and why AI can be wrong.', c: ['UND-1', 'UND-2', 'DIS-3'] },
  { code: 'D-LEKA-3', phase: 'D', element: 'leka', id: 'Peserta didik menerapkan etika penggunaan AI: kejujuran akademik, keadilan, dan peran manusia dalam keputusan.', en: 'Students apply ethical AI use: academic honesty, fairness and the human role in decisions.', c: ['PRO-2', 'PRO-3', 'DIS-3'] },
  { code: 'D-LD-1', phase: 'D', element: 'ld', id: 'Peserta didik melindungi data pribadi dan jejak digitalnya saat menggunakan layanan AI.', en: 'Students protect their personal data and digital footprint when using AI services.', c: ['PRO-1'] },
  { code: 'D-LD-2', phase: 'D', element: 'ld', id: 'Peserta didik memeriksa kebenaran informasi dan mengenali konten buatan AI.', en: 'Students check information and recognise AI-generated content.', c: ['UND-3'] },
  { code: 'D-PPKA-1', phase: 'D', element: 'ppka', id: 'Peserta didik menggunakan AI generatif dengan perintah yang jelas untuk belajar dan berkarya secara bertanggung jawab.', en: 'Students use generative AI with clear prompts to learn and create responsibly.', c: ['CRE-1', 'CRE-2', 'CRE-3'] },
  { code: 'D-PPKA-2', phase: 'D', element: 'ppka', id: 'Peserta didik merancang gagasan sederhana pemanfaatan AI untuk masalah di sekitarnya.', en: 'Students design a simple idea for using AI on a problem around them.', c: ['THR-1', 'THR-2', 'THR-3'] },
  { code: 'D-BK-1', phase: 'D', element: 'bk', id: 'Peserta didik memecah masalah menjadi langkah-langkah dan mengenali pola (berpikir komputasional).', en: 'Students break problems into steps and recognise patterns (computational thinking).', c: ['UND-1'] },
  { code: 'D-AP-1', phase: 'D', element: 'ap', id: 'Peserta didik menyusun algoritma dan program sederhana.', en: 'Students write simple algorithms and programs.', c: [] },
  // Fase E — SMA/SMK kelas 10
  { code: 'E-LEKA-1', phase: 'E', element: 'leka', id: 'Peserta didik menjelaskan jenis-jenis sistem AI, cara kerjanya, dan batas kemampuannya.', en: 'Students explain types of AI systems, how they work and their limits.', c: ['DIS-1', 'DIS-3', 'UND-1'] },
  { code: 'E-LEKA-2', phase: 'E', element: 'leka', id: 'Peserta didik menganalisis bias dan dampak sosial AI dalam konteks Indonesia.', en: 'Students analyse bias and the social impact of AI in the Indonesian context.', c: ['PRO-2', 'UND-2', 'DIS-2'] },
  { code: 'E-LD-1', phase: 'E', element: 'ld', id: 'Peserta didik memverifikasi fakta, mendeteksi deepfake, dan melindungi data pribadi.', en: 'Students verify facts, detect deepfakes and protect personal data.', c: ['UND-3', 'PRO-1'] },
  { code: 'E-PPKA-1', phase: 'E', element: 'ppka', id: 'Peserta didik menggunakan teknik prompting lanjutan dan AI sebagai mitra belajar dan kerja dengan integritas.', en: 'Students use advanced prompting and AI as a learning and work partner, with integrity.', c: ['CRE-1', 'CRE-2', 'PRO-3'] },
  { code: 'E-AD-1', phase: 'E', element: 'ad', id: 'Peserta didik memahami peran data latih dan keseimbangan data terhadap hasil model.', en: 'Students understand how training data and its balance shape model results.', c: ['UND-1', 'UND-2'] },
  { code: 'E-AP-1', phase: 'E', element: 'ap', id: 'Peserta didik mengembangkan program dengan struktur data dan modularitas.', en: 'Students develop programs using data structures and modularity.', c: [] },
  // Fase F — SMA/SMK kelas 11–12
  { code: 'F-PPKA-1', phase: 'F', element: 'ppka', id: 'Peserta didik membangun prototipe solusi berbasis AI dan mengujinya.', en: 'Students build and test a prototype of an AI-based solution.', c: ['CRE-3', 'THR-3'] },
  { code: 'F-PPKA-2', phase: 'F', element: 'ppka', id: 'Peserta didik mengevaluasi solusi AI dan membagi peran manusia–AI di dunia kerja.', en: 'Students evaluate AI solutions and divide roles between people and AI at work.', c: ['THR-1', 'THR-2'] },
  { code: 'F-LEKA-1', phase: 'F', element: 'leka', id: 'Peserta didik menerapkan etika profesional dan kebijakan penggunaan AI di tempat kerja.', en: 'Students apply professional ethics and workplace AI policies.', c: ['PRO-3', 'PRO-1'] },
  { code: 'F-AP-1', phase: 'F', element: 'ap', id: 'Peserta didik mengembangkan aplikasi dengan memanfaatkan pustaka atau layanan AI.', en: 'Students develop applications using AI libraries or services.', c: [] },
]

/** Creates missing rows only: a row a teacher has already edited or checked is never overwritten. */
export async function seedKkaOutcomes(payload: Payload) {
  let created = 0
  for (const r of ROWS) {
    const exists = await payload.count({ collection: 'kka-outcomes', overrideAccess: true, where: { code: { equals: r.code } } })
    if (exists.totalDocs) continue
    const doc = await payload.create({ collection: 'kka-outcomes', overrideAccess: true, locale: 'id', data: { code: r.code, phase: r.phase, element: r.element as never, description: r.id, competencies: r.c as never, status: 'draft' } })
    await payload.update({ collection: 'kka-outcomes', id: doc.id, overrideAccess: true, locale: 'en', data: { description: r.en } })
    created++
  }
  return { created, total: ROWS.length }
}
