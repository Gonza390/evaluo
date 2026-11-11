import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// Páginas huérfanas (Ahrefs 11/11): las guías por materia, carreras y universidades del sitemap
// tienen que tener al menos un enlace interno. El índice /landings/estudiar sale del propio sitemap.
const hub = read('app/(es)/landings/estudiar/page.tsx');
assert.match(hub, /import sitemap from '@\/app\/sitemap'/);
assert.match(hub, /\\\/landings\\\/estudiar\\\//);
assert.match(hub, /\\\/estudiar\\\/\[\^\/\]\+\\\//);
assert.match(hub, /\\\/universidad\\\//);
assert.match(hub, /href="\/landings\/resumenes"/);

const sitemap = read('app/sitemap.ts');
assert.match(sitemap, /\$\{baseUrl\}\/landings\/estudiar`/);

// El índice tiene enlaces desde la home (footer) y desde /pregunteros.
assert.match(read('components/footer-home.tsx'), /href="\/landings\/estudiar"/);
const pregunteros = read('app/(es)/pregunteros/page.tsx');
assert.match(pregunteros, /href="\/landings\/estudiar"/);
assert.match(pregunteros, /href="\/landings\/resumenes"/);

console.log('seo-orphan-hub smoke ok');
