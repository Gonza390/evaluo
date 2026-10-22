import assert from 'node:assert/strict';
import { getRealStudyMaterialId } from '../lib/email/study-return-material-id.ts';

const realId = '12345678-1234-4234-8234-123456789abc';
const otherId = '87654321-1234-4234-8234-123456789abc';

assert.equal(getRealStudyMaterialId({ metadata: { material_id: realId }, path: null }), realId);
assert.equal(getRealStudyMaterialId({ metadata: { material_id: 'demo-material' }, path: null }), null);
assert.equal(getRealStudyMaterialId({ metadata: { material_id: 'demo-material' }, path: '/demo/material-estudio' }), null);
assert.equal(getRealStudyMaterialId({ metadata: { material_id: 'demo-material' }, path: `/materiales/${realId}?tab=resumen` }), realId);
assert.equal(getRealStudyMaterialId({ metadata: { material_id: realId }, path: `/materiales/${otherId}` }), realId);
assert.equal(getRealStudyMaterialId({ metadata: { material_id: '123-malformed' }, path: '/materiales/not-a-uuid' }), null);
assert.equal(getRealStudyMaterialId({ metadata: null, path: `/materiales/${realId}/resumen` }), realId);
assert.equal(getRealStudyMaterialId({ metadata: null, path: '/materiales/demo-material' }), null);
assert.equal(getRealStudyMaterialId({ metadata: null, path: null }), null);

console.log('Study-return D+1 material ID contract tests passed.');
