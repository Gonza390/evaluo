import type { AppLocale } from './app-locale';

/** Translate only Evaluo-generated exam suffixes; never rewrite student-entered subjects. */
export function localizeExamEventTitle(value: string, locale: AppLocale): string {
  if (locale === 'en') {
    return value
      .replace(/ - Parcial ([12])$/, ' - Exam $1')
      .replace(/ - Integrador$/, ' - Final exam');
  }
  return value
    .replace(/ - Exam ([12])$/, ' - Parcial $1')
    .replace(/ - Final exam$/, ' - Integrador');
}
