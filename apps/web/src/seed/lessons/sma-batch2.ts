import { doc, h2, p, ul } from '../lexical'
import { q } from './helpers'

const TRACK = 'sma-smk-membangun-dengan-ai'

/** SMA/SMK session 7 · UND-2 · tracing the causes of AI errors. */
export const SMA_07 = {
  track: TRACK,
  order: 7,
  objective:
    'Siswa dapat menelusuri penyebab kesalahan AI ke data, rancangan sistem, atau cara penggunaan, lalu mengusulkan perbaikan.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menyajikan tiga berita rekaan tentang kesalahan AI: penerjemah yang salah mengartikan istilah daerah, aplikasi yang salah menilai foto produk, dan chatbot yang memberi saran tidak sesuai usia. Siswa menebak penyebab masing-masing.'),
    h2('Konsep: Tiga sumber kesalahan (15 menit)'),
    ul(
      'Data: data latih kurang, tidak seimbang, usang, atau berlabel salah.',
      'Rancangan: tujuan sistem tidak tepat, misalnya mengejar klik tanpa memperhatikan kualitas, atau tidak ada pemeriksaan keamanan.',
      'Penggunaan: sistem dipakai untuk tujuan yang tidak dirancang, atau pengguna memberi instruksi yang ambigu.',
    ),
    p('Memahami sumber kesalahan penting karena perbaikannya berbeda: kesalahan data diperbaiki dengan data yang lebih baik, kesalahan rancangan dengan mengubah tujuan dan pengaman, dan kesalahan penggunaan dengan aturan serta pelatihan pengguna.'),
    h2('Kegiatan: Investigasi di AI Lab (40 menit)'),
    p('Kelompok menerima tiga kasus. Untuk setiap kasus, mereka mencoba memunculkan kesalahan serupa di AI Lab, mencatat bukti, menentukan sumber kesalahan yang paling mungkin, dan menuliskan satu usulan perbaikan untuk pengembang serta satu untuk pengguna.'),
    h2('Refleksi (15 menit)'),
    p('Kelompok saling menanggapi hasil investigasi. Kelas membahas siapa yang bertanggung jawab ketika AI melakukan kesalahan: pengembang, penyedia layanan, atau pengguna.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Penerjemah otomatis salah mengartikan istilah dari bahasa daerah. Sumber kesalahan yang paling mungkin adalah…', [
      ['Pengguna mengetik terlalu cepat', false],
      ['Data latih hanya sedikit memuat bahasa daerah tersebut', true],
      ['Layar ponsel terlalu kecil', false],
      ['Istilah tersebut tidak memiliki arti', false],
    ], 'Bahasa yang jarang muncul dalam data latih cenderung diterjemahkan dengan kurang tepat.'),
    q('Sebuah aplikasi video dirancang untuk memaksimalkan waktu tonton, sehingga sering merekomendasikan konten sensasional. Ini termasuk kesalahan pada…', [
      ['Data', false],
      ['Rancangan tujuan sistem', true],
      ['Perangkat keras', false],
      ['Koneksi internet', false],
    ], 'Tujuan yang hanya mengejar waktu tonton dapat mendorong rekomendasi yang tidak sehat. Ini masalah rancangan.'),
    q('Seseorang menggunakan chatbot umum untuk menentukan dosis obat. Mengapa ini berisiko?', [
      ['Karena chatbot tidak bisa menulis angka', false],
      ['Karena sistem dipakai untuk tujuan yang memerlukan tenaga kesehatan dan pemeriksaan yang tidak dapat dilakukan chatbot', true],
      ['Karena obat tidak memiliki dosis', false],
      ['Karena chatbot hanya bekerja pada malam hari', false],
    ], 'Menggunakan AI di luar tujuan yang aman adalah kesalahan penggunaan. Keputusan medis memerlukan tenaga kesehatan.'),
  ],
}

