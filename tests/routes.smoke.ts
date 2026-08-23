import assert from 'node:assert/strict';
import { appendPregunteroAttribution } from '../lib/preguntero-attribution.ts';
import {
  INVALID_SEO_ENTITY_ID,
  buildSeoEntitySlug,
  isValidSeoEntityId,
  parseSeoEntitySlug,
} from '../lib/seo-intents.ts';
import {
  getCareerRoute,
  getDashboardMateriaRoute,
  getMateriaRoute,
  getResourceRoute,
  getSimulatorRoute,
  getUniversityRoute,
} from '../lib/routes.ts';

assert.equal(getUniversityRoute('uni-1'), '/universidad/uni-1');
assert.equal(getCareerRoute('car-1'), '/materias?carreraId=car-1');
assert.equal(getMateriaRoute('mat-1'), '/explorar/materia/mat-1');
assert.equal(getMateriaRoute('mat-1', 'car-1'), '/explorar/materia/mat-1?carreraId=car-1');
assert.equal(
  getResourceRoute('mat-1', 'preguntero-p1', 'Procesal'),
  '/recursos/mat-1?tipo=preguntero-p1&nombre=Procesal'
);
assert.equal(getDashboardMateriaRoute('mat-1'), '/dashboard/materia/mat-1');
assert.equal(getSimulatorRoute('mat-1', 2), '/simulador/mat-1/2');
assert.equal(
  getSimulatorRoute('mat-1', 1, 'uni-1', 'car-1'),
  '/simulador/mat-1/1?universidad_id=uni-1&carrera_id=car-1'
);
assert.equal(
  appendPregunteroAttribution('/simulador/materia/1', {
    utm_source: 'whatsapp',
    utm_campaign: 'tecnologia_p1',
    ignored: 'secret',
  }),
  '/simulador/materia/1?utm_source=whatsapp&utm_campaign=tecnologia_p1'
);

const materiaId = 'eb923481-2207-4895-9ae4-2a0b984d9b99';
assert.equal(isValidSeoEntityId(materiaId), true);
assert.equal(isValidSeoEntityId('aprender-en-el-siglo-21-a37a41c2'), false);
assert.equal(
  buildSeoEntitySlug('APRENDER EN EL SIGLO 21', materiaId),
  `aprender-en-el-siglo-21--${materiaId}`
);
assert.deepEqual(parseSeoEntitySlug(`aprender-en-el-siglo-21--${materiaId}`), {
  id: materiaId,
  labelSlug: 'aprender-en-el-siglo-21',
});
assert.deepEqual(parseSeoEntitySlug(materiaId), {
  id: materiaId,
  labelSlug: materiaId,
});
assert.deepEqual(parseSeoEntitySlug('aprender-en-el-siglo-21-a37a41c2'), {
  id: INVALID_SEO_ENTITY_ID,
  labelSlug: 'aprender-en-el-siglo-21-a37a41c2',
});
assert.deepEqual(parseSeoEntitySlug('aprender-en-el-siglo-21--a37a41c2'), {
  id: INVALID_SEO_ENTITY_ID,
  labelSlug: 'aprender-en-el-siglo-21',
});

console.log('Route smoke tests passed.');
