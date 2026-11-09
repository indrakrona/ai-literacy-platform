import { doc, h2, p, ul } from '../lexical'
import { q } from './helpers'

const TRACK = 'sma-smk-membangun-dengan-ai'

/** SMA/SMK session 4 · DIS-2 · recommendation algorithms and social media. */
export const SMA_04 = {
  track: TRACK,
  order: 4,
  objective: 'Siswa dapat menjelaskan cara kerja algoritma rekomendasi, dampaknya terhadap apa yang dilihat pengguna, dan pihak yang diuntungkan.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Siswa membandingkan beranda media sosial atau aplikasi video mereka dengan teman sebangku tanpa membuka akun pribadi di depan kelas, cukup menceritakan jenis konten yang paling sering muncul. Mengapa beranda setiap orang berbeda?'),
    h2('Konsep: Bagaimana rekomendasi dibuat (15 menit)'),
    p('Algoritma rekomendasi memperkirakan konten yang paling mungkin membuat pengguna tetap menonton atau berinteraksi. Sinyal yang dipakai antara lain lama menonton, suka, komentar, bagikan, pencarian, dan kebiasaan pengguna lain yang mirip.'),
    ul(
      'Manfaat: menemukan konten yang relevan, membantu kreator kecil ditemukan.',
      'Risiko: ruang gema (echo chamber) yang hanya menampilkan pandangan serupa, konten sensasional yang lebih cepat menyebar, dan waktu layar berlebihan.',
      'Kepentingan: platform memperoleh pendapatan dari iklan, sehingga perhatian pengguna bernilai ekonomi.',
    ),
    h2('Kegiatan: Membedah beranda (25 menit)'),
    p('Kelompok memilih satu platform dan membuat peta: sinyal apa yang kemungkinan dipakai, apa tujuan platform, siapa yang diuntungkan (pengguna, kreator, pengiklan, platform), dan siapa yang mungkin dirugikan. Kelompok juga menyusun tiga cara pengguna mengendalikan rekomendasi, misalnya fitur "tidak tertarik", mengatur riwayat tontonan, atau sengaja mengikuti sumber yang beragam.'),
    h2('Refleksi (10 menit)'),
    p('Siswa menuliskan satu kebiasaan yang ingin mereka ubah agar beranda mereka lebih beragam dan sehat.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Apa tujuan utama sebagian besar algoritma rekomendasi media sosial?', [
      ['Menampilkan konten secara acak', false],
      ['Memperkirakan konten yang membuat pengguna tetap menonton dan berinteraksi', true],
      ['Memastikan semua informasi benar', false],
      ['Mengurangi waktu layar pengguna', false],
    ], 'Rekomendasi umumnya dioptimalkan untuk keterlibatan, yang terkait dengan pendapatan iklan platform.'),
    q('Seorang siswa hanya menonton video dari satu sudut pandang politik, lalu berandanya dipenuhi konten serupa. Ini disebut apa?', [
      ['Ruang gema (echo chamber)', true],
      ['Enkripsi', false],
      ['Phishing', false],
      ['Kompresi data', false],
    ], 'Ruang gema terjadi ketika pengguna terus melihat pandangan yang sama sehingga sulit menemukan perspektif lain.'),
    q('Manakah cara paling efektif untuk membuat rekomendasi lebih beragam?', [
      ['Menonton semua video sampai habis', false],
      ['Memakai fitur "tidak tertarik", mengelola riwayat, dan sengaja mengikuti sumber yang beragam', true],
      ['Membagikan semua konten yang muncul', false],
      ['Mematikan layar ponsel saja', false],
    ], 'Sinyal yang kamu berikan membentuk rekomendasi. Mengelola sinyal itu membantu beranda lebih seimbang.'),
  ],
}

