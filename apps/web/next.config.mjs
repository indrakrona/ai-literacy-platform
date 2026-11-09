import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@ailit/shared'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
