/**
 * AI gateway — the only path from the platform to an AI model (spec: Tech stack > AI, D1–D5).
 * Every call goes through: quota → Safety Shield (personal data) → content check → model →
 * output check → log. Providers are swappable; a mock provider runs when no API key is set.
 */
export * from './shield'
export * from './moderation'
export * from './gateway'
export * from './providers'
export * from './rubric'
