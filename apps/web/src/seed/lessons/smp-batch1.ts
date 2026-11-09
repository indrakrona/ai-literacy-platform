import { doc, h2, p, ul } from '../lexical'

const TRACK = 'smp-ai-untuk-belajar-dan-integritas'
const q = (prompt: string, options: [string, boolean][], explanation: string) => ({
  prompt,
  options: options.map(([text, correct]) => ({ text, correct })),
  explanation,
})

/** SMP session 1 · DIS-1 · diagnostic (one question per AILIS domain). */
export const SMP_01 = {
  track: TRACK,
  order: 1,
  objective:
    'Siswa mengenal tujuan program, menyampaikan pengalaman awal menggunakan AI, dan mengerjakan tes awal untuk mengukur kemampuan dasar.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru memperkenalkan program dan aturan kelas. Siswa menjawab jajak pendapat singkat: "Aplikasi apa yang menurut kalian menggunakan AI?" Jawaban dikumpulkan di papan tulis tanpa dinilai benar atau salah.'),
    h2('Konsep: Apa yang akan kita pelajari? (15 menit)'),
    p('Kecerdasan artifisial (AI) adalah sistem komputer yang dapat melakukan tugas yang biasanya memerlukan kecerdasan manusia, seperti mengenali gambar, memahami bahasa, atau membuat rekomendasi. Selama program ini, siswa mempelajari lima gagasan besar:'),
    ul(
      'Mengenal AI: apa itu AI, di mana kita menemukannya, dan apa batasnya.',
      'Memahami cara kerja AI: data, pola, dan alasan AI dapat keliru.',
      'Berkarya dengan AI: menggunakan AI untuk belajar dan berkarya secara jujur.',
      'Melindungi diri dan sesama: data pribadi, keadilan, dan integritas.',
      'Berkembang bersama AI: menggunakan AI untuk memecahkan masalah nyata.',
    ),
    h2('Kegiatan: Tes awal (30 menit)'),
    p('Siswa mengerjakan tes awal secara mandiri. Tes ini tidak memengaruhi nilai rapor; hasilnya digunakan untuk melihat kemajuan di akhir program.'),
    h2('Refleksi (15 menit)'),
    p('Siswa menuliskan satu hal yang ingin mereka ketahui tentang AI dan satu kekhawatiran tentang penggunaan AI. Guru menyimpan tulisan ini untuk dibahas kembali pada sesi terakhir.'),
    h2('Cek akhir (10 menit)'),
    p('Latihan di bawah ini berisi contoh soal dari setiap gagasan besar.'),
  ),
  quiz: [
    q('Manakah yang paling tepat disebut sistem AI?', [
      ['Kalkulator yang menjumlahkan angka', false],
      ['Aplikasi yang merekomendasikan video berdasarkan tontonan sebelumnya', true],
      ['Jam digital yang menampilkan waktu', false],
      ['Lampu yang menyala ketika saklar ditekan', false],
    ], 'Sistem rekomendasi mempelajari pola dari tontonan Anda untuk memperkirakan video yang mungkin Anda sukai. Kalkulator, jam, dan lampu hanya mengikuti aturan tetap.'),
    q('Sebuah chatbot menyebutkan bahwa ibu kota provinsi Anda adalah kota yang salah. Apa yang sebaiknya dilakukan?', [
      ['Langsung mempercayainya karena AI selalu benar', false],
      ['Memeriksa jawabannya dengan sumber tepercaya seperti buku atau situs resmi', true],
      ['Menyebarkannya ke grup kelas', false],
      ['Mengabaikan semua jawaban AI selamanya', false],
    ], 'AI dapat menghasilkan informasi yang terdengar meyakinkan tetapi keliru. Biasakan memeriksa fakta penting dengan sumber tepercaya.'),
    q('Manakah instruksi (prompt) yang paling jelas?', [
      ['"Buatkan tugas."', false],
      ['"Jelaskan siklus air untuk siswa SMP dalam lima kalimat sederhana."', true],
      ['"Air."', false],
      ['"Tolong bantu."', false],
    ], 'Instruksi yang jelas menyebutkan tujuan, sasaran pembaca, dan bentuk jawaban yang diinginkan.'),
    q('Informasi manakah yang sebaiknya tidak dibagikan kepada layanan AI?', [
      ['Pertanyaan tentang rumus luas lingkaran', false],
      ['Nomor telepon dan alamat rumah', true],
      ['Judul lagu kesukaan', false],
      ['Nama hewan di kebun binatang', false],
    ], 'Nomor telepon dan alamat rumah adalah data pribadi yang dapat digunakan untuk mengenali dan menghubungi Anda.'),
    q('Bagaimana AI dapat membantu menangani banjir?', [
      ['Menghentikan hujan secara langsung', false],
      ['Membantu memperkirakan wilayah yang berisiko banjir dari data curah hujan dan ketinggian air', true],
      ['Menggantikan seluruh petugas penanggulangan bencana', false],
      ['Membuat sungai menjadi lebih lebar', false],
    ], 'AI dapat menganalisis data untuk memberi peringatan dini, tetapi keputusan dan tindakan tetap dilakukan oleh manusia.'),
  ],
}