/** SMA/SMK session 5 · DIS-3 · the limits of AI and human decision-making. */
export const SMA_05 = {
  track: TRACK,
  order: 5,
  objective: 'Siswa dapat menentukan keputusan yang harus tetap menjadi tanggung jawab manusia dan merancang peran pengawasan manusia dalam sistem AI.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru mengajukan dilema: sebuah sekolah ingin memakai AI untuk menilai seluruh esai ujian agar cepat. Siswa memilih sikap setuju, ragu, atau tidak setuju, lalu menyampaikan alasan.'),
    h2('Konsep: Keputusan berisiko tinggi dan pengawasan manusia (15 menit)'),
    p('Semakin besar dampak sebuah keputusan terhadap hidup seseorang, semakin penting peran manusia. Tiga bentuk keterlibatan manusia:'),
    ul(
      'Manusia dalam lingkaran (human-in-the-loop): AI memberi usulan, manusia memutuskan setiap kasus.',
      'Manusia di atas lingkaran (human-on-the-loop): AI memutuskan, manusia mengawasi dan dapat menghentikan.',
      'Manusia di luar lingkaran: AI memutuskan sendiri; hanya cocok untuk keputusan berisiko rendah.',
    ),
    p('Keputusan tentang nilai, penerimaan kerja, kesehatan, dan hukum memerlukan alasan yang dapat dijelaskan, kesempatan untuk mengajukan keberatan, dan pihak yang dapat dimintai pertanggungjawaban.'),
    h2('Kegiatan: Matriks risiko (25 menit)'),
    p('Kelompok menempatkan enam kasus pada matriks dampak (rendah sampai tinggi) dan dapat-tidaknya keputusan dibatalkan: rekomendasi lagu, penilaian esai ujian, penyaringan lamaran kerja, prioritas pasien di IGD, pemblokiran spam, dan persetujuan pinjaman. Untuk setiap kasus, kelompok memilih bentuk keterlibatan manusia dan menuliskan alasannya.'),
    h2('Refleksi (10 menit)'),
    p('Siswa kembali ke dilema pembuka: apakah sikap mereka berubah? Apa syarat minimal agar AI boleh membantu menilai esai?'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Untuk penyaringan lamaran kerja, bentuk keterlibatan manusia mana yang paling tepat?', [
      ['Manusia di luar lingkaran: AI memutuskan sendiri', false],
      ['Manusia dalam lingkaran: AI memberi usulan, manusia memutuskan dan dapat menjelaskan alasannya', true],
      ['Tidak perlu ada manusia sama sekali', false],
      ['AI memutuskan dan hasilnya dirahasiakan', false],
    ], 'Penerimaan kerja berdampak besar pada hidup seseorang, sehingga keputusan akhir harus dapat dijelaskan dan dipertanggungjawabkan manusia.'),
    q('Mengapa pemblokiran spam email boleh dilakukan AI secara otomatis?', [
      ['Karena dampaknya rendah dan pengguna masih dapat memeriksa folder spam', true],
      ['Karena AI tidak pernah salah', false],
      ['Karena email tidak penting', false],
      ['Karena manusia tidak bisa membaca email', false],
    ], 'Keputusan berisiko rendah yang mudah dibatalkan cocok diotomatisasi.'),
    q('Apa syarat penting ketika AI membantu menilai esai ujian?', [
      ['Siswa tidak boleh mengetahui bahwa AI dipakai', false],
      ['Guru meninjau nilai, alasan penilaian dapat dijelaskan, dan siswa dapat mengajukan keberatan', true],
      ['Nilai AI langsung masuk rapor', false],
      ['Esai harus pendek', false],
    ], 'Keterbukaan, peninjauan oleh guru, dan hak mengajukan keberatan menjaga keadilan.'),
  ],
}

