# Correcciones de carga PDF-first, demo e historial de migraciones

## Comportamiento

- PDF-first registra universidad, carrera y materia como `null`. Una materia de origen sin contexto académico ya no impide cargar el PDF privado. Su intención se conserva como `intended_materia_id` en el evento `pdf_uploaded`; la asociación real continúa a cargo del flujo de contexto académico.
- El material de demo no monta el prompt de fecha de examen. Las acciones del prompt rechazan identificadores no UUID antes de crear el cliente de Auth o consultar datos; para UUID válidos conservan autenticación y filtro de propietario.
- Se renombró `20261002204500_study_error_first_onboarding.sql` a `20261002210634_study_error_first_onboarding.sql`, alineando el archivo con el historial de producción. No se ejecutó SQL de escritura ni se modificó el historial remoto.

## Comparación de la migración

El 6 de octubre de 2026 se consultaron los statements registrados en `supabase_migrations.schema_migrations` del proyecto Evaluo. El MD5 del SQL sin espacios es `ede66e6620752f282eb45988337114e3`, idéntico al archivo local. La versión remota es `20261002210634`, nombre `study_error_first_onboarding`. El cambio es únicamente de nombre de archivo, sin alteraciones de esquema, permisos ni datos.

Esta corrección alinea esa migración específica; no afirma que todo el historial del repositorio esté reconciliado. No ejecutar `db push --include-all` sin revisar previamente las demás diferencias.

## Verificación y revisión

- Lint y todas las suites de `npm test` pasaron.
- `npm run build` pasó, incluida la comprobación TypeScript y generación de las 80 páginas, con acceso de red. Mantiene avisos sobre Edge Runtime y una descarga de fuente dinámica para `✓` que devolvió 400; no bloqueó la compilación.
- Prueba funcional aislada de las acciones reales, con dependencias de red simuladas: carga con y sin materia de origen, registro privado y del propietario, encolado, rechazo de `demo-material` y otros IDs inválidos sin llamadas a Auth/DB, y conservación de autenticación para UUID válidos. Sin escrituras remotas.
- Revisión Security: conserva cuotas, firma PDF, límites de páginas, ownership del archivo, autenticación y filtros por propietario. No debilita el trigger académico ni permisos/RLS.
- Gate CTO: reconciliación aprobada mediante nombre local; no se requiere migración de esquema ni reparación de producción.
- No se pudo realizar una carga autenticada real en navegador porque no hay sesión local disponible.
- QA: `LISTO CON RIESGOS`, por la limitación de prueba autenticada en navegador indicada arriba.

Los cambios de aplicación requieren publicación para corregir producción.
