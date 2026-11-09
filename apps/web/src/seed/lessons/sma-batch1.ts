import { doc, h2, p, ul } from '../lexical'
import { q } from './helpers'

const TRACK = 'sma-smk-membangun-dengan-ai'

/** SMA/SMK session 1 · DIS-1 · AI and the world of work; diagnostic. */
export const SMA_01 = {
  track: TRACK,
  order: 1,
  objective:
    'Siswa memetakan peran AI dalam bidang pekerjaan yang diminati dan mengerjakan tes awal untuk mengukur kemampuan dasar literasi AI.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Siswa menuliskan satu bidang pekerjaan atau jurusan kuliah yang mereka minati. Guru bertanya: "Bagaimana AI mungkin mengubah pekerjaan tersebut dalam sepuluh tahun ke depan?"'),
    h2('Konsep: AI dan dunia kerja (15 menit)'),
    p('AI sudah digunakan di banyak bidang: kesehatan untuk membantu membaca hasil pemeriksaan, pertanian untuk memantau tanaman, keuangan untuk mendeteksi transaksi mencurigakan, dan pemasaran untuk menganalisis tren. Di sebagian besar bidang, AI mengubah cara kerja dengan mengambil alih tugas tertentu, sementara manusia tetap menentukan tujuan, menilai hasil, dan bertanggung jawab atas keputusan.'),
    ul(
      'Tugas yang cenderung dibantu AI: mengolah data dalam jumlah besar, membuat draf, dan mengenali pola.',
      'Tugas yang tetap memerlukan manusia: menilai konteks, berempati, bernegosiasi, dan mengambil keputusan etis.',
      'Keterampilan yang makin penting: memeriksa hasil AI, menggunakan AI secara efektif, dan menjaga integritas.',
    ),
    h2('Kegiatan: Peta AI di bidang pilihan dan tes awal (40 menit)'),
    p('Selama 15 menit, siswa dalam kelompok sebidang menyusun peta sederhana: tugas apa di bidang tersebut yang dapat dibantu AI dan tugas apa yang tetap dilakukan manusia. Selama 25 menit berikutnya, siswa mengerjakan tes awal secara mandiri. Tes ini tidak memengaruhi nilai rapor.'),
    h2('Refleksi (15 menit)'),
    p('Siswa menuliskan satu keterampilan terkait AI yang ingin mereka kuasai di akhir program. Guru menyimpan tulisan ini untuk sesi terakhir.'),
    h2('Cek akhir (10 menit)'),
    p('Latihan di bawah ini berisi contoh soal dari setiap gagasan besar.'),
  ),
  quiz: [
    q('Manakah yang paling tepat menggambarkan sistem AI generatif?', [
      ['Sistem yang hanya menyimpan data', false],
      ['Sistem yang membuat konten baru, seperti teks atau gambar, berdasarkan pola dari data latih', true],
      ['Sistem yang menghitung dengan rumus tetap', false],
      ['Sistem yang hanya berjalan tanpa listrik', false],
    ], 'AI generatif menghasilkan konten baru dengan memperkirakan pola yang mirip dengan data yang dipelajarinya.'),
    q('Sebuah AI pendeteksi penipuan lebih sering salah menandai transaksi dari daerah tertentu. Apa langkah pertama yang paling tepat?', [
      ['Menghentikan semua transaksi dari daerah tersebut', false],
      ['Memeriksa apakah data latih mewakili transaksi dari daerah tersebut dengan baik', true],
      ['Mengabaikan kesalahan tersebut', false],
      ['Menyalahkan pengguna dari daerah tersebut', false],
    ], 'Kesalahan yang berpola pada kelompok tertentu sering berasal dari data latih yang tidak seimbang.'),
    q('Anda ingin AI membantu menyusun rencana belajar untuk ujian. Instruksi mana yang paling baik?', [
      ['"Buat jadwal."', false],
      ['"Susun jadwal belajar dua minggu untuk ujian Fisika kelas 11, satu jam per hari, dengan latihan soal di akhir setiap minggu."', true],
      ['"Bantu saya."', false],
      ['"Fisika susah."', false],
    ], 'Instruksi yang baik menyebutkan tujuan, konteks, batasan, dan bentuk hasil yang diinginkan.'),
    q('Manakah praktik yang paling tepat untuk melindungi data pribadi saat menggunakan layanan AI?', [
      ['Mengunggah foto KTP agar AI mengisi formulir', false],
      ['Menggunakan data contoh, lalu mengisi data asli sendiri di luar layanan AI', true],
      ['Membagikan kata sandi agar AI dapat masuk ke akun', false],
      ['Menuliskan alamat lengkap untuk setiap pertanyaan', false],
    ], 'Data pribadi asli sebaiknya tidak dimasukkan ke layanan AI kecuali benar-benar diperlukan dan aman.'),
    q('Sebuah UMKM ingin menggunakan AI untuk membalas pertanyaan pelanggan. Keputusan mana yang sebaiknya tetap dipegang manusia?', [
      ['Menyapa pelanggan dengan salam', false],
      ['Menyetujui pengembalian dana atau menangani keluhan yang serius', true],
      ['Memberitahukan jam buka toko', false],
      ['Mengirim daftar harga', false],
    ], 'Keputusan yang berdampak besar bagi pelanggan sebaiknya diperiksa dan diputuskan oleh manusia.'),
  ],
}

