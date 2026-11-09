import { doc, h2, p, ul } from '../lexical'

const TRACK = 'smp-ai-untuk-belajar-dan-integritas'
const q = (prompt: string, options: [string, boolean][], explanation: string) => ({
  prompt,
  options: options.map(([text, correct]) => ({ text, correct })),
  explanation,
})

/** SMP session 14 · PRO-3 · academic integrity and AI use. */
export const SMP_14 = {
  track: TRACK,
  order: 14,
  objective:
    'Siswa dapat menerapkan aturan penggunaan AI di sekolah dan mencantumkan bantuan AI secara jujur dalam tugas.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menyajikan tiga situasi singkat dan siswa memberi tanda setuju atau tidak setuju: (1) menggunakan AI untuk mencari ide judul, (2) menyalin esai dari AI, (3) meminta AI memeriksa ejaan.'),
    h2('Konsep: Integritas akademik (15 menit)'),
    p('Integritas akademik berarti bersikap jujur tentang siapa yang mengerjakan sebuah karya. Menggunakan AI tidak selalu salah, tetapi menjadi tidak jujur jika hasil AI diakui sebagai karya sendiri atau jika aturan guru dilanggar.'),
    ul(
      'Ikuti aturan guru untuk setiap tugas: ada tugas yang mengizinkan AI dan ada yang tidak.',
      'Cantumkan bantuan AI, misalnya: "Saya menggunakan AI untuk mencari ide awal dan memeriksa ejaan."',
      'Simpan catatan proses kerja, seperti draf dan catatan pribadi, sebagai bukti pemikiran sendiri.',
    ),
    h2('Kegiatan: Menyusun kesepakatan kelas (30 menit)'),
    p('Dalam kelompok, siswa menyusun usulan aturan penggunaan AI untuk tugas di kelas, lalu kelas menggabungkannya menjadi satu kesepakatan. Setiap siswa berlatih menulis kalimat pencantuman bantuan AI untuk dua contoh tugas.'),
    h2('Refleksi (15 menit)'),
    p('Siswa menuliskan mengapa kejujuran tentang penggunaan AI penting bagi diri sendiri, guru, dan teman sekelas.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah tindakan yang melanggar integritas akademik?', [
      ['Mencantumkan bahwa AI membantu memeriksa ejaan', false],
      ['Mengumpulkan esai buatan AI sebagai karya sendiri', true],
      ['Meminta AI menjelaskan materi yang belum dipahami', false],
      ['Bertanya kepada guru apakah AI boleh digunakan', false],
    ], 'Mengakui karya AI sebagai karya sendiri adalah bentuk ketidakjujuran akademik.'),
    q('Guru tidak menjelaskan apakah AI boleh digunakan untuk sebuah tugas. Apa yang sebaiknya dilakukan?', [
      ['Menggunakan AI sebanyak mungkin', false],
      ['Bertanya kepada guru sebelum menggunakan AI', true],
      ['Menggunakan AI diam-diam', false],
      ['Tidak mengerjakan tugas', false],
    ], 'Jika aturan belum jelas, tanyakan terlebih dahulu kepada guru.'),
    q('Manakah contoh pencantuman bantuan AI yang baik?', [
      ['Tidak menyebutkan apa pun', false],
      ['"Saya menggunakan AI untuk mendapatkan tiga ide judul; isi tulisan saya kerjakan sendiri."', true],
      ['"Semua ini karya saya" padahal dibantu AI', false],
      ['"AI" tanpa keterangan apa pun', false],
    ], 'Pencantuman yang baik menyebutkan dengan jelas bagian mana yang dibantu AI dan bagian mana yang dikerjakan sendiri.'),
  ],
}

/** SMP session 17 · THR-3 (+THR-1, THR-2) · designing an AI-for-good idea. */
export const SMP_17 = {
  track: TRACK,
  order: 17,
  objective:
    'Siswa dapat merancang gagasan AI sederhana untuk masalah di sekolah atau lingkungannya, termasuk data yang dibutuhkan, peran manusia, dan aturan keselamatan.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan contoh penggunaan AI untuk kebaikan di Indonesia, seperti peringatan dini banjir, deteksi penyakit tanaman, dan pemeriksaan kesehatan. Siswa diminta menyebutkan masalah di sekolah atau lingkungan mereka yang mungkin dapat dibantu AI.'),
    h2('Konsep: Merancang dengan bertanggung jawab (15 menit)'),
    p('Rancangan AI yang baik tidak hanya menjelaskan apa yang dapat dilakukan AI, tetapi juga peran manusia dan cara menjaga keselamatan. Setiap rancangan menjawab empat pertanyaan:'),
    ul(
      'Masalah: masalah nyata apa yang ingin diselesaikan dan siapa yang terdampak?',
      'Data: data apa yang dibutuhkan, dan apakah data tersebut boleh dikumpulkan?',
      'Peran manusia: keputusan apa yang tetap diambil oleh manusia?',
      'Aturan keselamatan: bagaimana melindungi data pribadi dan mencegah ketidakadilan?',
    ),
    h2('Kegiatan: Rancangan kelompok (30 menit)'),
    p('Dalam kelompok berempat, siswa memilih satu masalah dan mengisi lembar rancangan dengan empat pertanyaan di atas, lalu membuat sketsa sederhana tentang cara kerja gagasan mereka. Contoh masalah: pemilahan sampah di kantin, pengingat jadwal piket, atau informasi perpustakaan sekolah.'),
    h2('Refleksi (15 menit)'),
    p('Setiap kelompok bertukar rancangan dengan kelompok lain dan memberikan satu masukan tentang data atau aturan keselamatan.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Sebuah kelompok merancang AI untuk mencatat kehadiran siswa dengan foto wajah. Pertanyaan apa yang paling penting dijawab terlebih dahulu?', [
      ['Warna aplikasi yang akan digunakan', false],
      ['Bagaimana data wajah dilindungi dan apakah siswa serta orang tua menyetujuinya', true],
      ['Berapa banyak siswa yang menyukai foto', false],
      ['Apakah aplikasinya bisa memutar musik', false],
    ], 'Foto wajah termasuk data biometrik yang bersifat spesifik. Perlindungan dan persetujuan harus dipikirkan sebelum hal lain.'),
    q('Mengapa rancangan AI perlu menyebutkan peran manusia?', [
      ['Agar AI dapat bekerja lebih cepat', false],
      ['Agar keputusan penting tetap dapat diperiksa dan dipertanggungjawabkan oleh manusia', true],
      ['Karena AI tidak bisa dinyalakan tanpa manusia', false],
      ['Agar rancangan terlihat lebih panjang', false],
    ], 'Manusia tetap bertanggung jawab atas keputusan penting dan dapat memperbaiki kesalahan AI.'),
    q('Manakah contoh aturan keselamatan yang baik untuk aplikasi pemilah sampah di kantin?', [
      ['Merekam wajah semua siswa yang membuang sampah', false],
      ['Kamera hanya memotret sampah dan tidak menyimpan gambar orang', true],
      ['Membagikan foto siswa ke media sosial', false],
      ['Tidak perlu aturan apa pun', false],
    ], 'Aturan yang baik membatasi data yang dikumpulkan hanya pada yang dibutuhkan.'),
  ],
}

