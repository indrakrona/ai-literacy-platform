import { doc, h2, p, ul } from '../lexical'
import { q } from './helpers'

const TRACK = 'smp-ai-untuk-belajar-dan-integritas'

/** SMP session 5 · DIS-3 · the limits of AI and the role of humans. */
export const SMP_05 = {
  track: TRACK,
  order: 5,
  objective: 'Siswa dapat menjelaskan tugas yang tetap memerlukan kepedulian, pertimbangan, dan tanggung jawab manusia, serta alasan AI belum dapat menggantikannya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Jika kalian sakit, apakah kalian mau diperiksa hanya oleh aplikasi, tanpa dokter?" Siswa memberikan alasan singkat. Guru mencatat kata kunci yang muncul, misalnya "percaya", "perasaan", dan "tanggung jawab".'),
    h2('Konsep: Apa yang belum bisa dilakukan AI dengan baik? (15 menit)'),
    p('AI pandai menemukan pola dari data yang pernah dipelajarinya. Namun, AI memiliki keterbatasan:'),
    ul(
      'Tidak benar-benar memahami perasaan manusia, walaupun dapat menulis kalimat yang terdengar peduli.',
      'Pengetahuannya bisa ketinggalan zaman, karena hanya mengetahui data sampai waktu tertentu.',
      'Dapat keliru dengan sangat yakin, terutama untuk hal yang jarang ada di datanya.',
      'Tidak dapat dimintai pertanggungjawaban. Yang bertanggung jawab tetap manusia yang memakai dan membuatnya.',
    ),
    p('Karena itu, pada keputusan penting seperti kesehatan, keselamatan, dan nilai sekolah, manusia harus tetap memeriksa dan memutuskan.'),
    h2('Kegiatan: Siapa yang sebaiknya memutuskan? (25 menit)'),
    p('Dalam kelompok, siswa memilah kartu tugas ke dalam tiga kolom: "AI boleh mengerjakan sendiri", "AI membantu, manusia memutuskan", dan "Sebaiknya manusia". Contoh tugas: menerjemahkan menu kantin, menghibur teman yang sedih, memilih pemenang lomba, mengoreksi ejaan, menentukan obat untuk adik yang demam, dan merangkum berita. Setiap kelompok menjelaskan satu kartu yang paling sulit diputuskan.'),
    h2('Refleksi (10 menit)'),
    p('Siswa menulis satu tugas dalam keseharian mereka yang ingin dibantu AI dan satu tugas yang tetap ingin mereka kerjakan sendiri, beserta alasannya.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Mengapa keputusan tentang obat untuk orang sakit sebaiknya tidak diserahkan sepenuhnya kepada AI?', [
      ['Karena AI tidak dapat mengetik', false],
      ['Karena AI dapat keliru dan tidak dapat dimintai pertanggungjawaban, sedangkan kesalahan bisa membahayakan', true],
      ['Karena AI terlalu mahal', false],
      ['Karena obat tidak memiliki nama', false],
    ], 'Pada keputusan yang berisiko tinggi, kesalahan AI dapat membahayakan. Tenaga kesehatan yang memutuskan dan bertanggung jawab.'),
    q('Sebuah chatbot menulis "Aku turut sedih" kepada temanmu yang sedang berduka. Apa yang benar?', [
      ['Chatbot itu benar-benar merasakan kesedihan', false],
      ['Chatbot itu menyusun kalimat dari pola bahasa; dukungan dari orang terdekat tetap penting', true],
      ['Temanmu tidak perlu lagi berbicara dengan siapa pun', false],
      ['Chatbot itu pasti seorang manusia', false],
    ], 'AI dapat meniru bahasa yang peduli, tetapi tidak merasakan emosi. Kehadiran teman, keluarga, dan guru tidak tergantikan.'),
    q('Tugas manakah yang paling cocok dibantu AI?', [
      ['Memutuskan siapa yang harus dihukum di sekolah', false],
      ['Memeriksa ejaan pada karangan sebelum kamu membacanya ulang', true],
      ['Menentukan apakah jembatan aman dilewati tanpa pemeriksaan ahli', false],
      ['Memilih sahabat untukmu', false],
    ], 'Pemeriksaan ejaan berisiko rendah dan kamu tetap membaca ulang hasilnya. Tugas lain menyangkut keadilan, keselamatan, atau hubungan antarmanusia.'),
  ],
}

