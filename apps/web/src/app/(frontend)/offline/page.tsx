import Link from 'next/link'

/** Shown by the service worker when there is no connection and the page was not saved. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Kamu sedang offline · You are offline</h1>
      <p>Halaman ini belum disimpan di perangkatmu. Pelajaran yang sudah disimpan (tombol “Simpan semua sesi untuk dibaca offline” di halaman jalur belajar) tetap bisa dibuka.</p>
      <p className="text-muted">This page is not saved on your device. Lessons you saved (the “Save every session for offline reading” button on a track page) can still be opened.</p>
      <Link href="/belajar" className="font-semibold underline">Jalur belajar · Learning tracks</Link>
    </main>
  )
}
