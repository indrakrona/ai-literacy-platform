/**
 * AILIS pilot item bank · SMA/SMK level · first draft (state "approved" until piloted).
 * Written to be different from lesson practice questions. To be reviewed by the Head of Assessment.
 */
type Opt = [string, boolean]
export interface ItemSeed {
  code: string
  type: 'single_choice' | 'multiple_choice' | 'scenario_judgment' | 'performance_task'
  competency: string
  difficulty: '1' | '2' | '3'
  scenario?: string
  stem: string
  options?: Opt[]
  rubric?: [number, string][]
}

export const SMA_PILOT_ITEMS: ItemSeed[] = [
  // Understand (DIS)
  { code: 'AIL-SMA-001', type: 'single_choice', competency: 'DIS-1', difficulty: '1', stem: 'Manakah yang paling tepat disebut sistem AI?', options: [['Aplikasi yang menyusun jadwal sesuai urutan yang diketik pengguna', false], ['Aplikasi yang mengenali jenis tanaman dari foto daun', true], ['Penghitung langkah yang menambah angka setiap ada getaran', false], ['Pengingat yang berbunyi setiap pukul 06.00', false]] },
  { code: 'AIL-SMA-002', type: 'single_choice', competency: 'DIS-2', difficulty: '2', stem: 'Mengapa dua orang yang mencari kata yang sama di toko daring dapat melihat urutan produk yang berbeda?', options: [['Karena toko daring menampilkan produk secara acak', false], ['Karena sistem menyesuaikan urutan berdasarkan riwayat dan perilaku masing-masing pengguna', true], ['Karena koneksi internet keduanya berbeda', false], ['Karena salah satu pengguna salah mengetik', false]] },
  { code: 'AIL-SMA-003', type: 'scenario_judgment', competency: 'DIS-3', difficulty: '2', scenario: 'Sekolah ingin menggunakan AI untuk menentukan siswa yang menerima beasiswa berdasarkan nilai dan data keluarga.', stem: 'Pendekatan mana yang paling bertanggung jawab?', options: [['AI menentukan penerima beasiswa tanpa pemeriksaan', false], ['AI membantu menyusun daftar awal, lalu panitia memeriksa dan memutuskan', true], ['Tidak menggunakan data apa pun', false], ['Meminta siswa memilih sendiri penerimanya', false]] },
  { code: 'AIL-SMA-004', type: 'single_choice', competency: 'DIS-3', difficulty: '3', stem: 'Seorang siswa bertanya kepada chatbot tentang hasil pertandingan tadi malam, dan chatbot memberi jawaban yang salah. Penjelasan yang paling mungkin adalah…', options: [['Chatbot sengaja berbohong', false], ['Pengetahuan model dapat terbatas pada data hingga waktu tertentu dan tidak selalu mengetahui kejadian terbaru', true], ['Pertandingan tersebut tidak pernah terjadi', false], ['Chatbot tidak dapat membaca angka', false]] },
  // Evaluate (UND)
  { code: 'AIL-SMA-005', type: 'single_choice', competency: 'UND-1', difficulty: '1', stem: 'Apa fungsi data latih dalam pembuatan model AI?', options: [['Menyimpan hasil akhir untuk pengguna', false], ['Memberikan contoh agar model dapat menemukan pola', true], ['Mempercepat koneksi internet', false], ['Menghapus kesalahan secara otomatis', false]] },
  { code: 'AIL-SMA-006', type: 'scenario_judgment', competency: 'UND-2', difficulty: '2', scenario: 'Aplikasi pendeteksi penyakit kulit bekerja baik pada foto kulit terang, tetapi sering keliru pada kulit gelap.', stem: 'Apa penyebab yang paling mungkin dan perbaikannya?', options: [['Kamera ponsel rusak; ganti ponsel', false], ['Data latih kurang memuat foto kulit gelap; tambahkan data yang beragam dan uji per kelompok', true], ['Pengguna salah memotret; beri tutorial', false], ['Penyakit kulit tidak dapat dideteksi; hentikan aplikasi', false]] },
  { code: 'AIL-SMA-007', type: 'single_choice', competency: 'UND-3', difficulty: '2', stem: 'Chatbot memberikan kutipan dari seorang tokoh, lengkap dengan tahun. Langkah terbaik sebelum menggunakannya dalam tugas adalah…', options: [['Langsung menggunakannya karena ada tahun', false], ['Mencari kutipan tersebut di sumber asli atau sumber tepercaya', true], ['Meminta chatbot mengulang kutipan', false], ['Mengubah sedikit kata agar tidak terlihat dari AI', false]] },
  { code: 'AIL-SMA-008', type: 'multiple_choice', competency: 'UND-3', difficulty: '3', stem: 'Tanda-tanda mana yang dapat menunjukkan sebuah video mungkin deepfake? Pilih semua yang benar.', options: [['Gerak bibir tidak sesuai dengan suara', true], ['Video diunggah oleh akun resmi lembaga yang dapat diverifikasi', false], ['Pencahayaan wajah berbeda dengan latar', true], ['Video muncul di banyak media tepercaya dengan konteks yang sama', false]] },
  // Use & Create (CRE)
  { code: 'AIL-SMA-009', type: 'single_choice', competency: 'CRE-1', difficulty: '1', stem: 'Instruksi mana yang paling mungkin menghasilkan jawaban yang berguna?', options: [['"Sejarah."', false], ['"Ringkas penyebab Perang Diponegoro dalam empat poin untuk siswa kelas 11."', true], ['"Tolong jelaskan semuanya."', false], ['"Buat tugas saya."', false]] },
  { code: 'AIL-SMA-010', type: 'scenario_judgment', competency: 'CRE-1', difficulty: '2', scenario: 'Hasil AI untuk poster kampanye hemat air terlalu formal untuk siswa SMP.', stem: 'Perbaikan instruksi yang paling tepat adalah…', options: [['Mengulang instruksi yang sama', false], ['Menambahkan sasaran dan gaya: "untuk siswa SMP, bahasa santai tetapi sopan, maksimal 30 kata"', true], ['Meminta AI membuat sepuluh poster sekaligus', false], ['Menulis instruksi dalam bahasa lain', false]] },
  { code: 'AIL-SMA-011', type: 'scenario_judgment', competency: 'CRE-2', difficulty: '2', scenario: 'Guru mengizinkan AI untuk mencari ide, tetapi esai harus ditulis sendiri.', stem: 'Tindakan mana yang sesuai aturan?', options: [['Meminta AI menulis esai lalu mengganti beberapa kata', false], ['Meminta AI memberi tiga sudut pandang, lalu menulis esai sendiri dan mencantumkan bantuan AI', true], ['Menyalin esai teman yang dibuat dengan AI', false], ['Meminta AI menulis esai dan tidak memberi tahu guru', false]] },
  { code: 'AIL-SMA-012', type: 'single_choice', competency: 'CRE-3', difficulty: '3', stem: 'Dalam proyek membuat chatbot informasi sekolah, bagian mana yang paling penting dikerjakan dan diperiksa oleh siswa sendiri?', options: [['Memilih warna tombol', false], ['Memastikan informasi yang diberikan chatbot benar dan sesuai sumber sekolah', true], ['Menentukan nama chatbot', false], ['Mengganti huruf menjadi tebal', false]] },
  // Protect (PRO)
  { code: 'AIL-SMA-013', type: 'single_choice', competency: 'PRO-1', difficulty: '1', stem: 'Informasi mana yang termasuk data pribadi yang bersifat spesifik menurut UU Pelindungan Data Pribadi?', options: [['Nama sekolah', false], ['Rekam medis', true], ['Warna favorit', false], ['Judul film yang ditonton', false]] },
  { code: 'AIL-SMA-014', type: 'scenario_judgment', competency: 'PRO-1', difficulty: '2', scenario: 'Untuk membuat CV, sebuah situs AI meminta pengguna mengunggah foto KTP.', stem: 'Tindakan mana yang paling aman?', options: [['Mengunggah foto KTP agar CV cepat jadi', false], ['Tidak mengunggah KTP; mengisi data yang diperlukan sendiri atau mencari layanan lain yang tepercaya', true], ['Mengunggah KTP milik orang tua', false], ['Membagikan tautan situs ke teman agar mereka mengunggah KTP', false]] },
  { code: 'AIL-SMA-015', type: 'single_choice', competency: 'PRO-2', difficulty: '3', stem: 'Sebuah AI penilai wawancara kerja memberi skor lebih rendah kepada pelamar yang berbicara dengan logat daerah tertentu. Langkah apa yang paling tepat dilakukan perusahaan?', options: [['Mengabaikan karena AI selalu objektif', false], ['Menghentikan sementara penggunaan, menguji hasil per kelompok, dan memastikan ada penilaian manusia', true], ['Meminta pelamar mengubah logat', false], ['Menambah jumlah pelamar', false]] },
  { code: 'AIL-SMA-016', type: 'scenario_judgment', competency: 'PRO-3', difficulty: '2', scenario: 'Saat magang, Anda diminta merangkum laporan rahasia klien. Perusahaan melarang memasukkan dokumen klien ke layanan AI umum.', stem: 'Apa yang sebaiknya dilakukan?', options: [['Mengunggah laporan ke AI umum agar cepat', false], ['Merangkum sendiri atau menggunakan alat yang disetujui perusahaan', true], ['Mengirim laporan ke teman yang punya akun AI', false], ['Menolak tugas', false]] },
  // Apply (THR)
  { code: 'AIL-SMA-017', type: 'single_choice', competency: 'THR-1', difficulty: '1', stem: 'Dalam layanan pelanggan sebuah toko, tugas mana yang paling cocok dibantu AI?', options: [['Menjawab pertanyaan umum tentang jam buka dan harga', true], ['Memutuskan pengembalian dana untuk keluhan serius', false], ['Menenangkan pelanggan yang sedang marah besar', false], ['Menentukan kebijakan toko', false]] },
  { code: 'AIL-SMA-018', type: 'scenario_judgment', competency: 'THR-2', difficulty: '2', scenario: 'Pemerintah daerah ingin memakai AI untuk memperkirakan wilayah rawan banjir dari data curah hujan dan ketinggian sungai.', stem: 'Pertanyaan evaluasi mana yang paling penting diajukan?', options: [['Apakah warna peta menarik?', false], ['Seberapa akurat perkiraannya di setiap wilayah, dan siapa yang mungkin terlewat jika datanya kurang?', true], ['Berapa jumlah pengikut media sosial pemerintah daerah?', false], ['Apakah AI dapat menghentikan hujan?', false]] },
  { code: 'AIL-SMA-019', type: 'single_choice', competency: 'THR-3', difficulty: '2', stem: 'Ukuran keberhasilan mana yang paling tepat untuk proyek chatbot pemesanan warung makan?', options: [['Chatbot terlihat modern', false], ['Waktu tunggu pelanggan untuk mendapat jawaban berkurang dan pesanan tercatat dengan benar', true], ['Chatbot memiliki nama yang lucu', false], ['Chatbot menggunakan banyak emoji', false]] },
  { code: 'AIL-SMA-020', type: 'scenario_judgment', competency: 'THR-3', difficulty: '3', scenario: 'Tim Anda membuat aplikasi AI untuk membantu petani mengenali penyakit tanaman dari foto.', stem: 'Aturan keselamatan mana yang paling penting dicantumkan?', options: [['Aplikasi mengambil semua foto di galeri pengguna', false], ['Hasil disertai tingkat keyakinan dan saran untuk berkonsultasi dengan penyuluh pertanian bila ragu', true], ['Aplikasi selalu menyatakan tanaman sehat', false], ['Aplikasi tidak memerlukan pengujian', false]] },
  // Performance tasks
  {
    code: 'AIL-SMA-PT1',
    type: 'performance_task',
    competency: 'UND-3',
    difficulty: '2',
    stem: 'Berikut jawaban sebuah chatbot: "Candi Borobudur dibangun pada abad ke-15 oleh Kerajaan Majapahit dan merupakan candi Hindu terbesar di dunia."\n\nTuliskan: (1) bagian mana yang perlu diperiksa, (2) sumber tepercaya apa yang akan Anda gunakan, dan (3) versi jawaban yang sudah diperbaiki menurut pengetahuan Anda.',
    rubric: [
      [0, 'Tidak menemukan kesalahan atau tidak menjawab.'],
      [1, 'Menemukan satu kesalahan tanpa menyebutkan cara memeriksanya.'],
      [2, 'Menemukan sebagian kesalahan dan menyebutkan sumber yang tepat.'],
      [3, 'Menemukan semua kesalahan utama (abad, kerajaan, agama) dan menyebutkan sumber tepercaya.'],
      [4, 'Seperti level 3, ditambah versi jawaban yang diperbaiki dengan tepat dan penjelasan mengapa chatbot dapat keliru.'],
    ],
  },
  {
    code: 'AIL-SMA-PT2',
    type: 'performance_task',
    competency: 'CRE-1',
    difficulty: '3',
    stem: 'Anda diminta membuat pengumuman donor darah sekolah dengan bantuan AI untuk orang tua siswa.\n\nTuliskan instruksi (prompt) yang akan Anda berikan kepada AI, lalu jelaskan: bagian mana dari hasil AI yang akan Anda periksa sendiri sebelum pengumuman dikirim, dan mengapa.',
    rubric: [
      [0, 'Tidak ada instruksi atau tidak relevan.'],
      [1, 'Instruksi hanya memuat tujuan secara umum.'],
      [2, 'Instruksi memuat tujuan dan sasaran pembaca, tetapi tanpa bentuk atau batasan.'],
      [3, 'Instruksi memuat tujuan, sasaran, bentuk, dan batasan yang jelas.'],
      [4, 'Seperti level 3, ditambah rencana pemeriksaan yang tepat (tanggal, tempat, syarat donor, kontak) dan alasannya.'],
    ],
  },
]
