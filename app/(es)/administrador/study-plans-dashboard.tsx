'use client';

import Link from 'next/link';
import {useEffect,useState,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import type {StudyPlanAdminSnapshot,StudyPlanAdminFilters} from './study-plans-dashboard-types';
import './admin-home.css';
import './study-plans-dashboard.css';

const tabs:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],
 ['Adquisición y SEO','adquisicion'],['Activación y recorrido','producto'],
 ['Aprendizaje y prácticas','biblioteca'],['Planes de estudio','planes'],
 ['Monetización','monetizacion'],['Comunicaciones','mails'],['Sistema e IA','ia'],
 ['Gestión','gestion'],
];
const num=(n:number|null|undefined)=>n===null||n===undefined?'—':Math.round(n).toLocaleString('es-AR');
const percent=(n:number,d:number)=>d>0?(100*n/d).toFixed(1).replace('.',',')+'%':'—';
const rate=(n:number|null,d:number|null)=>n!==null&&d!==null&&d>0?percent(n,d):'—';
const priority=(text:string)=><span className="sp-priority">{text}</span>;
const durationLabels:[string,string][]=[['upto7','Hasta 7 días'],['8to14','8 a 14 días'],['15to30','15 a 30 días'],['over30','Más de 30 días']];
const distributionLabels:[string,string][]=[['zero','Sin lecturas completadas'],['1to25','1 a 25%'],['26to50','26 a 50%'],['51to75','51 a 75%'],['76to99','76 a 99%'],['all_read','100% de lecturas']];
function Section({n,title,detail,important=false}:{n:string;title:string;detail:string;important?:boolean}){
 return <div className="sp-section-heading"><span className="sp-index">{n}</span><h2>{title}</h2>
 {important&&priority('Prioridad')}<p>{detail}</p></div>;
}
function Bar({value,light=false,height=6}:{value:number;light?:boolean;height?:number}){
 return <div className="sp-bar" style={{height}}><span style={{height,width:Math.min(100,Math.max(0,value))+'%',
 background:light?'#C8FF3A':'#566D23'}}/></div>;
}
function TileGrid({items}:{items:Array<{title:string;value:string;sub:string;note:string;important?:boolean}>}){
 return <div className="sp-cells">{items.map(x=><div className="sp-cell" key={x.title}>
  <div className="sp-cell-top"><span className="sp-label">{x.title}</span>{x.important&&priority('Prioridad')}</div>
  <strong className="sp-number">{x.value}</strong>
  <span className="sp-foot">{x.sub}</span><span className="sp-foot">{x.note}</span></div>)}</div>;
}
function Buckets({title,rows,total}:{title:string;rows:Array<{name:string;value:number;total?:number}>;total:number}){
 return <div className="sp-half"><span className="sp-label">{title}</span>
 {rows.map(x=><div className="sp-bucket" key={x.name}><span className="sp-bucket-title">{x.name}</span>
 <Bar height={14} value={(x.total??total)?100*x.value/(x.total??total):0} light={x.value>0}/><strong className="sp-mono">{num(x.value)}</strong>
 <span className="sp-mono sp-muted">{percent(x.value,x.total??total)}</span></div>)}
 </div>;
}
function ReportTable({head,rows,format='friction'}:{head:string[];rows:ReactNode[][];format?:'friction'|'comparison'}){
 return <div className="sp-table-scroll"><div className={'sp-row sp-row-head sp-'+format}>{head.map((h,i)=><span className={i>0?'sp-right':''} key={i}>{h}</span>)}</div>
 {rows.map((row,i)=><div className={'sp-row sp-'+format} key={i}>{row.map((v,j)=><div className={j>0&&j<row.length-1?'sp-right':''} key={j}>{v}</div>)}</div>)}
 </div>;
}
function Detail({title,subtitle}:{title:string;subtitle:string}){
 return <div className="sp-descr"><strong>{title}</strong><small>{subtitle}</small></div>;
}

