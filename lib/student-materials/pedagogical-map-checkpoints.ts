import { createHash } from 'node:crypto';
import type { PedagogicalMapGroup } from '@/lib/student-materials/pedagogy-ai';
import type { AdminClient } from '@/lib/student-materials/types';
import type { CompactPedagogicalNode } from '@/lib/student-materials/pedagogy-ai';

// Si cambia la forma de agrupar/normalizar, invalidamos el resultado previo.
export const PEDAGOGICAL_MAP_CHECKPOINT_FORMAT = 1;
const TABLE = 'student_material_pedagogical_map_checkpoints' as never;

export type PedagogicalMapCheckpointContext = {
  fileSha256: string;
  pipelineVersion: string;
  modelVersion: number;
};

export function getPedagogicalMapGroupHash(
  group: Pick<PedagogicalMapGroup, 'chunkIndexes' | 'text'>,
  modelVersion: number
): string {
  return createHash('sha256')
    .update(JSON.stringify({
      format: PEDAGOGICAL_MAP_CHECKPOINT_FORMAT,
      modelVersion,
      chunkIndexes: group.chunkIndexes,
      text: group.text,
    }))
    .digest('hex');
}

export function isReusablePedagogicalMapCheckpoint(
  row: unknown,
  index: number,
  group: PedagogicalMapGroup,
  context: PedagogicalMapCheckpointContext
): row is { group_index: number; group_hash: string; node: CompactPedagogicalNode } {
  if (!row || typeof row !== 'object') return false;
  const item = row as Record<string, unknown>;
  if (item.group_index !== index ||
      item.group_hash !== getPedagogicalMapGroupHash(group, context.modelVersion)) return false;
  const node = item.node;
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  const parsed = node as Record<string, unknown>;
  return (
    typeof parsed.t === 'string' && typeof parsed.o === 'string' &&
    ['tp', 'c', 'r', 'cl', 'p', 'f', 'a', 'e', 'x', 'cf']
      .every((field) => Array.isArray(parsed[field]))
  );
}

export async function loadPedagogicalMapCheckpoints(
  admin: AdminClient,
  materialId: string,
  context: PedagogicalMapCheckpointContext
): Promise<unknown[]> {
  const { data, error } = await admin.from(TABLE)
    .select('group_index,group_hash,node')
    .eq('student_material_id', materialId)
    .eq('file_sha256', context.fileSha256)
    .eq('pipeline_version', context.pipelineVersion)
    .eq('model_version', context.modelVersion)
    .order('group_index', { ascending: true });
  if (error) throw new Error(`No pudimos recuperar los mapas académicos: ${error.message}`);
  return (data ?? []) as unknown[];
}

export async function savePedagogicalMapCheckpoint(
  admin: AdminClient,
  materialId: string,
  context: PedagogicalMapCheckpointContext,
  groupIndex: number,
  group: PedagogicalMapGroup,
  node: CompactPedagogicalNode
): Promise<void> {
  const { error } = await admin.from(TABLE).upsert({
    student_material_id: materialId,
    group_index: groupIndex,
    file_sha256: context.fileSha256,
    pipeline_version: context.pipelineVersion,
    model_version: context.modelVersion,
    group_hash: getPedagogicalMapGroupHash(group, context.modelVersion),
    node,
    updated_at: new Date().toISOString(),
  } as never, { onConflict: 'student_material_id,group_index' });
  if (error) throw new Error(`No pudimos guardar el bloque académico ${groupIndex + 1}: ${error.message}`);
}
