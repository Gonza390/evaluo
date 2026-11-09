import { trackMarketingEvent } from '@/lib/marketing-analytics';

/**
 * Etapas en las que puede fallar la subida de un material.
 * - too_large: el archivo supera el tamaño máximo (se rechaza antes de subir).
 * - pre_signup_page_limit: el PDF elegido en una landing supera el límite de páginas
 *   (se avisa antes del registro, no llega a subirse).
 * - draft_restore: no se pudo recuperar el PDF elegido antes del registro.
 * - page_limit / plan_limit: reglas del plan, devueltas por el servidor.
 * - prepare / transfer / finalize: pasos técnicos de la subida.
 */
export type UploadFailureStage =
  | 'too_large'
  | 'pre_signup_page_limit'
  | 'draft_restore'
  | 'page_limit'
  | 'plan_limit'
  | 'prepare'
  | 'transfer'
  | 'finalize';

export type UploadFailureDetails = {
  stage: UploadFailureStage;
  source: string;
  fileSizeBytes?: number | null;
  pageCount?: number | null;
  maxPages?: number | null;
  flow?: 'draft_resume' | 'manual' | 'landing';
  location?: string;
  message?: string | null;
};

/** Mensajes del servidor pueden traer datos del archivo: se guarda un resumen corto. */
function shortMessage(message: string | null | undefined) {
  const value = typeof message === 'string' ? message.trim() : '';
  return value ? value.slice(0, 160) : null;
}

export function trackUploadFailure(details: UploadFailureDetails) {
  try {
    trackMarketingEvent('pdf_upload_failed', {
      stage: details.stage,
      source: details.source,
      flow: details.flow ?? null,
      location: details.location ?? null,
      file_size_bytes: details.fileSizeBytes ?? null,
      page_count: details.pageCount ?? null,
      max_pages: details.maxPages ?? null,
      error_message: shortMessage(details.message),
    });
  } catch {
    // La analítica nunca debe romper el flujo de subida.
  }
}
