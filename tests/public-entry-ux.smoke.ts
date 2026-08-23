import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const materiaPageSource = readFileSync(resolve('app/explorar/materia/[id]/page.tsx'), 'utf8');
const contentSignalsSource = readFileSync(resolve('lib/seo-content-signals.ts'), 'utf8');
const notFoundSource = readFileSync(resolve('app/not-found.tsx'), 'utf8');
const pregunteroSource = readFileSync(resolve('app/pregunteros/[materia]/page.tsx'), 'utf8');
const clientLayoutSource = readFileSync(resolve('components/ClientLayout.tsx'), 'utf8');

assert.match(
  contentSignalsSource,
  /\.eq\('tipo', 'resumen-modulo'\)/,
  'La señal de contenido debe distinguir resúmenes reales de otros recursos de la materia.'
);
assert.match(
  materiaPageSource,
  /!contentSignals\.hasSummaries\s*&&\s*contentSignals\.hasQuestions/,
  'Una materia sin resúmenes y con preguntas debe elegir contenido útil en lugar de una pestaña vacía.'
);
assert.match(
  materiaPageSource,
  /params\.set\('tab', 'pregunteros'\)/,
  'La entrada de una materia con preguntas debe abrir Pregunteros cuando no hay resúmenes.'
);
assert.match(
  materiaPageSource,
  /hasExplicitSupportedTab/,
  'Una pestaña elegida explícitamente por el usuario debe respetarse.'
);

for (const href of ['/explorar', '/pregunteros', '/']) {
  assert.ok(
    notFoundSource.includes(`href=\"${href}\"`),
    `La página 404 debe ofrecer una salida hacia ${href}.`
  );
}
assert.match(notFoundSource, /Explorar materias/);
assert.match(notFoundSource, /Ir a Pregunteros/);
assert.match(notFoundSource, /Volver al inicio/);
assert.match(
  pregunteroSource,
  /if \(!data\) \{\s*notFound\(\);\s*\}/,
  'Un preguntero inexistente debe usar la experiencia 404 recuperable.'
);
assert.doesNotMatch(
  pregunteroSource,
  /Este preguntero no existe/,
  'El preguntero inválido no debe terminar en un texto sin acciones.'
);

assert.match(
  clientLayoutSource,
  /\{ label: 'Inicio', href: '\/', icon: Home \}/,
  'Para visitantes anónimos, Inicio debe volver a la home pública.'
);
assert.match(
  clientLayoutSource,
  /\{ label: 'Pregunteros', href: '\/pregunteros', icon: GraduationCap \}/,
  'La navegación móvil pública debe ofrecer Pregunteros en lugar de duplicar Explorar/Materias.'
);
assert.match(
  clientLayoutSource,
  /\{ label: 'Ingresar', href: '\/login', icon: LogIn, variant: 'cta' as const \}/,
  'La cuarta acción pública debe ser el ingreso, no una ruta protegida implícita.'
);

console.log('Public entry UX smoke tests passed.');
