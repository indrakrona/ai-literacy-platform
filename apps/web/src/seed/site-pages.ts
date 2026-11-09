import type { Payload } from 'payload'
import { doc, h2, p, ul } from './lexical'

/**
 * Public website pages (spec A1, A2, A7, A8). Written to be honest about the pilot stage: no invented
 * numbers, partners or testimonials. Legal pages are drafts until reviewed by a lawyer.
 */
type L = 'id' | 'en'
type B = Record<string, unknown> & { blockType: string }
interface PageSeed {
  slug: string
  showInNav?: boolean
  navOrder?: number
  footerGroup?: 'legal' | 'about'
  title: Record<L, string>
  description: Record<L, string>
  layout: Record<L, B[]>
}

const hero = (eyebrow: string, heading: string, lead: string, primary?: [string, string], secondary?: [string, string]): B => ({
  blockType: 'hero', eyebrow, heading, lead,
  primary: primary ? { label: primary[0], href: primary[1] } : undefined,
  secondary: secondary ? { label: secondary[0], href: secondary[1] } : undefined,
})
const list = (blockType: 'features' | 'steps', heading: string, items: [string, string][], intro?: string): B => ({ blockType, heading, intro, items: items.map(([title, body]) => ({ title, body })) })
const faq = (heading: string, items: [string, string][]): B => ({ blockType: 'faq', heading, items: items.map(([question, answer]) => ({ question, answer })) })
const cta = (heading: string, body: string, button: [string, string]): B => ({ blockType: 'cta', heading, body, button: { label: button[0], href: button[1] } })
const notice = (text: string): B => ({ blockType: 'notice', text })
const text = (heading: string | undefined, ...children: unknown[]): B => ({ blockType: 'text', heading, body: doc(...children) })

const PILOT_NOTICE = {
  id: 'Program ini sedang dalam tahap uji coba (pilot) bersama sekolah mitra pertama. Materi, tes, dan fitur terus kami perbaiki berdasarkan masukan guru dan siswa.',
  en: 'This program is in its pilot stage with our first partner schools. Lessons, tests and features keep improving based on feedback from teachers and students.',
}

