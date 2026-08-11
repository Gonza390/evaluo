# Evaluo

## Resumen

Evaluo es una plataforma web para estudiantes universitarios orientada a tres objetivos:

- descubrir su carrera y materias de forma simple
- estudiar con recursos, resúmenes y materiales ordenados por materia
- practicar con simuladores, seguimiento de progreso y explicaciones asistidas por IA

Hoy el sistema combina una experiencia pública de exploración con una experiencia autenticada más profunda para dashboard, favoritos, historial y simuladores.

## Stack actual

- `Next.js 16` con App Router
- `React 19`
- `TypeScript`
- `Supabase`
- `Tailwind CSS`
- `server actions`
- `Google Analytics 4`
- `GTM` y `Microsoft Clarity` como terceros opcionales
- `Gemini` y `Groq` en flujos de IA

## Estado actual del producto

El proyecto ya está más allá de una demo inicial. Hoy tiene:

- home pública y flujo de login
- exploración académica por universidad, carrera y materia
- dashboard del alumno
- visor de recursos y PDFs
- simuladores con persistencia local, reanudación y tracking
- panel `/administrador` con módulos operativos
- pipeline IA para preguntas y explicaciones
- analítica propia en Supabase
- integración de `GA4` para marketing y adquisición

## Cómo funciona el producto

### Flujo público principal

1. el usuario entra a `/`
2. explora desde `/explorar` o entra directo a una materia o simulador
3. puede navegar universidades, carreras, materias y recursos visibles
4. si entra a un simulador, puede empezar a practicar
5. si necesita continuidad, favoritos o progreso persistido, se le empuja a login

### Flujo del alumno autenticado

1. inicia sesión en `/login`
2. llega a `/dashboard`
3. retoma materia, simulador o recurso reciente
4. guarda favoritos y progreso
5. recibe radar de confianza y continuidad de estudio

### Flujo admin

1. entra a `/administrador`
2. gestiona biblioteca, usuarios, analytics, logs e IA
3. sube materiales o recursos
4. genera preguntas o explicaciones
5. monitorea actividad de materias, simuladores y panel operativo

## Rutas principales

- `/`
  landing pública
- `/login`
  autenticación con email o Google
- `/auth/callback`
  callback OAuth de Supabase
- `/dashboard`
  dashboard del alumno
- `/explorar`
  búsqueda principal de carreras y entrada a materias
- `/universidad/[id]`
  detalle de universidad
- `/materias`
  listado de materias por carrera
- `/explorar/materia/[id]`
  vista principal de materia
- `/recursos/[id]`
  visor de recurso o PDF
- `/simulador/[materia_id]/[parcial]`
  simulador regular
- `/simulador/errores/[materia_id]`
  simulador de errores
- `/administrador`
  panel administrativo
- `/pricing`
  propuesta comercial / premium

## Arquitectura general

### Frontend

La app usa App Router con una shell cliente común.

Piezas importantes:

- [app/layout.tsx](C:/Users/usuario/Desktop/evaluo/app/layout.tsx:1)
- [components/ClientLayout.tsx](C:/Users/usuario/Desktop/evaluo/components/ClientLayout.tsx:1)
- [components/AnalyticsTracker.tsx](C:/Users/usuario/Desktop/evaluo/components/AnalyticsTracker.tsx:1)
- [components/GoogleAnalytics.tsx](C:/Users/usuario/Desktop/evaluo/components/GoogleAnalytics.tsx:1)
- [hooks/useUser.tsx](C:/Users/usuario/Desktop/evaluo/hooks/useUser.tsx:1)

### Shell y layout

`ClientLayout` decide:

- navbar lateral
- bottom nav móvil
- footer
- analytics de terceros
- tracker interno

La app ya está optimizada para no cargar ciertos terceros en todas las superficies indiscriminadamente.

### Sesión y acceso

La sesión se resuelve con Supabase.

Capas principales:

- `UserProvider` para cliente
- `createClientServer()` para server components y actions
- `createAdminClient()` para backoffice y procesos privilegiados

La autorización admin ya fue unificada en:

- [lib/access-control.ts](C:/Users/usuario/Desktop/evaluo/lib/access-control.ts:1)

Esa capa:

- resuelve rol
- cachea lookup de `profiles.role` por request
- evita repetir validaciones dispersas

## Roles y permisos

Un usuario admin se reconoce por:

- `app_metadata.role === 'admin'`
- o `profiles.role === 'admin'`

