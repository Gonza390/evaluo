import assert from 'node:assert/strict';
import {isNonSequentialProcess,malformedClassificationClue,practiceQuestionQualityIssue} from '../lib/student-materials/practice-question-quality.ts';
import {qualifiedQuestions,balancedQuestions,type PracticeQuestion} from '../lib/student-materials/practice-modes.ts';

const question=(id:string,prompt:string,answer:string,kind:string):PracticeQuestion=>({
  id,prompt,answer,kind,level:'comprender',pageStart:9,
  options:[answer,'Desarrollo de mercados','Diversificación comercial'],
  explanation:'La respuesta es verificable con las definiciones del tema de estudio.',
});
const resources=question('resources','¿A qué proceso corresponde esta secuencia de acciones: “Objetivos y tareas a corto plazo” → “Programa rector” → “Desarrollo personal y continuo”?','Recursos para lograr unidad en el equipo','process');
const attributes=question('attributes','Identificá el proceso que sigue estas etapas: “Es un proceso continuo que jamás concluye” → “Es reiterativo apoyándose en fases” → “Es integrado como esfuerzo conjunto”.','Proceso de implementación de la estrategia','process');
const truncated=question('truncated','En el tema “Fases mínimas de planificación estratégica”, ¿qué nombre recibe la categoría caracterizada por “analisi de factores internos y externos 4.”?','FODA','classification');
const broken=question('broken','¿Qué categoría de “Condiciones básicas para equipos de trabajo” corresponde al criterio ““El desarrollo de una organización es la resultante del desarrollo personal de cada uno de sus integra”?','Desarrollo personal','classification');
const valid=question('valid','Observá estos pasos: “Delegar tareas eficientemente” → “Promover la formación de equipos” → “Preparar potenciales líderes”. ¿Qué proceso representan?','Proceso de delegación y liderazgo','process');
assert.equal(isNonSequentialProcess({title:'Recursos para lograr unidad en el equipo',steps:['Liderazgo','Objetivos','Programa']}),true);
assert.equal(isNonSequentialProcess({title:'Proceso de implementación',steps:['Es un proceso continuo','Es reiterativo','Es integrado']}),true);
assert.equal(isNonSequentialProcess({title:'Proceso de delegación',steps:['Delegar','Promover','Preparar']}),false);
assert.equal(malformedClassificationClue(truncated.prompt),true);
assert.equal(malformedClassificationClue(broken.prompt),true);
assert.equal(practiceQuestionQualityIssue(resources),'nonsequential_process_list');
assert.equal(practiceQuestionQualityIssue(attributes),'nonsequential_process_list');
assert.equal(practiceQuestionQualityIssue(truncated),'malformed_classification_clue');
assert.equal(practiceQuestionQualityIssue(broken),'malformed_classification_clue');
assert.equal(practiceQuestionQualityIssue(valid),null);
assert.deepEqual(qualifiedQuestions([resources,attributes,truncated,broken,valid]).map(q=>q.id),['valid']);
assert.deepEqual(balancedQuestions([resources,attributes,truncated,valid],10).map(q=>q.id),['valid']);
console.log('Real-module regressions: nonsequential and truncated items rejected; valid process retained.');