/** SMA/SMK session 2 · PRO-1 · digital footprint and personal data protection. */
export const SMA_02 = {
  track: TRACK,
  order: 2,
  objective:
    'Siswa dapat menilai data apa saja yang dikumpulkan aplikasi dan layanan AI, serta menetapkan aturan pribadi untuk melindungi data dan jejak digitalnya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Jika seseorang mengumpulkan semua unggahan, pencarian, dan percakapan Anda selama setahun, apa yang dapat ia ketahui tentang Anda?" Siswa menuliskan tiga jawaban.'),
    h2('Konsep: Jejak digital dan data pribadi (15 menit)'),
    p('Jejak digital adalah rekaman aktivitas daring, baik yang sengaja dibagikan seperti unggahan maupun yang terkumpul secara otomatis seperti lokasi, riwayat pencarian, dan percakapan dengan layanan AI. Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi memberi pemilik data hak, antara lain untuk mengetahui penggunaan datanya, meminta salinan, dan meminta penghapusan.'),
    ul(
      'Data pribadi umum: nama, alamat, nomor telepon, tanggal lahir, foto.',
      'Data pribadi spesifik: kesehatan, biometrik, keuangan pribadi, data anak.',
      'Data yang sering terlupakan: lokasi, kontak di ponsel, riwayat percakapan dengan chatbot.',
    ),
    h2('Kegiatan: Audit aplikasi dan perisai data (40 menit)'),
    p('Siswa memilih dua aplikasi yang sering digunakan, termasuk satu layanan AI. Mereka memeriksa izin aplikasi di ponsel dan membaca bagian kebijakan privasi tentang data yang dikumpulkan dan disimpan. Hasilnya dicatat dalam tabel: data yang dikumpulkan, alasan yang disebutkan, dan pengaturan yang dapat diubah. Setelah itu, siswa memakai simulator perisai data untuk menguji keputusan berbagi informasi.'),
    h2('Refleksi (15 menit)'),
    p('Setiap siswa menuliskan lima aturan pribadi tentang data yang tidak akan dibagikan kepada layanan AI dan satu pengaturan privasi yang akan diubah hari ini.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah yang termasuk jejak digital yang terkumpul secara otomatis?', [
      ['Foto yang sengaja diunggah ke media sosial', false],
      ['Riwayat lokasi yang direkam aplikasi peta', true],
      ['Surat yang ditulis tangan', false],
      ['Buku catatan di dalam tas', false],
    ], 'Banyak aplikasi merekam data seperti lokasi tanpa unggahan sengaja dari pengguna.'),
    q('Menurut UU Pelindungan Data Pribadi, hak manakah yang dimiliki pemilik data?', [
      ['Hak untuk melihat data pribadi orang lain', false],
      ['Hak untuk meminta penghapusan data pribadinya', true],
      ['Hak untuk menjual data milik teman', false],
      ['Tidak ada hak sama sekali', false],
    ], 'Pemilik data berhak, antara lain, mengetahui penggunaan datanya, meminta salinan, dan meminta penghapusan.'),
    q('Sebuah aplikasi senter meminta izin akses ke kontak dan lokasi. Tindakan yang paling tepat adalah…', [
      ['Memberikan semua izin agar aplikasi berjalan lancar', false],
      ['Menolak izin yang tidak berkaitan dengan fungsi aplikasi atau mencari aplikasi lain', true],
      ['Membagikan aplikasi tersebut ke semua teman', false],
      ['Mengabaikan permintaan izin tanpa membacanya', false],
    ], 'Izin yang diminta harus sesuai dengan fungsi aplikasi. Aplikasi senter tidak memerlukan kontak dan lokasi.'),
  ],
}

