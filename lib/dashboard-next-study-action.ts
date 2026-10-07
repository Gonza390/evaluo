import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { MATERIAL_PRACTICE_FLOW_VERSION, SUMMARY_FLOW_VERSION } from '@/lib/analytics-events';
import { logError } from '@/lib/observability';
import type { StudentMaterial } from '@/lib/data/student-materials';

export type DashboardNextStudyAction = {
  kind: 'reinforce' | 'resume_practice' | 'start_practice' | 'continue_summary';
  materialId: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  pendingCount?: number;
};

type StudyEventRow = {
  event_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type PendingErrorRow = {
  id: string;
  student_material_id: string | null;
  topic: string | null;
  updated_at: string;
};

function materialIdFromEvent(row: StudyEventRow) {
  const value = row.metadata?.material_id;
  return typeof value === 'string' ? value : null;
}

function eventFlowVersion(row: StudyEventRow) {
  const value = row.metadata?.flow_version;
  return typeof value === 'string' ? value : null;
}

function timestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function newestByCreatedAt<T extends { created_at: string }>(rows: T[]) {
  return [...rows].sort((left, right) => timestamp(right.created_at) - timestamp(left.created_at))[0] ?? null;
}

function titleForMaterial(material: StudentMaterial) {
  const title = material.title?.trim();
  if (title) return title;
  const fileName = material.file_name?.trim();
  return fileName || 'tu PDF';
}

export async function getDashboardNextStudyAction(
  userId: string,
  materials: StudentMaterial[]
): Promise<DashboardNextStudyAction | null> {
  const readyMaterials = materials.filter((material) => material.processing_status === 'ready');
  if (readyMaterials.length === 0) return null;

  const readyById = new Map(readyMaterials.map((material) => [material.id, material]));
  const readyIds = readyMaterials.map((material) => material.id);
  const admin = createAdminClient();

  const [errorsResult, eventsResult] = await Promise.all([
    admin
      .from('study_errors')
      .select('id, student_material_id, topic, updated_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .in('student_material_id', readyIds)
      .order('updated_at', { ascending: false })
      .limit(300),
    admin
      .from('analytics_events')
      .select('event_name, metadata, created_at')
      .eq('user_id', userId)
      .in('event_name', [
        'student_material_study_opened',
        'summary_completed',
        'student_material_exam_started',
        'student_material_exam_completed',
      ])
      .order('created_at', { ascending: false })
      .limit(600),
  ]);

  if (errorsResult.error) {
    logError('dashboardNextStudyAction.errors', errorsResult.error, { userId });
  }
  if (eventsResult.error) {
    logError('dashboardNextStudyAction.events', eventsResult.error, { userId });
  }

  const pendingErrors = (errorsResult.data ?? []) as PendingErrorRow[];
  const events = ((eventsResult.data ?? []) as StudyEventRow[]).filter((row) => {
    const materialId = materialIdFromEvent(row);
    return Boolean(materialId && readyById.has(materialId));
  });

  // 1. Lo más urgente: volver a lo que el alumno todavía no domina.
  if (pendingErrors.length > 0) {
    const byMaterial = new Map<
      string,
      { rows: PendingErrorRow[]; latest: number; topics: Set<string> }
    >();

    for (const row of pendingErrors) {
      if (!row.student_material_id || !readyById.has(row.student_material_id)) continue;
      const current = byMaterial.get(row.student_material_id) ?? {
        rows: [],
        latest: 0,
        topics: new Set<string>(),
      };
      current.rows.push(row);
      current.latest = Math.max(current.latest, timestamp(row.updated_at));
      current.topics.add(row.topic?.trim().toLocaleLowerCase('es') || row.id);
      byMaterial.set(row.student_material_id, current);
    }

    const selected = [...byMaterial.entries()].sort(
      (left, right) => right[1].latest - left[1].latest
    )[0];

    if (selected) {
      const [materialId, state] = selected;
      const material = readyById.get(materialId);
      if (material) {
        const pendingCount = state.topics.size;
        return {
          kind: 'reinforce',
          materialId,
          title: `Te quedaron ${pendingCount} ${pendingCount === 1 ? 'tema' : 'temas'} para reforzar`,
          description: `${titleForMaterial(material)} · Volvé a los puntos que te costaron y comprobá si ahora los entendés.`,
          cta: 'Reforzar ahora',
          href: `/dashboard/explicaciones?material=${encodeURIComponent(materialId)}`,
          pendingCount,
        };
      }
    }
  }

  const eventsByMaterial = new Map<string, StudyEventRow[]>();
  for (const row of events) {
    const materialId = materialIdFromEvent(row);
    if (!materialId) continue;
    const rows = eventsByMaterial.get(materialId) ?? [];
    rows.push(row);
    eventsByMaterial.set(materialId, rows);
  }

  // 2. Si empezó una práctica de la versión nueva y no la terminó, retomarla.
  const pendingPractice = readyMaterials
    .map((material) => {
      const materialEvents = eventsByMaterial.get(material.id) ?? [];
      const starts = materialEvents.filter(
        (row) =>
          row.event_name === 'student_material_exam_started' &&
          eventFlowVersion(row) === MATERIAL_PRACTICE_FLOW_VERSION
      );
      const completions = materialEvents.filter(
        (row) =>
          row.event_name === 'student_material_exam_completed' &&
          eventFlowVersion(row) === MATERIAL_PRACTICE_FLOW_VERSION
      );
      const latestStart = newestByCreatedAt(starts);
      const latestCompletion = newestByCreatedAt(completions);
      if (!latestStart) return null;
      if (timestamp(latestCompletion?.created_at) >= timestamp(latestStart.created_at)) return null;
      return { material, startedAt: timestamp(latestStart.created_at) };
    })
    .filter(
      (value): value is { material: StudentMaterial; startedAt: number } => Boolean(value)
    )
    .sort((left, right) => right.startedAt - left.startedAt)[0];

  if (pendingPractice) {
    return {
      kind: 'resume_practice',
      materialId: pendingPractice.material.id,
      title: 'Tenés una práctica pendiente',
      description: `${titleForMaterial(pendingPractice.material)} · Retomá la práctica que dejaste abierta.`,
      cta: 'Continuar práctica',
      href: `/materiales/${pendingPractice.material.id}?tab=ejercicios`,
    };
  }

  // 3. Si terminó el resumen y todavía no practicó después, la siguiente acción es comprobar.
  const readyForPractice = readyMaterials
    .map((material) => {
      const materialEvents = eventsByMaterial.get(material.id) ?? [];
      const completedSummary = newestByCreatedAt(
        materialEvents.filter(
          (row) =>
            row.event_name === 'summary_completed' &&
            eventFlowVersion(row) === SUMMARY_FLOW_VERSION
        )
      );
      if (!completedSummary) return null;

      const practicedAfterSummary = materialEvents.some(
        (row) =>
          row.event_name === 'student_material_exam_started' &&
          timestamp(row.created_at) > timestamp(completedSummary.created_at)
      );
      if (practicedAfterSummary) return null;

      return { material, completedAt: timestamp(completedSummary.created_at) };
    })
    .filter(
      (value): value is { material: StudentMaterial; completedAt: number } => Boolean(value)
    )
    .sort((left, right) => right.completedAt - left.completedAt)[0];

  if (readyForPractice) {
    return {
      kind: 'start_practice',
      materialId: readyForPractice.material.id,
      title: 'Ya terminaste el resumen',
      description: `${titleForMaterial(readyForPractice.material)} · Ahora comprobá qué entendiste con una práctica.`,
      cta: 'Comprobar lo aprendido',
      href: `/materiales/${readyForPractice.material.id}?tab=ejercicios`,
    };
  }

  // 4. Si no hay una acción más urgente, retomar el material usado más recientemente.
  const recentOpened = newestByCreatedAt(
    events.filter((row) => row.event_name === 'student_material_study_opened')
  );
  const fallbackMaterial =
    (recentOpened ? readyById.get(materialIdFromEvent(recentOpened) ?? '') : null) ??
    readyMaterials[0];

  if (!fallbackMaterial) return null;

  return {
    kind: 'continue_summary',
    materialId: fallbackMaterial.id,
    title: `Continuá con ${titleForMaterial(fallbackMaterial)}`,
    description: 'Seguí estudiando desde tu material y avanzá con el próximo paso cuando estés listo.',
    cta: 'Seguir estudiando',
    href: `/materiales/${fallbackMaterial.id}?tab=resumen`,
  };
}
