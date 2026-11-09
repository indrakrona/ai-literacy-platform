import type { Payload } from 'payload'

/** AI Lab activities for the ai_lab lessons, linked by track slug and session number. */
const ACTIVITIES = [
  {
    slug: 'smp-berburu-informasi-keliru', link: 'smp-ai-untuk-belajar-dan-integritas:8', competency: 'UND-3', tier: 'standard' as const,
    title: 'Berburu Informasi Keliru', goal: 'Ajukan tiga pertanyaan tentang fakta di daerahmu, tandai bagian yang perlu diperiksa, lalu cocokkan dengan sumber tepercaya.',
    instructions: 'Answer factual questions about Indonesia briefly. At the end of each answer, add one line suggesting which part the student should verify and with what kind of trusted source (e.g. BPS, official ministry or regional government sites, textbooks). Do not claim certainty you do not have.',
    starters: ['Kapan kota saya didirikan?', 'Berapa jumlah penduduk provinsi saya?', 'Apa makanan khas daerah saya dan asal-usulnya?'],
    reflection: ['Bagian mana dari jawaban AI yang ternyata keliru atau tidak dapat dipastikan?', 'Sumber apa yang paling membantu untuk memeriksa?'],
  },
  {
    slug: 'smp-teman-belajar', link: 'smp-ai-untuk-belajar-dan-integritas:11', competency: 'CRE-2', tier: 'standard' as const,
    title: 'Teman Belajar, Bukan Contekan', goal: 'Minta AI menjelaskan satu topik yang sulit dari pelajaran lain dengan contoh, lalu jelaskan kembali dengan kata-katamu sendiri.',
    instructions: 'Act as a patient tutor. Explain the topic the student names in simple steps with one everyday Indonesian example, then ask the student one short question to check understanding. Never write graded work (essays, homework answers) for the student; offer to explain the method instead.',
    starters: ['Jelaskan pecahan senilai dengan contoh sehari-hari', 'Mengapa terjadi siang dan malam?', 'Apa bedanya kata baku dan tidak baku?'],
    reflection: ['Apa yang sekarang kamu pahami dan sebelumnya belum?', 'Bagaimana kamu memastikan tidak sekadar menyalin?'],
  },
  {
    slug: 'sma-melacak-kesalahan-ai', link: 'sma-smk-membangun-dengan-ai:7', competency: 'UND-2', tier: 'standard' as const,
    title: 'Melacak Sumber Kesalahan AI', goal: 'Coba memunculkan kesalahan AI pada terjemahan istilah daerah, fakta terbaru, atau saran di luar kemampuannya, lalu tentukan sumber kesalahannya.',
    instructions: 'Answer normally. When a student asks you to reflect on a possible error in your previous answer, explain honestly whether it is likely caused by limited training data, the system design, or the way the question was asked, and suggest a fix.',
    starters: ['Terjemahkan "nggih" dan "monggo" ke bahasa Inggris', 'Siapa juara turnamen kemarin?', 'Berapa dosis obat flu untuk anak?'],
    reflection: ['Kesalahan mana yang berasal dari data, rancangan, atau penggunaan?', 'Apa usulan perbaikanmu untuk pengembang dan pengguna?'],
  },
  {
    slug: 'sma-verifikasi-fakta', link: 'sma-smk-membangun-dengan-ai:8', competency: 'UND-3', tier: 'standard' as const,
    title: 'Verifikasi Fakta', goal: 'Minta AI menjawab klaim yang beredar, lalu verifikasi dengan sumber resmi dan nilai: benar, keliru, atau belum dapat dipastikan.',
    instructions: 'When asked about a claim, give a short answer, state your confidence, and list which official or reputable sources a student could use to verify it. Never invent sources, titles or URLs; if unsure, say you are unsure.',
    starters: ['Benarkah minum air es menyebabkan flu?', 'Benarkah ada libur nasional baru tahun ini?', 'Apakah foto banjir yang viral ini asli?'],
    reflection: ['Klaim mana yang paling sulit diverifikasi, dan mengapa?', 'Apa langkah verifikasi yang akan kamu gunakan lagi?'],
  },
  {
    slug: 'sma-prompt-lanjutan', link: 'sma-smk-membangun-dengan-ai:9', competency: 'CRE-1', tier: 'standard' as const,
    title: 'Tantangan Prompt Lanjutan', goal: 'Susun pengumuman acara sekolah untuk tiga sasaran berbeda. Perbaiki instruksimu paling banyak tiga kali dan catat alasan setiap perubahan.',
    instructions: 'Follow the student\'s instructions exactly as written, including role, audience, length and tone constraints. Do not add constraints they did not give. Keep outputs short so the effect of each prompt change is easy to see.',
    starters: ['Tulis pengumuman lomba kebersihan', 'Sebagai pengurus OSIS, tulis pengumuman lomba kebersihan untuk orang tua dalam 60 kata, bahasa formal'],
    reflection: ['Perubahan instruksi mana yang paling memperbaiki hasil?', 'Bagian mana yang tetap kamu putuskan sendiri?'],
  },
  {
    slug: 'sma-mitra-riset', link: 'sma-smk-membangun-dengan-ai:10', competency: 'CRE-2', tier: 'standard' as const,
    title: 'Mitra Riset', goal: 'Teliti satu topik dari mata pelajaran lain bersama AI. Catat pertanyaanmu, bagian jawaban yang kamu ragukan, sumber yang kamu pakai untuk memeriksa, dan kesimpulanmu sendiri.',
    instructions: 'Act as a research partner, not an answer machine. Give short explanations, then ask the student one question back that makes them reason (e.g. "Why do you think that?", "What source could confirm this?"). Never invent sources, titles, authors or URLs; if asked for sources, describe the kind of trusted source to look for instead. Do not write finished assignments; help the student plan and check their own.',
    starters: ['Saya ingin memahami penyebab inflasi', 'Bantu saya merencanakan riset tentang sampah plastik di sungai', 'Apa bedanya cuaca dan iklim?'],
    reflection: ['Kapan kamu tidak setuju dengan AI atau menemukan kesalahannya?', 'Kesimpulan apa yang kamu tulis dengan kata-katamu sendiri?'],
  },
]

