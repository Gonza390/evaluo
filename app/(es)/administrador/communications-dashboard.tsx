'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import type {CommunicationsFilters,CommunicationsSnapshot} from './communications-dashboard-types';
import './admin-home.css';
import './communications-dashboard.css';

const nav:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],
 ['Adquisición y SEO','adquisicion'],['Activación y recorrido','producto'],
 ['Aprendizaje y prácticas','biblioteca'],['Planes de estudio','planes'],
 ['Monetización','monetizacion'],['Comunicaciones','mails'],
 ['Sistema e IA','ia'],['Gestión','gestion'],
];
const templates:[string,string][]=[
 ['exam_7','Recordatorio · 7 días'],['exam_3','Recordatorio · 3 días'],
 ['exam_1','Recordatorio · 1 día'],['ready','Material listo'],
 ['return_48h','Recuperación · 48 horas'],['return_d1','Recuperación · 1 día'],
 ['return_30d','Recuperación · 30 días'],['flashcards','Repaso de flashcards'],
 ['welcome','Bienvenida'],['other','Otros correos'],
];
const types:[string,string][]=[
 ['all','Todos'],['exam','Recordatorios de examen'],
 ['ready','Materiales listos'],['welcome','Bienvenida'],
 ['recovery','Recuperación de estudiantes'],['review','Repaso'],
 ['campaign','Campañas'],
];
const campaignLabels:[string,string][]=[
 ['all','Todas'],['automatic','Automáticos permanentes'],
 ['exam','Campañas de examen'],['recovery','Recuperación de inactivos'],
 ['manual','Otras campañas'],
];
const flowLabels:Record<string,{title:string;description:string;kind:string}>={
 exam:{title:'Recordatorios de examen',description:'Fechas de examen: 7, 3 y 1 día antes',kind:'EXAMEN'},
 ready:{title:'Material listo',description:'Se prepara el aviso cuando un material termina de procesarse',kind:'MATERIAL'},
 recovery:{title:'Recuperación de estudiantes',description:'Recordatorios y campañas de retorno al estudio',kind:'RETENCIÓN'},
 review:{title:'Repaso de flashcards',description:'Avisos de repaso programados',kind:'REPASO'},
 campaign:{title:'Otras campañas',description:'Envíos puntuales registrados',kind:'CAMPAÑA'},
};
const labelFor=(v:string)=>templates.find(t=>t[0]===v)?.[1]??v.replaceAll('_',' ');
const number=(v:number|undefined|null)=>v===undefined||v===null?'—':Math.round(v).toLocaleString('es-AR');
const pct=(a:number,b:number)=>b>0?(a*100/b).toFixed(1).replace('.',',')+'%':'—';
const fmtDate=(s:string|null)=>s?new Intl.DateTimeFormat('es-AR',{
  day:'2-digit',month:'short',year:'numeric',timeZone:'America/Argentina/Buenos_Aires',
}).format(new Date(s)):'—';
const dateOnly=(s:string)=>new Intl.DateTimeFormat('es-AR',{
  day:'2-digit',month:'short',year:'numeric',timeZone:'UTC',
}).format(new Date(s+'T12:00:00Z'));
const percentWidth=(a:number,b:number)=>b>0?Math.max(0,Math.min(100,a*100/b)):0;
function Section({n,title,note,important=false}:{n:string;title:string;note:string;important?:boolean}){
 return <div className="cm-sec-head"><span className="cm-index">{n}</span><h2>{title}</h2>
   {important&&<span className="cm-priority">Prioridad</span>}<p>{note}</p></div>;
}
function Bar({width,bright=false}:{width:number;bright?:boolean}){
 return <div className="cm-bar"><i style={{width:Math.max(0,Math.min(100,width))+'%',
   background:bright?'#C8FF3A':'#566D23'}}/></div>;
}
function Tiles({items}:{items:Array<{label:string;value:string;sub:string;note:string;priority?:boolean}>}){
 return <div className="cm-tiles">{items.map(x=><div className="cm-tile" key={x.label}>
  <div className="cm-tile-label"><span>{x.label}</span>{x.priority&&<span className="cm-priority">Prioridad</span>}</div>
  <strong>{x.value}</strong><span className="cm-tile-sub">{x.sub}</span><span className="cm-tile-note">{x.note}</span>
 </div>)}</div>;
}
function ReportTable({head,rows,layout='performance',empty='No hay registros para esta selección.'}:{
 head:string[];rows:ReactNode[][];layout?:'performance'|'upcoming';
 empty?:string;
}){
 return <div className="cm-table-scroll"><div className={'cm-table-row cm-table-head cm-'+layout}>
 {head.map((x,i)=><div className={i>0?'cm-right':''} key={i}>{x}</div>)}</div>
 {rows.length?rows.map((cells,i)=><div className={'cm-table-row cm-'+layout} key={i}>{cells.map((c,j)=>
   <div className={j>0&&j<cells.length-1?'cm-right':''} key={j}>{c}</div>)}</div>):
   <p className="cm-empty">{empty}</p>}</div>;
}
function Name({title,subtitle}:{title:string;subtitle:string}){
 return <div className="cm-name"><strong>{title}</strong><small>{subtitle}</small></div>;
}
type Props={snapshot:CommunicationsSnapshot;filters:CommunicationsFilters;today:string;earliest:string};
export function CommunicationsDashboard({snapshot,filters,today,earliest}:Props){
 const router=useRouter();
 const [period,setPeriod]=useState<CommunicationsFilters['period']>(filters.period);
 const [from,setFrom]=useState(filters.from??'');
 const [to,setTo]=useState(filters.to??today);
 const [sortBy,setSortBy]=useState<'sent'|'study'|'returned'|'name'>('sent');
 const m=snapshot.summary,impact=snapshot.impact;
 useEffect(()=>{
  if(period!=='custom'||!from||!to||from>to||from<earliest||to>today||
   (Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000>29||
   (filters.from===from&&filters.to===to))return;
  const query=new URLSearchParams(window.location.search);
  query.set('panel','mails');query.set('commPeriod','custom');
  query.set('commFrom',from);query.set('commTo',to);
  router.replace('/administrador?'+query.toString());
 },[period,from,to,earliest,today,filters.from,filters.to,router]);
 const sortedTemplates=useMemo(()=>{
  const rows=[...snapshot.templates];
  if(sortBy==='sent')rows.sort((a,b)=>b.sent-a.sent);
  if(sortBy==='study')rows.sort((a,b)=>(b.eligible?b.studied_mails/b.eligible:-1)-(a.eligible?a.studied_mails/a.eligible:-1));
  if(sortBy==='returned')rows.sort((a,b)=>b.returned_mails-a.returned_mails);
  if(sortBy==='name')rows.sort((a,b)=>labelFor(a.template).localeCompare(labelFor(b.template),'es'));
  return rows;
 },[snapshot.templates,sortBy]);
 const windowText=snapshot.from+' al '+snapshot.through;
 const summary=[
  {label:'Correos enviados',value:number(m.sent),sub:'Envíos registrados por Evaluo',
   note:'El proveedor aceptó el envío; no confirma recepción'},
  {label:'Correos entregados',value:'—',sub:'No hay confirmación de entrega por destinatario',
   note:'Requiere webhook o reporte de Sender',priority:true},
  {label:'Correos fallidos',value:number(m.failed),sub:'Fallos registrados antes o durante el envío',
   note:'No incluye rebotes posteriores'},
  {label:'Tasa de apertura',value:'—',sub:'No está vinculada a los envíos individuales',
   note:'La privacidad del cliente puede alterar aperturas'},
  {label:'Tasa de clics hacia Evaluo',value:'—',sub:'Clics atribuibles sin instrumentación completa',
   note:'No se interpreta una visita como clic confirmado',priority:true},
 ];
 const flowKinds=['exam','ready','recovery','review','campaign'];
 const flowCards=flowKinds.map(id=>{
  const row=snapshot.flows.find(x=>x.kind===id);
  return {...flowLabels[id],id,sent:row?.sent??0,failed:row?.failed??0,last:row?.last_sent??null,
    seen:!!row};
 }).filter(x=>x.id!=='campaign'||x.seen);
 const performanceRows=sortedTemplates.map(x=>[
   <Name key="name" title={labelFor(x.template)} subtitle={
      (types.find(v=>v[0]===x.kind)?.[1]??x.kind)+(x.sent<20?' · Muestra chica':'')}/>,
   <span key="sent" className="cm-mono">{number(x.sent)}</span>,
   <span key="deliv" className="cm-mono cm-muted">—<small>Sin medición</small></span>,
   <span key="open" className="cm-mono cm-muted">—<small>Sin medición</small></span>,
   <span key="click" className="cm-mono cm-muted">—<small>Sin medición</small></span>,
   <div key="eff" className="cm-eff"><Bar width={percentWidth(x.studied_mails,x.eligible)}
      bright={x.eligible>=20}/>
    <span className="cm-mono">{pct(x.studied_mails,x.eligible)}</span>
    <small>{number(x.studied_mails)} / {number(x.eligible)} envíos elegibles</small></div>,
 ]);
 const reminderDays=[7,3,1];
 const upcomingRows=snapshot.upcoming.map((x,i)=>[
  <Name key="person" title={'Estudiante con examen · '+(i+1)} subtitle="Identidad no expuesta en este informe"/>,
  <span className="cm-mono" key="subject">{x.subject}</span>,
  <span className="cm-mono" key="reminder">{x.reminder_days} día{x.reminder_days===1?'':'s'} antes</span>,
  <span className="cm-mono" key="date">{dateOnly(x.exam_date)}</span>
 ]);
 const causeReasons=snapshot.reasons.length?snapshot.reasons:
  [{label:'No hay fallos registrados',n:0}];
 const scopeEmails=impact.eligible;
 const flowSteps=[
  {label:'Envíos aceptados por el proveedor',value:m.sent,sub:'Sin verificar entrega final'},
  {label:'Ventana de 48 horas completa',value:scopeEmails,sub:'Solo envíos con ventana totalmente observada'},
  {label:'Actividad posterior en Evaluo',value:impact.returned_mails,sub:'Actividad registrada después del envío'},
  {label:'Actividad académica posterior',value:impact.studied_mails,sub:'No prueba que el correo causó el estudio'},
 ];
 const maxStep=Math.max(m.sent,1);
 const impactTypeRows=[...snapshot.templates].sort((a,b)=>b.studied_mails-a.studied_mails)
  .filter(x=>x.sent>0).map(x=>(
   <div className="cm-impact-type" key={x.template}>
    <div className="cm-name"><strong>{labelFor(x.template)}</strong>
     <small>{number(x.studied_mails)} envíos seguidos de estudio</small></div>
    <Bar width={percentWidth(x.studied_mails,x.eligible)} bright={x.eligible>=20}/>
    <span className="cm-mono">{pct(x.studied_mails,x.eligible)}</span>
    <span className="cm-mono cm-muted">{number(x.eligible)} elegibles</span>
   </div>
 ));
 return <main className="ehome cm-page">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
   <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
    <Link href="/administrador/solicitudes" className="eh-primary-link">Solicitudes universidades <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></Link></div></div>
   <nav className="eh-tabs" aria-label="Paneles">{nav.map(([label,panel],i)=>
    <Link key={label} href={'/administrador/'+panel} prefetch={false}
      aria-current={i===7?'page':undefined} className={'eh-tab'+(i===7?' eh-active':'')}>{label}</Link>)}</nav>
  </header>
  <section className="cm-intro"><span className="cm-kicker">Evaluo / Comunicaciones</span>
    <h1>Comunicaciones</h1><p>Los correos automáticos de Evaluo: si se envían, si llegan y, sobre todo, si los estudiantes vuelven a estudiar.</p></section>
  <form className="cm-filters" action="/administrador" method="get"
    onChange={e=>{if(e.target instanceof HTMLSelectElement)e.currentTarget.requestSubmit();}}>
   <input type="hidden" name="panel" value="mails"/>
   <div className="cm-filter-top">
    <div className="cm-filter"><span className="cm-kicker">Período</span>
    <div className="cm-segment" role="group" aria-label="Período">
     {([['1','Hoy'],['7','7 días'],['14','14 días'],['30','30 días'],['custom','Personalizado']] as const).map(([v,label])=>
      <button type="button" key={v} onClick={()=>{
        setPeriod(v);
        if(v!=='custom'){
         const query=new URLSearchParams(window.location.search);
         query.set('panel','mails');query.set('commPeriod',v);
         query.delete('commFrom');query.delete('commTo');
         router.push('/administrador?'+query.toString());
        }
       }} aria-pressed={period===v}
       className={period===v?'cm-picked':''}>{label}</button>)}</div>
    <input type="hidden" name="commPeriod" value={period}/></div>
    <span className="cm-tag">Datos reales · Supabase</span>
   </div>
   <div className="cm-filter-second">
   <label className="cm-filter"><span className="cm-kicker">Tipo de correo</span>
    <select name="commType" defaultValue={filters.type}>{types.map(([v,label])=>
      <option key={v} value={v}>{label}</option>)}</select></label>
   <label className="cm-filter"><span className="cm-kicker">Plantilla</span>
    <select name="commTemplate" defaultValue={filters.template}>
     <option value="all">Todas</option>{templates.map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></label>
   <label className="cm-filter"><span className="cm-kicker">Estado de entrega</span>
    <select name="commStatus" defaultValue={filters.status}>
     <option value="all">Todos los estados</option>
     <option value="sent">Enviado · aceptado</option>
     <option value="failed">Error registrado</option>
     <option value="pending">Pendiente</option>
     <option value="sending">En proceso</option>
     <option value="cancelled">Cancelado</option>
     <option disabled>Entregado · sin telemetría</option>
     <option disabled>Rebotado · sin telemetría</option>
    </select></label>
   <label className="cm-filter"><span className="cm-kicker">Campaña</span>
    <select name="commCampaign" defaultValue={filters.campaign}>{campaignLabels.map(([v,label])=>
      <option key={v} value={v}>{label}</option>)}</select></label>
   </div>
   {period==='custom'&&<div className="cm-custom"><label>Desde<input required type="date" value={from}
      min={earliest} max={today} name="commFrom" onChange={e=>setFrom(e.target.value)}/></label>
     <label>Hasta<input required type="date" value={to} min={earliest}
      max={today} name="commTo" onChange={e=>setTo(e.target.value)}/></label>
     <span>Hasta 30 días dentro de los últimos 90</span></div>}
  </form>
  <div className="cm-board">
   <section className="cm-section"><Section n="01" title="Resumen general" note={windowText+' · envíos registrados; entrega real pendiente de confirmación'}/>
    <Tiles items={summary}/></section>
   <section className="cm-section"><Section n="02" title="Correos automáticos" note="Flujos registrados por Evaluo; el estado «enviado» no garantiza entrega."/>
    <div className="cm-cards">{flowCards.map(c=><div className="cm-flow-card" key={c.id}>
      <div className="cm-flow-top"><span className="cm-flow-type">{c.kind}</span>
       <span className={'cm-flow-status '+(c.sent?'cm-flow-active':'')}>{c.sent?'Con envíos registrados':'Sin envíos en el período'}</span></div>
      <h3>{c.title}</h3><p>{c.description}</p>
      <div className="cm-flow-stats">
       <div><span>Enviados</span><strong>{number(c.sent)}</strong></div>
       <div><span>Entrega</span><strong>—</strong></div>
       <div><span>Clics</span><strong>—</strong></div>
      </div><small className="cm-flow-last">Último envío · {fmtDate(c.last)}</small>
    </div>)}</div></section>
   <section className="cm-section"><div className="cm-sec-row">
     <Section n="03" title="Rendimiento por correo" note={windowText+' · actividad académica dentro de las 48 h posteriores al envío'}/>
     <label className="cm-sort"><span className="cm-kicker">Ordenar por</span>
      <select value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)}>
       <option value="sent">Más enviados</option><option value="study">Mayor proporción de estudio posterior</option>
       <option value="returned">Más actividad posterior</option><option value="name">Nombre</option>
      </select></label></div>
    <ReportTable head={['Plantilla','Envíos','Entregas','Aperturas','Clics','Estudio posterior / elegibles']} rows={performanceRows}/>
    <p className="cm-footnote">Los porcentajes de estudio usan envíos con 48 horas completas de observación, no entregas confirmadas. No miden efecto causal. Menos de 20 envíos se identifica como muestra chica.</p></section>
   <section className="cm-section"><Section n="04" title="Recordatorios de examen" note="Recordatorios registrados a 7, 3 y 1 día del examen. Los futuros son candidatos de calendario, no trabajos ya encolados."/>
    <div className="cm-reminders">{reminderDays.map(days=>{
     const x=snapshot.reminders.find(r=>r.days===days);
     return <div className="cm-rem-card" key={days}><span className="cm-kicker">Recordatorio · {days} día{days===1?'':'s'}</span>
      <strong>{number(x?.records??0)} <small>registros</small></strong>
      <div className="cm-rem-progress"><Bar width={percentWidth(x?.sent??0,x?.records??0)} bright/></div>
      <div className="cm-rem-stats"><div><span>Enviados</span><strong>{number(x?.sent??0)}</strong></div>
       <div><span>Pendientes</span><strong>{number(x?.pending??0)}</strong></div>
       <div><span>Fallidos</span><strong>{number(x?.failed??0)}</strong></div></div>
     </div>})}</div>
    <div className="cm-upcoming"><div className="cm-upcoming-head"><h3>Próximos envíos programados</h3>
      <span className="cm-kicker">{number(snapshot.upcoming_total)} candidatos · según exámenes registrados, fuera del período seleccionado</span></div>
     <ReportTable layout="upcoming" head={['Estudiante','Materia o examen','Recordatorio','Fecha prevista']}
      rows={upcomingRows} empty="No hay candidatos pendientes identificados para exámenes dentro de 1, 3 o 7 días."/>
     <p className="cm-footnote">Una fecha prevista no garantiza programación ni entrega. La lista excluye registros de envío ya conocidos y evita mostrar datos personales.</p></div>
   </section>
   <section className="cm-section"><Section n="05" title="Errores y entregabilidad" note={'Por qué un correo puede fallar · '+windowText}/>
    <div className="cm-error-grid"><div className="cm-error-feature"><span className="cm-kicker">Entrega efectiva</span>
      <span className="cm-priority">Prioridad</span><strong>—</strong>
      <p>Sin eventos de entrega confirmada del proveedor. No es posible comprobar todavía el objetivo del 95%.</p>
      <span className="cm-muted cm-mono">{number(m.sent)} envíos aceptados, {number(m.failed)} fallos registrados.</span>
     </div>
     <div className="cm-error-section"><div className="cm-error-heading"><h3>Motivos de falla</h3>
       <span className="cm-kicker">{number(m.failed)} correos fallidos</span></div>
      {causeReasons.map(x=><div className="cm-reason" key={x.label}><span>{x.label}</span>
       <Bar width={percentWidth(x.n,m.failed)}/><strong className="cm-mono">{number(x.n)}</strong></div>)}
     </div>
     <div className="cm-error-section"><div className="cm-error-heading"><h3>Dónde rebotan</h3>
       <span className="cm-kicker">Sin eventos de rebote</span></div>
      <p className="cm-bounce-empty">Los rebotes por proveedor o dominio (universidad, Gmail, Outlook, etc.) no están vinculados al historial de envíos. No se atribuyen ni se estiman.</p>
     </div></div>
   </section>
   <section className="cm-section"><Section n="06" title="Impacto en el producto" note={'¿Los correos preceden a actividad académica real? · '+windowText}/>
    <div className="cm-impact-top">
     <div className="cm-impact-main"><span className="cm-kicker">Estudiantes que vuelven a estudiar</span>
      <span className="cm-priority">Prioridad</span><strong>{number(impact.unique_studied)}</strong>
      <p>Estudiantes únicos con estudio registrado durante las 48 horas posteriores a un envío ya observado completamente.</p>
      <small>No equivale a conversiones atribuibles al correo: la actividad puede ser espontánea.</small></div>
     <div className="cm-impact-side"><div><span className="cm-kicker">Regresaron a Evaluo tras un correo</span>
       <strong>{number(impact.unique_returned)}</strong>
       <small>Estudiantes únicos con actividad de producto dentro de las 48 h posteriores</small></div>
      <div><span className="cm-kicker">Tiempo hasta volver</span>
       <strong>—</strong><small>La mediana todavía no está instrumentada</small></div></div>
    </div>
    <div className="cm-impact-two">
     <div><div className="cm-impact-title"><h3>Del correo a la actividad</h3>
       <span className="cm-kicker">Conteo de envíos, no usuarios únicos</span></div>
      {flowSteps.map((x,i)=><div className="cm-step" key={x.label}>
       <div className="cm-name"><strong>{x.label}</strong><small>{x.sub}</small></div>
       <Bar width={percentWidth(x.value,maxStep)} bright={i===3}/>
       <span className="cm-mono">{number(x.value)}</span>
       <span className="cm-mono cm-muted">{pct(x.value,i>=2?scopeEmails:m.sent)}</span>
      </div>)}</div>
     <div><div className="cm-impact-title"><h3>Qué tipo de correo activa más estudio</h3>
       <span className="cm-kicker">Estudio posterior / envíos elegibles</span></div>
       {impactTypeRows.length?impactTypeRows:<p className="cm-empty">No hay correos enviados con estos filtros.</p>}
     </div>
    </div>
    <p className="cm-footnote">Si varios correos llegan a la misma persona dentro de 48 horas, la actividad posterior puede coincidir con más de uno. No contamos dobles usuarios en las cifras de usuarios únicos y no afirmamos causalidad.</p>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · correos marcados como enviados en Evaluo, sin confirmación de entrega ni apertura de Sender · consultas agregadas y cacheadas durante 60 minutos · acceso solo administrador · sin nombres ni correos de estudiantes en la respuesta.
  </footer>
 </main>;
}
