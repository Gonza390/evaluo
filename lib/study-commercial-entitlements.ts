/**
 * Contrato técnico de Premium vigente al preparar Free V2.
 *
 * Premium no utiliza los cupos de ejercicios ni el material único de Free V2.
 * Se mantienen los límites operativos existentes para controlar costo de IA,
 * evitar cargas simultáneas y proteger la cuenta gratuita de infraestructura.
 * No cambiar esta política sin revisar ambos flujos de carga y pagos.
 */
export const PREMIUM_STUDY_LIMITS = Object.freeze({
  materialsPerUtcDay: 3,
  maxSimultaneousProcessing: 1,
});

export const PREMIUM_STUDY_ACCESS = Object.freeze({
  freeLifetimeUploadQuotaApplies: false,
  freeMultipleChoiceQuotaApplies: false,
  freeTrueFalseQuotaApplies: false,
  freeMatchingQuotaApplies: false,
  freeCasesQuotaApplies: false,
  freeFlashcardsQuotaApplies: false,
  freeSimulatorQuotaApplies: false,
  freeStudyPlanCreationQuotaApplies: false,
  mindMapIncluded: true,
});