export async function seedAiActivities(payload: Payload) {
  let linked = 0
  for (const a of ACTIVITIES) {
    const existing = await payload.find({ collection: 'ai-activities', where: { slug: { equals: a.slug } }, limit: 1, depth: 0 })
    const data = {
      title: a.title, slug: a.slug, competency: a.competency as never, goal: a.goal, instructions: a.instructions,
      tier: a.tier, messageLimit: 12, starterPrompts: a.starters.map((text) => ({ text })), reflection: a.reflection.map((text) => ({ text })),
    }
    const act = existing.docs[0]
      ? await payload.update({ collection: 'ai-activities', id: existing.docs[0].id, locale: 'id', data })
      : await payload.create({ collection: 'ai-activities', locale: 'id', data })
    const [slug, order] = a.link.split(':')
    const track = (await payload.find({ collection: 'tracks', where: { slug: { equals: slug } }, limit: 1 })).docs[0]
    if (!track) continue
    const units = await payload.find({ collection: 'units', where: { track: { equals: track.id } }, limit: 10, depth: 0 })
    const lesson = (await payload.find({ collection: 'lessons', draft: true, where: { and: [{ unit: { in: units.docs.map((u) => u.id) } }, { order: { equals: Number(order) } }] }, limit: 1 })).docs[0]
    if (lesson) {
      await payload.update({ collection: 'lessons', id: lesson.id, data: { aiActivity: act.id } })
      linked++
    }
  }
  return { activities: ACTIVITIES.length, linked }
}
