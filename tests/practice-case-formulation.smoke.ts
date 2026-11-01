import assert from 'node:assert/strict';
import {buildSourceBackedCases,qualifiedQuestions,selectMixedQuestions} from '../lib/student-materials/practice-modes.ts';
import {verifyGeneratedPracticeCases} from '../lib/student-materials/practice-ai-cases.ts';
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

// Audit three university subjects using realistic excerpt-level source fixtures.
// These validate ingestion-independent grading/grounding, not a live Gemini call.
const universityFixtures = [
  {
    subject: 'Marketing',
    chapter: 'Unidad 4: Estrategias de crecimiento',
    page: 18 as number | null,
    evidence: 'Desarrollo de mercados: comercializar productos existentes en territorios nuevos, manteniendo la oferta que la empresa ya produce.',
    scenario: 'Una editorial vende libros de estudio a universidades de Córdoba y decide ofrecer los mismos títulos en una provincia donde todavía no tenía clientes, sin modificar el catálogo.',
    prompt: '¿Qué estrategia de crecimiento explica la decisión tomada por la editorial?',
    options: ['Penetración de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificación'],
    answer: 'Desarrollo de mercados',
    explanation: 'Es desarrollo de mercados porque conserva los libros actuales y cambia el territorio comercial. No es desarrollo de productos, ya que no introduce una oferta diferente.',
  },
  {
    subject: 'IPC',
    chapter: 'Unidad 2: Contrastación de hipótesis',
    page: null as number | null,
    evidence: 'Hipótesis auxiliar: supuesto adicional que se utiliza junto con una hipótesis principal al contrastar una teoría mediante consecuencias observables.',
    scenario: 'Un equipo investiga una predicción experimental, pero debe añadir un supuesto sobre la calibración del instrumento de medición para establecer qué observación esperar.',
    prompt: '¿Qué tipo de hipótesis representa el supuesto adicional del equipo investigador?',
    options: ['Hipótesis principal','Hipótesis auxiliar','Predicción observable','Ley científica'],
    answer: 'Hipótesis auxiliar',
    explanation: 'Es una hipótesis auxiliar porque el supuesto complementa la hipótesis principal y permite derivar una consecuencia observable; no constituye por sí mismo la tesis central que se busca contrastar.',
  },
  {
    subject: 'Organización',
    chapter: 'Unidad 3: Diseño de procesos',
    page: 12 as number | null,
    evidence: 'Estandarización: documentación de procedimientos, responsabilidades y controles para ejecutar tareas de manera consistente y reducir la variabilidad operativa.',
    scenario: 'Una clínica observa que cada recepcionista registra los turnos de manera distinta. La dirección establece pasos escritos, responsables y controles comunes para evitar diferencias entre turnos.',
    prompt: '¿Qué enfoque de organización se está aplicando en la clínica del ejemplo?',
    options: ['Delegación','Estandarización','Improvisación','Externalización'],
    answer: 'Estandarización',
    explanation: 'Es estandarización porque introduce pasos escritos y controles comunes para disminuir la variabilidad de un mismo proceso; delegar o externalizar no describe esa decisión.',
  },
];
for (const fixture of universityFixtures) {
  const fragment = {pageStart:fixture.page,sectionTitle:fixture.chapter,
    text:'Contenido de estudio universitario. ' + fixture.evidence + ' Examen de repaso por unidad.'};
  const supplied = {
    scenario:fixture.scenario,prompt:fixture.prompt,options:fixture.options,
    answer:fixture.answer,explanation:fixture.explanation,
    evidence:fixture.evidence,page:fixture.page,
    sectionTitle:fixture.page===null?fixture.chapter:undefined,
  };
  const checked = verifyGeneratedPracticeCases({cases:[supplied]},[fragment],fixture.options);
  assert.equal(checked.length,1,fixture.subject+': a genuinely novel, traceable application is accepted');
  assert.equal(checked[0]!.level,'aplicar');
  assert.equal(checked[0]!.answer,fixture.answer);
  assert.equal(checked[0]!.pageStart,fixture.page);
  assert.equal(verifyGeneratedPracticeCases({cases:[{
    ...supplied,evidence:'Cita fabricada sin respaldo documental suficiente en esta unidad académica.',
  }]},[fragment],fixture.options).length,0,fixture.subject+': fabricated evidence must be rejected');
  assert.equal(verifyGeneratedPracticeCases({cases:[{
    ...supplied,scenario:fixture.scenario+' La respuesta es '+fixture.answer+'.',
  }]},[fragment],fixture.options).length,0,fixture.subject+': revealing the answer makes the scenario unusable');
  const mislocated = fixture.page===null
    ? {...supplied,sectionTitle:'Otra unidad académica'}
    : {...supplied,page:99};
  assert.equal(verifyGeneratedPracticeCases({cases:[mislocated]},[fragment],fixture.options).length,0,
    fixture.subject+': incorrect PDF page or DOCX heading must not qualify');
}
// Cases from other classifications are useful recognition, but not application.
const managementRecognition=build([{
  title:'Tipos de intervención organizacional',pageReferences:[13],items:[
    'Preventiva: se anticipan dificultades mediante controles antes de que aparezcan fallas operativas.',
    'Correctiva: se investiga un problema ya observado y se restablece el funcionamiento normal.',
    'Predictiva: se analizan datos históricos para anticipar comportamientos probables de un proceso.',
  ],
}]);
assert.ok(managementRecognition.length>=2);
assert.ok(managementRecognition.every(q=>q.level==='comprender'&&q.kind==='classification-recognition'));
assert.equal(selectMixedQuestions([],managementRecognition).application,null,
  'Mixto must never relabel classification recall as a novel application case');
console.log('Multidisciplinary source-level pedagogical audit: Marketing, IPC DOCX, Organisation PDF, adversarial citations and fair Mixto');
