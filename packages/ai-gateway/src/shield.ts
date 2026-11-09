/**
 * Safety Shield: detects personal data in text before it reaches an AI model (spec D3).
 * Patterns are tuned for Indonesia. It errs on the side of caution; the student is told why.
 */
export type ShieldKind = 'phone' | 'email' | 'nik' | 'secret' | 'address' | 'card'

export interface ShieldFinding {
  kind: ShieldKind
  match: string
}

const PATTERNS: { kind: ShieldKind; re: RegExp }[] = [
  // Indonesian mobile numbers: 08…, +62 8…, 62 8…, with optional spaces or dashes
  { kind: 'phone', re: /(?:\+62|62|0)[\s-]?8[1-9](?:[\s-]?\d){6,10}\b/g },
  { kind: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  // NIK (KTP number): 16 digits
  { kind: 'nik', re: /\b\d{16}\b/g },
  // Payment card numbers: 13–19 digits in groups
  { kind: 'card', re: /\b(?:\d[ -]?){13,19}\b/g },
  // Passwords, PINs and one-time codes followed by a value
  { kind: 'secret', re: /\b(?:password|kata ?sandi|sandi|pin|otp|kode verifikasi)\b\s*(?:saya|ku|nya)?\s*(?:adalah|is|:|=)?\s*\S{3,}/gi },
  // Street addresses: Jl./Jalan + name, or RT/RW numbers
  // Street names are capitalised ("Jl. Merdeka", "Jalan Sudirman"); "jalan pintas" (shortcut) is not an address.
  { kind: 'address', re: /\b(?:[Jj]l\.?|[Jj]alan)\s+[A-Z][A-Za-z.]+(?:\s+[A-Z0-9][A-Za-z0-9.]*)*(?:\s+[Nn]o\.?\s*\d+)?/g },
  { kind: 'address', re: /\bRT\s*\.?\s*\d{1,3}\s*\/\s*RW\s*\.?\s*\d{1,3}\b/gi },
]

export function scanPersonalData(text: string): ShieldFinding[] {
  const found: ShieldFinding[] = []
  const seen = new Set<string>()
  for (const { kind, re } of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const match = m[0].trim()
      // Card-shaped numbers that are really a phone number or NIK already found are not reported twice.
      if (kind === 'card') {
        const digits = match.replace(/\D/g, '')
        if (found.some((f) => (f.kind === 'phone' || f.kind === 'nik') && f.match.replace(/\D/g, '').includes(digits.slice(-10)))) continue
      }
      const key = `${kind}:${kind === 'nik' ? match : match.toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        found.push({ kind, match })
      }
    }
  }
  return found
}

export function redactPersonalData(text: string): string {
  let out = text
  for (const f of scanPersonalData(text)) out = out.split(f.match).join(`[${f.kind}]`)
  return out
}

export const SHIELD_MESSAGES: Record<ShieldKind, { id: string; en: string }> = {
  phone: { id: 'nomor telepon', en: 'a phone number' },
  email: { id: 'alamat email', en: 'an email address' },
  nik: { id: 'nomor NIK/KTP', en: 'an ID card (NIK) number' },
  card: { id: 'nomor kartu', en: 'a card number' },
  secret: { id: 'kata sandi, PIN, atau kode OTP', en: 'a password, PIN or one-time code' },
  address: { id: 'alamat rumah', en: 'a home address' },
}
