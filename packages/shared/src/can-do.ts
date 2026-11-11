import type { Competency } from './curriculum'

type L = { id: string; en: string }

/**
 * The 15 can-do statements of the framework ("AI Literacy Framework & Track Outlines"), per level.
 * Each completes the sentence "Saya bisa… / I can…".
 */
export const CAN_DO: Record<Competency, { smp: L; sma: L }> = {
  'DIS-1': {
    smp: { id: 'membedakan program biasa dan sistem AI dengan contoh sehari-hari', en: 'tell apart a normal program and an AI system, with everyday examples' },
    sma: { id: 'menjelaskan apa yang membuat sebuah sistem disebut “AI” dan mengelompokkan alat yang saya pakai menurut fungsinya', en: 'explain what makes a system “AI” and classify tools I use by what they do' },
  },
  'DIS-2': {
    smp: { id: 'menemukan AI di aplikasi yang saya pakai (rekomendasi, filter, peta, chatbot)', en: 'find AI in apps I use (recommendations, filters, maps, chatbots)' },
    sma: { id: 'menjelaskan bagaimana AI membentuk apa yang saya lihat di internet dan siapa yang diuntungkan', en: 'describe how AI shapes what I see online and who benefits from it' },
  },
  'DIS-3': {
    smp: { id: 'menyebutkan hal yang tidak dapat dilakukan AI dengan baik, seperti peduli, menimbang, dan mengetahui keadaan terkini', en: 'name things AI cannot do well, such as care, judgment and knowing the present' },
    sma: { id: 'menjelaskan batas kemampuan AI saat ini dan kapan manusia harus memutuskan', en: 'explain the limits of current AI and when a human must decide' },
  },
  'UND-1': {
    smp: { id: 'menjelaskan bahwa AI belajar pola dari banyak contoh (data)', en: 'explain that AI learns patterns from many examples (data)' },
    sma: { id: 'menjelaskan pelatihan, model, dan prediksi dengan bahasa sederhana beserta contohnya', en: 'explain training, models and prediction in plain words, with a worked example' },
  },
  'UND-2': {
    smp: { id: 'menunjukkan bagaimana data yang kurang atau berat sebelah membuat AI tidak adil atau keliru', en: 'show how missing or one-sided data makes AI unfair or wrong' },
    sma: { id: 'menelusuri kesalahan AI sampai ke data, rancangan, atau cara pakainya, lalu mengusulkan perbaikan', en: 'trace an AI error back to its data, design or use, and suggest a fix' },
  },
  'UND-3': {
    smp: { id: 'mengenali jawaban AI yang dikarang dan memeriksanya dengan sumber tepercaya', en: 'spot an AI answer that is made up, and check it against a trusted source' },
    sma: { id: 'menilai keandalan hasil AI dengan sumber, bukti, dan pemeriksaan silang, serta mengenali deepfake', en: 'judge an AI output’s reliability using sources, evidence and cross-checks; spot deepfakes' },
  },
  'CRE-1': {
    smp: { id: 'menulis perintah (prompt) yang jelas dengan tujuan, konteks, dan format', en: 'write a clear prompt with a goal, context and format' },
    sma: { id: 'merancang perintah dengan peran, batasan, dan contoh, lalu memperbaikinya bertahap', en: 'design prompts with roles, constraints and examples, and improve them step by step' },
  },
  'CRE-2': {
    smp: { id: 'memakai AI untuk lebih memahami pelajaran, bukan untuk menyalin jawaban', en: 'use AI to understand a lesson better, not to copy answers' },
    sma: { id: 'memakai AI sebagai mitra belajar dan bekerja sambil menunjukkan penalaran saya sendiri', en: 'use AI as a study and work partner while keeping my own reasoning visible' },
  },
  'CRE-3': {
    smp: { id: 'membuat karya kecil dengan bantuan AI dan menyebutkan bagian mana yang karya saya', en: 'make a small piece of work with AI help and say which parts are mine' },
    sma: { id: 'membuat produk (teks, gambar, aplikasi, kampanye) dengan AI dan mendokumentasikan prosesnya', en: 'build a product (text, image, app, campaign) with AI and document my process' },
  },
  'PRO-1': {
    smp: { id: 'menjaga data pribadi agar tidak masuk ke layanan AI (Perisai Keamanan saya)', en: 'keep personal data out of AI tools (my Safety Shield)' },
    sma: { id: 'mengelola data dan jejak digital saya, termasuk apa yang disimpan layanan AI', en: 'manage my data and digital footprint, including what AI services keep' },
  },
  'PRO-2': {
    smp: { id: 'mengenali ketika AI memperlakukan orang secara tidak adil', en: 'recognise when AI treats people unfairly' },
    sma: { id: 'menganalisis bias dan dampaknya pada kelompok di Indonesia, serta mengusulkan pengaman', en: 'analyse bias and its effects on groups in Indonesia, and propose safeguards' },
  },
  'PRO-3': {
    smp: { id: 'mengikuti aturan sekolah tentang AI dan menyebutkan saat saya memakai AI', en: 'follow school rules on AI use and cite when I used AI' },
    sma: { id: 'menerapkan aturan integritas akademik dan dunia kerja, serta mengungkapkan pemakaian AI dengan benar', en: 'apply academic and workplace integrity rules, and disclose AI use properly' },
  },
  'THR-1': {
    smp: { id: 'menjelaskan apa yang lebih baik dilakukan manusia daripada AI dan bagaimana kita dapat bekerja sama', en: 'explain what humans do better than AI and how we can work together' },
    sma: { id: 'memutuskan bagian tugas yang diberikan kepada AI dan bagian yang tetap dikerjakan manusia', en: 'decide which parts of a task to give to AI and which to keep human' },
  },
  'THR-2': {
    smp: { id: 'menjelaskan bagaimana AI membantu menyelesaikan masalah di Indonesia (kesehatan, pertanian, bencana)', en: 'describe how AI helps solve problems in Indonesia (health, farming, disasters)' },
    sma: { id: 'menilai manfaat, risiko, dan pihak yang terdampak oleh sebuah solusi AI', en: 'evaluate an AI solution’s benefits, risks and who it affects' },
  },
  'THR-3': {
    smp: { id: 'merancang gagasan sederhana AI untuk kebaikan di sekolah atau lingkungan saya', en: 'plan a simple AI-for-good idea for my school or community' },
    sma: { id: 'menyelesaikan proyek untuk masalah nyata di sekitar saya dengan AI dan menyajikannya', en: 'deliver a project for a real local problem with AI, and present it' },
  },
}

/** "I can …" sentence for a competency at a track level ('smp' or 'sma_smk'). */
export function canDo(c: string, level: string, locale: 'id' | 'en'): string | null {
  const entry = CAN_DO[c as Competency]
  if (!entry) return null
  const s = (level === 'smp' ? entry.smp : entry.sma)[locale]
  return `${locale === 'id' ? 'Saya bisa' : 'I can'} ${s}.`
}
