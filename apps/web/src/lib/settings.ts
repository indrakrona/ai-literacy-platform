import type { Payload } from 'payload'

export interface PlatformSwitches {
  signupsOpen: boolean
  aiLabEnabled: boolean
  testsEnabled: boolean
  projectsEnabled: boolean
  studentDailyMessages: number
  schoolDailyTokens: number
  dailyAiBudgetUsd: number
  maintenanceMessage: string | null
}

export const DEFAULT_SWITCHES: PlatformSwitches = {
  signupsOpen: true,
  aiLabEnabled: true,
  testsEnabled: true,
  projectsEnabled: true,
  studentDailyMessages: 60,
  schoolDailyTokens: 400_000,
  dailyAiBudgetUsd: 20,
  maintenanceMessage: null,
}

/** Feature switches and limits from Operations › Platform settings, with safe defaults. */
export async function getSwitches(payload: Payload, locale: 'id' | 'en' = 'id'): Promise<PlatformSwitches> {
  const g = await payload.findGlobal({ slug: 'platform-settings', locale, fallbackLocale: 'id', overrideAccess: true }).catch(() => null)
  if (!g) return DEFAULT_SWITCHES
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d)
  return {
    signupsOpen: bool(g.signupsOpen, true),
    aiLabEnabled: bool(g.aiLabEnabled, true),
    testsEnabled: bool(g.testsEnabled, true),
    projectsEnabled: bool(g.projectsEnabled, true),
    studentDailyMessages: num(g.studentDailyMessages, 60),
    schoolDailyTokens: num(g.schoolDailyTokens, 400_000),
    dailyAiBudgetUsd: num(g.dailyAiBudgetUsd, 20),
    maintenanceMessage: g.maintenanceMessage?.trim() || null,
  }
}
