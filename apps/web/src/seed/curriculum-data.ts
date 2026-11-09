import type { BigIdea, Competency, LessonType, TrackLevel } from '@ailit/shared'

/**
 * Phase 1 track outlines (source: "AI Literacy Framework & Track Outlines" doc, decisions of 9 Nov 2026).
 * Titles are formal Bahasa Indonesia; English is the second locale.
 */
export interface LessonSeed {
  n: number
  id: string
  en: string
  type: LessonType
  c: Competency
  also?: Competency[]
  core: boolean
  activity: string
}

export interface TrackSeed {
  slug: string
  level: TrackLevel
  title: { id: string; en: string }
  summary: { id: string; en: string }
  lessons: LessonSeed[]
}

export const UNIT_TITLES: Record<BigIdea, { id: string; en: string }> = {
  discover: { id: 'Mengenal AI', en: 'Discover AI' },
  understand: { id: 'Memahami Cara Kerja AI', en: 'Understand how AI works' },
  create: { id: 'Berkarya dengan AI', en: 'Create with AI' },
  protect: { id: 'Melindungi Diri dan Sesama', en: 'Protect yourself and others' },
  thrive: { id: 'Berkembang bersama AI', en: 'Thrive with AI' },
}

export const TRACKS: TrackSeed[] = [
  {
    slug: 'smp-ai-untuk-belajar-dan-integritas',
    level: 'smp',
    title: { id: 'AI untuk Belajar dan Integritas', en: 'AI for Learning & Integrity' },
    summary: {
      id: 'Jalur untuk siswa SMP kelas 7–9: memahami AI, menggunakannya untuk belajar secara jujur, dan tetap aman.',
      en: 'Track for SMP grades 7–9: understand AI, use it to learn honestly, and stay safe.',
    },
    lessons: [
      { n: 1, id: 'Pengenalan Kecerdasan Artifisial dan Tes Awal', en: 'Introduction to AI and starting check', type: 'quiz', c: 'DIS-1', core: true, activity: 'Diagnostic quiz; class poll on where students already use AI' },
      { n: 2, id: 'Perlindungan Data Pribadi', en: 'Protecting personal data', type: 'interactive', c: 'PRO-1', core: true, activity: 'Sorting simulator: what is safe to share with AI; personal data pledge' },
      { n: 3, id: 'Membedakan Program Biasa dan Sistem AI', en: 'Conventional programs vs AI systems', type: 'interactive', c: 'DIS-1', core: true, activity: 'Sort everyday tools into conventional programs and AI systems' },
      { n: 4, id: 'AI dalam Kehidupan Sehari-hari', en: 'AI in everyday life', type: 'reading', c: 'DIS-2', also: ['DIS-3'], core: true, activity: 'Identify AI in common apps: recommendations, filters, maps' },
      { n: 5, id: 'Keterbatasan AI dan Peran Manusia', en: 'The limits of AI and the role of humans', type: 'discussion', c: 'DIS-3', core: false, activity: 'Compare tasks that need human care, judgment and current knowledge' },
      { n: 6, id: 'Cara Mesin Belajar dari Data', en: 'How machines learn from data', type: 'interactive', c: 'UND-1', core: true, activity: 'Data trainer simulator: add examples, observe confidence change' },
      { n: 7, id: 'Data yang Tidak Seimbang dan Keadilan', en: 'Unbalanced data and fairness', type: 'interactive', c: 'UND-2', also: ['PRO-2'], core: true, activity: 'One-sided training data produces unfair results; correct the data' },
      { n: 8, id: 'Mengenali dan Memeriksa Informasi Keliru dari AI', en: 'Spotting and checking false AI information', type: 'ai_lab', c: 'UND-3', core: true, activity: 'Ask AI about local facts, find inaccurate answers, verify with sources' },
      { n: 9, id: 'Mengenali Konten Buatan AI', en: 'Recognising AI-generated content', type: 'interactive', c: 'UND-3', core: false, activity: 'Signs of AI-generated images and audio; verification checklist' },
      { n: 10, id: 'Menulis Instruksi (Prompt) yang Jelas', en: 'Writing clear prompts', type: 'interactive', c: 'CRE-1', core: true, activity: 'Prompt precision exercise; goal, context and format' },
      { n: 11, id: 'Menggunakan AI untuk Belajar secara Jujur', en: 'Using AI to learn honestly', type: 'ai_lab', c: 'CRE-2', also: ['CRE-3'], core: true, activity: 'Use AI to explain a difficult topic, then explain it back in own words' },
      { n: 12, id: 'Berkarya dengan Bantuan AI', en: 'Creating with AI assistance', type: 'project', c: 'CRE-3', core: false, activity: 'Produce a short text or poster with AI; mark own contribution' },
      { n: 13, id: 'Bias dan Keadilan dalam Keputusan AI', en: 'Bias and fairness in AI decisions', type: 'discussion', c: 'PRO-2', core: false, activity: 'Case studies of biased AI decisions; who is affected and what to change' },
      { n: 14, id: 'Integritas Akademik dan Penggunaan AI', en: 'Academic integrity and AI use', type: 'discussion', c: 'PRO-3', core: true, activity: 'Draft the class agreement on AI use; practise citing AI assistance' },
      { n: 15, id: 'Kolaborasi Manusia dan AI', en: 'Human–AI collaboration', type: 'discussion', c: 'THR-1', core: false, activity: 'Divide a school task between human and AI, with reasons' },
      { n: 16, id: 'Pemanfaatan AI untuk Indonesia', en: 'AI for Indonesia', type: 'reading', c: 'THR-2', core: false, activity: 'Case studies: flood early warning, crop disease detection, health screening' },
      { n: 17, id: 'Merancang Gagasan AI untuk Kebaikan', en: 'Designing an AI-for-good idea', type: 'project', c: 'THR-3', also: ['THR-1', 'THR-2'], core: true, activity: 'Team design: problem, data needed, safety rule' },
      { n: 18, id: 'Presentasi Rancangan dan Tes Akhir', en: 'Design presentations and final check', type: 'quiz', c: 'THR-3', core: true, activity: 'Present designs; end-of-track check' },
    ],
  },
  {
    slug: 'sma-smk-membangun-dengan-ai',
    level: 'sma_smk',
    title: { id: 'Membangun dengan AI', en: 'Build with AI' },
    summary: {
      id: 'Jalur untuk siswa SMA/SMK kelas 10–12: memahami, memeriksa, dan menggunakan AI untuk memecahkan masalah nyata.',
      en: 'Track for SMA/SMK grades 10–12: understand, check and use AI to solve real problems.',
    },
    lessons: [
      { n: 1, id: 'AI dan Dunia Kerja: Pengenalan dan Tes Awal', en: 'AI and the world of work: introduction and starting check', type: 'quiz', c: 'DIS-1', core: true, activity: 'Diagnostic; map where AI appears in the careers students are considering' },
      { n: 2, id: 'Jejak Digital dan Perlindungan Data Pribadi', en: 'Digital footprint and personal data protection', type: 'interactive', c: 'PRO-1', core: true, activity: 'Review what apps and AI services store; set personal data rules' },
      { n: 3, id: 'Jenis dan Cara Kerja Sistem AI', en: 'Types of AI systems and how they work', type: 'reading', c: 'DIS-1', also: ['DIS-2', 'DIS-3'], core: true, activity: 'Classify tools by function: rules, prediction, generation' },
      { n: 4, id: 'Algoritma Rekomendasi dan Media Sosial', en: 'Recommendation algorithms and social media', type: 'discussion', c: 'DIS-2', core: false, activity: 'How recommendation systems shape feeds and who benefits' },
      { n: 5, id: 'Batas Kemampuan AI dan Pengambilan Keputusan Manusia', en: 'The limits of AI and human decision-making', type: 'discussion', c: 'DIS-3', core: false, activity: 'Decide where a human must remain responsible (grading, hiring, health)' },
      { n: 6, id: 'Pelatihan Model dan Prediksi', en: 'Model training and prediction', type: 'interactive', c: 'UND-1', core: true, activity: 'Train a simple classifier; observe how training data shapes predictions' },
      { n: 7, id: 'Menelusuri Sumber Kesalahan AI', en: 'Tracing the causes of AI errors', type: 'ai_lab', c: 'UND-2', core: true, activity: 'Trace three AI failures to data, design or use; propose corrections' },
      { n: 8, id: 'Verifikasi Fakta dan Deteksi Deepfake', en: 'Fact verification and deepfake detection', type: 'ai_lab', c: 'UND-3', core: true, activity: 'Verify AI answers against sources; deepfake detection exercise' },
      { n: 9, id: 'Teknik Penulisan Prompt Lanjutan', en: 'Advanced prompting techniques', type: 'ai_lab', c: 'CRE-1', also: ['CRE-2'], core: true, activity: 'Roles, constraints and examples; team prompt challenge' },
      { n: 10, id: 'AI sebagai Mitra Belajar dan Bekerja', en: 'AI as a learning and work partner', type: 'ai_lab', c: 'CRE-2', core: false, activity: 'Research a topic with AI while recording own reasoning' },
      { n: 11, id: 'Membangun Prototipe dengan AI', en: 'Building a prototype with AI', type: 'project', c: 'CRE-3', core: true, activity: 'Build a chatbot, campaign or tool prototype; document the process' },
      { n: 12, id: 'Bias AI dalam Konteks Indonesia', en: 'AI bias in the Indonesian context', type: 'discussion', c: 'PRO-2', core: true, activity: 'Analyse bias by language, region and gender; design safeguards' },
      { n: 13, id: 'Integritas Akademik dan Profesional', en: 'Academic and professional integrity', type: 'discussion', c: 'PRO-3', core: true, activity: 'Rules for school and work; how to disclose AI use properly' },
      { n: 14, id: 'Pembagian Peran Manusia dan AI', en: 'Dividing work between humans and AI', type: 'discussion', c: 'THR-1', core: false, activity: 'Break a real job into tasks; decide AI or human for each' },
      { n: 15, id: 'Evaluasi Solusi AI', en: 'Evaluating AI solutions', type: 'reading', c: 'THR-2', core: false, activity: 'Evaluate an Indonesian AI product: benefits, risks and who is affected' },
      { n: 16, id: 'Proyek Terapan I: Analisis Masalah', en: 'Applied project I: problem analysis', type: 'project', c: 'THR-3', also: ['THR-1', 'THR-2'], core: true, activity: 'Teams receive a brief; SMK uses major-specific briefs' },
      { n: 17, id: 'Proyek Terapan II: Pengembangan dan Uji Coba', en: 'Applied project II: development and testing', type: 'project', c: 'THR-3', core: false, activity: 'Build and test the solution with AI; peer review' },
      { n: 18, id: 'Presentasi Proyek dan Tes Akhir', en: 'Project presentations and final check', type: 'quiz', c: 'THR-3', core: true, activity: 'Present to the brief owner; end-of-track check and AILIS readiness' },
    ],
  },
]
