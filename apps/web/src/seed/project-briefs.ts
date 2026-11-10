import type { Payload } from 'payload'

type Level = 'smp' | 'sma_smk'
interface BriefSeed {
  slug: string
  level: Level
  competency: string
  smkMajor?: string
  allowTeams?: boolean
  /** Lessons this brief is the default project for, as trackSlug:order. */
  links?: string[]
  title: { id: string; en: string }
  client: string
  problem: string
  deliverables: string
  rubric: [string, string][]
}

/** Shared criteria for applied projects, so marks are comparable across majors. */
const APPLIED_RUBRIC: [string, string][] = [
  ['Analisis masalah', 'Masalah dirumuskan dengan jelas berdasarkan data atau wawancara dengan pemilik masalah, termasuk siapa yang terdampak.'],
  ['Pemanfaatan AI yang tepat', 'AI dipakai pada bagian yang memang cocok; siswa menjelaskan mengapa, dan bagian mana yang dikerjakan sendiri.'],
  ['Pemeriksaan dan keamanan', 'Hasil AI diperiksa dengan sumber atau uji coba; data pribadi dilindungi dan risiko bias atau kesalahan disebutkan beserta cara mengatasinya.'],
  ['Hasil dan komunikasi', 'Solusi dapat dipakai pemilik masalah, diuji minimal pada satu pengguna, dan disajikan dengan rapi serta jujur tentang keterbatasannya.'],
]

const SMA = 'sma-smk-membangun-dengan-ai'
const SMP = 'smp-ai-untuk-belajar-dan-integritas'

