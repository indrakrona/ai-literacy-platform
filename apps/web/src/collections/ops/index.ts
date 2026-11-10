import type { CollectionConfig, GlobalConfig } from 'payload'
import { hasRole } from '@ailit/shared'

const superAdmin = ({ req }: { req: { user?: unknown } }) => hasRole(req.user as { roles?: string[] }, 'super_admin')

/** Append-only audit log (spec N4). Nobody can edit or delete entries through the platform. */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: { group: 'Operations', defaultColumns: ['createdAt', 'actor', 'action', 'targetCollection', 'docId'], hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: { read: superAdmin, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: 'users', index: true },
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'targetCollection', label: 'Collection', type: 'text', index: true },
    { name: 'docId', label: 'Record', type: 'text', index: true },
    { name: 'summary', type: 'textarea' },
    { name: 'ip', type: 'text' },
  ],
}

/** Settings and feature switches (spec N2). Read by the platform on each request. */
export const PlatformSettings: GlobalConfig = {
  slug: 'platform-settings',
  label: 'Platform settings',
  admin: { group: 'Operations' },
  access: { read: () => true, update: superAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'signupsOpen', label: 'Self sign-up open', type: 'checkbox', defaultValue: true },
        { name: 'aiLabEnabled', label: 'AI Lab on', type: 'checkbox', defaultValue: true },
        { name: 'testsEnabled', label: 'AILIS tests on', type: 'checkbox', defaultValue: true },
        { name: 'projectsEnabled', label: 'Project submissions on', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'studentDailyMessages', label: 'AI messages per student per day', type: 'number', min: 0, defaultValue: 60 },
        { name: 'schoolDailyTokens', label: 'AI tokens per school per day', type: 'number', min: 0, defaultValue: 400000 },
        { name: 'dailyAiBudgetUsd', label: 'Platform AI budget per day (USD, alert only)', type: 'number', min: 0, defaultValue: 20 },
      ],
    },
    { name: 'maintenanceMessage', label: 'Banner for all users', type: 'textarea', localized: true, admin: { description: 'Shown at the top of every page while filled in, e.g. planned maintenance.' } },
  ],
}
