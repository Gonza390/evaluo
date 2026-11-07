/**
 * Contrato comercial del nuevo Free. Sólo se activa tras desplegar a producción.
 * Ningún preview de master ni entorno local aplica cupos v2.
 * Requiere el rollout explícito (migración aplicada) para evitar fallos parciales.
 */
export const FREE_STUDY_V2 = Object.freeze({
  /** 1 apunte nuevo por mes calendario (hora de Argentina). */
  materialsPerMonth: 1,
  maxPdfPages: 100,
  maxDocxChars: 150_000,
  multipleChoice: 12,
  trueFalse: 10,
  matchingRounds: 1,
  matchingPairs: 6,
  cases: 2,
  flashcards: 25,
  simulatorSessions: 1,
  simulatorQuestions: 20,
  /** 1 ronda de Completar y 1 de Mixto por cuenta (Mixto no descuenta otros cupos). */
  completeRounds: 1,
  mixedRounds: 1,
  studyPlans: 1,
});

/** Exige un despliegue real de producción, no NODE_ENV=production (también en previews). */
export function isFreeStudyV2Active() {
  return process.env.VERCEL_ENV === 'production' && process.env.FREE_STUDY_V2_ENABLED === '1';
}

export function appliesFreeStudyV2(isPremium: boolean) {
  return isFreeStudyV2Active() && !isPremium;
}

/** El cupo no se renueva: sólo pagar Premium desbloquea contenido nuevo. */
export function freeStudyV2Remaining(used: number, limit: number) {
  return Math.max(0, limit - Math.max(0, Math.floor(used)));
}

const FREE_UPLOAD_TIME_ZONE = 'America/Argentina/Buenos_Aires';

/** Año y mes (1-12) del cupo Free de apuntes, en hora de Argentina. */
function argentinaYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: FREE_UPLOAD_TIME_ZONE, year: 'numeric', month: 'numeric',
  }).formatToParts(now);
  return {
    year: Number(parts.find(part => part.type === 'year')?.value),
    month: Number(parts.find(part => part.type === 'month')?.value),
  };
}

/** Mes del cupo como 'YYYY-MM-01' (coincide con free_study_v2_upload_period()). */
export function freeUploadPeriod(now = new Date()): string {
  const { year, month } = argentinaYearMonth(now);
  return year + '-' + String(month).padStart(2, '0') + '-01';
}

/** Instante en que se libera el próximo apunte gratis: día 1 a las 00:00 de Argentina (UTC-3). */
export function nextFreeUploadAt(now = new Date()): Date {
  const { year, month } = argentinaYearMonth(now);
  return new Date(Date.UTC(month === 12 ? year + 1 : year, month % 12, 1, 3, 0, 0));
}
