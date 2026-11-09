import { doc, h2, p, ul } from '../lexical'
import { q } from './helpers'

const TRACK = 'sma-smk-membangun-dengan-ai'

/** SMA/SMK session 12 · PRO-2 · AI bias in the Indonesian context. */
export const SMA_12 = {
  track: TRACK,
  order: 12,
  objective:
    'Siswa dapat menganalisis bias AI berdasarkan bahasa, daerah, dan gender dalam konteks Indonesia, serta merancang langkah pengaman.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru meminta siswa membayangkan sebuah aplikasi penyaring lamaran kerja yang dilatih dengan data karyawan lama sebuah perusahaan di kota besar. Siswa menebak siapa yang mungkin dirugikan.'),
    h2('Konsep: Bias dalam konteks Indonesia (15 menit)'),
    p('Indonesia memiliki ratusan bahasa daerah, perbedaan akses internet antarwilayah, dan keragaman budaya. Data yang digunakan untuk melatih AI sering kali lebih banyak berasal dari bahasa Inggris, kota besar, atau kelompok tertentu, sehingga AI dapat bekerja kurang baik bagi kelompok lain.'),
    ul(
      'Bahasa: pengenal suara dan penerjemah yang kurang memahami bahasa daerah atau logat tertentu.',
      'Wilayah: data yang lebih banyak berasal dari kota besar dibanding daerah lain.',
      'Gender: pola lama dalam data, misalnya jenis pekerjaan tertentu yang dikaitkan dengan satu gender.',
      'Pengaman: data yang lebih beragam, pengujian per kelompok, pemeriksaan manusia, dan jalur keberatan bagi yang dirugikan.',
    ),
    h2('Kegiatan: Analisis kasus dan rancangan pengaman (40 menit)'),
    p('Kelompok menganalisis satu kasus: penyaring lamaran kerja, penerjemah bahasa daerah, atau aplikasi penilaian kredit. Mereka menjawab: siapa yang terdampak, dari mana bias berasal, bagaimana mengujinya, dan tiga pengaman yang diusulkan. Kelompok juga menguji AI Lab dengan pertanyaan dalam bahasa Indonesia dan satu bahasa daerah untuk membandingkan kualitas jawaban.'),
    h2('Refleksi (15 menit)'),
    p('Kelompok mempresentasikan pengaman yang diusulkan. Kelas membahas peran pemerintah, perusahaan, dan pengguna dalam mencegah bias.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Sebuah penyaring lamaran kerja dilatih dengan data karyawan yang hampir semuanya laki-laki. Risiko yang paling mungkin adalah…', [
      ['Penyaring lebih sering menilai rendah pelamar perempuan', true],
      ['Penyaring bekerja lebih cepat', false],
      ['Penyaring menolak semua pelamar', false],
      ['Tidak ada risiko', false],
    ], 'Model dapat mempelajari pola lama dalam data dan mengulang ketidakadilan tersebut.'),
    q('Manakah langkah pengaman yang paling tepat untuk mengurangi bias?', [
      ['Merahasiakan cara kerja sistem dari semua pihak', false],
      ['Menguji hasil sistem untuk setiap kelompok dan menyediakan pemeriksaan manusia', true],
      ['Menggunakan data yang lebih sedikit', false],
      ['Menghapus semua keluhan pengguna', false],
    ], 'Pengujian per kelompok dan pemeriksaan manusia membantu menemukan dan memperbaiki ketidakadilan.'),
    q('Mengapa AI dapat bekerja kurang baik untuk bahasa daerah?', [
      ['Karena bahasa daerah tidak memiliki tata bahasa', false],
      ['Karena data latih untuk bahasa daerah jauh lebih sedikit dibanding bahasa yang banyak digunakan di internet', true],
      ['Karena penutur bahasa daerah tidak menggunakan ponsel', false],
      ['Karena AI dilarang mempelajari bahasa daerah', false],
    ], 'Jumlah data yang sedikit membuat model kurang belajar pola bahasa tersebut.'),
  ],
}

