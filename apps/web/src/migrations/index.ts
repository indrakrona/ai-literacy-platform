import * as migration_20261109_113456_initial from './20261109_113456_initial';
import * as migration_20261109_115445_accounts_consent from './20261109_115445_accounts_consent';
import * as migration_20261109_131241_lesson_competencies from './20261109_131241_lesson_competencies';
import * as migration_20261109_133955_lesson_progress from './20261109_133955_lesson_progress';
import * as migration_20261109_134657_lesson_quiz from './20261109_134657_lesson_quiz';
import * as migration_20261109_152702_lesson_simulator from './20261109_152702_lesson_simulator';

export const migrations = [
  {
    up: migration_20261109_113456_initial.up,
    down: migration_20261109_113456_initial.down,
    name: '20261109_113456_initial',
  },
  {
    up: migration_20261109_115445_accounts_consent.up,
    down: migration_20261109_115445_accounts_consent.down,
    name: '20261109_115445_accounts_consent',
  },
  {
    up: migration_20261109_131241_lesson_competencies.up,
    down: migration_20261109_131241_lesson_competencies.down,
    name: '20261109_131241_lesson_competencies',
  },
  {
    up: migration_20261109_133955_lesson_progress.up,
    down: migration_20261109_133955_lesson_progress.down,
    name: '20261109_133955_lesson_progress',
  },
  {
    up: migration_20261109_134657_lesson_quiz.up,
    down: migration_20261109_134657_lesson_quiz.down,
    name: '20261109_134657_lesson_quiz',
  },
  {
    up: migration_20261109_152702_lesson_simulator.up,
    down: migration_20261109_152702_lesson_simulator.down,
    name: '20261109_152702_lesson_simulator'
  },
];
