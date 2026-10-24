import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getPdfStudyEntryStorageKey,
  isSavedPdfStudyEntryChoice,
  shouldPresentPdfStudyEntry,
} from '../lib/pdf-study-entry.ts';

const firstPdf = '11111111-1111-4111-8111-111111111111';
const secondPdf = '22222222-2222-4222-8222-222222222222';

assert.notEqual(getPdfStudyEntryStorageKey(firstPdf), getPdfStudyEntryStorageKey(secondPdf),
  'La respuesta se debe guardar por PDF, no por cuenta.');
assert.equal(isSavedPdfStudyEntryChoice('not_studied'), true);
assert.equal(isSavedPdfStudyEntryChoice('some_knowledge'), true);
assert.equal(isSavedPdfStudyEntryChoice('free_exploration'), true);
assert.equal(isSavedPdfStudyEntryChoice('pending'), false);

const fresh = {
  isOwner: true,
  isReady: true,
  entryRequested: true,
  guideActive: false,
  savedChoice: null,
};
assert.equal(shouldPresentPdfStudyEntry(fresh), true, 'Un PDF recién cargado debe preguntar.');
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, savedChoice: 'pending' }), true,
  'Una pregunta pendiente debe reabrirse al volver al PDF.');
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, savedChoice: 'not_studied' }), false);
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, savedChoice: 'some_knowledge' }), false);
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, savedChoice: 'free_exploration' }), false);
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, entryRequested: false }), false,
  'No interrumpir PDFs anteriores por introducir el nuevo paso.');
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, isOwner: false }), false,
  'Nunca interrumpir al visitante de un PDF compartido.');
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, isReady: false }), false);
assert.equal(shouldPresentPdfStudyEntry({ ...fresh, guideActive: true }), false,
  'El tutorial de cuatro pasos debe terminar antes de mostrar la pregunta.');

const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const page = readFileSync('app/materiales/[id]/page.tsx', 'utf8');
const processing = readFileSync('components/dashboard/pdf-first-upload-shell.tsx', 'utf8');
const quick = readFileSync('components/dashboard/quick-pdf-upload.tsx', 'utf8');
const analytics = readFileSync('lib/analytics-events.ts', 'utf8');

assert.match(page, /initialStudyEntryAvailable=\{isOwner && material\.processing_status === 'ready' && query\.inicio === '1'\}/);
assert.match(processing, /\?inicio=1/);
assert.match(quick, /\?inicio=1/);
assert.match(workspace, /data-pdf-study-entry-choice/);
assert.match(workspace, /recommendedActive \|\| pendingPdfStudyEntry/);
assert.match(workspace, /savePdfStudyEntryChoice\(materialId, 'pending'\)/);
assert.match(workspace, /savePdfStudyEntryChoice\(materialId, choice\)/);
assert.match(workspace, /savePdfStudyEntryChoice\(materialId, 'free_exploration'\)/);
assert.match(workspace, /handleStudyTabChange\('ejercicios'\)/);
assert.match(workspace, /setFocusFirstChapterOnExit\(summaryChapters\.length > 0\)/);
assert.match(analytics, /'pdf_study_entry_selected'/);
console.log('pdf-study-entry.smoke passed');