/** SMP session 18 · THR-3 · presentations and end-of-track check. */
export const SMP_18 = {
  track: TRACK,
  order: 18,
  objective:
    'Siswa dapat mempresentasikan rancangan AI untuk kebaikan dan mengerjakan tes akhir untuk menunjukkan kemajuan belajar.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru membacakan kembali beberapa pertanyaan dan kekhawatiran yang ditulis siswa pada sesi pertama. Kelas membahas mana yang sudah terjawab.'),
    h2('Presentasi rancangan (25 menit)'),
    p('Setiap kelompok mempresentasikan rancangannya selama tiga menit, menjelaskan masalah, data, peran manusia, dan aturan keselamatan. Kelompok lain memberikan satu pertanyaan atau masukan.'),
    h2('Tes akhir (30 menit)'),
    p('Siswa mengerjakan tes akhir secara mandiri. Soalnya setara dengan tes awal sehingga hasilnya dapat dibandingkan untuk melihat kemajuan belajar.'),
    h2('Refleksi penutup (15 menit)'),
    p('Siswa menuliskan tiga hal yang paling berguna dari program ini dan satu cara mereka akan menggunakan AI secara bertanggung jawab ke depannya.'),
    ul(
      'Apa yang paling mengejutkan dari cara kerja AI?',
      'Aturan apa tentang data pribadi yang akan terus saya ikuti?',
      'Bagaimana saya akan menggunakan AI untuk belajar dengan jujur?',
    ),
  ),
  quiz: [
    q('Sebelum mempercayai jawaban AI tentang fakta penting, apa yang sebaiknya dilakukan?', [
      ['Langsung membagikannya', false],
      ['Memeriksanya dengan sumber tepercaya', true],
      ['Menanyakan hal yang sama berulang kali sampai jawabannya berubah', false],
      ['Menganggapnya benar karena terdengar meyakinkan', false],
    ], 'Jawaban AI dapat keliru. Fakta penting perlu diperiksa dengan sumber tepercaya.'),
    q('Mengapa model AI dapat bersikap tidak adil terhadap kelompok tertentu?', [
      ['Karena model memiliki perasaan tidak suka', false],
      ['Karena data latihnya tidak mewakili kelompok tersebut dengan baik', true],
      ['Karena komputer yang digunakan terlalu tua', false],
      ['Karena pengguna mengetik terlalu cepat', false],
    ], 'Ketidakadilan sering berasal dari data latih yang tidak seimbang.'),
    q('Manakah instruksi yang paling jelas untuk meminta bantuan belajar?', [
      ['"Jelaskan."', false],
      ['"Jelaskan pecahan senilai untuk siswa kelas 7 dengan dua contoh sehari-hari."', true],
      ['"Matematika."', false],
      ['"Kerjakan PR saya."', false],
    ], 'Instruksi yang jelas memuat tujuan, konteks, dan bentuk jawaban, serta digunakan untuk memahami, bukan menyalin.'),
    q('Informasi mana yang tetap harus berada di "perisai data" Anda?', [
      ['Pertanyaan tentang sejarah kemerdekaan', false],
      ['Kata sandi akun dan kode OTP', true],
      ['Nama planet di tata surya', false],
      ['Resep makanan favorit', false],
    ], 'Kata sandi dan kode OTP tidak boleh dibagikan kepada siapa pun, termasuk layanan AI.'),
    q('Dalam rancangan AI untuk kebaikan, siapa yang sebaiknya mengambil keputusan akhir yang penting?', [
      ['AI sepenuhnya', false],
      ['Manusia yang bertanggung jawab, dengan bantuan AI', true],
      ['Siapa saja yang kebetulan menggunakan aplikasi', false],
      ['Tidak ada yang perlu memutuskan', false],
    ], 'AI membantu, tetapi keputusan penting tetap menjadi tanggung jawab manusia.'),
  ],
}