La lógica de resolución vive hoy en:

- [lib/access-control.ts](C:/Users/usuario/Desktop/evaluo/lib/access-control.ts:1)
- [lib/admin-users.ts](C:/Users/usuario/Desktop/evaluo/lib/admin-users.ts:1)

## Cómo se conecta todo con la base

### Catálogo académico

- `universidades`
- `carreras`
- `materias`
- `carrera_materias`

Hoy la relación importante es `carrera_materias`, no `materias.carrera_id`, aunque este último aún existe por compatibilidad.

Además, ya se limpiaron duplicados nominales de materias y existe soporte de alias para redirección:

- [lib/materia-aliases.ts](C:/Users/usuario/Desktop/evaluo/lib/materia-aliases.ts:1)

### Perfil y dashboard

- `profiles`
- `user_favorites`

El dashboard persiste:

- última materia
- materias activas
- materias finalizadas
- analítica básica del alumno

### Recursos y estudio

- `materiales`
- `recursos`
- `resumenes`
- `resumen_votes`
- `resource_votes`
- `resource_views`

### Simulador

- `preguntas_banco`
- `historial_respuestas`
- `simulator_attempts`
- `simulator_attempt_wrong_questions`
- `premium_question_sets`

### IA

- `configuracion_ia`
- `rag_document_chunks`
- `rag_explanations_cache`
- `rag_generation_logs`
- `rag_question_stats`

## Pipeline de IA

Hoy la IA tiene dos grandes usos:

### Generación de preguntas

Se usa para transformar materiales en preguntas del simulador.

Flujo:

1. admin carga material
2. se procesa el archivo
3. se extrae texto
4. se aplica prompt de IA
5. se normalizan preguntas
6. se insertan en `preguntas_banco`

### Explicaciones de preguntas

El sistema ya tiene cache persistente de explicaciones por pregunta.

Componentes clave:

- [app/actions.ts](C:/Users/usuario/Desktop/evaluo/app/actions.ts:1)
- [lib/simulator-explanation-warmup.ts](C:/Users/usuario/Desktop/evaluo/lib/simulator-explanation-warmup.ts:1)

Hoy existe:

- generación on demand
- cache en `rag_explanations_cache`
- warmup incremental priorizado
- panel admin para disparar generación manual

La priorización del warmup hoy sigue este orden:

1. materias más usadas
2. parciales más realizados
3. preguntas con más errores
4. cobertura complementaria

## Simulador

El simulador sigue siendo uno de los núcleos del producto.

Archivo principal:

- [components/simulador/SimuladorExamen.tsx](C:/Users/usuario/Desktop/evaluo/components/simulador/SimuladorExamen.tsx:1)

Estado actual:

- carga preguntas regulares, premium, demo y errores
- guarda progreso local
- permite resume
- registra rating
- dispara login gate
- comparte resultados
- carga explicaciones de errores

Refactors ya hechos:

- tracking extraído a [lib/simulator-analytics.ts](C:/Users/usuario/Desktop/evaluo/lib/simulator-analytics.ts:1)
- persistencia local extraída a [lib/simulator-persistence.ts](C:/Users/usuario/Desktop/evaluo/lib/simulator-persistence.ts:1)

Deuda todavía viva:

- el componente sigue siendo grande
- faltan hooks separados para engine, timer y navegación

## Analytics

El sistema hoy tiene dos capas:

### Analytics propios

Se guardan en `analytics_events` vía:

- [components/AnalyticsTracker.tsx](C:/Users/usuario/Desktop/evaluo/components/AnalyticsTracker.tsx:1)
- [app/api/analytics/track/route.ts](C:/Users/usuario/Desktop/evaluo/app/api/analytics/track/route.ts:1)

Esto cubre:

- `page_view`
- `session_ping`
- `login_success`
- errores cliente
- eventos de materia
- eventos de simulador

La metadata ya está saneada por whitelist en:

- [lib/analytics-metadata.ts](C:/Users/usuario/Desktop/evaluo/lib/analytics-metadata.ts:1)

Además, el backend ya filtra bots básicos por user-agent.

### Google Analytics 4

Se agregó `GA4` para marketing y adquisición.

Componentes:

- [components/GoogleAnalytics.tsx](C:/Users/usuario/Desktop/evaluo/components/GoogleAnalytics.tsx:1)

Variable esperada:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Objetivo:

