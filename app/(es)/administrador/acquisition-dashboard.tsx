'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AcquisitionRow, AcquisitionSnapshot } from './acquisition-dashboard-types';
import './admin-home.css';
import './acquisition-dashboard.css';

type Duration = 1 | 7 | 14 | 30 | 'custom';
type Channel = 'all' | 'google' | 'social' | 'facebook' | 'whatsapp' | 'reddit' | 'linkedin' | 'ai_referral' | 'unknown_direct' | 'other';
type PageType = 'all' | 'blog' | 'funciones' | 'guias' | 'pregunteros' | 'landing' | 'other';
const channels: Array<[Channel,string]> = [
 ['google','Google (fuente detectada)'],['social','Instagram y TikTok'],
 ['facebook','Facebook'],['whatsapp','WhatsApp'],['reddit','Reddit'],
 ['linkedin','LinkedIn'],['ai_referral','Referidos de IA'],['unknown_direct','Directo / sin atribución'],
 ['other','Otros referidos'],
];
const pageTypes: Array<[PageType,string]> = [
 ['all','Todas'],['blog','Blogs'],['funciones','Funciones'],
 ['guias','Guías universitarias'],['pregunteros','Pregunteros'],
 ['landing','Landings'],['other','Otras'],
];
const nav: Array<[string,string]> = [
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],['Adquisición y SEO','adquisicion'],
 ['Activación y recorrido','producto'],['Aprendizaje y prácticas','biblioteca'],
 ['Planes de estudio','planes'],['Monetización','monetizacion'],
 ['Comunicaciones','mails'],['Sistema e IA','ia'],['Gestión','gestion'],
];
const num = (v: number) => Math.round(v).toLocaleString('es-AR');
const ratio = (a: number,b: number) => b > 0 ? (a*100/b).toFixed(1).replace('.',',')+'%' : '—';
const addDays = (date:string,n:number) => {
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);
};
const total = (rows:AcquisitionRow[], key:keyof AcquisitionRow) =>
 rows.reduce((s,row)=>s+Number(row[key]||0),0);
type Group = { name:string; sessions:number;registered:number;activated:number;studied_sessions:number;utm_source?:string;utm_medium?:string };
function summarize(rows:AcquisitionRow[], key:(r:AcquisitionRow)=>string) {
 const m=new Map<string,Group>();
 for(const row of rows){const name=key(row)||'(sin identificar)';const v=m.get(name)??{name,sessions:0,registered:0,activated:0,studied_sessions:0,utm_source:row.utm_source,utm_medium:row.utm_medium};
  v.sessions+=row.sessions;v.registered+=row.registered;v.activated+=row.activated;v.studied_sessions+=row.studied_sessions;m.set(name,v);}
 return [...m.values()].sort((a,b)=>b.sessions-a.sessions||a.name.localeCompare(b.name));
}
function compare(curr:number,prev:number):{label:string;color:string}{
 if(!prev) return {label:curr?'Nuevo':'—',color:'#8B8B93'};
 const p=(curr-prev)*100/prev;
 return {label:(p>=0?'↑ ':'↓ ')+Math.abs(p).toFixed(1).replace('.',',')+'%',color:p>=0?'var(--accent)':'#FF5C4D'};
}
function Header({id,title,note,priority,tag}: {id:string;title:string;note?:string;priority?:boolean;tag?:string}) {
 return <div className="aq-sh"><span className="aq-idx">{id}</span><h2>{title}</h2>{priority&&<span className="aq-pri">Prioridad</span>}
   {tag&&<span className="aq-tag">{tag}</span>}{note&&<p>{note}</p>}</div>;
}
function Segmented<T extends string|number>({options,value,onChange,aria}:{
 options:Array<[T,string]>;value:T;onChange:(value:T)=>void;aria:string
}) {return <div className="aq-seg" role="group" aria-label={aria}>{options.map(([id,label])=>
 <button type="button" aria-pressed={value===id} className={value===id?'aq-selected':''} key={id}
 onClick={()=>onChange(id)}>{label}</button>)}</div>}
