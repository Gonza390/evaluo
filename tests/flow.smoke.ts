import assert from 'node:assert/strict';
import {
  addMonths,
  buildEventPayload,
  DEFAULT_CALENDAR_FORM_STATE,
  examInstanceLabel,
  formatStorageDate,
  getCalendarGrid,
} from '../lib/calendar-utils.ts';
import {
  buildResumenKey,
  formatResumenModulesLabel,
  getModuleNumber,
} from '../app/explorar/materia/[id]/materia-content.helpers.ts';
import { resolveProfileSettingsState } from '../lib/profile-settings.ts';
import {
  dedupeOptionsForView,
  isMultiAnswer,
  normalizeForCompare,
  parseCorrectAnswers,
} from '../lib/simulator-core.ts';

assert.equal(formatStorageDate(new Date(2026, 5, 17)), '2026-06-17');
assert.equal(addMonths(new Date(2026, 5, 1), 1).getMonth(), 6);
assert.equal(getCalendarGrid(new Date(2026, 5, 1)).length, 42);
assert.equal(examInstanceLabel('integrador'), 'Integrador');

const examPayload = buildEventPayload({
  formState: {
    ...DEFAULT_CALENDAR_FORM_STATE,
    subjectName: 'Derecho Constitucional',
    examInstance: '2',
  },
  careerId: 'car-1',
  careerName: 'Abogacía',
  selectedMateria: { id: 'mat-1', nombre: 'Derecho Constitucional' },
});

assert.equal(examPayload?.title, 'Derecho Constitucional - Parcial 2');
assert.equal(examPayload?.materiaId, 'mat-1');

const profileState = resolveProfileSettingsState({
  profile: { nombre: '', universidad_id: 'uni-1', carrera_id: 'car-1' },
  userMetadata: { full_name: 'Ada Lovelace', country: 'AR' },
  fallbackName: 'Usuario',
});

assert.equal(profileState.nombre, 'Ada Lovelace');
assert.equal(profileState.pais, 'AR');
assert.equal(profileState.universidadId, 'uni-1');

assert.deepEqual(dedupeOptionsForView([' A ', 'a', 'B', 'B  ', '']), ['A', 'B']);
assert.deepEqual(parseCorrectAnswers('Uno | Dos; Tres'), ['Uno', 'Dos', 'Tres']);
assert.equal(isMultiAnswer('Uno | Dos'), true);
assert.equal(normalizeForCompare('  Hola   Mundo '), 'hola mundo');

assert.equal(getModuleNumber('Resumen Modulo 3'), 3);
assert.equal(formatResumenModulesLabel([2, 1, 2]), 'Corresponde a los módulos 1 y 2.');
assert.equal(
  buildResumenKey({
    id: '1',
    title: 'Resumen Derecho',
    author_name: null,
    file_url: null,
    module_id: 2,
    score: null,
    created_at: null,
  }),
  'resumen derecho::2'
);

console.log('Flow smoke tests passed.');
