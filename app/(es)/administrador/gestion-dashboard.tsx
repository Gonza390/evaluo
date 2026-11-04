'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {gestionActualizarFeedback,gestionResolverCatalogo} from './gestion-dashboard-actions';
import type {GestionSnapshot} from './gestion-dashboard-types';
import './admin-home.css';
import './gestion-dashboard.css';

type PreviewRole='sa'|'ad'|'so';
type PendingAction =
 | {section:'cat';kind:'university'|'career'|'subject';id:string;name:string;decision:'approve'|'reject'}
 | {section:'fb';source:'product'|'simulator'|'material';id:string;name:string;expected:'open'|'in_progress';next:'in_progress'|'resolved'};
const nav:[string,string][]=[
 ['Tablero general','resumen'],['Usuarios y retención','usuarios'],['Adquisición y SEO','adquisicion'],
 ['Activación y recorrido','producto'],['Aprendizaje y prácticas','biblioteca'],
 ['Planes de estudio','planes'],['Monetización','monetizacion'],
 ['Comunicaciones','mails'],['Sistema e IA','ia'],['Gestión','gestion'],
];
const previews:[PreviewRole,string][]=[['sa','Super admin'],['ad','Admin'],['so','Soporte']];
const accessMatrix:Array<[string,boolean,boolean,boolean]>=[
 ['Aprobar solicitudes del catálogo',true,true,false],
 ['Responder feedback y reportes',true,true,true],
 ['Modificar configuración sensible',true,false,false],
 ['Gestionar roles y permisos',true,false,false],
 ['Ver auditoría',true,true,false],
];
const typeLabels:Record<string,string>={university:'Universidad',career:'Carrera',subject:'Materia'};
const statusLabels:Record<string,string>={pending:'Pendiente',reviewing:'En revisión',planned:'Planificada',
 added:'Agregada',rejected:'Rechazada',approved:'Aprobada',open:'Abierto',in_progress:'En seguimiento',
 resolved:'Resuelto'};
