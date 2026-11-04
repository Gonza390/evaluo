import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildVerifiedMathPractice } from '../lib/student-materials/math-source-practice.ts';
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
