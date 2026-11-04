'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import type {SystemAiSnapshot} from './system-ai-dashboard-types';
import './admin-home.css';
import './system-ai-dashboard.css';

const nav:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],['Adquisición y SEO','adquisicion'],
 ['Activación y recorrido','producto'],['Aprendizaje y prácticas','biblioteca'],
 ['Planes de estudio','planes'],['Monetización','monetizacion'],['Comunicaciones','mails'],
 ['Sistema e IA','ia'],['Gestión','gestion'],
];
const nf=(n:number|null|undefined):string=>n==null||!Number.isFinite(n)?'—':n.toLocaleString('es-AR',{maximumFractionDigits:1});
const percent=(a:number,b:number)=>b>0?(a/b*100).toFixed(1).replace('.',',')+'%':'—';
const size=(n:number|null|undefined)=>{
 if(n==null)return '—';
 const units=['B','KB','MB','GB','TB'];let x=n,i=0;
 while(x>=1024&&i<units.length-1){x/=1024;i++;}
 return x.toLocaleString('es-AR',{maximumFractionDigits:1})+' '+units[i];
};
const moment=(v:string|null|undefined)=>v?new Intl.DateTimeFormat('es-AR',{
 timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'short',year:'numeric',
 hour:'2-digit',minute:'2-digit'
}).format(new Date(v)):'—';
const day=(v:string)=>new Intl.DateTimeFormat('es-AR',{
 timeZone:'UTC',day:'2-digit',month:'2-digit'
}).format(new Date(v+'T12:00:00Z'));
function Title({i,name,description,priority}:{i:string;name:string;description:string;priority?:string}){
 return <div className="si-head"><span className="si-index">{i}</span><h2>{name}</h2>
 {priority&&<span className="si-priority">{priority}</span>}<p>{description}</p></div>;
}
function Bar({value,color='soft'}:{value:number;color?:'accent'|'soft'|'red'}){
 return <div className="si-bar"><span className={'si-bar-'+color} style={{width:Math.max(0,Math.min(100,value))+'%'}}/></div>;
}
function Name({title,note}:{title:string;note:string}){
 return <div className="si-name"><strong>{title}</strong><small>{note}</small></div>;
}
function formatTime(n:number|null){return n==null?'—':nf(n)+' s'}
type Props={data:SystemAiSnapshot;days:1|7|14|30};
export function SystemAiDashboard({data,days}:Props){
 const [expanded,setExpanded]=useState<string|null>(null);
 const [series,setSeries]=useState<'tokens'|'requests'>('tokens');
 const [tableSort,setTableSort]=useState<'requests'|'tokens'>('requests');
 const stats=data.summary,ms=stats.materials,js=stats.jobs,ai=stats.ai;
 const period=days===1?'Últimas 24 horas':'Últimos '+days+' días';
 const health:{label:string;value:string;sub:string;status:string;color:'neutral'|'positive'|'negative'}[]=[
  {label:'Procesamientos exitosos',value:nf(ms.ready),sub:period,status:ms.failed?'Con fallos registrados':'Sin fallos registrados',color:ms.failed?'negative':'positive'},
  {label:'Errores técnicos observados',value:nf(stats.client_errors+ms.failed),sub:'Errores de navegador + materiales fallidos',status:'Registro parcial',color:'neutral'},
  {label:'Tiempo medio de procesamiento',value:formatTime(js.avg_seconds),sub:'Trabajos completados con duración registrada',status:js.avg_seconds==null?'Sin medición':'Medido',color:'neutral'},
  {label:'Operaciones IA registradas',value:nf(ai.requests),sub:'Solicitudes con tokens registrados',status:'Medición parcial',color:'neutral'},
  {label:'Costo de IA',value:'—',sub:'USD · sin facturación conciliada',status:'Sin verificar',color:'neutral'},
  {label:'Incidencias activas',value:'—',sub:nf(stats.observed_groups)+' grupos de errores observados',status:'Estado no instrumentado',color:'neutral'},
 ];
 const totalProcess=ms.ready+ms.failed;
 const fileGroups=['PDF','DOCX'] as const;
 const col=(type:'PDF'|'DOCX')=>data.types.find(t=>t.file_type===type);
 const fields=[
  {label:'Archivos recibidos',key:'uploaded' as const,note:'Materiales cargados en el período'},
  {label:'Procesamientos exitosos',key:'ready' as const,note:'Materiales con estado listo'},
  {label:'Procesamientos fallidos',key:'failed' as const,note:'Estado final fallido'},
  {label:'Tiempo promedio',key:null,note:'Trabajos completados, sin desglose de formato'},
  {label:'Percentil 95 (P95)',key:null,note:'Trabajos completados, sin desglose de formato'},
  {label:'Reintentos',key:null,note:'Trabajos con más de un intento'},
  {label:'Archivos en proceso',key:'pending' as const,note:'Materiales no listos ni fallidos'},
 ];
 const processValue=(key:typeof fields[number]['key'],t?:'PDF'|'DOCX',index?:number)=>{
  if(key)return nf(t?(col(t)?.[key]??0):ms[key]);
  if(t)return '—';
  if(index===3)return formatTime(js.avg_seconds);
  if(index===4)return formatTime(js.p95_seconds);
  if(index===5)return nf(js.retries);
  return '—';
 };
 const reasons=data.reasons;
 const maxReason=Math.max(1,...reasons.map(x=>x.n));
 const aiFns=useMemo(()=>{
  const a=[...data.ai_functions];a.sort((x,y)=>y[tableSort]-x[tableSort]);return a;
 },[data.ai_functions,tableSort]);
 const maxAi=Math.max(1,...aiFns.map(x=>x.requests));
 const plotted=data.daily;
 const maxGraph=Math.max(1,...plotted.map(x=>x[series]));
 const points=plotted.map((x,i)=>{
  const pos=plotted.length===1?500:i*1000/(plotted.length-1);
  return pos.toFixed(1)+','+(200-180*x[series]/maxGraph).toFixed(1);
 }).join(' ');
 const aiKpis=[
  {label:'Costo por material procesado',value:'—',sub:'Sin facturación validada por operación'},
  {label:'Consumo de tokens registrado',value:nf(ai.tokens),sub:period+' · entradas y salidas'},
  {label:'Función con más operaciones',value:aiFns[0]?.name??'—',sub:aiFns.length?nf(aiFns[0].requests)+' operaciones instrumentadas':'No hay operaciones en el período'}
 ];
 const infra=[
  {name:'Supabase',status:'Datos parciales verificados',rows:[
   ['Tamaño de base de datos',size(data.infra.database_bytes),'Métrica de tamaño actual'],
   ['Almacenamiento de materiales',size(data.infra.storage.bytes),nf(data.infra.storage.objects)+' objetos almacenados'],
   ['Consultas lentas','—','Sin observabilidad temporal consolidada'],
   ['Conexiones activas','—','Sin métrica temporal conectada'],
   ['Errores de base de datos','—','Sin logs agregados en este informe']
  ]},
  {name:'Vercel',status:'Cuotas sin conexión a la consola',rows:[
   ['Ejecuciones de funciones','—','Sin medición conectada a la API de uso'],
   ['Duración de funciones','—','Sin agregación de trazas'],
   ['Transferencia','—','Sin información de consumo del plan'],
   ['Errores de servidor','—','No se infieren desde errores del navegador'],
   ['Uso de los límites del plan','—','No se inventa un porcentaje']
  ]},
 ];
 const performance=data.performance.map(r=>({
  ...r,
  p95:r.lcp_samples>=20&&r.lcp_p95_ms!==null
    ?nf(r.lcp_p95_ms)+' ms':'—',
  hasP95:r.lcp_samples>=20&&r.lcp_p95_ms!==null,
  errors:r.ord===2?ms.failed:r.errors,
 }));
 return <main className="ehome si-page">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
   <div className="eh-top-actions">
    <Link href="/administrador/feedback">Feedback</Link>
    <Link className="eh-primary-link" href="/administrador/solicitudes">Solicitudes universidades <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></Link>
   </div></div>
   <nav className="eh-tabs" aria-label="Paneles">{nav.map(([label,panel],i)=>
    <Link key={panel} href={'/administrador?panel='+panel} prefetch={false}
      aria-current={i===8?'page':undefined} className={'eh-tab'+(i===8?' eh-active':'')}>{label}</Link>)}</nav>
  </header>
  <section className="si-intro"><span className="si-lab">Evaluo / Sistema e IA</span>
   <h1>Sistema e IA</h1>
   <p>Si la plataforma funciona, cuánto consumimos y qué conviene resolver antes de que afecte a los estudiantes. Acá no medimos crecimiento: medimos estabilidad, consumo, errores y eficiencia.</p>
  </section>
  <form className="si-filters" method="get" action="/administrador">
   <input type="hidden" name="panel" value="ia"/>
   <div className="si-filter"><span className="si-lab">Período</span>
    <div className="si-seg">{([['1','24 h'],['7','7 días'],['14','14 días'],['30','30 días']] as const).map(([n,name])=>
      <button key={n} name="systemPeriod" value={n} type="submit" aria-pressed={Number(n)===days}
       className={Number(n)===days?'si-selected':''}>{name}</button>)}</div>
   </div>
   <span className="si-flex"/>
   <span className="si-tag">Un estado se marca correcto solo con una señal verificable</span>
   <span className="si-tag">Datos reales · Supabase</span>
  </form>
  <div className="si-board">
   <section className="si-section" aria-label="Estado general del sistema">
    <Title i="01" name="Estado general del sistema" description={'Resumen operativo · '+period.toLowerCase()+'.'}/>
    <div className="si-cells">{health.map(k=><div className="si-cell" key={k.label}>
     <div className="si-kpi-label"><span className="si-lab">{k.label}</span>
       <small className={'si-health-'+k.color}>● {k.status}</small></div>
     <strong className="si-num">{k.value}</strong>
     <span className="si-mono si-muted">{k.sub}</span></div>)}</div>
   </section>
   <section className="si-section" aria-label="Procesamiento de PDF y DOCX">
    <Title i="02" name="Procesamiento de PDF y DOCX" priority="Tasa de procesamiento exitoso"
      description="La generación de material es la puerta de entrada a casi todas las funciones."/>
    <div className="si-process-layout">
      <div className="si-process-table si-table">
       <div className="si-row si-head-row si-g1"><span>Indicador</span><span>Total</span><span>PDF</span><span>DOCX</span></div>
       {fields.map((f,i)=><div className="si-row si-g1" key={f.label}>
        <Name title={f.label} note={f.note}/>
        <span className="si-mono si-right">{processValue(f.key,undefined,i)}</span>
        <span className="si-mono si-right">{processValue(f.key,'PDF',i)}</span>
        <span className="si-mono si-right">{processValue(f.key,'DOCX',i)}</span>
       </div>)}
      </div>
      <div className="si-process-summary">
       <div className="si-process-rate"><span className="si-lab">Tasa de procesamiento exitoso</span>
         <strong className="si-num">{percent(ms.ready,totalProcess)}</strong>
         <Bar value={100*ms.ready/Math.max(1,totalProcess)} color="accent"/>
         <small>{totalProcess?nf(ms.ready)+' listos de '+nf(totalProcess)+' finalizados':'Sin resultados finalizados en este período'}</small></div>
       <div className="si-reasons"><h3>Motivos de fallo</h3>
         {reasons.length?reasons.map(x=><div className="si-reason" key={x.label}>
           <span>{x.label}</span><Bar value={100*x.n/maxReason} color="red"/>
           <span className="si-mono">{nf(x.n)}</span></div>):
           <p className="si-muted">Sin trabajos fallidos registrados.</p>}
         <small className="si-muted">Clasificación automática de errores. No se muestran mensajes privados.</small>
       </div>
      </div>
    </div>
   </section>
   <section className="si-section" aria-label="Consumo de inteligencia artificial">
    <Title i="03" name="Consumo de inteligencia artificial"
      description="Operaciones con uso de tokens registrado; el costo real requiere conciliación con el proveedor."/>
    <div className="si-cells si-ai-cells">{aiKpis.map(x=><div className="si-cell" key={x.label}>
      <span className="si-lab">{x.label}</span><strong className="si-num">{x.value}</strong>
      <span className="si-mono si-muted">{x.sub}</span></div>)}</div>
    <div className="si-ai-chart">
     <div className="si-chart-head"><h3>Consumo registrado · {period.toLowerCase()}</h3>
       <div className="si-seg">{([['tokens','Tokens'],['requests','Operaciones']] as const).map(([v,name])=>
        <button type="button" key={v} className={series===v?'si-selected':''}
         aria-pressed={series===v} onClick={()=>setSeries(v)}>{name}</button>)}</div></div>
     <div className="si-chart-plot">
      <svg viewBox="0 0 1000 230" preserveAspectRatio="none" role="img" aria-label={'Evolución diaria de '+series}>
       <path d="M0 20H1000 M0 80H1000 M0 140H1000 M0 200H1000" className="si-chart-guide"/>
       {plotted.some(v=>v[series]>0)&&<polyline points={points} className="si-chart-line"/>}
      </svg>
      {!plotted.some(v=>v[series]>0)&&<span className="si-chart-empty">Sin consumo registrado</span>}
     </div>
     <div className="si-chart-axis"><span>{plotted.length?day(plotted[0].d):'—'}</span>
      <span>{plotted.length?day(plotted[plotted.length-1].d):'—'}</span></div>
     <p className="si-muted si-chart-foot">Las operaciones sin token registrado no están cubiertas. No son cifras de facturación.</p>
    </div>
    <div className="si-ai-table si-table">
      <div className="si-chart-head"><h3>Funciones y operaciones instrumentadas</h3>
       <div className="si-seg">{([['requests','Operaciones'],['tokens','Tokens']] as const).map(([v,name])=>
        <button type="button" key={v} className={tableSort===v?'si-selected':''}
         aria-pressed={tableSort===v} onClick={()=>setTableSort(v)}>{name}</button>)}</div></div>
      <div className="si-row si-head-row si-g2"><span>Función</span><span>Solicitudes</span><span>Tokens</span><span>Costo USD</span><span>Errores IA</span></div>
      {aiFns.map(x=><div className="si-row si-g2" key={x.name}>
       <div className="si-function"><Name title={x.name} note={'Entrada '+nf(x.prompt_tokens)+' · salida '+nf(x.completion_tokens)}/>
         <Bar value={x.requests/maxAi*100} color="accent"/></div>
       <span className="si-right si-mono">{nf(x.requests)}</span>
       <span className="si-right si-mono">{nf(x.tokens)}</span>
       <span className="si-right si-mono si-muted">—</span>
       <span className="si-right si-mono si-muted">—</span>
      </div>)}
      {!aiFns.length&&<p className="si-muted">No hay operaciones de IA registradas.</p>}
      <p className="si-muted si-ai-caveat">Flashcards, prácticas y otras funciones no instrumentadas no se presentan como cero solicitudes ni cero costo: quedan fuera de la medición.</p>
    </div>
   </section>
   <section className="si-section" aria-label="Infraestructura">
    <Title i="04" name="Infraestructura: Supabase y Vercel"
      description="Cuánto usamos de la infraestructura y qué límites todavía requieren conexión con cada proveedor."/>
    <div className="si-infra-grid">{infra.map(c=><div className="si-infra-card" key={c.name}>
      <div className="si-infra-head"><h3>{c.name}</h3><span className="si-tag">{c.status}</span></div>
      {c.rows.map(([label,value,note])=><div className="si-infra-row" key={label}>
       <Name title={label} note={note}/><span className="si-mono">{value}</span></div>)}
     </div>)}</div>
     <div className="si-question"><span className="si-priority">Pregunta clave</span>
       <p>Los valores de almacenamiento son verificables, pero aún no disponemos de límites y cuotas contrastados de los planes conectados. No se puede afirmar qué recurso está cerca de agotarse.</p></div>
   </section>
   <section className="si-section" aria-label="Errores e incidencias">
    <Title i="05" name="Errores e incidencias"
      description={'Grupos de errores registrados · '+period.toLowerCase()+'. No equivalen a incidencias abiertas.'}/>
    <div className="si-table si-incidents">
      <div className="si-row si-head-row si-g3">
       <span>Incidencia</span><span>Gravedad</span><span>Fecha</span><span>Frecuencia</span><span>Estado</span><span>Acción</span></div>
      {data.incidents.map((x,i)=><div key={i}>
       <div className="si-row si-g3">
        <Name title={x.title} note={x.area}/>
        <span className="si-mono si-muted">{x.severity}</span>
        <span className="si-mono si-right">{moment(x.last_seen)}</span>
        <span className="si-mono si-right">{nf(x.occurrences)} veces</span>
        <span className="si-mono si-muted">{x.state}</span>
        <button className="si-bt" type="button" aria-expanded={expanded===String(i)}
          onClick={()=>setExpanded(expanded===String(i)?null:String(i))}>{expanded===String(i)?'Ocultar':'Ver detalle'}</button>
       </div>
       {expanded===String(i)&&<div className="si-incident-detail">
         Área: {x.area} · Primera vez: {moment(x.first_seen)} · Último registro: {moment(x.last_seen)}
         · {nf(x.occurrences)} observaciones. No se incluyen usuarios, mensajes brutos ni contenido de archivos.
        </div>}
      </div>)}
      {!data.incidents.length&&<p className="si-muted si-no-incidents">No hay errores observados en las fuentes instrumentadas durante este período. El estado global del sistema sigue sin verificar.</p>}
     </div>
   </section>
   <section className="si-section" aria-label="Rendimiento y oportunidades de optimización">
    <Title i="06" name="Rendimiento y optimización"
      description="Priorización técnica sin inventar tiempos de respuesta de pantallas que todavía no tienen trazas."/>
    <div className="si-table si-performance">
     <div className="si-row si-head-row si-g4"><span>#</span><span>Pantalla o proceso</span><span>Qué medimos</span>
       <span>P95</span><span>Consultas</span><span>Errores</span><span>Vs. anterior</span></div>
     {performance.map(p=><div className="si-row si-g4" key={p.ord}>
      <span className="si-mono si-muted">{p.ord.toString().padStart(2,'0')}</span>
      <Name title={p.name} note={p.hasP95? 'P95 de LCP de carga inicial · '+nf(p.lcp_samples)+' muestras' : 'LCP muestreado: '+nf(p.lcp_samples)+' de 20 muestras mínimas'}/>
      <span className="si-muted">{p.note}</span>
      <span className="si-right si-mono">{p.p95}</span><span className="si-right si-mono si-muted">—</span>
      <span className="si-right si-mono">{nf(p.errors)}</span><span className="si-right si-mono si-muted">—</span>
     </div>)}</div>
    <div className="si-opportunity"><span className="si-priority">Mayor oportunidad</span>
      <p>Instrumentar latencia y errores por ruta para identificar cuáles afectan más a los estudiantes. Hoy solo conocemos el tiempo de trabajos de procesamiento y errores de navegador, no el P95 real de todas las pantallas.</p></div>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · consulta agregada cacheada 15 minutos · acceso administrativo · los importes, límites de los proveedores y tiempos de pantalla sin medición aparecen como no disponibles.
  </footer>
 </main>;
}