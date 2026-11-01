import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isAdministrativeConcept, isAdministrativeMultipleChoice,
  isAdministrativeStudyDescription,
} from '../lib/student-materials/nonacademic-metadata.ts';
import { qualifiedQuestions, type PracticeQuestion } from '../lib/student-materials/practice-modes.ts';
import {
  sanitizePedagogicalArtifacts, unsafeModelAnswerReason,
} from '../lib/student-materials/pedagogical-integrity.ts';
import type { StudyQuestion, PedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';

// Regression from the actual student's module 3/4 screenshot.
// Metadata copied from a PDF cover was stored with the keyed "right" answer.
// Passing an option-based grade alone must never let this teach a false fact.
const prompt='¿Qué significa “Desarrollo Emprendedor”?';
const answer='Materia correspondiente a los modulos 3 y 4 del plan de estudios.';
const options=[
  answer,
  'Institucion universitaria que imparte la materia.',
  'Carrera a la que pertenece el material de estudio.',
  'Etapa caracterizada por buscar la eficiencia comenzando a focalizar y adquirir especializacion en lo que se sabe hacer.',
];
const reference = {
  pageStart:1, pageEnd:1,sectionTitle:'Tu espacio academico',
  excerpt:'MATERIAL COMPARTIDO PARA ESTUDIAR modulo 3 y 4 resumen MATERIA Desarrollo Emprendedor CARRERA Licenciatura en Comercialización - Marketing UNIVERSIDAD Universidad Siglo 21 Documento original: 23 paginas Segui estudiando.',
};
assert.equal(isAdministrativeStudyDescription(answer),true);
assert.equal(isAdministrativeStudyDescription(options[1]!),true);
assert.equal(isAdministrativeStudyDescription(options[2]!),true);
assert.equal(isAdministrativeConcept({term:'Desarrollo Emprendedor',detail:answer,modelTitle:'Módulos 3 y 4'}),true);
assert.equal(isAdministrativeMultipleChoice({
  prompt,answer,options,kind:'concept',sectionTitle:reference.sectionTitle,sourceExcerpt:reference.excerpt,
}),true);
const infected:StudyQuestion={
  id:'q-v11-concept-16fcane-17f64y2',type:'multiple_choice',level:'recordar',
  kind:'concept',topic:'Desarrollo Emprendedor',prompt,answer,options,
  explanation:'“Desarrollo Emprendedor” se caracteriza por: '+answer,
  reference,
};
assert.equal(unsafeModelAnswerReason(infected,[]),'nonacademic_document_metadata');
const safe:StudyQuestion={
  ...infected,id:'qualified-1',topic:'Penetración de mercado',
  prompt:'¿Qué significa “Penetración de mercado”?',
  answer:'Vender más productos existentes a clientes del mercado actual.',
  options:[
    'Vender más productos existentes a clientes del mercado actual.',
    'Crear productos nuevos para el mismo mercado actual.',
    'Ofrecer productos actuales en mercados todavía no atendidos.',
    'Crear productos nuevos para mercados todavía no atendidos.',
  ],
  explanation:'La penetración de mercado conserva tanto la oferta como el mercado, buscando incrementar las ventas.',
  reference:{
    pageStart:3,pageEnd:3,sectionTitle:'Estrategias de crecimiento',
    excerpt:'La penetración de mercado conserva la oferta y el mercado, buscando vender más productos actuales a clientes ya atendidos.',
  },
};
assert.equal(unsafeModelAnswerReason(safe,[]),null);
const artifacts:PedagogicalArtifacts={
  questions:[infected,safe],flashcards:[],
  miniExamQuestionIds:[infected.id,safe.id],
  coverage:{conceptsUsed:2,sectionsUsed:1,referencedItems:2,totalItems:2},
};
const filtered=sanitizePedagogicalArtifacts(artifacts,[]);
assert.deepEqual(filtered.questions.map(q=>q.id),[safe.id]);
assert.deepEqual(filtered.miniExamQuestionIds,[safe.id]);
assert.ok(filtered.integrity?.rejectedReasons.includes('nonacademic_document_metadata'));
const practice=(q:StudyQuestion):PracticeQuestion=>({
  id:q.id,prompt:q.prompt,answer:q.answer,options:q.options,
  explanation:q.explanation,kind:q.kind,level:q.level,
  pageStart:q.reference.pageStart,chapterTitle:q.chapterTitle??null,
});
assert.deepEqual(qualifiedQuestions([practice(infected),practice(safe)]).map(q=>q.id),[safe.id],
  'Mixto and Simulacro must reject stored metadata even if the bank bypasses sanitized artifacts.');

// A legitimate academic definition stays eligible even when the course's
// cover includes the words materia, carrera or universidad elsewhere.
assert.equal(isAdministrativeConcept({
  term:'Estrategia competitiva',detail:'Conjunto de decisiones que diferencia la oferta frente a competidores.',
  modelTitle:'Fundamentos de gestión',
}),false);
assert.equal(isAdministrativeMultipleChoice({
  prompt:safe.prompt,answer:safe.answer,options:safe.options,kind:'concept',
  sectionTitle:'Estrategias de crecimiento',sourceExcerpt:safe.reference.excerpt,
}),false);
const pedagogy=readFileSync(new URL('../lib/student-materials/pedagogy.ts',import.meta.url),'utf8');
assert.match(pedagogy,/!isAdministrativeCanonicalConcept\(model,concept\)/);
assert.match(pedagogy,/!isAdministrativeCanonicalConcept\(model, concept\)/);
assert.match(pedagogy,/!isAdministrativeStudyDescription\(concept\.definition\)/);
console.log('Cover metadata is blocked upstream and in historical banks without rejecting academic concepts.');
