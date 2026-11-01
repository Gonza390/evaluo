import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PRACTICE_BANK_VERSION, buildPracticeBank, safePracticeBank, sourceFingerprint,
  isPracticeMode, sufficientPracticeBank,
} from '../lib/student-materials/practice-on-demand.ts';
import type { CanonicalPedagogicalModel } from '../lib/student-materials/types.ts';
const root = new URL('../',import.meta.url);
const file=(p:string)=>readFileSync(new URL(p,root),'utf8');
assert.equal(isPracticeMode('casos'),true);
assert.equal(isPracticeMode('flashcards'),false);
assert.equal(isPracticeMode('something-else'),false);
assert.equal(sourceFingerprint('pdf-a','id',15),sourceFingerprint('pdf-a','id',15));
assert.notEqual(sourceFingerprint('pdf-a','id',15),sourceFingerprint('pdf-b','id',15));
assert.notEqual(sourceFingerprint('pdf-a','id',15),sourceFingerprint('pdf-a','id',16));
const base = {
  questions:[{
    id:'q-1',prompt:'¿Qué relación hay entre estandarización y dependencia?',
    options:['Reduce la dependencia de las personas','Aumenta la dependencia de las personas'],
    answer:'Reduce la dependencia de las personas',
    explanation:'Estandarizar documenta actividades y reduce la dependencia individual.',
    type:'multiple_choice',level:'comprender',reference:{pageStart:10},
  },{
    id:'q-2',prompt:'¿Qué significa una hipótesis fundamental?',
    options:['Hipótesis que guía la investigación','Conclusión de una investigación'],
    answer:'Hipótesis que guía la investigación',
    explanation:'El material contrasta la hipótesis fundamental por medio de observaciones.',
    type:'multiple_choice',level:'recordar',reference:{pageStart:1},
  }]
};
const model = {classifications:[{
  title:'Matriz de Ansoff',pageReferences:[7],
  items:[
    'Penetracion de mercado: vender productos actuales en el mercado actual (ejemplo revisado)',
    'Desarrollo de mercados: vender productos actuales en nuevos mercados (ejemplo revisado)',
    'Desarrollo de productos: vender nuevos productos en el mercado actual (ejemplo revisado)',
  ],
}]} as unknown as CanonicalPedagogicalModel;
const bank=buildPracticeBank(base,model);
assert.equal(bank.version,PRACTICE_BANK_VERSION);
assert.equal(bank.questions.length,2);
assert.equal(bank.cases.length,3);
assert.equal(sufficientPracticeBank(bank,'casos'),false,
  'Three recognition exercises cannot satisfy the minimum of six application cases.');
assert.equal(sufficientPracticeBank(bank,'simulacro'),false);
assert.equal(sufficientPracticeBank(bank,'unir',4),true);
assert.equal(sufficientPracticeBank(bank,'unir',0),false);
assert.equal(safePracticeBank(bank)?.questions.length,2);
assert.equal(safePracticeBank({...bank,version:PRACTICE_BANK_VERSION-1}),null);
assert.equal(safePracticeBank({...bank,cases:[{id:'bad',prompt:'falso'}]})?.cases.length,0);
const picker=file('components/dashboard/practice-mode-picker.tsx');
const prepare=file('app/api/practice/prepare/route.ts');
const page=file('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
const upload=file('lib/student-materials/processing-service.ts');
assert.match(picker,/onClick=\{\(\) => void startPractice\(\)\}/,'Explicit button starts preparation');
assert.match(picker,/fetch\('\/api\/practice\/prepare'/,'No POST on page entry or mode selection');
assert.match(picker,/selectedMode === 'Flashcards' \|\| selectedMode === 'Opciones'/,
  'Preserve the established study flows');
assert.match(prepare,/\.eq\('user_id',user\.id\)/,'Only the document owner can prepare practice');
assert.match(prepare,/PRACTICE_PEDAGOGICAL_AI_ENABLED === '1'/,'AI must be opt-in');
assert.match(prepare,/cached\?\.source_fingerprint===fingerprint/,'Cache has source-version invalidation');
assert.match(prepare,/enforceStrictRateLimit/,'AI calls have a hard budget');
assert.match(prepare,/if \(cacheError\)/,'Missing table must degrade safely');
assert.ok(page.includes('savedBank?.cases.length ? savedBank.cases : cases'), 'Existing cases remain available when no cache exists');
assert.doesNotMatch(upload,/practice\/prepare|student_material_practice_banks|PRACTICE_PEDAGOGICAL_AI_ENABLED/,
  'The PDF upload pipeline must never schedule advanced practice generation');
assert.ok(file('supabase/manual/practice-banks.sql').includes('enable row level security'));
console.log('Practice on-demand isolation, source validation and cache tests passed');
