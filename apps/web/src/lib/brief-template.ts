/**
 * Project brief template (spec F1): what a teacher fills in with a partner (school unit, community group or
 * small business) before students start, plus the shared 1–4 rubric for applied projects.
 */
type L = { id: string; en: string }

export const BRIEF_TEMPLATE_FIELDS: { key: string; label: L; hint: L; lines: number }[] = [
  { key: 'owner', label: { id: 'Pemilik masalah (mitra)', en: 'Problem owner (partner)' }, hint: { id: 'Nama usaha/unit, nama dan kontak penanggung jawab', en: 'Business or unit name, contact person and phone' }, lines: 2 },
  { key: 'problem', label: { id: 'Masalah yang ingin diselesaikan', en: 'The problem to solve' }, hint: { id: 'Ceritakan dengan bahasa sehari-hari: apa yang terjadi, seberapa sering, apa akibatnya', en: 'In everyday words: what happens, how often, and what it causes' }, lines: 4 },
  { key: 'affected', label: { id: 'Siapa yang terdampak', en: 'Who is affected' }, hint: { id: 'Pelanggan, warga, siswa, karyawan…', en: 'Customers, residents, students, staff…' }, lines: 2 },
  { key: 'success', label: { id: 'Seperti apa hasil yang berguna', en: 'What a useful result looks like' }, hint: { id: 'Apa yang akan Anda pakai jika proyek berhasil', en: 'What you would actually use if the project succeeds' }, lines: 3 },
  { key: 'deliverables', label: { id: 'Hasil yang diserahkan siswa', en: 'What students hand over' }, hint: { id: 'Contoh: prototipe, panduan satu halaman, laporan uji, presentasi', en: 'For example: a prototype, a one-page guide, a test report, a presentation' }, lines: 3 },
  { key: 'data', label: { id: 'Data yang boleh dipakai siswa', en: 'Data students may use' }, hint: { id: 'Sebutkan data yang boleh dibagikan. Data pribadi pelanggan/warga wajib disamarkan', en: 'List what may be shared. Personal data of customers or residents must be anonymised' }, lines: 2 },
  { key: 'limits', label: { id: 'Batasan dan larangan', en: 'Limits and things not allowed' }, hint: { id: 'Misalnya: tidak boleh menghubungi pelanggan langsung, tidak boleh memakai logo tanpa izin', en: 'For example: no contacting customers directly, no using the logo without permission' }, lines: 2 },
  { key: 'support', label: { id: 'Dukungan dari mitra', en: 'Partner support' }, hint: { id: 'Wawancara awal (30 menit), uji coba hasil, hadir atau memberi masukan saat presentasi', en: 'An initial interview (30 min), trying the result, attending or giving feedback at the presentation' }, lines: 2 },
  { key: 'timeline', label: { id: 'Jadwal', en: 'Timeline' }, hint: { id: 'Tanggal wawancara, uji coba, dan presentasi akhir (Demo Day)', en: 'Dates for the interview, testing and the final presentation (Demo Day)' }, lines: 2 },
]

/** The shared applied-project rubric with all four levels, so marks are comparable across schools and majors. */
export const APPLIED_RUBRIC_LEVELS: { criterion: L; levels: [L, L, L, L] }[] = [
  {
    criterion: { id: 'Analisis masalah', en: 'Problem analysis' },
    levels: [
      { id: 'Masalah ditebak tanpa bertanya kepada pemilik masalah.', en: 'The problem is guessed without asking the problem owner.' },
      { id: 'Masalah disebutkan, tetapi umum dan tanpa data.', en: 'The problem is named but vague, with no data.' },
      { id: 'Masalah dirumuskan dari wawancara; pihak yang terdampak disebutkan.', en: 'The problem is stated from an interview; those affected are named.' },
      { id: 'Masalah dirumuskan jelas dari data atau wawancara, termasuk akar masalah dan siapa yang terdampak.', en: 'The problem is stated clearly from data or interviews, including its root cause and who is affected.' },
    ],
  },
  {
    criterion: { id: 'Pemanfaatan AI yang tepat', en: 'Appropriate use of AI' },
    levels: [
      { id: 'AI mengerjakan hampir semuanya; siswa tidak dapat menjelaskan hasilnya.', en: 'AI did nearly everything; students cannot explain the result.' },
      { id: 'AI dipakai, tetapi tidak jelas mengapa atau bagian mana karya sendiri.', en: 'AI was used, but it is unclear why or which parts are the students’ own.' },
      { id: 'AI dipakai pada bagian yang cocok; pembagian kerja manusia–AI dicatat.', en: 'AI was used where it fits; the human–AI split of work is recorded.' },
      { id: 'AI dipakai dengan alasan yang kuat; siswa menunjukkan keputusan penting yang mereka ambil sendiri.', en: 'AI was used for good reasons; students show the key decisions they made themselves.' },
    ],
  },
  {
    criterion: { id: 'Pemeriksaan dan keamanan', en: 'Checking and safety' },
    levels: [
      { id: 'Hasil AI tidak diperiksa; ada data pribadi yang terbuka.', en: 'AI output was not checked; personal data was exposed.' },
      { id: 'Sebagian hasil diperiksa; risiko belum disebutkan.', en: 'Some output was checked; risks are not named.' },
      { id: 'Hasil diperiksa dengan sumber atau uji coba; data pribadi dilindungi.', en: 'Output was checked against sources or by testing; personal data is protected.' },
      { id: 'Pemeriksaan menyeluruh, kesalahan AI dicatat dan diperbaiki; risiko bias dan kesalahan beserta cara mengatasinya dijelaskan.', en: 'Thorough checking, with AI errors logged and fixed; risks of bias and error are explained with how they are handled.' },
    ],
  },
  {
    criterion: { id: 'Hasil dan komunikasi', en: 'Result and communication' },
    levels: [
      { id: 'Hasil belum dapat dipakai dan tidak diuji.', en: 'The result cannot be used yet and was not tested.' },
      { id: 'Hasil sebagian berfungsi; penyajian kurang runtut.', en: 'The result partly works; the presentation is hard to follow.' },
      { id: 'Hasil berfungsi dan diuji pada satu pengguna; penyajian jelas.', en: 'The result works and was tested with one user; the presentation is clear.' },
      { id: 'Pemilik masalah dapat langsung memakai hasilnya; diuji pada beberapa pengguna dan disajikan jujur tentang keterbatasannya.', en: 'The problem owner can use the result straight away; it was tested with several users and presented honestly about its limits.' },
    ],
  },
]
