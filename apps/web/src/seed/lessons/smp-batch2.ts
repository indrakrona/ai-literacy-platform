import { doc, h2, p, ul } from '../lexical'

const TRACK = 'smp-ai-untuk-belajar-dan-integritas'
const q = (prompt: string, options: [string, boolean][], explanation: string) => ({
  prompt,
  options: options.map(([text, correct]) => ({ text, correct })),
  explanation,
})

/** SMP session 7 · UND-2 (+PRO-2) · unbalanced data and fairness. */
export const SMP_07 = {
  track: TRACK,
  order: 7,
  objective:
    'Siswa dapat menunjukkan bagaimana data yang tidak seimbang membuat AI memberikan hasil yang tidak adil, serta mengusulkan cara memperbaikinya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menceritakan sebuah kasus rekaan: sekolah menggunakan aplikasi untuk memilih anggota tim olahraga, tetapi hampir semua yang terpilih berasal dari satu kelas. Siswa diminta menebak penyebabnya.'),
    h2('Konsep: Data yang tidak seimbang (15 menit)'),
    p('AI belajar dari data. Jika data latih lebih banyak berisi satu kelompok, misalnya hanya siswa dari satu kelas, satu jenis kelamin, atau satu daerah, model cenderung memberikan hasil yang lebih baik untuk kelompok tersebut dan mengabaikan kelompok lain. Inilah yang disebut bias data.'),
    ul(
      'Bias dapat muncul karena data yang dikumpulkan tidak mewakili semua kelompok.',
      'Bias dapat merugikan orang yang tidak terwakili dalam data.',
      'Perbaikan dimulai dengan memeriksa siapa saja yang ada dan tidak ada dalam data.',
    ),
    h2('Kegiatan: Simulator robot yang tidak adil (30 menit)'),
    p('Siswa menggunakan simulator yang melatih model dengan data yang tidak seimbang, mengamati hasil pilihannya, lalu menambahkan data yang lebih beragam dan membandingkan hasilnya.'),
    h2('Refleksi (15 menit)'),
    p('Kelas membahas: siapa yang dirugikan oleh model pertama? Data apa yang perlu ditambahkan? Siapa yang sebaiknya memeriksa keadilan sebuah sistem AI sebelum digunakan?'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Apa yang dimaksud dengan bias data?', [
      ['Data yang tersimpan di komputer', false],
      ['Data latih yang tidak mewakili semua kelompok sehingga hasil AI condong ke kelompok tertentu', true],
      ['Data yang sudah dihapus', false],
      ['Data yang berukuran besar', false],
    ], 'Bias data terjadi ketika sebagian kelompok terlalu banyak atau terlalu sedikit terwakili dalam data latih.'),
    q('Aplikasi pengenal suara lebih sering keliru memahami penutur dengan logat daerah tertentu. Apa penyebab yang paling mungkin?', [
      ['Penutur tersebut berbicara terlalu pelan', false],
      ['Data latih hanya sedikit berisi suara dengan logat tersebut', true],
      ['Ponsel penutur rusak', false],
      ['AI sengaja dibuat untuk tidak memahami logat tersebut', false],
    ], 'Jika suatu logat jarang ada dalam data latih, model tidak cukup belajar untuk mengenalinya.'),
    q('Langkah pertama yang paling tepat untuk memperbaiki model yang tidak adil adalah…', [
      ['Menyembunyikan hasilnya', false],
      ['Memeriksa kelompok mana yang kurang terwakili dalam data dan menambahkan contohnya', true],
      ['Menggunakan model tersebut lebih sering', false],
      ['Mengurangi jumlah data', false],
    ], 'Perbaikan dimulai dari data: memeriksa siapa yang belum terwakili, lalu menambahkan contoh yang beragam dan menguji ulang.'),
  ],
}

