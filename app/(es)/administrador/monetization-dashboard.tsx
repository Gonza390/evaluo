'use client';

import Link from 'next/link';
import {useMemo,useState,type ReactNode} from 'react';
import type {MonetizationSnapshot,MonetizationFilters} from './monetization-dashboard-types';
import './admin-home.css';
import './monetization-dashboard.css';

const nav:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],
 ['Adquisición y SEO','adquisicion'],['Activación y recorrido','producto'],
 ['Aprendizaje y prácticas','biblioteca'],['Planes de estudio','planes'],
 ['Monetización','monetizacion'],['Comunicaciones','mails'],
 ['Sistema e IA','ia'],['Gestión','usuarios'],
];
const number=(n:number|null|undefined)=>n===undefined||n===null?'—':Math.round(n).toLocaleString('es-AR');
const money=(n:number|null|undefined)=>n===undefined||n===null?'—':new Intl.NumberFormat('es-AR',{
  style:'currency',currency:'ARS',maximumFractionDigits:0,
}).format(n);
const pct=(a:number,b:number)=>b>0?(a/b*100).toFixed(1).replace('.',',')+'%':'—';
const moneyPct=(a:number,b:number)=>b>0?(Math.abs(a-b)*100/b).toFixed(1).replace('.',',')+'%':'—';
const sign=(a:number,b:number)=>b>0?((a>=b?'↑ ':'↓ ')+moneyPct(a,b)):'—';
const detailFor=(d:string)=>new Date(d+'T12:00:00Z').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',timeZone:'UTC'});
const sliceDate=(d:string,kind:'day'|'week'|'month')=>{
 if(kind==='day')return d;
 if(kind==='month')return d.slice(0,7)+'-01';
 const dt=new Date(d+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()-((dt.getUTCDay()+6)%7));
 return dt.toISOString().slice(0,10);
};
const clamp=(x:number)=>Math.min(100,Math.max(0,x));

