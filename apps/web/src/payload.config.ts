import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Schools } from './collections/Schools'
import { Classes } from './collections/Classes'
import { Tracks } from './collections/Tracks'
import { Units } from './collections/Units'
import { Lessons } from './collections/Lessons'
import { Media } from './collections/Media'
import { ConsentRequests } from './collections/ConsentRequests'
import { LessonProgress } from './collections/LessonProgress'
import { TestItems } from './collections/TestItems'
import { TestForms } from './collections/TestForms'
import { TestAttempts } from './collections/TestAttempts'
import { AiActivities } from './collections/AiActivities'
import { AiConversations } from './collections/AiConversations'
import { Assignments } from './collections/Assignments'
import { ProjectBriefs } from './collections/ProjectBriefs'
import { Submissions } from './collections/Submissions'
import { Orders } from './collections/Orders'
import { AnalyticsEvents } from './collections/AnalyticsEvents'
import { Notifications } from './collections/Notifications'
import { Reports } from './collections/Reports'
import { Pages } from './collections/Pages'
import { PilotRequests } from './collections/PilotRequests'
import { SiteSettings } from './globals/SiteSettings'
import { Badges, Challenges, GamificationSettings, UserBadges, XpEvents } from './collections/gamification'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useS3 = Boolean(process.env.S3_BUCKET)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · AI Literacy Admin' },
  },
  collections: [Users, Schools, Classes, ConsentRequests, Tracks, Units, Lessons, LessonProgress, Media, TestItems, TestForms, TestAttempts, AiActivities, AiConversations, Assignments, ProjectBriefs, Submissions, Orders, AnalyticsEvents, Notifications, Reports, Pages, PilotRequests, XpEvents, Badges, UserBadges, Challenges],
  globals: [SiteSettings, GamificationSettings],
  editor: lexicalEditor(),
  localization: {
    locales: [
      { code: 'id', label: 'Bahasa Indonesia' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'id',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    // Dev uses schema push; staging/production run committed migrations on boot.
    push: process.env.NODE_ENV !== 'production',
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: useS3,
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT),
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
