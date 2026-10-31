import assert from 'node:assert/strict';
import {sourceBackedPracticeTerms} from '../lib/student-materials/practice-classification-terms.ts';
import {verifyGeneratedPracticeCases} from '../lib/student-materials/practice-ai-cases.ts';
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
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,page:6}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,evidence:'Cita falsa e inexistente de una región comercial'}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,options:[...entry.options.slice(0,3),'Etiqueta arbitraria']}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,scenario:entry.scenario+' Esto es un desarrollo de mercados.'}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,prompt:'¿Qué significa el desarrollo de mercados?'}]},sources,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...entry,explanation:'La elección correcta es claramente la adecuada para la situación planteada, ya que así debe entenderse.'}]},sources,terms).length,0);
console.log('Practice AI grounding: classification coverage, novel-case generation and adversarial validation passed');
