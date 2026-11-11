'use client'
import { useState } from 'react'
import { FEED_TOPICS } from './challenges'
import { feedFor, variety, watchTopic } from './logic'

const start = () => Object.fromEntries(FEED_TOPICS.map((t) => [t.key, 1])) as Record<string, number>

/** Recommendation feed: watch videos and see the feed narrow into a bubble, then break out of it. */
export function FeedSim({ locale }: { locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [weights, setWeights] = useState(start)
  const [watched, setWatched] = useState(0)
  const feed = feedFor(weights, 6)
  const v = variety(feed, FEED_TOPICS.length)
  const topic = (k: string) => FEED_TOPICS.find((t) => t.key === k)!
  const bubble = v <= 0.34 && watched >= 4
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xl font-bold">{id ? 'Gelembung rekomendasi' : 'The recommendation bubble'}</h2>
      <p className="text-muted">{id ? 'Aplikasi video menebak apa yang kamu suka dari apa yang kamu tonton. Tonton beberapa video dan perhatikan berandamu berubah.' : 'Video apps guess what you like from what you watch. Watch a few videos and see how your feed changes.'}</p>
      <div>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{id ? 'Beranda kamu' : 'Your feed'}</span>
          <span>{id ? 'Keragaman' : 'Variety'}: {Math.round(v * 100)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-line" aria-hidden><div className={`h-full rounded-full ${bubble ? 'bg-danger' : 'bg-ok'}`} style={{ width: `${v * 100}%` }} /></div>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {feed.map((k, i) => (
            <li key={`${k}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  setWeights(watchTopic(weights, k))
                  setWatched(watched + 1)
                }}
                className="flex w-full flex-col items-start rounded-xl border border-line p-3 text-left hover:border-ink"
              >
                <span className="text-2xl" aria-hidden>{topic(k).icon}</span>
                <span className="text-sm font-medium">{id ? 'Video' : 'Video'}: {topic(k).name[locale]}</span>
                <span className="text-xs text-muted">{id ? 'Tonton' : 'Watch'} ▶</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {bubble && (
        <div role="status" className="rounded-xl bg-danger/5 p-3 text-sm">
          <p className="font-semibold">{id ? 'Kamu masuk gelembung!' : 'You are in a bubble!'}</p>
          <p className="mt-1">{id ? 'Berandamu kini hampir hanya satu jenis video. Algoritme tidak jahat; ia hanya mengejar apa yang membuatmu terus menonton. Akibatnya, kamu jarang melihat hal baru atau pendapat yang berbeda.' : 'Your feed is now almost one kind of video. The algorithm is not evil; it just chases what keeps you watching. As a result you rarely see new things or different opinions.'}</p>
          <p className="mt-2 font-semibold">{id ? 'Keluar dari gelembung:' : 'Break out:'}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {FEED_TOPICS.filter((t) => !feed.includes(t.key)).map((t) => (
              <button key={t.key} type="button" className="rounded-full border border-ink px-3 py-1" onClick={() => setWeights(watchTopic(weights, t.key, 6))}>
                {id ? 'Cari' : 'Search'} {t.icon} {t.name[locale]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted">{id ? `${watched} video ditonton` : `${watched} videos watched`}</span>
        <button type="button" className="underline" onClick={() => { setWeights(start()); setWatched(0) }}>{id ? 'Ulangi' : 'Start again'}</button>
      </div>
      <p className="text-xs text-muted">{id ? 'Diskusikan: kapan gelembung seperti ini merugikan? Apa yang bisa kamu atur di aplikasi yang kamu pakai?' : 'Discuss: when does a bubble like this cause harm? What can you change in the apps you use?'}</p>
    </section>
  )
}
