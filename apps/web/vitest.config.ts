import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@payload-config': path.resolve(__dirname, 'src/payload.config.ts') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      DATABASE_URI: process.env.TEST_DATABASE_URI || 'postgres://ailit:ailit@127.0.0.1:5432/ailit_test',
      PAYLOAD_SECRET: 'test-secret-0123456789abcdef',
    },
    fileParallelism: false,
  },
})
