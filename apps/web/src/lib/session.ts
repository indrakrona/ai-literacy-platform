import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function getPayloadClient() {
  return getPayload({ config })
}

/** The signed-in user for server components, or null. */
export async function getCurrentUser() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  // A suspended account loses access at once, even with a session cookie still valid.
  if (!user || (user as { suspended?: boolean }).suspended) return null
  return user
}
