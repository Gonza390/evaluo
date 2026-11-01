import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  verifyGeneratedTrueFalse, verifiedTrueFalsePool, sufficientTrueFalse, selectBalancedTrueFalse,
} from '../lib/student-materials/practice-true-false.ts';

const correct = [
  'El estudio comparativo identifica relaciones entre las variables analizadas y permite describir tendencias observadas con datos del curso.',
  'La estrategia de penetración de mercado utiliza productos actuales dentro de los mercados donde la empresa ya participa activamente.',
  'Una hipótesis auxiliar incorpora supuestos adicionales que permiten derivar consecuencias contrastables en una investigación científica.',
  'La planificación comercial organiza los recursos disponibles y define objetivos específicos para orientar las decisiones del equipo.',
  'La evaluación formativa ofrece retroalimentación durante el aprendizaje y permite revisar las dificultades antes de la evaluación final.',
  'El análisis organizacional considera las responsabilidades de cada área y estudia cómo se coordinan las tareas entre equipos.',
];
const falseVersions = [
  correct[0]!.replace('comparativo','experimental'),
  correct[1]!.replace('penetración','diversificación'),
  correct[2]!.replace('auxiliar','fundamental'),
  correct[3]!.replace('comercial','financiera'),
  correct[4]!.replace('formativa','sumativa'),
  correct[5]!.replace('organizacional','presupuestario'),
];
const fragments = correct.map((text,i)=>({
  pageStart:i+1,sectionTitle:null,text:'Capítulo académico. '+text+' El texto compara las modalidades y explica sus diferencias.',
}));
const assertions = correct.map((text,i)=>({
  statement:i<3?text:falseVersions[i]!,
  correct:i<3,
  correction:text,
  explanation:'El material establece literalmente lo siguiente y esto permite verificar la afirmación: '+text,
  evidence:text,
  page:i+1,
}));
const verified = verifyGeneratedTrueFalse({assertions},fragments);
assert.equal(verified.length,6,'Six sourced claims must be independently verified.');
assert.equal(verified.filter(q=>q.answer==='Verdadero').length,3);
assert.equal(verified.filter(q=>q.answer==='Falso').length,3);
assert.ok(verified.every(q=>q.options.join('/')==='Verdadero/Falso' &&
  q.kind==='true-false-source-backed'),'Opciones is NOT multiple choice.');
assert.equal(sufficientTrueFalse(verified),true);
const balanced = selectBalancedTrueFalse(verified);
assert.equal(balanced.length,6);
assert.equal(balanced.filter(q=>q.answer==='Verdadero').length,3);
assert.equal(balanced.filter(q=>q.answer==='Falso').length,3);
const longPool = [...verified, ...correct.slice(0,3).map((text,i) => ({
 ...verified[i]!, id:'extra-'+i,
 prompt:text+' El dato adicional corresponde a la clase de este semestre.',
}))];
const displayed = selectBalancedTrueFalse(longPool, 6);
assert.equal(displayed.length,6);
assert.ok(displayed.filter(q=>q.answer==='Falso').length >= 2);
assert.equal(sufficientTrueFalse(verified.slice(0,5)),false);
assert.equal(sufficientTrueFalse(verified.filter(q=>q.answer==='Verdadero')),false);
assert.equal(verifiedTrueFalsePool(verified).length,6);
assert.equal(verifyGeneratedTrueFalse({assertions:[{
  ...assertions[0],page:50,
}]},fragments).length,0,'A fabricated PDF page must be rejected.');
assert.equal(verifyGeneratedTrueFalse({assertions:[{
  ...assertions[0],evidence:'Esta es una cita textual inventada que no figura en el documento de estudio.',
}]},fragments).length,0,'Fabricated source evidence must be rejected.');
assert.equal(verifyGeneratedTrueFalse({assertions:[{
  ...assertions[3],statement:assertions[3]!.correction,
}]},fragments).length,0,'A literally sourced true assertion must never be labelled false.');
assert.equal(verifyGeneratedTrueFalse({assertions:[{
  ...assertions[3],statement:'El contenido de las clases no tiene relación alguna con las estrategias ni los recursos del proyecto académico.',
}]},fragments).length,0,'False paraphrases with no close source counterpart must be rejected.');
const word={...assertions[0],page:null,sectionTitle:'Unidad 1: Metodología'};
assert.equal(verifyGeneratedTrueFalse({assertions:[word]},[{
  pageStart:null,sectionTitle:'Unidad 1: Metodología',text:fragments[0]!.text,
}]).length,1,'DOCX claims cite exact headings.');
assert.equal(verifyGeneratedTrueFalse({assertions:[{
  ...word,sectionTitle:'Unidad 2: Teoría',
}]},[{pageStart:null,sectionTitle:'Unidad 1: Metodología',text:fragments[0]!.text}]).length,0);
const file=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const session=file('components/dashboard/practice-session.tsx');
const endpoint=file('app/api/practice/true-false/route.ts');
const picker=file('components/dashboard/practice-mode-picker.tsx');
const upload=file('lib/student-materials/processing-service.ts');
assert.match(session,/mode === 'opciones'\s*\)?\s*return selectBalancedTrueFalse\(trueFalsePool, reviewLength === 'rapido' \? 6 : 8, round\)/);
assert.match(session,/sufficientTrueFalse\(trueFalsePool, MIN_CASES_PER_PRACTICE\)/);
assert.match(session,/fetch\('\/api\/practice\/true-false'/);
assert.match(endpoint,/export async function POST\(/);
assert.match(endpoint,/verifyGeneratedTrueFalse\(parsed,fragments\)/);
assert.match(endpoint,/\.eq\('user_id',user\.id\)/);
assert.match(endpoint,/enforceStrictRateLimit\(/);
assert.match(endpoint,/['"]practice-ai-true-false:/);
assert.match(picker,/Decidí si cada afirmación es verdadera o falsa/);
assert.doesNotMatch(upload,/practice\/true-false/,
  'No true-false generation while initially processing a PDF/DOCX.');
console.log('Opciones on-click True/False grounding, answer balance and UI integration: passed');
