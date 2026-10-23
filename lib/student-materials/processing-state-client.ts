import type { StudentMaterialProcessingState } from '@/app/dashboard/materiales/actions';

/** Lectura autenticada del estado, sin depender de respuestas RSC. */
export async function fetchStudentMaterialProcessingState(
  materialId: string
): Promise<StudentMaterialProcessingState | null> {
  const response = await fetch(
    `/api/student-materials/${encodeURIComponent(materialId)}/processing-state`,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No pudimos actualizar el PDF (HTTP ${response.status}).`);
  const data = await response.json() as { state?: StudentMaterialProcessingState | null };
  return data.state ?? null;
}