/** SMA/SMK session 3 · DIS-1 (+DIS-2, DIS-3) · types of AI systems and how they work. */
export const SMA_03 = {
  track: TRACK,
  order: 3,
  objective:
    'Siswa dapat mengelompokkan sistem AI berdasarkan fungsinya, menjelaskan bagaimana algoritma rekomendasi memengaruhi informasi yang dilihat, dan menyebutkan batas kemampuan AI.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan lima alat digital: kalkulator, filter spam email, rekomendasi video, chatbot, dan penerjemah otomatis. Siswa menebak mana yang menggunakan AI dan apa yang dilakukan masing-masing.'),
    h2('Konsep: Tiga jenis kerja sistem digital (15 menit)'),
    ul(
      'Berbasis aturan: mengikuti instruksi tetap yang ditulis manusia, misalnya kalkulator.',
      'Prediktif: memperkirakan label atau angka dari pola data, misalnya filter spam dan perkiraan harga.',
      'Generatif: membuat konten baru seperti teks, gambar, atau suara, misalnya chatbot dan pembuat gambar.',
    ),
    p('Algoritma rekomendasi termasuk sistem prediktif: ia memperkirakan konten yang akan membuat pengguna terus menonton atau membeli. Akibatnya, pengguna dapat terus melihat konten yang serupa. AI juga memiliki batas: tidak memahami makna seperti manusia, dapat tidak mengetahui kejadian terbaru, dan tidak memiliki tanggung jawab moral.'),
    h2('Kegiatan: Klasifikasi dan analisis linimasa (40 menit)'),
    p('Dalam kelompok, siswa mengelompokkan sepuluh kartu alat digital ke dalam tiga jenis di atas dan menjelaskan alasannya. Setelah itu, siswa membandingkan beranda aplikasi video atau media sosial mereka, mencatat kesamaan konten, dan membahas siapa yang diuntungkan oleh cara kerja rekomendasi tersebut.'),
    h2('Refleksi (15 menit)'),
    p('Kelas membahas: keputusan apa yang tidak boleh diserahkan sepenuhnya kepada AI, dan mengapa? Contoh: penilaian siswa, penerimaan kerja, dan diagnosis kesehatan.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Filter spam email termasuk jenis sistem apa?', [
      ['Berbasis aturan saja', false],
      ['Prediktif, karena memperkirakan apakah sebuah email termasuk spam berdasarkan pola', true],
      ['Generatif, karena membuat email baru', false],
      ['Bukan sistem digital', false],
    ], 'Filter spam memperkirakan label "spam" atau "bukan spam" berdasarkan pola dari banyak contoh email.'),
    q('Mengapa beranda media sosial dapat membuat seseorang terus melihat pendapat yang serupa?', [
      ['Karena semua orang memiliki pendapat yang sama', false],
      ['Karena algoritma rekomendasi mengutamakan konten yang mirip dengan yang sebelumnya disukai', true],
      ['Karena aplikasinya rusak', false],
      ['Karena pengguna tidak dapat mencari konten lain', false],
    ], 'Rekomendasi yang mengikuti kebiasaan pengguna dapat mempersempit ragam informasi yang dilihat.'),
    q('Keputusan manakah yang paling tidak tepat diserahkan sepenuhnya kepada AI?', [
      ['Mengurutkan lagu dalam daftar putar', false],
      ['Menentukan apakah seorang pelamar diterima bekerja', true],
      ['Mengoreksi ejaan dalam draf tulisan', false],
      ['Menyarankan rute perjalanan', false],
    ], 'Keputusan yang berdampak besar pada kehidupan seseorang memerlukan pertimbangan dan tanggung jawab manusia.'),
  ],
}