/** SMA/SMK session 8 · UND-3 · fact verification and deepfake detection. */
export const SMA_08 = {
  track: TRACK,
  order: 8,
  objective:
    'Siswa dapat menilai keandalan jawaban AI dengan sumber dan bukti, serta mengenali tanda-tanda konten deepfake.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan dua potongan video atau gambar, satu asli dan satu dibuat dengan AI, tanpa memberi tahu yang mana. Siswa memilih dan menjelaskan alasannya.'),
    h2('Konsep: Verifikasi dan deepfake (15 menit)'),
    p('Jawaban AI perlu diperlakukan sebagai draf yang harus diperiksa. Deepfake adalah gambar, video, atau suara yang dibuat atau diubah dengan AI sehingga tampak seperti asli. Deepfake dapat digunakan untuk penipuan, misalnya meniru suara anggota keluarga yang meminta transfer uang.'),
    ul(
      'Periksa sumber: siapa yang membuat informasi ini dan apakah ada sumber resmi yang sama?',
      'Cari pembanding: apakah media atau lembaga tepercaya lain memberitakan hal yang sama?',
      'Amati detail: bentuk tangan, teks di latar, pencahayaan, gerak bibir, dan suara yang tidak wajar.',
      'Gunakan pencarian gambar terbalik untuk menemukan sumber awal sebuah foto.',
      'Untuk permintaan uang lewat suara atau pesan, hubungi orang tersebut melalui nomor yang sudah dikenal.',
    ),
    h2('Kegiatan: Tantangan verifikasi (40 menit)'),
    p('Kelompok mendapat lima klaim: dua dari jawaban AI, dua dari unggahan media sosial, dan satu potongan suara. Mereka memverifikasi setiap klaim dengan langkah di atas, lalu menilai: benar, keliru, atau belum dapat dipastikan, disertai bukti.'),
    h2('Refleksi (15 menit)'),
    p('Kelas menyusun panduan singkat "Cek Sebelum Bagikan" untuk keluarga, termasuk cara menghadapi pesan suara yang mencurigakan.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Anda menerima pesan suara yang terdengar seperti kakak Anda, meminta transfer uang segera. Apa yang sebaiknya dilakukan?', [
      ['Segera mentransfer uang', false],
      ['Menghubungi kakak melalui nomor yang sudah dikenal untuk memastikan', true],
      ['Membalas pesan dengan nomor rekening Anda', false],
      ['Meneruskan pesan ke grup keluarga', false],
    ], 'Suara dapat ditiru dengan AI. Selalu pastikan melalui saluran yang sudah Anda kenal sebelum bertindak.'),
    q('Langkah verifikasi manakah yang paling kuat untuk klaim tentang kebijakan pemerintah?', [
      ['Melihat jumlah suka pada unggahan', false],
      ['Memeriksa situs resmi kementerian atau lembaga terkait', true],
      ['Menanyakan kepada AI apakah klaim itu benar', false],
      ['Mempercayai unggahan yang paling sering dibagikan', false],
    ], 'Sumber resmi adalah rujukan utama untuk informasi kebijakan.'),
    q('Pencarian gambar terbalik berguna untuk…', [
      ['Memperbesar ukuran gambar', false],
      ['Menemukan sumber awal dan konteks asli sebuah foto', true],
      ['Mengubah warna gambar', false],
      ['Membuat gambar baru dengan AI', false],
    ], 'Pencarian gambar terbalik membantu mengetahui kapan dan di mana sebuah foto pertama kali muncul.'),
  ],
}

/** SMA/SMK session 9 · CRE-1 (+CRE-2) · advanced prompting techniques. */
export const SMA_09 = {
  track: TRACK,
  order: 9,
  objective:
    'Siswa dapat merancang instruksi dengan peran, batasan, dan contoh, memperbaikinya secara bertahap, serta menggunakan AI sebagai mitra kerja tanpa menyerahkan proses berpikir.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan dua instruksi untuk tugas yang sama dan hasilnya: satu instruksi pendek dan satu instruksi lengkap. Siswa mendiskusikan apa yang membuat hasil kedua lebih berguna.'),
    h2('Konsep: Teknik instruksi lanjutan (15 menit)'),
    ul(
      'Peran: "Bertindaklah sebagai editor majalah sekolah."',
      'Tujuan dan konteks: apa yang ingin dicapai, untuk siapa, dan dalam situasi apa.',
      'Batasan: panjang, gaya bahasa, hal yang harus dihindari.',
      'Contoh: berikan satu contoh hasil yang diinginkan.',
      'Iterasi: perbaiki instruksi berdasarkan hasil, satu perubahan setiap kali.',
    ),
    p('AI sebagai mitra kerja berarti siswa tetap menentukan tujuan, memeriksa hasil, dan mencatat alasan setiap keputusan. Catatan proses ini menunjukkan pemikiran siswa sendiri.'),
    h2('Kegiatan: Tantangan instruksi antartim (40 menit)'),
    p('Setiap tim menerima tugas yang sama, misalnya menyusun pengumuman acara sekolah untuk tiga sasaran berbeda. Tim memiliki tiga kesempatan memperbaiki instruksi di AI Lab dan wajib mencatat perubahan serta alasannya. Hasil akhir dinilai bersama berdasarkan ketepatan, kejelasan, dan kesesuaian dengan sasaran.'),
    h2('Refleksi (15 menit)'),
    p('Tim membagikan perubahan instruksi yang paling memperbaiki hasil. Kelas menyusun templat instruksi yang dapat dipakai untuk tugas sekolah.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah contoh instruksi yang memuat peran, tujuan, dan batasan?', [
      ['"Tulis pengumuman."', false],
      ['"Sebagai pengurus OSIS, tulis pengumuman lomba kebersihan untuk siswa kelas 10 dalam 80 kata, dengan bahasa formal."', true],
      ['"Lomba kebersihan."', false],
      ['"Tolong buatkan sesuatu yang menarik."', false],
    ], 'Instruksi tersebut menyebutkan peran (pengurus OSIS), tujuan, sasaran, panjang, dan gaya bahasa.'),
    q('Hasil AI hampir sesuai, tetapi gaya bahasanya terlalu santai. Perbaikan terbaik adalah…', [
      ['Menulis ulang seluruh instruksi dari awal', false],
      ['Menambahkan satu batasan: "Gunakan bahasa formal."', true],
      ['Menyerah dan menulis sendiri tanpa AI', false],
      ['Mengulang instruksi yang sama', false],
    ], 'Iterasi yang efektif mengubah satu hal setiap kali sehingga dampaknya terlihat jelas.'),
    q('Mengapa mencatat alasan setiap perubahan instruksi itu penting?', [
      ['Agar AI bekerja lebih cepat', false],
      ['Untuk menunjukkan proses berpikir sendiri dan memudahkan perbaikan berikutnya', true],
      ['Karena diwajibkan oleh aplikasi', false],
      ['Agar hasil AI menjadi lebih panjang', false],
    ], 'Catatan proses menunjukkan peran siswa dalam pekerjaan dan membantu belajar dari setiap percobaan.'),
  ],
}

