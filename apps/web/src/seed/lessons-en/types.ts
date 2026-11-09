/**
 * English version of a written lesson. Quiz questions and options must be in the same order as the
 * Bahasa version: the English text is stored on the same rows, so the answer key is shared.
 */
export interface EnLesson {
  objective: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  quiz: { prompt: string; options: string[]; explanation: string }[]
}

export const SMP = 'smp-ai-untuk-belajar-dan-integritas'
export const SMA = 'sma-smk-membangun-dengan-ai'
export const qe = (prompt: string, options: string[], explanation: string) => ({ prompt, options, explanation })
