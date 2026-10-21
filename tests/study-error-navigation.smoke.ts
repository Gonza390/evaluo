import assert from 'node:assert/strict';
import { pdfProgressReviewHref, studyErrorGroupId } from '../lib/study-error-navigation.ts';

const exercise = { id: 'error-1', sourceType: 'exercise' as const };
const recommended = { materialId: 'pdf-1' } as NonNullable<
  Parameters<typeof studyErrorGroupId>[0]['recommendation']
>;
assert.equal(
  studyErrorGroupId({ sourceType: 'simulator', recommendation: recommended }),
  'unlinked'
);
assert.equal(studyErrorGroupId({ sourceType: 'exercise', recommendation: recommended }), 'pdf-1');
assert.equal(studyErrorGroupId({ sourceType: 'exercise', recommendation: null }), 'unlinked');
const href = pdfProgressReviewHref('pdf-1', exercise, true)!;
const target = new URL(href, 'https://evaluo.com.ar');
assert.equal(target.pathname, '/dashboard/progreso');
assert.equal(target.searchParams.get('material'), 'pdf-1');
assert.equal(target.searchParams.get('error'), exercise.id);
assert.equal(target.searchParams.has('tour'), false);
assert.equal(target.searchParams.get('from'), 'errores');
assert.equal(pdfProgressReviewHref(null, exercise), null);
assert.equal(
  pdfProgressReviewHref('recommended-pdf', { id: 'simulator-1', sourceType: 'simulator' }),
  null
);
assert.equal(new URL(pdfProgressReviewHref('pdf-1')!, target).searchParams.has('error'), false);
assert.equal(
  new URL(pdfProgressReviewHref('pdf&from=other', exercise)!, target).searchParams.get('material'),
  'pdf&from=other'
);
console.log('Study error navigation smoke tests passed.');
