'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {LearningSnapshot,LearningFilters} from './learning-dashboard-types';
import './admin-home.css';
import './learning-dashboard.css';

const nav:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],['Adquisición y SEO','adquisicion'],
 ['Activación y recorrido','producto'],['Aprendizaje y prácticas','biblioteca'],['Planes de estudio','planes'],
 ['Monetización','monetizacion'],['Comunicaciones','mails'],['Sistema e IA','ia'],['Gestión','gestion'],
];
const number=(v:number|null|undefined)=>v===null||v===undefined?'—':Math.round(v).toLocaleString('es-AR');
const percentage=(a:number,b:number)=>b>0?(100*a/b).toFixed(1).replace('.',',')+'%':'—';
const smallPercent=(v:number|null)=>v===null?'—':v.toFixed(1).replace('.',',')+'%';
const barWidth=(v:number,total:number)=>total>0?Math.max(0,Math.min(100,100*v/total)):0;
const scoreOrder=['0–49%','50–69%','70–84%','85–100%'];
function Heading({n,title,detail,priority=false}:{n:string;title:string;detail:string;priority?:boolean}){
 return <div className="lp-sh"><span className="lp-index">{n}</span><h2>{title}</h2>
 {priority&&<span className="lp-priority">Prioridad</span>}<p>{detail}</p></div>;
}
function Progress({width,light=true}:{width:number;light?:boolean}){
 return <div className="lp-progress"><span style={{width:Math.max(0,Math.min(100,width))+'%',
 background:light?'var(--accent)':'#566D23'}}/></div>;
}
function StatTiles({items,compact=false}:{items:Array<{label:string;value:string;note:string;sub?:string;priority?:boolean}>;compact?:boolean}){
 return <div className="lp-tiles">{items.map(item=><div className={'lp-tile'+(compact?' lp-compact':'')} key={item.label}>
  <div className="lp-kicker-row"><span className="lp-kicker">{item.label}</span>{item.priority&&<span className="lp-priority">Prioridad</span>}</div>
  <strong className="lp-value">{item.value}</strong>
  <span className="lp-tile-note">{item.sub??''}</span>
  <span className="lp-tile-note">{item.note}</span>
 </div>)}</div>;
}
function Table({cols,layout,rows,empty='Sin datos registrados para estos filtros.'}:{
 cols:string[];layout:'topics'|'tools'|'subjects';rows:React.ReactNode[][];empty?:string
}){
 return <div className="lp-table-scroll"><div className={'lp-gridrow lp-head lp-'+layout}>
  {cols.map((c,i)=><div key={c} className={i>0?'lp-right':''}>{c}</div>)}</div>
 {rows.length?rows.map((cells,j)=><div key={j} className={'lp-gridrow lp-'+layout}>
  {cells.map((v,i)=><div key={i} className={i>0&&i<cells.length-1?'lp-right':''}>{v}</div>)}</div>)
 :<p className="lp-empty">{empty}</p>}
 </div>;
}
type Props={data:LearningSnapshot;filters:LearningFilters;earliest:string;today:string};
export function LearningDashboard({data,filters,earliest,today}:Props){
 const router=useRouter();
 const [selectedPeriod,setSelectedPeriod]=useState(filters.period);
 const [selectedMode,setSelectedMode]=useState('all');
 const [customFrom,setCustomFrom]=useState(filters.from??'');
 const [customTo,setCustomTo]=useState(filters.to??today);
 useEffect(()=>{
  if(selectedPeriod!=='custom'||!customFrom||!customTo||customFrom>customTo||
     customFrom<earliest||customTo>today||
     (Date.parse(customTo+'T12:00:00Z')-Date.parse(customFrom+'T12:00:00Z'))/86400000>29||
     (filters.from===customFrom&&filters.to===customTo))return;
  const query=new URLSearchParams(window.location.search);
  query.set('panel','biblioteca');query.set('academicPeriod','custom');
  query.set('academicFrom',customFrom);query.set('academicTo',customTo);
  router.replace('/administrador?'+query.toString());
 },[selectedPeriod,customFrom,customTo,earliest,today,filters.from,filters.to,router]);
 const overall=data.overall;
 const totalCompleted=overall.completed_mode_sessions+overall.completed_events;
 const accuracy=overall.questions?percentage(overall.correct,overall.questions):'—';
 const pairedEnough=overall.repeated_users>=5;
 const improvement=pairedEnough?((100*(overall.after_correct-overall.before_correct)/Math.max(1,overall.repeated_items)).toFixed(1).replace('.',',')+' pp'):'—';
 const kpis=[
  {label:'Estudiantes que practicaron',value:number(overall.students),sub:'Con práctica o finalización registrada',note:'Usuarios únicos'},
  {label:'Prácticas iniciadas',value:number(overall.started_events),sub:'Eventos de inicio deduplicados',note:'No todas las modalidades informan inicios'},
  {label:'Prácticas completadas',value:number(totalCompleted),sub:number(overall.completed_events)+' eventos y '+number(overall.completed_mode_sessions)+' sesiones',note:'Fuentes distintas, incluida autodeclaración; posible solapamiento',priority:true},
  {label:'Preguntas respondidas',value:number(overall.questions),sub:'Con corrección evaluada',note:'Excluye autoevaluaciones'},
  {label:'Rendimiento general',value:accuracy,sub:number(overall.correct)+' de '+number(overall.questions)+' respuestas evaluadas',note:'No incluye flashcards autodeclaradas'},
  {label:'Mejora del aprendizaje',value:improvement,sub:pairedEnough?'Primera vs. última respuesta del mismo ítem':'Muestra insuficiente: '+number(overall.repeated_users)+' estudiantes con reintentos',note:'Cambio observado, no efecto causal',priority:true}
 ];
 const tools=selectedMode==='all'?data.tools:data.tools.filter(t=>t.name===selectedMode);
 const maxTool=Math.max(1,...data.tools.map(t=>t.students??0));
 const toolRows=tools.map(t=>[
  <div className="lp-name" key="name"><strong>{t.name}</strong><small>{t.note}</small></div>,
  <div className="lp-bar-value" key="users"><Progress width={barWidth(t.students??0,maxTool)}/>
   <span className="lp-mono">{number(t.students)}</span></div>,
  <span className="lp-mono" key="started">{number(t.started)}</span>,
  <span className="lp-mono" key="finished">{number(t.finished)}</span>,
  <span className="lp-mono" key="acc">{t.answers&&t.correct!==null?percentage(t.correct,t.answers):'—'}</span>
 ]);
 const topicRows=data.topics.map(t=>[
  <div className="lp-name" key="topic"><strong>{t.topic}</strong><small>{t.subject}</small></div>,
  <span className="lp-mono" key="users">{number(t.students)}</span>,
  <span className="lp-mono" key="answers">{t.students?(t.answers/t.students).toFixed(1).replace('.',','):'—'}</span>,
  <div className="lp-bar-value" key="done"><Progress width={0}/><span className="lp-mono">—</span></div>,
  <span className="lp-mono" key="abandon">—</span>
 ]);
 const sims=data.sim;
 const sKpis=[
  {label:'Simulacros iniciados',value:number(sims.started),note:'Intentos deduplicados por identificador disponible'},
  {label:'Simulacros finalizados',value:number(sims.finished),note:'Cierres registrados; sin tasa comparable de finalización'},
  {label:'Estudiantes que finalizaron',value:number(sims.users),note:'Usuarios únicos'},
  {label:'Nota media',value:sims.score_sample?smallPercent(sims.avg_score):'—',note:'Solo exámenes generales PDF con nota'},
  {label:'Notas evaluadas',value:number(sims.score_sample),note:'Muestra de simulacros PDF'},
  {label:'Duración promedio',value:'—',note:'Falta telemetría completa y consistente'}
 ];
 const scores=scoreOrder.map(k=>({label:k,amount:data.scores.find(s=>s.bucket===k)?.attempts??0}));
 const error=data.errors;
 const steps=[
  {name:'Se equivocaron',detail:'Estudiantes con un error registrado',count:error.with_errors},
  {name:'Revisaron un error',detail:'Error del período con revisión registrada',count:error.reviewed},
  {name:'Volvieron a responder',detail:'Usuarios con comprobación de errores',count:error.check_answered},
  {name:'Marcaron un error como resuelto',detail:'Estado de resolución, no prueba de mejora',count:error.resolved}
 ];
 const subjectRows=data.subjects.map(s=>{
  const sample=s.students>=30;
  return [
   <div className="lp-name" key="sub"><strong>{s.subject}</strong><small>{sample?'Respuestas evaluadas':'Muestra insuficiente para comparar precisión · mínimo 30 estudiantes'}</small></div>,
   <span className="lp-mono" key="n">{number(s.students)}</span>,
   <span className="lp-mono" key="answers">{number(s.answers)}</span>,
   <span className="lp-mono" key="free">{sample&&s.free_users>=30?percentage(s.free_correct,s.free_answers):'—'}</span>,
   <span className="lp-mono" key="premium">{sample&&s.premium_users>=30?percentage(s.premium_correct,s.premium_answers):'—'}</span>,
   <div className="lp-bar-value" key="total"><Progress width={sample?barWidth(s.correct,s.answers):0}/><span className="lp-mono">{sample?percentage(s.correct,s.answers):'—'}</span></div>
  ];
 });
 const sufficientSubjects=data.subjects.filter(x=>x.students>=30);
 const hardest=[...sufficientSubjects].sort((a,b)=>a.correct/a.answers-b.correct/b.answers)[0];
 const dateLabel=filters.period==='custom'?((filters.from??'')+' a '+(filters.to??'')):'Últimos '+data.period_days+' día'+(data.period_days===1?'':'s');
 const need=pairedEnough?'En '+number(overall.repeated_items)+' ítems repetidos por '+number(overall.repeated_users)+' estudiantes, el acierto pasó de '+
   percentage(overall.before_correct,overall.repeated_items)+' a '+percentage(overall.after_correct,overall.repeated_items)+'. No demuestra retención a largo plazo.':
   'Todavía no hay suficientes estudiantes con dos respuestas evaluadas del mismo ítem para medir una mejora representativa.';
 return <main className="ehome lp-page">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
   <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link><Link href="/administrador/solicitudes" className="eh-primary-link">Solicitudes universidades →</Link></div></div>
   <nav className="eh-tabs" aria-label="Paneles">{nav.map(([name,id],i)=>
    <Link key={name} href={'/administrador?panel='+id} prefetch={false} aria-current={i===4?'page':undefined}
      className={'eh-tab'+(i===4?' eh-active':'')}>{name}</Link>)}</nav></header>
  <section className="lp-intro"><div className="lp-kicker">Evaluo / Aprendizaje y prácticas</div>
   <h1>Aprendizaje y prácticas</h1><p>Cómo estudian realmente los usuarios, qué herramientas usan, qué les cuesta y si mejoran después de practicar. Medimos aprendizaje, no solo uso.</p>
  </section>
  <form className="lp-filters" action="/administrador" method="get"
   onChange={e=>{if(e.target instanceof HTMLSelectElement && e.target.name)e.currentTarget.requestSubmit();}}>
   <input type="hidden" name="panel" value="biblioteca"/>
   <div className="lp-filter"><span className="lp-kicker">Período</span><div className="lp-segment" role="group" aria-label="Período">
    {([['1','Hoy'],['7','7 días'],['14','14 días'],['30','30 días'],['custom','Personalizado']] as const).map(([v,label])=>
      <button type="button" aria-pressed={selectedPeriod===v} className={selectedPeriod===v?'lp-picked':''} key={v}
      onClick={()=>{
       setSelectedPeriod(v);
       if(v!=='custom'){
        const query=new URLSearchParams(window.location.search);
        query.set('panel','biblioteca');query.set('academicPeriod',v);
        query.delete('academicFrom');query.delete('academicTo');
        router.push('/administrador?'+query.toString());
       }
      }}>{label}</button>)}
   </div><input type="hidden" name="academicPeriod" value={selectedPeriod}/></div>
   <label className="lp-filter"><span className="lp-kicker">Universidad</span><select name="academicUniversity" defaultValue={filters.university??''}>
    <option value="">Todas</option>{data.options.universities.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>
   <label className="lp-filter"><span className="lp-kicker">Carrera</span><select name="academicCareer" defaultValue={filters.career??''}>
    <option value="">Todas</option>{data.options.careers.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>
   <label className="lp-filter"><span className="lp-kicker">Materia</span><select name="academicSubject" defaultValue={filters.subject??''}>
    <option value="">Todas</option>{data.options.subjects.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>
   <label className="lp-filter"><span className="lp-kicker">Modalidad de práctica</span><select value={selectedMode} onChange={e=>setSelectedMode(e.target.value)}>
    <option value="all">Todas</option>{data.tools.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}</select></label>
   <label className="lp-filter"><span className="lp-kicker">Plan actual</span><select name="academicPlan" defaultValue={filters.plan}>
    <option value="all">Free y Premium</option><option value="free">Free</option><option value="premium">Premium</option></select></label>
   <span className="lp-tag">Muestra mínima: 30 estudiantes</span><span className="lp-tag">Datos reales · Supabase</span>
   {selectedPeriod==='custom'&&<div className="lp-custom">
    <label>Desde <input required name="academicFrom" type="date" min={earliest} max={today} value={customFrom} onChange={e=>setCustomFrom(e.target.value)}/></label>
    <label>Hasta <input required name="academicTo" type="date" min={earliest} max={today} value={customTo} onChange={e=>setCustomTo(e.target.value)}/></label>
    <small>Hasta 30 días dentro de los últimos 90</small></div>}
  </form>
  <div className="lp-board">
   <section className="lp-section"><Heading n="01" title="Resumen académico" detail={dateLabel+' · señales de práctica registradas. No se suman visitas como aprendizaje.'}/>
    <StatTiles items={kpis}/></section>
   <section className="lp-section"><Heading n="02" title="Práctica por temas" detail="Temas más respondidos; la finalización y el abandono por tema requieren instrumentación adicional."/>
    <Table layout="topics" cols={['Tema · materia','Estudiantes','Respuestas por estudiante','Finalización','Abandono']} rows={topicRows}/>
    <p className="lp-footnote">Las respuestas por estudiante no equivalen a intentos completos. Solo se incluyen preguntas con corrección evaluada.</p></section>
   <section className="lp-section"><Heading n="03" title="Herramientas de estudio" detail="Qué modalidades tienen actividad registrada y qué información se puede medir sin suposiciones."/>
    <Table layout="tools" cols={['Herramienta','Estudiantes que la usan','Inicios','Finalizaciones','Acierto']} rows={toolRows}/>
    <p className="lp-footnote">El selector de modalidad afecta únicamente esta tabla. No se infieren tasas de finalización cuando faltan eventos de inicio.</p></section>
   <section className="lp-section"><Heading n="04" title="Simulacros" detail="Inicios y finalizaciones registrados. La distribución de notas solo incluye simulacros generales PDF evaluados."/>
    <StatTiles items={sKpis} compact/>
    <div className="lp-score"><span className="lp-kicker">Simulacros PDF finalizados según nota</span>
      {scores.map(x=><div className="lp-progressrow" key={x.label}><span className="lp-mono">{x.label}</span>
       <Progress width={barWidth(x.amount,sims.score_sample)}/><strong className="lp-mono">{number(x.amount)}</strong>
       <span className="lp-mono lp-muted">{percentage(x.amount,sims.score_sample)}</span></div>)}
      <p className="lp-footnote">Los inicios y cierres provienen de distintos flujos, por lo que no representan un porcentaje único de finalización.</p>
    </div></section>
   <section className="lp-section"><Heading n="05" title="Errores y refuerzo" priority detail="Hitos observados del error al repaso y reintento. No se asume causalidad entre eventos diferentes."/>
    <div className="lp-error-panels">
     <div className="lp-error-part"><span className="lp-kicker">Del error a la mejora · usuarios únicos</span>
      {steps.map((x,i)=><div className="lp-progressrow lp-errorrow" key={x.name}>
       <div className="lp-name"><strong>{x.name}</strong><small>{x.detail}</small></div>
       <Progress width={barWidth(x.count,error.with_errors)} light={i>=2}/>
       <strong className="lp-mono">{number(x.count)}</strong>
       <span className="lp-mono lp-muted">{percentage(x.count,error.with_errors)}</span>
       </div>)}
     </div>
     <div className="lp-error-part"><span className="lp-kicker">Acierto en el mismo ítem, primer y último intento</span>
      <div className="lp-retry"><div><span className="lp-mono">Muestra</span><strong>{number(overall.repeated_users)} estudiantes · {number(overall.repeated_items)} ítems</strong></div>
      {['Antes','Después'].map((label,i)=><div className="lp-progressrow" key={label}>
       <span className="lp-mono">{label}</span><Progress width={pairedEnough?100*(i?overall.after_correct:overall.before_correct)/Math.max(1,overall.repeated_items):0} light={i>0}/>
       <span className="lp-mono">{pairedEnough?percentage(i?overall.after_correct:overall.before_correct,overall.repeated_items):'—'}</span></div>)}
      <span className="lp-tile-note">{need}</span></div>
     </div>
    </div>
    <p className="lp-notice"><span className="lp-priority">Refuerzo efectivo</span>{need}</p></section>
   <section className="lp-section"><Heading n="06" title="Rendimiento por materia" detail="Qué materias reúnen respuestas evaluadas y cuáles tienen muestra suficiente para comparar planes."/>
    <Table layout="subjects" cols={['Materia · dificultad frecuente','Estudiantes','Respuestas','Acierto Free','Acierto Premium','Acierto total']} rows={subjectRows}/>
    <p className="lp-notice"><span className="lp-priority lp-danger">Mayor dificultad</span>
      {hardest?'Entre materias con al menos 30 estudiantes, '+hardest.subject+' tiene el menor porcentaje de aciertos ('+percentage(hardest.correct,hardest.answers)+').':
      'No hay materias con una muestra de al menos 30 estudiantes evaluados para establecer un ranking fiable.'}
    </p>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · datos agregados, sin identificadores personales · caché de 60 minutos · resultados por respuestas evaluadas · los planes son estados actuales · universidad/carrera identifican estudiantes vinculados, no atribuyen cada respuesta a esa institución · la mejora se calcula solo si hay 5 o más estudiantes con reintentos comparables. La instrumentación incompleta se presenta como sin dato.</footer>
 </main>;
}
