/** Starter help-centre articles in Bahasa Indonesia and English (spec M1). Existing articles are not overwritten. */
import type { Payload } from 'payload'

type A = { slug: string; category: string; order: number; id: [string, string, string]; en: [string, string, string] }

const ARTICLES: A[] = [
  {
    slug: 'mulai-sebagai-siswa', category: 'getting_started', order: 1,
    id: ['Mulai sebagai siswa', 'Daftar, bergabung ke kelas, dan mulai pelajaran pertama.', 'Ada dua cara mendapatkan akun:\n- Gurumu membuatkan akun dan memberikan kode kelas.\n- Kamu mendaftar sendiri di halaman Daftar, lalu memasukkan kode kelas 6 huruf dari guru di halaman Gabung.\n\nJika umurmu di bawah 18 tahun, kami mengirim permintaan izin ke orang tua atau walimu lewat email atau WhatsApp. Sambil menunggu, kamu sudah bisa membaca materi. AI Lab, proyek dan tes terbuka setelah orang tua memberi izin.\n\nSetelah masuk, buka Beranda lalu tekan Mulai belajar.'],
    en: ['Getting started as a student', 'Sign up, join a class and start your first lesson.', 'There are two ways to get an account:\n- Your teacher creates one and gives you a class code.\n- You sign up yourself on the Sign up page, then enter the 6-letter class code from your teacher on the Join page.\n\nIf you are under 18, we send a permission request to your parent or guardian by email or WhatsApp. While you wait you can already read the lessons. The AI Lab, projects and tests open once your parent says yes.\n\nAfter signing in, open your dashboard and tap Start learning.'],
  },
  {
    slug: 'lupa-kata-sandi', category: 'getting_started', order: 2,
    id: ['Lupa kata sandi', 'Cara mengatur ulang kata sandi.', 'Di halaman Masuk, tekan "Lupa kata sandi?" dan masukkan emailmu. Kami mengirim tautan untuk membuat kata sandi baru; tautan berlaku 1 jam.\n\nAkun dibuat oleh sekolah dan tidak punya email? Kirim tiket bantuan (pilih Akun dan masuk); tim kami akan membuatkan tautan atur ulang.'],
    en: ['Forgot your password', 'How to reset your password.', 'On the Sign in page, tap "Forgot password?" and enter your email. We send a link to set a new password; it works for 1 hour.\n\nAccount created by your school without an email? Send a support ticket (choose Account and sign-in) and our team will create a reset link.'],
  },
  {
    slug: 'ai-lab-aman', category: 'students', order: 1,
    id: ['Bagaimana AI Lab menjaga keamanan', 'Apa yang dilakukan Safety Shield dan siapa yang dapat membaca percakapanmu.', 'AI Lab memakai model AI dengan aturan keamanan khusus remaja. Safety Shield memeriksa setiap pesan sebelum dan sesudah dijawab AI, dan menolak permintaan yang berbahaya atau tidak pantas.\n\nJangan menulis data pribadi seperti alamat rumah, nomor HP, atau nama lengkap teman.\n\nGurumu dapat membaca percakapan AI Lab di kelasnya untuk membantu belajar. Orang tua tidak dapat membaca isinya; mereka hanya melihat jumlah sesi.\n\nAda batas jumlah pesan per hari agar penggunaan tetap wajar.'],
    en: ['How the AI Lab keeps you safe', 'What the Safety Shield does and who can read your chats.', 'The AI Lab uses an AI model with safety rules made for teenagers. The Safety Shield checks every message before and after the AI answers, and refuses harmful or inappropriate requests.\n\nDo not type personal details such as your home address, phone number or a friend’s full name.\n\nYour teacher can read AI Lab chats in their class to help you learn. Parents cannot read them; they only see how many sessions you had.\n\nThere is a daily message limit to keep use reasonable.'],
  },
  {
    slug: 'mengirim-proyek', category: 'students', order: 2,
    id: ['Mengirim proyek', 'Kirim proyek sendiri atau bersama tim, lalu baca umpan balik guru.', 'Buka Proyek, pilih brief, lalu tulis jawabanmu dan tambahkan tautan (misalnya Google Drive atau Canva). Untuk proyek tim, pilih anggota tim dari kelasmu; semua anggota mendapat nilai yang sama.\n\nKamu dapat mengirim ulang sebelum guru menilai. Setelah dinilai, nilai rubrik dan umpan balik muncul di halaman proyek.'],
    en: ['Sending a project', 'Send a project alone or as a team, then read your teacher’s feedback.', 'Open Projects, pick a brief, write your answer and add links (for example Google Drive or Canva). For a team project, choose teammates from your class; everyone gets the same mark.\n\nYou can resend until your teacher marks it. Once marked, the rubric scores and feedback appear on the project page.'],
  },
  {
    slug: 'guru-membuat-kelas', category: 'teachers', order: 1,
    id: ['Kelas, tugas, dan mode kelas langsung', 'Hal pertama yang perlu dilakukan guru.', '- Admin sekolah membuat kelas dan memberi Anda akses; Anda melihatnya di Ruang Guru.\n- Bagikan kode kelas kepada siswa, atau minta admin sekolah mengunggah daftar siswa (CSV).\n- Beri tugas: pilih pelajaran dan tenggat; siswa mendapat pemberitahuan.\n- Mode kelas langsung menampilkan pelajaran di proyektor sambil siswa mengerjakan di perangkatnya.\n- Nilai proyek dengan rubrik di halaman Nilai, dan baca percakapan AI Lab yang ditandai.'],
    en: ['Classes, assignments and live class mode', 'The first things a teacher needs to do.', '- Your school admin creates classes and gives you access; you see them in the Teacher space.\n- Share the class code with students, or ask the school admin to upload a student list (CSV).\n- Set work: choose a lesson and a due date; students are notified.\n- Live class mode shows the lesson on a projector while students work on their devices.\n- Mark projects with the rubric on the Marks page, and read AI Lab chats that were flagged.'],
  },
  {
    slug: 'izin-orang-tua', category: 'parents', order: 1,
    id: ['Izin orang tua dan akun orang tua', 'Memberi atau menarik izin, dan memantau kemajuan anak.', 'Anak di bawah 18 tahun memerlukan izin Anda sebelum memakai AI Lab, mengirim proyek, atau ikut tes. Tautan izin dikirim lewat email atau WhatsApp; halaman itu menjelaskan data apa yang kami kumpulkan dan alasannya.\n\nSetelah memberi izin, Anda dapat membuat akun orang tua untuk melihat pelajaran, lencana, hasil tes dan sertifikat anak, serta menerima ringkasan setiap Minggu. Anak juga dapat membuat kode 8 karakter di halaman Akun untuk menghubungkan Anda.\n\nAnda dapat menarik izin kapan saja dari Ruang Orang Tua atau dari tautan izin semula.'],
    en: ['Parent permission and parent accounts', 'Giving or withdrawing permission, and following your child’s progress.', 'Children under 18 need your permission before using the AI Lab, sending projects or taking tests. The permission link arrives by email or WhatsApp; that page explains what data we collect and why.\n\nAfter giving permission you can create a parent account to see your child’s lessons, badges, test results and certificates, and get a summary every Sunday. Your child can also make an 8-character code on their Account page to connect you.\n\nYou can withdraw permission at any time from the parent space or the original permission link.'],
  },
  {
    slug: 'admin-sekolah', category: 'schools', order: 1,
    id: ['Untuk admin sekolah', 'Kelas, daftar siswa, izin orang tua, lisensi, dan laporan.', '- Buat kelas dan tetapkan guru di Ruang Sekolah.\n- Unggah daftar siswa dalam CSV; akun dan permintaan izin dibuat otomatis.\n- Lihat siswa yang menunggu izin orang tua dan kirim tautan izin lewat WhatsApp.\n- Jadwalkan sesi tes AILIS dan buat voucher di Tes AILIS: jadwal dan voucher.\n- Laporan sekolah merangkum hasil per tingkat, kelas, gagasan besar, dan capaian KKA; dapat diunduh atau dicetak.\n- Lisensi dan invoice ada di Ruang Sekolah; kami mengingatkan 30 dan 7 hari sebelum lisensi berakhir.'],
    en: ['For school admins', 'Classes, student lists, parent permission, licence and reports.', '- Create classes and assign teachers in the School space.\n- Upload a student list as CSV; accounts and permission requests are created automatically.\n- See students waiting for parent permission and send the link by WhatsApp.\n- Schedule AILIS test sessions and create vouchers under AILIS tests: dates and vouchers.\n- The school report summarises results by grade, class, big idea and KKA outcome; download or print it.\n- Your licence and invoices are in the School space; we remind you 30 and 7 days before the licence ends.'],
  },
  {
    slug: 'tes-ailis', category: 'tests', order: 1,
    id: ['Tentang tes AILIS', 'Mendaftar, hari tes, hasil, dan sertifikat.', 'Daftar sesi di Jadwal Tes AILIS (pakai kode voucher bila ada). Kami mengingatkan sehari sebelumnya.\n\nPada hari tes, pengawas memberi kode 6 huruf. Tes berjalan dalam layar penuh; berpindah tab atau menempel teks dicatat. Jika koneksi terputus, jawaban disimpan di perangkat dan dikirim saat koneksi kembali.\n\nSoal pilihan langsung dinilai; tugas praktik dinilai dua penilai. Setelah hasil keluar kamu mendapat sertifikat PDF dengan kode QR, berlaku 2 tahun. Selama uji coba, batas band masih sementara dan tertulis di sertifikat.'],
    en: ['About the AILIS test', 'Booking, test day, results and certificates.', 'Book a session on the AILIS test dates page (use a voucher code if you have one). We remind you the day before.\n\nOn the day, the proctor gives you a 6-letter code. The test runs full screen; switching tabs or pasting text is logged. If the connection drops, answers are kept on the device and sent when it returns.\n\nChoice questions are scored at once; practical tasks are marked by two raters. When your result is ready you get a PDF certificate with a QR code, valid for 2 years. During the pilot, band thresholds are provisional and the certificate says so.'],
  },
  {
    slug: 'verifikasi-sertifikat', category: 'tests', order: 2,
    id: ['Memeriksa keaslian sertifikat', 'Untuk sekolah, kampus, dan pemberi kerja.', 'Buka halaman Verifikasi sertifikat dan masukkan kode (misalnya AILIS-7KQ2-M9XD), atau pindai kode QR di sertifikat. Halaman itu menunjukkan apakah sertifikat asli, masih berlaku, kedaluwarsa, atau dicabut, beserta band dan skor per domain. Nama peserta di bawah 18 tahun ditampilkan disingkat.'],
    en: ['Checking a certificate is genuine', 'For schools, universities and employers.', 'Open the Verify a certificate page and enter the code (for example AILIS-7KQ2-M9XD), or scan the QR code on the certificate. The page shows whether it is genuine, valid, expired or revoked, with the band and domain scores. Names of candidates under 18 are shortened.'],
  },
  {
    slug: 'data-saya', category: 'privacy', order: 1,
    id: ['Data saya: unduh dan hapus', 'Hakmu menurut UU Pelindungan Data Pribadi.', 'Di halaman Akun › Data saya kamu dapat:\n- Mengunduh semua data tentang akunmu (profil, kemajuan, percakapan AI, proyek, hasil tes, izin orang tua).\n- Meminta akun dan datamu dihapus. Tim kami menyelesaikannya sebelum tanggal yang tertera, dan kamu dapat membatalkannya selama masih diproses.\n\nOrang tua dapat meminta penghapusan data anak dari Ruang Orang Tua. Data penggunaan (analitik) disimpan dengan ID samaran.'],
    en: ['My data: download and delete', 'Your rights under Indonesia’s personal data protection law.', 'On Account › My data you can:\n- Download everything about your account (profile, progress, AI chats, projects, test results, parent permission).\n- Ask for your account and data to be deleted. Our team completes it before the date shown, and you can cancel while it is in progress.\n\nParents can ask for their child’s data to be deleted from the parent space. Usage analytics are stored under a pseudonymous ID.'],
  },
]

export async function seedHelpArticles(payload: Payload) {
  let created = 0
  for (const a of ARTICLES) {
    const exists = await payload.count({ collection: 'help-articles', overrideAccess: true, where: { slug: { equals: a.slug } } })
    if (exists.totalDocs) continue
    const doc = await payload.create({ collection: 'help-articles', overrideAccess: true, locale: 'id', data: { slug: a.slug, category: a.category as never, order: a.order, published: true, title: a.id[0], summary: a.id[1], body: a.id[2] } })
    await payload.update({ collection: 'help-articles', id: doc.id, overrideAccess: true, locale: 'en', data: { title: a.en[0], summary: a.en[1], body: a.en[2] } })
    created++
  }
  return { created, total: ARTICLES.length }
}
