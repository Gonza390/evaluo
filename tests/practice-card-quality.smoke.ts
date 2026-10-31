import assert from 'node:assert/strict';
import { auditPracticeFlashcard } from '../lib/student-materials/practice-card-quality.ts';
const cited={pageStart:18,excerpt:'Tipos de liderazgo: el democrático involucra al equipo en las decisiones; el autocrático centraliza la autoridad.'};
const metadata=auditPracticeFlashcard({
 front:'¿Qué significa “Licenciatura en Comercializacion - Marketing” según el material?',
 back:'Carrera a la que pertenece el material de estudio.',
 reference:{pageStart:1,excerpt:'MATERIA Desarrollo Emprendedor CARRERA Licenciatura en Comercialización'},
});
assert.equal(metadata.approved,false);
assert.ok(metadata.reasons.includes('nonacademic_document_metadata'));
const legit=auditPracticeFlashcard({
 front:'¿Cómo se diferencia el liderazgo democrático del autocrático?',
 back:'El democrático consulta o involucra al equipo; el autocrático centraliza la decisión.',
 reference:cited,
});
assert.equal(legit.approved,true);
const risk=auditPracticeFlashcard({
 front:'¿Qué estrategias de la Matriz de Ansoff presentan distintos niveles de riesgo?',
 back:'Penetracion de mercado (riesgo medio); Desarrollo de mercados (riesgo bajo); Diversificacion (riesgo alto).',
 reference:{pageStart:7,excerpt:'Matriz de Ansoff: penetración de mercado, desarrollo de mercados y diversificación.'},
});
assert.equal(risk.approved,false,'A literal PDF citation must not approve contradictory academic risk ranking');
assert.ok(risk.reasons.includes('unverified_ansoff_risk_ranking'));
const generic=auditPracticeFlashcard({
 front:'¿Qué significa delegación eficiente según el material?',
 back:'Enseñar, supervisar y dar autonomía sin perder la responsabilidad final.',
 reference:cited,
});
assert.equal(generic.approved,true);
assert.ok(generic.improvements.includes('replace_generic_prompt'));
const uncited=auditPracticeFlashcard({
 front:'¿Cómo distinguir liderazgo autocrático y democrático?',
 back:'Autocrático centraliza decisiones; democrático involucra al equipo.',
 reference:null,
});
assert.equal(uncited.approved,false);
assert.ok(uncited.reasons.includes('missing_source'));
console.log('Practice flashcard QA: metadata, risk conflicts, quality and source gates passed');
