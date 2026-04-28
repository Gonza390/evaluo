#!/usr/bin/env bash
set -euo pipefail

OUT="audit-report-$(date +%Y%m%d-%H%M%S).md"
echo "# Auditoría Local Evaluo" > "$OUT"
echo "Fecha: $(date)" >> "$OUT"
echo "" >> "$OUT"

echo "## Metadatos del entorno" >> "$OUT"
echo "- Node version: $(node -v 2>/dev/null || echo 'no node')" >> "$OUT"
if command -v npm >/dev/null 2>&1; then
  echo "- npm version: $(npm -v)" >> "$OUT"
else
  echo "- npm: no disponible" >> "$OUT"
fi
echo "- Paquete Next.js en package.json:" >> "$OUT"
if [ -f package.json ]; then
  NEXT_VER=$(node -e "try{console.log(require('./package.json').dependencies.next || require('./package.json').devDependencies.next)}catch(e){}")
  if [ -n "$NEXT_VER" ]; then
    echo "  next: $NEXT_VER" >> "$OUT"
  else
    echo "  next: no encontrado" >> "$OUT"
  fi
else
  echo "  package.json no encontrado" >> "$OUT"
fi
echo "" >> "$OUT"

echo "## Buscar JOINS y casting UUID" >> "$OUT"
echo "Buscando referencias de materia_id y casts a uuid en JOINs (SQL/SQL-like)" >> "$OUT"
rg -n --no-heading -S "JOIN|FROM|materia_id|::uuid|UUID|TEXT" . 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Revisión de explicaciones_ia (RLS)" >> "$OUT"
echo "Políticas de Row Level Security en explicaciones_ia" >> "$OUT"
rg -n --no-heading -S "(ALTER TABLE|CREATE TABLE).*explicaciones_ia|ROW LEVEL SECURITY|POLICY|POLITICA" . 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Integración Gemini 1.5 Flash" >> "$OUT"
echo "Buscar llamadas a Gemini o Google Generative AI fuera de API Routes/Server Actions" >> "$OUT"
rg -n --no-heading -S "Gemini|Generative|google.*generative|google(generative)?|Gemini 1\.5|Gemini" app pages src 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Prompts de Gemini (seguridad)" >> "$OUT"
rg -n --no-heading -S "prompt|system|instruction|Fall|fallback|internet" app pages src 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Lógica de Google Drive" >> "$OUT"
echo "Búsqueda de archivos y manejo de módulos (p. ej. M1-2)" >> "$OUT"
rg -n --no-heading -S "drive|google|files.list|getFiles|children|M1-2|M1-2|module" src app pages 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Manejo de errores en Drive y estructura de carpetas" >> "$OUT"
rg -n --no-heading -S "Drive|drive|folder|carpeta|accessible|not found|not exist|no access|exists" src app pages 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Autenticación y Sesiones" >> "$OUT"
echo "Variables de entorno (PUBLIC vs SECRET)" >> "$OUT"
rg -n --no-heading -S "process.env|NEXT_PUBLIC|SUPABASE_SERVICE_ROLE_KEY|GOOGLE_DRIVE_TOKEN|GOOGLE_AI_KEY" src app pages 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Middleware y Rutas protegidas" >> "$OUT"
rg -n --no-heading -S "middleware|/admin|premium|protect|auth|authorization" src app pages 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Rendimiento y UX: Loading" >> "$OUT"
rg -n --no-heading -S "Loading|loading|isLoading|startTransition|Suspense" src app pages 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Visor de PDF en móvil" >> "$OUT"
rg -n --no-heading -S "pdf|PDF|iframe|embed|viewer|mobile" src app pages 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "## Build: TypeScript y TSConfig" >> "$OUT"
if [ -f tsconfig.json ]; then
  echo "- tsconfig.json presente" >> "$OUT"
  echo "- compilerOptions presentes en tsconfig.json" >> "$OUT"
  COMP_OPTIONS=$(node -e "try{ console.log(JSON.stringify(require('./tsconfig.json').compilerOptions)); } catch(e){}")
  if [ -n "$COMP_OPTIONS" ]; then
    echo "  compilerOptions: $COMP_OPTIONS" >> "$OUT"
  fi
else
  echo "- tsconfig.json no encontrado" >> "$OUT"
fi
echo "" >> "$OUT"

echo "## Resumen y recomendaciones" >> "$OUT"
echo "Este informe es interactivo: revisa cada sección y añade parches concretos." >> "$OUT"
echo "" >> "$OUT"

echo "Reporte generado en: $OUT" >> "$OUT"
echo "=== Fin de auditoría local ===" >> "$OUT"

echo "Auditoría local completada. Informe: $OUT"