export function StudyPlansDashboard({snapshot,filters,today,earliest}:{
 snapshot:StudyPlanAdminSnapshot;filters:StudyPlanAdminFilters;today:string;earliest:string;
}){
 const router=useRouter();
 const [period,setPeriod]=useState<StudyPlanAdminFilters['period']>(filters.period);
 const [from,setFrom]=useState(filters.from??'');
 const [to,setTo]=useState(filters.to??today);
 useEffect(()=>{
  if(period!=='custom'||!from||!to||from>to||from<earliest||to>today||
    (Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000>29||
    (filters.from===from&&filters.to===to))return;
  const query=new URLSearchParams(window.location.search);
  query.set('planPeriod','custom');
  query.set('planFrom',from);query.set('planTo',to);
  router.replace('/administrador/planes?'+query.toString());
 },[period,from,to,earliest,today,filters.from,filters.to,router]);
 const m=snapshot.summary;
 const anyPlans=m.plans>0;
 const filtered=!!(filters.university||filters.career||filters.subject||
   filters.duration!=='all'||filters.state!=='all');
 const previous=filtered?null:snapshot.previous_created;
 const trend=previous===null?'Comparación no disponible con filtros':previous===0?
   (m.plans?'Sin base en el período anterior':'Sin actividad anterior'):
   ((m.plans-previous)>=0?'↑ ':'↓ ')+Math.abs((m.plans-previous)/previous*100).toFixed(1).replace('.',',')+'% vs. período anterior';
 const summary=[
  {title:'Planes creados',value:num(m.plans),sub:'Planes personales guardados',note:trend},
  {title:'Estudiantes con plan',value:num(m.students),sub:'Usuarios únicos',note:'Excluye cuentas administrativas'},
  {title:'Planes activos',value:num(m.active),sub:'Con avance reciente registrado',note:'No equivale a finalización'},
  {title:'Planes completados',value:'—',sub:'Lecturas y prácticas del plan',note:'Finalización integral no verificable',important:true},
  {title:'Sin comenzar',value:num(m.not_started),sub:'Sin lectura ni práctica del plan',note:'Desde la creación del plan'},
 ];
 const firstStages=[
  {label:'Iniciaron la configuración del plan',value:null,sub:'Sin evento de inicio instrumentado'},
  {label:'Guardaron un plan de estudio',value:m.students,sub:'Usuarios con plan persistido'},
  {label:'Comenzaron una actividad de ese plan',value:m.began,sub:'Lectura o práctica vinculada al plan'},
  {label:'Completaron todas las actividades',value:null,sub:'Se requiere progreso completo verificable'}
 ];
 const leak=m.students>0?
  'De '+num(m.students)+' estudiantes con un plan, '+num(m.students-m.began)+' no tienen ninguna actividad del plan registrada ('+percent(m.students-m.began,m.students)+'). No se puede atribuir el motivo del abandono.':
  'No hay suficientes planes personales de estudiantes en este período para determinar una caída.';
 const dueMissing=Math.max(0,m.due_topics-m.due_readings);
 const follow=[
  {title:'Temas programados',value:num(m.scheduled_topics),sub:'Temas incluidos en el calendario',note:'Un tema puede incluir varias actividades'},
  {title:'Lecturas completadas',value:num(m.read_topics),sub:'Marcadas desde el plan',note:percent(m.read_topics,m.scheduled_topics)+' de los temas programados',important:true},
  {title:'Prácticas completadas',value:num(m.practices_done),sub:'Marcadores por modalidad y tema',note:'No equivalen al plan completado'},
  {title:'Lecturas vencidas pendientes',value:num(dueMissing),sub:'Con fecha programada hasta hoy',note:'No se infiere abandono permanente'},
  {title:'Cumplimiento de lecturas',value:percent(m.read_topics,m.scheduled_topics),sub:'Lecturas / temas programados',note:'No incluye requisitos de práctica',important:true},
 ];
 const weekRows=[1,2,3,4].map(week=>{const x=snapshot.weeks.find(w=>w.week===week);
  return {name:'Semana '+week,value:x?.read??0,total:x?.scheduled??0}});
 const distRows=distributionLabels.map(([bucket,name])=>({name,value:snapshot.distribution.find(d=>d.bucket===bucket)?.n??0}));
 const time=[
  {title:'Días hasta el examen',value:anyPlans?num(m.avg_days_to_exam):'—',sub:'Promedio al crear el plan',note:'No son días restantes hoy'},
  {title:'Minutos diarios elegidos',value:anyPlans?num(m.avg_daily_minutes):'—',sub:'Promedio por plan guardado',note:'Tiempo planificado, no medido'},
  {title:'Planes con sobrecarga',value:num(m.over_budget),sub:'Algún día supera los minutos elegidos',note:percent(m.over_budget,m.plans)+' de los planes',important:true},
  {title:'Exámenes vencidos',value:num(m.expired_exams),sub:'Fecha de examen anterior a hoy',note:'No equivale a abandono'},
  {title:'Planes con plazo corto',value:num(snapshot.duration.find(x=>x.bucket==='upto7')?.n??0),
   sub:'7 días o menos hasta el examen al crearlos',note:'No implica automáticamente tiempo insuficiente'},
 ];
 const dayRows=durationLabels.map(([bucket,name])=>({name,value:snapshot.duration.find(x=>x.bucket===bucket)?.n??0}));
 const minuteRows=[15,30,45,60].map(minutes=>({name:minutes+' min',value:snapshot.minutes.find(x=>x.minutes===minutes)?.n??0}));
 const friction=[
  {title:'Guardaron un plan, pero no empezaron',sub:'Sin lectura ni práctica vinculada',count:m.not_started,base:m.plans},
  {title:'Días del plan con lecturas pendientes',sub:'Temas programados hasta hoy',count:dueMissing,base:m.due_topics},
  {title:'Planes con carga superior al tiempo elegido',sub:'Al menos un día por encima del presupuesto',count:m.over_budget,base:m.plans},
  {title:'Planes interrumpidos',sub:'Con avance, pero sin actividad registrada hace 7 días',count:m.interrupted,base:m.began},
  {title:'Exámenes vencidos',sub:'Sin concluir si el estudiante rindió o aprobó',count:m.expired_exams,base:m.plans},
 ];
 const cmp=['with_plan','no_plan'] as const;
 const groups=cmp.map(key=>{
  const row=snapshot.comparison.find(x=>x.group_key===key);
  const enough=!!row&&row.users>=30;
  const weeks=Math.max(1,(new Date(snapshot.through).getTime()-new Date(snapshot.from).getTime())/86400000/7+1/7);
  return {label:key==='with_plan'?'Estudian con un plan guardado':'Estudian sin plan guardado',
   sub:key==='with_plan'?'Comparación descriptiva':'No implica que el plan cause una diferencia',
   n:row?.users??0,activities:row?.answers??0,
   avg:row&&row.users?row.answers/row.users:null,
   days:row&&row.users?row.study_days/row.users/weeks:null,
   accuracy:enough&&row.answers?percent(row.correct,row.answers):'—',
   enough};
 });
 const comparisonRows=groups.map(g=>[
  <Detail key="name" title={g.label} subtitle={g.sub}/>,
  <span className="sp-mono" key="n">{num(g.n)}</span>,
  <span className="sp-mono" key="act">{g.avg===null?'—':g.avg.toFixed(1).replace('.',',')}</span>,
  <span className="sp-mono" key="days">{g.days===null?'—':g.days.toFixed(1).replace('.',',')}</span>,
  <span className="sp-mono" key="acc">{g.accuracy}</span>,
  <span className="sp-mono sp-muted" key="effect">{g.enough?'Descriptivo':'Muestra insuficiente'}</span>,
 ]);
 const note=!groups.every(g=>g.enough)?
 'No hay al menos 30 estudiantes con respuestas evaluadas en cada grupo. Todavía no es posible comparar efectividad con una muestra suficiente.':
 'Las diferencias son descriptivas: tener un plan no demuestra por sí solo que el plan provoque mejor rendimiento.';
 return <main className="ehome sp-page">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
  <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
   <Link className="eh-primary-link" href="/administrador/solicitudes">Solicitudes universidades <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></Link></div></div>
   <nav className="eh-tabs" aria-label="Paneles">{tabs.map(([name,key],i)=><Link key={name} href={'/administrador/'+key}
    prefetch={false} className={'eh-tab'+(i===5?' eh-active':'')} aria-current={i===5?'page':undefined}>{name}</Link>)}</nav></header>
  <section className="sp-intro"><span className="sp-label">Evaluo / Planes de estudio</span><h1>Planes de estudio</h1>
   <p>Si los estudiantes crean planes, los siguen y llegan avanzados a sus exámenes. Importa si el plan ayuda a mantener una rutina, no cuántos se generan.</p></section>
  <form className="sp-filters" action="/administrador/planes" method="get"
    onChange={e=>{if(e.target instanceof HTMLSelectElement)e.currentTarget.requestSubmit();}}>
   
   <div className="sp-filter"><span className="sp-label">Período</span><div className="sp-segment" role="group" aria-label="Período">
    {([['1','Hoy'],['7','7 días'],['14','14 días'],['30','30 días'],['custom','Personalizado']] as const).map(([v,label])=>
     <button key={v} type="button" className={period===v?'sp-selected':''} aria-pressed={period===v} onClick={()=>{
       setPeriod(v);
       if(v!=='custom'){
        const query=new URLSearchParams(window.location.search);
        query.set('planPeriod',v);
        query.delete('planFrom');query.delete('planTo');
        router.push('/administrador/planes?'+query.toString());
       }
      }}>{label}</button>)}
   </div><input type="hidden" name="planPeriod" value={period}/></div>
   <label className="sp-filter"><span className="sp-label">Universidad</span><select name="planUniversity" defaultValue={filters.university??''}>
     <option value="">Todas</option>{snapshot.options.universities.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
   <label className="sp-filter"><span className="sp-label">Carrera</span><select name="planCareer" defaultValue={filters.career??''}>
     <option value="">Todas</option>{snapshot.options.careers.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
   <label className="sp-filter"><span className="sp-label">Materia</span><select name="planSubject" defaultValue={filters.subject??''}>
     <option value="">Todas</option>{snapshot.options.subjects.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
   <label className="sp-filter"><span className="sp-label">Duración del plan</span><select name="planDuration" defaultValue={filters.duration}>
    <option value="all">Todas</option>{durationLabels.map(([value,name])=><option value={value} key={value}>{name}</option>)}</select></label>
   <label className="sp-filter"><span className="sp-label">Estado</span><select name="planState" defaultValue={filters.state}>
    <option value="all">Todos</option><option value="active">Activo</option>
    <option disabled value="completed">Completado · sin dato</option><option value="not_started">Sin comenzar</option>
    <option value="interrupted">Interrumpido</option></select></label>
   <span className="sp-tag">Muestra mínima: 30 estudiantes</span>
   <span className="sp-tag">Datos reales · Supabase</span>
   {period==='custom'&&<div className="sp-custom"><label>Desde<input required name="planFrom" type="date" value={from} min={earliest} max={today} onChange={e=>setFrom(e.target.value)}/></label>
     <label>Hasta<input required name="planTo" type="date" value={to} min={earliest} max={today} onChange={e=>setTo(e.target.value)}/></label>
     <span>Hasta 30 días</span></div>}
  </form>
  <div className="sp-board">
   <section className="sp-section"><Section n="01" title="Resumen general" detail={snapshot.from+' al '+snapshot.through+' · comparación con el período anterior cuando corresponde.'}/>
     <TileGrid items={summary}/></section>
   <section className="sp-section"><Section n="02" title="Embudo de creación" important detail="Usuarios únicos desde la creación hasta una actividad de estudio registrada dentro de su plan."/>
     <div className="sp-steps">{firstStages.map((f,i)=><div className="sp-step" key={i}>
      <div className="sp-step-label"><span className="sp-mono sp-muted">{String(i+1).padStart(2,'0')}</span>
        <span>{f.label}<small>{f.sub}</small></span></div>
      <div className="sp-step-bar"><Bar height={28} light={i===2} value={f.value===null?0:barWidth(f.value,m.students)}/></div>
      <span className="sp-mono sp-right">{num(f.value)}</span>
      <span className="sp-mono sp-right">{i===2?rate(f.value,m.students):i===1?'100%':'—'}</span>
      <span className="sp-mono sp-right sp-muted">{i===2?'-'+num(Math.max(0,m.students-m.began)):'—'}</span>
     </div>)}</div>
     <div className="sp-note"><span className="sp-priority sp-danger">Mayor caída</span><span>{leak}</span></div></section>
   <section className="sp-section"><Section n="03" title="Seguimiento del plan" important detail="Lecturas programadas y completadas; las prácticas completadas se muestran aparte, sin presentar una finalización integral ficticia."/>
     <TileGrid items={follow}/>
     <div className="sp-split">
      <Buckets title="Cumplimiento por semana del plan · lecturas" rows={weekRows.map(x=>({name:x.name,value:x.value,total:x.total}))}
       total={Math.max(1,...weekRows.map(x=>x.total))}/>
      <Buckets title="Planes según avance de lectura · incluye sin comenzar" rows={distRows} total={m.plans}/>
     </div>
     <p className="sp-footnote">En las barras semanales, el valor es la cantidad de temas leídos; el porcentaje de cumplimiento se calcula frente a los temas programados de esa semana.</p>
   </section>
   <section className="sp-section"><Section n="04" title="Tiempo disponible" detail="Cuánto faltaba para el examen al guardar el plan y cuántos minutos eligieron dedicar cada día."/>
     <TileGrid items={time}/>
     <div className="sp-split"><Buckets title="Planes según días hasta el examen al crearlos" rows={dayRows} total={m.plans}/>
      <Buckets title="Planes según minutos diarios elegidos" rows={minuteRows} total={m.plans}/></div>
   </section>
   <section className="sp-section"><Section n="05" title="Abandono y dificultades" detail="Señales observadas; las fechas pendientes no demuestran por sí mismas que un estudiante abandonó."/>
     <ReportTable head={['Dificultad','Cantidad','Base','Porcentaje sobre la base']}
      rows={friction.map(x=>[<Detail title={x.title} subtitle={x.sub} key="name"/>,
       <span className="sp-mono" key="n">{num(x.count)}</span>,
       <span className="sp-mono sp-muted" key="b">{num(x.base)}</span>,
       <div className="sp-progress-with-value" key="bar"><Bar value={x.base?100*x.count/x.base:0}/>
        <span className="sp-mono">{percent(x.count,x.base)}</span></div>])}/></section>
   <section className="sp-section"><Section n="06" title="Efectividad de los planes" important
      detail="Comparación descriptiva de quienes respondieron preguntas evaluadas; no demuestra causalidad."/>
     <ReportTable format="comparison" head={['Grupo','Estudiantes','Respuestas por estudiante','Días de respuestas por semana','Acierto','Progreso relativo']}
       rows={comparisonRows}/>
     <div className="sp-note"><span className="sp-priority">Lectura</span><span>{note}</span></div>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · un plan guardado por estudiante (se actualiza al editarlo) · se excluyen administradores · el progreso de lectura y práctica requiere registros vinculados al plan posteriores a su creación · caché de 60 minutos · filtros no recargan datos hasta aplicar. No se infiere finalización integral ni causalidad.</footer>
 </main>;
}
function barWidth(value:number,total:number){return total>0?100*value/total:0;}