/** SMA/SMK session 13 · PRO-3 · academic and professional integrity. */
export const SMA_13 = {
  track: TRACK,
  order: 13,
  objective:
    'Siswa dapat menerapkan aturan integritas akademik dan profesional dalam penggunaan AI, serta mengungkapkan penggunaan AI dengan tepat.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menyajikan dua situasi: seorang siswa mengumpulkan esai buatan AI, dan seorang karyawan mengirim laporan ke klien yang berisi data karangan AI. Siswa membahas dampaknya bagi masing-masing pihak.'),
    h2('Konsep: Integritas di sekolah dan dunia kerja (15 menit)'),
    p('Integritas berarti jujur tentang siapa yang mengerjakan sesuatu dan bertanggung jawab atas kebenaran isinya. Di sekolah, aturan penggunaan AI ditentukan oleh guru dan sekolah. Di dunia kerja, perusahaan biasanya memiliki kebijakan tentang data apa yang boleh dimasukkan ke layanan AI dan kapan penggunaan AI harus diungkapkan.'),
    ul(
      'Ikuti aturan setiap tugas atau kebijakan tempat kerja.',
      'Ungkapkan penggunaan AI dengan jelas: alat apa, untuk bagian mana, dan bagaimana hasilnya diperiksa.',
      'Jangan memasukkan data rahasia sekolah, klien, atau perusahaan ke layanan AI tanpa izin.',
      'Tetap bertanggung jawab atas isi: kesalahan AI yang Anda kirimkan menjadi tanggung jawab Anda.',
    ),
    h2('Kegiatan: Menyusun pedoman dan latihan pengungkapan (40 menit)'),
    p('Kelompok menyusun pedoman penggunaan AI untuk tugas sekolah dan untuk satu tempat kerja sesuai minat atau program keahlian. Setiap siswa menulis pernyataan pengungkapan penggunaan AI untuk dua contoh karya: laporan praktikum dan materi promosi.'),
    h2('Refleksi (15 menit)'),
    p('Siswa menuliskan mengapa integritas dalam penggunaan AI penting bagi reputasi pribadi dan kepercayaan orang lain.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Seorang karyawan menggunakan AI untuk membuat laporan, lalu mengirimkannya tanpa memeriksa angka-angkanya. Siapa yang bertanggung jawab jika ada kesalahan?', [
      ['AI', false],
      ['Karyawan yang mengirim laporan', true],
      ['Tidak ada yang bertanggung jawab', false],
      ['Pembaca laporan', false],
    ], 'Orang yang menggunakan dan mengirim hasil AI tetap bertanggung jawab atas kebenaran isinya.'),
    q('Manakah pernyataan pengungkapan penggunaan AI yang paling baik?', [
      ['"Dibuat dengan bantuan."', false],
      ['"Saya menggunakan chatbot AI untuk menyusun kerangka awal dan memeriksa ejaan; data dan analisis saya kerjakan dan periksa sendiri."', true],
      ['Tidak perlu pengungkapan apa pun', false],
      ['"AI menulis semuanya."', false],
    ], 'Pengungkapan yang baik menyebutkan alat, bagian yang dibantu, dan cara hasilnya diperiksa.'),
    q('Mengapa data klien tidak boleh dimasukkan ke layanan AI umum tanpa izin?', [
      ['Karena layanan AI tidak dapat membaca data', false],
      ['Karena data tersebut dapat tersimpan oleh penyedia layanan dan melanggar kerahasiaan klien', true],
      ['Karena klien tidak memiliki data', false],
      ['Karena AI hanya menerima gambar', false],
    ], 'Data yang dimasukkan ke layanan AI dapat disimpan. Membagikannya tanpa izin melanggar kepercayaan dan aturan perlindungan data.'),
  ],
}

/** SMA/SMK session 16 · THR-3 (+THR-1, THR-2) · applied project: problem analysis and build. */
export const SMA_16 = {
  track: TRACK,
  order: 16,
  objective:
    'Siswa dapat menganalisis masalah nyata dari pemberi tugas, menentukan pembagian peran manusia dan AI, menilai risikonya, serta mulai membangun solusi.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Setiap tim menerima lembar tugas dari pemberi tugas nyata, misalnya sekolah, kelompok masyarakat, atau usaha kecil. Siswa SMK menerima tugas sesuai program keahlian. Tim membaca tugas dan menuliskan pertanyaan yang perlu diajukan.'),
    h2('Konsep: Analisis masalah dan pembagian peran (15 menit)'),
    ul(
      'Rumuskan masalah dalam satu kalimat: siapa, apa masalahnya, dan mengapa penting.',
      'Pecah pekerjaan menjadi tugas-tugas kecil, lalu tentukan mana yang dibantu AI dan mana yang dikerjakan manusia.',
      'Nilai manfaat dan risiko: siapa yang diuntungkan, siapa yang mungkin dirugikan, dan data apa yang terlibat.',
      'Tentukan ukuran keberhasilan yang dapat diperiksa.',
    ),
    h2('Kegiatan: Analisis dan pembangunan awal (40 menit)'),
    p('Tim mengisi kanvas proyek berisi rumusan masalah, pembagian tugas manusia dan AI, penilaian risiko, dan ukuran keberhasilan, lalu mulai membangun solusi dengan AI Lab. Tim yang mengikuti versi 12 sesi melanjutkan pembangunan dan pengujian sebagai kerja mandiri sebelum sesi presentasi.'),
    h2('Refleksi (15 menit)'),
    p('Setiap tim menyampaikan rumusan masalah dan satu risiko terbesar beserta cara mengatasinya. Tim lain memberikan masukan.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah rumusan masalah yang paling baik?', [
      ['"Kami ingin membuat aplikasi AI."', false],
      ['"Pemilik warung makan kesulitan membalas pertanyaan menu dan harga di WhatsApp pada jam sibuk, sehingga pelanggan menunggu lama."', true],
      ['"AI itu keren."', false],
      ['"Teknologi untuk semua."', false],
    ], 'Rumusan masalah yang baik menyebutkan siapa yang mengalami masalah, apa masalahnya, dan dampaknya.'),
    q('Dalam proyek chatbot untuk usaha kecil, tugas mana yang sebaiknya tetap dipegang manusia?', [
      ['Menjawab pertanyaan jam buka', false],
      ['Memutuskan pemberian potongan harga khusus atau menangani keluhan', true],
      ['Mengirimkan daftar menu', false],
      ['Menyapa pelanggan', false],
    ], 'Keputusan yang berdampak pada pelanggan dan keuangan usaha sebaiknya tetap diputuskan manusia.'),
    q('Mengapa proyek memerlukan ukuran keberhasilan yang dapat diperiksa?', [
      ['Agar laporan terlihat lebih panjang', false],
      ['Agar tim dan pemberi tugas dapat menilai apakah solusi benar-benar membantu', true],
      ['Karena AI memintanya', false],
      ['Agar proyek selesai lebih cepat', false],
    ], 'Ukuran yang jelas, misalnya waktu tunggu pelanggan berkurang, membuat hasil proyek dapat dievaluasi.'),
  ],
}

