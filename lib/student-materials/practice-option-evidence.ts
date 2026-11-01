/**
 * Zero-API-cost quality gate for alternatives built from canonical
 * PDF/DOCX definitions. It does NOT claim semantic proof: ambiguous candidates
 * are discarded and independent AI/source review remains necessary for cases.
 */
export type DocumentedOption = {
  /** Literal answer choice shown to the student. */
  option: string;
  /** Distinct label of the concept represented by this choice. */
  label: string;
  /** Document-derived definition or distinguishing evidence for this label. */
  evidence: string;
};

const normalize = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/gu,'')
  .toLowerCase().replace(/[^a-z0-9]+/gu,' ').replace(/\s+/gu,' ').trim();
const ignore = new Set(['de','del','el','la','las','los','un','una','que','con','para','por','entre','sobre','hacia','desde','como','este','esta','estos','estas','sus','son','es','y','en','al','se','lo','una','tiene','consiste','permite','mediante','requiere','dentro']);
function terms(s:string) {
  return new Set(normalize(s).split(' ').filter(w=>w.length>=4&&!ignore.has(w)));
}
function opposite(a:string,b:string) {
  const pairs:[RegExp,RegExp][]=[
    [/\b(?:nuev\w*|crea\w*)\b/,/\b(?:existente\w*|actual\w*)\b/],
    [/\b(?:aument\w*|increment\w*)\b/,/\b(?:disminu\w*|reduc\w*)\b/],
    [/\bantes\b/,/\bdespues\b/],
  ];
  const x=normalize(a),y=normalize(b);
  return pairs.some(([l,r])=>(l.test(x)&&r.test(y))||(r.test(x)&&l.test(y)));
}
/** A changed example or small paraphrase is not a distinct wrong answer. */
export function mayBeEquivalentOptions(a:string,b:string):boolean {
  const x=normalize(a), y=normalize(b);
  if(!x||!y) return true;
  if(x===y || (x.length>=24 && y.includes(x)) || (y.length>=24 && x.includes(y))) return true;
  if(opposite(a,b)) return false;
  const xw=terms(x),yw=terms(y);
  if(xw.size<4 || yw.size<4) return false;
  const overlap=[...xw].filter(w=>yw.has(w)).length;
  const containment=overlap/Math.min(xw.size,yw.size);
  const union=overlap/(xw.size+yw.size-overlap);
  return overlap>=4 && containment>=0.78 && union>=0.56;
}
/** Limit to mutually distinct, traceable alternatives. Return [] when <2. */
export function chooseDocumentedDistractors(
  correct:DocumentedOption,
  candidates:readonly DocumentedOption[],
  limit=3,
):DocumentedOption[] {
  const chosen:DocumentedOption[]=[];
  for(const candidate of candidates){
    if(chosen.length>=limit)break;
    if(!candidate.option.trim() || !candidate.label.trim() ||
       candidate.evidence.trim().length<16 ||
       normalize(candidate.label)===normalize(correct.label) ||
       mayBeEquivalentOptions(correct.option,candidate.option) ||
       mayBeEquivalentOptions(correct.evidence,candidate.evidence) ||
       chosen.some(other=>normalize(other.label)===normalize(candidate.label) ||
         mayBeEquivalentOptions(other.option,candidate.option) ||
         mayBeEquivalentOptions(other.evidence,candidate.evidence)))continue;
    chosen.push(candidate);
  }
  return chosen.length>=2 ? chosen : [];
}
function conciseEvidence(value:string,max=120):string {
  const compact=value.replace(/\s+/gu,' ').trim();
  if(compact.length<=max)return compact.replace(/[.!?]+$/u,'');
  const cut=compact.slice(0,max);
  const last=cut.lastIndexOf(' ');
  return (last>max/2?cut.slice(0,last):cut).replace(/[,;:.!?]+$/u,'')+'…';
}
/** Explain the keyed answer AND every distractor, only using source-defined
 * meanings. We do not allege a misconception without evidence.
 */
export function explainDocumentedOptions(
  focus:string,
  correct:DocumentedOption,
  alternatives:readonly DocumentedOption[],
):string {
  const why=conciseEvidence(correct.evidence,200);
  const contrasts=alternatives.map(a=>
    '«'+a.label+'» corresponde a '+conciseEvidence(a.evidence,112)
  );
  return 'La respuesta es «'+correct.label+'» porque '+why+'. '+
    'Las otras opciones describen conceptos distintos del material: '+
    contrasts.join('; ')+'. La consigna pregunta específicamente por «'+focus+'».';
}