function TableRow({items,styleType='g1',heading=false}:{
 items:React.ReactNode[];styleType?:'g1'|'g2'|'g3';heading?:boolean
}) {return <div className={'aq-row '+styleType+(heading?' aq-head-row':'')}>{items.map((item,i)=><div key={i} className={i>0?'aq-right':''}>{item}</div>)}</div>}

export function AcquisitionDashboard({data}:{data:AcquisitionSnapshot}){
 const [duration,setDuration]=useState<Duration>(7);
 const [channel,setChannel]=useState<Channel>('all');
 const [pageType,setPageType]=useState<PageType>('all');
 const [campaign,setCampaign]=useState('all');
 const [device,setDevice]=useState('all');
 const [tableType,setTableType]=useState<PageType>('all');
 const [startCustom,setStartCustom]=useState(addDays(data.through,-6));
 const [endCustom,setEndCustom]=useState(data.through);
 const [showCustom,setShowCustom]=useState(false);
 const campaigns=useMemo(()=>[...new Set(data.rows.map(r=>r.campaign).filter(Boolean))].sort(),[data.rows]);
 const devices=useMemo(()=>[...new Set(data.rows.map(r=>r.device).filter(Boolean))].sort(),[data.rows]);
 const range = useMemo(()=>{
  if(duration==='custom' && startCustom>=data.from && endCustom<=data.through && startCustom<=endCustom &&
    (new Date(endCustom).getTime()-new Date(startCustom).getTime())/86400000<=29){
   const days=Math.round((new Date(endCustom).getTime()-new Date(startCustom).getTime())/86400000)+1;
   return {start:startCustom,end:endCustom,days};
  }
  const days=duration==='custom'?7:duration;
  return {start:addDays(data.through,1-days),end:data.through,days};
 },[duration,startCustom,endCustom,data.from,data.through]);
 const selection=useMemo(()=>data.rows.filter(r=>
   (channel==='all'||r.channel===channel) &&
   (pageType==='all'||r.page_type===pageType) &&
   (campaign==='all'||r.campaign===campaign) &&
   (device==='all'||r.device===device)
 ),[data.rows,channel,pageType,campaign,device]);
 const current=useMemo(()=>selection.filter(r=>r.d>=range.start&&r.d<=range.end),[selection,range]);
 const previous=useMemo(()=>selection.filter(r=>r.d>=addDays(range.start,-range.days)&&r.d<range.start),[selection,range]);
 const metrics=useMemo(()=>[
  {label:'Visitantes únicos',value:'—',note:'No hay identificador fiable para todas las visitas',tone:'#8B8B93'},
  {label:'Sesiones de entrada',value:num(total(current,'sessions')),note:compare(total(current,'sessions'),total(previous,'sessions')).label,tone:compare(total(current,'sessions'),total(previous,'sessions')).color},
  {label:'Registros atribuidos',value:num(total(current,'registered')),note:compare(total(current,'registered'),total(previous,'registered')).label,tone:compare(total(current,'registered'),total(previous,'registered')).color},
  {label:'Conversión a registro',value:ratio(total(current,'registered'),total(current,'sessions')),note:'Sobre sesiones de entrada',tone:'#8B8B93'},
  {label:'Registrados que estudiaron',value:num(total(current,'activated')),note:'Vinculados a sesión de registro y actividad',tone:'#8B8B93'},
 ],[current,previous]);
 const channelGroups=useMemo(()=>summarize(current,r=>r.channel),[current]);
 const pageGroups=useMemo(()=>summarize(current.filter(r=>tableType==='all'||r.page_type===tableType),r=>r.landing),[current,tableType]);
 const previousPages=useMemo(()=>new Map(summarize(previous,r=>r.landing).map(p=>[p.name,p.sessions])),[previous]);
 const campaignsData=useMemo(()=>summarize(current.filter(r=>!!r.campaign),r=>r.campaign+'|'+r.utm_source+' / '+r.utm_medium),[current]);
 const groupData=useMemo(()=>summarize(current.filter(r=>r.utm_content&&r.channel==='whatsapp'),r=>r.utm_content),[current]);
 const funnel=useMemo(()=>[
   {label:'Visitó una página de Evaluo',key:'sessions'},
   {label:'Hizo clic en comenzar o subir material',key:'clicks'},
   {label:'Inició el registro tras el clic',key:'step_signup_started'},
   {label:'Completó el registro',key:'step_registered'},
   {label:'Cargó su primer material en esa sesión',key:'step_uploaded'},
   {label:'Comenzó a estudiar',key:'step_studied'},
 ].map(x=>({label:x.label,count:total(current,x.key as keyof AcquisitionRow)})),[current]);
 const maxChannelConversion=Math.max(1,...channelGroups.map(x=>x.sessions?100*x.registered/x.sessions:0));
 const maxGroups=Math.max(1,...groupData.map(x=>x.sessions));
 const loss=useMemo(()=>{
  let worst=-1;
  for(let i=1;i<funnel.length;i++){if(funnel[i-1].count<=0)continue;
    const ratio=funnel[i].count/funnel[i-1].count;
    if(worst===-1 || ratio<funnel[worst].count/funnel[worst-1].count)worst=i;}
  return worst<0?null:{prev:funnel[worst-1].label,next:funnel[worst].label,percentage:ratio(funnel[worst].count,funnel[worst-1].count)};
 },[funnel]);
 const labelForPage=(r:Group)=>current.find(x=>x.landing===r.name)?.page_type??'other';
 return <main className="ehome aq-dashboard">
 <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
   <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
   <Link href="/administrador/solicitudes" className="eh-primary-link">Solicitudes universidades →</Link></div></div>
   <nav className="eh-tabs" aria-label="Paneles">{nav.map(([name,panel],i)=>
   <Link key={name} className={'eh-tab'+(i===2?' eh-active':'')} href={'/administrador?panel='+panel}
   aria-current={i===2?'page':undefined} prefetch={false}>{name}</Link>)}</nav></header>
 <section className="aq-intro"><div className="aq-lab">Evaluo / Adquisición y SEO</div><h1>Adquisición y SEO</h1>
 <p>De dónde llegan los estudiantes, qué páginas generan tráfico y qué canales consiguen usuarios que realmente estudian.</p></section>
 <div className="aq-filters" aria-label="Filtros generales">
  <div className="aq-filter-set"><span className="aq-lab">Período</span>
    <Segmented<Duration> aria="Período" value={duration} onChange={v=>{setDuration(v);setShowCustom(v==='custom')}}
    options={[[1,'Hoy'],[7,'7 días'],[14,'14 días'],[30,'30 días'],['custom','Personalizado']]}/></div>
  <label className="aq-select"><span className="aq-lab">País</span><select disabled aria-label="País, todavía sin medición fiable"><option>Sin dato fiable</option></select></label>
  <label className="aq-select"><span className="aq-lab">Canal</span><select value={channel} onChange={e=>setChannel(e.target.value as Channel)}>
  <option value="all">Todos</option>{channels.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
  <label className="aq-select"><span className="aq-lab">Tipo de página</span><select value={pageType} onChange={e=>setPageType(e.target.value as PageType)}>
  {pageTypes.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
  <label className="aq-select"><span className="aq-lab">Campaña</span><select value={campaign} onChange={e=>setCampaign(e.target.value)}>
  <option value="all">Todas</option>{campaigns.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
  <label className="aq-select"><span className="aq-lab">Dispositivo</span><select value={device} onChange={e=>setDevice(e.target.value)}>
  <option value="all">Todos</option>{devices.map(d=><option key={d} value={d}>{d==='desktop'?'Escritorio':d==='mobile'?'Móvil':d==='tablet'?'Tablet':d}</option>)}</select></label>
  <span className="aq-flex-spacer"/>
  <span className="aq-tag">Supabase · Datos reales</span>
  {showCustom&&<div className="aq-custom"><label>Desde <input aria-label="Fecha desde" type="date" value={startCustom} min={addDays(data.from,30)} max={data.through} onChange={e=>setStartCustom(e.target.value)}/></label>
  <label>Hasta <input aria-label="Fecha hasta" type="date" value={endCustom} min={data.from} max={data.through} onChange={e=>setEndCustom(e.target.value)}/></label>
  <span className="aq-dim">Hasta 30 días; los rangos fuera de cobertura usan 7 días</span></div>}
 </div>
 <div className="aq-board">
  <section className="aq-sec"><Header id="01" title="Resumen de adquisición" note={range.start+' al '+range.end+' · comparación con período anterior.'}/>
   <div className="aq-cells">{metrics.map(k=><div className="aq-cell" key={k.label}><span className="aq-lab">{k.label}</span>
   <div className="aq-num">{k.value}</div><span className="aq-note" style={{color:k.tone}}>{k.note}</span></div>)}</div></section>
  <section className="aq-sec"><Header id="02" title="Canales de adquisición" priority note="Qué canales traen registros y cuáles aportan estudiantes que usan Evaluo."/>
   <div className="aq-table"><TableRow heading items={['Canal','Visitas','Registros','Conversión','Empezaron a estudiar','% de registros']}/>
   {channels.map(([id,name])=>{const row=channelGroups.find(x=>x.name===id)??{name:id,sessions:0,registered:0,activated:0,studied_sessions:0};
   const conversion=row.sessions?100*row.registered/row.sessions:0;
   return <TableRow key={id} items={[
     <div className="aq-table-title" key="n"><strong>{name}</strong><small>{id==='unknown_direct'?'Fuente no identificada':'Sesiones atribuidas'}</small></div>,
     <span key="v">{num(row.sessions)}</span>,<span key="r">{num(row.registered)}</span>,
     <div key="cv" className="aq-withbar"><span className="aq-track"><i style={{width:(100*conversion/maxChannelConversion)+'%'}}/></span><span>{ratio(row.registered,row.sessions)}</span></div>,
     <span key="a">{num(row.activated)}</span>,
     <span key="p">{ratio(row.activated,row.registered)}</span>
   ]}/>})}
   </div></section>
  <section className="aq-sec"><Header id="03" title="Rendimiento SEO" tag="Search Console · integración pendiente" note="Métricas de búsqueda exclusivamente de Search Console, no estimadas desde sesiones."/>
   <div className="aq-seo-columns"><div className="aq-seo-left"><div className="aq-cells">{['Clics orgánicos','Impresiones','CTR promedio','Posición media'].map(name=>
    <div className="aq-cell aq-seo-cell" key={name}><span className="aq-lab">{name}</span><div className="aq-num">—</div>
    <span className="aq-note">Sin datos GSC conectados</span></div>)}</div>
    <div className="aq-seo-chart"><span className="aq-lab">Evolución del tráfico orgánico</span><div className="aq-seo-empty">
      <svg viewBox="0 0 1000 240" preserveAspectRatio="none" role="img" aria-label="Sin datos Search Console"><path d="M0 60H1000M0 120H1000M0 180H1000" className="aq-chart-grid"/></svg>
      <span>No hay métricas de Search Console disponibles</span></div></div></div>
    <div className="aq-seo-right">{['Páginas que más crecen','Páginas que más caen'].map(name=>
      <div key={name}><span className="aq-lab">{name}</span><p>Sin datos GSC comparables.</p></div>)}</div></div></section>
  <section className="aq-sec"><Header id="04" title="Rendimiento por página" priority note="Qué páginas traen estudiantes, no solo sesiones."/>
   <div className="aq-section-picker"><Segmented<PageType> aria="Tipo de página" value={tableType} onChange={setTableType} options={pageTypes}/></div>
   <div className="aq-table"><TableRow styleType="g2" heading items={['Página · URL de entrada','Visitas','Registros','Conversión','Activación','Tendencia']}/>
   {pageGroups.slice(0,20).map(p=>{const trend=compare(p.sessions,previousPages.get(p.name)??0);
     return <TableRow key={p.name} styleType="g2" items={[
      <div className="aq-table-title" key="path"><strong className="aq-path">{p.name}</strong><small>{pageTypes.find(t=>t[0]===labelForPage(p))?.[1]??'Otra'}</small></div>,
      <span key="s">{num(p.sessions)}</span>,<span key="r">{num(p.registered)}</span>,
      <span key="c">{ratio(p.registered,p.sessions)}</span>,
      <span key="a">{ratio(p.activated,p.registered)}</span>,
      <span key="t" style={{color:trend.color}}>{trend.label}</span>
     ]}/>})}
   {!pageGroups.length&&<p className="aq-none">No hay entradas registradas con estos filtros.</p>}</div></section>
  <section className="aq-sec"><Header id="05" title="Embudo de adquisición" note="Recorrido instrumentado dentro de una misma sesión; no representa usuarios únicos."/>
    <div className="aq-funnel">{funnel.map((f,i)=><div className="aq-funnel-row" key={f.label}>
      <div className="aq-funnel-label"><span>{String(i+1).padStart(2,'0')}</span><strong>{f.label}</strong></div>
      <div className="aq-funnel-bar"><i style={{width:total(current,'sessions')?Math.max(f.count?1.5:0,100*f.count/total(current,'sessions'))+'%':'0%',
       background:i===5?'var(--accent)':'#566D23'}}/></div>
      <span className="aq-funnel-number">{num(f.count)}</span><span className="aq-funnel-rate">{i===0?'100%':ratio(f.count,funnel[i-1].count)}</span>
    </div>)}</div>
    <div className="aq-leak"><span className="aq-pri aq-red-tag">Mayor fuga</span>
      <span>{loss?'Entre «'+loss.prev.toLowerCase()+'» y «'+loss.next.toLowerCase()+'» avanza el '+loss.percentage+'.':'No hay suficientes datos para calcular la caída.'}</span></div>
    <p className="aq-explanation">Las etapas posteriores requieren las señales anteriores en la misma sesión. Las acciones fuera de esa sesión no se inventan ni se atribuyen automáticamente.</p>
  </section>
  <section className="aq-sec"><Header id="06" title="Campañas y enlaces" note="UTM y enlaces universitarios con etiquetas verificables."/>
    <div className="aq-campaign-layout"><div className="aq-campaign-left"><div className="aq-table aq-compact">
      <TableRow styleType="g3" heading items={['Campaña · fuente / medio','Visitas','Registros','Conversión','Estudiaron']}/>
      {campaignsData.slice(0,15).map(c=><TableRow styleType="g3" key={c.name} items={[
       <div className="aq-table-title" key="n"><strong>{c.name.split('|')[0]}</strong><small>{c.name.split('|')[1]}</small></div>,
       <span key="v">{num(c.sessions)}</span>,<span key="r">{num(c.registered)}</span>,
       <span key="c">{ratio(c.registered,c.sessions)}</span>,<span key="a">{num(c.activated)}</span>
      ]}/>)}
      {!campaignsData.length&&<p className="aq-none">No se registraron campañas UTM para el filtro seleccionado.</p>}
    </div></div><div className="aq-campaign-right"><span className="aq-lab">Registros desde grupos universitarios</span>
      {groupData.slice(0,8).map(g=><div className="aq-group" key={g.name}><div><span>{g.name}</span><span>{num(g.registered)}</span></div>
        <div className="aq-track"><i style={{width:100*g.sessions/maxGroups+'%'}}/></div></div>)}
      {!groupData.length&&<p className="aq-none">No hay grupos de WhatsApp identificados mediante UTM content.</p>}
    </div></div></section>
 </div>
 <footer className="eh-footer">Fuente: eventos de adquisición de Supabase · una entrada por sesión · atribución por UTM/referrer cuando existe · sin identificación de visitantes únicos ni métricas GSC · los cambios de filtros no vuelven a consultar Supabase.</footer>
 </main>;
}
