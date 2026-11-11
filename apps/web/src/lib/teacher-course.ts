/**
 * Teacher training course and certification (spec H7, train-the-trainer). Six self-paced modules with
 * practice checks, then a final exam scored on the server. Content is bilingual; Bahasa Indonesia first.
 */
type L = { id: string; en: string }
export type CourseSection = { heading: L; paras: L[]; bullets?: L[] }
export type CourseQuestion = { prompt: L; options: L[]; answer: number; why: L }
export type CourseModule = { key: string; minutes: number; title: L; summary: L; sections: CourseSection[]; practice: CourseQuestion[] }
export type ExamQuestion = CourseQuestion & { id: string; module: string }

export const PASS_MARK = 0.8
/** Correct answers needed to pass (whole number, so no floating-point edge cases). */
export const passCount = (total: number) => Math.ceil(total * PASS_MARK - 1e-9)
export const RETRY_AFTER_MINUTES = 60
export const CERT_VALIDITY_YEARS = 2

export const COURSE_MODULES: CourseModule[] = [
  {
    key: 'kerangka',
    minutes: 30,
    title: { id: 'Mengapa literasi AI dan kerangka kita', en: 'Why AI literacy, and our framework' },
    summary: { id: 'Lima gagasan besar, 15 pernyataan kemampuan, dan kaitannya dengan KKA.', en: 'Five big ideas, 15 can-do statements, and how they link to KKA.' },
    sections: [
      {
        heading: { id: 'Siswa sudah memakai AI', en: 'Students already use AI' },
        paras: [
          { id: 'Sebagian besar remaja sudah bertemu AI setiap hari: rekomendasi video, filter foto, penerjemah, dan chatbot untuk tugas sekolah. Pertanyaannya bukan lagi apakah mereka memakai AI, tetapi apakah mereka memakainya dengan paham, aman, dan jujur.', en: 'Most teenagers already meet AI every day: video recommendations, photo filters, translators and chatbots for homework. The question is no longer whether they use AI, but whether they use it with understanding, safely and honestly.' },
          { id: 'Literasi AI bukan pelajaran pemrograman. Tujuannya agar siswa dapat menjelaskan cara kerja AI, menilai hasilnya, memakainya untuk belajar dan berkarya, melindungi diri, serta ikut memutuskan peran AI di masyarakat.', en: 'AI literacy is not a programming course. Its aim is that students can explain how AI works, judge its output, use it to learn and create, protect themselves, and help decide AI’s role in society.' },
        ],
      },
      {
        heading: { id: 'Lima gagasan besar', en: 'Five big ideas' },
        paras: [{ id: 'Seluruh materi disusun dalam lima gagasan besar. Setiap gagasan mengisi satu bagian skor AILIS, sehingga hasil tes langsung menunjukkan bagian mana yang perlu diperkuat.', en: 'All content is organised in five big ideas. Each feeds one part of the AILIS score, so test results show directly which area needs work.' }],
        bullets: [
          { id: 'Mengenal (Discover): menemukan AI di sekitar kita dan batas kemampuannya.', en: 'Discover: finding AI around us and its limits.' },
          { id: 'Memahami (Understand): data, pelatihan, prediksi, dan mengapa AI bisa keliru.', en: 'Understand: data, training, prediction and why AI gets things wrong.' },
          { id: 'Berkarya (Create): perintah yang jelas dan memakai AI untuk belajar tanpa menyontek.', en: 'Create: clear prompts and using AI to learn without cheating.' },
          { id: 'Melindungi (Protect): data pribadi, keadilan, dan integritas.', en: 'Protect: personal data, fairness and integrity.' },
          { id: 'Bertumbuh (Thrive): kerja sama manusia–AI dan solusi untuk masalah nyata.', en: 'Thrive: human–AI collaboration and solutions to real problems.' },
        ],
      },
      {
        heading: { id: 'Pernyataan kemampuan dan KKA', en: 'Can-do statements and KKA' },
        paras: [
          { id: 'Ada 15 pernyataan kemampuan (tiga per gagasan besar), dengan kode seperti PRO-1 atau CRE-2. Setiap sesi, soal latihan, dan butir tes diberi kode ini. Di rencana pembelajaran Anda melihat kode sesi beserta kalimat “Saya bisa…” untuk jenjang Anda.', en: 'There are 15 can-do statements (three per big idea), with codes such as PRO-1 or CRE-2. Every session, practice question and test item carries one. In the lesson plan you see the session’s code with its “I can…” sentence for your level.' },
          { id: 'Materi ini dipetakan ke capaian mata pelajaran pilihan Koding dan Kecerdasan Artifisial (KKA). Pemetaan masih berstatus draf sampai diperiksa guru KKA; di rencana pembelajaran capaian draf diberi tanda “(draf)”.', en: 'The content is mapped to the learning outcomes of the Coding and Artificial Intelligence (KKA) elective. The mapping stays a draft until a KKA teacher has checked it; draft outcomes are marked “(draft)” in lesson plans.' },
        ],
      },
    ],
    practice: [
      {
        prompt: { id: 'Apa tujuan utama literasi AI di platform ini?', en: 'What is the main aim of AI literacy on this platform?' },
        options: [
          { id: 'Mengajari siswa menulis kode program AI', en: 'Teaching students to code AI programs' },
          { id: 'Membuat siswa paham, aman, dan jujur saat memakai AI', en: 'Helping students use AI with understanding, safely and honestly' },
          { id: 'Melarang siswa memakai AI', en: 'Banning students from using AI' },
        ],
        answer: 1,
        why: { id: 'Literasi AI berfokus pada pemahaman, penilaian, pemakaian yang bertanggung jawab, dan perlindungan diri, bukan pemrograman.', en: 'AI literacy is about understanding, judgment, responsible use and self-protection, not programming.' },
      },
      {
        prompt: { id: 'Kode PRO-1 pada sebuah sesi menunjukkan…', en: 'The code PRO-1 on a session shows…' },
        options: [
          { id: 'Sesi pertama jalur', en: 'The first session of the track' },
          { id: 'Pernyataan kemampuan dari gagasan besar Melindungi', en: 'A can-do statement from the Protect big idea' },
          { id: 'Tingkat kesulitan sesi', en: 'How hard the session is' },
        ],
        answer: 1,
        why: { id: 'Awalan PRO berarti Protect (Melindungi); angka menunjukkan pernyataan ke-1 dari tiga.', en: 'PRO stands for Protect; the number is the first of its three statements.' },
      },
    ],
  },
  {
    key: 'cara-kerja',
    minutes: 40,
    title: { id: 'Cara kerja AI untuk guru', en: 'How AI works, for teachers' },
    summary: { id: 'Data, pelatihan, prediksi, AI generatif, dan halusinasi dengan bahasa sederhana.', en: 'Data, training, prediction, generative AI and hallucination in plain words.' },
    sections: [
      {
        heading: { id: 'Program biasa dan sistem AI', en: 'Normal programs and AI systems' },
        paras: [{ id: 'Program biasa mengikuti aturan yang ditulis manusia langkah demi langkah, misalnya kalkulator. Sistem AI belajar pola dari banyak contoh, lalu memakai pola itu untuk menebak hal baru, misalnya mengenali wajah atau menyarankan kata berikutnya.', en: 'A normal program follows rules written by people step by step, like a calculator. An AI system learns patterns from many examples, then uses them to guess something new, such as recognising a face or suggesting the next word.' }],
      },
      {
        heading: { id: 'Data, pelatihan, dan prediksi', en: 'Data, training and prediction' },
        paras: [
          { id: 'Pelatihan berarti memberi model banyak contoh beserta jawabannya sampai model dapat menebak sendiri. Hasilnya adalah prediksi dengan tingkat keyakinan, bukan kepastian.', en: 'Training means giving a model many examples with their answers until it can guess on its own. The result is a prediction with a level of confidence, not a certainty.' },
          { id: 'Kualitas AI bergantung pada datanya. Jika contoh hanya berasal dari satu kelompok, AI akan lebih sering keliru atau tidak adil untuk kelompok lain. Siswa melihat hal ini langsung di simulator pelatih data.', en: 'AI is only as good as its data. If the examples come from one group only, the AI will be wrong or unfair more often for other groups. Students see this directly in the data trainer simulator.' },
        ],
      },
      {
        heading: { id: 'AI generatif dan halusinasi', en: 'Generative AI and hallucination' },
        paras: [
          { id: 'Chatbot seperti yang dipakai di AI Lab menyusun jawaban kata demi kata berdasarkan pola bahasa. Ia tidak “mengetahui” kebenaran dan tidak selalu memeriksa sumber, sehingga dapat menulis fakta yang terdengar meyakinkan tetapi salah. Ini disebut halusinasi.', en: 'Chatbots like the one in the AI Lab build answers word by word from language patterns. They do not “know” what is true and do not always check sources, so they can write facts that sound convincing but are wrong. This is called hallucination.' },
          { id: 'Karena itu kebiasaan terpenting yang kita ajarkan adalah memeriksa: bandingkan dengan sumber tepercaya, tanyakan sumbernya, dan waspadai angka, nama, serta kutipan yang terlalu rapi.', en: 'That is why the most important habit we teach is checking: compare with a trusted source, ask for sources, and be wary of numbers, names and quotations that look too neat.' },
        ],
      },
    ],
    practice: [
      {
        prompt: { id: 'Mengapa AI bisa tidak adil terhadap sebuah kelompok?', en: 'Why can AI be unfair to a group?' },
        options: [
          { id: 'Karena AI sengaja membenci kelompok itu', en: 'Because the AI deliberately dislikes that group' },
          { id: 'Karena data latihnya kurang mewakili kelompok itu', en: 'Because its training data under-represents that group' },
          { id: 'Karena komputernya lambat', en: 'Because the computer is slow' },
        ],
        answer: 1,
        why: { id: 'AI meniru pola dalam data. Data yang berat sebelah menghasilkan keputusan yang berat sebelah.', en: 'AI copies patterns in its data. One-sided data leads to one-sided decisions.' },
      },
      {
        prompt: { id: 'Halusinasi AI adalah…', en: 'An AI hallucination is…' },
        options: [
          { id: 'Jawaban yang terdengar meyakinkan tetapi tidak benar', en: 'An answer that sounds convincing but is not true' },
          { id: 'Gambar yang dibuat AI', en: 'An image made by AI' },
          { id: 'AI yang berhenti bekerja', en: 'An AI that stops working' },
        ],
        answer: 0,
        why: { id: 'Model bahasa menyusun kata yang terdengar wajar, bukan memeriksa kebenaran.', en: 'Language models put together words that sound plausible; they do not check the truth.' },
      },
    ],
  },
  {
    key: 'mengajar',
    minutes: 40,
    title: { id: 'Mengajar dengan platform', en: 'Teaching with the platform' },
    summary: { id: 'Alur lima langkah, materi siap pakai, Kelas Langsung, dan sekolah dengan koneksi terbatas.', en: 'The five-step rhythm, ready-made materials, Live Class, and schools with limited connectivity.' },
    sections: [
      {
        heading: { id: 'Dua jalur, 18 atau 12 sesi', en: 'Two tracks, 18 or 12 sessions' },
        paras: [{ id: 'Jalur SMP (80 menit per sesi) dan jalur SMA/SMK (90 menit) masing-masing berisi 18 sesi untuk satu semester. Versi inti 12 sesi (bertanda ★) tetap mencakup ke-15 pernyataan kemampuan, untuk sekolah dengan waktu terbatas.', en: 'The SMP track (80 minutes per session) and the SMA/SMK track (90 minutes) each have 18 sessions for one semester. The 12-session core version (marked ★) still covers all 15 can-do statements, for schools with less time.' }],
      },
      {
        heading: { id: 'Alur yang sama setiap sesi', en: 'The same rhythm every session' },
        paras: [{ id: 'Setiap sesi mengikuti lima langkah sehingga siswa dan guru cepat terbiasa:', en: 'Every session follows five steps, so students and teachers settle in quickly:' }],
        bullets: [
          { id: 'Pembuka: tujuan dan pengalaman siswa.', en: 'Opening: the goal and students’ own experience.' },
          { id: 'Konsep: penjelasan singkat dengan contoh lokal.', en: 'Concept: a short explanation with local examples.' },
          { id: 'Kegiatan: simulator, AI Lab, diskusi, atau proyek.', en: 'Activity: simulator, AI Lab, discussion or project.' },
          { id: 'Refleksi: apa yang akan dilakukan berbeda.', en: 'Reflection: what students will do differently.' },
          { id: 'Cek akhir: kuis singkat dengan penjelasan.', en: 'Final check: a short quiz with explanations.' },
        ],
      },
      {
        heading: { id: 'Materi siap pakai', en: 'Ready-made materials' },
        paras: [
          { id: 'Di Ruang Guru → Materi mengajar, setiap sesi memiliki rencana pembelajaran (dengan kunci jawaban), slide untuk proyektor, lembar kerja siswa (LKPD) untuk dicetak, dan Kelas Langsung agar siswa menjawab dari ponsel. Semuanya dibuat dari isi pelajaran yang sama sehingga selalu cocok.', en: 'In the Teacher space → Teaching materials, every session has a lesson plan (with the answer key), projector slides, a printable student worksheet, and Live Class so students answer from their phones. All are generated from the same lesson content, so they always match.' },
          { id: 'Satu proyektor sudah cukup. Jika perangkat terbatas, siswa bekerja berpasangan atau memakai LKPD; jika koneksi lemah, aktifkan mode hemat data dan simpan sesi untuk dibuka tanpa internet sebelum kelas.', en: 'One projector is enough. With few devices, students work in pairs or use the worksheet; with weak connectivity, turn on data-saving mode and save sessions for offline use before class.' },
        ],
      },
    ],
    practice: [
      {
        prompt: { id: 'Sekolah Anda hanya punya satu proyektor dan sinyal lemah. Apa langkah yang paling tepat?', en: 'Your school has one projector and a weak signal. What is the best step?' },
        options: [
          { id: 'Membatalkan pelajaran', en: 'Cancel the lesson' },
          { id: 'Simpan sesi untuk offline, pakai slide di proyektor dan LKPD cetak', en: 'Save the session for offline use, show the slides and use printed worksheets' },
          { id: 'Meminta setiap siswa membeli kuota tambahan', en: 'Ask every student to buy extra data' },
        ],
        answer: 1,
        why: { id: 'Platform dirancang untuk satu perangkat dan koneksi terbatas: sesi tersimpan, slide, dan LKPD cukup untuk menjalankan kelas.', en: 'The platform is built for one device and limited connectivity: saved sessions, slides and worksheets are enough to run the class.' },
      },
      {
        prompt: { id: 'Di mana kunci jawaban kuis setiap sesi dapat ditemukan?', en: 'Where do you find the answer key for each session’s quiz?' },
        options: [
          { id: 'Di lembar kerja siswa', en: 'On the student worksheet' },
          { id: 'Di rencana pembelajaran', en: 'In the lesson plan' },
          { id: 'Tidak tersedia', en: 'It is not available' },
        ],
        answer: 1,
        why: { id: 'LKPD sengaja tanpa kunci; kunci jawaban ada di rencana pembelajaran untuk guru.', en: 'Worksheets deliberately have no key; the key is in the teacher’s lesson plan.' },
      },
    ],
  },
  {
    key: 'keamanan',
    minutes: 35,
    title: { id: 'Keamanan, privasi, dan perlindungan anak', en: 'Safety, privacy and child protection' },
    summary: { id: 'UU PDP, izin orang tua, Perisai Keamanan, dan menangani tanda bahaya di AI Lab.', en: 'The PDP Law, parental consent, the Safety Shield, and handling AI Lab flags.' },
    sections: [
      {
        heading: { id: 'Data pribadi anak', en: 'Children’s personal data' },
        paras: [
          { id: 'Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi mewajibkan persetujuan orang tua atau wali untuk memproses data anak. Karena itu siswa di bawah 18 tahun baru dapat memakai AI Lab setelah orang tua memberi izin lewat tautan persetujuan.', en: 'Indonesia’s Personal Data Protection Law (Law No. 27 of 2022) requires a parent’s or guardian’s consent to process a child’s data. That is why students under 18 can only use the AI Lab after a parent gives consent through the consent link.' },
          { id: 'Ajarkan aturan sederhana kepada siswa: jangan pernah mengetik nama lengkap, alamat, nomor telepon, foto wajah, atau kata sandi ke layanan AI mana pun. Sesi 2 (Perisai Keamanan) melatih kebiasaan ini sebelum siswa memakai AI Lab.', en: 'Teach students a simple rule: never type a full name, address, phone number, face photo or password into any AI service. Session 2 (the Safety Shield) builds this habit before students use the AI Lab.' },
        ],
      },
      {
        heading: { id: 'Percakapan AI Lab dan tanda bahaya', en: 'AI Lab conversations and flags' },
        paras: [
          { id: 'Guru dapat membaca percakapan AI Lab siswa di kelasnya. Pesan yang mengandung data pribadi, perundungan, atau tanda siswa dalam bahaya diberi tanda dan muncul di Ruang Guru.', en: 'Teachers can read AI Lab conversations of students in their class. Messages with personal data, bullying or signs that a student is at risk are flagged and appear in the Teacher space.' },
          { id: 'Jika ada tanda bahaya: tanggapi pada hari yang sama, bicara dengan siswa secara pribadi, libatkan guru BK sesuai prosedur sekolah, dan jangan menyebarkan isi percakapan. Masalah teknis atau konten yang tidak pantas dilaporkan lewat tombol “Laporkan masalah”.', en: 'If a student is flagged: respond the same day, talk to the student privately, involve the school counsellor following school procedure, and do not share the conversation. Technical problems or inappropriate content go through the “Report a problem” button.' },
        ],
      },
    ],
    practice: [
      {
        prompt: { id: 'Siswa berusia 15 tahun belum bisa membuka AI Lab. Penyebab yang paling mungkin?', en: 'A 15-year-old student cannot open the AI Lab. The most likely reason?' },
        options: [
          { id: 'Orang tua belum memberi persetujuan', en: 'A parent has not given consent yet' },
          { id: 'Siswa belum menyelesaikan semua sesi', en: 'The student has not finished every session' },
          { id: 'AI Lab hanya untuk guru', en: 'The AI Lab is for teachers only' },
        ],
        answer: 0,
        why: { id: 'Untuk siswa di bawah 18 tahun, AI Lab terbuka setelah persetujuan orang tua sesuai UU PDP.', en: 'For students under 18, the AI Lab opens after parental consent, as the PDP Law requires.' },
      },
      {
        prompt: { id: 'Sebuah percakapan AI Lab diberi tanda karena siswa menulis bahwa ia ingin menyakiti diri. Apa yang Anda lakukan?', en: 'An AI Lab conversation is flagged because a student wrote that they want to hurt themselves. What do you do?' },
        options: [
          { id: 'Menunggu sampai pertemuan berikutnya', en: 'Wait until the next lesson' },
          { id: 'Menanggapi hari itu juga, bicara pribadi, dan melibatkan guru BK', en: 'Respond that day, talk privately and involve the school counsellor' },
          { id: 'Membacakan percakapan di depan kelas sebagai contoh', en: 'Read the conversation to the class as an example' },
        ],
        answer: 1,
        why: { id: 'Keselamatan siswa didahulukan: segera, pribadi, dan sesuai prosedur sekolah.', en: 'Student safety comes first: promptly, privately and following school procedure.' },
      },
    ],
  },
  {
    key: 'integritas',
    minutes: 35,
    title: { id: 'Integritas akademik dan menilai karya dengan AI', en: 'Academic integrity and assessing AI-assisted work' },
    summary: { id: 'Kesepakatan kelas, pengungkapan pemakaian AI, dan menilai proses, bukan hanya hasil.', en: 'Class agreements, disclosing AI use, and assessing the process, not just the product.' },
    sections: [
      {
        heading: { id: 'Aturan yang jelas lebih baik daripada larangan', en: 'Clear rules work better than bans' },
        paras: [
          { id: 'Larangan total sulit diawasi dan membuat siswa memakai AI diam-diam. Lebih efektif menyepakati bersama kapan AI boleh dipakai, untuk apa, dan bagaimana menyebutkannya. Sesi integritas akademik membantu kelas menyusun kesepakatan itu.', en: 'A total ban is hard to enforce and drives AI use underground. It works better to agree together when AI may be used, for what, and how to say so. The academic integrity session helps the class draft that agreement.' },
          { id: 'Detektor AI tidak dapat diandalkan dan sering salah menuduh, terutama untuk tulisan siswa yang sederhana. Jangan menjatuhkan sanksi hanya berdasarkan hasil detektor.', en: 'AI detectors are unreliable and often accuse wrongly, especially for simple student writing. Never sanction a student on a detector’s result alone.' },
        ],
      },
      {
        heading: { id: 'Menilai proses', en: 'Assessing the process' },
        paras: [{ id: 'Minta siswa menyerahkan catatan proses: perintah yang dipakai, bagian yang dibuat AI, bagian yang mereka ubah atau buat sendiri, dan cara mereka memeriksa hasilnya. Rubrik proyek menilai kejujuran kontribusi dan pemeriksaan, bukan hanya tampilan akhir.', en: 'Ask students to hand in a process note: the prompts used, the parts AI made, the parts they changed or made themselves, and how they checked the result. Project rubrics score honest credit and checking, not just the final look.' }],
        bullets: [
          { id: 'Tanyakan secara lisan: “Jelaskan bagian ini dengan kata-katamu sendiri.”', en: 'Ask orally: “Explain this part in your own words.”' },
          { id: 'Bandingkan dengan pekerjaan siswa di kelas.', en: 'Compare with the student’s work in class.' },
          { id: 'Beri nilai pada catatan proses dan perbaikan, bukan hanya produk.', en: 'Mark the process note and revisions, not only the product.' },
        ],
      },
    ],
    practice: [
      {
        prompt: { id: 'Detektor AI menyatakan esai siswa “90% buatan AI”. Langkah yang tepat?', en: 'An AI detector says a student’s essay is “90% AI-written”. The right step?' },
        options: [
          { id: 'Langsung memberi nilai nol', en: 'Give a zero straight away' },
          { id: 'Bicara dengan siswa, minta ia menjelaskan isinya dan menunjukkan catatan prosesnya', en: 'Talk with the student, ask them to explain the content and show their process notes' },
          { id: 'Mengabaikannya', en: 'Ignore it' },
        ],
        answer: 1,
        why: { id: 'Detektor sering keliru. Percakapan dan bukti proses lebih adil dan lebih mendidik.', en: 'Detectors are often wrong. A conversation and process evidence are fairer and teach more.' },
      },
      {
        prompt: { id: 'Apa isi catatan proses yang baik?', en: 'What goes into a good process note?' },
        options: [
          { id: 'Hanya hasil akhir', en: 'Only the final result' },
          { id: 'Perintah, bagian buatan AI, bagian karya sendiri, dan cara memeriksa', en: 'Prompts, AI-made parts, own parts and how it was checked' },
          { id: 'Kata sandi akun AI', en: 'The AI account password' },
        ],
        answer: 1,
        why: { id: 'Catatan proses membuat kontribusi siswa terlihat dan dapat dinilai.', en: 'A process note makes the student’s contribution visible and assessable.' },
      },
    ],
  },
  {
    key: 'asesmen',
    minutes: 30,
    title: { id: 'Asesmen, laporan, dan tindak lanjut', en: 'Assessment, reports and follow-up' },
    summary: { id: 'Tes awal dan akhir, AILIS, laporan sekolah, dan akomodasi.', en: 'Starting and end checks, AILIS, school reports and accommodations.' },
    sections: [
      {
        heading: { id: 'Lima titik pemeriksaan', en: 'Five checkpoints' },
        paras: [{ id: 'Kemajuan siswa diperiksa lewat tes awal (sesi 1), cek akhir setiap sesi, kuis unit, rubrik proyek, dan tes akhir jalur atau AILIS. Tes awal tidak dinilai; gunanya melihat titik mulai kelas.', en: 'Progress is checked through the starting check (session 1), the final check of every session, unit quizzes, project rubrics, and the end-of-track check or AILIS. The starting check is not graded; it shows where the class begins.' }],
      },
      {
        heading: { id: 'Membaca hasil', en: 'Reading the results' },
        paras: [
          { id: 'Hasil AILIS terdiri atas skor keseluruhan dan lima subskor. Subskor terendah kelas menunjukkan gagasan besar yang perlu diulang; platform juga menyarankan sesi berikutnya untuk setiap siswa berdasarkan subskor terlemahnya.', en: 'AILIS results give an overall score and five sub-scores. The class’s lowest sub-score shows which big idea to revisit; the platform also suggests each student’s next session from their weakest sub-score.' },
          { id: 'Laporan sekolah merangkum kemajuan per kelas dan kaitannya dengan capaian KKA. Gunakan laporan untuk percakapan dengan kepala sekolah dan orang tua, bukan untuk memeringkat siswa.', en: 'School reports summarise progress by class and its link to KKA outcomes. Use them for conversations with the head and parents, not to rank students.' },
        ],
      },
      {
        heading: { id: 'Akomodasi', en: 'Accommodations' },
        paras: [{ id: 'Siswa dengan kebutuhan khusus dapat diberi waktu tambahan, teks lebih besar, atau pembaca layar untuk tes. Ajukan akomodasi lewat formulir di platform sebelum jadwal tes agar dapat disetujui tepat waktu.', en: 'Students with additional needs can get extra time, larger text or a screen reader for tests. Request accommodations through the platform form before the test date so they can be approved in time.' }],
      },
    ],
    practice: [
      {
        prompt: { id: 'Subskor “Melindungi” kelas Anda paling rendah. Apa tindak lanjut yang tepat?', en: 'Your class’s lowest sub-score is “Protect”. What is a good follow-up?' },
        options: [
          { id: 'Mengulang sesi bergagasan Melindungi, misalnya data pribadi dan integritas', en: 'Revisit the Protect sessions, such as personal data and integrity' },
          { id: 'Memeringkat siswa dan mengumumkannya', en: 'Rank the students and announce it' },
          { id: 'Tidak melakukan apa pun', en: 'Do nothing' },
        ],
        answer: 0,
        why: { id: 'Subskor menunjukkan gagasan besar yang perlu diperkuat; ulangi sesi yang terkait.', en: 'Sub-scores show which big idea needs work; revisit the related sessions.' },
      },
      {
        prompt: { id: 'Untuk apa tes awal di sesi 1?', en: 'What is the starting check in session 1 for?' },
        options: [
          { id: 'Nilai rapor', en: 'A report-card grade' },
          { id: 'Melihat titik mulai kelas, tanpa dinilai', en: 'Seeing where the class starts, ungraded' },
          { id: 'Menyaring siswa yang boleh ikut', en: 'Selecting who may join' },
        ],
        answer: 1,
        why: { id: 'Tes awal bersifat diagnostik dan tidak dinilai.', en: 'The starting check is diagnostic and not graded.' },
      },
    ],
  },
]