function Section({id,title,note,priority=false}:{id:string;title:string;note:string;priority?:boolean}){
 return <div className="mo-head"><span className="mo-idx">{id}</span><h2>{title}</h2>
  {priority&&<span className="mo-pri">Prioridad</span>}<p>{note}</p></div>;
}
function Bar({percent,light=false}:{percent:number;light?:boolean}) {
 return <div className="mo-bar"><i style={{width:clamp(percent)+'%',background:light?'var(--accent)':'#566D23'}}/></div>;
}
function Tile({title,value,sub,footer,large=false,priority=false}:{title:string;value:string;sub:string;footer?:string;large?:boolean;priority?:boolean}){
 return <div className={'mo-tile'+(large?' mo-large':'')}>
  <div className="mo-tile-label"><span>{title}</span>{priority&&<span className="mo-pri">Prioridad</span>}</div>
  <strong>{value}</strong><span className="mo-tile-sub">{sub}</span>
  {footer&&<span className="mo-tile-foot">{footer}</span>}
 </div>;
}
function Table({head,rows,layout,empty='Sin datos verificables para estos filtros.'}:{
 head:string[];rows:ReactNode[][];layout:'providers'|'segments';empty?:string
}){
 return <div className="mo-scroll"><div className={'mo-row mo-row-head mo-'+layout}>{head.map((x,i)=>
   <div key={i} className={i>0?'mo-right':''}>{x}</div>)}</div>
   {rows.length?rows.map((row,i)=><div key={i} className={'mo-row mo-'+layout}>{row.map((v,k)=>
     <div key={k} className={k>0&&k<row.length-1?'mo-right':''}>{v}</div>)}</div>):
     <p className="mo-empty">{empty}</p>}
 </div>;
}
function Name({title,note}:{title:string;note:string}){
 return <div className="mo-name"><strong>{title}</strong><small>{note}</small></div>;
}
type Props={snapshot:MonetizationSnapshot;filters:MonetizationFilters;today:string;earliest:string};
type Dimension='university'|'career'|'country'|'source'|'provider';
type Granularity='day'|'week'|'month';
export function MonetizationDashboard({snapshot,filters,today,earliest}:Props){
 const [period,setPeriod]=useState<MonetizationFilters['period']>(filters.period);
 const [from,setFrom]=useState(filters.from??'');
 const [to,setTo]=useState(filters.to??today);
 const [currency,setCurrency]=useState<'ARS'|'USD'>('ARS');
 const [granularity,setGranularity]=useState<Granularity>('day');
 const [segment,setSegment]=useState<Dimension>('university');
 const fin=snapshot.financial,co=snapshot.checkout,subscriptions=snapshot.subscriptions;
 const filteredStatus=filters.state!=='all';
 const scopedProvider=filters.provider!=='all';
 const scopedBase=filteredStatus||scopedProvider;
 const canConv=!scopedBase&&fin.registered>0;
 const conversion=canConv?pct(fin.active_premium,fin.registered):'—';
 const periodText=snapshot.from+' al '+snapshot.through;
 const revenue=currency==='ARS'?money(fin.revenue_ars):'—';
 const prevRevenue=currency==='ARS'?money(fin.previous_ars):'—';
 const revChange=currency!=='ARS'?'Sin importe USD validado':!fin.previous_ars?
   (fin.revenue_ars?'Sin base de ingresos anterior':'Sin ingresos cobrados en ambos períodos'):
   sign(fin.revenue_ars,fin.previous_ars)+' vs. período anterior';
 const activeShare=canConv?pct(fin.active_premium,fin.registered):'—';
 const activeSub=fin.active_premium;
 const arppu=fin.paying_users?money(fin.revenue_ars/fin.paying_users):'—';
 const checkoutToPaid='—';
 const totalSubs=subscriptions.active+subscriptions.pending+subscriptions.expired+subscriptions.canceled;
 const financeTiles=[
  {title:'Ingresos efectivamente cobrados',value:revenue,sub:revChange,footer:'Solo transacciones aprobadas y con fecha de cobro',large:true,priority:true},
  {title:'Conversión Free → Premium',value:conversion,sub:scopedBase?'No comparable con proveedor/estado filtrado':'Premium activo sobre registrados',footer:'Estado Premium actual; no es una cohorte histórica',large:true,priority:true},
  {title:'Suscripciones Premium activas',value:number(activeSub),sub:activeShare==='—'?'Estado actual':activeShare+' de registrados',footer:'Sin accesos manuales de administradores'},
  {title:'Nuevas suscripciones',value:number(fin.new_subs),sub:'Activaciones vigentes iniciadas en el período',footer:'No cuenta suscripciones pendientes'},
  {title:'Usuarios Free',value:number(fin.free_users),sub:'Sin Premium vigente, incluidos pendientes o cancelados',footer:'Acceso gratuito, no solo ausencia de suscripción'},
  {title:'ARPPU',value:currency==='ARS'?arppu:'—',sub:'Ingresos cobrados / usuarios que pagaron',footer:'Solo pagos confirmados · no MRR'},
  {title:'MRR · mensual recurrente',value:'—',sub:'Sin historial contractual suficiente',footer:'No se estima a partir del precio de lista'},
 ];
 const funnel=[
  {label:'Usan Evaluo Free',value:fin.free_active,sub:'Usuarios Free con actividad académica registrada'},
  {label:'Encuentran una función Premium',value:fin.premium_seen,sub:'Vieron una función o pantalla Premium'},
  {label:'Abren la página de precios',value:fin.pricing_seen,sub:'Evento pricing_view identificado'},
  {label:'Inician el checkout',value:fin.checkout_users,sub:'Usuario con intento de checkout registrado'},
  {label:'Completan el pago',value:fin.paid_users,sub:'Cobro confirmado en el registro contable'},
  {label:'Tienen Premium activado',value:fin.active_premium,sub:'Estado vigente ahora; no necesariamente la misma cohorte'},
 ];
 const maxFunnel=Math.max(1,...funnel.map(x=>x.value));
 const [displayChart,chartMax,chartTotal]=useMemo(()=>{
  const mapped=new Map<string,{date:string;ars:number;subs:number}>();
  for(const day of snapshot.daily){
   const key=sliceDate(day.d,granularity);
   const old=mapped.get(key)??{date:key,ars:0,subs:0};
   old.ars+=day.revenue_ars;old.subs+=day.new_subs;mapped.set(key,old);
  }
  const rows=[...mapped.values()].sort((a,b)=>a.date.localeCompare(b.date));
  return [rows,Math.max(0,...rows.map(x=>x.ars)),rows.reduce((sum,r)=>sum+r.ars,0)] as const;
 },[snapshot.daily,granularity]);
 const chartPoints=displayChart.map((d,i)=>{
  const x=displayChart.length===1?500:(i/(displayChart.length-1))*1000;
  const y=200-(chartMax>0?180*d.ars/chartMax:0);
  return x.toFixed(1)+','+y.toFixed(1);
 }).join(' ');
 const chartSubs=Math.max(1,...displayChart.map(x=>x.subs));
 const providers=snapshot.providers;
 const totalProviderRevenue=providers.reduce((s,x)=>s+x.revenue_ars,0);
 const financialLabels=currency==='ARS'?[
  {label:'ARS',value:money(fin.revenue_ars),sub:'Importe ARS acreditado'},
  {label:'USD',value:'—',sub:'Sin libro de cobros USD verificable'},
 ]:[
  {label:'ARS',value:money(fin.revenue_ars),sub:'Se muestra separado, sin conversión'},
  {label:'USD',value:'—',sub:'Importe de cobro USD no instrumentado'},
 ];
 const statusRows=[
  {label:'Activas',value:subscriptions.active,kind:'success'},
  {label:'Pendientes',value:subscriptions.pending,kind:'neutral'},
  {label:'Vencidas',value:subscriptions.expired,kind:'neutral'},
  {label:'Canceladas',value:subscriptions.canceled,kind:'negative'},
 ];
 const subscriptionTiles=[
  {title:'Suscripciones activas',value:number(subscriptions.active),note:'Estado actual confirmado'},
  {title:'Vencidas en el período',value:number(subscriptions.expirations_in_period),note:'Última suscripción vencida'},
  {title:'Cancelaciones en el período',value:number(subscriptions.cancellations_in_period),note:'Fecha de cancelación registrada'},
  {title:'Renovaciones exitosas',value:'—',note:'No hay secuencia contractual verificada'},
  {title:'Renovaciones fallidas',value:'—',note:'Webhook fallido no equivale a renovación rechazada'},
  {title:'Tasa de cancelación · churn',value:'—',note:'Requiere base activa al comienzo del período'},
  {title:'Duración promedio',value:'—',note:'Muestra histórica insuficiente'},
 ];
 const checkoutTiles=[
  {title:'Checkouts iniciados',value:number(co.attempts),note:'Intentos creados en el período'},
  {title:'Checkouts pendientes',value:number(co.pending),note:'No se consideran pagos cobrados'},
  {title:'Checkouts rechazados / fallidos',value:number(co.failed),note:'Estado de intentos de checkout'},
  {title:'Checkouts aprobados',value:number(co.approved),note:'Aprobación de checkout no es ingreso'},
  {title:'Pagos efectivamente aprobados',value:number(fin.approved_payments),note:'Transacciones contables con paid_at'},
  {title:'Cobros sin Premium activo',value:number(snapshot.mismatches.paid_without_active),note:'Requieren revisión de activación'},
  {title:'Reembolsos',value:'—',note:'No existe un libro separado de devoluciones'},
 ];
 const providerRows=providers.map(x=>[
  <Name key="name" title={x.provider} note={x.attempts<10?'Muestra chica · menos de 10 intentos':'Checkout y cobros registrados'}/>,
  <span className="mo-mono" key="att">{number(x.attempts)}</span>,
  <span className="mo-mono" key="ok">{number(x.approved)}</span>,
  <span className="mo-mono" key="rej">{number(x.rejected)}</span>,
  <span className="mo-mono" key="err">{number(x.technical_events)}</span>,
  <span className="mo-mono" key="rate">{pct(x.approved,x.attempts)}</span>,
 ]);
 const dimensions:[Dimension,string][]=[
  ['university','Universidad'],['career','Carrera'],['country','País'],
  ['source','Fuente de adquisición'],['provider','Proveedor de pagos'],
 ];
 const segments=snapshot.segments.filter(s=>s.dimension===segment);
 const segmentRows=segments.map(x=>[
  <Name key="name" title={x.label||'Sin identificar'} note={x.users<10?'Muestra chica · menos de 10 estudiantes':'Estado Premium actual'}/>,
  <span key="users" className="mo-mono">{number(x.users)}</span>,
  <span key="paid" className="mo-mono">{number(x.premium)}</span>,
  <div key="conv" className="mo-conversion"><Bar percent={x.users>=10&&!scopedProvider?100*x.premium/x.users:0} light/>
   <span className="mo-mono">{x.users>=10&&!scopedProvider?pct(x.premium,x.users):'—'}</span></div>,
  <span key="revenue" className="mo-mono">{currency==='ARS'?money(x.revenue_ars):'—'}</span>,
 ]);
 const hasRecentFinance=fin.revenue_ars>0||co.attempts>0||activeSub>0;
 return <main className="ehome mo-dashboard">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
    <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
      <Link className="eh-primary-link" href="/administrador/solicitudes">Solicitudes universidades →</Link>
    </div></div>
    <nav className="eh-tabs" aria-label="Paneles">{nav.map(([label,key],i)=>
      <Link key={label} href={'/administrador?panel='+key} prefetch={false}
        aria-current={i===6?'page':undefined} className={'eh-tab'+(i===6?' eh-active':'')}>{label}</Link>)}</nav>
  </header>
  <section className="mo-intro"><span className="mo-label">Evaluo / Monetización</span>
   <h1>Monetización</h1><p>Cuántos estudiantes pasan de Free a Premium, cuánto dinero genera Evaluo y dónde estamos perdiendo oportunidades de venta.</p></section>
  <form className="mo-filters" action="/administrador" method="get">
   <input type="hidden" name="panel" value="monetizacion"/>
   <div className="mo-filter-period"><span className="mo-label">Período</span>
    <div className="mo-segment" role="group" aria-label="Período">
    {([['1','Hoy'],['7','7 días'],['14','14 días'],['30','30 días'],['custom','Personalizado']] as const).map(([value,label])=>
      <button key={value} type="button" onClick={()=>setPeriod(value)} aria-pressed={period===value}
        className={period===value?'mo-selected':''}>{label}</button>)}</div>
    <input type="hidden" name="moneyPeriod" value={period}/></div>
   <div className="mo-filter-period"><span className="mo-label">Moneda</span>
    <div className="mo-segment" role="group" aria-label="Moneda">{(['ARS','USD'] as const).map(v=>
      <button key={v} type="button" className={currency===v?'mo-selected':''} aria-pressed={currency===v}
        onClick={()=>setCurrency(v)}>{v}</button>)}</div></div>
   <div className="mo-filter-second">
    <label className="mo-select"><span className="mo-label">País</span><select name="moneyCountry" defaultValue={filters.country}>
      <option value="all">Todos</option>{snapshot.options.countries.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
    <label className="mo-select"><span className="mo-label">Universidad</span><select name="moneyUniversity" defaultValue={filters.university}>
      <option value="all">Todas</option>{snapshot.options.universities.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <label className="mo-select"><span className="mo-label">Carrera</span><select name="moneyCareer" defaultValue={filters.career}>
      <option value="all">Todas</option>{snapshot.options.careers.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <label className="mo-select"><span className="mo-label">Proveedor de pagos</span><select name="moneyProvider" defaultValue={filters.provider}>
      <option value="all">Todos</option>{snapshot.options.providers.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
    <label className="mo-select"><span className="mo-label">Estado de la suscripción</span><select name="moneyState" defaultValue={filters.state}>
      <option value="all">Todos</option><option value="free">Free</option><option value="active">Activa</option>
      <option value="pending">Pendiente</option><option value="expired">Vencida</option><option value="canceled">Cancelada</option>
    </select></label>
    <button className="mo-apply" type="submit">Aplicar filtros</button>
    <span className="mo-spacer"/><span className="mo-tag">Datos reales · Supabase</span>
   </div>
   {period==='custom'&&<div className="mo-custom">
     <label>Desde<input aria-label="Fecha desde" type="date" required min={earliest} max={today}
       value={from} onChange={e=>setFrom(e.target.value)} name="moneyFrom"/></label>
     <label>Hasta<input aria-label="Fecha hasta" type="date" required min={earliest} max={today}
       value={to} onChange={e=>setTo(e.target.value)} name="moneyTo"/></label>
     <span>Máximo 30 días, dentro de los últimos 90</span></div>}
  </form>
  {!hasRecentFinance&&<p className="mo-info">Todavía no hay ingresos cobrados, checkouts recientes ni suscripciones Premium activas de estudiantes para esta selección. Los importes de ejemplo del diseño no se utilizan.</p>}
  <div className="mo-board">
   <section className="mo-section"><Section id="01" title="Resumen financiero" note={periodText+' · '+currency+' · estados Premium actuales'}/>
    <div className="mo-tiles">{financeTiles.map(x=><Tile key={x.title} {...x}/>)}</div></section>
   <section className="mo-section"><Section id="02" title="Embudo de conversión a Premium" note={'Señales verificables de '+periodText+'; no se inventa un recorrido continuo.'}/>
    <div className="mo-funnel">{funnel.map((f,i)=><div className="mo-funnel-row" key={f.label}>
     <div className="mo-funnel-name"><span className="mo-mono mo-muted">{String(i+1).padStart(2,'0')}</span>
       <div><strong>{f.label}</strong><small>{f.sub}</small></div></div>
     <div className="mo-funnel-bar"><Bar percent={100*f.value/maxFunnel} light={i===4||i===5}/></div>
     <span className="mo-mono mo-right">{number(f.value)}</span>
     <span className="mo-mono mo-right mo-muted">{i===0?'Base':'—'}</span>
    </div>)}</div>
    <p className="mo-footnote">Las etapas están medidas por personas, pero todavía no forman una cohorte de pasos consecutivos vinculados. Por eso no se presentan pérdidas porcentuales artificiales.</p></section>
   <section className="mo-section"><div className="mo-head mo-head-between"><div className="mo-head-left"><span className="mo-idx">03</span><h2>Ingresos y evolución</h2>
     <p>{periodText} · {currency}</p></div>
     <div className="mo-segment" role="group" aria-label="Agrupación del gráfico">{([['day','Día'],['week','Semana'],['month','Mes']] as const).map(([x,label])=>
       <button key={x} type="button" aria-pressed={granularity===x} className={granularity===x?'mo-selected':''}
         onClick={()=>setGranularity(x)}>{label}</button>)}</div></div>
    <div className="mo-chart-grid"><div className="mo-chart-summary"><div><span className="mo-label">Período actual</span><strong>{revenue}</strong></div>
      <div><span className="mo-label">Período anterior</span><strong>{prevRevenue}</strong></div>
      <div><span className="mo-label">Variación</span><strong>{currency==='ARS'?sign(fin.revenue_ars,fin.previous_ars):'—'}</strong></div></div>
     <div className="mo-plot">
      <svg viewBox="0 0 1000 240" role="img" preserveAspectRatio="none" aria-label="Evolución de ingresos cobrados en ARS">
       <path d="M0 30H1000M0 85H1000M0 140H1000M0 200H1000" className="mo-guides"/>
       {currency==='ARS'&&chartMax>0&&<polyline points={chartPoints} className="mo-chart-line"/>}
      </svg>
      {(currency==='USD'||chartTotal===0)&&<span className="mo-chart-empty">{currency==='USD'?'Ingresos USD sin fuente contable validada':'Sin ingresos cobrados en el período'}</span>}
     </div>
     <div className="mo-axis"><span>{displayChart.length?detailFor(displayChart[0].date):snapshot.from}</span>
       <span>{displayChart.length?detailFor(displayChart[displayChart.length-1].date):snapshot.through}</span></div></div>
    <div className="mo-split">
     <div className="mo-split-cell"><h3>Nuevas suscripciones</h3><p>{number(fin.new_subs)} activaciones vigentes en total · según fecha de inicio</p>
      <div className="mo-new-bars">{displayChart.map(d=><div key={d.date} title={d.date+': '+number(d.subs)} className="mo-new-bar"><span style={{height:Math.max(0,d.subs/chartSubs*100)+'%'}}/></div>)}</div>
      <span className="mo-tiny">La gráfica omite suscripciones pendientes y canceladas.</span></div>
     <div className="mo-split-cell"><h3>Ingresos por moneda</h3><p>Siempre separadas; nunca se suman ni se convierten.</p>
      {financialLabels.map(x=><div className="mo-currency-row" key={x.label}>
       <div><strong>{x.label}</strong><small>{x.sub}</small></div><span className="mo-mono">{x.value}</span></div>)}</div>
    </div>
    <div className="mo-provider-revenue"><h3>Ingresos por proveedor de pagos</h3><p>{currency} · {periodText} · solo transacciones cobradas.</p>
      {providers.length?providers.map(p=><div className="mo-provider-line" key={p.provider}>
       <span>{p.provider}</span><Bar percent={totalProviderRevenue>0?100*p.revenue_ars/totalProviderRevenue:0} light/>
       <strong className="mo-mono">{currency==='ARS'?money(p.revenue_ars):'—'}</strong>
       <small className="mo-mono mo-muted">{totalProviderRevenue>0?pct(p.revenue_ars,totalProviderRevenue):'—'}</small></div>):
       <p className="mo-empty">No hay proveedores con pagos o checkouts recientes.</p>}
    </div>
   </section>
   <section className="mo-section"><Section id="04" title="Suscripciones y cancelaciones" note="Estado actual registrado; la serie histórica de renovaciones aún no está completa."/>
     <div className="mo-status-layout"><div className="mo-status-top">
      <span className="mo-label">Estado de las últimas suscripciones · {number(totalSubs)} en total</span>
      <div className="mo-status-bar">{statusRows.map(x=><span key={x.label} title={x.label+' '+number(x.value)}
       style={{width:totalSubs?100*x.value/totalSubs+'%':'0%'}}
       className={'mo-status-'+x.kind}/>)}</div>
      <div className="mo-status-labels">{statusRows.map(x=><div key={x.label}><span>{x.label}</span>
        <strong>{number(x.value)} <small>({pct(x.value,totalSubs)})</small></strong></div>)}</div>
     </div></div>
     <div className="mo-small-tiles">{subscriptionTiles.map(x=><Tile key={x.title} title={x.title} value={x.value} sub={x.note}/>)}</div>
   </section>
   <section className="mo-section"><Section id="05" title="Problemas con pagos" priority note={'Intentos, rechazos y errores de integración registrados · '+periodText}/>
    <div className="mo-problem-head">
     <div className="mo-problem-rate"><div className="mo-tile-label"><span>Conversión de checkout a pago confirmado</span><span className="mo-pri">Prioridad</span></div>
      <strong>{checkoutToPaid}</strong><p>No hay enlace completo entre cada intento y su transacción cobrada para calcular una tasa verificable.</p>
     </div>
     <div className="mo-problem-cards">{checkoutTiles.map(x=><div className="mo-mini" key={x.title}>
      <span className="mo-label">{x.title}</span><strong>{x.value}</strong><small>{x.note}</small></div>)}</div>
    </div>
    <div className="mo-provider-errors"><h3>Errores por proveedor de pagos</h3>
     <p>Los proveedores con menos de diez intentos se identifican como muestra pequeña. Los errores técnicos son eventos de webhook, no pagos rechazados.</p>
     <Table layout="providers" head={['Proveedor','Intentos','Checkout aprobado','Rechazados','Webhooks fallidos','% checkout aprobado']}
       rows={providerRows}/></div>
   </section>
   <section className="mo-section"><Section id="06" title="Conversión por segmento" note="Qué perfiles tienen Premium vigente y cuánto ingreso cobrado se les puede atribuir. La fuente de adquisición puede estar incompleta."/>
     <div className="mo-dimensions"><span className="mo-label">Segmentar por</span>
      <div className="mo-segment" role="group" aria-label="Dimensión de segmento">{dimensions.map(([key,label])=>
       <button type="button" key={key} aria-pressed={segment===key} className={segment===key?'mo-selected':''}
       onClick={()=>setSegment(key)}>{label}</button>)}</div></div>
     <Table layout="segments" head={['Segmento','Usuarios','Premium vigente','Conversión actual','Ingresos · '+currency]}
       rows={segmentRows} empty="No hay usuarios de ese segmento con los filtros seleccionados."/>
     <p className="mo-footnote">La conversión es Premium vigente sobre usuarios registrados, no conversión histórica de compra. Para grupos menores de 10 usuarios o con proveedor filtrado no se calcula porcentaje. La atribución de ingresos solo usa pagos realmente confirmados.</p>
    </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · solo administradores · sin ingresos ficticios, importes USD estimados ni accesos Premium manuales del equipo · caché de 60 minutos · filtros aplicados al enviar el formulario. Las renovaciones, reembolsos, MRR y churn requieren un historial de facturación más completo.
   <span className="mo-footer-link"> <Link href="/administrador?panel=referidos" prefetch={false}>Abrir gestión de códigos de Referidos</Link></span>
  </footer>
 </main>;
}