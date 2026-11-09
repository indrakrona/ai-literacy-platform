import type { SortCard } from './logic'

type L = { id: string; en: string }

export interface SortDeck {
  title: L
  instructions: L
  binA: L
  binB: L
  cards: SortCard[]
}

const c = (id: string, textId: string, textEn: string, bin: 'a' | 'b', whyId: string, whyEn: string): SortCard => ({
  id,
  text: { id: textId, en: textEn },
  bin,
  why: { id: whyId, en: whyEn },
})

/** "Aman dibagikan" (a) vs "Simpan di perisai" (b). Used by data-protection lessons. */
export const SHIELD_DECK: SortDeck = {
  title: { id: 'Simulator Perisai Data', en: 'Data Shield simulator' },
  instructions: {
    id: 'Pilih apakah setiap informasi aman ditanyakan kepada layanan AI atau harus disimpan di perisai data Anda.',
    en: 'Decide whether each item is safe to share with an AI service or should stay behind your data shield.',
  },
  binA: { id: 'Aman dibagikan', en: 'Safe to share' },
  binB: { id: 'Simpan di perisai', en: 'Keep in the shield' },
  cards: [
    c('address', 'Alamat rumah lengkap', 'Full home address', 'b', 'Alamat dapat digunakan untuk menemukan Anda secara langsung.', 'An address can be used to find you in person.'),
    c('photosynthesis', 'Pertanyaan tentang fotosintesis', 'A question about photosynthesis', 'a', 'Materi pelajaran tidak memuat data pribadi.', 'Lesson topics contain no personal data.'),
    c('otp', 'Kode OTP dari bank', 'An OTP code from the bank', 'b', 'Kode OTP membuka akses ke akun Anda.', 'An OTP code unlocks your account.'),
    c('story', 'Ide cerita pendek tentang naga', 'A short story idea about a dragon', 'a', 'Ide kreatif tanpa data pribadi aman untuk dibahas.', 'Creative ideas without personal data are safe to discuss.'),
    c('fullname-school', 'Nama lengkap beserta sekolah dan kelas', 'Full name with school and class', 'b', 'Gabungan data ini dapat mengenali Anda dengan tepat.', 'Together these identify you exactly.'),
    c('math', 'Soal latihan persamaan linear', 'A linear equation practice problem', 'a', 'Soal latihan tidak memuat data pribadi.', 'Practice problems contain no personal data.'),
    c('health', 'Hasil pemeriksaan kesehatan teman', "A friend's medical results", 'b', 'Data kesehatan bersifat spesifik dan milik orang lain.', 'Health data is sensitive and belongs to someone else.'),
    c('ktp', 'Foto KTP orang tua', "A photo of a parent's ID card", 'b', 'Dokumen identitas dapat disalahgunakan untuk penipuan.', 'ID documents can be misused for fraud.'),
    c('recipe', 'Resep nasi goreng', 'A fried rice recipe', 'a', 'Resep adalah informasi umum.', 'A recipe is general information.'),
    c('password', 'Kata sandi akun media sosial', 'A social media password', 'b', 'Kata sandi tidak boleh dibagikan kepada siapa pun.', 'Passwords must never be shared with anyone.'),
  ],
}

/** "Program biasa" (a) vs "Sistem AI" (b). */
export const PROGRAM_VS_AI_DECK: SortDeck = {
  title: { id: 'Program Biasa atau Sistem AI?', en: 'Conventional program or AI system?' },
  instructions: {
    id: 'Kelompokkan setiap alat: apakah mengikuti aturan tetap atau mempelajari pola dari data?',
    en: 'Sort each tool: does it follow fixed rules or learn patterns from data?',
  },
  binA: { id: 'Program biasa', en: 'Conventional program' },
  binB: { id: 'Sistem AI', en: 'AI system' },
  cards: [
    c('calculator', 'Kalkulator', 'Calculator', 'a', 'Kalkulator mengikuti aturan hitung yang tetap.', 'A calculator follows fixed arithmetic rules.'),
    c('recommend', 'Rekomendasi video', 'Video recommendations', 'b', 'Rekomendasi mempelajari pola tontonan pengguna.', 'Recommendations learn from viewing patterns.'),
    c('alarm', 'Jam alarm', 'Alarm clock', 'a', 'Alarm berbunyi pada waktu yang diatur.', 'An alarm rings at a set time.'),
    c('faceunlock', 'Buka kunci ponsel dengan wajah', 'Face unlock on a phone', 'b', 'Pengenalan wajah dilatih dengan banyak contoh wajah.', 'Face recognition is trained on many face images.'),
    c('trafficlight', 'Lampu lalu lintas berpengatur waktu', 'Timed traffic light', 'a', 'Lampu berganti sesuai jadwal tetap.', 'The light changes on a fixed schedule.'),
    c('translate', 'Penerjemah otomatis', 'Automatic translator', 'b', 'Penerjemah mempelajari pola dari jutaan kalimat.', 'Translators learn patterns from millions of sentences.'),
    c('washing', 'Mesin cuci dengan pengatur waktu', 'Washing machine timer', 'a', 'Mesin menjalankan program yang sudah ditentukan.', 'The machine runs a preset program.'),
    c('chatbot', 'Chatbot', 'Chatbot', 'b', 'Chatbot menyusun jawaban dari pola bahasa yang dipelajari.', 'A chatbot builds answers from learned language patterns.'),
  ],
}

export const DECKS = { 'shield-sort': SHIELD_DECK, 'program-vs-ai': PROGRAM_VS_AI_DECK }
