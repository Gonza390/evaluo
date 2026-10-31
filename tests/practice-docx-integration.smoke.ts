import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyGeneratedPracticeCases } from '../lib/student-materials/practice-ai-cases.ts';
import { feedbackSourceFromArtifact, applyVerifiedFeedbackEdits } from '../lib/student-materials/practice-feedback-quality.ts';
import { buildPracticeBank, sufficientPracticeBank, assessPracticeBankQuality } from '../lib/student-materials/practice-on-demand.ts';
import { qualifiedQuestions, balancedQuestions } from '../lib/student-materials/practice-modes.ts';

const sectionTitle = 'Unidad 2: Estrategias de crecimiento';
const evidence = 'Desarrollo de mercados: la organización comercializa productos ya existentes en regiones donde antes no participaba';
const chunks = [{
  pageStart: null, sectionTitle,
  text: 'Matriz de crecimiento. Penetración de mercado: vender productos existentes en el mercado actual. ' +
    evidence + '. Diversificación: productos nuevos en mercados nuevos. ' +
    'Desarrollo de productos: introducir una oferta nueva en el mercado actual.',
}];
const terms = ['Penetración de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificación'];
const entry = {
  scenario: 'Una editorial vende manuales en Córdoba desde hace cinco años y decide vender exactamente los mismos manuales en una región en la que todavía no opera.',
  prompt: '¿Qué estrategia de crecimiento representa mejor esta decisión de la editorial?',
  options: terms, answer: 'Desarrollo de mercados',
  explanation: 'El desarrollo de mercados mantiene el producto y cambia el mercado objetivo; es diferente de la penetración de mercado, donde ambos elementos permanecen dentro de los negocios actuales.',
  evidence, page: null, sectionTitle,
};
const verified = verifyGeneratedPracticeCases({ cases: [entry] },chunks,terms);
assert.equal(verified.length,1,'DOCX generated cases must verify against an actual section');
assert.equal(verified[0]?.pageStart,null,'Never fabricate a Word page number');
assert.equal(verified[0]?.chapterTitle,sectionTitle);
assert.equal(verified[0]?.level,'aplicar');
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,sectionTitle:'Unidad 1: Mercado'}]},chunks,terms).length,0,'Wrong section is rejected');
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,page:7}]},chunks,terms).length,0,'Fabricated PDF page is rejected');
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,evidence:'Una cita inventada que no existe en ningún apartado del Word.'}]},chunks,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,scenario:entry.scenario+' Se trata de un desarrollo de mercados.'}]},chunks,terms).length,0);
const excerpt = 'La estandarización busca reducir la dependencia del trabajo respecto a las personas para que los procesos sean repetibles y verificables.';
const raw={
  id:'word-q1',type:'multiple_choice',prompt:'¿Qué objetivo tiene estandarizar procesos en una organización?',
  options:['Disminuir la dependencia de personas individuales','Multiplicar errores y duplicar procedimientos'],
  answer:'Disminuir la dependencia de personas individuales',
  explanation:'Es la respuesta correcta y se define como una forma de gestión.',
  level:'comprender',reference:{pageStart:null,pageEnd:null,sectionTitle:'Unidad 3: Organización',excerpt},
};
const src=feedbackSourceFromArtifact(raw);
assert.ok(src,'Word question must supply source-backed editorial provenance');
assert.equal(src?.pageStart,null);
assert.equal(src?.sectionTitle,'Unidad 3: Organización');
const question=buildPracticeBank({questions:[raw]},null,[],'simulacro').questions;
assert.equal(question.length,1);
assert.equal(question[0]?.chapterTitle,'Unidad 3: Organización');
assert.equal(assessPracticeBankQuality({questions:question,cases:[],version:4},'simulacro').uncitedQuestionCount,0);
const explanation='La estandarización permite reducir la dependencia de personas individuales porque el equipo puede repetir y comprobar los procesos; duplicar procedimientos y errores no sería una mejora organizacional.';
const improved=applyVerifiedFeedbackEdits(question,{feedback:[{
  sourceId:'word-q1',explanation,evidence:excerpt.slice(0,100),
  sectionTitle:'Unidad 3: Organización',page:null,
}]},[src!]);
assert.equal(improved[0]?.explanation,explanation);
assert.equal(improved[0]?.answer,question[0]?.answer);
assert.equal(applyVerifiedFeedbackEdits(question,{feedback:[{
  sourceId:'word-q1',explanation,evidence:excerpt.slice(0,100),
  sectionTitle:'Otro apartado',page:null,
}]},[src!])[0]?.explanation,question[0]?.explanation);
const many=Array.from({length:6},(_,i)=>({
  ...question[0]!,id:'word-'+i,prompt:'Pregunta académica '+i+' sobre el aprendizaje?',
  chapterTitle:i<3?'Unidad 1':'Unidad 2',
}));
assert.equal(qualifiedQuestions(many).length,6);
assert.equal(balancedQuestions(many,4).length,4);
assert.ok(new Set(balancedQuestions(many,4).map(q=>q.chapterTitle)).size>=2);
assert.equal(sufficientPracticeBank({version:4,questions:many,cases:[]},'simulacro'),true);
const file=(p:string)=>readFileSync(new URL(p,new URL('../',import.meta.url)),'utf8');
const route=file('app/api/practice/prepare/route.ts');
const direct=file('app/api/practice/cases/route.ts');
const view=file('components/dashboard/practice-session.tsx');
assert.match(route,/docxCaseSchema/);
assert.match(route,/docxFeedbackSchema/);
assert.match(direct,/docxSchema/);
assert.ok(direct.includes("PRACTICE_BANK_ENABLED !== '1'"),
  'The direct Gemini endpoint must not spend AI until the isolated bank is enabled.');
assert.ok(direct.indexOf("PRACTICE_BANK_ENABLED !== '1'") < direct.indexOf('enforceStrictRateLimit({'),
  'Disabled AI must stop before allocating a rate-limit slot.');

assert.doesNotMatch(view,/mode !== 'simulacro' \\|\\| question\\.pageStart !== null/);
assert.match(view,/mode !== 'simulacro' \\|\\| isWord \\|\\| question\\.pageStart !== null/,
  'PDF still rejects uncited exam questions; Word permits section references');
assert.match(file('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx'),
  /isWord=\\{material\\.file_name\\.toLowerCase\\(\\)\\.endsWith\\('\\.docx'\\)\\}/);
const process=file('lib/student-materials/processing-service.ts');
assert.doesNotMatch(process,/student_material_practice_banks|PRACTICE_PEDAGOGICAL_AI_ENABLED|practice\/prepare/,'Word and PDF ingestion must not generate costly advanced modes');
console.log('DOCX practice full-mode source, correction, case generation and cache compatibility tests passed');