/** SMP session 9 · UND-3 · recognising AI-generated content. */
export const SMP_09 = {
  track: TRACK,
  order: 9,
  objective: 'Siswa dapat mengenali tanda-tanda gambar, suara, dan tulisan buatan AI, serta menggunakan daftar periksa sebelum memercayai atau membagikan konten.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan beberapa gambar, sebagian foto asli dan sebagian buatan AI (dipilih guru dari sumber edukasi). Siswa menebak mana yang buatan AI dan menjelaskan petunjuk yang mereka lihat.'),
    h2('Konsep: Konten sintetis dan deepfake (15 menit)'),
    p('AI generatif dapat membuat gambar, suara, video, dan tulisan yang tampak nyata. Konten yang meniru wajah atau suara orang sungguhan disebut deepfake. Teknologi ini dapat dipakai untuk berkarya, tetapi juga untuk menipu, misalnya pesan suara palsu yang meminta transfer uang.'),
    p('Tanda yang kadang terlihat, walaupun makin sulit dikenali:'),
    ul(
      'Gambar: jari atau gigi yang janggal, tulisan di latar belakang yang tidak terbaca, bayangan atau pantulan yang tidak masuk akal.',
      'Suara: intonasi datar, napas yang tidak wajar, atau pesan yang mendesak dan meminta rahasia.',
      'Video: gerak bibir yang tidak pas dengan suara, kedipan mata yang aneh.',
      'Semua jenis: tidak ada sumber jelas, dibagikan dengan judul yang memancing emosi.',
    ),
    p('Karena tanda-tanda ini makin sulit dilihat, cara terbaik adalah memeriksa sumbernya, bukan hanya mengandalkan mata.'),
    h2('Kegiatan: Daftar periksa SIAPA (25 menit)'),
    p('Siswa berlatih memakai daftar periksa sederhana pada beberapa contoh konten viral yang disiapkan guru:'),
    ul(
      'S: Sumbernya siapa? Akun resmi atau akun tanpa identitas?',
      'I: Isinya memancing emosi atau meminta sesuatu dengan mendesak?',
      'A: Ada di media atau situs resmi lain?',
      'P: Periksa gambar dengan pencarian gambar terbalik bila memungkinkan.',
      'A: Ajak orang dewasa tepercaya berdiskusi sebelum membagikan atau bertindak.',
    ),
    h2('Refleksi (10 menit)'),
    p('Siswa menuliskan apa yang akan mereka lakukan jika menerima pesan suara yang terdengar seperti anggota keluarga dan meminta pulsa atau uang.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Kamu menerima pesan suara yang terdengar seperti pamanmu, meminta kamu segera mengirim kode OTP. Apa yang sebaiknya dilakukan?', [
      ['Langsung mengirim kode OTP karena suaranya mirip', false],
      ['Tidak mengirim kode, lalu menghubungi paman atau orang tua melalui nomor yang sudah dikenal', true],
      ['Membagikan pesan itu ke grup kelas', false],
      ['Membalas dengan alamat rumah', false],
    ], 'Suara dapat ditiru AI. Kode OTP tidak boleh dibagikan kepada siapa pun. Pastikan melalui jalur lain yang sudah kamu kenal.'),
    q('Mengapa memeriksa sumber lebih dapat diandalkan daripada mencari "jari yang aneh" pada gambar?', [
      ['Karena AI makin pandai sehingga tanda visual makin sulit terlihat', true],
      ['Karena semua gambar asli memiliki jari yang aneh', false],
      ['Karena sumber tidak pernah salah', false],
      ['Karena gambar AI selalu hitam putih', false],
    ], 'Kualitas gambar AI terus meningkat. Asal-usul konten dan konfirmasi dari sumber resmi lebih kuat daripada pengamatan visual saja.'),
    q('Manakah tanda bahaya pada sebuah konten viral?', [
      ['Diterbitkan oleh situs resmi pemerintah', false],
      ['Memakai judul yang memancing marah dan meminta segera disebarkan', true],
      ['Menyertakan tanggal dan nama penulis', false],
      ['Juga diberitakan oleh beberapa media tepercaya', false],
    ], 'Konten yang memancing emosi dan mendesak untuk disebarkan sering menjadi ciri hoaks.'),
  ],
}

