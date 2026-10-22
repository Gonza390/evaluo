import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getPedagogicalMapGroupHash,
  isReusablePedagogicalMapCheckpoint,
  savePedagogicalMapCheckpoint,
  loadPedagogicalMapCheckpoints,
} from '../lib/student-materials/pedagogical-map-checkpoints.ts';
import type { AdminClient } from '../lib/student-materials/types.ts';
import type { CompactPedagogicalNode } from '../lib/student-materials/pedagogy-ai.ts';

const group = { chunkIndexes: [0, 1], text: '[CHUNK 1] Ley A\n\n[CHUNK 2] Ley B' };
const context = {
  fileSha256: 'a'.repeat(64),
  pipelineVersion: 'pdf-standard-1',
  modelVersion: 4,
};
const node: CompactPedagogicalNode = {
  t: 'Prueba', o: 'Resumen',
  tp: [{ n: 'Tema A', d: 'Descripción', v: 'alta', s: [1, 2] }],
  c: [], r: [], cl: [], p: [], f: [], a: [], e: [], x: [], cf: [],
};
const hash = getPedagogicalMapGroupHash(group, context.modelVersion);
const row = { group_index: 0, group_hash: hash, node };

assert.equal(hash.length, 64);
assert.equal(isReusablePedagogicalMapCheckpoint(row, 0, group, context), true);
assert.equal(isReusablePedagogicalMapCheckpoint(row, 1, group, context), false);
assert.equal(isReusablePedagogicalMapCheckpoint(row, 0, {
  ...group, text: group.text + ' cambia el documento',
}, context), false);
assert.notEqual(hash, getPedagogicalMapGroupHash(group, context.modelVersion + 1));
assert.equal(isReusablePedagogicalMapCheckpoint(
  { ...row, node: { t: 'sin objetos' } }, 0, group, context
), false);
assert.equal(isReusablePedagogicalMapCheckpoint(
  { ...row, node: { ...node, c: null } }, 0, group, context
), false);

let inserted: Record<string, unknown> | null = null;
const fakeAdmin = {
  from(table: string) {
    assert.equal(table, 'student_material_pedagogical_map_checkpoints');
    return {
      async upsert(value: Record<string, unknown>, options: { onConflict: string }) {
        assert.equal(options.onConflict, 'student_material_id,group_index');
        inserted = value;
        return { error: null };
      },
      select(columns: string) {
        assert.equal(columns, 'group_index,group_hash,node');
        const builder = {
          eq(_name: string, _value: unknown) { return builder; },
          async order(_name: string) { return { data: inserted ? [inserted] : [], error: null }; },
        };
        return builder;
      },
    };
  },
} as unknown as AdminClient;

const materialId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
await savePedagogicalMapCheckpoint(fakeAdmin, materialId, context, 0, group, node);
assert.equal(inserted?.student_material_id, materialId);
assert.equal(inserted?.group_hash, hash);
const loaded = await loadPedagogicalMapCheckpoints(fakeAdmin, materialId, context);
assert.equal(loaded.length, 1);
assert.equal(isReusablePedagogicalMapCheckpoint(loaded[0], 0, group, context), true);

const migrations = [
  readFileSync('supabase/migrations/20261022182639_secure_shared_student_materials_authenticated_access.sql', 'utf8'),
  readFileSync('supabase/migrations/20261022183355_persist_pedagogical_map_batches.sql', 'utf8'),
];
assert.match(migrations[0], /for select to authenticated/i);
assert.match(migrations[0], /is_anonymous/);
assert.match(migrations[1], /enable row level security/i);
assert.match(migrations[1], /revoke all on public\.student_material_pedagogical_map_checkpoints from anon, authenticated/i);
assert.match(migrations[1], /on delete cascade/i);

const processor = readFileSync('lib/student-materials/processing-service.ts', 'utf8');
const pipeline = readFileSync('lib/student-materials/pedagogy-ai-local.ts', 'utf8');
assert.match(processor, /pedagogicalCheckpoint:/);
assert.match(processor, /onPedagogicalMapProgress:/);
assert.match(pipeline, /Promise\.allSettled/);
assert.match(pipeline, /loadPedagogicalMapCheckpoints/);
assert.match(pipeline, /savePedagogicalMapCheckpoint/);
assert.match(pipeline, /flushPendingAiUsageForMaterial/);
assert.match(pipeline, /restored\.get\(groupIndex\)/);
assert.match(pipeline, /const parsed = tryParseJsonRecord\(result\.content\)/);

console.log('Pedagogical batch checkpoints and shared material RLS regression tests passed.');