/** SMA/SMK session 18 · THR-3 · project presentations and end-of-track check. */
export const SMA_18 = {
  track: TRACK,
  order: 18,
  objective:
    'Siswa dapat mempresentasikan solusi proyek kepada pemberi tugas, menjelaskan peran AI dan keputusan manusia, serta mengerjakan tes akhir.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru membacakan kembali keterampilan yang ingin dikuasai siswa pada sesi pertama. Siswa menilai sendiri kemajuan mereka.'),
    h2('Presentasi proyek (30 menit)'),
    p('Setiap tim mempresentasikan solusi selama empat menit kepada pemberi tugas dan kelas: masalah, solusi, pembagian peran manusia dan AI, risiko dan pengaman, serta hasil uji coba. Pemberi tugas memberikan tanggapan.'),
    h2('Tes akhir (35 menit)'),
    p('Siswa mengerjakan tes akhir secara mandiri. Soalnya setara dengan tes awal sehingga kemajuan belajar dapat dibandingkan. Siswa berusia 15 tahun ke atas yang siap dapat didaftarkan untuk mengikuti tes AILIS.'),
    h2('Refleksi penutup (15 menit)'),
    ul(
      'Keterampilan AI apa yang paling berkembang selama program ini?',
      'Aturan apa tentang data dan integritas yang akan terus saya pegang?',
      'Bagaimana AI akan saya gunakan dalam studi atau pekerjaan saya nanti?',
    ),
  ),
  quiz: [
    q('Sebuah model memiliki akurasi tinggi pada data latih tetapi rendah pada data baru. Apa penjelasan yang paling tepat?', [
      ['Model mengalami overfitting', true],
      ['Data baru selalu salah', false],
      ['Model sudah sempurna', false],
      ['Komputer terlalu lambat', false],
    ], 'Overfitting berarti model terlalu menyesuaikan diri dengan data latih dan tidak menggeneralisasi dengan baik.'),
    q('Anda menemukan foto bencana yang viral. Langkah verifikasi pertama yang paling tepat adalah…', [
      ['Membagikannya agar orang waspada', false],
      ['Menggunakan pencarian gambar terbalik dan memeriksa sumber resmi', true],
      ['Melihat jumlah komentar', false],
      ['Menanyakan kepada teman apakah foto itu asli', false],
    ], 'Pencarian gambar terbalik dan sumber resmi membantu memastikan keaslian dan konteks foto.'),
    q('Manakah instruksi yang paling efektif untuk meminta AI membantu analisis data penjualan?', [
      ['"Analisis."', false],
      ['"Sebagai analis bisnis, ringkas tren penjualan bulanan dari tabel berikut dalam lima poin dan sebutkan bulan dengan penurunan terbesar."', true],
      ['"Data penjualan."', false],
      ['"Buat laporan bagus."', false],
    ], 'Instruksi tersebut memuat peran, tujuan, bentuk hasil, dan hal spesifik yang dicari.'),
    q('Perusahaan melarang memasukkan data klien ke layanan AI umum. Apa yang sebaiknya Anda lakukan saat memerlukan bantuan AI?', [
      ['Tetap memasukkan data klien secara diam-diam', false],
      ['Menggunakan data contoh atau data yang sudah disamarkan, sesuai kebijakan perusahaan', true],
      ['Membagikan data ke teman agar dia yang memasukkan', false],
      ['Tidak mengerjakan tugas', false],
    ], 'Kebijakan perusahaan harus diikuti. Data yang disamarkan atau data contoh dapat digunakan tanpa melanggar kerahasiaan.'),
    q('Dalam proyek AI untuk masyarakat, mengapa perlu ada jalur keberatan bagi pengguna?', [
      ['Agar proyek terlihat resmi', false],
      ['Agar orang yang dirugikan oleh keputusan sistem dapat meminta pemeriksaan ulang oleh manusia', true],
      ['Karena AI tidak dapat membuat keputusan', false],
      ['Agar pengguna tidak menggunakan sistem', false],
    ], 'Jalur keberatan memastikan kesalahan AI dapat diperbaiki dan keputusan dapat dipertanggungjawabkan.'),
  ],
}