const BRIEFS: BriefSeed[] = [
  // ---- SMP ----
  {
    slug: 'smp-poster-kantin-sehat', level: 'smp', competency: 'CRE-3', allowTeams: true, links: [`${SMP}:12`],
    title: { id: 'Poster Kampanye Kantin Sehat', en: 'Healthy canteen campaign poster' },
    client: 'Pengelola kantin sekolah',
    problem: 'Pengelola kantin ingin lebih banyak siswa memilih menu sehat seperti buah, sayur, dan air putih, tetapi poster lama tidak diperhatikan. Mereka meminta kalian membuat poster baru yang menarik bagi siswa seusia kalian.',
    deliverables: '1. Satu poster (gambar atau tautan Canva).\n2. Catatan singkat: perintah (prompt) yang kalian pakai, bagian yang dibuat AI, dan bagian yang kalian buat atau ubah sendiri.\n3. Satu fakta gizi pada poster beserta sumber tepercaya yang kalian periksa.',
    rubric: [
      ['Pesan yang jelas', 'Pesan poster langsung dipahami siswa SMP dan mengajak pada satu tindakan yang konkret.'],
      ['Kejujuran kontribusi', 'Catatan menyebutkan dengan rinci mana karya AI dan mana karya sendiri, termasuk perubahan yang dilakukan.'],
      ['Fakta yang diperiksa', 'Fakta gizi benar dan sumbernya tepercaya (misalnya Kemenkes atau buku pelajaran).'],
      ['Kualitas tampilan', 'Tata letak rapi, mudah dibaca dari jauh, dan tidak memakai gambar orang nyata tanpa izin.'],
    ],
  },
  {
    slug: 'smp-ai-untuk-kebaikan-lingkungan', level: 'smp', competency: 'THR-3', allowTeams: true, links: [`${SMP}:17`],
    title: { id: 'Gagasan AI untuk Kebaikan di Lingkungan Sekitar', en: 'An AI-for-good idea for your community' },
    client: 'RT/RW atau kelurahan tempat tinggal siswa',
    problem: 'Pilih satu masalah nyata di sekitar sekolah atau rumah, misalnya sampah yang menumpuk, banjir saat hujan, atau warga lansia yang sulit mendapat informasi. Rancang gagasan bagaimana AI dapat membantu, tanpa harus membuat aplikasinya.',
    deliverables: '1. Rumusan masalah dan siapa yang terdampak.\n2. Gambaran solusi: apa yang dilakukan AI, data apa yang dibutuhkan, dan dari mana datanya.\n3. Satu aturan keamanan atau privasi yang wajib dipatuhi solusi kalian.\n4. Presentasi singkat (paling banyak 5 slide atau poster).',
    rubric: [
      ['Masalah nyata', 'Masalah benar-benar ada di lingkungan siswa dan didukung pengamatan atau wawancara singkat.'],
      ['Peran AI yang masuk akal', 'Peran AI jelas dan sesuai kemampuannya; siswa juga menyebut apa yang tidak dapat dilakukan AI.'],
      ['Data dan privasi', 'Kebutuhan data disebutkan dengan jujur, dan aturan privasi melindungi warga.'],
      ['Kerja sama dan penyajian', 'Semua anggota berperan; gagasan disajikan runtut dan mudah dipahami warga.'],
    ],
  },
  // ---- SMA (general) ----
  {
    slug: 'sma-prototipe-asisten-umkm', level: 'sma_smk', competency: 'CRE-3', allowTeams: true, links: [`${SMA}:11`],
    title: { id: 'Prototipe Asisten Digital untuk UMKM', en: 'A digital assistant prototype for a small business' },
    client: 'UMKM di sekitar sekolah (warung, toko, jasa)',
    problem: 'Banyak UMKM menjawab pertanyaan pelanggan yang sama berulang kali melalui WhatsApp: harga, jam buka, cara pesan. Buat prototipe asisten berbasis AI, atau rangkaian perintah siap pakai, yang membantu pemilik menjawab lebih cepat tanpa memberi informasi keliru.',
    deliverables: '1. Wawancara singkat dengan pemilik UMKM (5 pertanyaan teratas pelanggan).\n2. Prototipe: instruksi sistem atau kumpulan perintah, beserta contoh percakapan.\n3. Hasil uji: minimal 10 pertanyaan uji, termasuk 3 pertanyaan "jebakan", dan perbaikan yang dilakukan.\n4. Catatan proses pemakaian AI.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'sma-proyek-terapan-sekolah', level: 'sma_smk', competency: 'THR-3', allowTeams: true, links: [`${SMA}:16`, `${SMA}:17`],
    title: { id: 'Proyek Terapan: Solusi AI untuk Masalah Sekolah', en: 'Applied project: an AI solution for a school problem' },
    client: 'Wakil kepala sekolah bidang kesiswaan atau OSIS',
    problem: 'Pilih satu masalah sekolah yang disepakati dengan OSIS atau guru, misalnya informasi kegiatan yang tidak sampai ke siswa, antrean di perpustakaan, atau siswa yang kesulitan memilih jurusan kuliah. Analisis masalahnya (Sesi 16), lalu kembangkan dan uji solusi yang memanfaatkan AI (Sesi 17).',
    deliverables: '1. Laporan analisis masalah: data, pengguna, dan akar masalah.\n2. Rancangan dan prototipe solusi.\n3. Hasil uji coba dengan minimal 3 pengguna dan ulasan dari kelompok lain.\n4. Daftar risiko (privasi, bias, kesalahan) dan cara mengatasinya.\n5. Presentasi 7 menit.',
    rubric: APPLIED_RUBRIC,
  },
  // ---- SMK by major (Sesi 16–17) ----
  {
    slug: 'smk-akuntansi-rekap-kas-umkm', level: 'sma_smk', competency: 'THR-3', smkMajor: 'akuntansi',
    title: { id: 'Rekap Kas Harian UMKM dengan Bantuan AI', en: 'Daily cash summary for a small business with AI' },
    client: 'Pemilik warung atau koperasi sekolah',
    problem: 'Pemilik usaha mencatat pemasukan dan pengeluaran di buku tulis dan tidak tahu untung-ruginya setiap minggu. Rancang cara sederhana memakai AI untuk merapikan catatan menjadi rekap kas dan laporan laba rugi sederhana, lalu periksa kebenaran hitungannya secara manual.',
    deliverables: '1. Contoh catatan asli (data pribadi pelanggan disamarkan).\n2. Perintah AI dan hasil rekap kas mingguan.\n3. Pemeriksaan manual: minimal satu kesalahan AI yang ditemukan dan diperbaiki.\n4. Panduan satu halaman untuk pemilik usaha.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-pemasaran-konten-produk-lokal', level: 'sma_smk', competency: 'THR-3', smkMajor: 'pemasaran',
    title: { id: 'Konten Pemasaran Produk Lokal yang Jujur', en: 'Honest marketing content for a local product' },
    client: 'Perajin atau UMKM produk lokal',
    problem: 'Sebuah UMKM ingin menjual produknya di marketplace dan media sosial, tetapi tidak punya waktu membuat konten. Buat rencana konten dua minggu dengan bantuan AI yang menarik tanpa klaim berlebihan atau menyesatkan.',
    deliverables: '1. Profil target pembeli.\n2. Kalender konten 14 hari dan 3 contoh unggahan lengkap.\n3. Daftar klaim yang dihapus atau diubah karena tidak dapat dibuktikan.\n4. Pengungkapan penggunaan AI yang sesuai etika.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-tjkt-panduan-keamanan-jaringan', level: 'sma_smk', competency: 'THR-3', smkMajor: 'tjkt',
    title: { id: 'Panduan Keamanan Wi-Fi untuk Usaha Kecil', en: 'Wi-Fi security guide for a small business' },
    client: 'Warung internet, kafe, atau kantor desa',
    problem: 'Banyak usaha kecil memakai kata sandi bawaan router dan membagikan Wi-Fi ke semua orang. Susun panduan dan daftar periksa keamanan jaringan dengan bantuan AI, lalu uji setiap langkah pada perangkat laboratorium sekolah, bukan pada jaringan orang lain.',
    deliverables: '1. Daftar periksa keamanan (minimal 10 butir).\n2. Bukti uji di laboratorium sekolah untuk setiap langkah.\n3. Catatan saran AI yang keliru atau sudah usang beserta koreksinya.\n4. Panduan bergambar untuk pemilik usaha.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-pplg-chatbot-informasi-sekolah', level: 'sma_smk', competency: 'THR-3', smkMajor: 'pplg',
    title: { id: 'Chatbot Informasi Pendaftaran Sekolah', en: 'A school admissions information chatbot' },
    client: 'Panitia penerimaan peserta didik baru (PPDB)',
    problem: 'Setiap tahun panitia PPDB menerima ratusan pertanyaan yang sama. Kembangkan prototipe chatbot yang menjawab hanya dari dokumen resmi sekolah, menolak menebak, dan tidak meminta data pribadi calon siswa.',
    deliverables: '1. Dokumen sumber yang dipakai.\n2. Kode atau konfigurasi prototipe (repositori atau tautan).\n3. Laporan uji: 20 pertanyaan, termasuk pertanyaan di luar dokumen dan upaya meminta data pribadi.\n4. Catatan bagian kode yang dibantu AI dan cara kalian memeriksanya.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-perhotelan-layanan-tamu', level: 'sma_smk', competency: 'THR-3', smkMajor: 'perhotelan',
    title: { id: 'Panduan Layanan Tamu Multibahasa', en: 'A multilingual guest service guide' },
    client: 'Homestay atau penginapan di daerah wisata',
    problem: 'Pengelola penginapan sering kesulitan melayani tamu asing. Buat panduan percakapan dan informasi wisata dalam dua bahasa dengan bantuan AI, lalu periksa ketepatan terjemahan dan kebenaran informasi lokalnya.',
    deliverables: '1. 15 situasi layanan tamu dengan contoh kalimat dua bahasa.\n2. Lembar informasi wisata sekitar yang sudah diverifikasi.\n3. Catatan terjemahan AI yang kurang tepat atau tidak sopan dan perbaikannya.\n4. Uji coba bermain peran yang direkam atau dicatat.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-kuliner-resep-dan-biaya', level: 'sma_smk', competency: 'THR-3', smkMajor: 'kuliner',
    title: { id: 'Pengembangan Menu dan Perhitungan Biaya', en: 'Menu development and costing' },
    client: 'Kantin sekolah atau usaha katering rumahan',
    problem: 'Kantin ingin menambah satu menu baru yang bergizi, sesuai selera siswa, dan harganya terjangkau. Gunakan AI untuk mencari gagasan resep dan menghitung biaya bahan, lalu uji masak dan periksa harga bahan di pasar setempat.',
    deliverables: '1. Tiga usulan menu dari AI dan alasan memilih satu.\n2. Resep standar dan perhitungan harga pokok per porsi dengan harga pasar nyata.\n3. Hasil uji rasa pada minimal 5 siswa.\n4. Catatan keamanan pangan dan alergen.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-otomotif-diagnosis-kerusakan', level: 'sma_smk', competency: 'THR-3', smkMajor: 'otomotif',
    title: { id: 'Asisten Diagnosis Kerusakan Sepeda Motor', en: 'A motorcycle fault-diagnosis assistant' },
    client: 'Bengkel sepeda motor di sekitar sekolah',
    problem: 'Mekanik pemula sering bingung menentukan penyebab gejala kerusakan. Susun pohon diagnosis untuk lima gejala umum dengan bantuan AI, lalu bandingkan dengan buku manual servis dan pendapat mekanik berpengalaman.',
    deliverables: '1. Pohon diagnosis untuk 5 gejala.\n2. Tabel perbandingan saran AI, buku manual, dan mekanik.\n3. Catatan saran AI yang berbahaya atau keliru.\n4. Uji pada minimal satu kendaraan praktik di bengkel sekolah.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-dkv-identitas-visual-umkm', level: 'sma_smk', competency: 'THR-3', smkMajor: 'dkv',
    title: { id: 'Identitas Visual UMKM dengan AI secara Etis', en: 'Ethical AI-assisted visual identity for a small business' },
    client: 'UMKM yang belum memiliki logo',
    problem: 'Sebuah UMKM membutuhkan logo dan panduan warna sederhana. Gunakan AI untuk eksplorasi gagasan, tetapi hasil akhir harus karya kalian sendiri, tidak meniru merek lain, dan menghormati hak cipta.',
    deliverables: '1. Papan suasana (moodboard) dan eksplorasi AI.\n2. Logo final dalam format vektor beserta panduan warna dan huruf.\n3. Penjelasan bagian yang dibuat sendiri dan pemeriksaan kemiripan dengan merek lain.\n4. Masukan pemilik UMKM.',
    rubric: APPLIED_RUBRIC,
  },
  {
    slug: 'smk-kesehatan-edukasi-obat', level: 'sma_smk', competency: 'THR-3', smkMajor: 'kesehatan',
    title: { id: 'Materi Edukasi Penggunaan Obat yang Aman', en: 'Safe medicine use education materials' },
    client: 'Puskesmas atau UKS sekolah',
    problem: 'Banyak warga minum obat tanpa membaca aturan pakai. Buat materi edukasi sederhana dengan bantuan AI, lalu periksa setiap informasi dengan sumber resmi dan mintalah tenaga kesehatan meninjaunya. AI tidak boleh dipakai untuk menentukan dosis bagi orang tertentu.',
    deliverables: '1. Leaflet atau video pendek tentang membaca etiket obat.\n2. Tabel verifikasi setiap informasi dengan sumber resmi (BPOM atau Kemenkes).\n3. Catatan informasi AI yang keliru atau berisiko.\n4. Tanda tangan atau catatan tinjauan dari guru atau tenaga kesehatan.',
    rubric: APPLIED_RUBRIC,
  },
]

