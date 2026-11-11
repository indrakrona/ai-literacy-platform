/**
 * Content for the challenge-mode simulators (spec C4, D6): AI vs human, hallucination hunt, prompt battle,
 * fix the biased output, and the recommendation-feed bubble. Everything runs in the browser (no AI call),
 * so it works offline and costs nothing per student.
 */
import type { SortDeck } from './data'

type L = { id: string; en: string }
const l = (id: string, en: string): L => ({ id, en })

/** AI vs human: is this text or picture description made by AI or by a person? Clues in the explanation. */
export const AI_OR_HUMAN: SortDeck = {
  title: l('Buatan AI atau manusia?', 'AI or human?'),
  instructions: l(
    'Baca setiap contoh, lalu tebak: dibuat AI atau manusia? Setelah memilih, lihat petunjuk yang bisa kamu periksa. Tidak ada cara yang 100% pasti; yang penting adalah memeriksa sumber.',
    'Read each example and guess: made by AI or by a person? After choosing, see the clues you can check. No method is 100% certain; what matters is checking the source.',
  ),
  binA: l('Buatan AI', 'Made by AI'),
  binB: l('Buatan manusia', 'Made by a person'),
  cards: [
    {
      id: 'hands', bin: 'a',
      text: l('Foto “pejabat meresmikan jembatan”: tangan kanannya punya enam jari, dan tulisan di spanduk tidak terbaca.', 'Photo of “an official opening a bridge”: the right hand has six fingers and the banner text is unreadable.'),
      why: l('Jari yang aneh dan tulisan yang kacau adalah tanda umum gambar AI. Cari foto yang sama di situs berita resmi.', 'Odd fingers and garbled text are common signs of AI images. Look for the same photo on official news sites.'),
    },
    {
      id: 'diary', bin: 'b',
      text: l('“Tadi pagi angkot telat lagi, jadi aku lari dari gang depan sambil bawa gorengan titipan Bu Ani. Untung gerbang belum ditutup.”', '“The minibus was late again this morning, so I ran from the alley holding the fritters Bu Ani asked me to bring. Luckily the gate was still open.”'),
      why: l('Detail kecil yang sangat pribadi dan tidak rapi biasanya tanda tulisan manusia, meski AI juga bisa menirunya.', 'Small, messy personal details usually point to a person, although AI can imitate them too.'),
    },
    {
      id: 'essay', bin: 'a',
      text: l('“Teknologi merupakan pedang bermata dua. Di satu sisi, ia membawa manfaat. Di sisi lain, ia membawa tantangan. Oleh karena itu, kita harus bijak.”', '“Technology is a double-edged sword. On one hand, it brings benefits. On the other hand, it brings challenges. Therefore, we must be wise.”'),
      why: l('Kalimat umum, seimbang sempurna, tanpa contoh nyata: pola yang sering muncul pada teks AI.', 'Generic, perfectly balanced sentences with no real example: a pattern common in AI text.'),
    },
    {
      id: 'voice', bin: 'a',
      text: l('Pesan suara “dari kepala sekolah” meminta orang tua segera transfer uang ke rekening baru. Suaranya mirip, tetapi datar dan tanpa napas.', 'A voice note “from the principal” asks parents to transfer money to a new account quickly. The voice is similar but flat, with no breathing.'),
      why: l('Suara tiruan AI sering terdengar datar. Permintaan uang mendadak adalah tanda penipuan: telepon langsung ke sekolah.', 'AI voice clones often sound flat. Sudden money requests are a scam sign: call the school directly.'),
    },
    {
      id: 'sketch', bin: 'b',
      text: l('Sketsa pensil denah kantin sekolah dengan coretan, ukuran yang dihapus, dan catatan “meja 3 goyang”.', 'A pencil sketch of the school canteen layout with crossings-out, erased measurements and a note “table 3 wobbles”.'),
      why: l('Proses yang terlihat (coretan, hapusan) dan pengetahuan lokal adalah tanda karya manusia.', 'Visible process (crossings-out, erasing) and local knowledge are signs of human work.'),
    },
    {
      id: 'review', bin: 'a',
      text: l('50 ulasan bintang lima untuk warung baru, semuanya diunggah dalam satu jam, dengan kalimat yang hampir sama.', '50 five-star reviews for a new food stall, all posted within an hour, with almost identical sentences.'),
      why: l('Banyak ulasan serupa dalam waktu singkat sering dibuat otomatis. Lihat profil pengulas dan tanggalnya.', 'Many similar reviews in a short time are often generated. Check the reviewers’ profiles and dates.'),
    },
  ],
}

export interface HuntRound {
  topic: L
  sentences: { text: L; wrong: boolean; why?: L }[]
}