const fmt=(n:number)=>n.toLocaleString('es-AR');
const date=(v:string|null)=>v?new Intl.DateTimeFormat('es-AR',{
  timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',
  year:'numeric',hour:'2-digit',minute:'2-digit'
}).format(new Date(v)):'—';
function Title({n,title,note,priority}:{n:string;title:string;note:string;priority?:string}){
 return <div className="gm-sh"><span className="gm-idx">{n}</span><h2>{title}</h2>
 {priority&&<span className="gm-pri">{priority}</span>}<p>{note}</p></div>;
}
function TextRow({title,detail}:{title:string;detail:string}){
 return <div className="gm-row-title"><strong>{title}</strong><small>{detail}</small></div>;
}
function Confirm({action,busy,onCancel,onConfirm}:{action:PendingAction;busy:boolean;onCancel:()=>void;onConfirm:()=>void}){
 const isReject=action.section==='cat'&&action.decision==='reject';
 const isDanger=isReject;
 const headline=action.section==='cat'?
  (action.decision==='approve'?'Aprobar solicitud académica':'Rechazar solicitud académica'):
  action.next==='resolved'?'Marcar feedback como resuelto':'Pasar feedback a seguimiento';
 const body=action.section==='cat'?
  (action.decision==='approve'? 'Esto modificará el catálogo académico real. La solicitud quedará registrada en la auditoría de Gestión.':
    'Esta solicitud quedará rechazada. La operación afectará el estado real del catálogo.'):
  'El cambio de estado se guardará en Supabase y quedará registrado con el usuario administrador responsable.';
 return <div className={'gm-confirm'+(isDanger?' gm-confirm-warn':'')} role="alertdialog" aria-label="Confirmar cambio" aria-modal="false">
  <strong>{headline}</strong><p>{action.name}. {body}</p>
  <div className="gm-actions"><button className="gm-bt gm-on" type="button" disabled={busy} onClick={onConfirm}>
   {busy?'Guardando…':'Confirmar y registrar'}</button>
   <button className="gm-bt" disabled={busy} type="button" onClick={onCancel}>Cancelar</button></div>
 </div>;
}
export function GestionDashboard({snapshot,actor,limits}:{
 snapshot:GestionSnapshot;actor:string;limits:{dailyFreeAi:number;freeErrorsPerWeek:number};
}){
 const router=useRouter();
 const [preview,setPreview]=useState<PreviewRole>('sa');
 const [confirm,setConfirm]=useState<PendingAction|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<{ok:boolean;text:string}|null>(null);
 const [allRequests,setAllRequests]=useState(false);
 const [allFeedback,setAllFeedback]=useState(false);
 const me=snapshot.admins.find(x=>x.id===actor);
 const myLabel=me?.nombre?.trim()||'Administrador autenticado';
 const canCatalog=preview!=='so';
 const canFeedback=true;
 const pending=snapshot.request_summary.pending;
 const open=snapshot.feedback_summary.open_feedback;
 const hasRequests=snapshot.requests.length>0;
 const reqs=allRequests?snapshot.requests:snapshot.requests.slice(0,12);
 const fbs=allFeedback?snapshot.feedback:snapshot.feedback.slice(0,10);
 const kpis=[
  {label:'Solicitudes pendientes',value:pending,note:'Universidades, carreras y materias'},
  {label:'Incidencias abiertas',value:open,note:fmt(snapshot.feedback_summary.errors)+' errores o reportes relevantes'},
  {label:'Universidades por revisar',value:snapshot.request_summary.universities_pending,note:'Solicitudes nuevas pendientes'},
  {label:'Cambios sin aplicar',value:0,note:'Configuración editada desde código, sin borradores'},
  {label:'Tareas administrativas',value:pending+open,note:'Solicitudes y feedback abiertos'},
 ];
 const catalogNote='Catálogo actual: '+fmt(snapshot.academic_summary.universities)+
  ' universidades · '+fmt(snapshot.academic_summary.careers)+' carreras · '+
  fmt(snapshot.academic_summary.subjects)+' materias aprobadas.';
 const configuration=[
  {name:'PDFs cargados por mes',free:'—',premium:'—',note:'Sin límite global editable conectado'},
  {name:'Preguntas de práctica por día',free:'—',premium:'—',note:'No hay control global editable'},
  {name:'Simulacros por mes',free:'—',premium:'—',note:'No hay control global editable'},
  {name:'Consultas de IA por día',free:fmt(limits.dailyFreeAi),premium:'Sin límite',note:'Aplicado actualmente desde código'},
  {name:'Repasos de errores por semana',free:fmt(limits.freeErrorsPerWeek),premium:'Según Premium',note:'Límite Free aplicado desde código'},
 ];
 const flags=[
  {label:'Simulacros',note:'Modalidad existente; sin interruptor central de configuración'},
  {label:'Planes de estudio',note:'Funcionalidad existente; sin interruptor central'},
  {label:'Casos (beta)',note:'Modalidad existente; sin interruptor central'},
  {label:'Registro con Google',note:'Configuración de autenticación externa'},
  {label:'Modo mantenimiento',note:'No existe una barrera global de mantenimiento conectada'},
 ];
 const auditLabels:Record<string,string>={
  catalog_approved:'Aprobó solicitud académica',catalog_rejected:'Rechazó solicitud académica',
  feedback_status_changed:'Actualizó estado de feedback'
 };
 async function apply(){
  if(!confirm||busy)return;
  setBusy(true);
  try{
   const result=confirm.section==='cat'
    ?await gestionResolverCatalogo({id:confirm.id,kind:confirm.kind,decision:confirm.decision})
    :await gestionActualizarFeedback({source:confirm.source,id:confirm.id,expected:confirm.expected,next:confirm.next});
   setNotice({ok:result.success,text:result.message});
   if(result.success){setConfirm(null);router.refresh();}
  }catch(e){
   setNotice({ok:false,text:e instanceof Error?e.message:'No pudimos guardar el cambio.'});
  }finally{setBusy(false)}
 }
 return <main className="ehome gm-page">
  <header className="eh-header"><div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span>
   <div className="eh-top-actions"><Link href="/administrador/feedback">Feedback</Link>
    <Link className="eh-primary-link" href="/administrador/solicitudes">Solicitudes universidades →</Link></div></div>
   <nav className="eh-tabs" aria-label="Paneles">{nav.map(([label,key],i)=>
    <Link href={'/administrador?panel='+key} prefetch={false} key={key}
      aria-current={i===9?'page':undefined} className={'eh-tab'+(i===9?' eh-active':'')}>{label}</Link>)}</nav></header>
  <section className="gm-intro"><div className="gm-lab">Evaluo / Gestión</div><h1>Gestión</h1>
   <p>Permisos, catálogo, feedback y configuración del producto. Acá se opera: cada cambio sensible pide confirmación y queda registrado en la auditoría.</p></section>
  <section className="gm-session" aria-label="Sesión">
    <div className="gm-sel"><span className="gm-lab">Sesión actual</span><div className="gm-session-person">
     <span>{myLabel}</span><span className="gm-pri">Administrador</span></div></div>
    <div className="gm-sel"><span className="gm-lab">Ver como (simulación)</span>
      <div className="gm-seg" role="group" aria-label="Simular rol">
       {previews.map(([k,label])=><button key={k} type="button" aria-pressed={preview===k}
        onClick={()=>{setPreview(k);setConfirm(null);}} className={preview===k?'gm-active':''}>{label}</button>)}
      </div></div>
    <span className="gm-flex"/><span className="gm-tag">Simulación de permisos · solo visual</span>
    <span className="gm-tag">Datos reales · Supabase</span>
  </section>
  {notice&&<div className={'gm-notice '+(notice.ok?'gm-success':'gm-error')} role="status">
    <span>{notice.text}</span><button type="button" className="gm-bt" onClick={()=>setNotice(null)}>Cerrar</button>
   </div>}
  <div className="gm-board">
   <section className="gm-sec" aria-label="Resumen de gestión"><Title n="01" title="Resumen de gestión" note="Lo que hoy necesita una decisión o una intervención."/>
    <div className="gm-cells">{kpis.map(x=><div className="gm-cell" key={x.label}>
     <span className="gm-lab">{x.label}</span><strong className="gm-num">{fmt(x.value)}</strong>
     <span className="gm-mono gm-muted">{x.note}</span></div>)}</div></section>
   <section className="gm-sec" aria-label="Usuarios y permisos">
    <Title n="02" title="Usuarios y permisos" priority="Control de permisos"
      note="Administradores reales y matriz prevista de permisos. No se habilitan cambios de rol sin una jerarquía de autorización global."/>
    <div className="gm-dual">
     <div className="gm-dual-section">
      <div className="gm-table gm-admins">
       <div className="gm-row gm-head"><span>Administrador</span><span>Rol real</span><span>Cambiar a</span><span>2FA</span></div>
       {snapshot.admins.map(a=><div className="gm-row" key={a.id}>
        <TextRow title={(a.nombre?.trim()||'Administrador')+(a.id===actor?' (vos)':'')}
         detail={'Último acceso: '+date(a.last_sign_in_at)}/>
        <span className="gm-mono">Admin</span>
        <div className="gm-actions">{previews.map(([k,label])=>
         <button className={'gm-bt'+(k==='ad'?' gm-on':'')} key={k} type="button" disabled
           title="Los roles jerárquicos aún no existen en la autorización del resto de Evaluo">{label}</button>)}</div>
        <span className={'gm-mono '+(a.mfa_enabled?'gm-green':'gm-muted')}>{a.mfa_enabled?'Activa':'No verificada'}</span>
       </div>)}
       {!snapshot.admins.length&&<p className="gm-empty">No se encontraron perfiles de administradores.</p>}
      </div>
     </div>
     <div className="gm-dual-section">
      <div className="gm-table gm-matrix">
       <div className="gm-row gm-head"><span>Permiso propuesto</span><span>Super</span><span>Admin</span><span>Soporte</span></div>
       {accessMatrix.map(([name,sa,ad,so])=><div className="gm-row" key={name}>
         <span>{name}</span>{[sa,ad,so].map((v,i)=><span key={i} className={'gm-mono '+(v?'gm-green':'gm-muted')}>{v?'✓':'—'}</span>)}</div>)}
      </div>
      <p className="gm-note-inline">Es una vista de diseño. Hoy Evaluo solo aplica el rol real Admin/Estudiante; elegir un rol arriba no concede ni revoca permisos.</p>
     </div>
    </div>
   </section>
   <section className="gm-sec" aria-label="Universidades y carreras"><Title n="03" title="Universidades y carreras" priority="Gestión académica" note={catalogNote}/>
    {confirm?.section==='cat'&&<Confirm action={confirm} busy={busy} onCancel={()=>setConfirm(null)} onConfirm={apply}/>}
    <div className="gm-table gm-requests">
     <div className="gm-row gm-head"><span>Solicitud</span><span>Origen</span><span>Fecha</span><span>Estado</span><span>Acción</span></div>
     {reqs.map(r=>{
      const pending=r.status==='pending';
      return <div className="gm-row" key={r.kind+':'+r.id}>
       <TextRow title={r.title} detail={typeLabels[r.kind]??r.kind}/>
       <span className="gm-mono">{r.origin||'—'}</span>
       <span className="gm-mono">{date(r.created_at)}</span>
       <span className={'gm-mono '+((r.status==='approved'||r.status==='added')?'gm-green':r.status==='rejected'?'gm-red':'')}>
        {statusLabels[r.status]??r.status}</span>
       <div className="gm-actions">{pending&&canCatalog?<>
        <button type="button" className="gm-bt gm-on" disabled={busy||!r.parent_approved}
         title={!r.parent_approved?'Primero aprobá la carrera':'Aprobar solicitud'}
         onClick={()=>{setNotice(null);setConfirm({section:'cat',id:r.id,kind:r.kind,name:r.title,decision:'approve'});}}>Aprobar</button>
        <button type="button" className="gm-bt" disabled={busy}
         onClick={()=>{setNotice(null);setConfirm({section:'cat',id:r.id,kind:r.kind,name:r.title,decision:'reject'});}}>Rechazar</button></>:
        <span className="gm-mono gm-muted">{pending?'Solo lectura en esta simulación':'—'}</span>}</div>
      </div>;
     })}
     {!hasRequests&&<p className="gm-empty">No hay solicitudes académicas registradas.</p>}
    </div>
    <div className="gm-table-footer">{snapshot.requests.length>12&&<button className="gm-bt" type="button" onClick={()=>setAllRequests(!allRequests)}>
      {allRequests?'Ver menos':'Ver todas las solicitudes cargadas ('+snapshot.requests.length+')'}</button>}
      <Link className="gm-table-link" href="/administrador/solicitudes">Administración académica detallada →</Link></div>
   </section>
   <section className="gm-sec" aria-label="Feedback y reportes"><Title n="04" title="Feedback y reportes" note="Comentarios, errores y sugerencias con su estado real de seguimiento."/>
    {confirm?.section==='fb'&&<Confirm action={confirm} busy={busy} onCancel={()=>setConfirm(null)} onConfirm={apply}/>}
    <div className="gm-table gm-feedback">
     <div className="gm-row gm-head"><span>Detalle</span><span>Tipo</span><span>Fecha</span><span>Estado</span><span>Acción</span></div>
     {fbs.map(f=><div className="gm-row" key={f.source+':'+f.id}>
      <TextRow title={f.description} detail="Estudiante · identidad omitida"/>
      <span className="gm-mono">{f.category}</span>
      <span className="gm-mono">{date(f.created_at)}</span>
      <span className={'gm-mono '+(f.status==='in_progress'?'gm-green':f.status==='resolved'?'gm-muted':'')}>{statusLabels[f.status]??f.status}</span>
      <div>{canFeedback&&f.status!=='resolved'?<button disabled={busy} type="button" className="gm-bt"
       onClick={()=>{setNotice(null);setConfirm({section:'fb',source:f.source,id:f.id,name:f.description,
        expected:f.status==='open'?'open':'in_progress',next:f.status==='open'?'in_progress':'resolved'});}}>
        {f.status==='open'?'Pasar a seguimiento':'Marcar resuelto'}</button>:<span className="gm-mono gm-muted">—</span>}</div>
     </div>)}
     {!snapshot.feedback.length&&<p className="gm-empty">No hay feedback pendiente de revisión.</p>}
    </div>
    <div className="gm-table-footer">{snapshot.feedback.length>10&&<button className="gm-bt" type="button" onClick={()=>setAllFeedback(!allFeedback)}>
       {allFeedback?'Ver menos':'Ver más feedback ('+snapshot.feedback.length+')'}</button>}
      <Link className="gm-table-link" href="/administrador/feedback">Ver historial de feedback →</Link></div>
   </section>
   <section className="gm-sec" aria-label="Configuración del producto">
    <Title n="05" title="Configuración del producto" note="Límites Free y Premium y funciones habilitadas. Solo se muestran valores realmente aplicados por la aplicación."/>
    <div className="gm-table gm-limits">
     <div className="gm-row gm-head"><span>Límite</span><span>Free</span><span>Premium</span></div>
     {configuration.map(x=><div className="gm-row" key={x.name}>
      <TextRow title={x.name} detail={x.note}/>
      <div className="gm-config-value"><button type="button" disabled className="gm-bt" aria-label={'Reducir Free: '+x.name}>−</button>
       <span className="gm-mono">{x.free}</span><button disabled type="button" className="gm-bt" aria-label={'Aumentar Free: '+x.name}>+</button></div>
      <div className="gm-config-value"><button disabled type="button" className="gm-bt" aria-label={'Reducir Premium: '+x.name}>−</button>
       <span className="gm-mono">{x.premium}</span><button disabled type="button" className="gm-bt" aria-label={'Aumentar Premium: '+x.name}>+</button></div>
     </div>)}</div>
    <div className="gm-table gm-flags">
     <div className="gm-row gm-head"><span>Funciones habilitadas · interruptores no conectados</span></div>
     {flags.map(x=><div className="gm-row" key={x.label}>
      <TextRow title={x.label} detail={x.note}/>
      <div className="gm-config-flag"><span className="gm-mono gm-muted">Control pendiente</span>
       <button type="button" role="switch" aria-checked={false} disabled aria-label={x.label} className="gm-toggle">
        <span/></button></div></div>)}
    </div>
   </section>
   <section className="gm-sec" aria-label="Auditoría administrativa"><Title n="06" title="Auditoría administrativa" priority="Auditoría de cambios" note="Quién ejecutó cada cambio desde Gestión, cuándo y con qué resultado. Solo lectura."/>
    <div className="gm-table gm-audit">
     <div className="gm-row gm-head"><span>Fecha</span><span>Responsable</span><span>Acción</span><span>Objeto</span><span>Resultado</span></div>
     {snapshot.audit.map(a=><div key={a.id} className="gm-row">
       <span className="gm-mono">{date(a.created_at)}</span><span>{a.actor}</span>
       <span>{auditLabels[a.action]??a.action}</span>
       <span className="gm-mono gm-wrap">{a.object_type} · {a.object_id}</span>
       <span className={'gm-mono '+(a.result==='success'?'gm-green':'gm-red')}>{a.result==='success'?'Éxito':a.result==='denied'?'Denegado':'Error'}</span>
     </div>)}
     {!snapshot.audit.length&&<p className="gm-empty">Todavía no hay cambios registrados desde Gestión. Las operaciones que se realicen aquí aparecerán en esta tabla.</p>}
    </div>
   </section>
  </div>
  <footer className="eh-footer">Fuente: Supabase · lectura agregada cacheada 5 minutos · cambios protegidos por autenticación administrativa y confirmación · auditoría de operaciones iniciadas desde Gestión. Los roles jerárquicos y la configuración global aún no están implementados en Evaluo; se muestran deshabilitados para evitar falsos cambios.</footer>
 </main>;
}