/** SMA/SMK session 10 · CRE-2 · AI as a learning and work partner (AI Lab). */
export const SMA_10 = {
  track: TRACK,
  order: 10,
  objective: 'Siswa dapat meneliti sebuah topik dengan bantuan AI sambil mencatat proses berpikirnya sendiri, memeriksa sumber, dan membedakan bantuan AI dari kesimpulan sendiri.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan dua cara mengerjakan tugas: menyalin jawaban AI, atau memakai AI untuk bertanya, membandingkan, dan menyimpulkan sendiri. Siswa menebak mana yang lebih membantu belajar dan mengapa.'),
    h2('Konsep: Jurnal riset bersama AI (10 menit)'),
    p('Memakai AI sebagai mitra belajar berarti AI membantu memahami, bukan menggantikan berpikir. Jurnal riset mencatat:'),
    ul(
      'Pertanyaan yang diajukan dan alasan menanyakannya.',
      'Jawaban AI yang berguna dan bagian yang diragukan.',
      'Sumber tepercaya yang dipakai untuk memeriksa.',
      'Kesimpulan sendiri dengan kata-kata sendiri.',
    ),
    h2('Kegiatan: Riset di AI Lab (35 menit)'),
    p('Siswa memilih satu topik dari mata pelajaran lain yang sedang dipelajari, lalu membuka aktivitas AI Lab "Mitra Riset" dari tombol di bawah. AI berperan sebagai mitra yang bertanya balik dan meminta siswa menjelaskan alasannya. Siswa mengisi jurnal riset selama bekerja.'),
    h2('Refleksi (10 menit)'),
    p('Siswa menandai di jurnalnya satu momen ketika mereka tidak setuju dengan AI atau menemukan kesalahannya, dan bagaimana mereka mengetahuinya.'),
    h2('Cek akhir (5 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah yang menunjukkan AI dipakai sebagai mitra belajar?', [
      ['Menyalin jawaban AI ke tugas tanpa membaca', false],
      ['Bertanya kepada AI, memeriksa jawabannya dengan sumber, lalu menulis kesimpulan sendiri', true],
      ['Meminta AI mengerjakan seluruh ujian', false],
      ['Mengirim jawaban AI ke teman', false],
    ], 'Mitra belajar membantu kamu memahami. Kesimpulan dan tanggung jawab tetap milikmu.'),
    q('AI menyebut sebuah buku sebagai sumber, tetapi kamu tidak dapat menemukan buku itu di mana pun. Apa kemungkinan yang terjadi?', [
      ['Buku itu pasti sangat langka', false],
      ['AI mungkin mengarang sumber (halusinasi), sehingga tidak boleh dikutip sebelum terbukti ada', true],
      ['Perpustakaan sedang tutup', false],
      ['Semua sumber AI selalu benar', false],
    ], 'AI kadang membuat judul atau kutipan yang tidak ada. Selalu pastikan sumber benar-benar ada sebelum mengutipnya.'),
    q('Mengapa jurnal riset penting saat belajar dengan AI?', [
      ['Agar terlihat sibuk', false],
      ['Agar proses berpikir dan pemeriksaan sumber terlihat, serta kamu dapat menjelaskan apa yang kamu pelajari', true],
      ['Karena AI tidak dapat menulis', false],
      ['Agar guru tidak perlu menilai', false],
    ], 'Jurnal menunjukkan pemikiranmu sendiri dan membantu guru serta dirimu melihat apa yang benar-benar dipahami.'),
  ],
}

/** SMA/SMK session 14 · THR-1 · dividing work between humans and AI. */
export const SMA_14 = {
  track: TRACK,
  order: 14,
  objective: 'Siswa dapat memecah sebuah pekerjaan nyata menjadi tugas-tugas, menentukan peran AI dan manusia untuk setiap tugas, serta mengidentifikasi keterampilan yang makin dibutuhkan.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Siswa menyebutkan pekerjaan yang ingin mereka tekuni. Guru memilih dua atau tiga pekerjaan untuk dibahas, termasuk satu yang terkait jurusan SMK di kelas (bila ada).'),
    h2('Konsep: Pekerjaan terdiri atas banyak tugas (15 menit)'),
    p('AI jarang menggantikan seluruh pekerjaan; yang berubah adalah tugas-tugas di dalamnya. Tugas rutin berbasis pola, seperti merangkum, menerjemahkan draf, atau menyusun laporan awal, makin banyak dibantu AI. Tugas yang memerlukan hubungan antarmanusia, pertimbangan etis, keterampilan fisik di lapangan, dan tanggung jawab akhir tetap dikerjakan manusia.'),
    ul(
      'Keterampilan yang makin penting: merumuskan masalah, memeriksa hasil AI, berkomunikasi, bekerja sama, dan belajar alat baru.',
      'Keterampilan teknis jurusan tetap penting, karena manusia harus dapat menilai apakah hasil AI benar.',
    ),
    h2('Kegiatan: Membedah satu pekerjaan (25 menit)'),
    p('Kelompok memilih satu pekerjaan (misalnya staf akuntansi UMKM, teknisi jaringan, juru masak, resepsionis hotel, atau desainer grafis) dan membuat tabel: tugas, frekuensi, dapat dibantu AI atau tidak, risiko jika AI keliru, dan keterampilan manusia yang diperlukan. Bila memungkinkan, kelompok mewawancarai orang yang bekerja di bidang itu melalui pesan singkat.'),
    h2('Refleksi (10 menit)'),
    p('Siswa menuliskan satu keterampilan yang ingin mereka kuatkan dalam setahun ke depan agar siap bekerja bersama AI.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Pernyataan mana yang paling tepat tentang dampak AI pada pekerjaan?', [
      ['AI pasti menggantikan semua pekerjaan dalam waktu dekat', false],
      ['AI lebih sering mengubah tugas-tugas di dalam pekerjaan daripada menggantikan pekerjaan secara utuh', true],
      ['AI tidak berdampak pada pekerjaan apa pun', false],
      ['Hanya pekerjaan kantor yang terdampak', false],
    ], 'Banyak pekerjaan berubah karena sebagian tugasnya dibantu AI, sementara tugas lain tetap memerlukan manusia.'),
    q('Seorang staf akuntansi memakai AI untuk menyusun rekap kas. Apa tugas manusia yang tetap penting?', [
      ['Tidak ada, AI sudah cukup', false],
      ['Memeriksa kebenaran angka, memahami konteks usaha, dan bertanggung jawab atas laporan', true],
      ['Mengetik ulang semua angka secara manual', false],
      ['Menghapus laporan setelah dibuat', false],
    ], 'Kemampuan menilai kebenaran hasil AI memerlukan pengetahuan bidang tersebut.'),
    q('Keterampilan mana yang makin dibutuhkan ketika bekerja bersama AI?', [
      ['Menghafal semua rumus tanpa memahami', false],
      ['Merumuskan masalah dengan jelas dan memeriksa hasil AI', true],
      ['Menghindari semua teknologi baru', false],
      ['Mengetik secepat mungkin', false],
    ], 'Kemampuan merumuskan masalah dan mengevaluasi hasil menentukan kualitas kerja bersama AI.'),
  ],
}

