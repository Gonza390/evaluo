'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import type {ActivationCohortRow,ActivationCohortSnapshot} from './activation-dashboard-types';
import './admin-home.css';
import './activation-dashboard.css';

type Period = 1|7|14|30|'custom';
type MetricKey = keyof ActivationCohortRow;
const nav:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],
 ['Adquisición y SEO','adquisicion'],['Activación y recorrido','producto'],
 ['Aprendizaje y prácticas','biblioteca'],['Planes de estudio','planes'],
 ['Monetización','referidos'],['Comunicaciones','mails'],['Sistema e IA','ia'],['Gestión','usuarios']];
const sources:[string,string][]=[['all','Todas'],['google','Google'],['social','Instagram y TikTok'],['whatsapp','WhatsApp'],['facebook','Facebook'],['unknown','Directo / sin atribución'],['other','Otros'],['reddit','Reddit'],['ai_referral','Referidos IA']];
const fmt=(n:number)=>Math.round(n).toLocaleString('es-AR');
const pct=(a:number,b:number)=>b>0?(100*a/b).toFixed(1).replace('.',',')+'%':'—';
const sum=(rows:ActivationCohortRow[],key:MetricKey)=>
 rows.reduce((s,r)=>s+(typeof r[key]==='number'?Number(r[key]):0),0);
