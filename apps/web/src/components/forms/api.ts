/** Small fetch helper for the platform's REST API (same origin, cookie auth). */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: boolean; status: number; data: T & { error?: string; errors?: { message: string }[] } }> {
  const res = await fetch(path, {
    method: init.method ?? 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  let data: any = {}
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  return { ok: res.ok, status: res.status, data }
}

export function errorText(data: { error?: string; errors?: { message: string }[] }, fallback: string): string {
  return data.error || data.errors?.[0]?.message || fallback
}
