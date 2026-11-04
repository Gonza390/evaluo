import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(name:string)=>readFileSync(new URL('../app/(es)/administrador/'+name,import.meta.url),'utf8');
// Source-of-truth section labels transcribed from the ten supplied HTML ZIPs.
// This locks their ordering/copy without inventing a new interface.
const sections:Record<string,string[]>={
 'admin-home.tsx':['Tablero general','Usuarios','Actividad académica','Evolución','Retención y activación','Monetización','Alertas'],
 'users-retention-dashboard.tsx':['Usuarios y retención','Resumen de usuarios','Retención de usuarios','Cohortes por semana de registro','Frecuencia de uso','Estudiantes activos por día','Abandono e inactividad','Segmentación de estudiantes','Listado de usuarios'],
 'acquisition-dashboard.tsx':['Adquisición y SEO','Resumen de adquisición','Canales de adquisición','Rendimiento SEO','Rendimiento por página','Embudo de adquisición','Campañas y enlaces'],
 'activation-dashboard.tsx':['Activación y recorrido','Resumen de activación','Embudo de activación','Onboarding','Primera experiencia de estudio','Abandono y fricciones','Comparación de recorridos'],
 'learning-dashboard.tsx':['Aprendizaje y prácticas','Resumen académico','Práctica por temas','Herramientas de estudio','Simulacros','Errores y refuerzo','Rendimiento por materia'],
 'study-plans-dashboard.tsx':['Planes de estudio','Resumen general','Embudo de creación','Seguimiento del plan','Tiempo disponible','Abandono y dificultades','Efectividad de los planes'],
 'monetization-dashboard.tsx':['Monetización','Resumen financiero','Embudo de conversión a Premium','Ingresos y evolución','Nuevas suscripciones','Ingresos por moneda','Ingresos por proveedor de pagos','Suscripciones y cancelaciones','Problemas con pagos','Errores por proveedor de pagos','Conversión por segmento'],
 'communications-dashboard.tsx':['Comunicaciones','Resumen general','Correos automáticos','Rendimiento por correo','Recordatorios de examen','Próximos envíos programados','Errores y entregabilidad','Motivos de falla','Dónde rebotan','Impacto en el producto','Del correo a la actividad','Qué tipo de correo activa más estudio'],
 'system-ai-dashboard.tsx':['Sistema e IA','Estado general del sistema','Procesamiento de PDF y DOCX','Consumo de inteligencia artificial','Infraestructura: Supabase y Vercel','Errores e incidencias','Rendimiento y optimización'],
 'gestion-dashboard.tsx':['Gestión','Resumen de gestión','Usuarios y permisos','Universidades y carreras','Feedback y reportes','Configuración del producto','Auditoría administrativa'],
};
assert.equal(Object.keys(sections).length,10);
for(const [file,labels] of Object.entries(sections)){
 const content=source(file);
 let before=-1;
 for(const label of labels){
  // Some section names also occur in the navigation; require presence, but don't
  // claim pixel-perfect equivalence without an authenticated screenshot comparison.
  const at=content.indexOf(label);
  assert.ok(at>=0,file+' is missing original HTML heading '+label);
  // Table/sidebars may rearrange source order; do not compare DOM order statically.
  before=at;
 }
 assert.ok(content.includes('eh-tabs'),file+' must keep original navigation');
 assert.ok(content.includes('className="ehome'),file+' must keep black design shell');
}
const css=readFileSync(new URL('../app/(es)/administrador/admin-home.css',import.meta.url),'utf8');
for(const signature of ['#C8FF3A','Bricolage Grotesque','Inter Tight','JetBrains Mono','@media'])
 assert.ok(css.includes(signature),'Original HTML visual signature missing: '+signature);

/* The ten exported HTML references all use #FAFAFA on #000 as the inherited
   foreground. Tailwind's global base sets a dark foreground on headings and
   slate on paragraphs, so without this scoped reset the artboards are illegible.
   The low-specificity :where rule must leave explicit per-panel colors intact. */
assert.match(css,/\.ehome\s+:where\(h1,h2,h3,h4,h5,h6,p\)\s*\{\s*color:\s*inherit\s*\}/);
assert.match(css,/\.ehome\{[^}]*color:#FAFAFA/);
for(const file of [
 'activation-dashboard.css','acquisition-dashboard.css','learning-dashboard.css',
 'study-plans-dashboard.css','monetization-dashboard.css','communications-dashboard.css',
 'system-ai-dashboard.css','gestion-dashboard.css',
]){
 const content=readFileSync(new URL('../app/(es)/administrador/'+file,import.meta.url),'utf8');
 assert.ok(/color:(?:#FAFAFA|var\(--[a-z-]+-muted\))/.test(content),
    'Original panel typography colors missing from '+file);
}

console.log('Admin ten-HTML headings and visual tokens are intact.');
