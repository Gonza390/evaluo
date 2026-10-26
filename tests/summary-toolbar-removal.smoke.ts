import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const start = workspace.indexOf('  const tabHeader = (');
const end = workspace.indexOf('  const regenerationOverlay =', start);
assert.ok(start >= 0 && end > start, 'Se espera encontrar la cabecera del estudio.');
const header = workspace.slice(start, end);

assert.doesNotMatch(header, /Mostrar PDF|Ocultar PDF|Calificar|<a href=\{viewerUrl\}/,
  'La fila secundaria del Resumen y sus enlaces deben desaparecer.');
assert.doesNotMatch(workspace, /handleComments|MaterialFeedback|commentsOpen/,
  'El control eliminado no debe dejar código de feedback inalcanzable.');
assert.match(workspace, /aria-label="Mostrar PDF"/,
  'El visor del PDF debe seguir accesible desde el control lateral.');
assert.match(workspace, /aria-label="Ocultar PDF"/,
  'El visor debe seguir pudiendo cerrarse.');
assert.match(header, /canRegenerate && activeTab === 'resumen'/,
  'La acción de mantenimiento permitida debe permanecer accesible sin una fila extra.');
assert.match(header, /<TabsList/,
  'Las pestañas de estudio siguen disponibles.');

console.log('Summary secondary toolbar removal: OK.');
