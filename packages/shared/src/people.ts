/** Age of majority in Indonesia for data-protection consent purposes (UU PDP): under 18 needs a guardian. */
export const ADULT_AGE = 18

/** Version of the consent text shown to guardians; bump when the privacy notice changes. */
export const CONSENT_VERSION = '2026-11-v1'

export type ConsentStatus = 'not_required' | 'pending' | 'granted' | 'declined'

/** Whole years between dateOfBirth and `on` (default today), using calendar dates only. */
export function ageOn(dateOfBirth: string | Date, on: Date = new Date()): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  if (Number.isNaN(dob.getTime())) throw new Error('Invalid date of birth')
  let age = on.getUTCFullYear() - dob.getUTCFullYear()
  const beforeBirthday =
    on.getUTCMonth() < dob.getUTCMonth() ||
    (on.getUTCMonth() === dob.getUTCMonth() && on.getUTCDate() < dob.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export function needsGuardianConsent(dateOfBirth: string | Date, on: Date = new Date()): boolean {
  return ageOn(dateOfBirth, on) < ADULT_AGE
}

/** Full platform access (AI Lab, projects, tests) needs consent to be granted or not required. */
export function hasFullAccess(user: { consentStatus?: string | null } | null | undefined): boolean {
  return user?.consentStatus === 'not_required' || user?.consentStatus === 'granted'
}

/**
 * Normalise an Indonesian phone number to international digits for WhatsApp, e.g.
 * "0812-3456-7890" → "6281234567890", "+62 812 3456 7890" → "6281234567890".
 * Returns null if it does not look like a valid Indonesian mobile number.
 */
export function normalizeIdPhone(input: string | null | undefined): string | null {
  if (!input) return null
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  else if (digits.startsWith('8')) digits = '62' + digits
  if (!digits.startsWith('628')) return null
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}
