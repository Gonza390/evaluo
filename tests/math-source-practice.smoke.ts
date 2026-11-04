import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildVerifiedMathPractice } from '../lib/student-materials/math-source-practice.ts';
import { buildPedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';
import { analyzeQuestionBankCoverage } from '../lib/student-materials/question-bank.ts';
import type { CanonicalPedagogicalModel } from '../lib/student-materials/types.ts';

const model: CanonicalPedagogicalModel = {
  title:'Álgebra Lineal',overview:'Operaciones con matrices',
  topics:[],concepts:[],relationships:[],classifications:[],processes:[],
  formulas:[
    {expression:'Determinante 2x2',description:'Expresión ad-bc para matrices 2x2',pageReferences:[2]},
    {expression:'Cij = suma(Air * Brj)',description:'Elemento del producto de matrices AB',pageReferences:[3]},
  ],
  authorsOrTheories:[],examples:[],examRelevantClaims:[],confusions:[],chunkCount:2,
};
const chunks=[
  {text:'El determinante de una matriz de dos filas por dos columnas es ad-bc. '.repeat(3),pageStart:2,pageEnd:2,sectionTitle:'Determinantes',excerpt:''},
  {text:'La multiplicación de matrices se hace multiplicando fila por columna y sumando productos.'.repeat(3),pageStart:3,pageEnd:3,sectionTitle:'Producto de matrices',excerpt:''},
];
const worked=buildVerifiedMathPractice(model,chunks);
assert.equal(worked.length,6,'Produce seis ejercicios numéricos con soluciones comprobables.');
assert.equal(worked.filter(q=>q.level==='aplicar').length,6);
assert.equal(new Set(worked.map(q=>q.prompt)).size,6,'Cada ejercicio propone datos numéricos distintos.');
assert.ok(worked.every(q=>q.options.includes(q.answer)&&new Set(q.options).size===4));
assert.ok(worked.every(q=>q.reference.pageStart===2||q.reference.pageStart===3));
assert.ok(worked.every(q=>/ = [-\d]+\.$/.test(q.explanation)));
assert.equal(buildVerifiedMathPractice({...model,formulas:[]},chunks).length,0,
  'No generamos cálculos cuando la regla matemática no existe en el material.');
assert.equal(buildVerifiedMathPractice(model,[]).length,0,
  'Una fórmula sin una fuente real no autoriza preguntas nuevas.');
assert.equal(buildVerifiedMathPractice(model,[{...chunks[0]!,pageStart:6},chunks[1]!]).length,3,
  'Una cita de la página equivocada debe invalidar solo la familia afectada.');

const tangentModel:CanonicalPedagogicalModel={
  ...model,
  formulas:[{
    expression:'Plano tangente genérico',
    description:'z = f(x0, y0) + fx(x0, y0)(x - x0) + fy(x0, y0)(y - y0)',
    pageReferences:[4],
  }],
  examples:['f(x, y) = x^2 + 2y'],
};
const tangentSources=[
  {text:'El plano tangente es z = f(x0, y0) + fx(x0, y0)(x - x0) + fy(x0, y0)(y - y0). '.repeat(2),
    pageStart:4,pageEnd:4,sectionTitle:'Plano tangente',excerpt:''},
  {text:'Calcular el plano tangente para f(x, y) = x^2 + 2y y comprobar la solución.',
    pageStart:5,pageEnd:5,sectionTitle:'Ejercicios',excerpt:''},
];
const tangent=buildVerifiedMathPractice(tangentModel,tangentSources);
assert.equal(tangent.length,2,'Las funciones con fórmula acreditada permiten ejercicios de plano tangente.');
assert.deepEqual(tangent.map(q=>q.answer),
  ['z = 2x + 2y - 1','z = 4x + 2y - 4']);
assert.ok(tangent.every(q=>q.options.includes(q.answer)&&q.level==='aplicar'));
assert.equal(buildVerifiedMathPractice(tangentModel,tangentSources.slice(0,1)).length,0,
  'No crear ejercicios de tangencia si la función no figura en el original.');
assert.equal(buildVerifiedMathPractice({...tangentModel,examples:[]},tangentSources).length,0,
  'La fuente documental aislada no basta sin la función del modelo canónico.');
const major='Trastorno de Depresión Mayor';
const persistent='Trastorno Depresivo Persistente';
const majorDetail='Requiere al menos dos semanas con cambios del afecto y otros síntomas específicos.';
const persistentDetail='Presenta síntomas depresivos persistentes durante un mínimo de dos años en adultos.';
const theoryPage=`${major}: ${majorDetail} ${persistent}: ${persistentDetail}`;
const theoryModel:CanonicalPedagogicalModel={
  ...model,formulas:[],concepts:[
    {term:major,detail:majorDetail,kind:'definicion',pageReferences:[4]},
    {term:persistent,detail:persistentDetail,kind:'definicion',pageReferences:[4]},
  ],
};
const theoryQuestions=buildPedagogicalArtifacts({
  summary:{
    shortSummary:'Diferencias entre trastornos depresivos.',
    keyPoints:[],sections:[{title:'Diagnóstico diferencial',body:theoryPage}],
    hasContent:true,status:'ready',provider:'test',errorMessage:null,sourceChunksCount:1,
  },
  glossary:[],canonicalModel:theoryModel,pageCount:4,
  chunks:[{text:theoryPage.repeat(2),pageStart:4,pageEnd:4,
    sectionTitle:'Diagnóstico diferencial',excerpt:''}],
}).questions;
assert.ok(theoryQuestions.some(q=>
  q.type==='open' && q.kind==='relationship' &&
  q.prompt.includes(major) && q.prompt.includes(persistent) &&
  q.answer.includes(majorDetail) && q.answer.includes(persistentDetail)),
  'La teoría con dos conceptos relacionados y fuentes explícitas debe proponer una comparación sustentada.');
const sections=[{title:'Determinantes',body:'Definición y fórmula de determinantes.'},
{title:'Multiplicación',body:'Producto matricial fila por columna.'}];
const coverage=analyzeQuestionBankCoverage(worked,sections,3);
assert.equal(coverage.chaptersBelowMinimum.length>0,true,
  'Tres cálculos por unidad no autorizan marcar seis ejercicios por tema.');
assert.equal(coverage.status,'limited',
  'La cobertura incompleta no puede marcarse como distributed.');
const code=readFileSync(new URL('../lib/student-materials/pedagogy.ts',import.meta.url),'utf8');
assert.match(code,/buildVerifiedMathPractice\(model, chunks\)/,
  'La generación canónica integra ejercicios matemáticos calculados y trazables.');
console.log('Math applications: computed answers, source guards and honest topic coverage passed.');