/** SMP session 8 · UND-3 · spotting and checking false AI information. */
export const SMP_08 = {
  track: TRACK,
  order: 8,
  objective:
    'Siswa dapat mengenali jawaban AI yang keliru atau dikarang dan memeriksanya dengan sumber tepercaya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menampilkan jawaban chatbot yang terdengar meyakinkan tentang sejarah daerah setempat, tetapi memuat satu tahun yang salah. Siswa diminta mencari kesalahannya.'),
    h2('Konsep: Mengapa AI dapat mengarang? (15 menit)'),
    p('Chatbot menyusun jawaban dengan memperkirakan kata-kata yang paling mungkin muncul berikutnya. Karena itu, chatbot dapat menghasilkan kalimat yang lancar dan meyakinkan meskipun isinya keliru. Kesalahan seperti ini sering disebut halusinasi.'),
    ul(
      'Periksa fakta penting: nama, tanggal, angka, dan kutipan.',
      'Bandingkan dengan sumber tepercaya: buku pelajaran, situs resmi pemerintah, atau ensiklopedia.',
      'Waspadai sumber atau tautan yang disebutkan AI, karena dapat saja tidak ada.',
    ),
    h2('Kegiatan: Berburu informasi keliru di AI Lab (30 menit)'),
    p('Dalam kelompok, siswa mengajukan tiga pertanyaan tentang fakta lokal di AI Lab, menandai bagian jawaban yang perlu diperiksa, lalu memverifikasinya dengan sumber yang disediakan guru. Setiap kelompok mencatat jawaban yang benar, keliru, dan tidak dapat dipastikan.'),
    h2('Refleksi (15 menit)'),
    p('Kelas menyusun daftar periksa "Sebelum Mempercayai Jawaban AI" yang ditempel di kelas.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Mengapa chatbot dapat memberikan jawaban yang salah dengan nada yakin?', [
      ['Karena chatbot sengaja berbohong', false],
      ['Karena chatbot menyusun kalimat dari pola kata yang mungkin, bukan dari pemeriksaan fakta', true],
      ['Karena internet sedang lambat', false],
      ['Karena pertanyaannya terlalu pendek', false],
    ], 'Chatbot memperkirakan kata berikutnya berdasarkan pola. Kalimat yang lancar tidak menjamin isinya benar.'),
    q('Chatbot menyebutkan judul buku sebagai sumber, tetapi Anda tidak dapat menemukannya di mana pun. Apa kesimpulan yang tepat?', [
      ['Buku tersebut pasti ada tetapi disembunyikan', false],
      ['Sumber tersebut mungkin dikarang oleh AI, sehingga informasinya perlu diperiksa dari sumber lain', true],
      ['Jawaban AI tetap benar karena menyebutkan sumber', false],
      ['Perpustakaan harus membeli buku tersebut', false],
    ], 'AI dapat menyebutkan sumber yang tidak ada. Gunakan sumber yang dapat Anda temukan dan periksa sendiri.'),
    q('Sumber manakah yang paling tepat untuk memeriksa jumlah penduduk sebuah provinsi?', [
      ['Komentar di media sosial', false],
      ['Publikasi resmi Badan Pusat Statistik', true],
      ['Pesan berantai di grup percakapan', false],
      ['Jawaban AI tanpa sumber', false],
    ], 'Data kependudukan resmi diterbitkan oleh Badan Pusat Statistik (BPS).'),
  ],
}

/** SMP session 10 · CRE-1 · writing clear prompts. */
export const SMP_10 = {
  track: TRACK,
  order: 10,
  objective: 'Siswa dapat menulis instruksi (prompt) yang jelas dengan menyebutkan tujuan, konteks, dan bentuk jawaban.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru berperan sebagai robot yang hanya mengikuti perintah secara harfiah. Siswa memberi instruksi untuk membuat roti selai, dan guru menjalankannya persis seperti yang diucapkan.'),
    h2('Konsep: Tiga unsur instruksi yang jelas (15 menit)'),
    p('AI menjawab berdasarkan instruksi yang diberikan. Instruksi yang kabur menghasilkan jawaban yang kabur. Instruksi yang baik memuat tiga unsur:'),
    ul(
      'Tujuan: apa yang ingin dicapai. Contoh: "Jelaskan proses fotosintesis."',
      'Konteks: untuk siapa dan dalam situasi apa. Contoh: "untuk siswa kelas 8 yang baru mempelajarinya."',
      'Bentuk: seperti apa jawabannya. Contoh: "dalam lima poin singkat dengan satu contoh sehari-hari."',
    ),
    h2('Kegiatan: Latihan ketepatan instruksi (30 menit)'),
    p('Siswa menggunakan simulator robot harfiah untuk membandingkan hasil dari instruksi yang kabur, kurang lengkap, dan jelas. Setelah itu, siswa memperbaiki tiga instruksi kabur yang disediakan guru dengan menambahkan tujuan, konteks, dan bentuk.'),
    h2('Refleksi (15 menit)'),
    p('Siswa berbagi instruksi terbaik mereka dan menjelaskan perubahan yang paling memperbaiki hasil.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah instruksi yang paling lengkap?', [
      ['"Buat ringkasan."', false],
      ['"Ringkas bab tentang sistem pencernaan untuk siswa kelas 8 dalam enam poin singkat."', true],
      ['"Pencernaan."', false],
      ['"Tolong buatkan sesuatu yang bagus."', false],
    ], 'Instruksi tersebut memuat tujuan (meringkas bab), konteks (siswa kelas 8), dan bentuk (enam poin singkat).'),
    q('Jawaban AI terlalu panjang dan sulit dipahami. Apa perbaikan instruksi yang paling tepat?', [
      ['Mengulang instruksi yang sama', false],
      ['Menambahkan bentuk jawaban, misalnya "dalam tiga kalimat sederhana"', true],
      ['Menutup aplikasi', false],
      ['Menulis instruksi dengan huruf kapital semua', false],
    ], 'Menyebutkan bentuk dan panjang jawaban membantu AI menyesuaikan hasilnya.'),
    q('Unsur "konteks" dalam instruksi berarti…', [
      ['Jumlah kata dalam instruksi', false],
      ['Keterangan tentang sasaran pembaca atau situasi penggunaan jawaban', true],
      ['Nama aplikasi AI yang digunakan', false],
      ['Waktu pengiriman instruksi', false],
    ], 'Konteks membantu AI menyesuaikan tingkat kesulitan dan gaya jawaban dengan kebutuhan Anda.'),
  ],
}