/** SMP session 12 · CRE-3 · creating with AI assistance (project). */
export const SMP_12 = {
  track: TRACK,
  order: 12,
  objective: 'Siswa membuat karya pendek (teks atau poster) dengan bantuan AI dan menjelaskan secara jujur bagian yang dibuat AI dan bagian yang dibuat sendiri.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menunjukkan dua poster tentang hemat air: satu dibuat sepenuhnya oleh AI tanpa diperiksa, satu lagi dibuat siswa dengan bantuan AI lalu diperbaiki. Siswa membandingkan: mana yang lebih sesuai dengan sekolah kita?'),
    h2('Konsep: AI sebagai asisten, kamu sebagai pembuat (10 menit)'),
    p('AI dapat membantu mencari gagasan, menyusun kalimat awal, atau membuat sketsa. Namun, karya yang baik tetap memerlukan pilihan dan sentuhan pembuatnya: memeriksa fakta, menyesuaikan dengan pembaca, dan menambahkan pengalaman sendiri. Sikap jujur berarti menyebutkan bagian mana yang dibantu AI.'),
    h2('Kegiatan: Proyek poster kantin sehat (35 menit)'),
    p('Siswa mengerjakan brief proyek "Poster Kampanye Kantin Sehat" yang dapat dibuka dari tombol di bawah. Langkahnya:'),
    ul(
      'Tentukan satu pesan utama dan satu tindakan yang diharapkan dari pembaca.',
      'Gunakan AI untuk mencari tiga gagasan slogan, lalu pilih atau ubah salah satunya.',
      'Periksa satu fakta gizi dengan sumber tepercaya.',
      'Buat poster dan tulis catatan kontribusi: perintah yang dipakai, bagian dari AI, dan bagian buatan sendiri.',
    ),
    h2('Refleksi (10 menit)'),
    p('Siswa menjawab: "Bagian mana dari karyaku yang paling menunjukkan pikiranku sendiri?"'),
    h2('Cek akhir (5 menit)'),
    p('Kerjakan latihan di bawah ini, lalu kirim proyek melalui halaman brief.'),
  ),
  quiz: [
    q('Apa yang dimaksud dengan catatan kontribusi pada proyek ini?', [
      ['Daftar teman yang tidak membantu', false],
      ['Penjelasan jujur tentang perintah AI yang dipakai, bagian dari AI, dan bagian buatan sendiri', true],
      ['Daftar harga makanan di kantin', false],
      ['Tanda tangan orang tua', false],
    ], 'Catatan kontribusi menunjukkan kejujuran akademik dan membantu guru menilai pemikiranmu sendiri.'),
    q('AI memberi slogan "Makan sayur bikin tinggi 10 cm dalam sebulan!" Apa yang sebaiknya dilakukan?', [
      ['Langsung memakainya karena menarik', false],
      ['Tidak memakai klaim itu karena berlebihan dan tidak dapat dibuktikan, lalu menggantinya dengan pesan yang benar', true],
      ['Menambah angkanya menjadi 20 cm', false],
      ['Menghapus semua sayur dari poster', false],
    ], 'Kampanye yang baik harus jujur. Klaim berlebihan dapat menyesatkan pembaca.'),
    q('Manakah cara memakai AI yang paling jujur untuk tugas sekolah?', [
      ['Menyalin hasil AI dan mengakuinya sebagai karya sendiri', false],
      ['Memakai AI untuk mencari gagasan, lalu menulis dan memeriksa sendiri, serta menyebutkan bantuan AI', true],
      ['Meminta teman menyalinkan hasil AI', false],
      ['Tidak mengerjakan tugas', false],
    ], 'Menyebutkan bantuan AI dan tetap berpikir sendiri adalah bentuk integritas.'),
  ],
}

