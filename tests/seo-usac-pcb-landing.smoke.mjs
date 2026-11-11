import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const page = read('app/(es)/es/paises/guatemala-pruebas-basicas-usac/page.tsx');
const retiredRoute = read('app/(es)/es/paises/[slug]/route.ts');
const sitemap = read('app/sitemap.ts');
const originalGuides = read('lib/es-country-niche-guides.ts');

const path = '/es/paises/guatemala-pruebas-basicas-usac';
assert.ok(page.includes("const path = '" + path + "'"), 'Exact URL must be restored as a static page');
assert.ok(page.includes('canonical: toAbsoluteUrl(path)'), 'Self-referencing canonical');
assert.ok(page.includes('robots: { index: true, follow: true }'), 'Public page indexable');
assert.ok(page.includes("dateModified: '2026-11-11'"), 'Revision date');
assert.ok(page.includes('PublicSiteHeader'), 'Existing marketing header');
assert.ok(page.includes('FooterHome'), 'Existing footer');
assert.ok(page.includes('usac_pcb_guide'), 'Attribution on product CTA');
assert.ok(page.includes("'/es/guias'"), 'Breadcrumb avoids retired country hub');
assert.ok(page.includes('no está afiliado'), 'Explicit independent status');
for (const source of [
  'sun.usac.edu.gt/index.php/proceso-de-ingreso/',
  'sunenlinea.usac.edu.gt/saar/index.html',
  'sun.usac.edu.gt/index.php/herramientas/',
  'virtual.usac.edu.gt/aspirantes/servicio/',
]) assert.ok(page.includes(source), 'Official reference: ' + source);
assert.ok(page.includes('No son preguntas oficiales'), 'Practice disclaimer');
assert.ok(page.includes("subject: 'Lenguaje'"), 'Original language practice');
assert.ok(page.includes("subject: 'Matemática'"), 'Original maths practice');
assert.ok(page.includes("subject: 'Física'"), 'Original physics practice');
assert.ok(page.includes("subject: 'Química'"), 'Original chemistry practice');
assert.ok(page.includes("subject: 'Biología'"), 'Original biology practice');
assert.ok(sitemap.includes(path), 'Restored page in sitemap');
assert.equal(sitemap.split(path).length - 1, 1, 'Only one sitemap entry');
assert.ok(retiredRoute.includes('status: 410'), 'Other retired country URLs remain gone');
assert.ok(originalGuides.includes('"slug": "guatemala-pruebas-basicas-usac"'), 'Historic route matches original slug');
console.log('PASS: Restored single USAC PCB URL with official references, practice, canonical and sitemap; other retired country routes unchanged.');
// Público guatemalteco: tuteo, no voseo; la herramienta está en la propia guía.
for (const voseo of ['Consultá', 'Verificá', 'Empezá', 'tenés', 'Probá']) assert.ok(!page.includes(voseo), 'No voseo: ' + voseo);
assert.ok(page.includes('<PdfFirstLandingUploader') && page.includes('locale="neutral"'), 'Neutral file picker in the guide');
