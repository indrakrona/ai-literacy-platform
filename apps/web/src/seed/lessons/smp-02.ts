import { doc, h2, p, ul } from '../lexical'

/** SMP session 2 · PRO-1 · Perlindungan Data Pribadi (sample lesson for review). Bahasa Indonesia; English to follow. */
export const SMP_02 = {
  track: 'smp-ai-untuk-belajar-dan-integritas',
  order: 2,
  objective:
    'Siswa dapat menentukan jenis data pribadi yang tidak boleh dibagikan kepada layanan AI dan menjelaskan alasannya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Pernahkah kalian mengetikkan nama lengkap, alamat, atau foto diri ke dalam aplikasi chatbot?" Siswa menuliskan jawaban singkat di kertas tanpa nama, lalu guru membacakan beberapa jawaban.'),
    h2('Konsep: Apa itu data pribadi? (15 menit)'),
    p('Data pribadi adalah informasi yang dapat digunakan untuk mengenali seseorang, baik secara langsung maupun bila digabungkan dengan informasi lain. Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi mengatur cara data ini harus dijaga.'),
    ul(
      'Data pribadi umum: nama lengkap, alamat rumah, nomor telepon, tanggal lahir, nama sekolah dan kelas, foto wajah.',
      'Data pribadi yang bersifat spesifik: data kesehatan, data biometrik seperti sidik jari dan wajah, data keuangan pribadi, dan data anak.',
      'Data rahasia akun: kata sandi, kode OTP, dan PIN.',
    ),
    p('Layanan AI dapat menyimpan percakapan untuk meningkatkan layanannya. Karena itu, anggaplah semua yang diketikkan ke dalam AI dapat dibaca oleh pihak lain.'),
    h2('Kegiatan: Simulator Perisai Data (30 menit)'),
    p('Siswa membuka simulator dan memilah kartu informasi ke dalam dua kelompok: "Aman dibagikan" dan "Simpan di perisai". Setelah itu, kelompok membandingkan hasil dan membahas kartu yang menimbulkan perbedaan pendapat.'),
    h2('Refleksi (15 menit)'),
    p('Setiap siswa menuliskan tiga aturan pribadi tentang data yang tidak akan dibagikan kepada AI, lalu kelas menyusun ikrar perisai data bersama.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah halaman ini.'),
  ),
  quiz: [
    {
      prompt: 'Manakah pertanyaan berikut yang aman diajukan kepada chatbot AI?',
      options: [
        { text: 'Alamat rumah lengkap untuk mencari rute ke sekolah', correct: false },
        { text: 'Penjelasan tentang proses fotosintesis', correct: true },
        { text: 'Kode OTP yang dikirim oleh bank', correct: false },
        { text: 'Foto kartu pelajar untuk diperiksa', correct: false },
      ],
      explanation:
        'Pertanyaan tentang materi pelajaran tidak memuat data pribadi. Alamat, kode OTP, dan kartu pelajar dapat digunakan untuk mengenali atau menyalahgunakan identitas Anda.',
    },
    {
      prompt: 'Rina ingin AI membantu menulis surat lamaran magang. Apa yang sebaiknya ia lakukan?',
      options: [
        { text: 'Mengetikkan nama lengkap, NIK, dan nomor teleponnya agar surat langsung jadi', correct: false },
        { text: 'Meminta contoh surat dengan data contoh, lalu mengisi data aslinya sendiri', correct: true },
        { text: 'Mengunggah foto KTP orang tuanya', correct: false },
        { text: 'Membagikan kata sandi emailnya agar AI mengirimkan surat', correct: false },
      ],
      explanation: 'Gunakan AI untuk struktur dan bahasa surat, lalu isi data pribadi sendiri di luar layanan AI.',
    },
    {
      prompt: 'Mengapa data kesehatan teman sebaiknya tidak dituliskan kepada AI?',
      options: [
        { text: 'Karena AI tidak memahami istilah kesehatan', correct: false },
        { text: 'Karena data kesehatan termasuk data pribadi yang bersifat spesifik dan merupakan milik teman tersebut', correct: true },
        { text: 'Karena jawaban AI tentang kesehatan selalu salah', correct: false },
        { text: 'Karena data kesehatan tidak penting', correct: false },
      ],
      explanation:
        'Menurut UU Pelindungan Data Pribadi, data kesehatan termasuk data pribadi yang bersifat spesifik. Membagikannya tanpa izin melanggar privasi orang lain.',
    },
    {
      prompt: 'Pernyataan manakah yang paling tepat tentang percakapan dengan layanan AI?',
      options: [
        { text: 'Percakapan langsung terhapus setelah aplikasi ditutup', correct: false },
        { text: 'Percakapan dapat disimpan oleh penyedia layanan', correct: true },
        { text: 'Hanya pengguna yang dapat membaca percakapan', correct: false },
        { text: 'Percakapan dengan AI tidak termasuk data', correct: false },
      ],
      explanation:
        'Banyak layanan menyimpan percakapan. Periksa pengaturan privasi, dan anggaplah apa pun yang diketikkan dapat dibaca pihak lain.',
    },
    {
      prompt: 'Manakah yang termasuk data rahasia akun?',
      options: [
        { text: 'Warna favorit', correct: false },
        { text: 'Kode OTP', correct: true },
        { text: 'Nama mata pelajaran', correct: false },
        { text: 'Judul buku yang sedang dibaca', correct: false },
      ],
      explanation: 'Kode OTP, kata sandi, dan PIN membuka akses ke akun Anda dan tidak boleh dibagikan kepada siapa pun, termasuk AI.',
    },
  ],
}
