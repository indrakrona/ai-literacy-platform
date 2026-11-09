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
  return user ?? null
}
