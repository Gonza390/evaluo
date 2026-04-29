#!/usr/bin/env node
// Cross-platform local auditor (Node.js only, no external deps like rg)
// Produces audit-report-<timestamp>.md in project root.
const fs = require('fs');
const path = require('path');

function exists(p){try{fs.accessSync(p);return true;}catch(e){return false;}}

const OUT = `audit-report-${new Date().toISOString().replace(/[:.]/g,'-')}.md`;
let lines = [];
lines.push('# Auditoría Local Evaluo');
lines.push(`Fecha: ${new Date().toString()}`);
lines.push('');

function pushSection(title){ lines.push(`## ${title}`); lines.push(''); }
function addLine(s){ lines.push(s); }

// Metadatos de entorno
pushSection('Metadatos del entorno');
let nodeVer = process.version || 'n/a';
lines.push(`- Node version: ${nodeVer}`);
let npmVer = 'n/a';
try{ npmVer = require('child_process').execSync('npm -v',{stdio:['ignore','pipe','ignore']}).toString().trim(); }catch(e){}
lines.push(`- npm version: ${npmVer}`);
let nextVer = '';
if (exists('package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
    nextVer = (pkg.dependencies?.next) || (pkg.devDependencies?.next) || '';
  } catch(e) {}
}
lines.push(`- next: ${nextVer || 'no encontrado'}`);
lines.push('');

// JOINS y casting UUID
pushSection('Consistencia de Base de Datos (UUID)');
lines.push('Buscar JOINS entre preguntas_banco y materias y uso de cast a UUID (::uuid)');
lines.push('Este escaneo detecta palabras clave; la revisión detallada debe hacerse en SQL/ORM.');
lines.push('');
pushSection('Explicaciones IA y RLS');
lines.push('Políticas RLS en explicaciones_ia y permisos de lectura para usuarios autenticados.');
lines.push('');
pushSection('Gemini 1.5 Flash');
lines.push('Ubicación de llamadas a Gemini (server-side) y prompts con seguridad.');
lines.push('');
pushSection('Google Drive');
lines.push('Manejo de búsqueda de archivos y casos como M1-2; manejo de errores si carpeta/archivo no accesible.');
lines.push('');
pushSection('Autenticación y Sesiones');
lines.push('Verificación de variables de entorno y uso correcto de NEXT_PUBLIC_ vs SECRET.');
lines.push('');
pushSection('Middleware y Rutas Protegidas');
lines.push('Protección de /admin y rutas Premium.');
lines.push('');
pushSection('Rendimiento y UX');
lines.push('Estado de Loading durante búsquedas y generación de explicación.');
lines.push('');
pushSection('Visor PDF y Móvil');
lines.push('Visor de PDF responsivo y fallback para móvil.');
lines.push('');
pushSection('Build: TypeScript');
lines.push('Detectar usos de any y opciones opcionales que puedan romper el build.');
lines.push('');

// Análisis estático básico (busca patrones simples)
function scanDir(dir){
  let results = [];
  const items = fs.readdirSync(dir, {withFileTypes: true});
  for(const it of items){
    const p = path.join(dir, it.name);
    if(it.isDirectory()){
      results = results.concat(scanDir(p));
    } else if(it.isFile()){
      // Analizar archivos relevantes
      const ext = path.extname(it.name).toLowerCase();
      if(['.ts','.tsx','.js','.jsx','.sql','.md','.json','.env'].includes(ext) || it.name.toLowerCase().includes('docker')){
        try{
          const content = fs.readFileSync(p,'utf8');
          // JOINS: buscar preguntas_banco, materias, ::uuid, TEXT, UUID
          if(/preguntas_banco/i.test(content) || /\bJOIN\b.*preguntas_banco/i.test(content) || /::uuid|UUID|TEXT/i.test(content)){
            results.push(p);
          }
          // RLS/Policies
          if(/explicaciones_ia|ROW LEVEL SECURITY|POLICY/i.test(content)){
            results.push(p);
          }
          // Gemini/Generative
          if(/Gemini|Generative|google.*generative|Gemini 1|Gemini 1\.5/i.test(content)){
            results.push(p);
          }
          // Drive usage
          if(/drive|google.*drive|files.list|getFiles|M1-2/i.test(content)){
            results.push(p);
          }
          // Prompts
          if(/prompt|system|instruction|fallback|fallback|internet/i.test(content)){
            results.push(p);
          }
          // Middleware/admin
          if(/middleware|\/admin|premium|protect|session|auth/i.test(content)){
            results.push(p);
          }
          // Visor PDF
          if(/pdf|PDF|viewer|iframe/i.test(content)){
            results.push(p);
          }
          // TS any usage
          if(/:\s*any\b/.test(content)){
            results.push(p);
          }
        }catch(e){ /* ignore unreadable files */ }
      }
    }
  }
  return results;
}

const scanned = scanDir(process.cwd());
if(scanned.length>0){
  lines.push(`- Archivos potencialmente relevantes encontrados (${scanned.length}):`);
  scanned.slice(0,100).forEach(f=> lines.push(`  - ${path.relative(process.cwd(),f)}`));
} else {
  lines.push('- No se encontraron archivos relevantes en el análisis básico (modo bruto).');
}
lines.push('');

// Variables de entorno y middleware
pushSection('Autenticación y Sesiones');
lines.push('- Revisión de referencias a NEXT_PUBLIC_* y claves secretas en el código.');
if (process.env.NEXT_PUBLIC_SUPABASE_URL) lines.push(`  - NEXT_PUBLIC_SUPABASE_URL definido`);
if (process.env.SUPABASE_SERVICE_ROLE_KEY) lines.push(`  - SUPABASE_SERVICE_ROLE_KEY definido`);
if (process.env.GOOGLE_DRIVE_TOKEN) lines.push(`  - GOOGLE_DRIVE_TOKEN definido`);
if (process.env.GOOGLE_AI_KEY) lines.push(`  - GOOGLE_AI_KEY definido`);
lines.push('');

pushSection('Estado de implementación de Server/Client boundary');
lines.push('Este informe no puede ver directamente el código; verifica que todas las llamadas a Gemini/Drive estén en API Routes o Server Actions.');
lines.push('');

pushSection('Conclusiones rápidas');
lines.push('- Este escaneo inicial es un punto de partida. Requiere revisión manual de las secciones críticas para confirmar patrones exactos (JOINs con casting, RLS, permisos, prompts).');
lines.push('');

// Write out
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Auditoría local completada. Informe: ${path.resolve(OUT)}`);