- medir tráfico, adquisición y comportamiento alto nivel
- convivir con el analytics propio más detallado

### Terceros opcionales

- `GTM`
- `Clarity`

Viven en:

- [components/ThirdPartyAnalytics.tsx](C:/Users/usuario/Desktop/evaluo/components/ThirdPartyAnalytics.tsx:1)

## Dashboard del alumno

El dashboard vive en:

- [components/dashboard/dashboard-content.tsx](C:/Users/usuario/Desktop/evaluo/components/dashboard/dashboard-content.tsx:1)

Mejoras recientes:

- modal de añadir materia con búsqueda bajo demanda
- menos carga inicial de catálogo
- mejoras mobile
- continuidad de estudio, favoritos y radar de confianza

Todavía queda:

- bootstrap server-first
- diferir más módulos secundarios
- seguir reduciendo `useEffect` cliente

## Explorar y materia

### Explorar

La experiencia de `/explorar` hoy está más enfocada en carreras y búsqueda simple.

Archivos:

- [app/explorar/page.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/page.tsx:1)
- [app/explorar/explorar-client.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/explorar-client.tsx:1)
- [app/explorar/data.ts](C:/Users/usuario/Desktop/evaluo/app/explorar/data.ts:1)
- [lib/data/catalog.ts](C:/Users/usuario/Desktop/evaluo/lib/data/catalog.ts:1)

Se consolidó una capa compartida de catálogo para reducir duplicación entre cliente y server.

### Materia

La materia es la vista central del valor del producto.

Archivos:

- [app/explorar/materia/[id]/page.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/materia/[id]/page.tsx:1)
- [app/explorar/materia/[id]/materia-content.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/materia/[id]/materia-content.tsx:1)

Capacidades:

- tabs de contenido
- resúmenes
- recursos
- pregunteros / simulador
- favoritos
- tracking contextual

## Admin

La superficie admin real vive en:

- [app/administrador/page.tsx](C:/Users/usuario/Desktop/evaluo/app/administrador/page.tsx:1)
- [app/administrador/actions.ts](C:/Users/usuario/Desktop/evaluo/app/administrador/actions.ts:1)
- [app/administrador/shared-actions.ts](C:/Users/usuario/Desktop/evaluo/app/administrador/shared-actions.ts:1)
- [app/administrador/biblioteca-actions.ts](C:/Users/usuario/Desktop/evaluo/app/administrador/biblioteca-actions.ts:1)

Módulos principales:

- resumen del sistema
- analytics
- usuarios
- biblioteca
- logs
- IA

Capacidades recientes:

- warmup de explicaciones IA desde admin
- ranking de explicaciones
- estadísticas de materia y simulador
- métricas de tráfico directo a materia

## Seguridad actual

RLS sigue activo sobre tablas principales.

Además, el sistema hoy ya tiene:

- autorización admin centralizada
- cache de rol por request
- metadata analytics saneada
- filtro básico de bots

Puntos todavía a mejorar:

- rate limiting distribuido real
- protección más uniforme por middleware
- revisión de storage policies del bucket `biblioteca`

## Estado de calidad y documentación

Chequeos recurrentes:

- `npm run lint`

Documentos relacionados:

- [BASE_DATOS_EVALUO.md](C:/Users/usuario/Desktop/evaluo/BASE_DATOS_EVALUO.md:1)
- [MODELO_TABLAS_EVALUO.md](C:/Users/usuario/Desktop/evaluo/MODELO_TABLAS_EVALUO.md:1)
- [SUPABASE_AUDITORIA_REAL.md](C:/Users/usuario/Desktop/evaluo/SUPABASE_AUDITORIA_REAL.md:1)

## Deuda técnica actual

### Alta prioridad

- seguir partiendo `SimuladorExamen`
- hacer bootstrap server-first del dashboard
- normalizar por completo encoding/copy en algunas pantallas
- seguir unificando fuentes de verdad del catálogo

### Media prioridad

- decidir futuro de `materias.carrera_id`
- decidir si `resumenes` y `recursos` convergen
- fortalecer analítica de links compartidos del simulador
- mejorar filtros y dashboards de adquisición

## Línea recomendada para seguir creciendo

1. mantener una sola fuente de verdad por concepto
2. seguir moviendo lógica transversal fuera de componentes gigantes
3. tocar schema solo por migraciones
4. no reintroducir duplicados nominales de materias
5. separar claramente analytics de producto y analytics de marketing