const PAGES: PageSeed[] = [
  {
    slug: 'home',
    title: { id: 'Literasi AI untuk Remaja Indonesia', en: 'AI Literacy for Indonesian Teens' },
    description: {
      id: 'Program literasi kecerdasan artifisial untuk siswa SMP, SMA, dan SMK: belajar memahami, memakai, dan memeriksa AI secara aman dan bertanggung jawab.',
      en: 'An artificial intelligence literacy program for junior and senior secondary students: learn to understand, use and check AI safely and responsibly.',
    },
    layout: {
      id: [
        hero('Impact Thinklab · AI Literacy', 'Literasi AI untuk remaja Indonesia', 'Siswa SMP, SMA, dan SMK belajar memahami cara kerja AI, memakainya untuk berkarya, memeriksa jawabannya, dan melindungi diri, melalui pelajaran singkat, AI Lab yang aman, dan proyek nyata.', ['Ajukan sekolah Anda', '/kontak'], ['Lihat program', '/program']),
        notice(PILOT_NOTICE.id),
        list('features', 'Lima gagasan besar', [
          ['Mengenal', 'Apa itu AI, di mana kita menjumpainya, dan bedanya dengan program biasa.'],
          ['Memahami', 'Bagaimana AI belajar dari data, mengapa ia bisa keliru, dan cara memeriksa jawabannya.'],
          ['Berkarya', 'Memakai AI sebagai alat bantu belajar dan berkarya, dengan jujur tentang bagian mana yang dibuat sendiri.'],
          ['Melindungi', 'Menjaga data pribadi, mengenali hoaks dan deepfake, serta memakai AI dengan aman.'],
          ['Berkembang', 'Memakai AI untuk menyelesaikan masalah nyata di sekolah, lingkungan, dan dunia kerja.'],
        ], 'Kurikulum disusun dari lima gagasan besar yang dipelajari bertahap dari SMP hingga SMA/SMK.'),
        list('features', 'Yang didapat sekolah', [
          ['Dua jalur belajar', 'Jalur SMP dan jalur SMA/SMK, masing-masing 18 sesi, dengan versi inti 12 sesi bagi sekolah yang waktunya terbatas.'],
          ['AI Lab yang aman', 'Siswa berlatih memakai AI dalam aktivitas terarah. Perisai Data menahan data pribadi sebelum dikirim, dan guru dapat membaca percakapan.'],
          ['Proyek nyata', 'Proyek dengan rubrik yang jelas, termasuk proyek khusus sesuai jurusan SMK.'],
          ['Alat untuk guru', 'Dasbor kelas, pemberian tugas, mode presentasi, penilaian proyek, dan tinjauan AI Lab.'],
          ['Skor AI Literacy (AILIS)', 'Tes untuk mengukur kemampuan literasi AI dengan satu skor dan lima sub-skor. Ambang skor masih sementara selama masa pilot.'],
          ['Izin orang tua', 'Siswa di bawah 18 tahun memerlukan izin orang tua atau wali sebelum memakai AI Lab, proyek, dan tes.'],
        ]),
        list('steps', 'Cara bergabung dengan pilot', [
          ['Ajukan sekolah', 'Isi formulir pada halaman Kontak.'],
          ['Diskusi singkat', 'Kami menghubungi Anda untuk menyesuaikan jadwal dan kelas yang ikut.'],
          ['Persiapan guru', 'Guru mendapat akun, materi, dan pendampingan awal.'],
          ['Mulai belajar', 'Siswa bergabung dengan kode kelas; orang tua memberi izin secara daring.'],
        ]),
        cta('Tertarik mengikuti pilot?', 'Kami sedang membuka kesempatan bagi sejumlah sekolah untuk ikut serta dalam tahap uji coba.', ['Ajukan sekolah Anda', '/kontak']),
      ],
      en: [
        hero('Impact Thinklab · AI Literacy', 'AI literacy for Indonesian teens', 'Junior and senior secondary students learn how AI works, use it to create, check its answers and protect themselves, through short lessons, a safe AI Lab and real projects.', ['Apply for your school', '/kontak'], ['See the program', '/program']),
        notice(PILOT_NOTICE.en),
        list('features', 'Five big ideas', [
          ['Discover', 'What AI is, where we meet it, and how it differs from ordinary software.'],
          ['Understand', 'How AI learns from data, why it can be wrong, and how to check its answers.'],
          ['Create', 'Using AI as a tool for learning and making things, while being honest about what you made yourself.'],
          ['Protect', 'Keeping personal data safe, spotting hoaxes and deepfakes, and using AI safely.'],
          ['Thrive', 'Using AI to solve real problems at school, in the community and at work.'],
        ], 'The curriculum is built on five big ideas, learned step by step from junior to senior secondary school.'),
        list('features', 'What schools get', [
          ['Two learning tracks', 'A junior secondary (SMP) track and a senior secondary (SMA/SMK) track of 18 sessions each, with a 12-session core version for schools with less time.'],
          ['A safe AI Lab', 'Students practise with AI in guided activities. The Safety Shield holds back personal data before it is sent, and teachers can read the conversations.'],
          ['Real projects', 'Projects with clear rubrics, including projects matched to each SMK major.'],
          ['Teacher tools', 'Class dashboard, assignments, presentation mode, project marking and AI Lab review.'],
          ['AI Literacy Score (AILIS)', 'A test that measures AI literacy with one score and five sub-scores. Score thresholds are provisional during the pilot.'],
          ['Parent permission', 'Students under 18 need a parent or guardian’s permission before using the AI Lab, projects and tests.'],
        ]),
        list('steps', 'How to join the pilot', [
          ['Apply', 'Fill in the form on the Contact page.'],
          ['Short call', 'We contact you to agree the schedule and the classes taking part.'],
          ['Teacher preparation', 'Teachers receive accounts, materials and initial support.'],
          ['Start learning', 'Students join with a class code; parents give permission online.'],
        ]),
        cta('Interested in the pilot?', 'We are opening places for a number of schools to take part in the pilot stage.', ['Apply for your school', '/kontak']),
      ],
    },
  },
  {
    slug: 'program',
    showInNav: true,
    navOrder: 1,
    title: { id: 'Program', en: 'Program' },
    description: { id: 'Dua jalur belajar literasi AI untuk SMP dan SMA/SMK, AI Lab, proyek nyata, dan Skor AI Literacy (AILIS).', en: 'Two AI literacy tracks for junior and senior secondary schools, an AI Lab, real projects and the AI Literacy Score (AILIS).' },
    layout: {
      id: [
        hero('Program', 'Belajar memahami dan memakai AI dengan bijak', 'Setiap sesi berlangsung sekitar satu jam pelajaran dan memadukan penjelasan singkat, aktivitas, simulasi interaktif, kuis, serta latihan di AI Lab.'),
        list('features', 'Jalur belajar', [
          ['AI untuk Belajar dan Integritas (SMP, usia 12–15)', '18 sesi tentang mengenal AI, memeriksa informasi, menjaga data pribadi, dan memakai AI untuk belajar tanpa menyontek. Ditutup dengan proyek gagasan AI untuk kebaikan.'],
          ['Membangun dengan AI (SMA/SMK, usia 15–18)', '18 sesi tentang cara kerja AI, bias dan kesalahan, perintah (prompt) yang baik, verifikasi fakta, etika, dan AI di dunia kerja. Ditutup dengan proyek terapan; siswa SMK mendapat brief sesuai jurusannya.'],
          ['Versi inti 12 sesi', 'Untuk sekolah dengan waktu terbatas, tersedia versi inti 12 sesi yang tetap mencakup kelima gagasan besar.'],
        ]),
        list('features', 'Cara belajar', [
          ['Simulasi interaktif', 'Siswa mencoba sendiri bagaimana AI mengelompokkan data, bagaimana data latih memengaruhi hasil, dan bagaimana perintah memengaruhi jawaban.'],
          ['AI Lab', 'Aktivitas terarah dengan AI. Perisai Data menahan pesan yang berisi data pribadi, pemeriksaan konten melindungi siswa, dan semua percakapan dapat dibaca guru.'],
          ['Proyek nyata', 'Masalah dari lingkungan sekitar, misalnya kantin sekolah atau UMKM, dinilai dengan rubrik empat tingkat.'],
          ['Kuis dan refleksi', 'Setiap sesi ditutup dengan kuis singkat dan pertanyaan refleksi.'],
        ]),
        list('features', 'Skor AI Literacy (AILIS)', [
          ['Apa yang diukur', 'Lima ranah: memahami AI, memakai dan berkarya, mengevaluasi, melindungi, dan menerapkan.'],
          ['Bentuk tes', 'Soal pilihan ganda berbasis situasi dan tugas tertulis yang dinilai penilai terlatih dengan rubrik.'],
          ['Hasil', 'Satu skor keseluruhan (0–9) dan lima sub-skor. Selama pilot, skor bersifat sementara sampai ambangnya ditetapkan panel ahli.'],
        ]),
        cta('Ingin melihat materinya?', 'Kami dapat menunjukkan contoh sesi dan AI Lab dalam pertemuan daring.', ['Hubungi kami', '/kontak']),
      ],
      en: [
        hero('Program', 'Learning to understand and use AI wisely', 'Each session takes about one lesson period and combines a short explanation, an activity, interactive simulations, a quiz and practice in the AI Lab.'),
        list('features', 'Learning tracks', [
          ['AI for Learning & Integrity (SMP, ages 12–15)', '18 sessions on getting to know AI, checking information, protecting personal data and using AI to learn without cheating. Ends with an AI-for-good project idea.'],
          ['Build with AI (SMA/SMK, ages 15–18)', '18 sessions on how AI works, bias and errors, good prompts, fact-checking, ethics and AI at work. Ends with an applied project; SMK students get briefs matched to their major.'],
          ['12-session core version', 'Schools with less time can use a 12-session core version that still covers all five big ideas.'],
        ]),
        list('features', 'How students learn', [
          ['Interactive simulations', 'Students try for themselves how AI sorts data, how training data changes the result and how prompts change the answer.'],
          ['AI Lab', 'Guided activities with AI. The Safety Shield holds back messages with personal data, content checks protect students, and teachers can read every conversation.'],
          ['Real projects', 'Problems from the community, such as the school canteen or a small business, marked with a four-level rubric.'],
          ['Quizzes and reflection', 'Every session ends with a short quiz and reflection questions.'],
        ]),
        list('features', 'AI Literacy Score (AILIS)', [
          ['What it measures', 'Five domains: understanding AI, using and creating, evaluating, protecting, and applying.'],
          ['Test format', 'Scenario-based multiple-choice questions and written tasks marked by trained raters with a rubric.'],
          ['Result', 'One overall score (0–9) and five sub-scores. During the pilot, scores are provisional until an expert panel sets the thresholds.'],
        ]),
        cta('Want to see the materials?', 'We can show sample sessions and the AI Lab in an online meeting.', ['Contact us', '/kontak']),
      ],
    },
  },
  {
    slug: 'untuk-sekolah',
    showInNav: true,
    navOrder: 2,
    title: { id: 'Untuk Sekolah', en: 'For Schools' },
    description: { id: 'Cara sekolah menjalankan program literasi AI: peran guru, kebutuhan teknis, keamanan data siswa, dan izin orang tua.', en: 'How schools run the AI literacy program: the teacher’s role, technical needs, student data safety and parent permission.' },
    layout: {
      id: [
        hero('Untuk Sekolah', 'Mudah dijalankan, aman untuk siswa', 'Program dirancang agar dapat dijalankan guru mata pelajaran mana pun, termasuk sebagai bagian dari mata pelajaran pilihan Koding dan Kecerdasan Artifisial (KKA), kegiatan kokurikuler, atau ekstrakurikuler.', ['Ajukan sekolah Anda', '/kontak']),
        list('features', 'Peran guru', [
          ['Materi siap pakai', 'Setiap sesi memiliki tujuan, langkah kegiatan, dan mode presentasi untuk kelas dengan satu proyektor.'],
          ['Pantau kemajuan', 'Dasbor kelas menunjukkan siapa yang sudah menyelesaikan pelajaran, siapa yang tertinggal, dan percakapan AI Lab yang perlu perhatian.'],
          ['Nilai proyek', 'Antrean penilaian dengan rubrik 1–4 per kriteria dan umpan balik tertulis.'],
          ['Tidak perlu ahli AI', 'Guru mendapat pendampingan awal; penjelasan konsep sudah tersedia dalam materi.'],
        ]),
        list('features', 'Kebutuhan teknis', [
          ['Perangkat', 'Berjalan di peramban (browser) pada ponsel, tablet, atau komputer. Tidak perlu memasang aplikasi.'],
          ['Internet', 'Halaman dirancang ringan agar tetap dapat dipakai dengan koneksi seluler.'],
          ['Akun', 'Admin sekolah dapat mengunggah daftar siswa dan guru dari berkas CSV, atau siswa bergabung sendiri dengan kode kelas.'],
        ]),
        list('features', 'Keamanan dan privasi siswa', [
          ['Izin orang tua', 'Siswa di bawah 18 tahun memerlukan izin orang tua atau wali yang diberikan secara daring sebelum memakai AI Lab, proyek, dan tes.'],
          ['Perisai Data', 'Pesan yang berisi nomor telepon, alamat, NIK, kata sandi, dan data pribadi lain ditahan sebelum dikirim ke AI.'],
          ['Pemeriksaan konten', 'Permintaan yang tidak pantas untuk remaja diblokir dan ditandai untuk guru.'],
          ['Data minimum', 'Kami hanya mengumpulkan data yang diperlukan untuk belajar. Analitik memakai ID samaran, tanpa nama atau usia pasti, dan tidak dipakai untuk iklan.'],
        ]),
        cta('Siap mencoba di sekolah Anda?', 'Isi formulir dan tim kami akan menghubungi Anda.', ['Ajukan sekolah Anda', '/kontak']),
      ],
      en: [
        hero('For Schools', 'Easy to run, safe for students', 'The program is designed so any subject teacher can run it, including as part of the elective subject Coding and Artificial Intelligence (KKA), co-curricular activities or a club.', ['Apply for your school', '/kontak']),
        list('features', 'The teacher’s role', [
          ['Ready-to-use materials', 'Every session has objectives, activity steps and a presentation mode for classrooms with one projector.'],
          ['Follow progress', 'The class dashboard shows who has finished lessons, who is falling behind and AI Lab conversations that need attention.'],
          ['Mark projects', 'A marking queue with a 1–4 rubric per criterion and written feedback.'],
          ['No AI expertise needed', 'Teachers get initial support; the concepts are explained in the materials.'],
        ]),
        list('features', 'Technical needs', [
          ['Devices', 'Runs in the browser on phones, tablets or computers. No app to install.'],
          ['Internet', 'Pages are designed to stay light so they work on mobile connections.'],
          ['Accounts', 'School admins can upload student and teacher lists from a CSV file, or students join with a class code.'],
        ]),
        list('features', 'Student safety and privacy', [
          ['Parent permission', 'Students under 18 need online permission from a parent or guardian before using the AI Lab, projects and tests.'],
          ['Safety Shield', 'Messages containing phone numbers, addresses, ID numbers, passwords and other personal data are held back before reaching the AI.'],
          ['Content checks', 'Requests that are unsuitable for teens are blocked and flagged for the teacher.'],
          ['Minimal data', 'We collect only what learning needs. Analytics use a pseudonymous ID, without names or exact ages, and are never used for advertising.'],
        ]),
        cta('Ready to try it at your school?', 'Fill in the form and our team will contact you.', ['Apply for your school', '/kontak']),
      ],
    },
  },
  {
    slug: 'faq',
    showInNav: true,
    navOrder: 3,
    title: { id: 'Pertanyaan Umum', en: 'FAQ' },
    description: { id: 'Jawaban atas pertanyaan umum dari sekolah, guru, orang tua, dan siswa tentang program AI Literacy.', en: 'Answers to common questions from schools, teachers, parents and students about the AI Literacy program.' },
    layout: {
      id: [
        faq('Untuk sekolah dan guru', [
          ['Siapa yang dapat ikut?', 'Siswa SMP, SMA, dan SMK berusia 12–18 tahun melalui sekolahnya. Selama masa pilot, program dijalankan bersama sekolah mitra terpilih.'],
          ['Berapa lama programnya?', 'Versi lengkap 18 sesi dan versi inti 12 sesi, masing-masing sekitar satu jam pelajaran.'],
          ['Apakah guru harus menguasai AI?', 'Tidak. Materi menjelaskan konsepnya, dan guru mendapat pendampingan awal.'],
          ['Apakah program ini berbayar?', 'Ketentuan biaya untuk tahap setelah pilot akan disampaikan langsung kepada sekolah. Silakan hubungi kami untuk informasi terbaru.'],
          ['Apakah sesuai dengan kurikulum?', 'Program dirancang agar dapat mendukung mata pelajaran pilihan Koding dan Kecerdasan Artifisial (KKA) dan kegiatan kokurikuler. Pemetaan rinci ke capaian pembelajaran sedang kami susun bersama guru.'],
        ]),
        faq('Untuk orang tua', [
          ['Mengapa anak saya memerlukan izin?', 'Untuk siswa di bawah 18 tahun, kami meminta izin orang tua atau wali sebelum siswa memakai AI Lab, mengirim proyek, dan mengikuti tes, sesuai prinsip perlindungan data pribadi anak.'],
          ['Apakah AI Lab aman?', 'AI Lab memakai aktivitas terarah, menahan pesan yang berisi data pribadi, memblokir topik yang tidak pantas, dan semua percakapan dapat dibaca guru.'],
          ['Data apa yang dikumpulkan?', 'Nama, email, tanggal lahir, sekolah, kontak orang tua, serta catatan belajar. Rinciannya ada di Kebijakan Privasi.'],
          ['Bisakah izin dicabut?', 'Bisa. Hubungi kami atau sekolah, dan akses AI Lab, proyek, dan tes akan dinonaktifkan.'],
        ]),
        faq('Untuk siswa', [
          ['Apakah boleh memakai AI untuk mengerjakan tugas?', 'Program ini mengajarkan cara memakai AI untuk belajar, bukan untuk menyontek. Kamu akan belajar menjelaskan bagian mana yang dibantu AI dan mana yang kamu kerjakan sendiri.'],
          ['Bagaimana jika jawaban AI salah?', 'Itu bagian dari pelajaran. Kamu akan berlatih memeriksa jawaban AI dengan sumber tepercaya, dan dapat melaporkan jawaban yang keliru dengan tombol "Laporkan".'],
        ]),
      ],
      en: [
        faq('For schools and teachers', [
          ['Who can take part?', 'Junior and senior secondary students aged 12–18, through their school. During the pilot, the program runs with selected partner schools.'],
          ['How long is the program?', 'An 18-session full version and a 12-session core version, each session about one lesson period.'],
          ['Do teachers need to know AI?', 'No. The materials explain the concepts, and teachers get initial support.'],
          ['Does the program cost money?', 'Fees for the stage after the pilot will be shared directly with schools. Please contact us for the latest information.'],
          ['Does it fit the curriculum?', 'The program is designed to support the elective subject Coding and Artificial Intelligence (KKA) and co-curricular activities. A detailed mapping to learning outcomes is being prepared with teachers.'],
        ]),
        faq('For parents', [
          ['Why does my child need permission?', 'For students under 18, we ask a parent or guardian for permission before the student uses the AI Lab, sends projects or takes tests, following child data protection principles.'],
          ['Is the AI Lab safe?', 'The AI Lab uses guided activities, holds back messages containing personal data, blocks unsuitable topics, and teachers can read every conversation.'],
          ['What data is collected?', 'Name, email, date of birth, school, parent contact and learning records. Details are in the Privacy Policy.'],
          ['Can permission be withdrawn?', 'Yes. Contact us or the school, and access to the AI Lab, projects and tests will be switched off.'],
        ]),
        faq('For students', [
          ['Can I use AI to do my homework?', 'This program teaches you to use AI to learn, not to cheat. You will practise explaining which parts AI helped with and which parts you did yourself.'],
          ['What if the AI is wrong?', 'That is part of the lesson. You will practise checking AI answers with trusted sources, and you can report a wrong answer with the "Report" button.'],
        ]),
      ],
    },
  },
  {
    slug: 'kontak',
    showInNav: true,
    navOrder: 4,
    title: { id: 'Kontak', en: 'Contact' },
    description: { id: 'Ajukan sekolah Anda untuk mengikuti pilot program AI Literacy atau hubungi tim Impact Thinklab.', en: 'Apply for your school to join the AI Literacy pilot or contact the Impact Thinklab team.' },
    layout: {
      id: [
        hero('Kontak', 'Ajukan sekolah Anda untuk program pilot', 'Isi formulir di bawah ini. Tim kami akan menghubungi Anda dalam 5 hari kerja untuk membahas kelas yang ikut dan jadwal pelaksanaan.'),
        { blockType: 'pilotForm', heading: 'Formulir pengajuan sekolah', intro: 'Formulir ini sebaiknya diisi oleh kepala sekolah, wakil kepala sekolah, atau guru yang akan menjalankan program.' },
      ],
      en: [
        hero('Contact', 'Apply for your school to join the pilot', 'Fill in the form below. Our team will contact you within 5 working days to discuss the classes taking part and the schedule.'),
        { blockType: 'pilotForm', heading: 'School application form', intro: 'This form is best filled in by the principal, a vice-principal or the teacher who will run the program.' },
      ],
    },
  },
  {
    slug: 'kebijakan-privasi',
    footerGroup: 'legal',
    navOrder: 20,
    title: { id: 'Kebijakan Privasi', en: 'Privacy Policy' },
    description: { id: 'Bagaimana platform AI Literacy mengumpulkan, memakai, dan melindungi data pribadi siswa, guru, dan orang tua.', en: 'How the AI Literacy platform collects, uses and protects the personal data of students, teachers and parents.' },
    layout: {
      id: [
        notice('DRAF — kebijakan ini masih ditinjau oleh penasihat hukum dan dapat berubah sebelum peluncuran resmi.'),
        text('Siapa kami', p('Platform AI Literacy dikelola oleh Impact Thinklab. Kebijakan ini menjelaskan data pribadi yang kami proses saat Anda memakai platform, dan disusun dengan mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.')),
        text('Data yang kami kumpulkan', ul(
          'Data akun: nama, email, tanggal lahir, peran (siswa, guru, dan lainnya), dan sekolah.',
          'Kontak orang tua atau wali untuk siswa di bawah 18 tahun, beserta catatan pemberian izin.',
          'Catatan belajar: pelajaran yang diselesaikan, hasil kuis, proyek, dan hasil tes.',
          'Percakapan AI Lab. Pesan yang terdeteksi berisi data pribadi ditahan dan tidak disimpan apa adanya.',
          'Data penggunaan dengan ID samaran (tanpa nama, email, atau usia pasti) untuk memperbaiki layanan.',
        )),
        text('Untuk apa data dipakai', ul(
          'Menyediakan pelajaran, AI Lab, proyek, tes, dan laporan kemajuan.',
          'Memungkinkan guru dan sekolah mendampingi siswanya.',
          'Menjaga keamanan siswa, termasuk pemeriksaan konten dan penanganan laporan masalah.',
          'Memperbaiki materi dan platform. Data tidak dipakai untuk iklan dan tidak dijual.',
        )),
        text('Anak di bawah 18 tahun', p('Siswa di bawah 18 tahun memerlukan izin orang tua atau wali sebelum memakai AI Lab, mengirim proyek, dan mengikuti tes. Orang tua dapat meminta akses, perbaikan, atau penghapusan data anaknya, serta mencabut izin kapan saja.')),
        text('Siapa yang dapat melihat data', ul(
          'Siswa melihat data miliknya sendiri.',
          'Guru melihat kemajuan dan percakapan AI Lab siswa di kelasnya.',
          'Admin sekolah melihat data siswa dan guru di sekolahnya.',
          'Tim Impact Thinklab yang berwenang, untuk menjalankan dan mengamankan layanan.',
          'Penyedia layanan teknologi (misalnya penyedia server dan model AI) yang terikat perjanjian untuk menjaga kerahasiaan data.',
        )),
        text('Penyimpanan dan keamanan', p('Data disimpan dengan pengamanan teknis yang wajar, termasuk enkripsi saat dikirim dan pembatasan akses berdasarkan peran. Jangka waktu penyimpanan akan ditetapkan dalam versi akhir kebijakan ini.')),
        text('Hak Anda', p('Anda dapat meminta akses, perbaikan, atau penghapusan data pribadi, serta menarik persetujuan. Hubungi kami melalui halaman Kontak.')),
      ],
      en: [
        notice('DRAFT — this policy is still being reviewed by legal counsel and may change before the official launch.'),
        text('Who we are', p('The AI Literacy platform is run by Impact Thinklab. This policy explains the personal data we process when you use the platform, and is written with reference to Indonesia’s Law No. 27 of 2022 on Personal Data Protection.')),
        text('Data we collect', ul(
          'Account data: name, email, date of birth, role (student, teacher and others) and school.',
          'Parent or guardian contact for students under 18, and the record of permission.',
          'Learning records: lessons completed, quiz results, projects and test results.',
          'AI Lab conversations. Messages detected as containing personal data are held back and not stored as written.',
          'Usage data with a pseudonymous ID (no name, email or exact age) to improve the service.',
        )),
        text('How data is used', ul(
          'To provide lessons, the AI Lab, projects, tests and progress reports.',
          'To let teachers and schools support their students.',
          'To keep students safe, including content checks and handling problem reports.',
          'To improve the materials and platform. Data is never used for advertising and never sold.',
        )),
        text('Children under 18', p('Students under 18 need a parent or guardian’s permission before using the AI Lab, sending projects or taking tests. Parents may ask to access, correct or delete their child’s data, and may withdraw permission at any time.')),
        text('Who can see data', ul(
          'Students see their own data.',
          'Teachers see the progress and AI Lab conversations of students in their classes.',
          'School admins see student and teacher data for their school.',
          'Authorised Impact Thinklab staff, to run and secure the service.',
          'Technology providers (such as server and AI model providers) bound by agreements to keep data confidential.',
        )),
        text('Storage and security', p('Data is stored with reasonable technical safeguards, including encryption in transit and role-based access. Retention periods will be set in the final version of this policy.')),
        text('Your rights', p('You may ask to access, correct or delete personal data, and to withdraw consent. Contact us through the Contact page.')),
      ],
    },
  },
  {
    slug: 'syarat-ketentuan',
    footerGroup: 'legal',
    navOrder: 21,
    title: { id: 'Syarat dan Ketentuan', en: 'Terms of Use' },
    description: { id: 'Syarat dan ketentuan penggunaan platform AI Literacy.', en: 'Terms of use for the AI Literacy platform.' },
    layout: {
      id: [
        notice('DRAF — syarat dan ketentuan ini masih ditinjau oleh penasihat hukum dan dapat berubah sebelum peluncuran resmi.'),
        text('Penggunaan platform', ul(
          'Platform ditujukan untuk kegiatan belajar literasi AI melalui sekolah.',
          'Pengguna wajib menjaga kerahasiaan kata sandi dan tidak memakai akun orang lain.',
          'Siswa di bawah 18 tahun memakai fitur tertentu setelah mendapat izin orang tua atau wali.',
        )),
        text('Perilaku yang tidak diperbolehkan', ul(
          'Memasukkan data pribadi orang lain atau konten yang melanggar hukum.',
          'Mencoba mengakali pengaman AI Lab untuk memperoleh konten berbahaya atau tidak pantas.',
          'Menyalin jawaban tes atau mengerjakan tes atas nama orang lain.',
        )),
        text('Tentang jawaban AI', p('Jawaban AI dapat keliru. Pengguna diajak untuk selalu memeriksa informasi penting dengan sumber tepercaya. Jawaban AI bukan nasihat medis, hukum, atau keuangan.')),
        text('Konten dan hak cipta', p('Materi pelajaran milik Impact Thinklab dan hanya boleh dipakai untuk kegiatan belajar di sekolah peserta. Karya siswa tetap menjadi milik siswa.')),
        text('Perubahan', p('Kami dapat memperbarui syarat ini. Perubahan penting akan diberitahukan melalui platform.')),
      ],
      en: [
        notice('DRAFT — these terms are still being reviewed by legal counsel and may change before the official launch.'),
        text('Using the platform', ul(
          'The platform is for AI literacy learning through schools.',
          'Users must keep their password secret and not use anyone else’s account.',
          'Students under 18 use certain features after a parent or guardian gives permission.',
        )),
        text('Not allowed', ul(
          'Entering other people’s personal data or unlawful content.',
          'Trying to get around the AI Lab safeguards to obtain harmful or unsuitable content.',
          'Copying test answers or taking a test on behalf of someone else.',
        )),
        text('About AI answers', p('AI answers can be wrong. Users are encouraged to always check important information against trusted sources. AI answers are not medical, legal or financial advice.')),
        text('Content and copyright', p('Lesson materials belong to Impact Thinklab and may only be used for learning at participating schools. Student work remains the student’s own.')),
        text('Changes', p('We may update these terms. Important changes will be announced on the platform.')),
      ],
    },
  },
]