export const PROJECT_BRIEF_COUNT = BRIEFS.length

/** Upsert briefs by slug and link the default brief to each project lesson. Idempotent. */
export async function seedProjectBriefs(payload: Payload) {
  let linked = 0
  for (const b of BRIEFS) {
    const data = {
      title: b.title.id,
      slug: b.slug,
      level: b.level,
      competency: b.competency as never,
      smkMajor: (b.smkMajor ?? null) as never,
      client: b.client,
      problem: b.problem,
      deliverables: b.deliverables,
      allowTeams: b.allowTeams ?? true,
      rubric: b.rubric.map(([criterion, description]) => ({ criterion, description })),
      _status: 'published' as const,
      reviewState: 'approved' as const,
    }
    const existing = await payload.find({ collection: 'project-briefs', where: { slug: { equals: b.slug } }, limit: 1, depth: 0 })
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'project-briefs', id: existing.docs[0].id, locale: 'id', data })
      : await payload.create({ collection: 'project-briefs', locale: 'id', data })
    // English title only for now; the body stays in Bahasa until the English content pass.
    const enRubric = (doc.rubric ?? []).map((r) => ({ id: r.id, criterion: r.criterion, description: r.description }))
    await payload.update({
      collection: 'project-briefs',
      id: doc.id,
      locale: 'en',
      data: { title: b.title.en, client: b.client, problem: b.problem, deliverables: b.deliverables, rubric: enRubric },
    })
    for (const link of b.links ?? []) {
      const [slug, order] = link.split(':')
      const track = (await payload.find({ collection: 'tracks', where: { slug: { equals: slug } }, limit: 1 })).docs[0]
      if (!track) continue
      const units = await payload.find({ collection: 'units', where: { track: { equals: track.id } }, limit: 10, depth: 0 })
      const lesson = (await payload.find({ collection: 'lessons', draft: true, where: { and: [{ unit: { in: units.docs.map((u) => u.id) } }, { order: { equals: Number(order) } }] }, limit: 1 })).docs[0]
      if (lesson) {
        await payload.update({ collection: 'lessons', id: lesson.id, data: { projectBrief: doc.id } })
        linked++
      }
    }
  }
  return { briefs: BRIEFS.length, linked }
}