/** SMA/SMK session 11 · CRE-3 · building a prototype with AI. */
export const SMA_11 = {
  track: TRACK,
  order: 11,
  objective:
    'Siswa dapat membangun prototipe sederhana dengan bantuan AI, seperti chatbot, kampanye, atau alat bantu, dan mendokumentasikan proses serta peran AI di dalamnya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan contoh prototipe karya siswa: chatbot informasi perpustakaan, poster kampanye hemat energi, dan lembar kerja otomatis. Siswa memilih jenis prototipe yang akan dibuat.'),
    h2('Konsep: Dari ide ke prototipe (15 menit)'),
    ul(
      'Tentukan pengguna dan masalah: siapa yang akan menggunakan dan apa yang dibantu?',
      'Rancang alur atau isi utama sebelum menggunakan AI.',
      'Gunakan AI untuk mempercepat pembuatan, lalu periksa dan sesuaikan hasilnya.',
      'Uji dengan satu pengguna dan perbaiki berdasarkan masukan.',
      'Dokumentasikan: bagian apa yang dibuat AI, bagian apa yang dibuat sendiri, dan bagaimana hasilnya diperiksa.',
    ),
    p('Siswa SMK membuat prototipe sesuai program keahlian masing-masing, misalnya asisten informasi tamu untuk perhotelan atau panduan pemeriksaan mesin untuk teknik otomotif.'),
    h2('Kegiatan: Sesi membangun (40 menit)'),
    p('Dalam tim, siswa membangun prototipe menggunakan AI Lab dan alat yang tersedia, lalu menguji prototipe dengan satu anggota tim lain. Setiap tim mengisi lembar dokumentasi proses.'),
    h2('Refleksi (15 menit)'),
    p('Tim mempresentasikan prototipe dalam dua menit dan menjelaskan satu keputusan penting yang mereka ambil sendiri, bukan oleh AI.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Langkah apa yang sebaiknya dilakukan sebelum meminta AI membuat isi prototipe?', [
      ['Langsung meminta AI membuat semuanya', false],
      ['Menentukan pengguna, masalah, dan alur utama prototipe', true],
      ['Memilih warna aplikasi', false],
      ['Mengumpulkan sebanyak mungkin data pribadi pengguna', false],
    ], 'Merancang tujuan dan alur terlebih dahulu membuat penggunaan AI lebih terarah.'),
    q('Mengapa prototipe perlu diuji dengan pengguna?', [
      ['Agar terlihat lebih profesional', false],
      ['Untuk menemukan masalah yang tidak terlihat oleh pembuatnya', true],
      ['Karena AI tidak dapat membuat prototipe', false],
      ['Agar pengguna membayar', false],
    ], 'Pengujian dengan pengguna mengungkap kebingungan dan kekurangan yang perlu diperbaiki.'),
    q('Dokumentasi proses yang baik memuat…', [
      ['Hanya hasil akhir', false],
      ['Bagian yang dibuat AI, bagian yang dibuat sendiri, dan cara hasilnya diperiksa', true],
      ['Kata sandi akun AI', false],
      ['Daftar aplikasi favorit', false],
    ], 'Dokumentasi menunjukkan kejujuran tentang peran AI dan kualitas pemeriksaan yang dilakukan.'),
  ],
}
