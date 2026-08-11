import assert from 'node:assert/strict';
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

console.log('Route smoke tests passed.');