/** SMP session 13 · PRO-2 · bias and fairness in AI decisions. */
export const SMP_13 = {
  track: TRACK,
  order: 13,
  objective: 'Siswa dapat menjelaskan bagaimana data yang tidak seimbang membuat keputusan AI tidak adil, siapa yang dirugikan, dan apa yang dapat diperbaiki.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Bayangkan aplikasi pengenal suara yang hanya dilatih dengan suara orang dari satu daerah. Apa yang terjadi saat dipakai oleh orang dari daerah lain dengan logat berbeda?"'),
    h2('Konsep: Data yang tidak seimbang (15 menit)'),
    p('AI belajar dari contoh. Jika contohnya lebih banyak dari satu kelompok, AI cenderung bekerja lebih baik untuk kelompok itu dan lebih sering keliru untuk kelompok lain. Inilah yang disebut bias. Bias dapat merugikan orang, misalnya ketika AI dipakai untuk menyaring lamaran kerja, memberi pinjaman, atau mengenali wajah.'),
    ul(
      'Penyebab: data latih yang tidak mewakili semua orang, atau data lama yang memuat ketidakadilan masa lalu.',
      'Akibat: sebagian orang lebih sering ditolak, salah dikenali, atau tidak dilayani.',
      'Perbaikan: melengkapi data, menguji AI pada berbagai kelompok, dan memastikan manusia dapat memeriksa keputusan.',
    ),
    h2('Kegiatan: Simulasi data tidak seimbang (20 menit)'),
    p('Siswa memakai simulasi di bawah ini untuk melatih AI dengan data yang tidak seimbang, mengamati kelompok mana yang lebih sering keliru, lalu menyeimbangkan datanya.'),
    h2('Diskusi kasus (10 menit)'),
    p('Kelompok membahas satu kasus: sebuah sistem seleksi beasiswa lebih sering meloloskan siswa dari kota besar karena dilatih dengan data penerima tahun-tahun sebelumnya. Siapa yang dirugikan? Apa yang harus diubah?'),
    h2('Refleksi dan cek akhir (5 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Sebuah AI pengenal wajah lebih sering keliru pada kelompok yang jarang muncul di data latihnya. Apa penyebab utamanya?', [
      ['AI sengaja membenci kelompok itu', false],
      ['Data latihnya tidak seimbang sehingga AI kurang belajar dari kelompok itu', true],
      ['Kamera selalu rusak', false],
      ['Kelompok itu tidak memiliki wajah', false],
    ], 'Bias biasanya muncul dari data yang tidak mewakili semua orang, bukan dari niat AI.'),
    q('Manakah langkah yang paling membantu mengurangi bias?', [
      ['Menghapus semua data', false],
      ['Melengkapi data dari berbagai kelompok dan menguji hasil AI untuk setiap kelompok', true],
      ['Menyembunyikan hasil pengujian', false],
      ['Memakai AI tanpa pemeriksaan', false],
    ], 'Data yang lebih mewakili dan pengujian per kelompok membantu menemukan serta memperbaiki ketidakadilan.'),
    q('Mengapa manusia perlu dapat memeriksa keputusan AI tentang beasiswa?', [
      ['Agar keputusan yang tidak adil dapat ditemukan dan diperbaiki', true],
      ['Agar prosesnya lebih lama', false],
      ['Karena AI tidak bisa membaca angka', false],
      ['Tidak perlu, AI selalu adil', false],
    ], 'Keputusan yang memengaruhi masa depan seseorang harus dapat diperiksa dan dikoreksi oleh manusia.'),
  ],
}

/** SMP session 15 · THR-1 · human–AI collaboration. */
export const SMP_15 = {
  track: TRACK,
  order: 15,
  objective: 'Siswa dapat membagi sebuah tugas sekolah antara manusia dan AI dengan alasan yang jelas, serta menjelaskan pemeriksaan yang dilakukan manusia.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menceritakan panitia pentas seni kelas yang harus membuat undangan, jadwal latihan, dan daftar kebutuhan. Siswa menebak bagian mana yang dapat dibantu AI.'),
    h2('Konsep: Bekerja sama, bukan menyerahkan (10 menit)'),
    p('Kolaborasi manusia dan AI berarti setiap pihak mengerjakan bagian yang paling sesuai. AI cepat menyusun draf, merangkum, dan memberi gagasan. Manusia menentukan tujuan, memeriksa kebenaran, memahami situasi setempat, dan bertanggung jawab atas hasil akhir.'),
    h2('Kegiatan: Rencana kerja panitia (30 menit)'),
    p('Dalam kelompok, siswa membuat tabel untuk acara kelas (misalnya bakti sosial atau pentas seni) dengan kolom: tugas, dikerjakan oleh (AI, manusia, atau keduanya), alasan, dan cara memeriksa. Setiap kelompok minimal memiliki enam tugas, termasuk satu tugas yang sengaja tidak diserahkan kepada AI.'),
    h2('Presentasi singkat (10 menit)'),
    p('Dua kelompok mempresentasikan rencananya. Kelompok lain memberi satu pertanyaan atau saran.'),
    h2('Refleksi dan cek akhir (10 menit)'),
    p('Siswa menulis satu kebiasaan yang akan mereka pakai saat bekerja sama dengan AI. Lalu kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Dalam panitia kelas, bagian mana yang paling tepat tetap dikerjakan manusia?', [
      ['Menyusun draf awal teks undangan', false],
      ['Memutuskan anggaran dan memastikan izin kegiatan dari sekolah', true],
      ['Memberi beberapa gagasan nama acara', false],
      ['Merapikan ejaan jadwal latihan', false],
    ], 'Keputusan anggaran dan izin memerlukan tanggung jawab serta pemahaman aturan sekolah.'),
    q('AI menyusun jadwal latihan, tetapi menaruh latihan pada hari libur nasional. Apa pelajarannya?', [
      ['AI tidak boleh dipakai sama sekali', false],
      ['Hasil AI perlu diperiksa manusia yang mengetahui keadaan sebenarnya', true],
      ['Hari libur sebaiknya dihapus', false],
      ['Jadwal tidak penting', false],
    ], 'AI tidak selalu mengetahui kalender, kebiasaan, atau situasi setempat. Pemeriksaan manusia tetap diperlukan.'),
    q('Apa ciri kolaborasi manusia dan AI yang baik?', [
      ['Semua pekerjaan diserahkan kepada AI', false],
      ['Tugas dibagi sesuai kekuatan masing-masing dan manusia memeriksa hasil akhirnya', true],
      ['Manusia tidak membaca hasil AI', false],
      ['AI yang bertanggung jawab jika ada kesalahan', false],
    ], 'Kolaborasi yang baik memanfaatkan kecepatan AI dan pertimbangan manusia, dengan tanggung jawab tetap pada manusia.'),
  ],
}

