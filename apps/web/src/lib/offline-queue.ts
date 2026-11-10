/**
 * Answers waiting to reach the server while a test-taker is offline. Kept per attempt in browser
 * storage so a reload or a dropped connection never loses work. Only the latest answer per item is kept.
 */
export interface QueuedAnswer {
  itemId: number
  selected?: number[]
  text?: string
  /** Device time the answer was given; the server accepts it after the deadline only if this is before it. */
  queuedAt: string
}

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const key = (attemptId: number) => `ailis-pending-${attemptId}`

export function readQueue(store: KeyValueStore | undefined, attemptId: number): Record<string, QueuedAnswer> {
  try {
    const raw = store?.getItem(key(attemptId))
    const v = raw ? (JSON.parse(raw) as Record<string, QueuedAnswer>) : {}
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function write(store: KeyValueStore | undefined, attemptId: number, q: Record<string, QueuedAnswer>) {
  try {
    if (!store) return
    if (Object.keys(q).length) store.setItem(key(attemptId), JSON.stringify(q))
    else store.removeItem(key(attemptId))
  } catch {
    /* storage full or blocked: the in-memory copy still retries */
  }
}

export function enqueue(store: KeyValueStore | undefined, attemptId: number, a: QueuedAnswer) {
  const q = readQueue(store, attemptId)
  q[String(a.itemId)] = { ...q[String(a.itemId)], ...a }
  write(store, attemptId, q)
  return q
}

export function dequeue(store: KeyValueStore | undefined, attemptId: number, itemId: number, queuedAt: string) {
  const q = readQueue(store, attemptId)
  // Only remove if nothing newer was queued for this item while the request was in flight.
  if (q[String(itemId)]?.queuedAt === queuedAt) delete q[String(itemId)]
  write(store, attemptId, q)
  return q
}

/** Send every queued answer; returns how many are still waiting. `send` resolves true when the server stored it. */
export async function flush(store: KeyValueStore | undefined, attemptId: number, send: (a: QueuedAnswer) => Promise<boolean>): Promise<number> {
  for (const a of Object.values(readQueue(store, attemptId))) {
    if (await send(a)) dequeue(store, attemptId, a.itemId, a.queuedAt)
  }
  return Object.keys(readQueue(store, attemptId)).length
}
