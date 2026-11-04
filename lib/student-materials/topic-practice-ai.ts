import type { StudyQuestion } from './pedagogy';
import { getDistinctEligibleExamQuestions, normalizeAnswer } from './practice-questions';
import { practiceQuestionQualityIssue } from './practice-question-quality';
import { isReliableTopicQuestion } from './question-bank';

export type TopicPracticeSource = {
  text: string; pageStart: number | null; sectionTitle: string | null;
};
type Candidate = {
  prompt?: unknown; options?: unknown; answer?: unknown;
  explanation?: unknown; evidence?: unknown; page?: unknown;
  sectionTitle?: unknown; level?: unknown;
};
const clean=(value:string)=>value.replace(/\s+/g,' ').trim();
const norm=(value:string)=>normalizeAnswer(clean(value))
  .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
function sameQuote(source:string,quote:string){
  const needle=clean(quote);
  return needle.length>=36 && norm(source).includes(norm(needle));
}
/** Keep a bounded variety of real pages/sections that are relevant to this topic. */
export function selectTopicSourceFragments(
  sources: readonly TopicPracticeSource[], title:string, body:string, round=0,
  max=10
):TopicPracticeSource[]{
  const stop=new Set(['para','como','entre','sobre','cuando','donde','desde','tambien',
    'estudio','tema','capitulo','ejemplo','definicion','conceptos','material','explica']);
  const keywords=[...new Set(norm(title+' '+body.slice(0,3200)).split(' ')
    .filter(word=>word.length>=5&&!stop.has(word)))].slice(0,65);
  const ranked=sources.map((source,index)=>{
    const text=' '+norm(source.text)+' ';
    return {source,index,score:keywords.filter(word=>text.includes(' '+word+' ')).length};
  }).filter(row=>row.score>=2&&row.source.text.length>=90)
    .sort((a,b)=>b.score-a.score||a.index-b.index);
  if(!ranked.length)return [];
  const group=new Map<string,typeof ranked>();
  for(const entry of ranked){
    const key=entry.source.pageStart===null
      ? 'section:'+entry.source.sectionTitle : 'page:'+entry.source.pageStart;
    const items=group.get(key)??[];items.push(entry);group.set(key,items);
  }
  const grouped=[...group.values()];
  const offset=Math.max(0,Math.floor(round))*max;
  const result:TopicPracticeSource[]=[];
  for(let i=0;i<Math.min(grouped.length,max);i++){
    const list=grouped[(offset+i)%grouped.length]!;
    result.push(list[Math.floor((offset+i)/grouped.length)%list.length]!.source);
  }
  return result;
}
/** Source citation and structural gate; never accepts invented source pages. */
export function verifyTopicPracticeCandidates(
  raw:unknown,sources:readonly TopicPracticeSource[],
  chapterTitle:string,existingPrompts:readonly string[]=[]
):StudyQuestion[]{
  const records=raw&&typeof raw==='object'&&'questions'in raw
    ?(raw as {questions:unknown}).questions:null;
  if(!Array.isArray(records))return [];
  const seen=new Set(existingPrompts.map(norm));
  const output:StudyQuestion[]=[];
  for(const [index,value] of records.slice(0,12).entries()){
    if(!value||typeof value!=='object')continue;
    const q=value as Candidate;
    if(typeof q.prompt!=='string'||typeof q.answer!=='string'||
      typeof q.evidence!=='string'||typeof q.explanation!=='string'||
      !Array.isArray(q.options)||q.options.length!==4||
      !q.options.every(option=>typeof option==='string'))continue;
    const prompt=clean(q.prompt),answer=clean(q.answer),explanation=clean(q.explanation);
    const options=(q.options as string[]).map(clean);
    if(prompt.length<30||prompt.length>700||explanation.length<35||
      answer.length<2||options.some(option=>option.length<2)||
      new Set(options.map(norm)).size!==4||options.filter(option=>norm(option)===norm(answer)).length!==1||
      seen.has(norm(prompt)))continue;
    const matching=sources.filter(source=>
      q.page===source.pageStart&&
      (source.pageStart!==null||
        (typeof q.sectionTitle==='string'&&q.sectionTitle===source.sectionTitle))&&
      sameQuote(source.text,q.evidence as string)
    );
    if(matching.length!==1)continue;
    const source=matching[0]!;
    const question:StudyQuestion={
      id:'ai-topic-'+index+'-'+norm(prompt).slice(0,65).replace(/\s/g,'-'),
      type:'multiple_choice',kind:'concept',
      level:q.level==='aplicar'?'aplicar':'comprender',topic:chapterTitle,
      chapterTitle,prompt,options,answer,explanation,
      reference:{pageStart:source.pageStart,pageEnd:source.pageStart,
        sectionTitle:source.pageStart===null?source.sectionTitle:chapterTitle,
        excerpt:clean(q.evidence)},
    };
    if(practiceQuestionQualityIssue({prompt,answer,options,
      sectionTitle:chapterTitle,sourceExcerpt:question.reference.excerpt})||
      !isReliableTopicQuestion(question))continue;
    output.push(question);seen.add(norm(prompt));
  }
  return getDistinctEligibleExamQuestions(output);
}
export function independentlyVerifiedTopicQuestions(
  candidates:readonly StudyQuestion[],raw:unknown
):StudyQuestion[]{
  const reviews=raw&&typeof raw==='object'&&'judgments'in raw
    ?(raw as {judgments:unknown}).judgments:null;
  if(!Array.isArray(reviews))return [];
  return candidates.filter(question=>{
    const judgments=reviews.filter(row=>row&&typeof row==='object'&&
      'prompt'in row&&norm(String(row.prompt))===norm(question.prompt));
    if(judgments.length!==1)return false;
    const verdict=judgments[0] as {verdict?:unknown;selectedAnswer?:unknown;
      evidence?:unknown};
    return verdict.verdict==='supported' &&
      typeof verdict.selectedAnswer==='string'&&
      norm(verdict.selectedAnswer)===norm(question.answer) &&
      typeof verdict.evidence==='string'&&
      sameQuote(question.reference.excerpt,verdict.evidence);
  });
}
