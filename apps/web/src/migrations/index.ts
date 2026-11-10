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
import * as migration_20261109_172648_analytics from './20261109_172648_analytics';
import * as migration_20261109_223128_notifications_reports from './20261109_223128_notifications_reports';
import * as migration_20261109_224354_public_site from './20261109_224354_public_site';
import * as migration_20261110_000448_gamification from './20261110_000448_gamification';
import * as migration_20261110_001722_ailis_integrity from './20261110_001722_ailis_integrity';
import * as migration_20261110_002822_double_marking from './20261110_002822_double_marking';
import * as migration_20261110_003906_ai_suggestions from './20261110_003906_ai_suggestions';
import * as migration_20261110_005659_proctor_assignment from './20261110_005659_proctor_assignment';
import * as migration_20261110_034050_platform_ops from './20261110_034050_platform_ops';
import * as migration_20261110_040704_certificates_booking from './20261110_040704_certificates_booking';
import * as migration_20261110_045609_parents_announcements from './20261110_045609_parents_announcements';
import * as migration_20261110_060908_school_reports_data_rights from './20261110_060908_school_reports_data_rights';
import * as migration_20261110_091456_cms_workflow_help from './20261110_091456_cms_workflow_help';
import * as migration_20261110_161506_accommodations from './20261110_161506_accommodations';

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
    name: '20261109_171317_payments_placeholder',
  },
  {
    up: migration_20261109_172648_analytics.up,
    down: migration_20261109_172648_analytics.down,
    name: '20261109_172648_analytics',
  },
  {
    up: migration_20261109_223128_notifications_reports.up,
    down: migration_20261109_223128_notifications_reports.down,
    name: '20261109_223128_notifications_reports',
  },
  {
    up: migration_20261109_224354_public_site.up,
    down: migration_20261109_224354_public_site.down,
    name: '20261109_224354_public_site',
  },
  {
    up: migration_20261110_000448_gamification.up,
    down: migration_20261110_000448_gamification.down,
    name: '20261110_000448_gamification',
  },
  {
    up: migration_20261110_001722_ailis_integrity.up,
    down: migration_20261110_001722_ailis_integrity.down,
    name: '20261110_001722_ailis_integrity',
  },
  {
    up: migration_20261110_002822_double_marking.up,
    down: migration_20261110_002822_double_marking.down,
    name: '20261110_002822_double_marking',
  },
  {
    up: migration_20261110_003906_ai_suggestions.up,
    down: migration_20261110_003906_ai_suggestions.down,
    name: '20261110_003906_ai_suggestions',
  },
  {
    up: migration_20261110_005659_proctor_assignment.up,
    down: migration_20261110_005659_proctor_assignment.down,
    name: '20261110_005659_proctor_assignment',
  },
  {
    up: migration_20261110_034050_platform_ops.up,
    down: migration_20261110_034050_platform_ops.down,
    name: '20261110_034050_platform_ops',
  },
  {
    up: migration_20261110_040704_certificates_booking.up,
    down: migration_20261110_040704_certificates_booking.down,
    name: '20261110_040704_certificates_booking',
  },
  {
    up: migration_20261110_045609_parents_announcements.up,
    down: migration_20261110_045609_parents_announcements.down,
    name: '20261110_045609_parents_announcements',
  },
  {
    up: migration_20261110_060908_school_reports_data_rights.up,
    down: migration_20261110_060908_school_reports_data_rights.down,
    name: '20261110_060908_school_reports_data_rights',
  },
  {
    up: migration_20261110_091456_cms_workflow_help.up,
    down: migration_20261110_091456_cms_workflow_help.down,
    name: '20261110_091456_cms_workflow_help',
  },
  {
    up: migration_20261110_161506_accommodations.up,
    down: migration_20261110_161506_accommodations.down,
    name: '20261110_161506_accommodations'
  },
];
