import assert from 'node:assert/strict';
import {
  buildStudentMaterialContentFingerprint,
  STUDENT_MATERIAL_PIPELINE_VERSION,
} from '../lib/student-materials/canonical-cache-key.ts';

const materiaId = '00000000-0000-0000-0000-000000000001';
const otherMateriaId = '00000000-0000-0000-0000-000000000002';

const base = buildStudentMaterialContentFingerprint({
  text: 'Unidad 1\n\nConcepto   principal',
  materiaId,
});

const sameNormalizedContent = buildStudentMaterialContentFingerprint({
  text: 'Unidad 1 Concepto principal',
  materiaId,
});

const differentContent = buildStudentMaterialContentFingerprint({
  text: 'Unidad 1 Concepto diferente',
  materiaId,
});

const differentMateria = buildStudentMaterialContentFingerprint({
  text: 'Unidad 1 Concepto principal',
  materiaId: otherMateriaId,
});

const differentPipeline = buildStudentMaterialContentFingerprint({
  text: 'Unidad 1 Concepto principal',
  materiaId,
  pipelineVersion: `${STUDENT_MATERIAL_PIPELINE_VERSION}-next`,
});

assert.match(base, /^[a-f0-9]{64}$/);
assert.equal(base, sameNormalizedContent, 'El cache debe ignorar diferencias de espacios.');
assert.notEqual(base, differentContent, 'Contenido distinto no debe reutilizarse.');
assert.notEqual(base, differentMateria, 'La misma fuente en otra materia no debe cruzar cache.');
assert.notEqual(base, differentPipeline, 'Una nueva version del pipeline debe invalidar cache viejo.');

console.log('student-material-cache.smoke: ok');