/** SMP session 11 · CRE-2 (+CRE-3) · using AI to learn honestly. */
export const SMP_11 = {
  track: TRACK,
  order: 11,
  objective:
    'Siswa dapat menggunakan AI untuk memahami materi pelajaran tanpa menyalin jawaban, dan dapat menunjukkan bagian karya yang merupakan hasil pemikirannya sendiri.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Apa bedanya meminta AI mengerjakan PR dengan meminta AI menjelaskan materi yang belum dipahami?" Siswa berdiskusi berpasangan.'),
    h2('Konsep: AI sebagai teman belajar (15 menit)'),
    p('AI dapat membantu belajar jika digunakan untuk memahami, bukan untuk menggantikan proses berpikir. Beberapa cara yang dianjurkan:'),
    ul(
      'Meminta penjelasan dengan bahasa yang lebih sederhana atau dengan contoh lain.',
      'Meminta soal latihan, lalu mengerjakannya sendiri sebelum memeriksa jawabannya.',
      'Meminta umpan balik atas tulisan sendiri, bukan meminta AI menuliskannya.',
      'Mencatat bagian mana yang dibantu AI dan bagian mana yang merupakan hasil pemikiran sendiri.',
    ),
    h2('Kegiatan: Jelaskan kembali (30 menit)'),
    p('Setiap siswa memilih satu topik yang sulit dari mata pelajaran lain. Di AI Lab, siswa meminta penjelasan dan contoh, lalu menutup AI Lab dan menjelaskan kembali topik tersebut kepada teman sebangku dengan kata-kata sendiri. Teman sebangku memberikan satu pertanyaan untuk menguji pemahaman.'),
    h2('Refleksi (15 menit)'),
    p('Siswa menuliskan perbedaan antara memahami dan menyalin, serta satu cara mereka akan menggunakan AI untuk belajar minggu ini.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Manakah cara menggunakan AI yang mendukung belajar secara jujur?', [
      ['Menyalin jawaban AI untuk tugas esai', false],
      ['Meminta AI menjelaskan materi dengan contoh, lalu mengerjakan soal sendiri', true],
      ['Meminta AI mengerjakan ujian', false],
      ['Mengubah sedikit kata dari jawaban AI lalu mengumpulkannya', false],
    ], 'AI membantu belajar ketika digunakan untuk memahami, sedangkan hasil kerja tetap berasal dari pemikiran siswa.'),
    q('Dimas meminta AI memeriksa tata bahasa esainya. Apa yang sebaiknya ia lakukan berikutnya?', [
      ['Membiarkan AI menulis ulang seluruh esai', false],
      ['Membaca saran AI, memutuskan sendiri perbaikan yang diterima, dan mencatat bantuan AI jika diminta guru', true],
      ['Menghapus esainya', false],
      ['Mengirim esai ke teman untuk disalin', false],
    ], 'Siswa tetap memegang kendali atas karyanya: saran AI ditimbang, bukan diterima begitu saja.'),
    q('Bagaimana cara terbaik memastikan Anda benar-benar memahami penjelasan AI?', [
      ['Membaca penjelasannya sekali', false],
      ['Menjelaskan kembali dengan kata-kata sendiri dan mengerjakan soal latihan tanpa bantuan', true],
      ['Menyimpan penjelasannya di ponsel', false],
      ['Meminta AI mengulang penjelasan yang sama', false],
    ], 'Menjelaskan kembali dan berlatih tanpa bantuan menunjukkan apakah pemahaman benar-benar terbentuk.'),
  ],
}