/** Hallucination hunt: an AI answer with made-up facts mixed in. Students tap the sentences to check. */
export const HALLUCINATION_HUNT: HuntRound[] = [
  {
    topic: l('Pertanyaan: “Ceritakan tentang Candi Borobudur.”', 'Question: “Tell me about Borobudur Temple.”'),
    sentences: [
      { text: l('Borobudur adalah candi Buddha di Magelang, Jawa Tengah.', 'Borobudur is a Buddhist temple in Magelang, Central Java.'), wrong: false },
      { text: l('Candi ini dibangun sekitar abad ke-8 sampai ke-9 pada masa Dinasti Syailendra.', 'It was built around the 8th–9th century under the Sailendra dynasty.'), wrong: false },
      { text: l('Borobudur memiliki tepat 1.000 stupa yang masing-masing berisi patung emas.', 'Borobudur has exactly 1,000 stupas, each holding a golden statue.'), wrong: true, why: l('Angka bulat yang “pas” dan patung emas adalah karangan. Candi ini punya 72 stupa berlubang di teras atas, berisi arca Buddha dari batu.', 'The neat round number and golden statues are invented. The upper terraces have 72 perforated stupas with stone Buddha statues.') },
      { text: l('Menurut Prof. Hendra Wijaya dalam bukunya tahun 1987, candi ini awalnya dibangun di atas danau.', 'According to Prof. Hendra Wijaya in his 1987 book, the temple was first built on a lake.'), wrong: true, why: l('Nama ahli dan buku yang terdengar meyakinkan bisa dikarang AI. Cari buku itu: kalau tidak ditemukan, jangan dikutip.', 'Convincing expert names and books can be made up by AI. Search for the book: if you cannot find it, do not cite it.') },
      { text: l('Borobudur termasuk Situs Warisan Dunia UNESCO.', 'Borobudur is a UNESCO World Heritage Site.'), wrong: false },
    ],
  },
  {
    topic: l('Pertanyaan: “Berapa banyak pengguna internet di Indonesia dan apa dampaknya?”', 'Question: “How many internet users does Indonesia have, and what is the impact?”'),
    sentences: [
      { text: l('Pengguna internet di Indonesia terus bertambah setiap tahun.', 'Internet use in Indonesia keeps growing every year.'), wrong: false },
      { text: l('Survei resmi tahun 2025 mencatat tepat 312.456.789 pengguna internet di Indonesia.', 'An official 2025 survey recorded exactly 312,456,789 internet users in Indonesia.'), wrong: true, why: l('Angka itu lebih besar dari jumlah penduduk dan terlalu “presisi”. Periksa ke sumber survei resmi seperti APJII atau BPS.', 'That number is larger than the population and suspiciously precise. Check an official survey source such as APJII or BPS.') },
      { text: l('Internet membantu siswa mengakses materi belajar, tetapi juga membuka risiko hoaks.', 'The internet helps students reach learning materials, but also brings the risk of hoaxes.'), wrong: false },
      { text: l('Pemerintah mewajibkan semua sekolah memakai satu aplikasi AI yang sama sejak 2024.', 'The government has required every school to use the same AI app since 2024.'), wrong: true, why: l('Klaim kebijakan besar tanpa sumber perlu dicek ke situs resmi kementerian. Tidak ada kewajiban seperti ini.', 'Big policy claims without a source must be checked on the ministry’s official site. No such rule exists.') },
    ],
  },
]

export interface ChoiceRound {
  situation: L
  options: { text: L; output?: L; best: boolean; why: L }[]
}