/** SMP session 16 · THR-2 · AI for Indonesia (reading). */
export const SMP_16 = {
  track: TRACK,
  order: 16,
  objective: 'Siswa dapat menjelaskan contoh pemanfaatan AI untuk masalah di Indonesia, beserta manfaat, risiko, dan peran manusia di dalamnya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Siswa menyebutkan masalah yang sering terjadi di daerah mereka, misalnya banjir, kemacetan, hama tanaman, atau antrean di puskesmas. Guru menuliskannya di papan.'),
    h2('Bacaan: Tiga contoh pemanfaatan AI (20 menit)'),
    p('Siswa membaca tiga contoh berikut secara berkelompok. Contoh ini menggambarkan cara AI dapat dimanfaatkan; penerapannya di lapangan berbeda-beda di setiap daerah.'),
    ul(
      'Peringatan dini banjir: data curah hujan, ketinggian air sungai, dan prakiraan cuaca dapat diolah untuk memperkirakan wilayah yang berisiko, sehingga warga dapat bersiap lebih awal. Keputusan evakuasi tetap diambil petugas.',
      'Deteksi penyakit tanaman: petani memotret daun yang sakit, lalu aplikasi memperkirakan jenis penyakitnya dan menyarankan penanganan. Penyuluh pertanian membantu memastikan diagnosis.',
      'Skrining kesehatan: AI dapat membantu tenaga kesehatan menandai hasil pemeriksaan, misalnya foto rontgen, yang perlu diperiksa lebih lanjut. Dokter tetap yang menegakkan diagnosis.',
    ),
    h2('Kegiatan: Tabel manfaat dan risiko (20 menit)'),
    p('Setiap kelompok mengisi tabel untuk satu contoh: masalah yang diatasi, data yang dibutuhkan, siapa yang diuntungkan, risiko (misalnya data tidak lengkap di daerah terpencil atau privasi data kesehatan), dan peran manusia.'),
    h2('Refleksi (10 menit)'),
    p('Siswa memilih satu masalah di daerahnya dan menuliskan satu cara AI dapat membantu, serta satu hal yang harus tetap dilakukan manusia. Gagasan ini dapat dikembangkan pada proyek sesi 17.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Dalam sistem peringatan dini banjir, apa peran utama AI?', [
      ['Menghentikan hujan', false],
      ['Mengolah data untuk memperkirakan wilayah berisiko agar warga dan petugas dapat bersiap', true],
      ['Mengevakuasi warga sendirian', false],
      ['Membangun tanggul', false],
    ], 'AI membantu memperkirakan risiko dari data. Tindakan dan keputusan tetap dilakukan manusia.'),
    q('Mengapa AI deteksi penyakit tanaman bisa kurang akurat di suatu daerah?', [
      ['Karena data latihnya mungkin kurang memuat jenis tanaman atau penyakit di daerah itu', true],
      ['Karena petani tidak memiliki tangan', false],
      ['Karena tanaman tidak bisa difoto', false],
      ['Karena AI selalu akurat di mana pun', false],
    ], 'Jika contoh dari daerah tertentu sedikit, AI cenderung lebih sering keliru di sana. Penyuluh membantu memastikan.'),
    q('Data apa yang perlu dijaga sangat hati-hati dalam skrining kesehatan?', [
      ['Warna dinding puskesmas', false],
      ['Data kesehatan pasien karena termasuk data pribadi yang sensitif', true],
      ['Jadwal buka toko', false],
      ['Nama hari dalam seminggu', false],
    ], 'Data kesehatan termasuk data pribadi yang bersifat sensitif dan harus dilindungi.'),
  ],
}
