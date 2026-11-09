import { randomBytes } from 'crypto'

/** URL-safe random token for consent links and invites. */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
}
