import Link from 'next/link'

// Placeholder home page. The real public site is built in task A1/A2/A7/A8.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-semibold tracking-widest text-brand-deep uppercase">Impact Thinklab</p>
      <h1 className="text-4xl font-bold sm:text-5xl">AI Literacy Platform</h1>
      <p className="text-lg text-neutral-700">
        Platform literasi AI untuk siswa SMP dan SMA/SMK. Sedang dalam pengembangan.
      </p>
      <Link href="/admin" className="w-fit rounded-xl bg-ink px-5 py-3 font-semibold text-paper">
        Admin
      </Link>
    </main>
  )
}
