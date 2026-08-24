import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

const materiaPageSource = readFileSync(resolve('app/explorar/materia/[id]/page.tsx'), 'utf8');
const contentSignalsSource = readFileSync(resolve('lib/seo-content-signals.ts'), 'utf8');
const notFoundSource = readFileSync(resolve('app/not-found.tsx'), 'utf8');
const pregunteroSource = readFileSync(resolve('app/pregunteros/[materia]/page.tsx'), 'utf8');
const clientLayoutSource = readFileSync(resolve('components/ClientLayout.tsx'), 'utf8');
const universityRequestFormSource = readFileSync(
  resolve('app/solicitar-universidad/request-form.tsx'),
  'utf8'
);
const nextConfigSource = readFileSync(resolve('next.config.mjs'), 'utf8');
const pdfRenderSource = readFileSync(resolve('lib/student-materials/pdf-render.ts'), 'utf8');

assert.match(contentSignalsSource, /\.eq\('tipo', 'resumen-modulo'\)/);
assert.match(
  materiaPageSource,
  /!contentSignals\.hasSummaries\s*&&\s*contentSignals\.hasQuestions/
);
assert.match(materiaPageSource, /params\.set\('tab', 'pregunteros'\)/);
assert.match(materiaPageSource, /hasExplicitSupportedTab/);

for (const href of ['/explorar', '/pregunteros', '/']) {
  assert.ok(notFoundSource.includes(`href="${href}"`));
}
assert.match(notFoundSource, /Explorar materias/);
assert.match(notFoundSource, /Ir a Pregunteros/);
assert.match(notFoundSource, /Volver al inicio/);
assert.match(pregunteroSource, /if \(!data\) \{\s*notFound\(\);\s*\}/);
assert.doesNotMatch(pregunteroSource, /Este preguntero no existe/);
assert.match(clientLayoutSource, /\{ label: 'Inicio', href: '\/', icon: Home \}/);
assert.match(
  clientLayoutSource,
  /\{ label: 'Pregunteros', href: '\/pregunteros', icon: GraduationCap \}/
);
assert.match(
  clientLayoutSource,
  /\{ label: 'Ingresar', href: '\/login', icon: LogIn, variant: 'cta' as const \}/
);
assert.match(universityRequestFormSource, /supabase\.rpc\.bind\(supabase\)/);
assert.doesNotMatch(universityRequestFormSource, /const rpc = supabase\.rpc as unknown/);
assert.match(nextConfigSource, /pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs/);
assert.match(nextConfigSource, /pdfjs-dist\/node_modules\/@napi-rs\/\*\*\/\*/);
assert.match(pdfRenderSource, /pdfjs-dist\/node_modules.*@napi-rs.*canvas/);
assert.doesNotMatch(pdfRenderSource, /from ['"]canvas['"]/);

console.log('Route smoke tests passed.');
