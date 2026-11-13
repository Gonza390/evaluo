import { fetchStudentMaterialSummary } from '@/lib/student-materials/persistence';
import type { AdminClient } from '@/lib/student-materials/types';
import { resolvePlanTopicScope, type PlanTopicScope } from './plan-topic-scope';

/**
 * Carga el alcance de un tema del plan para las rutas de generación con IA.
 * Devuelve `null` si el material no tiene resumen listo o el índice no existe;
 * quien llama debe responder 422 y nunca generar sobre todo el material.
 */
export async function loadPlanTopicScope(
  admin: AdminClient,
  materialId: string,
  topicIndex: number
): Promise<PlanTopicScope | null> {
  const summary = await fetchStudentMaterialSummary(admin, materialId);
  if (!summary || summary.status !== 'ready') return null;
  return resolvePlanTopicScope(summary.sections, topicIndex);
}