const addDays=(d:string,days:number)=>{const v=new Date(d+'T12:00:00Z');v.setUTCDate(v.getUTCDate()+days);return v.toISOString().slice(0,10)};
const duration=(ms:number|null)=>ms===null?'—':ms>=60?Math.round(ms/60*10)/10+' h':Math.round(ms)+' min';
function change(curr:number,prev:number,invert=false){
 if(!prev)return {note:curr?'Sin base anterior':'—',color:'#8B8B93'};
 const p=(curr-prev)/prev*100;return {note:(p>=0?'↑ ':'↓ ')+Math.abs(p).toFixed(1).replace('.',',')+'% vs. período anterior',
 color:(invert?p<=0:p>=0)?'#C8FF3A':'#FF5C4D'};
}
function SectionTitle({index,title,note,priority=false}:{index:string;title:string;note:string;priority?:boolean}){
 return <div className="av-sh"><span className="av-idx">{index}</span><h2>{title}</h2>
  {priority&&<span className="av-pri">Prioridad</span>}<p>{note}</p></div>;
}
function Stats({items,small=false}:{items:{label:string;value:string;note:string;color?:string;suffix?:string}[];small?:boolean}){
 return <div className="av-cells">{items.map(x=><div className={'av-cell'+(small?' av-small':'')} key={x.label}>
 <span className="av-lab">{x.label}</span><strong className="av-num">{x.value}<span>{x.suffix??''}</span></strong>
 <span className="av-mono" style={{color:x.color??'#8B8B93'}}>{x.note}</span></div>)}</div>;
}
function Bar({width,color='#566D23',height=14}:{width:number;color?:string;height?:number}){
 return <div className="av-track" style={{height}}><i style={{width:Math.max(0,Math.min(100,width))+'%',height,background:color}}/></div>;
}
function PanelTable({head,rows,kind}:{head:string[];rows:React.ReactNode[][];kind:'leaks'|'segments'}){
 return <div className="av-table"><div className={'av-table-row av-table-head '+kind}>{head.map((h,i)=><span key={i} className={i>0?'av-right':''}>{h}</span>)}</div>
 {rows.map((cells,i)=><div className={'av-table-row '+kind} key={i}>{cells.map((cell,k)=><div className={k>0&&k<cells.length-1?'av-right':''} key={k}>{cell}</div>)}</div>)}</div>;
}
export function ActivationDashboard({data}:{data:ActivationCohortSnapshot}){
 const [period,setPeriod]=useState<Period>(7);
 const [customStart,setCustomStart]=useState(addDays(data.through,-6));
 const [customEnd,setCustomEnd]=useState(data.through);
 const [device,setDevice]=useState('all');
 const [source,setSource]=useState('all');
 const [fileType,setFileType]=useState('all');
 const [path,setPath]=useState('all');
 const range=useMemo(()=>{
  if(period==='custom' && customStart>=data.from && customEnd<=data.through && customStart<=customEnd &&
      (new Date(customEnd).getTime()-new Date(customStart).getTime())/86400000<=29)
   return {start:customStart,end:customEnd,days:Math.round((new Date(customEnd).getTime()-new Date(customStart).getTime())/86400000)+1};
  const days=period==='custom'?7:period;
  return {start:addDays(data.through,1-days),end:data.through,days};
 },[period,customStart,customEnd,data.from,data.through]);
 const all=useMemo(()=>data.rows.filter(r=>
  (device==='all'||r.device===device) && (source==='all'||r.source===source) &&
  (fileType==='all'||r.file_type===fileType) && (path==='all'||r.first_path===path)
 ),[data.rows,device,source,fileType,path]);
 const current=useMemo(()=>all.filter(r=>r.d>=range.start&&r.d<=range.end),[all,range]);
 const previous=useMemo(()=>all.filter(r=>r.d>=addDays(range.start,-range.days)&&r.d<range.start),[all,range]);
 const val=(key:MetricKey,rows=current)=>sum(rows,key);
 const registered=val('registered'),uploaded=val('uploaded'),ready=val('ready'),summary=val('summary');
 const firstStudy=val('studied'),practiced=val('practice_started'),finished=val('practice_finished');
 const minutesCount=val('study_minutes_count'),minutesSum=val('study_minutes_sum');
 const firstMinutes=minutesCount?minutesSum/minutesCount:null;
 const prevRegistered=val('registered',previous),prevStarted=val('studied',previous);
 const prevMinutesCount=val('study_minutes_count',previous);
 const prevMinutes=prevMinutesCount?val('study_minutes_sum',previous)/prevMinutesCount:null;
 const kpis=[
  {label:'Usuarios registrados',value:fmt(registered),...change(registered,prevRegistered)},
  {label:'Cargaron su primer material',value:fmt(uploaded),...change(uploaded,val('uploaded',previous))},
  {label:'Primer material procesado OK',value:fmt(ready),suffix:' / '+fmt(uploaded),note:pct(ready,uploaded)+' listo · estado actual'},
  {label:'Empezaron a estudiar',value:fmt(firstStudy),...change(firstStudy,prevStarted)},
  {label:'Tasa de activación',value:pct(firstStudy,registered),note:'De esta cohorte registrada'},
  {label:'Del registro al primer estudio',value:duration(firstMinutes),note:prevMinutes===null?'Solo usuarios con estudio registrado':change(firstMinutes??0,prevMinutes,true).note}
 ].map(x=>({...x,color:'color' in x?x.color:undefined}));
 const funnel=[
   {label:'Registro completado',count:registered},
   {label:'Primera carga de PDF/DOCX',count:uploaded},
   {label:'Primer material procesado correctamente',count:ready},
   {label:'Primer resumen abierto después de cargar',count:val('funnel_summary')},
   {label:'Comenzó a practicar tras leer el resumen',count:val('funnel_practice')},
   {label:'Finalizó esa práctica',count:val('funnel_finished')}
 ];
 let worst=-1;for(let i=1;i<funnel.length;i++)if(funnel[i-1].count>0 &&
   (worst<0 || funnel[i].count/funnel[i-1].count<funnel[worst].count/funnel[worst-1].count))worst=i;
 const guideStarted=val('guide_started'),guideCompleted=val('guide_completed');
 const onboarding=[
  {label:'Iniciaron la guía del primer PDF',value:fmt(guideStarted),note:'Guía inicial registrada'},
  {label:'Completaron esa guía',value:fmt(guideCompleted),note:pct(guideCompleted,guideStarted)+' respecto de quienes la iniciaron'},
  {label:'No completaron la guía',value:guideStarted>=guideCompleted?fmt(guideStarted-guideCompleted):'—',note:'Sin finalización registrada'},
  {label:'Tiempo promedio de finalización',value:'—',note:'Pendiente de instrumentación'},
  {label:'Paso con mayor abandono',value:'—',note:'Sin eventos secuenciales completos'},
  {label:'Universidad y carrera informadas',value:fmt(val('academic_profile')),note:'Estado del perfil al momento de consulta'}
 ];
 const steps=[
  {name:'1. Universidad informada',count:val('university')},
  {name:'2. Carrera informada',count:val('career')},
  {name:'3. Materias',count:null},
  {name:'4. Objetivo de estudio',count:null}
 ];
 const first=[
  {label:'Abrieron su primer resumen',value:fmt(summary),note:pct(summary,registered)+' de los registrados'},
  {label:'Comenzaron leyendo un tema',value:fmt(sum(current.filter(r=>r.first_path==='read'),'registered')),note:'Primera actividad de ruta registrada'},
  {label:'Practicaron directamente',value:fmt(sum(current.filter(r=>r.first_path==='practice'),'registered')),note:'Práctica observada antes que resumen'},
  {label:'Usaron flashcards',value:fmt(val('flashcards')),note:'Glosario: pendiente de instrumentación'},
  {label:'Finalizaron alguna práctica',value:fmt(finished),note:pct(finished,registered)+' de la cohorte'},
  {label:'Hasta la primera práctica completada',value:duration(val('practice_minutes_count')?val('practice_minutes_sum')/val('practice_minutes_count'):null),note:'Solo con fecha de finalización registrada'}
 ];
 const paths=[
 {label:'Leyó un tema primero',base:sum(current.filter(r=>r.first_path==='read'),'registered'),completed:val('read_finished')},
 {label:'Practicó directamente',base:sum(current.filter(r=>r.first_path==='practice'),'registered'),completed:val('direct_finished')}
 ];
 const frictions=[
 {label:'Registrados que no cargaron material',note:'Registro → primera carga',count:registered-uploaded,base:registered},
 {label:'Cargaron, pero no esperaron al procesamiento',note:'No hay señal fiable de espera',count:null,base:null},
 {label:'Primer material fallido',note:'Estado actual · usuarios, no cantidad de archivos',count:val('failed'),base:uploaded},
 {label:'Material listo, sin resumen posterior',note:'Procesamiento → resumen (ruta lineal)',count:ready-val('funnel_summary'),base:ready},
 {label:'Resumen sin comienzo de práctica posterior',note:'Resumen → práctica (ruta lineal)',count:val('funnel_summary')-val('funnel_practice'),base:val('funnel_summary')},
 {label:'Práctica iniciada pero no finalizada',note:'Práctica → finalización (ruta lineal)',count:val('funnel_practice')-val('funnel_finished'),base:val('funnel_practice')}
 ];
 const segment=(label:string,group:string,rows:ActivationCohortRow[]|null)=>{
  if(rows===null)return {label,group,registered:null,studied:null,uploaded:null,practiced:null,min:null,rate:null};
  const reg=sum(rows,'registered'),stud=sum(rows,'studied'),up=sum(rows,'uploaded'),pra=sum(rows,'practice_finished');
  const cnt=sum(rows,'study_minutes_count');return {label,group,registered:reg,studied:stud,uploaded:up,practiced:pra,
    min:cnt?sum(rows,'study_minutes_sum')/cnt:null,rate:reg?stud/reg:0};
 };
 const segments=[
  segment('Usuarios nuevos','Cohorte',current),segment('Desde una landing de PDF','Origen',null),
  segment('Desde pregunteros','Origen',null),
  segment('Free','Plan',current.filter(r=>!r.premium)),segment('Premium','Plan',current.filter(r=>r.premium)),
  segment('Móvil','Dispositivo',current.filter(r=>r.device==='mobile')),
  segment('Escritorio','Dispositivo',current.filter(r=>r.device==='desktop'))
 ];
 const mob=segments[5],desk=segments[6];
 const mobileNote=mob.registered&&desk.registered?('Móvil: '+pct(mob.studied??0,mob.registered)+
  ' de activación, frente a '+pct(desk.studied??0,desk.registered)+
  ' en escritorio. La fuente de dispositivo puede faltar en algunos registros.'):'No hay suficientes registros de ambos dispositivos para comparar con fiabilidad.';
 return <main className="ehome av-page">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
  <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link><Link className="eh-primary-link" href="/administrador/solicitudes">Solicitudes universidades →</Link></div></div>
  <nav className="eh-tabs" aria-label="Paneles">{nav.map(([name,id],i)=><Link key={name} href={'/administrador?panel='+id} prefetch={false}
  aria-current={i===3?'page':undefined} className={'eh-tab'+(i===3?' eh-active':'')}>{name}</Link>)}</nav></header>
  <section className="av-intro"><div className="av-lab">Evaluo / Activación y recorrido</div><h1>Activación y recorrido</h1>
   <p>Qué hace un estudiante desde que se registra hasta que empieza a estudiar, y dónde abandona. Si vuelve después, eso se mide en Usuarios y retención.</p></section>
  <div className="av-filters" aria-label="Filtros generales">
   <div className="av-sel"><span className="av-lab">Período de registro</span><div className="av-seg" role="group" aria-label="Período de registro">
    {([[1,'Hoy'],[7,'7 días'],[14,'14 días'],[30,'30 días'],['custom','Personalizado']] as [Period,string][]).map(([v,label])=>
      <button type="button" key={label} aria-pressed={period===v} className={period===v?'av-active':''} onClick={()=>setPeriod(v)}>{label}</button>)}
   </div></div>
   <label className="av-sel"><span className="av-lab">País</span><select disabled><option>Sin dato fiable</option></select></label>
   <label className="av-sel"><span className="av-lab">Dispositivo</span><select value={device} onChange={e=>setDevice(e.target.value)}>
    <option value="all">Todos</option><option value="mobile">Móvil</option><option value="desktop">Escritorio</option>
    <option value="unknown">Sin identificar</option></select></label>
   <label className="av-sel"><span className="av-lab">Fuente de adquisición</span><select value={source} onChange={e=>setSource(e.target.value)}>
    {sources.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
   <label className="av-sel"><span className="av-lab">Tipo de material</span><select value={fileType} onChange={e=>setFileType(e.target.value)}>
    <option value="all">Todos</option><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="none">Sin carga</option></select></label>
   <label className="av-sel"><span className="av-lab">Primera actividad observada</span><select value={path} onChange={e=>setPath(e.target.value)}>
    <option value="all">Todos</option><option value="read">Leyó un tema</option><option value="practice">Practicó directo</option><option value="unknown">Sin identificar</option></select></label>
   <div className="av-flex"/><span className="av-tag">Cohorte de registro · usuarios únicos</span><span className="av-tag">Datos reales · Supabase</span>
   {period==='custom'&&<div className="av-custom"><label>Desde<input type="date" aria-label="Desde" min={addDays(data.from,30)} max={data.through} value={customStart} onChange={e=>setCustomStart(e.target.value)}/></label>
   <label>Hasta<input type="date" aria-label="Hasta" min={data.from} max={data.through} value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></label><span>Hasta 30 días</span></div>}
  </div>
  <div className="av-board">
   <section className="av-sec"><SectionTitle index="01" title="Resumen de activación" note={range.start+' a '+range.end+' · usuarios registrados en el período, comparados con el anterior.'}/>
    <Stats items={kpis}/></section>
   <section className="av-sec"><SectionTitle index="02" title="Embudo de activación" priority note="Usuarios únicos de la misma cohorte. Recorrido lineal registrado; quienes practican directamente pueden omitir el resumen."/>
    <div className="av-steps">{funnel.map((f,i)=><div className="av-step" key={f.label}>
      <div className="av-step-label"><span>{String(i+1).padStart(2,'0')}</span>{f.label}</div>
      <div className="av-bar-wide"><Bar width={registered?100*f.count/registered:0} height={28} color={i===3?'#C8FF3A':'#566D23'}/></div>
      <span className="av-right av-mono">{fmt(f.count)}</span><span className="av-right av-mono" style={{color:i===worst?'#FF5C4D':undefined}}>{i?pct(f.count,funnel[i-1].count):'100%'}</span>
      <span className="av-right av-mono av-muted">{i?'−'+fmt(Math.max(0,funnel[i-1].count-f.count)):''}</span>
    </div>)}</div>
    <div className="av-callout"><span className="av-pri av-danger">Mayor caída</span><span>{worst>0?'Entre «'+funnel[worst-1].label.toLowerCase()+'» y «'+funnel[worst].label.toLowerCase()+'» se pierde el '+pct(Math.max(0,funnel[worst-1].count-funnel[worst].count),funnel[worst-1].count)+' de los usuarios de esa etapa.':'Sin una base suficiente para calcular pérdidas.'}</span></div>
   </section>
   <section className="av-sec"><SectionTitle index="03" title="Onboarding" note="La guía inicial está instrumentada; los datos académicos muestran el estado actual, no los pasos completados históricamente."/>
    <Stats items={onboarding} small/>
    <div className="av-step-group"><span className="av-lab">Campos académicos disponibles · no equivalen a pasos de onboarding</span>
      {steps.map(st=><div className="av-step" key={st.name}><div className="av-step-label">{st.name}</div>
        <div className="av-bar-wide"><Bar width={st.count===null?0:(registered?100*st.count/registered:0)}/></div>
        <span className="av-mono av-right">{st.count===null?'—':fmt(st.count)}</span>
        <span className="av-mono av-right av-muted">—</span></div>)}
    </div></section>
   <section className="av-sec"><SectionTitle index="04" title="Primera experiencia de estudio" note="Señales de lectura, práctica y finalización identificadas después del registro."/>
    <Stats items={first} small/>
    <div className="av-step-group"><span className="av-lab">Primera práctica finalizada según la primera actividad observada</span>
    {paths.map(p=><div className="av-step" key={p.label}><div className="av-step-label av-wrap-label"><span>{p.label}</span><small>{fmt(p.base)} usuarios</small></div>
     <div className="av-bar-wide"><Bar width={p.base?100*p.completed/p.base:0}/></div>
     <span className="av-mono av-right av-path-pct">{pct(p.completed,p.base)} finalizó</span></div>)}
    </div></section>
   <section className="av-sec"><SectionTitle index="05" title="Abandono y fricciones" priority note="La pérdida se calcula sobre quienes alcanzaron cada etapa; se distingue falta de evento de abandono confirmado."/>
     <PanelTable kind="leaks" head={['Fricción','Usuarios','Base','% de abandono en la etapa']}
      rows={frictions.map(f=>[
        <div className="av-descr" key="name"><strong>{f.label}</strong><small>{f.note}</small></div>,
        <span key="count" className="av-mono">{f.count===null?'—':fmt(Math.max(0,f.count))}</span>,
        <span key="base" className="av-mono av-muted">{f.base===null?'—':'de '+fmt(f.base)}</span>,
        <div className="av-withbar" key="bar"><Bar width={f.count===null||!f.base?0:100*f.count/f.base}/>
           <span className="av-mono">{f.count===null||!f.base?'—':pct(f.count,f.base)}</span></div>
      ])}/></section>
   <section className="av-sec"><SectionTitle index="06" title="Comparación de recorridos" note="Segmentos observables en la misma cohorte; las fuentes sin atribución verificable permanecen pendientes."/>
      <PanelTable kind="segments" head={['Segmento','Registrados','Empezaron a estudiar','Carga → práctica','Primer estudio','Activación']}
        rows={segments.map(s=>[
        <div className="av-descr" key="label"><strong>{s.label}</strong><small>{s.group}</small></div>,
        <span className="av-mono" key="reg">{s.registered===null?'—':fmt(s.registered)}</span>,
        <span className="av-mono" key="study">{s.studied===null?'—':fmt(s.studied)}</span>,
        <span className="av-mono" key="practice">{s.uploaded===null||s.practiced===null?'—':pct(s.practiced,s.uploaded)}</span>,
        <span className="av-mono" key="time">{duration(s.min)}</span>,
        <span className="av-mono" key="pct" style={{color:s.rate!==null&&s.rate>=0.5?'#C8FF3A':undefined}}>{s.rate===null||s.registered===null?'—':pct(s.studied??0,s.registered)}</span>
        ])}/>
      <div className="av-callout"><span className="av-pri">Posible fricción</span><span>{mobileNote}</span></div>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · cohorte por fecha de registro · todos los filtros se aplican localmente · acceso solo administrador · la guía del primer PDF no equivale al onboarding académico completo · el estado de procesamiento y Premium es actual · los recorridos con datos insuficientes no se estiman.</footer>
 </main>;
}
