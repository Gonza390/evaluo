import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// /pricing rediseño (nov-2026): decisiones de producto aprobadas que no deben retroceder.
const read = (path: string) => readFileSync(resolve(path), 'utf8');
const page = read('app/(es)/pricing/page.tsx');
const plans = read('components/pricing/PricingPlans.tsx');
const css = read('app/(es)/pricing/pricing-clean.css');

// Mensual preseleccionado; 6 meses como alternativa con ahorro.
assert.match(plans, /useState<Plan>\('monthly'\)/);
assert.match(plans, /6 meses <span[^>]*>−25%<\/span>/);
assert.match(plans, /offerCode: plan/);

// Nunca un botón muerto "Próximamente": sin Creem disponible se ofrece aviso.
assert.doesNotMatch(plans, /Próximamente/);
assert.match(plans, /Avisame cuando esté disponible/);

// Sin cambio manual de país ni textos retirados.
for (const removed of [
  /Fuera de Argentina/i,
  /Estás en Argentina/i,
  /Sin cuenta\?/,
  /ves los impuestos antes de pagar/i,
  /Sin cupo Free/,
]) {
  assert.doesNotMatch(page + plans, removed);
}

// Premium primero, Gratis secundario y mismas acciones en la barra fija del teléfono.
assert.ok(plans.indexOf('<PremiumShell>') < plans.indexOf('<FreeCard market="argentina" />'));
assert.match(plans, /sm:hidden/);
assert.match(plans, /getBoundingClientRect\(\)\.bottom < 0/);

// País sin confirmar: no se muestra ningún precio pago.
assert.match(plans, /market\.market === 'unknown'[\s\S]{0,400}No pudimos confirmar tu país/);

// Animaciones con respeto por "reducir movimiento" y estilos viejos aislados de esta página.
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /\.pricing-editorial:not\(:has\(\.pricing-v2\)\)/);
assert.match(page, /className="pricing-v2 /);

console.log(
  'Pricing redesign: monthly default, no dead buttons, fail-closed region and motion checks passed.'
);
