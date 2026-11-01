import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const picker = read('components/dashboard/practice-mode-picker.tsx');
const panel = read('components/dashboard/practice-history-panel.tsx');
const page = read('app/(es)/dashboard/practicar/page.tsx');
const history = read('lib/student-materials/practice-history.ts');
const api = read('app/api/practice/session/route.ts');
const migration = read('supabase/migrations/20261101140000_practice_mode_sessions.sql');

assert.match(picker, /lg:grid-cols-\[minmax\(0,1\.22fr\)_minmax\(310px,0\.86fr\)\]/, 'Dos columnas en escritorio');
assert.match(picker, /grid-cols-2 gap-2\.5/, 'Tarjetas compactas en móvil');
assert.match(picker, /material && <PracticeHistoryPanel/, 'Sin PDF no se presenta un historial engañoso');
assert.match(picker, /onStartFlashcards=\{\(\) => \{ setSessionLength\('rapido'\); setSelectedMode\('Flashcards'\); \}\}/,
  'El botón del vacío usa el flujo real de selección de Flashcards');
assert.match(panel, /if \(historyLoadError\)/, 'La falla de lectura no se confunde con una cuenta vacía');
assert.match(panel, /if \(sessions\.length === 0\)/, 'Estado vacío aislado');
assert.match(panel, /\/evi\/evi-animo\.svg/, 'Ilustración Evi real');
assert.match(panel, /Todavía no practicaste/);
assert.match(panel, /Empezar con Flashcards/);
assert.match(panel, /Qué vas a ver acá/);
assert.match(panel, /previousFour = sessions\.length >= 8/, 'La tendencia no compara muestras solapadas');
assert.match(panel, /router\.refresh\(\)/, 'Hay recuperación tras error');
assert.match(panel, /selected\.length > visible\.length/, 'Historial largo tiene paginación');
assert.match(page, /historyLoadError=\{historyLoadError\}/, 'El error llega al panel');
assert.match(history, /throw new Error\('practice_history_unavailable'\)/);
assert.match(history, /history_session_id/, 'Los eventos antiguos y actuales no se duplican por heurística amplia');
assert.match(api, /history_session_id: attemptId/, 'Cada guardado tiene correlación exacta');
assert.match(api, /\.eq\('user_id', user\.id\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);

console.log('Practicar: empty/history screens, routing, metrics, recovery, security — OK');
