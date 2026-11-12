import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EVI_CHAT_FREE_DAILY_LIMIT,
  eviChatSuggestions,
  sanitizeEviChatInput,
} from '@/lib/evi-chat-contract';

const read = (path: string) => readFileSync(path, 'utf8');
const id = '3f2b1c4d-1111-4a2b-9c3d-123456789abc';

// Contrato: valida, recorta y nunca acepta texto del apunte desde el cliente.
assert.equal(sanitizeEviChatInput({ context: null, history: [], message: 'hola' }), null);
assert.equal(
  sanitizeEviChatInput({ context: { kind: 'practice', materialId: 'x', question: 'q', correctAnswer: 'a' }, history: [], message: 'hola' }),
  null,
  'Un materialId inválido se rechaza.'
);
const parsed = sanitizeEviChatInput({
  context: { kind: 'practice', materialId: id, question: '¿Qué es Share of Wallet?', correctAnswer: 'Parte del gasto', page: 6, excerpt: 'INYECTADO' },
  history: Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: 'x'.repeat(5000) })),
  message: '  ¿En qué se diferencia?  ',
});
assert.ok(parsed);
assert.equal(parsed.message, '¿En qué se diferencia?');
assert.equal(parsed.history.length, 6, 'Solo se envían los últimos 6 mensajes.');
assert.ok(parsed.history.every((m) => m.text.length <= 1200), 'Cada mensaje se recorta.');
assert.ok(!('excerpt' in parsed.context), 'El fragmento del apunte nunca viene del cliente.');
assert.equal(sanitizeEviChatInput({ context: { kind: 'error', errorId: 'nope', label: '' }, history: [], message: 'hola' }), null);

assert.match(eviChatSuggestions('Segmentación')[0], /¿En qué se diferencia de «Segmentación»\?/);
assert.equal(eviChatSuggestions('Verdadero').length, 3, 'Verdadero/Falso no genera una comparación sin sentido.');
assert.equal(EVI_CHAT_FREE_DAILY_LIMIT, 5);

// Servidor: sesión, límites, propiedad del material y protección contra inyección.
const service = read('lib/evi-chat-service.ts');
const route = read('app/api/evi-chat/route.ts');
const context = read('lib/evi-chat-context.ts');
const tutor = read('lib/ai-tutor.ts');
const providers = read('lib/ai/providers.ts');
assert.match(service, /auth\.getUser\(\)/);
assert.match(service, /evi-chat:burst:/);
assert.match(service, /evi-chat:daily:/);
assert.match(service, /hasPremiumAccess/);
assert.ok(service.indexOf('loadEviChatGrounding(') < service.indexOf('evi-chat:daily:'),
  'Si la pregunta no existe, no se consume una pregunta del día.');
assert.match(route, /prepareEviChat\(/, 'La ruta pasa siempre por las comprobaciones.');
assert.match(route, /'Content-Type': 'text\/plain; charset=utf-8'/, 'La respuesta se escribe en vivo.');
assert.match(route, /generateStudyErrorReviewQuestion\(/, 'La pregunta parecida reutiliza la comprobación verificada contra el apunte.');
assert.match(route, /if \(!grounding\.excerpt\)/, 'Sin fragmento del apunte no se inventa una pregunta.');
assert.match(providers, /stream: true/);
assert.match(tutor, /const fallback = await generateEviChatReply\(input\)/, 'Si no hay streaming, responde igual.');
assert.match(context, /\.eq\('user_id', userId\)/, 'Solo el dueño del material puede preguntar sobre él.');
assert.match(context, /import 'server-only'/);
const chatPrompt = tutor.slice(tutor.indexOf('function buildEviChatPrompt'));
assert.match(chatPrompt, /PROMPT_INJECTION_GUARD/);
assert.match(chatPrompt, /isolateUntrustedContent\(input\.message\)/);
assert.match(chatPrompt, /sin inventar datos/);

// Interfaz: entra deslizando, respeta movimiento reducido, Esc cierra y el botón se oculta.
const panel = read('components/study/evi-chat-panel.tsx');
const css = read('components/study/evi-chat.css');
assert.match(panel, /lg:translate-x-full/, 'En compu entra desde la derecha.');
assert.match(panel, /translate-y-full/, 'En el celular sube desde abajo.');
assert.match(panel, /motion-reduce:transition-none/);
assert.match(panel, /event\.key === 'Escape'/);
assert.match(panel, /\{!open \? \(/, 'El botón desaparece mientras el chat está abierto.');
assert.match(css, /html\.evi-chat-open body \{\s*padding-right: 400px;/, 'El contenido se corre a la izquierda.');
assert.match(panel, /Te contesto con tu apunte/);
const effects = read('components/study/evi-chat.css');
assert.match(effects, /@keyframes evi-pop/, 'Evi aparece con un pop.');
assert.match(effects, /@keyframes evi-dot/, 'Puntitos mientras piensa.');
assert.match(effects, /prefers-reduced-motion: reduce\) \{[\s\S]*\.evi-pop,[\s\S]*animation: none/, 'Sin animaciones con movimiento reducido.');
assert.match(panel, /Buscando en tu apunte/, 'Si tarda, cuenta qué está haciendo.');
assert.match(panel, /reader\.read\(\)/, 'Lee la respuesta a medida que llega.');
assert.match(panel, /data-evi-quiz/, 'La pregunta parecida se responde con botones.');
assert.match(panel, /Ya entendí →/, 'Opción rápida para cerrar y seguir.');
assert.match(panel, /'Otro ejemplo', 'Más simple'/);

const feedback = read('components/study/answer-feedback.tsx');
const session = read('components/dashboard/practice-session.tsx');
const exam = read('components/student-material-exam.tsx');
const detail = read('components/dashboard/study-error-detail.tsx');
assert.match(feedback, /showEvi = Boolean\(evi\) && !correct/, 'Evi aparece solo al equivocarse.');
assert.equal((session.match(/evi=\{eviFor\(/g) ?? []).length, 4, 'Casos, mixto, completar y verdadero o falso.');
assert.match(session, /if \(previewResult\) return null;/, 'Sin Evi en la vista previa.');
assert.match(exam, /evi=\{isSimulation \|\|/, 'Sin Evi en la demo ni en simulaciones.');
assert.match(detail, /kind: 'error',\s*errorId: item\.id/, 'Mis errores abre el chat del error.');

console.log('[evi-chat] contrato, límites, propiedad del material, panel deslizante y botones en práctica y Mis errores.');
