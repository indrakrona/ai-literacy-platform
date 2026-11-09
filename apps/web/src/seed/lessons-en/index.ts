import type { EnLesson } from './types'
import { EN_SMP_1 } from './smp-1'
import { EN_SMP_2 } from './smp-2'
import { EN_SMP_3 } from './smp-3'
import { EN_SMA_1 } from './sma-1'
import { EN_SMA_2 } from './sma-2'
import { EN_SMA_3 } from './sma-3'

/** English versions of the written lessons, keyed "trackSlug:order". */
export const EN_LESSONS: Record<string, EnLesson> = { ...EN_SMP_1, ...EN_SMP_2, ...EN_SMP_3, ...EN_SMA_1, ...EN_SMA_2, ...EN_SMA_3 }
