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
const clientLayoutUiSource = readFileSync(resolve('components/ClientLayoutClient.tsx'), 'utf8');
const universityRequestFormSource = readFileSync(
  resolve('app/solicitar-universidad/request-form.tsx'),
  'utf8'
);
const nextConfigSource = readFileSync(resolve('next.config.mjs'), 'utf8');
const pdfRenderSource = readFileSync(resolve('lib/student-materials/pdf-render.ts'), 'utf8');
const footerHomeSource = readFileSync(resolve('components/footer-home.tsx'), 'utf8');
const footerSource = readFileSync(resolve('components/footer.tsx'), 'utf8');
const publicSiteHeaderSource = readFileSync(
  resolve('components/marketing/public-site-header.tsx'),
  'utf8'
);
const publicLayoutSource = readFileSync(resolve('components/PublicLayout.tsx'), 'utf8');
const homeStudyPreviewSource = readFileSync(
  resolve('components/marketing/home-study-preview.tsx'),
  'utf8'
);
const simulatorIndexSource = readFileSync(resolve('app/simulador/page.tsx'), 'utf8');
const simulatorPreviewSource = readFileSync(
  resolve('app/preview/resultado-simulador/page.tsx'),
  'utf8'
);
const materiaLoadingSource = readFileSync(
  resolve('app/explorar/materia/[id]/loading.tsx'),
  'utf8'
);
const universityPageSource = readFileSync(resolve('app/universidad/[id]/page.tsx'), 'utf8');
const universityCareerListSource = readFileSync(
  resolve('app/universidad/[id]/career-list-client.tsx'),
  'utf8'
);
const materiaListSource = readFileSync(resolve('components/materia-list.tsx'), 'utf8');
const pricingSource = readFileSync(resolve('app/pricing/page.tsx'), 'utf8');
const pregunteroHubSource = readFileSync(resolve('app/pregunteros/page.tsx'), 'utf8');
const materialViewerSource = readFileSync(resolve('app/materiales/[id]/page.tsx'), 'utf8');
const materialJobsSource = readFileSync(resolve('lib/student-material-jobs.ts'), 'utf8');
const materialRetrySource = readFileSync(
  resolve('components/student-material-processing-retry.tsx'),
  'utf8'
);
const materiaStudyHomeSource = readFileSync(
  resolve('app/explorar/materia/[id]/materia-study-home.tsx'),
  'utf8'
);
const dashboardSource = readFileSync(resolve('components/dashboard/dashboard-content.tsx'), 'utf8');
const exploreClientSource = readFileSync(resolve('app/explorar/explorar-client.tsx'), 'utf8');
const loginSource = readFileSync(resolve('components/LoginFormGoogleFirst.tsx'), 'utf8');

assert.match(contentSignalsSource, /\.eq\('tipo', 'resumen-modulo'\)/);
assert.match(materiaPageSource, /contentSignals\.hasAcademicContent/);
assert.match(materiaStudyHomeSource, /La práctica de esta materia está en preparación/);
assert.match(materiaStudyHomeSource, /Crear ejercicios con mi PDF/);
assert.doesNotMatch(materiaStudyHomeSource, />Sin preguntas</);
assert.match(dashboardSource, /Empezá a estudiar en 4 pasos/);
assert.match(dashboardSource, /Volver a ver la guía/);
assert.match(exploreClientSource, /readyMateriasCount/);
assert.match(exploreClientSource, /Ver las \$\{rankedCarreras\.length\} carreras/);
assert.match(loginSource, /getAuthContextCopy/);

