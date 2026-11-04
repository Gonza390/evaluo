'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import type { RetentionFilters, UserDetail, UserListResult, UsersRetentionSnapshot, UsersSegment } from './users-retention-types';
import './admin-home.css';
import './users-retention.css';

const nf = (v:number) => Number(v||0).toLocaleString('es-AR');
const pct = (a:number,b:number) => b > 0 ? (100*a/b).toFixed(1).replace('.',',')+'%' : '—';
const stamp = (v:string|null|undefined) => v ? new Date(v).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
const nav = [
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],['Adquisición y SEO','adquisicion'],
 ['Activación y recorrido','producto'],['Aprendizaje y prácticas','biblioteca'],
 ['Planes de estudio','planes'],['Monetización','referidos'],['Comunicaciones','mails'],
 ['Sistema e IA','ia'],['Gestión','usuarios'],
] as const;
type Props = {
 stats:UsersRetentionSnapshot;segments:UsersSegment[];list:UserListResult;detail:UserDetail|null;
 filters:Omit<RetentionFilters,'selectedUserId'>;today:string;minDay:string;
};
function Heading({index,title,subtitle,priority}:{index:string;title:string;subtitle?:string;priority?:boolean}) {
 return <div className="eh-section-head ur-heading"><div className="eh-head-content">
   <span className="eh-index">{index}</span><h2>{title}</h2>{subtitle&&<small>{subtitle}</small>}
   {priority&&<span className="ur-priority">Prioridad</span>}
 </div></div>;
}
function Metric({label,value,note,sub}: {label:string;value:string;note:string;sub?:ReactNode}) {
 return <div className="ur-metric"><span className="eh-kicker">{label}</span>
   <strong>{value}</strong><span className="eh-note">{note}</span>{sub&&<div className="ur-metric-sub">{sub}</div>}
 </div>;
}
function Chart({values,prev}:{values:number[];prev:number[]}) {
 const peak=Math.max(1,...values,...prev);
 const points=(a:number[])=>a.map((v,i)=>(i?'L':'M')+(a.length>1?i*1000/(a.length-1):0).toFixed(1)+' '+(210-190*v/peak).toFixed(1)).join(' ');
 const cur=points(values);const old=points(prev);
 return <svg viewBox="0 0 1000 225" role="img" aria-label="Evolución diaria real de estudiantes activos" preserveAspectRatio="none">
    <path d="M0 20 H1000 M0 83 H1000 M0 147 H1000 M0 210 H1000" className="eh-chart-grid"/>
    {values.length>1&&<path d={cur+' L1000 210 L0 210 Z'} className="eh-chart-area"/>}
    {prev.length>1&&<path d={old} className="eh-chart-previous"/>}
    {values.length>1&&<path d={cur} className="eh-chart-current"/>}
 </svg>;
}
function ratioBar(part:number,total:number) {
 return <div className="ur-progress-track" aria-hidden="true"><span style={{width:total>0?Math.min(100,100*part/total)+'%':'0%'}}/></div>;
}
function userStatus(row:UserListResult['rows'][number],today:string) {
 const cutoff=new Date(today+'T12:00:00Z').getTime();
 const last=row.last_activity ? new Date(row.last_activity).getTime() : 0;
 if(new Date(row.created_at).getTime()>=cutoff-7*86400000) return 'Nuevo';
 if(last>=cutoff-7*86400000) return 'Activo';
 return 'Inactivo';
}
function Detail({person,back}:{person:UserDetail;back:string}) {
 return <div className="ur-detail-shade"><section className="ur-detail" role="dialog" aria-modal="true" aria-labelledby="ur-detail-title">
  <div className="ur-detail-top"><div><span className="eh-eyebrow">Ficha del estudiante</span><h2 id="ur-detail-title">{person.name}</h2><p>{person.email}</p></div>
  <Link href={back} className="ur-close" aria-label="Cerrar detalle">×</Link></div>
  <div className="ur-detail-meta"><span>{person.plan}</span><span>{person.university}</span><span>{person.career}</span></div>
  <div className="ur-detail-body">
    <section><h3>Recorrido</h3><div className="ur-event"><span>Registro</span><strong>{stamp(person.registered_at)}</strong></div>
      <div className="ur-event"><span>Primeras respuestas registradas</span><strong>{stamp(person.first_practice)}</strong></div>
      <div className="ur-event"><span>Última actividad registrada</span><strong>{stamp(person.last_activity)}</strong></div></section>
    <section><h3>Materiales · {nf(person.materials_total)}</h3>
      {person.materials.length?person.materials.map(m=><div className="ur-event" key={m.id}>
      <span>{m.title || m.file_name}</span><strong>{m.processing_status}</strong></div>):
      <p className="eh-note">Todavía no cargó materiales.</p>}
      {person.materials_total>person.materials.length&&<p className="eh-note">Mostrando los últimos {person.materials.length} materiales.</p>}</section>
    <section><h3>Prácticas</h3><div className="ur-event"><span>Sesiones de modalidades nuevas</span><strong>{nf(person.practice_sessions)}</strong></div>
      <div className="ur-event"><span>Respuestas individuales registradas</span><strong>{nf(person.answered_questions)}</strong></div></section>
    <section><h3>Plan de estudio</h3>{person.study_plan?<div className="ur-event"><span>{nf(person.study_plan.planned_days)} días planificados · {person.study_plan.daily_minutes} min/día</span><strong>Examen: {person.study_plan.exam_date}</strong></div>:
      <p className="eh-note">No tiene un plan personal guardado.</p>}</section>
  </div></section></div>;
}
export function UsersRetentionDashboard({stats,segments,list,detail,filters,today,minDay}:Props) {
 const [dimension,setDimension]=useState<'university'|'country'|'plan'|'materials'>('university');
 const [showCustom,setShowCustom]=useState(Boolean(filters.from&&filters.to));
 const q=(values:Record<string,string|number|null|undefined>={})=>{
  const params=new URLSearchParams({panel:'usuarios',period:String(filters.period),usersPage:String(filters.page),
   usersSearch:filters.search,usersPlan:filters.plan,usersMaterials:filters.materials,
   usersCountry:filters.country,usersUniversity:filters.university});
  if(filters.from&&filters.to){params.set('from',filters.from);params.set('to',filters.to)}
  for(const [k,v] of Object.entries(values)){if(v===null||v===undefined||v===''){params.delete(k)}else params.set(k,String(v))}
  return '/administrador?'+params.toString();
 };
 const comparison=stats.previous.prev_new ? (stats.totals.new_users-stats.previous.prev_new)/stats.previous.prev_new*100 : null;
 const freq=stats.frequency;
 const sumFreq=freq.once+freq.two_three+freq.four_plus;
 const byDim=segments.filter(s=>s.dimension===dimension).slice(0,30);
 const countries=segments.filter(s=>s.dimension==='country').map(s=>s.name);
 const universities=segments.filter(s=>s.dimension==='university').map(s=>s.name);
 const current=stats.daily.slice(-filters.period);
 const prev=stats.daily.slice(-2*filters.period,-filters.period);
 const values=current.map(d=>d.active_users),prevValues=prev.map(d=>d.active_users);
 const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
 const prevMean=prevValues.length?prevValues.reduce((a,b)=>a+b,0)/prevValues.length:null;
 const peak=values.length?Math.max(...values):0;
 const listBase=q({userId:null});
 const totalPages=Math.max(1,Math.ceil(list.total/list.page_size));
 return <main className="ehome ur-dashboard">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
    <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
      <Link href="/administrador/solicitudes" className="eh-primary-link">Solicitudes universidades →</Link></div></div>
    <nav className="eh-tabs" aria-label="Paneles">{nav.map(([label,panel],i)=>
      <Link href={'/administrador?panel='+panel} key={label} prefetch={false} className={'eh-tab'+(i===1?' eh-active':'')} aria-current={i===1?'page':undefined}>{label}</Link>)}</nav></header>
  <section className="eh-heading"><div><div className="eh-eyebrow">Evaluo / Usuarios y retención</div>
    <h1>Usuarios y retención</h1><p>Quiénes usan Evaluo, con qué frecuencia estudian, cuántos regresan y dónde estamos perdiendo estudiantes.</p></div></section>
  <section className="ur-filter-strip" aria-label="Filtros generales"><span className="eh-kicker">Período</span>
   <div className="eh-period">{[{n:1,label:'Hoy'},{n:7,label:'7 días'},{n:14,label:'14 días'},{n:30,label:'30 días'}].map(k=>
     <Link key={k.n} aria-current={!filters.from&&filters.period===k.n?'true':undefined}
       className={!filters.from&&filters.period===k.n?'eh-picked':''}
       href={q({period:k.n,from:null,to:null,usersPage:1})}>{k.label}</Link>)}
     <button className={showCustom?'eh-picked':''} onClick={()=>setShowCustom(v=>!v)} type="button">Personalizado</button></div>
    {showCustom&&<form className="ur-custom" action="/administrador">
      <input type="hidden" name="panel" value="usuarios"/><input type="hidden" name="period" value="7"/>
      <input type="date" name="from" aria-label="Desde" defaultValue={filters.from??''} min={minDay} max={today} required/>
      <span>→</span><input type="date" name="to" aria-label="Hasta" defaultValue={filters.to??today} min={minDay} max={today} required/>
      <button type="submit">Aplicar</button><small>Máximo 30 días · historial de 90 días</small></form>}
    <span className="ur-live-label">Datos de Supabase</span>
  </section>
  <div className="eh-grid">
   <section className="eh-panel"><Heading index="01" title="Resumen de usuarios" subtitle="Actividad del período seleccionado"/>
     <div className="ur-metrics">
       <Metric label="Usuarios registrados" value={nf(stats.totals.registered)} note="Total histórico"/>
       <Metric label="Nuevos usuarios" value={nf(stats.totals.new_users)}
         note={'vs. '+nf(stats.previous.prev_new)+' del período anterior'}
         sub={comparison===null?'Sin referencia anterior':(comparison>=0?'+':'')+comparison.toFixed(1).replace('.',',')+'%'}/>
       <div className="ur-metric ur-active-tile"><span className="eh-kicker">Usuarios activos</span><div className="ur-dau">
         {[['DAU',stats.totals.dau],['WAU',stats.totals.wau],['MAU',stats.totals.mau]].map(([label,value])=>
           <div key={label}><span>{label}</span><strong>{nf(Number(value))}</strong></div>)}</div>
         <span className="eh-note">Únicos en ventanas de 1, 7 y 30 días hasta {stats.today}</span></div>
       <Metric label="Usuarios que estudiaron" value={nf(stats.totals.studied_users)} note="Con actividad pedagógica registrada"/>
       <div className="ur-metric"><span className="eh-kicker">Planes de usuario</span>
         <div className="ur-plan-split"><div><strong>{nf(stats.plan_distribution.free_users)}</strong><span>Free</span></div><div><strong>{nf(stats.plan_distribution.premium_users)}</strong><span>Premium</span></div></div>
         <span className="eh-note">Estados actuales en suscripciones</span></div>
     </div></section>
   <section className="eh-panel"><Heading index="02" title="Retención de usuarios" subtitle="Por día desde el registro"/>
     <div className="ur-retention-cards">{(['d1','d7','d30'] as const).map((key,i)=>{
       const item=stats.retention[key]??{returned:0,eligible:0};
       return <div className="ur-ret-card" key={key}><div className="ur-metric-label">{'Retención '+key.toUpperCase()}{i===1&&<span className="ur-priority">Prioridad</span>}</div>
       <strong>{pct(item.returned,item.eligible)}</strong><div className="eh-note">{nf(item.returned)} de {nf(item.eligible)} usuarios elegibles estudiaron ese día</div>
       {ratioBar(item.returned,item.eligible)}</div>;
     })}</div>
     <div className="ur-subpanel"><div className="ur-subhead"><h3>Cohortes por semana de registro</h3><span>% de usuarios elegibles que volvieron</span></div>
       <div className="ur-table-scroll"><table className="ur-table"><thead><tr><th>Semana de registro</th><th>Usuarios</th><th>D1</th><th>D7</th><th>D30</th></tr></thead>
         <tbody>{stats.cohorts.map(co=><tr key={co.week}><td>{co.week}</td><td>{nf(co.users)}</td>
          <td>{pct(co.d1_returned,co.d1_eligible)}</td><td>{pct(co.d7_returned,co.d7_eligible)}</td><td>{pct(co.d30_returned,co.d30_eligible)}</td></tr>)}</tbody></table></div>
       <p className="eh-note">Una cohorte solo cuenta para D1, D7 o D30 cuando transcurrieron los días necesarios. La retención exige una actividad de estudio registrada.</p>
     </div></section>
   <div className="eh-grid-row">
     <section className="eh-panel eh-narrow"><Heading index="03" title="Frecuencia de uso" subtitle="Últimos 7 días" priority/>
       <div className="ur-frequency"><strong>{Number(freq.avg_study_days??0).toFixed(1).replace('.',',')}</strong>
         <span className="eh-note">días de estudio por estudiante con actividad</span>
         {[{label:'1 día',n:freq.once},{label:'2–3 días',n:freq.two_three},{label:'4 o más días',n:freq.four_plus}].map(x=>
           <div className="ur-freq-row" key={x.label}><div><span>{x.label}</span><strong>{nf(x.n)} · {pct(x.n,sumFreq)}</strong></div>{ratioBar(x.n,sumFreq)}</div>)}
       </div></section>
     <section className="eh-panel eh-wide"><Heading index=" " title="Estudiantes activos por día" subtitle="Evolución y período anterior"/>
       <div className="ur-chart-stats"><div><span>Promedio diario</span><strong>{mean.toFixed(1).replace('.',',')}</strong></div>
         <div><span>Pico del período</span><strong>{nf(peak)}</strong></div>
         <div><span>Promedio anterior</span><strong>{prevMean===null?'—':prevMean.toFixed(1).replace('.',',')}</strong></div></div>
       <div className="ur-chart"><Chart values={values} prev={prevValues}/><div className="eh-labels">
         <span>{current[0]?.d?.slice(5)??'—'}</span><span>{current.at(-1)?.d?.slice(5)??'—'}</span></div></div>
     </section></div>
   <section className="eh-panel"><Heading index="04" title="Abandono e inactividad" subtitle="Dónde estamos perdiendo estudiantes"/>
     <div className="ur-abandon">
       <div className="ur-abandon-card"><span className="eh-kicker">Se registraron y nunca estudiaron</span>
         <strong>{nf(stats.abandonment.new_no_study)}</strong>
         <p>Sin evidencia de estudio en los últimos 92 días · nuevos del período</p></div>
       <div className="ur-abandon-card"><span className="eh-kicker">Estudiaron un solo día y no volvieron</span>
         <strong>{nf(stats.abandonment.once_then_left)}</strong>
         <p>Una fecha de estudio registrada, sin estudio reciente</p></div>
       <div className="ur-abandon-card"><span className="eh-kicker">Usuarios recuperados</span>
         <strong>{nf(stats.abandonment.reactivated)}</strong>
         <p>Volvieron tras al menos 7 días de inactividad</p></div>
       <div className="ur-abandon-card ur-inactive"><span className="eh-kicker">Usuarios sin actividad</span>
         {[['Más de 7 días',stats.abandonment.inactive_7],['Más de 14 días',stats.abandonment.inactive_14],['Más de 30 días',stats.abandonment.inactive_30]].map(([label,n])=>
         <div key={label}><div className="ur-between"><span>{label}</span><strong>{nf(Number(n))}</strong></div>{ratioBar(Number(n),stats.totals.registered)}</div>)}
       </div>
     </div></section>
   <section className="eh-panel"><Heading index="05" title="Segmentación de estudiantes" subtitle="Filtrá y compará los indicadores por segmento"/>
     <form action="/administrador" className="ur-seg-filters">
       <input type="hidden" name="panel" value="usuarios"/><input type="hidden" name="period" value={filters.period}/>
       {filters.from&&filters.to&&<><input type="hidden" name="from" value={filters.from}/><input type="hidden" name="to" value={filters.to}/></>}
       <label>Universidad<select name="usersUniversity" defaultValue={filters.university}><option value="all">Todas</option>{universities.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
       <label>País<select name="usersCountry" defaultValue={filters.country}><option value="all">Todos</option>{countries.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
       <label>Plan<select name="usersPlan" defaultValue={filters.plan}><option value="all">Todos</option><option value="free">Free</option><option value="premium">Premium</option></select></label>
       <label>Materiales<select name="usersMaterials" defaultValue={filters.materials}><option value="all">Todos</option><option value="yes">Con materiales</option><option value="no">Sin materiales</option></select></label>
       <button type="submit">Filtrar listado</button>
     </form>
     <div className="ur-subpanel"><div className="ur-subhead"><h3>Comparar por</h3>
        <div className="eh-period">{([{key:'university',label:'Universidad'},{key:'country',label:'País'},{key:'plan',label:'Plan'},{key:'materials',label:'Materiales'}] as const).map(k=>
          <button type="button" aria-pressed={dimension===k.key} className={dimension===k.key?'eh-picked':''}
            onClick={()=>setDimension(k.key)} key={k.key}>{k.label}</button>)}</div></div>
       <div className="ur-table-scroll"><table className="ur-table"><thead><tr><th>Segmento</th><th>Usuarios</th><th>Nuevos</th><th>Activos</th><th>Estudiaron</th></tr></thead>
         <tbody>{byDim.map(s=><tr key={s.dimension+s.name}><td>{s.name}</td><td>{nf(s.users)}</td><td>{nf(s.nuevos)}</td><td>{nf(s.activos)}</td><td>{nf(s.estudiaron)}</td></tr>)}</tbody></table></div>
       <p className="eh-note">Comparación de segmentos: últimos 30 días. Los filtros superiores se aplican al listado de estudiantes, no a estas cifras agrupadas.</p>
     </div></section>
   <section className="eh-panel"><Heading index="06" title="Listado de usuarios" subtitle="Seleccioná un usuario para abrir su detalle"/>
     <form action="/administrador" className="ur-searchbar"><input type="hidden" name="panel" value="usuarios"/>
       <input type="hidden" name="period" value={filters.period}/><input type="hidden" name="usersPlan" value={filters.plan}/>
       {filters.from&&filters.to&&<><input type="hidden" name="from" value={filters.from}/><input type="hidden" name="to" value={filters.to}/></>}
       <input type="hidden" name="usersMaterials" value={filters.materials}/><input type="hidden" name="usersCountry" value={filters.country}/>
       <input type="hidden" name="usersUniversity" value={filters.university}/>
       <input type="search" name="usersSearch" defaultValue={filters.search} placeholder="Buscar por nombre o correo" aria-label="Buscar usuarios"/>
       <button type="submit">Buscar</button></form>
     <div className="ur-table-scroll"><table className="ur-table ur-users-table"><thead><tr>
       <th>Usuario</th><th>Registro</th><th>Plan</th><th>Universidad</th><th>Materiales</th><th>Última actividad</th><th>Estado</th><th>Actividad académica</th></tr></thead>
       <tbody>{list.rows.map(u=><tr key={u.id}>
         <td><Link className="ur-userlink" href={q({userId:u.id})}><strong>{u.name}</strong><span>{u.email??'—'}</span></Link></td>
         <td>{stamp(u.created_at)}</td><td className={u.plan==='Premium'?'eh-green':''}>{u.plan}</td>
         <td><strong className="ur-small">{u.university}</strong><span className="ur-sub">{u.career}</span></td>
         <td>{nf(u.materials)}</td><td>{stamp(u.last_activity)}</td><td><span className={'ur-state '+userStatus(u,today).toLowerCase()}>{userStatus(u,today)}</span></td>
         <td>{u.studied?'Actividad registrada':'Sin evidencia registrada'}</td>
       </tr>)}</tbody></table></div>
     <div className="ur-pagination"><span>Mostrando {list.rows.length} de {nf(list.total)} usuarios · Página {list.page} de {totalPages}</span>
       <div><Link aria-disabled={list.page<=1} className={list.page<=1?'ur-disabled':''} href={q({usersPage:Math.max(1,list.page-1),userId:null})}>Anterior</Link>
       <Link aria-disabled={list.page>=totalPages} className={list.page>=totalPages?'ur-disabled':''} href={q({usersPage:Math.min(totalPages,list.page+1),userId:null})}>Siguiente</Link></div></div>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · Usuarios administrativos excluidos · Actividad pedagógica registrada · Retención por cohortes elegibles · Los detalles se consultan al abrir un estudiante.</footer>
  {detail&&<Detail person={detail} back={listBase}/>}
 </main>;
}
