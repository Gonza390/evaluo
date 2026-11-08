import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const file = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// El personaje es la hoja del ícono de la app: sin brazos, lápiz ni puntitos decorativos.
const personaje = file('components/brand/personaje.tsx');
assert.match(personaje, /export function Personaje/);
for (const estado of ['contento', 'feliz', 'pensando', 'concentrado', 'dormido', 'birrete']) {
  assert.match(personaje, new RegExp(`'${estado}'`), `Falta el estado ${estado}`);
}

const hero = file('components/dashboard/maeve-study-hero.tsx');
assert.match(hero, /<Personaje/, 'La home usa el componente Personaje.');
assert.doesNotMatch(hero, /EviMascot|evi-pencil|evi-float/, 'No quedan restos del Evi anterior en la home.');

const svgs = [
  ...readdirSync(new URL('../public/', import.meta.url)).filter((f) => /^evi-.*\.svg$/.test(f)),
  ...readdirSync(new URL('../public/evi/', import.meta.url)).map((f) => `evi/${f}`),
];
assert.ok(svgs.length >= 16, 'Se esperaban las ilustraciones de Evi en /public.');
for (const svg of svgs) {
  const source = file(`public/${svg}`);
  assert.match(source, /M40 \d+ H72 L96/, `${svg} debe usar la forma de hoja.`);
  assert.match(source, /#ffc933/, `${svg} debe tener la esquina amarilla.`);
}

const tipografia = file('app/tipografia.css');
assert.match(tipografia, /--text-saludo: 40px;/, 'La escala tiene el paso de 40 px para el saludo.');