/** SMP session 3 · DIS-1 · conventional programs vs AI systems. */
export const SMP_03 = {
  track: TRACK,
  order: 3,
  objective: 'Siswa dapat membedakan program komputer biasa dan sistem AI berdasarkan cara keduanya mengambil keputusan.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menunjukkan dua benda: kalkulator dan aplikasi peta di ponsel. Siswa diminta menebak mana yang "belajar" dan mana yang hanya mengikuti perintah.'),
    h2('Konsep: Aturan tetap atau belajar dari data? (15 menit)'),
    p('Program komputer biasa mengikuti aturan yang ditulis oleh pemrogram, misalnya "jika tombol ditekan, nyalakan lampu". Hasilnya selalu sama untuk masukan yang sama. Sistem AI dibuat dengan mempelajari pola dari banyak contoh data, sehingga dapat memperkirakan jawaban untuk situasi baru, misalnya mengenali wajah atau memperkirakan waktu tempuh.'),
    ul(
      'Program biasa: kalkulator, jam alarm, mesin cuci dengan pengaturan waktu, lampu lalu lintas berpengatur waktu.',
      'Sistem AI: filter wajah di kamera, rekomendasi video, penerjemah otomatis, asisten suara, chatbot.',
    ),
    h2('Kegiatan: Memilah kartu (30 menit)'),
    p('Dalam kelompok, siswa memilah kartu berisi benda dan aplikasi sehari-hari ke dalam dua kelompok: "Program biasa" dan "Sistem AI". Setiap kelompok harus menjelaskan alasan pilihannya untuk tiga kartu yang paling sulit.'),
    h2('Refleksi (15 menit)'),
    p('Kelas membahas kartu yang menimbulkan perbedaan pendapat. Guru menekankan bahwa banyak produk menggabungkan keduanya: sebagian bagian mengikuti aturan tetap, sebagian lain menggunakan AI.'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Apa perbedaan utama sistem AI dengan program komputer biasa?', [
      ['Sistem AI selalu lebih mahal', false],
      ['Sistem AI mempelajari pola dari data, sedangkan program biasa hanya mengikuti aturan yang ditulis', true],
      ['Program biasa tidak menggunakan listrik', false],
      ['Sistem AI tidak pernah salah', false],
    ], 'Program biasa memberikan hasil yang sama untuk masukan yang sama karena mengikuti aturan tetap. Sistem AI memperkirakan jawaban berdasarkan pola yang dipelajari dari data.'),
    q('Manakah yang termasuk program biasa?', [
      ['Penerjemah otomatis', false],
      ['Jam alarm yang berbunyi pada pukul 05.00', true],
      ['Filter wajah di kamera', false],
      ['Rekomendasi produk di toko daring', false],
    ], 'Jam alarm berbunyi karena aturan tetap yang diatur pengguna, bukan karena mempelajari pola.'),
    q('Aplikasi peta memperkirakan waktu tempuh berdasarkan kondisi lalu lintas. Mengapa aplikasi ini dapat disebut menggunakan AI?', [
      ['Karena aplikasinya berwarna', false],
      ['Karena memperkirakan waktu dari pola data perjalanan banyak pengguna', true],
      ['Karena dapat dibuka di ponsel', false],
      ['Karena menggunakan peta', false],
    ], 'Perkiraan waktu tempuh dibuat dari pola data lalu lintas, bukan dari satu aturan tetap.'),
  ],
}