export const SITE_PAGE_SLUGS = PAGES.map((p) => p.slug)

/** Create or update the website pages by slug, publish them, and set default site settings. Idempotent. */
export async function seedSitePages(payload: Payload) {
  for (const pg of PAGES) {
    const base = { slug: pg.slug, showInNav: pg.showInNav ?? false, navOrder: pg.navOrder ?? 10, footerGroup: pg.footerGroup, _status: 'published' as const }
    const existing = (await payload.find({ collection: 'pages', where: { slug: { equals: pg.slug } }, limit: 1, depth: 0, draft: true })).docs[0]
    const idData = { ...base, title: pg.title.id, description: pg.description.id, layout: pg.layout.id }
    const saved = existing
      ? await payload.update({ collection: 'pages', id: existing.id, locale: 'id', data: idData as never })
      : await payload.create({ collection: 'pages', locale: 'id', data: idData as never })
    await payload.update({ collection: 'pages', id: saved.id, locale: 'en', data: { ...base, title: pg.title.en, description: pg.description.en, layout: pg.layout.en } as never })
  }
  await payload.updateGlobal({ slug: 'site-settings', locale: 'id', data: { tagline: 'Literasi AI untuk remaja Indonesia' } })
  await payload.updateGlobal({ slug: 'site-settings', locale: 'en', data: { tagline: 'AI literacy for Indonesian teens' } })
  return { pages: PAGES.length }
}
