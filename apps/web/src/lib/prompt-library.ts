/** Prompt library (spec D7): good prompt patterns for learning honestly and safely, in Bahasa and English. */
type L = { id: string; en: string }
const l = (id: string, en: string): L => ({ id, en })

export interface PromptPattern {
  slug: string
  category: 'learn' | 'check' | 'create' | 'privacy' | 'work'
  title: L
  when: L
  template: L
  weak: L
  strong: L
  caution?: L
}

export const PROMPT_CATEGORIES: Record<PromptPattern['category'], L> = {
  learn: l('Belajar', 'Learning'),
  check: l('Memeriksa fakta', 'Checking facts'),
  create: l('Menulis dan berkarya', 'Writing and creating'),
  privacy: l('Menjaga privasi', 'Protecting privacy'),
  work: l('Proyek dan dunia kerja', 'Projects and work'),
}

export const PROMPT_LIBRARY: PromptPattern[] = [
  {
    slug: 'tutor', category: 'learn',
    title: l('Jadikan AI tutor, bukan pembuat jawaban', 'Make AI a tutor, not an answer machine'),
    when: l('Saat belajar materi baru atau latihan soal.', 'When learning something new or practising.'),
    template: l('Aku siswa kelas [kelas]. Ajari aku tentang [topik] langkah demi langkah. Ajukan satu pertanyaan setiap kali dan tunggu jawabanku sebelum lanjut. Jangan beri jawaban akhir kecuali aku minta.', 'I am in grade [grade]. Teach me about [topic] step by step. Ask me one question at a time and wait for my answer before going on. Don’t give the final answer unless I ask.'),
    weak: l('Kerjakan PR matematika ini.', 'Do this maths homework.'),
    strong: l('Aku kelas 8 dan bingung soal persamaan linear. Beri petunjuk langkah pertama saja, lalu tanya aku langkah berikutnya.', 'I’m in grade 8 and stuck on linear equations. Give me a hint for the first step only, then ask me the next step.'),
  },
  {
    slug: 'explain-simpler', category: 'learn',
    title: l('Minta penjelasan yang lebih sederhana', 'Ask for a simpler explanation'),
    when: l('Saat penjelasan buku atau AI terlalu sulit.', 'When a textbook or AI explanation is too hard.'),
    template: l('Jelaskan [konsep] seolah-olah untuk anak usia [umur], dengan satu contoh dari kehidupan sehari-hari di Indonesia. Lalu buat 3 soal singkat untuk mengecek pemahamanku.', 'Explain [concept] as if to a [age]-year-old, with one everyday example from Indonesia. Then write 3 short questions to check my understanding.'),
    weak: l('Apa itu inflasi?', 'What is inflation?'),
    strong: l('Jelaskan inflasi untuk anak 13 tahun dengan contoh harga bakso dulu dan sekarang, lalu beri 3 soal cek.', 'Explain inflation for a 13-year-old using the price of bakso then and now, then give 3 check questions.'),
  },
  {
    slug: 'sources', category: 'check',
    title: l('Minta sumber, lalu periksa sendiri', 'Ask for sources, then check them yourself'),
    when: l('Saat butuh fakta untuk tugas atau berita.', 'When you need facts for an assignment or the news.'),
    template: l('Jawab [pertanyaan]. Untuk setiap fakta penting, sebutkan sumbernya (nama lembaga dan tahun). Tandai bagian yang kamu tidak yakin.', 'Answer [question]. For every key fact, name its source (organisation and year). Mark anything you are unsure about.'),
    weak: l('Berapa angka putus sekolah di Indonesia?', 'What is the school dropout rate in Indonesia?'),
    strong: l('Berapa angka putus sekolah SMP di Indonesia menurut data resmi terbaru? Sebutkan lembaga dan tahunnya, dan tandai jika kamu tidak yakin.', 'What is the latest official junior high dropout rate in Indonesia? Name the organisation and year, and say if you are unsure.'),
    caution: l('AI bisa mengarang sumber. Buka sumbernya sendiri (misalnya situs BPS atau kementerian) sebelum mengutip.', 'AI can invent sources. Open the source yourself (for example BPS or ministry sites) before quoting it.'),
  },
  {
    slug: 'counter', category: 'check',
    title: l('Minta sudut pandang lain', 'Ask for the other side'),
    when: l('Saat menulis opini atau menilai klaim viral.', 'When writing an opinion or judging a viral claim.'),
    template: l('Berikut klaim: “[klaim]”. Sebutkan bukti yang mendukung dan yang menentang, lalu apa yang perlu dicek agar yakin.', 'Here is a claim: “[claim]”. List evidence for and against, and what to check to be sure.'),
    weak: l('Benarkah video ini asli?', 'Is this video real?'),
    strong: l('Klaim: “Video banjir ini terjadi di Jakarta kemarin.” Apa tanda video lama atau hasil edit, dan bagaimana cara memeriksanya?', 'Claim: “This flood video happened in Jakarta yesterday.” What are signs of an old or edited video, and how can I check?'),
  },
  {
    slug: 'feedback', category: 'create',
    title: l('Minta masukan, bukan tulisan jadi', 'Ask for feedback, not a finished piece'),
    when: l('Saat sudah punya draf tulisan sendiri.', 'When you already have your own draft.'),
    template: l('Ini draf [jenis tulisan] saya: [tempel draf]. Beri 3 saran perbaikan tentang [struktur/argumen/bahasa]. Jangan tulis ulang; biar saya yang memperbaikinya.', 'Here is my draft [type of writing]: [paste draft]. Give 3 suggestions about [structure/argument/language]. Don’t rewrite it; I will fix it.'),
    weak: l('Buatkan esai tentang sampah plastik.', 'Write an essay about plastic waste.'),
    strong: l('Ini paragraf pembuka esaiku tentang sampah plastik. Beri 3 saran agar lebih menarik, tanpa menulis ulang.', 'Here is my essay’s opening paragraph on plastic waste. Give 3 ways to make it more engaging, without rewriting it.'),
    caution: l('Catat bantuan AI di tugasmu sesuai aturan gurumu.', 'Note AI help in your work, following your teacher’s rules.'),
  },
  {
    slug: 'brainstorm', category: 'create',
    title: l('Curah gagasan dengan batasan yang jelas', 'Brainstorm with clear limits'),
    when: l('Saat mencari ide proyek atau kegiatan.', 'When looking for project or activity ideas.'),
    template: l('Beri [jumlah] ide [proyek] untuk [sasaran] di [tempat], dengan biaya di bawah [anggaran] dan waktu [durasi]. Untuk tiap ide, sebutkan satu risiko.', 'Give [number] [project] ideas for [audience] at [place], under [budget] and in [time]. For each idea, name one risk.'),
    weak: l('Ide proyek sekolah?', 'School project ideas?'),
    strong: l('Beri 5 ide proyek AI untuk mengurangi antrean kantin SMP kami, biaya di bawah Rp200.000, selesai dalam 2 minggu. Sebutkan satu risiko tiap ide.', 'Give 5 AI project ideas to cut our junior high canteen queue, under Rp200,000, done in 2 weeks. Name one risk each.'),
  },
  {
    slug: 'anonymise', category: 'privacy',
    title: l('Samarkan data sebelum bertanya', 'Anonymise before you ask'),
    when: l('Saat pertanyaan menyangkut orang sungguhan.', 'When a question involves real people.'),
    template: l('Ganti nama, alamat, nomor, dan sekolah dengan contoh umum ([Teman A], [Kota X]) sebelum menempel ke AI.', 'Replace names, addresses, numbers and schools with general placeholders ([Friend A], [City X]) before pasting into AI.'),
    weak: l('Sinta Dewi kelas 9B SMPN 3 Bandung sering diejek, apa yang harus dia lakukan?', 'Sinta Dewi in 9B at SMPN 3 Bandung is often teased; what should she do?'),
    strong: l('Seorang teman sekelas sering diejek. Bagaimana cara saya membantunya dan kepada siapa sebaiknya melapor?', 'A classmate is often teased. How can I help, and who should I report it to?'),
    caution: l('Jangan pernah memasukkan kata sandi, OTP, KTP, atau data kesehatan.', 'Never type passwords, OTP codes, ID numbers or health data.'),
  },
  {
    slug: 'workplace', category: 'work',
    title: l('Cek kebijakan sebelum memakai AI di tempat kerja', 'Check the policy before using AI at work'),
    when: l('Saat magang/PKL atau proyek dengan klien.', 'During internships or client projects.'),
    template: l('Saya [peran] di [jenis tempat kerja]. Bantu saya [tugas] tanpa memakai data klien. Daftar hal yang perlu saya periksa sebelum hasilnya dipakai.', 'I am a [role] at a [type of workplace]. Help me [task] without using client data. List what I must check before the result is used.'),
    weak: l('Ini data pelanggan toko, rapikan dan analisis.', 'Here is the shop’s customer data; clean and analyse it.'),
    strong: l('Saya siswa PKL di toko. Buat templat tabel untuk mencatat penjualan harian (tanpa data pelanggan) dan daftar pengecekan sebelum dipakai.', 'I’m an intern at a shop. Make a table template for daily sales (no customer data) and a checklist before use.'),
  },
]