/** SMP session 4 · DIS-2 (+DIS-3) · AI in everyday life. */
export const SMP_04 = {
  track: TRACK,
  order: 4,
  objective:
    'Siswa dapat menemukan penggunaan AI pada aplikasi sehari-hari dan menjelaskan hal-hal yang tidak dapat dilakukan AI dengan baik.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru bertanya: "Mengapa video yang muncul di beranda setiap orang berbeda-beda?" Siswa berdiskusi berpasangan selama tiga menit.'),
    h2('Konsep: AI di sekitar kita (15 menit)'),
    p('AI sering bekerja tanpa terlihat. Beberapa contoh yang dekat dengan kehidupan siswa:'),
    ul(
      'Rekomendasi: video, lagu, dan produk yang muncul berdasarkan kebiasaan Anda.',
      'Kamera: filter wajah, pengenalan wajah untuk membuka ponsel, dan penajaman foto.',
      'Peta dan transportasi: perkiraan waktu tempuh dan rute tercepat.',
      'Bahasa: koreksi ejaan, penerjemah otomatis, dan chatbot.',
    ),
    p('AI juga memiliki batas. AI tidak memiliki perasaan, tidak benar-benar peduli, dapat tidak mengetahui kejadian terbaru, dan tidak dapat menggantikan pertimbangan moral manusia.'),
    h2('Kegiatan: Penjelajahan aplikasi (30 menit)'),
    p('Dalam kelompok, siswa memilih tiga aplikasi yang sering digunakan dan mengisi lembar kerja: fitur apa yang menggunakan AI, data apa yang mungkin digunakan, dan apa manfaat serta risikonya.'),
    h2('Refleksi (15 menit)'),
    p('Setiap kelompok menyampaikan satu temuan. Kelas menyusun daftar "Hal yang dapat dibantu AI" dan "Hal yang tetap memerlukan manusia".'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Mengapa beranda video setiap orang dapat berbeda?', [
      ['Karena koneksi internet setiap orang berbeda', false],
      ['Karena sistem rekomendasi mempelajari kebiasaan menonton masing-masing pengguna', true],
      ['Karena videonya dipilih secara acak sepenuhnya', false],
      ['Karena setiap ponsel memiliki aplikasi berbeda', false],
    ], 'Sistem rekomendasi menggunakan data seperti video yang ditonton, disukai, atau dilewati untuk memperkirakan apa yang ingin Anda lihat.'),
    q('Manakah yang tidak dapat dilakukan AI dengan baik?', [
      ['Mengurutkan ribuan foto berdasarkan wajah', false],
      ['Merasakan empati dan peduli kepada teman yang sedang sedih', true],
      ['Menerjemahkan kalimat sederhana', false],
      ['Memperkirakan waktu tempuh perjalanan', false],
    ], 'AI dapat meniru kalimat yang terdengar peduli, tetapi tidak memiliki perasaan. Kepedulian dan empati tetap berasal dari manusia.'),
    q('Data apa yang kemungkinan digunakan filter wajah di kamera?', [
      ['Data cuaca hari ini', false],
      ['Gambar wajah dan posisi bagian-bagian wajah', true],
      ['Nilai rapor pengguna', false],
      ['Daftar kontak di ponsel', false],
    ], 'Filter wajah mengenali posisi mata, hidung, dan mulut dari gambar wajah. Karena itu, foto wajah termasuk data pribadi yang perlu dijaga.'),
  ],
}

