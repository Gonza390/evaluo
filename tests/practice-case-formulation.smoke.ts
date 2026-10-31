import assert from 'node:assert/strict';
import {buildSourceBackedCases,qualifiedQuestions} from '../lib/student-materials/practice-modes.ts';
import type {CanonicalPedagogicalModel} from '../lib/student-materials/types.ts';
const build=(classifications: unknown[])=>buildSourceBackedCases({classifications} as CanonicalPedagogicalModel);
const ansoff=build([{title:'Estrategias de Crecimiento de la Matriz de Ansoff',pageReferences:[7],items:[
  'Penetracion de mercado: explotar productos existentes en mercado actual (riesgo medio)',
  'Desarrollo de mercados: explotar productos existentes en nuevos mercados (riesgo bajo)',
  'Desarrollo de productos: introducir nuevos productos en mercado actual (riesgo bajo)',
  'Diversificacion: introducir nuevos productos en nuevos mercados (riesgo alto)',
]}]);
assert.equal(ansoff.length,4,'Real PDF Ansoff model must produce one genuinely new scenario per strategy');
assert.ok(ansoff.every(c=>c.kind==='source-application'&&c.level==='aplicar'));
assert.ok(ansoff.every(c=>c.pageStart===7),'Use only the page in the uploaded PDF');
assert.ok(ansoff.every(c=>c.prompt.length>=125&&c.explanation.length>=105));
assert.equal(new Set(ansoff.map(c=>c.prompt)).size,4);
assert.ok(ansoff.every(c=>!c.prompt.toLowerCase().includes(c.answer.toLowerCase())));
assert.ok(ansoff.every(c=>!/riesgo (?:medio|bajo|alto)/i.test(c.prompt+' '+c.explanation)));
assert.deepEqual(ansoff.map(c=>c.answer).sort(),[
  'Penetracion de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificacion',
].sort());
assert.ok(ansoff.every(c=>qualifiedQuestions([c]).length===1));
const ipc=build([{title:'Perspectivas feministas sobre la ciencia',pageReferences:[23],items:[
  'Empirismo feminista: la elección depende de evidencia, lógica y valores explícitos en comunidad plural.',
  'Postmodernismo feminista: las teorías son relatos determinados por relaciones de poder y sujetos parciales.',
]}]);
assert.equal(ipc.length,2,'Real IPC PDF must have two defensible applied cases from documented theory');
assert.ok(ipc.every(c=>c.level==='aplicar'&&c.kind==='source-application'&&c.pageStart===23));
assert.ok(ipc.every(c=>!c.prompt.toLowerCase().includes(c.answer.toLowerCase())));
assert.equal(new Set(ipc.map(c=>c.answer)).size,2);
assert.ok(ipc.every(c=>c.explanation.length>=120));
const incomplete=build([{title:'Matriz de Ansoff',pageReferences:[7],items:[
  'Penetracion de mercado: productos existentes en el mercado actual',
  'Desarrollo de mercados: se desplazan a nuevos clientes en otro lugar',
  'Desarrollo de productos: productos nuevos en el mercado actual',
  'Diversificacion: productos nuevos en mercado nuevo',
]}]);
assert.ok(incomplete.every(c=>c.level!=='aplicar'),'Do not infer an unsourced product/market dimension');
assert.equal(qualifiedQuestions([{
 id:'ambiguous-inflection', prompt:'¿Qué estrategia permite ingresar a un territorio nuevo con productos existentes?',
 options:['Desarrollo de mercado','Desarrollo de mercados','Penetración de mercado'],
 answer:'Desarrollo de mercados',
 explanation:'Ambas expresiones de desarrollo de mercado son equivalentes en singular y plural.',
 pageStart:7,level:'comprender',
}]).length,0,'Near-duplicate singular/plural distractors are unfair and must be rejected');
const random=build([{title:'Clasificación sin criterios',pageReferences:[9],items:[
  'Categoría A','Categoría B','Categoría C',
]}]);
assert.equal(random.length,0,'Bare lists do not qualify as cases');
const duplicated=build([{title:'Dos explicaciones iguales',pageReferences:[9],items:[
  'Concepto Alpha: Se observa el mismo escenario y los mismos criterios al clasificar este grupo.',
  'Concepto Beta: Se observa el mismo escenario y los mismos criterios al clasificar este grupo.',
]}]);
assert.equal(duplicated.length,0,'Indistinguishable alternatives must not enter Practicar');
const leaked=build([{title:'Clases con respuesta textual',pageReferences:[9],items:[
 'Opción primera: La opción primera describe la base general que organiza todas las observaciones científicas.',
 'Opción segunda: La opción segunda describe otra base general que también organiza las observaciones.',
]}]);
assert.equal(leaked.length,0,'Never expose the answer in the scenario description');
console.log('Strict educational case formulation passed: true application, justified distractors and safe recognition fallback');