/** SMA/SMK session 15 · THR-2 · evaluating AI solutions (reading). */
export const SMA_15 = {
  track: TRACK,
  order: 15,
  objective: 'Siswa dapat mengevaluasi sebuah produk atau layanan AI dengan kerangka manfaat, risiko, keadilan, privasi, dan akuntabilitas.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan iklan fiktif sebuah aplikasi AI: "Aplikasi kami dapat menebak kepribadian dan masa depan kariermu dari foto wajah, akurasi 99%!" Siswa menuliskan pertanyaan pertama yang muncul di benak mereka.'),
    h2('Konsep: Kerangka evaluasi MANFAAT (15 menit)'),
    p('Sebelum memakai atau merekomendasikan solusi AI, ajukan pertanyaan berikut:'),
    ul(
      'Masalah: masalah nyata apa yang diselesaikan, dan apakah AI memang diperlukan?',
      'Akurasi: bagaimana kinerjanya diukur, oleh siapa, dan pada data siapa?',
      'Nilai bagi pengguna: siapa yang diuntungkan dan siapa yang membayar?',
      'Keadilan: apakah hasilnya sama baik untuk semua kelompok, daerah, dan bahasa?',
      'Privasi: data apa yang dikumpulkan, disimpan di mana, dan apakah ada izin?',
      'Akuntabilitas: siapa yang bertanggung jawab jika keliru, dan bagaimana cara mengajukan keberatan?',
    ),
    p('Klaim yang tidak masuk akal secara ilmiah, seperti menebak kepribadian dari wajah, sebaiknya ditolak walaupun disertai angka akurasi yang tinggi.'),
    h2('Kegiatan: Evaluasi produk (25 menit)'),
    p('Kelompok memilih satu jenis layanan AI yang ada di Indonesia, misalnya chatbot layanan pelanggan, aplikasi belajar, penilaian kredit daring, atau pengenalan wajah untuk absensi. Kelompok mengisi kerangka di atas berdasarkan informasi publik produk itu, lalu memberi rekomendasi: layak dipakai, layak dengan syarat, atau tidak layak.'),
    h2('Refleksi (10 menit)'),
    p('Siswa menuliskan satu pertanyaan yang akan selalu mereka ajukan sebelum mengunggah data pribadi ke aplikasi baru.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Sebuah aplikasi mengaku dapat menebak kepribadian dari foto wajah dengan akurasi 99%. Bagaimana sebaiknya menanggapinya?', [
      ['Langsung mempercayainya karena angkanya tinggi', false],
      ['Meragukannya karena klaim itu tidak memiliki dasar ilmiah yang kuat, dan menanyakan bagaimana akurasi diukur', true],
      ['Mengunggah foto semua teman', false],
      ['Membayar versi premium', false],
    ], 'Angka akurasi tidak berarti apa-apa jika klaimnya tidak masuk akal secara ilmiah atau cara pengukurannya tidak jelas.'),
    q('Pertanyaan mana yang termasuk aspek akuntabilitas?', [
      ['Berapa warna logo aplikasinya?', false],
      ['Siapa yang bertanggung jawab jika AI keliru dan bagaimana cara mengajukan keberatan?', true],
      ['Berapa ukuran berkas aplikasinya?', false],
      ['Apakah aplikasinya populer?', false],
    ], 'Akuntabilitas memastikan ada pihak yang bertanggung jawab dan mekanisme koreksi.'),
    q('Mengapa evaluasi keadilan penting untuk layanan AI di Indonesia?', [
      ['Karena semua pengguna di Indonesia sama', false],
      ['Karena pengguna berbeda bahasa, daerah, dan latar belakang, sehingga kinerja AI bisa tidak merata', true],
      ['Karena keadilan hanya urusan pengadilan', false],
      ['Karena AI tidak memakai data', false],
    ], 'Keberagaman bahasa dan daerah membuat pengujian keadilan sangat penting di Indonesia.'),
  ],
}

