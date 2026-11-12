/**
 * The site's public address, read at request time. SERVER_URL is the run-time setting (docker-compose sets it
 * from PUBLIC_URL); Next.js never bakes un-prefixed variables into the build, so one image works at any address.
 * NEXT_PUBLIC_SERVER_URL is the fallback for `pnpm dev`, where both are the same.
 */
export function siteUrl(): string {
  return (process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')
}
