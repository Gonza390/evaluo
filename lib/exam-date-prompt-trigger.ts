/**
 * Cada finalización de actividad emite un nonce que debe consultarse una sola vez.
 * El mismo componente puede reutilizarse para otro PDF, por eso la identidad
 * del material también forma parte de la señal.
 */
export type ExamDatePromptSignal = { materialId: string; nonce: number };

export function isNewExamDatePromptSignal(
  lastChecked: ExamDatePromptSignal | null,
  current: ExamDatePromptSignal
): boolean {
  if (!Number.isSafeInteger(current.nonce) || current.nonce <= 0) return false;
  if (lastChecked?.materialId !== current.materialId) return true;
  return current.nonce > (lastChecked?.nonce ?? 0);
}