/** SMA/SMK session 17 · THR-3 · applied project II: development and testing. */
export const SMA_17 = {
  track: TRACK,
  order: 17,
  objective: 'Siswa membangun dan menguji solusi proyek terapan bersama AI, mengumpulkan umpan balik pengguna, dan memperbaiki solusi berdasarkan hasil uji.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Setiap tim menyampaikan dalam satu menit: masalah yang dipilih pada sesi 16, solusi yang sedang dibangun, dan ukuran keberhasilannya.'),
    h2('Konsep: Menguji sebelum menyerahkan (10 menit)'),
    ul(
      'Uji dengan pengguna nyata, minimal tiga orang dari kelompok sasaran.',
      'Siapkan kasus uji, termasuk kasus "jebakan": pertanyaan di luar topik, data pribadi, atau masukan yang keliru.',
      'Catat apa yang berhasil, apa yang gagal, dan apa yang diperbaiki.',
      'Periksa kembali risiko: privasi, bias, dan kesalahan yang mungkin merugikan pengguna.',
    ),
    h2('Kegiatan: Bangun, uji, perbaiki (40 menit)'),
    p('Tim melanjutkan pembangunan dengan AI Lab, menjalankan uji dengan pengguna atau tim lain, dan mengisi lembar hasil uji. Setiap tim saling menukar solusi dengan tim lain untuk ulasan sejawat memakai rubrik proyek.'),
    h2('Refleksi (10 menit)'),
    p('Tim menuliskan satu perubahan terpenting yang mereka lakukan setelah pengujian, dan alasannya.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini, lalu perbarui kiriman proyek melalui halaman brief.'),
  ),
  quiz: [
    q('Mengapa tim perlu menyiapkan kasus uji "jebakan"?', [
      ['Agar pengujian lebih lama', false],
      ['Untuk melihat apakah solusi tetap aman dan benar saat menerima masukan di luar dugaan', true],
      ['Agar pengguna bingung', false],
      ['Karena diwajibkan oleh AI', false],
    ], 'Pengguna nyata sering memberi masukan yang tidak terduga. Kasus jebakan membantu menemukan kelemahan sebelum dipakai.'),
    q('Apa manfaat ulasan sejawat dalam proyek?', [
      ['Mencari kesalahan untuk menjatuhkan tim lain', false],
      ['Mendapat sudut pandang baru dan menemukan masalah yang tidak terlihat oleh tim sendiri', true],
      ['Mengganti penilaian guru', false],
      ['Menyalin solusi tim lain', false],
    ], 'Ulasan sejawat yang baik memberi masukan konkret berdasarkan rubrik.'),
    q('Saat pengujian, chatbot buatan tim meminta nomor telepon pengguna padahal tidak diperlukan. Apa tindakan yang tepat?', [
      ['Membiarkannya karena data bisa berguna nanti', false],
      ['Mengubah solusi agar tidak meminta data pribadi yang tidak diperlukan', true],
      ['Menyembunyikan temuan itu dari laporan', false],
      ['Meminta lebih banyak data', false],
    ], 'Prinsip data minimum: hanya kumpulkan data yang benar-benar diperlukan.'),
  ],
}
