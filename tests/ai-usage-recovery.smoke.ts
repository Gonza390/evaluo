import assert from 'node:assert/strict';
import {
  recordAiUsage,
  aggregateAiUsageForMaterial,
} from '../lib/student-materials/ai-usage.ts';
import type { AdminClient } from '../lib/student-materials/types.ts';

const materialId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
type UsageRow = {
  student_material_id: string;
  operation: string;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
};

const persisted: UsageRow[] = [];
const inserts: UsageRow[][] = [];
let rejectInsert = true;
const fakeAdmin = {
  from(table: string) {
    assert.equal(table, 'student_material_ai_usage');
    return {
      async insert(rows: UsageRow[]) {
        inserts.push(rows.map((row) => ({ ...row })));
        if (rejectInsert) {
          return {
            error: {
              code: '23514',
              message: 'new row for relation "student_material_ai_usage" violates check constraint',
            },
          };
        }
        persisted.push(...rows);
        return { error: null };
      },
      select() {
        return {
          async eq(column: string, value: string) {
            assert.equal(column, 'student_material_id');
            return {
              data: persisted.filter((row) => row.student_material_id === value),
              error: null,
            };
          },
        };
      },
    };
  },
} as unknown as AdminClient;

await recordAiUsage({
  materialId,
  provider: 'gemini',
  model: 'gemini-3.5-flash-lite',
  operation: 'source_vision',
  usage: { promptTokens: 40, completionTokens: 10, totalTokens: 50 },
});

const loggedScopes: string[] = [];
const previousConsoleError = console.error;
console.error = (...args: unknown[]) => {
  loggedScopes.push(String(args[0] ?? ''));
};

try {
  const first = await aggregateAiUsageForMaterial(fakeAdmin, materialId);
  assert.equal(first.aiCallCount, 0, 'No se debe contar un INSERT rechazado.');
  assert.equal(inserts.length, 1);
  assert.equal(persisted.length, 0);
} finally {
  console.error = previousConsoleError;
}

assert.ok(
  loggedScopes.some((scope) => scope.includes('studentMaterialAiUsage.flush')),
  'Los fallos CHECK deben registrarse en observabilidad.'
);

rejectInsert = false;
const second = await aggregateAiUsageForMaterial(fakeAdmin, materialId);
assert.equal(inserts.length, 2, 'El INSERT fallido debe poder reintentarse.');
assert.deepEqual(inserts[1], inserts[0], 'Reintentar exactamente el lote pendiente.');
assert.equal(second.aiCallCount, 1);
assert.equal(second.totalAiTokens, 50);
assert.equal(second.promptTokens, 40);
assert.equal(second.completionTokens, 10);

await aggregateAiUsageForMaterial(fakeAdmin, materialId);
assert.equal(inserts.length, 2, 'Un lote confirmado no debe volver a insertarse.');

console.log('AI usage rejected insert recovery tests passed.');
