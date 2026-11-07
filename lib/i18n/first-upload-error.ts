import type { AppLocale } from './app-locale';

/**
 * Upload actions return a mixture of historical Spanish validation messages and
 * transient service errors. English students should never see raw server text.
 * Preserve the original message for Spanish users, and translate known errors
 * without changing authorization, quota rules, or backend behavior.
 */
export function firstUploadErrorMessage(message: string | null | undefined, locale: AppLocale): string {
  const original = typeof message === 'string' ? message.trim() : '';
  if (locale === 'es') return original || 'No pudimos subir el archivo. Intentá nuevamente.';
  const lower = original.toLocaleLowerCase('es');
  if (/sesi[oó]n|inici[aá] sesi[oó]n|unauthorized|no autenticad/.test(lower)) {
    return 'Your session has expired. Sign in again to upload your file.';
  }
  if (/ya usaste|material gratuito|pdfs gratuitos|cupo|l[ií]mite.*material|l[ií]mite.*pdf|upload limit/.test(lower)) {
    return 'You have reached your upload limit. You can keep studying existing materials or explore Premium.';
  }
  if (/20 mb|tama[nñ]o m[aá]ximo|excede.*tama[nñ]o|supera.*tama[nñ]o/.test(lower)) {
    return 'This file exceeds the 20 MB upload limit.';
  }
  if (/p[aá]gina|page.limit|pages.limit/.test(lower)) {
    return 'This PDF exceeds the supported page limit. Try a shorter document.';
  }
  if (/formato|tipo de archivo|tipo de material|no contiene un pdf v[aá]lido|no v[aá]lid|mime|firma/.test(lower)) {
    return 'This file could not be validated. Select a valid PDF or Word (.docx) document.';
  }
  if (/nombre.*pdf|nombre.*material|t[ií]tulo/.test(lower)) {
    return 'Please enter a valid title for your material.';
  }
  if (/materia seleccionada|carrera indicada|contexto acad[eé]mico/.test(lower)) {
    return 'We could not match this course selection. Try again without linking a course.';
  }
  return 'We could not upload your file. Please try again.';
}