/** SMP session 6 · UND-1 · how machines learn from data. */
export const SMP_06 = {
  track: TRACK,
  order: 6,
  objective: 'Siswa dapat menjelaskan bahwa AI belajar dari banyak contoh data dan bahwa jumlah serta keragaman data memengaruhi hasilnya.',
  content: doc(
    h2('Pembuka (10 menit)'),
    p('Guru menunjukkan gambar buah mangga muda, mangga matang, dan mangga busuk. Siswa ditanya: "Bagaimana kalian belajar membedakannya waktu kecil?"'),
    h2('Konsep: Belajar dari contoh (15 menit)'),
    p('Manusia belajar mengenali sesuatu dari banyak contoh. AI belajar dengan cara yang mirip: komputer diberi banyak contoh data beserta labelnya, misalnya foto mangga dengan keterangan "matang" atau "belum matang". Dari contoh-contoh itu, komputer menemukan pola dan membuat model untuk memperkirakan label pada foto baru.'),
    ul(
      'Data latih: contoh yang digunakan untuk belajar.',
      'Model: hasil belajar yang digunakan untuk membuat perkiraan.',
      'Tingkat keyakinan: seberapa yakin model terhadap perkiraannya.',
    ),
    h2('Kegiatan: Simulator pelatih data (30 menit)'),
    p('Siswa menggunakan simulator untuk melatih model mengenali kematangan buah. Mereka mencoba tiga keadaan: sedikit contoh, banyak contoh yang mirip, dan banyak contoh yang beragam, lalu mencatat perubahan tingkat keyakinan model.'),
    h2('Refleksi (15 menit)'),
    p('Kelas membahas: mengapa model dengan contoh yang beragam lebih baik mengenali buah yang belum pernah dilihat? Apa yang terjadi jika semua contoh berasal dari satu jenis mangga saja?'),
    h2('Cek akhir (10 menit)'),
    p('Kerjakan latihan di bawah ini.'),
  ),
  quiz: [
    q('Apa yang dimaksud dengan data latih?', [
      ['Data yang dihapus setelah digunakan', false],
      ['Contoh-contoh yang digunakan komputer untuk mempelajari pola', true],
      ['Jadwal latihan olahraga', false],
      ['Hasil akhir yang ditampilkan kepada pengguna', false],
    ], 'Data latih adalah kumpulan contoh, sering kali beserta labelnya, yang digunakan untuk membentuk model AI.'),
    q('Sebuah model hanya dilatih dengan foto mangga harum manis. Apa yang mungkin terjadi saat model melihat mangga jenis lain?', [
      ['Model pasti mengenalinya dengan benar', false],
      ['Model dapat keliru karena belum pernah mempelajari contoh jenis tersebut', true],
      ['Model akan menolak bekerja', false],
      ['Model langsung belajar sendiri tanpa data', false],
    ], 'Model hanya mengetahui pola dari data yang dipelajarinya. Data yang kurang beragam membuat model mudah keliru pada situasi baru.'),
    q('Bagaimana cara meningkatkan kemampuan model mengenali buah?', [
      ['Mengurangi jumlah contoh', false],
      ['Menambah contoh yang banyak dan beragam dengan label yang benar', true],
      ['Mengganti warna aplikasi', false],
      ['Menggunakan contoh dengan label yang salah', false],
    ], 'Contoh yang banyak, beragam, dan diberi label dengan benar membantu model mengenali pola dengan lebih baik.'),
  ],
}