/** SMA/SMK session 6 · UND-1 · model training and prediction. */
export const SMA_06 = {
  track: TRACK,
  order: 6,
  objective:
    'Siswa dapat menjelaskan proses pelatihan model, perbedaan data latih dan data uji, serta bagaimana kualitas data memengaruhi prediksi.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Jika Anda belajar untuk ujian hanya dengan menghafal jawaban soal latihan, apa yang terjadi saat soal ujiannya berbeda?" Pertanyaan ini menjadi jembatan menuju konsep model yang hanya menghafal data.'),
    h2('Konsep: Pelatihan, pengujian, dan prediksi (15 menit)'),
    ul(
      'Data latih: contoh berlabel yang digunakan model untuk menemukan pola.',
      'Data uji: contoh terpisah yang tidak dilihat saat pelatihan, digunakan untuk mengukur apakah model benar-benar bekerja pada data baru.',
      'Prediksi: perkiraan model untuk data baru, biasanya disertai tingkat keyakinan.',
      'Overfitting: model terlalu menyesuaikan diri dengan data latih sehingga gagal pada data baru, seperti siswa yang hanya menghafal.',
    ),
    p('Kualitas prediksi bergantung pada jumlah, keragaman, dan ketepatan label data. Label yang salah akan diajarkan kepada model sebagai kebenaran.'),
    h2('Kegiatan: Melatih pengklasifikasi sederhana (40 menit)'),
    p('Siswa menggunakan simulator pelatih data untuk melatih model yang membedakan dua jenis objek. Mereka melakukan tiga percobaan: data sedikit, data banyak tetapi seragam, dan data banyak serta beragam, lalu menguji model dengan data uji yang disediakan dan mencatat akurasinya. Percobaan terakhir sengaja memasukkan beberapa label yang salah untuk melihat dampaknya.'),
    h2('Refleksi (15 menit)'),
    p('Kelompok mempresentasikan hasil percobaan dan menjelaskan percobaan mana yang memberikan akurasi terbaik pada data uji, serta alasannya.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Mengapa data uji harus dipisahkan dari data latih?', [
      ['Agar proses pelatihan lebih cepat', false],
      ['Agar dapat diukur apakah model bekerja baik pada data yang belum pernah dilihatnya', true],
      ['Karena data uji tidak penting', false],
      ['Agar model menghafal lebih banyak data', false],
    ], 'Data uji yang terpisah menunjukkan kemampuan model pada situasi baru, bukan sekadar hafalan.'),
    q('Sebuah model mencapai akurasi sangat tinggi pada data latih, tetapi rendah pada data uji. Apa kemungkinan masalahnya?', [
      ['Model mengalami overfitting', true],
      ['Data uji terlalu sedikit warnanya', false],
      ['Komputer terlalu cepat', false],
      ['Model sudah sempurna', false],
    ], 'Overfitting terjadi ketika model terlalu menyesuaikan diri dengan data latih dan gagal menggeneralisasi.'),
    q('Apa dampak label yang salah pada data latih?', [
      ['Tidak ada dampak', false],
      ['Model mempelajari pola yang keliru sehingga prediksinya dapat salah', true],
      ['Model menjadi lebih akurat', false],
      ['Model otomatis memperbaiki labelnya sendiri', false],
    ], 'Model menganggap label sebagai kebenaran. Label yang salah mengajarkan pola yang salah.'),
  ],
}
