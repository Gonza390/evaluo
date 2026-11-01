import assert from 'node:assert/strict';
import {sourceBackedPracticeTerms} from '../lib/student-materials/practice-classification-terms.ts';
import {verifyGeneratedPracticeCases} from '../lib/student-materials/practice-ai-cases.ts';
import {distinctApplicationCases, MIN_CASES_PER_PRACTICE} from '../lib/student-materials/practice-modes.ts';
import type {CanonicalPedagogicalModel} from '../lib/student-materials/types.ts';

const model={
  concepts:[{term:'Matriz de Ansoff',detail:'Matriz producto mercado',kind:'definicion'}],
  classifications:[
    {title:'Estrategias de crecimiento de Ansoff',items:[
      'Penetracion de mercado: explotar el producto actual en el mercado actual con una estrategia de profundización comercial',
      'Desarrollo de mercados: explotar un producto existente al ingresar por primera vez a una región nueva',
      'Desarrollo de productos: introducir un producto nuevo en el mercado donde la organización ya opera',
      'Diversificacion: ingresar a un mercado nuevo ofreciendo también un producto diferente del actual',
    ],pageReferences:[7]},
    {title:'Lista sin definiciones',items:['Etiqueta arbitraria','Segunda etiqueta'],pageReferences:[8]},
  ],
} as unknown as CanonicalPedagogicalModel;
const terms=sourceBackedPracticeTerms(model);
for (const term of ['Matriz de Ansoff','Penetracion de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificacion']) {
 assert.ok(terms.includes(term),'Retain sourced Ansoff category '+term);
}
assert.equal(terms.includes('Etiqueta arbitraria'),false,'Bare classifications cannot become valid MCQ answers');
assert.equal(terms.filter(t=>t==='Desarrollo de mercados').length,1);
const evidence='Desarrollo de mercados: explotar un producto existente al ingresar por primera vez a una región nueva';
const sources=[{pageStart:7,text:'2. '+evidence+'. Esto permite extender la actividad comercial.'}];
const entry={
  scenario:'Una empresa vende una misma línea de productos en su ciudad y decide ofrecer exactamente ese catálogo en una región donde nunca había vendido antes.',
  prompt:'¿Cuál de las estrategias de crecimiento representa mejor esta decisión comercial?',
  options:['Penetracion de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificacion'],
  answer:'Desarrollo de mercados',
  explanation:'El desarrollo de mercados implica llevar productos ya existentes a territorios comerciales nuevos. Penetración de mercado mantendría también el territorio actual, mientras que desarrollar productos exige modificar la oferta.',
  evidence,page:7,
};
assert.equal(verifyGeneratedPracticeCases({cases:[entry]},sources,terms).length,1,
  'AI cases can apply a category previously absent from canonical concepts');
const misleadingRiskSource=[{
 pageStart:7,text:sources[0]!.text +
 ' Penetracion de mercado: oferta actual en mercado actual (riesgo medio). Desarrollo de mercados: oferta actual en nuevo mercado (riesgo bajo).'
}];
assert.equal(verifyGeneratedPracticeCases({cases:[entry]},misleadingRiskSource,terms).length,1,
  'Source conflict should not block verified product/market categorization.');
assert.equal(verifyGeneratedPracticeCases({cases:[{
 ...entry,prompt:'¿Cuál de las estrategias supone el riesgo más bajo en este caso?',
 explanation:'El desarrollo de mercados sería el de riesgo más bajo según la anotación, porque se entra a una región nueva con el mismo producto.'
}]},misleadingRiskSource,terms).length,0,
  'Do not teach contradictory Ansoff relative risk as a reliable fact.');
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,page:6}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,evidence:'Cita falsa e inexistente de una región comercial'}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,options:[...entry.options.slice(0,3),'Etiqueta arbitraria']}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,scenario:entry.scenario+' Esto es un desarrollo de mercados.'}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,prompt:'¿Qué significa el desarrollo de mercados?'}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,explanation:'La elección correcta es claramente la adecuada para la situación planteada, ya que así debe entenderse.'}]},sources,terms).length,0);

// A six-case session should be possible from genuinely different source-backed
// applications without weakening evidence checks or reusing a duplicate case.
const sixNovelScenarios=[
  'Una compañía de alimentos vende galletas en su ciudad y comienza a vender exactamente las mismas galletas en otra provincia donde aún no tenía distribuidores.',
  'Una editorial conserva su catálogo y comienza a ofrecer esos mismos libros en un país donde antes no tenía presencia comercial.',
  'Una pyme comercializa calzado en su región y empieza a distribuir esos mismos modelos en una ciudad en la que todavía no había operado.',
  'Un fabricante de bicicletas mantiene el mismo producto pero ingresa por primera vez a un mercado extranjero donde nunca había tenido clientes.',
  'Una marca de muebles ofrece sus mesas habituales en una nueva zona geográfica sin modificar características ni incorporar una línea diferente.',
  'Una empresa tecnológica que vendía sus licencias localmente decide comercializar el mismo sistema en otros territorios aún no atendidos.',
];
const sixEntries=sixNovelScenarios.map((scenario,index)=>({
  ...entry,scenario,prompt:'¿Cuál estrategia representa mejor el cambio comercial de la organización en el caso '+(index+1)+'?',
}));
const multi=verifyGeneratedPracticeCases({cases:sixEntries},sources,terms);
assert.equal(multi.length,MIN_CASES_PER_PRACTICE,
  'The AI validator must retain six independently grounded cases when supplied.');
assert.equal(distinctApplicationCases(multi).length,MIN_CASES_PER_PRACTICE);
assert.equal(distinctApplicationCases([...multi,multi[0]!,multi[1]!]).length,MIN_CASES_PER_PRACTICE,
  'Repeating one scenario may not inflate the six-case minimum.');
assert.equal(distinctApplicationCases([
  ...multi,{...multi[0]!,id:'recognition-only',level:'comprender',kind:'classification-recognition'}
]).length,MIN_CASES_PER_PRACTICE,
  'Recognition exercises must never count toward six application cases.');
assert.equal(distinctApplicationCases(multi.slice(0,5)).length,5,
  'A bank of five good applications cannot masquerade as six.');
const sessionSource=await import('node:fs').then(fs=>fs.readFileSync(
  new URL('../components/dashboard/practice-session.tsx',import.meta.url),'utf8'));
assert.match(sessionSource,/contexts\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(sessionSource,/setGeneratedCases\(previous => distinctApplicationCases/,
  'New AI cases must be merged with validated existing ones, not overwrite them.');

console.log('Practice AI grounding: classification coverage, novel-case generation and adversarial validation passed');
