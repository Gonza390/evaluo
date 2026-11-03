import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectPracticeCaseSources } from '../lib/student-materials/practice-case-source-selection.ts';
import type { SourceFragment } from '../lib/student-materials/practice-ai-cases.ts';

// A dense 43-page PDF can yield more than 100 chunks; all pages must remain
// available across on-demand rounds instead of selecting the first 100 only.
const terms=['Hipótesis fundamental','Hipótesis auxiliar','Falsadores potenciales',
  'Explanans','Falsacionismo','Revolución científica','Premisa valorativa',
  'Falacia naturalista','Empirismo feminista','Positivismo lógico'];
const chunks:SourceFragment[]=Array.from({length:174},(_,index)=>({
  pageStart:Math.floor(index/4)+1,
  sectionTitle:null,
  text:'Fragmento de metodología de investigación con conceptos documentados. '+
    terms[index%terms.length]+': definición específica del tema que permite estudiar '+
    'una situación independiente y con criterios que pueden justificarse en el documento.'
}));
const first=selectPracticeCaseSources(chunks,terms,0);
const second=selectPracticeCaseSources(chunks,terms,1);
const third=selectPracticeCaseSources(chunks,terms,2);
const fourth=selectPracticeCaseSources(chunks,terms,3);
for(const selection of [first,second,third,fourth]){
  assert.equal(selection.sources.length,10);
  assert.ok(selection.allowedTerms.length>=4,'Every requested concept must appear in cited snippets');
  assert.equal(new Set(selection.sources.map(s=>s.pageStart)).size,10,
    'Prefer distinct source pages when sufficient distinct pages exist');
  for(const source of selection.sources)
    assert.ok(chunks.some(c=>c.text===source.text && c.pageStart===source.pageStart),
      'Source selection must not synthesize or alter evidence');
}
assert.notDeepEqual(first.sources.map(s=>s.pageStart),second.sources.map(s=>s.pageStart));
assert.ok([...second.sources,...third.sources,...fourth.sources].some(s=>
  chunks.findIndex(c=>c.text===s.text && c.pageStart===s.pageStart)>=100),
  'Later rounds must access the final pages, beyond the former first-100 limit');
const oneTerm=selectPracticeCaseSources(chunks,['Hipótesis fundamental'],0);
assert.equal(oneTerm.sources.length,0,'Do not fabricate alternatives for thin sources');
const wordChunks=Array.from({length:20},(_,i):SourceFragment=>({
 pageStart:null,sectionTitle:'Sección '+i,
 text:'Sección de apuntes con definición comprobable de '+terms[i%terms.length]+
   ' y una explicación suficientemente detallada para crear una pregunta de aplicación verificable.'}));
const word=selectPracticeCaseSources(wordChunks,terms,0);
assert.ok(word.sources.length>0 && word.sources.every(s=>s.pageStart===null),
  'DOCX uses real headings and never invents PDF page numbers');
const route=readFileSync(new URL('../app/api/practice/cases/route.ts',import.meta.url),'utf8');
assert.match(route,/\.limit\(250\)/);
assert.match(route,/selectPracticeCaseSources\(allChunks, terms, generationRound\)/);
assert.match(route,/\.join\('\\n\\n'\)/,
  'Gemini sources are separated by actual newlines, not literal slash+n');
const component=readFileSync(new URL('../components/dashboard/practice-session.tsx',import.meta.url),'utf8');
assert.match(component,/const automaticLimit = mode === 'casos' \? 3 : 6/);
assert.match(component,/data-practice-case-diagnostic/);
assert.match(component,/attempts\.current=0;void generateNewCases\(\)/);
console.log('Casos: late PDF pages, DOCX headings, three bounded source rotations, source grounding and retry diagnostics passed.');