/** Prompt battle: two prompts, the replies they get. Which prompt is better, and why? */
export const PROMPT_BATTLE: ChoiceRound[] = [
  {
    situation: l('Kamu ingin AI membantu belajar untuk ulangan fotosintesis besok.', 'You want AI to help you study for tomorrow’s photosynthesis test.'),
    options: [
      { text: l('“Jelaskan fotosintesis.”', '“Explain photosynthesis.”'), output: l('Penjelasan panjang setara buku kuliah, penuh istilah yang belum dipelajari.', 'A long, university-level explanation full of terms you have not learned.'), best: false, why: l('Tanpa konteks, AI tidak tahu tingkatmu atau apa yang kamu butuhkan.', 'Without context, the AI does not know your level or what you need.') },
      { text: l('“Aku siswa kelas 8. Buat 5 soal latihan fotosintesis pilihan ganda, lalu jelaskan jawabannya dengan bahasa sederhana. Jangan beri jawaban sebelum aku mencoba.”', '“I’m in grade 8. Make 5 multiple-choice practice questions on photosynthesis, then explain the answers simply. Don’t give answers before I try.”'), output: l('Lima soal sesuai tingkat kelas, dengan penjelasan setelah kamu menjawab.', 'Five grade-level questions, explained after you answer.'), best: true, why: l('Ada peran, tingkat, format, dan cara belajar yang jujur: AI membantu kamu berpikir, bukan menggantikanmu.', 'It gives a role, level, format and an honest way to learn: AI helps you think instead of thinking for you.') },
    ],
  },
  {
    situation: l('Kamu butuh poster ajakan hemat air untuk kantin sekolah.', 'You need a save-water poster for the school canteen.'),
    options: [
      { text: l('“Buat poster hemat air yang keren.”', '“Make a cool save-water poster.”'), output: l('Teks umum “Hemat air, selamatkan bumi!” yang bisa untuk mana saja.', 'Generic text “Save water, save the earth!” that could be for anywhere.'), best: false, why: l('“Keren” tidak jelas, dan tidak ada sasaran atau tempat.', '“Cool” is vague, and there is no audience or place.') },
      { text: l('“Tulis 3 pilihan kalimat ajakan (maks. 8 kata) untuk poster di wastafel kantin SMP, sasaran siswa usia 13 tahun, nada santai, tanpa menyalahkan.”', '“Write 3 options for a call to action (max 8 words) for a poster at a junior high canteen sink, for 13-year-olds, casual tone, without blaming.”'), output: l('Tiga kalimat pendek yang cocok untuk wastafel kantin dan siswa SMP.', 'Three short lines that fit a canteen sink and junior high students.'), best: true, why: l('Tujuan, sasaran, panjang, dan nada yang jelas memberi hasil yang bisa langsung kamu pilih dan perbaiki.', 'A clear goal, audience, length and tone give results you can choose from and improve.') },
    ],
  },
]

/** Fix the biased output: an AI reply with a stereotype. Which follow-up fixes it best? */
export const BIAS_FIX: ChoiceRound[] = [
  {
    situation: l('AI diminta “Buat cerita tentang seorang insinyur dan seorang perawat.” Hasilnya: insinyurnya laki-laki yang memimpin, perawatnya perempuan yang “lembut dan penurut”.', 'AI was asked to “Write a story about an engineer and a nurse.” Result: the engineer is a man who leads, the nurse a woman who is “gentle and obedient”.'),
    options: [
      { text: l('Terima saja, karena memang biasanya begitu.', 'Accept it, because that is how it usually is.'), best: false, why: l('Menerima stereotip membuatnya makin kuat. Banyak insinyur perempuan dan perawat laki-laki di Indonesia.', 'Accepting stereotypes makes them stronger. Indonesia has many women engineers and men nurses.') },
      { text: l('“Tulis ulang: insinyurnya perempuan bernama Sari dan perawatnya laki-laki bernama Budi. Keduanya sama-sama ahli dan saling menghormati.”', '“Rewrite it: the engineer is a woman named Sari and the nurse a man named Budi. Both are skilled and respect each other.”'), best: true, why: l('Perintah yang jelas memperbaiki stereotip dan memberi tokoh yang setara.', 'A clear instruction fixes the stereotype and gives equal characters.') },
      { text: l('Hapus saja kata “perawat” dari cerita.', 'Just delete the word “nurse” from the story.'), best: false, why: l('Menghapus tokoh tidak memperbaiki cara AI menggambarkan orang.', 'Deleting a character does not fix how the AI describes people.') },
    ],
  },
  {
    situation: l('AI menyaring 10 lamaran kerja dan hanya meloloskan pelamar dari kota besar, karena data latihnya kebanyakan dari karyawan kota besar.', 'An AI screened 10 job applications and only passed applicants from big cities, because its training data was mostly big-city employees.'),
    options: [
      { text: l('Tambahkan data latih yang seimbang dari berbagai daerah, lalu minta manusia memeriksa hasilnya.', 'Add balanced training data from many regions, and have people review the results.'), best: true, why: l('Bias berasal dari data yang tidak seimbang; memperbaiki data dan pemeriksaan manusia sama-sama penting.', 'The bias comes from unbalanced data; fixing the data and human review both matter.') },
      { text: l('Biarkan saja, AI lebih objektif daripada manusia.', 'Leave it, AI is more objective than people.'), best: false, why: l('AI meniru pola dalam datanya, termasuk ketidakadilan.', 'AI copies the patterns in its data, including unfairness.') },
    ],
  },
]

/** Recommendation feed: topics and the videos a feed can show. */
export const FEED_TOPICS = [
  { key: 'game', icon: '🎮', name: l('Gim', 'Games') },
  { key: 'music', icon: '🎵', name: l('Musik', 'Music') },
  { key: 'science', icon: '🔬', name: l('Sains', 'Science') },
  { key: 'football', icon: '⚽', name: l('Sepak bola', 'Football') },
  { key: 'cooking', icon: '🍳', name: l('Masak', 'Cooking') },
  { key: 'news', icon: '📰', name: l('Berita', 'News') },
] as const
export type FeedTopic = (typeof FEED_TOPICS)[number]['key']
