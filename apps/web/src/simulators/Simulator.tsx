import { DECKS } from './data'
import { DataTrainerSim } from './DataTrainerSim'
import { PromptRobotSim } from './PromptRobotSim'
import { SortingSim } from './SortingSim'
import type { SimulatorKey } from './options'
import { AI_OR_HUMAN, BIAS_FIX, PROMPT_BATTLE } from './challenges'
import { HuntSim } from './HuntSim'
import { ChoiceSim } from './ChoiceSim'
import { FeedSim } from './FeedSim'

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
    case 'ai-or-human':
      return <SortingSim deck={AI_OR_HUMAN} locale={locale} />
    case 'hallucination-hunt':
      return <HuntSim locale={locale} />
    case 'prompt-battle':
      return (
        <ChoiceSim
          title={{ id: 'Adu perintah (prompt battle)', en: 'Prompt battle' }}
          intro={{ id: 'Dua perintah untuk tujuan yang sama. Pilih yang lebih baik, lalu lihat jawaban yang dihasilkan masing-masing.', en: 'Two prompts for the same goal. Pick the better one, then see the reply each one gets.' }}
          rounds={PROMPT_BATTLE}
          showOutputs
          locale={locale}
        />
      )
    case 'bias-fix':
      return (
        <ChoiceSim
          title={{ id: 'Perbaiki jawaban yang bias', en: 'Fix the biased output' }}
          intro={{ id: 'AI meniru pola dalam data latihnya, termasuk stereotip. Pilih cara terbaik untuk memperbaikinya.', en: 'AI copies patterns in its training data, including stereotypes. Choose the best way to fix it.' }}
          rounds={BIAS_FIX}
          locale={locale}
        />
      )
    case 'feed-bubble':
      return <FeedSim locale={locale} />
    default:
      return null
  }
}
