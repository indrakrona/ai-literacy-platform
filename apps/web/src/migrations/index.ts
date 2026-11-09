import * as migration_20261109_113456_initial from './20261109_113456_initial';
import * as migration_20261109_115445_accounts_consent from './20261109_115445_accounts_consent';
import * as migration_20261109_131241_lesson_competencies from './20261109_131241_lesson_competencies';
import * as migration_20261109_133955_lesson_progress from './20261109_133955_lesson_progress';
import * as migration_20261109_134657_lesson_quiz from './20261109_134657_lesson_quiz';
import * as migration_20261109_152702_lesson_simulator from './20261109_152702_lesson_simulator';
import * as migration_20261109_153457_ailis_engine from './20261109_153457_ailis_engine';
import * as migration_20261109_155157_ai_lab from './20261109_155157_ai_lab';
import * as migration_20261109_155811_assignments from './20261109_155811_assignments';
import * as migration_20261109_162135_projects from './20261109_162135_projects';
import * as migration_20261109_171317_payments_placeholder from './20261109_171317_payments_placeholder';

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
    name: '20261109_152702_lesson_simulator',
  },
  {
    up: migration_20261109_153457_ailis_engine.up,
    down: migration_20261109_153457_ailis_engine.down,
    name: '20261109_153457_ailis_engine',
  },
  {
    up: migration_20261109_155157_ai_lab.up,
    down: migration_20261109_155157_ai_lab.down,
    name: '20261109_155157_ai_lab',
  },
  {
    up: migration_20261109_155811_assignments.up,
    down: migration_20261109_155811_assignments.down,
    name: '20261109_155811_assignments',
  },
  {
    up: migration_20261109_162135_projects.up,
    down: migration_20261109_162135_projects.down,
    name: '20261109_162135_projects',
  },
  {
    up: migration_20261109_171317_payments_placeholder.up,
    down: migration_20261109_171317_payments_placeholder.down,
    name: '20261109_171317_payments_placeholder'
  },
];
