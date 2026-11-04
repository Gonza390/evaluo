'use client';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import type { AdminHomeSnapshot } from './admin-home-actions';
import './admin-home.css';

const fmt = (n: number) => n.toLocaleString('es-AR');
const percent = (n: number, d: number) => d ? (n * 100 / d).toFixed(1).replace('.', ',') + '%' : '—';
const currency = (n: number, c: 'ARS' | 'USD') => new Intl.NumberFormat('es-AR',{style:'currency',currency:c,maximumFractionDigits:0}).format(n);
const navigation = [
  ['Tablero general','resumen'],['Usuarios y retención','usuarios'],['Adquisición y SEO','adquisicion'],
  ['Activación y recorrido','producto'],['Aprendizaje y prácticas','biblioteca'],
  ['Planes de estudio','planes'],['Monetización','monetizacion'],['Comunicaciones','mails'],
  ['Sistema e IA','ia'],['Gestión','gestion']
] as const;
type Item = {label:string; value:string; note:string; suffix?:string; highlight?:boolean};
function Points({values,ceiling}:{values:number[];ceiling:number}) {
  return values.map((v,i) => (i===0?'M':' L') +
    (values.length===1?500:(i*1000/(values.length-1))).toFixed(1) + ' ' +
    (220-200*v/ceiling).toFixed(1)).join('');
}
function Title({number,children,note}:{number:string;children:ReactNode;note?:string}) {
  return <div className="eh-section-head"><div className="eh-head-content"><span className="eh-index">{number}</span><h2>{children}</h2>{note&&<small>{note}</small>}</div></div>;
}
function StatRows({items}:{items:Item[]}) {
  return <div className="eh-stat-list">{items.map(item=><div className="eh-stat-row" key={item.label}>
    <div className="eh-stat-copy"><div className="eh-kicker">{item.label}</div><div className="eh-note">{item.note}</div></div>
    <div className="eh-stat-values"><strong className={item.highlight?'eh-green':''}>{item.value}</strong>{item.suffix&&<span>{item.suffix}</span>}</div>
  </div>)}</div>;
}
export function AdminHome({data,minDay}:{data:AdminHomeSnapshot;minDay:string}) {
  const [days,setDays]=useState<7|14|30>(14);
  const graph=useMemo(()=>{
    const selected=data.daily.slice(-2*days);
    const previous=selected.slice(0,days),current=selected.slice(-days);
    const currentValues=current.map(p=>p.active_users),previousValues=previous.map(p=>p.active_users);
    const max=Math.max(1,...currentValues,...previousValues)*1.1;
    const currentTotal=currentValues.reduce((n,v)=>n+v,0);
    const previousTotal=previousValues.reduce((n,v)=>n+v,0);
    const change=previousTotal?100*(currentTotal-previousTotal)/previousTotal:null;
    const path=Points({values:currentValues,ceiling:max});
    return {current,previous,currentTotal,previousTotal,change,
      path,previousPath:Points({values:previousValues,ceiling:max}),
      area:path+' L1000 220 L0 220 Z'};
  },[data.daily,days]);
  const users:Item[]=[
    {label:'Usuarios registrados',value:fmt(data.users.total),note:'Total histórico hasta la fecha seleccionada'},
    {label:'Nuevos usuarios',value:fmt(data.users.new_7d),note:'Registros de los últimos 7 días'},
    {label:'Usuarios activos',value:fmt(data.activity.active_7d),note:'Únicos con actividad · últimos 7 días'},
    {label:'Usuarios que estudiaron',value:fmt(data.study.studying_7d),note:'Aprendizaje registrado · últimos 7 días'},
  ];
  const academic:Item[]=[
    {label:'Materiales cargados y procesados correctamente',value:fmt(data.materials.ready_7d),suffix:'/ '+fmt(data.materials.uploaded_7d),note:'Materiales listos sobre los cargados · 7 días'},
    {label:'Prácticas completadas',value:fmt(data.practice.completed_7d),note:'Finalizaciones registradas · últimos 7 días'},
    {label:'Planes de estudio creados',value:fmt(data.plans.created_7d),note:'Planes personales guardados · últimos 7 días'}
  ];
  const retention:Item[]=[
    {label:'Tasa de activación',value:percent(data.activation.activated,data.users.new_7d),highlight:true,note:fmt(data.activation.activated)+' de '+fmt(data.users.new_7d)+' registros cargaron material'},
    {label:'Retención D7',value:percent(data.cohort.retained,data.cohort.cohort_users),note:fmt(data.cohort.retained)+' de '+fmt(data.cohort.cohort_users)+' elegibles estudiaron en D7'},
    {label:'Usuarios que volvieron a estudiar',value:fmt(data.study.returning_7d),note:'Estudiaron en los dos últimos períodos de 7 días'},
  ];
  const rev = currency(data.revenue.ars,'ARS')+(data.revenue.usd?' · '+currency(data.revenue.usd,'USD'):'');
  const money:Item[]=[
    {label:'Suscripciones Premium activas',value:data.day===data.today?fmt(data.premium.active):'—',note:data.day===data.today?'Estado vigente de suscripciones':'Sin snapshot histórico de suscripciones'},
    {label:'Ingresos cobrados',value:rev,note:'Pagos acreditados · últimos 7 días'},
  ];
  const alerts=[
    {title:'Errores de procesamiento de PDF/DOCX',note:fmt(data.materials.failed_7d)+' fallidos · '+fmt(data.materials.stuck_7d)+' en proceso +15 min',count:data.materials.failed_7d+data.materials.stuck_7d,href:'/administrador?panel=ia',link:'Ver en Sistema e IA'},
    {title:'Fallos de IA',note:'Todavía no existe un conteo fiable separado por proveedor',count:null,href:'/administrador?panel=ia',link:'Ver en Sistema e IA'},
    {title:'Problemas con pagos',note:'Intentos de checkout fallidos · últimos 7 días',count:data.payments.failed,href:'/administrador?panel=monetizacion',link:'Ver en Monetización'},
  ];
  const xLabels=graph.current.filter((_,i)=>i===0||i===days-1||i%Math.max(1,Math.floor(days/5))===0);
  return <main className="ehome">
    <header className="eh-header">
      <div className="eh-top">
        <span className="eh-logo">evaluo<span>.</span></span>
        <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
        <Link className="eh-primary-link" href="/administrador/solicitudes">Solicitudes universidades <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></Link></div>
      </div>
      <nav className="eh-tabs" aria-label="Paneles">{navigation.map(([label,panel],i)=><Link key={label} href={'/administrador?panel='+panel} prefetch={false} aria-current={i===0?'page':undefined} className={'eh-tab'+(i===0?' eh-active':'')}>{label}</Link>)}</nav>
    </header>
    <section className="eh-heading">
      <div><div className="eh-eyebrow">Evaluo / Tablero general</div><h1>Tablero general</h1><p>El estado de Evaluo en una sola pantalla. El detalle de cada área vive en su propio panel.</p></div>
      <label className="eh-date"><span>{data.day===data.today?'Hoy':'Fecha'}</span><input aria-label="Fecha del tablero" type="date" min={minDay} max={data.today} value={data.day} onChange={e=>{
        const date=e.target.value;
        if(date && date>=minDay && date<=data.today) window.location.assign('/administrador?panel=resumen&date='+encodeURIComponent(date));
      }}/></label>
    </section>
    <div className="eh-grid">
      <div className="eh-grid-row">
        <section className="eh-panel eh-half" aria-label="Usuarios"><Title number="01">Usuarios</Title><div className="eh-user-grid">{users.map(u=><div className="eh-user-card" key={u.label}><div className="eh-kicker">{u.label}</div><strong>{u.value}</strong><div className="eh-note">{u.note}</div></div>)}</div></section>
        <section className="eh-panel eh-half" aria-label="Actividad académica"><Title number="02">Actividad académica</Title><StatRows items={academic}/></section>
      </div>
      <div className="eh-grid-row">
        <section className="eh-panel eh-wide" aria-label="Evolución">
          <div className="eh-section-head eh-between"><div className="eh-head-content"><span className="eh-index">03</span><h2>Evolución</h2><small>Usuarios activos diarios · totales en usuario-días</small></div>
            <div className="eh-period" role="group" aria-label="Período">{([7,14,30] as const).map(v=><button type="button" key={v} aria-pressed={days===v} className={days===v?'eh-picked':''} onClick={()=>setDays(v)}>{v} días</button>)}</div>
          </div>
          <div className="eh-comparison">
            <div><span className="eh-subtitle"><i className="eh-line-current"/>Período actual · usuario-días</span><strong>{fmt(graph.currentTotal)}</strong></div>
            <div><span className="eh-subtitle"><i className="eh-line-prev"/>Período anterior · usuario-días</span><strong className="eh-muted">{fmt(graph.previousTotal)}</strong></div>
            <div><span className="eh-subtitle">Variación vs. los {days} días anteriores</span><strong className={graph.change===null?'eh-muted':graph.change<0?'eh-red':'eh-green'}>{graph.change===null?'—':(graph.change>=0?'+':'−')+Math.abs(graph.change).toFixed(1).replace('.', ',')+'%'}</strong></div>
          </div>
          <div className="eh-chart"><svg viewBox="0 0 1000 240" preserveAspectRatio="none" role="img" aria-label="Comparación de usuarios activos diarios reales">
            <path className="eh-chart-grid" d="M0 20H1000M0 80H1000M0 140H1000M0 200H1000"/><path className="eh-chart-base" d="M0 220H1000"/>
            <path className="eh-chart-area" d={graph.area}/><path className="eh-chart-previous" d={graph.previousPath}/><path className="eh-chart-current" d={graph.path}/>
          </svg><div className="eh-labels">{xLabels.map(p=><span key={p.d}>{p.d.slice(8,10)+'/'+p.d.slice(5,7)}</span>)}</div></div>
        </section>
        <section className="eh-panel eh-narrow" aria-label="Retención y activación"><Title number="04">Retención y activación</Title><StatRows items={retention}/></section>
      </div>
      <div className="eh-grid-row">
        <section className="eh-panel eh-narrow" aria-label="Monetización"><Title number="05">Monetización</Title><StatRows items={money}/></section>
        <section className="eh-panel eh-wide" aria-label="Alertas"><Title number="06" note="Lo que necesita atención ahora">Alertas</Title><div className="eh-stat-list">{alerts.map(a=>{
          const bad=a.count!==null&&a.count>0;
          return <div className="eh-alert-row" key={a.title}><span className={'eh-alert-dot'+(bad?' eh-bad':'')}/><div className="eh-alert-copy"><div>{a.title}</div><p>{a.note}</p></div>
          <span className={'eh-alert-status'+(bad?' eh-bad':'')}>{a.count===null?'Sin dato':bad?'Requiere atención':'Sin incidencias'}</span>
          <strong className={bad?'eh-red':''}>{a.count===null?'—':fmt(a.count)}</strong><Link href={a.href} prefetch={false}>{a.link} →</Link></div>;
        })}</div></section>
      </div>
    </div>
    <footer className="eh-footer">Fuente: Supabase · Valores reales agregados · Períodos en horario de Argentina · La retención D7 usa cohortes elegibles. Las prácticas incluyen las finalizaciones instrumentadas; no se estiman actividades no registradas.</footer>
  </main>;
}
