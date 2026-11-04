import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  independentlyVerifiedTopicQuestions,
  selectTopicSourceFragments,
  verifyTopicPracticeCandidates,
} from '../lib/student-materials/topic-practice-ai.ts';

const material='La fotosíntesis transforma la energía de la luz en energía química en las plantas. Durante la fase luminosa se genera ATP y se liberan electrones mediante reacciones fotoquímicas. La fase de fijación de carbono utiliza productos de la fase luminosa.';
const extra='La mitosis permite repartir material genético durante la división celular, mientras la meiosis reduce el número de cromosomas para formar gametos. Cada proceso tiene una función biológica particular.';
const sources=[
  {text:material,pageStart:2,sectionTitle:null},
  {text:extra,pageStart:3,sectionTitle:null},
];
const selected=selectTopicSourceFragments(sources,'Fotosíntesis',material,0);
assert.equal(selected.length,1);
assert.equal(selected[0]?.pageStart,2,'No deben mezclarse fuentes de otra materia.');
assert.deepEqual(selectTopicSourceFragments([], 'Fotosíntesis',material),[]);
const evidence='La fotosíntesis transforma la energía de la luz en energía química en las plantas.';
const prompt='¿Qué transformación energética explica la fotosíntesis en las plantas?';
const raw={questions:[{
  prompt,options:['Luz a energía química','Energía química a luz','Gravedad a calor','Calor a gravedad'],
  answer:'Luz a energía química',
  explanation:'La fuente señala que la luz se transforma en energía química durante la fotosíntesis.',
  evidence,page:2,level:'comprender',
}]};
const candidates=verifyTopicPracticeCandidates(raw,sources,'Fotosíntesis');
assert.equal(candidates.length,1);
assert.equal(candidates[0]?.chapterTitle,'Fotosíntesis');
assert.equal(candidates[0]?.reference.pageStart,2);
assert.equal(verifyTopicPracticeCandidates(raw,sources,'Fotosíntesis',[prompt]).length,0);
assert.equal(verifyTopicPracticeCandidates({questions:[{...raw.questions[0]!,page:5}]},
  sources,'Fotosíntesis').length,0,'Nunca inventar páginas.');
assert.equal(verifyTopicPracticeCandidates({questions:[{...raw.questions[0]!,
  evidence:'Una frase que no está documentada en el PDF original y tampoco es cierta.'}]},
  sources,'Fotosíntesis').length,0,'Exigir una cita literal.');
assert.equal(verifyTopicPracticeCandidates({questions:[{...raw.questions[0]!,
  options:['Luz a energía química','Luz a energía química','Gravedad a calor','Calor a gravedad']}]},
  sources,'Fotosíntesis').length,0,'No aceptar respuestas duplicadas.');
const reviewed={judgments:[{prompt,selectedAnswer:'Luz a energía química',
  verdict:'supported',evidence}]};
assert.equal(independentlyVerifiedTopicQuestions(candidates,reviewed).length,1);
assert.equal(independentlyVerifiedTopicQuestions(candidates,{judgments:[{...reviewed.judgments[0]!,
  selectedAnswer:'Energía química a luz'}]}).length,0,
  'El revisor independiente debe coincidir en una única respuesta.');
assert.equal(independentlyVerifiedTopicQuestions(candidates,{judgments:[{...reviewed.judgments[0]!,
  verdict:'ambiguous'}]}).length,0,'Una respuesta dudosa se descarta.');
const docx=[{text:material,pageStart:null,sectionTitle:'Unidad fotosíntesis'}];
assert.equal(verifyTopicPracticeCandidates({questions:[{...raw.questions[0]!,
  page:undefined,sectionTitle:'Unidad fotosíntesis'}]},docx,'Fotosíntesis').length,1);
assert.equal(verifyTopicPracticeCandidates({questions:[{...raw.questions[0]!,
  page:undefined,sectionTitle:'Unidad distinta'}]},docx,'Fotosíntesis').length,0);
const route=readFileSync(new URL('../app/api/practice/topic-supplement/route.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../components/student-material-exam.tsx',import.meta.url),'utf8');
assert.match(route,/\.eq\('user_id',user\.id\)/,'Exigir titularidad.');
assert.match(route,/enforceStrictRateLimit\(/,'Aplicar cupos.');
assert.match(route,/independentlyVerifiedTopicQuestions\(/);
assert.match(ui,/fetch\('\/api\/practice\/topic-supplement'/);
assert.match(ui,/verifiedTopicCount < MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS/);
assert.doesNotMatch(readFileSync(new URL('../lib/student-materials/processing-service.ts',import.meta.url),'utf8'),
  /\/api\/practice\/topic-supplement/,
  'Procesar un PDF no debe iniciar generación adicional de práctica.');
console.log('Topic practice AI: source validation, DOCX, independent QA, privacy and on-demand flow OK.');