/** Final exam: questions only ever leave the server without their answers. */
export const EXAM: ExamQuestion[] = [
  { id: 'e1', module: 'kerangka', prompt: { id: 'Berapa jumlah pernyataan kemampuan dalam kerangka?', en: 'How many can-do statements are in the framework?' }, options: [{ id: '5', en: '5' }, { id: '12', en: '12' }, { id: '15', en: '15' }, { id: '18', en: '18' }], answer: 2, why: { id: 'Tiga pernyataan untuk setiap gagasan besar: 5 × 3 = 15.', en: 'Three statements for each big idea: 5 × 3 = 15.' } },
  { id: 'e2', module: 'kerangka', prompt: { id: 'Gagasan besar mana yang membahas data pribadi dan integritas?', en: 'Which big idea covers personal data and integrity?' }, options: [{ id: 'Mengenal', en: 'Discover' }, { id: 'Berkarya', en: 'Create' }, { id: 'Melindungi', en: 'Protect' }, { id: 'Bertumbuh', en: 'Thrive' }], answer: 2, why: { id: 'Melindungi (Protect) mencakup data pribadi, keadilan, dan integritas.', en: 'Protect covers personal data, fairness and integrity.' } },
  { id: 'e3', module: 'kerangka', prompt: { id: 'Mengapa pemetaan ke KKA diberi tanda “draf”?', en: 'Why is the KKA mapping marked “draft”?' }, options: [{ id: 'Karena KKA belum ada', en: 'Because KKA does not exist yet' }, { id: 'Karena belum diperiksa oleh guru KKA', en: 'Because a KKA teacher has not checked it yet' }, { id: 'Karena hanya untuk SMP', en: 'Because it is for SMP only' }, { id: 'Karena tidak penting', en: 'Because it does not matter' }], answer: 1, why: { id: 'Pemetaan menjadi final setelah ditinjau guru KKA.', en: 'The mapping becomes final once a KKA teacher has reviewed it.' } },
  { id: 'e4', module: 'cara-kerja', prompt: { id: 'Mana contoh sistem AI, bukan program biasa?', en: 'Which is an AI system rather than a normal program?' }, options: [{ id: 'Kalkulator', en: 'A calculator' }, { id: 'Alarm yang berbunyi pukul 06.00', en: 'An alarm that rings at 6:00' }, { id: 'Aplikasi yang mengenali jenis tanaman dari foto', en: 'An app that recognises a plant from a photo' }, { id: 'Tombol lampu', en: 'A light switch' }], answer: 2, why: { id: 'Mengenali tanaman dari foto memerlukan pola yang dipelajari dari banyak contoh.', en: 'Recognising a plant from a photo needs patterns learned from many examples.' } },
  { id: 'e5', module: 'cara-kerja', prompt: { id: 'Hasil sebuah model AI paling tepat disebut…', en: 'The output of an AI model is best described as…' }, options: [{ id: 'Kepastian', en: 'A certainty' }, { id: 'Prediksi dengan tingkat keyakinan', en: 'A prediction with a level of confidence' }, { id: 'Aturan yang ditulis guru', en: 'A rule written by a teacher' }, { id: 'Pendapat pribadi AI', en: 'The AI’s personal opinion' }], answer: 1, why: { id: 'Model menebak berdasarkan pola, sehingga hasilnya prediksi, bukan kepastian.', en: 'Models guess from patterns, so the output is a prediction, not a certainty.' } },
  { id: 'e6', module: 'cara-kerja', prompt: { id: 'Chatbot memberi kutipan tokoh lengkap dengan tahun, tetapi Anda tidak menemukannya di sumber mana pun. Ini contoh…', en: 'A chatbot gives a quotation with a name and year, but you cannot find it anywhere. This is an example of…' }, options: [{ id: 'Halusinasi', en: 'Hallucination' }, { id: 'Enkripsi', en: 'Encryption' }, { id: 'Data latih yang seimbang', en: 'Balanced training data' }, { id: 'Mode hemat data', en: 'Data-saving mode' }], answer: 0, why: { id: 'Model dapat mengarang fakta yang terdengar meyakinkan.', en: 'Models can invent facts that sound convincing.' } },
  { id: 'e7', module: 'mengajar', prompt: { id: 'Berapa sesi dalam versi inti jalur?', en: 'How many sessions are in a track’s core version?' }, options: [{ id: '6', en: '6' }, { id: '12', en: '12' }, { id: '15', en: '15' }, { id: '18', en: '18' }], answer: 1, why: { id: 'Versi inti 12 sesi tetap mencakup ke-15 pernyataan kemampuan.', en: 'The 12-session core version still covers all 15 can-do statements.' } },
  { id: 'e8', module: 'mengajar', prompt: { id: 'Langkah terakhir dalam alur setiap sesi adalah…', en: 'The last step of every session is…' }, options: [{ id: 'Pembuka', en: 'Opening' }, { id: 'Kegiatan', en: 'Activity' }, { id: 'Cek akhir', en: 'Final check' }, { id: 'Tes AILIS', en: 'The AILIS test' }], answer: 2, why: { id: 'Pembuka, konsep, kegiatan, refleksi, lalu cek akhir.', en: 'Opening, concept, activity, reflection, then the final check.' } },
  { id: 'e9', module: 'mengajar', prompt: { id: 'Fitur apa yang membuat siswa dapat menjawab pertanyaan guru dari ponsel saat pelajaran?', en: 'Which feature lets students answer the teacher’s questions from their phones during the lesson?' }, options: [{ id: 'Kelas Langsung', en: 'Live Class' }, { id: 'LKPD', en: 'The worksheet' }, { id: 'Laporan sekolah', en: 'The school report' }, { id: 'Galeri proyek', en: 'The project gallery' }], answer: 0, why: { id: 'Kelas Langsung menampilkan pertanyaan di ponsel siswa dan hasilnya di layar guru.', en: 'Live Class shows questions on students’ phones and the results on the teacher’s screen.' } },
  { id: 'e10', module: 'keamanan', prompt: { id: 'Menurut UU PDP, pemrosesan data pribadi anak memerlukan…', en: 'Under the PDP Law, processing a child’s personal data requires…' }, options: [{ id: 'Persetujuan kepala sekolah saja', en: 'The head teacher’s approval only' }, { id: 'Persetujuan orang tua atau wali', en: 'A parent’s or guardian’s consent' }, { id: 'Tidak memerlukan apa pun', en: 'Nothing at all' }, { id: 'Persetujuan teman sekelas', en: 'Classmates’ agreement' }], answer: 1, why: { id: 'UU Nomor 27 Tahun 2022 mewajibkan persetujuan orang tua atau wali untuk data anak.', en: 'Law No. 27 of 2022 requires a parent’s or guardian’s consent for children’s data.' } },
  { id: 'e11', module: 'keamanan', prompt: { id: 'Mana yang boleh diketik siswa ke AI Lab?', en: 'What may a student type into the AI Lab?' }, options: [{ id: 'Alamat rumahnya', en: 'Their home address' }, { id: 'Pertanyaan tentang fotosintesis', en: 'A question about photosynthesis' }, { id: 'Kata sandi akun sekolah', en: 'Their school account password' }, { id: 'Nomor telepon orang tua', en: 'A parent’s phone number' }], answer: 1, why: { id: 'Pertanyaan pelajaran aman; data pribadi tidak boleh dimasukkan.', en: 'Subject questions are fine; personal data must never be entered.' } },
  { id: 'e12', module: 'keamanan', prompt: { id: 'Siapa yang dapat membaca percakapan AI Lab seorang siswa?', en: 'Who can read a student’s AI Lab conversations?' }, options: [{ id: 'Siapa pun di internet', en: 'Anyone on the internet' }, { id: 'Guru kelas siswa tersebut', en: 'The student’s class teacher' }, { id: 'Semua siswa lain', en: 'All other students' }, { id: 'Tidak seorang pun', en: 'No one' }], answer: 1, why: { id: 'Guru kelas dapat membaca percakapan siswanya untuk keselamatan dan pembelajaran.', en: 'Class teachers can read their students’ chats for safety and learning.' } },
  { id: 'e13', module: 'integritas', prompt: { id: 'Pendekatan mana yang paling efektif terhadap pemakaian AI untuk tugas?', en: 'Which approach to AI use for homework works best?' }, options: [{ id: 'Melarang total tanpa penjelasan', en: 'A total ban with no explanation' }, { id: 'Kesepakatan kelas tentang kapan dan bagaimana AI dipakai serta disebutkan', en: 'A class agreement on when and how AI is used and disclosed' }, { id: 'Membiarkan tanpa aturan', en: 'No rules at all' }, { id: 'Mengandalkan detektor AI', en: 'Relying on AI detectors' }], answer: 1, why: { id: 'Aturan yang disepakati dan pengungkapan yang jujur lebih efektif daripada larangan atau detektor.', en: 'Agreed rules and honest disclosure work better than bans or detectors.' } },
  { id: 'e14', module: 'integritas', prompt: { id: 'Bukti terbaik bahwa siswa memahami karyanya sendiri adalah…', en: 'The best evidence that a student understands their own work is…' }, options: [{ id: 'Skor detektor AI yang rendah', en: 'A low AI-detector score' }, { id: 'Tulisan yang panjang', en: 'Long writing' }, { id: 'Ia dapat menjelaskan isinya dengan kata-katanya sendiri dan menunjukkan catatan prosesnya', en: 'They can explain it in their own words and show their process notes' }, { id: 'Tampilan yang rapi', en: 'A tidy layout' }], answer: 2, why: { id: 'Penjelasan lisan dan catatan proses menunjukkan pemahaman dan kontribusi.', en: 'An oral explanation and process notes show understanding and contribution.' } },
  { id: 'e15', module: 'asesmen', prompt: { id: 'Bagaimana sebaiknya laporan sekolah dipakai?', en: 'How should school reports be used?' }, options: [{ id: 'Untuk memeringkat siswa di depan kelas', en: 'To rank students in front of the class' }, { id: 'Untuk percakapan perbaikan dengan kepala sekolah dan orang tua', en: 'For improvement conversations with the head and parents' }, { id: 'Untuk menentukan kenaikan kelas', en: 'To decide grade promotion' }, { id: 'Tidak perlu dibaca', en: 'They need not be read' }], answer: 1, why: { id: 'Laporan untuk perbaikan pembelajaran, bukan memeringkat.', en: 'Reports are for improving learning, not ranking.' } },
]

/** Score exam answers (question id → chosen option index). Pure, for the endpoint and tests. */
export function scoreExam(answers: Record<string, unknown>) {
  const results = EXAM.map((q) => ({ id: q.id, module: q.module, correct: Number(answers[q.id]) === q.answer && answers[q.id] !== null && answers[q.id] !== '' }))
  const correct = results.filter((r) => r.correct).length
  const score = correct / EXAM.length
  const weakModules = [...new Set(results.filter((r) => !r.correct).map((r) => r.module))]
  return { correct, total: EXAM.length, score, passed: correct >= passCount(EXAM.length), results, weakModules }
}

/** The exam as sent to the browser: no answers, no explanations. */
export const examForClient = (locale: 'id' | 'en') => EXAM.map((q) => ({ id: q.id, prompt: q.prompt[locale], options: q.options.map((o) => o[locale]) }))

export const moduleByKey = (key: string) => COURSE_MODULES.find((m) => m.key === key)
