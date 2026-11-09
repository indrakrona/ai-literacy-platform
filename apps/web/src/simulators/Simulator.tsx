import { DECKS } from './data'
import { DataTrainerSim } from './DataTrainerSim'
import { PromptRobotSim } from './PromptRobotSim'
import { SortingSim } from './SortingSim'
import type { SimulatorKey } from './options'

export function Simulator({ name, locale }: { name: string; locale: 'id' | 'en' }) {
  switch (name as SimulatorKey) {
    case 'shield-sort':
    case 'program-vs-ai':
      return <SortingSim deck={DECKS[name as 'shield-sort' | 'program-vs-ai']} locale={locale} />
    case 'data-trainer':
      return <DataTrainerSim locale={locale} />
    case 'fair-data':
      return <DataTrainerSim locale={locale} fairness />
    case 'prompt-builder':
      return <PromptRobotSim locale={locale} />
    default:
      return null
  }
}
