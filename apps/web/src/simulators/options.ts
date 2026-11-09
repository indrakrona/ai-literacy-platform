/** Simulator keys, shared by the CMS (no React imports here). */
export const SIMULATOR_OPTIONS = [
  { value: 'shield-sort', label: 'Data Shield sorter' },
  { value: 'program-vs-ai', label: 'Program vs AI sorter' },
  { value: 'data-trainer', label: 'Data trainer' },
  { value: 'fair-data', label: 'Unbalanced data (fairness)' },
  { value: 'prompt-builder', label: 'Literal robot (prompt builder)' },
] as const

export type SimulatorKey = (typeof SIMULATOR_OPTIONS)[number]['value']