for (const href of ['/explorar', '/pregunteros', '/']) {
  assert.ok(notFoundSource.includes(`href="${href}"`));
}
assert.match(notFoundSource, /Explorar materias/);
assert.match(notFoundSource, /Ir a Pregunteros/);
assert.match(notFoundSource, /Volver al inicio/);
assert.match(pregunteroSource, /if \(!data\) \{\s*notFound\(\);\s*\}/);
assert.doesNotMatch(pregunteroSource, /Este preguntero no existe/);
assert.doesNotMatch(clientLayoutSource, /getRequestUser/);
assert.doesNotMatch(clientLayoutSource, /getAppShellBootstrap/);
const performanceBudget = readFileSync(resolve('performance-budget.json'), 'utf8');
const performanceScript = readFileSync(resolve('scripts/check-performance-budget.mjs'), 'utf8');
const ciSource = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');
const adminActionsSource = readFileSync(resolve('app/administrador/actions.ts'), 'utf8');
const adminLoadingSource = readFileSync(resolve('app/administrador/loading.tsx'), 'utf8');
const rootLayoutSource = readFileSync(resolve('app/layout.tsx'), 'utf8');
const seoLandingSource = readFileSync(resolve('app/landings/estudiar/[materia]/page.tsx'), 'utf8');
assert.match(performanceBudget, /"\/dashboard"/);
assert.match(performanceBudget, /"\/administrador"/);
assert.match(performanceScript, /gzipSync/);
assert.match(performanceScript, /process\.exitCode = 1/);
assert.match(ciSource, /npm run performance:budget/);
assert.match(adminActionsSource, /\['admin-conversion-v2'\]/);
assert.match(adminActionsSource, /revalidate: 60/);
assert.match(
  adminActionsSource,
  /export async function obtenerConversionAdministrador[\s\S]*await requireAdminAccess\(\)[\s\S]*obtenerConversionAdministradorCached/
);
assert.match(adminLoadingSource, /aria-busy="true"/);
assert.match(rootLayoutSource, /@vercel\/speed-insights\/next/);
assert.match(rootLayoutSource, /<SpeedInsights\s*\/>/);
assert.match(seoLandingSource, /generateStaticParams\(\)[\s\S]*return \[\]/);
assert.match(seoLandingSource, /getLandingMateria/);
assert.match(clientLayoutUiSource, /\{ label: 'Inicio', href: '\/', icon: Home \}/);
assert.match(
  clientLayoutUiSource,
  /\{ label: 'Pregunteros', href: '\/pregunteros', icon: GraduationCap \}/
);
assert.match(
  clientLayoutUiSource,
  /\{ label: 'Iniciar sesión', href: '\/login\?mode=login', icon: LogIn, variant: 'cta' as const \}/
);
assert.match(universityRequestFormSource, /supabase\.rpc\.bind\(supabase\)/);
assert.doesNotMatch(universityRequestFormSource, /const rpc = supabase\.rpc as unknown/);
assert.match(nextConfigSource, /pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs/);
assert.match(nextConfigSource, /pdfjs-dist\/node_modules\/@napi-rs\/\*\*\/\*/);
assert.match(pdfRenderSource, /documentHandle[\s\S]*canvasFactory/);
assert.match(pdfRenderSource, /canvasFactory\.create/);
assert.match(pdfRenderSource, /canvasFactory\.destroy/);
assert.doesNotMatch(pdfRenderSource, /from ['"]canvas['"]/);
assert.doesNotMatch(pdfRenderSource, /createRequire/);

assert.ok(footerHomeSource.includes('https://www.instagram.com/evaluo.app/'));
assert.ok(footerHomeSource.includes('https://www.linkedin.com/company/evaluo-ar/'));
assert.doesNotMatch(footerHomeSource, /https:\/\/(www\.)?tiktok\.com/);
assert.doesNotMatch(footerHomeSource, /https:\/\/(www\.)?youtube\.com/);
assert.match(footerSource, /<FooterHome variant="compact" \/>/);
assert.doesNotMatch(footerHomeSource, /<h4/);

assert.match(publicSiteHeaderSource, /export function PublicBrandLink/);
assert.match(publicSiteHeaderSource, /Crear cuenta gratis/);
assert.match(publicSiteHeaderSource, /Iniciar sesión/);
assert.match(publicLayoutSource, /<PublicSiteHeader variant="landing"/);
assert.match(clientLayoutUiSource, /<PublicBrandLink \/>/);
assert.match(clientLayoutUiSource, /<PublicGuestActions trackingLocation="discovery_header" \/>/);
assert.match(pricingSource, /<FooterHome \/>/);
assert.match(pregunteroHubSource, /<FooterHome \/>/);

assert.match(
  homeStudyPreviewSource,
  /<h2 className="sr-only">Vista previa de una guía de estudio creada con Evaluo<\/h2>/
);
assert.doesNotMatch(simulatorPreviewSource, /Preview resultado simulador \| Evaluo/);
assert.match(simulatorIndexSource, /href="\/explorar"/);
assert.match(simulatorIndexSource, /Ir a mis materias/);
assert.match(simulatorIndexSource, /Volver al inicio/);

for (const source of [universityPageSource, universityCareerListSource, materiaListSource]) {
  assert.doesNotMatch(source, /#7C879C/i);
}
assert.match(materiaLoadingSource, /bg-slate-100/);
assert.doesNotMatch(materiaLoadingSource, /animate-pulse rounded-full bg-white/);
assert.match(materiaStudyHomeSource, /bg-primary hover:bg-primary\/90/);
assert.match(materiaStudyHomeSource, /border border-indigo-200 bg-white/);

assert.match(materialJobsSource, /STUDENT_MATERIAL_JOB_LEASE_MS = 7 \* 60 \* 1000/);
assert.match(materialJobsSource, /processing_status: 'failed'/);
assert.match(materialJobsSource, /procesamiento se interrumpió por tiempo límite/i);
assert.match(materialViewerSource, /recoverStaleStudentMaterialJobs\(admin, materialId\)/);
assert.match(materialViewerSource, /StudentMaterialProcessingRetry/);
assert.match(materialRetrySource, /processStudentMaterialAction\(materialId\)/);
assert.match(materialRetrySource, /Reintentar procesamiento/);

console.log('Route smoke tests passed.');
