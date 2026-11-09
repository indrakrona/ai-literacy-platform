import * as migration_20261109_113456_initial from './20261109_113456_initial';
import * as migration_20261109_115445_accounts_consent from './20261109_115445_accounts_consent';
import * as migration_20261109_131241_lesson_competencies from './20261109_131241_lesson_competencies';

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
    name: '20261109_131241_lesson_competencies'
  },
];
