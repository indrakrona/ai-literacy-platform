/**
 * "Kegiatan utama" in Bahasa Indonesia for every session (the English planning notes are in curriculum-data.ts).
 * Shown on the lesson page, the lesson plan and the student worksheet. Keyed by trackSlug:order.
 */
const SMP = 'smp-ai-untuk-belajar-dan-integritas'
const SMA = 'sma-smk-membangun-dengan-ai'

export const ACTIVITIES_ID: Record<string, string> = {
  [`${SMP}:1`]: 'Tes awal dan jajak pendapat kelas: di mana saja kalian sudah memakai AI?',
  [`${SMP}:2`]: 'Simulator memilah: data apa yang aman dibagikan ke AI; ikrar menjaga data pribadi',
  [`${SMP}:3`]: 'Kelompokkan alat sehari-hari menjadi program biasa dan sistem AI',
  [`${SMP}:4`]: 'Temukan AI di aplikasi yang sering dipakai: rekomendasi, filter, dan peta',
  [`${SMP}:5`]: 'Bandingkan tugas yang membutuhkan kepedulian, pertimbangan, dan pengetahuan terkini manusia',
  [`${SMP}:6`]: 'Simulator pelatih data: tambahkan contoh dan amati keyakinan mesin berubah',
  [`${SMP}:7`]: 'Data latih yang berat sebelah menghasilkan keputusan tidak adil; perbaiki datanya',
  [`${SMP}:8`]: 'Tanyakan fakta lokal kepada AI, temukan jawaban yang keliru, lalu periksa dengan sumber tepercaya',
  [`${SMP}:9`]: 'Kenali tanda gambar dan suara buatan AI; latihan daftar periksa SIAPA',
  [`${SMP}:10`]: 'Latihan perintah yang tepat: tujuan, konteks, dan format',
  [`${SMP}:11`]: 'Minta AI menjelaskan topik yang sulit, lalu jelaskan kembali dengan kata-katamu sendiri',
  [`${SMP}:12`]: 'Buat teks pendek atau poster dengan AI dan tandai bagian karyamu sendiri',
  [`${SMP}:13`]: 'Studi kasus keputusan AI yang bias: siapa yang dirugikan dan apa yang perlu diubah',
  [`${SMP}:14`]: 'Susun kesepakatan kelas tentang pemakaian AI dan berlatih menyebutkan bantuan AI',
  [`${SMP}:15`]: 'Bagi satu tugas sekolah antara manusia dan AI, beserta alasannya',
  [`${SMP}:16`]: 'Studi kasus: peringatan dini banjir, deteksi penyakit tanaman, dan skrining kesehatan',
  [`${SMP}:17`]: 'Rancangan kelompok: masalah, data yang dibutuhkan, dan satu aturan keamanan',
  [`${SMP}:18`]: 'Presentasi rancangan kelompok dan tes akhir jalur',
  [`${SMA}:1`]: 'Tes awal; petakan peran AI dalam pekerjaan yang ingin kalian tekuni',
  [`${SMA}:2`]: 'Periksa data yang disimpan aplikasi dan layanan AI; tetapkan aturan data pribadi',
  [`${SMA}:3`]: 'Kelompokkan alat menurut fungsinya: aturan, prediksi, dan pembuatan konten',
  [`${SMA}:4`]: 'Bagaimana sistem rekomendasi membentuk beranda dan siapa yang diuntungkan',
  [`${SMA}:5`]: 'Tentukan keputusan yang harus tetap menjadi tanggung jawab manusia (penilaian, rekrutmen, kesehatan)',
  [`${SMA}:6`]: 'Latih pengklasifikasi sederhana; amati pengaruh data latih pada prediksi',
  [`${SMA}:7`]: 'Telusuri tiga kegagalan AI sampai ke data, rancangan, atau cara pakainya; usulkan perbaikan',
  [`${SMA}:8`]: 'Periksa jawaban AI dengan sumber; latihan mengenali deepfake',
  [`${SMA}:9`]: 'Peran, batasan, dan contoh dalam perintah; tantangan perintah antarkelompok',
  [`${SMA}:10`]: 'Riset satu topik dengan AI sambil mencatat penalaran sendiri',
  [`${SMA}:11`]: 'Bangun prototipe chatbot, kampanye, atau alat bantu; dokumentasikan prosesnya',
  [`${SMA}:12`]: 'Analisis bias menurut bahasa, daerah, dan gender; rancang pengamannya',
  [`${SMA}:13`]: 'Aturan di sekolah dan dunia kerja; cara mengungkapkan pemakaian AI dengan benar',
  [`${SMA}:14`]: 'Uraikan satu pekerjaan nyata menjadi tugas-tugas; tentukan AI atau manusia untuk masing-masing',
  [`${SMA}:15`]: 'Nilai satu produk AI Indonesia: manfaat, risiko, dan pihak yang terdampak',
  [`${SMA}:16`]: 'Kelompok menerima brief proyek; siswa SMK memakai brief sesuai jurusan',
  [`${SMA}:17`]: 'Bangun dan uji solusi dengan bantuan AI; ulasan antarkelompok',
  [`${SMA}:18`]: 'Presentasi kepada pemilik masalah; tes akhir jalur dan kesiapan AILIS',
}
