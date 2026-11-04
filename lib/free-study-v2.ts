/**
 * Contrato comercial del nuevo Free. Sólo se activa tras desplegar a producción.
 * Ningún preview de master ni entorno local aplica cupos v2.
 */
export const FREE_STUDY_V2 = Object.freeze({
  materialsLifetime: 1,
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
  incorrectAnswerExplanations: 15,
  studyPlans: 1,
});

/** Exige un despliegue real de producción, no NODE_ENV=production (también en previews). */
export function isFreeStudyV2Active() {
  return process.env.VERCEL_ENV === 'production';
}

export function appliesFreeStudyV2(isPremium: boolean) {
  return isFreeStudyV2Active() && !isPremium;
}

/** El cupo no se renueva: sólo pagar Premium desbloquea contenido nuevo. */
export function freeStudyV2Remaining(used: number, limit: number) {
  return Math.max(0, limit - Math.max(0, Math.floor(used)));
}
