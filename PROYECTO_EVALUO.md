# Evaluo

## Resumen

Evaluo es una plataforma web para estudiantes universitarios enfocada en:

- explorar universidades, carreras y materias
- estudiar con recursos por materia
- practicar con simuladores
- administrar contenido academico desde un panel interno

Stack actual:

- `Next.js 16`
- `React 19`
- `Supabase`
- `Tailwind`
- `server actions`
- `Groq` para extraccion de preguntas

## Estado actual del proyecto

Hoy el sistema ya esta bastante consolidado como MVP tecnico:

- se limpiaron duplicados y archivos legacy
- se consolido una sola version activa por flujo importante
- se alineo el schema remoto de Supabase con el codigo
- se eliminaron tablas legacy remotas
- se activo RLS sobre las tablas principales
- se mejoro la navegacion y se redujo trabajo duplicado de sesion

## Como funciona el producto

### Flujo principal

1. el usuario entra a la home
2. inicia sesion con Google o email
3. navega por universidad, carrera y materia
4. consulta recursos o resumenes
5. entra al simulador
6. guarda progreso y actividad en su perfil

### Flujo admin

1. un admin entra al panel `/admin`
2. gestiona universidades, carreras y materias
3. sube un PDF al bucket `biblioteca`
4. el archivo se registra en `materiales`
5. se crea el recurso visible en `recursos`
6. si es preguntero, se procesa con IA y salen preguntas a `preguntas_banco`

## Rutas principales

- `/`
  home publica
- `/login`
  autenticacion
- `/auth/callback`
  callback OAuth de Supabase
- `/dashboard`
  panel del usuario
- `/explorar`
  entrada de exploracion
- `/universidad/[id]`
  detalle de universidad
- `/materias`
  listado por carrera
- `/explorar/materia/[id]`
  detalle principal de materia
- `/recursos/[id]`
  recursos de una materia
- `/simulador/[materia_id]/[parcial]`
  simulador de examen
- `/admin`
  panel admin

## Arquitectura general

### Frontend

La app usa App Router.

Piezas importantes:

- `app/layout.tsx`
- `components/ClientLayout.tsx`
- `proxy.ts`
- `hooks/useUser.tsx`

### Sesion

La sesion se resuelve con Supabase.

Capas:

- `proxy.ts` protege rutas sensibles
- `UserProvider` entrega usuario en cliente
- server components y server actions usan `createClientServer`

Rutas protegidas hoy:

- `/dashboard`
- `/simulador`
- `/admin`

### Roles

Un usuario admin se reconoce por:

- `app_metadata.role === 'admin'`
- o `profiles.role === 'admin'`

La logica vive en:

- `lib/roles.ts`
- `lib/auth.ts`

## Como se conecta todo con la base

### Catalogo academico

- `universidades`
- `carreras`
- `materias`
- `carrera_materias`

Estas tablas sostienen la navegacion principal.

### Perfil y dashboard

- `profiles`

Guarda:

- rol
- datos personales
- ultima materia
- materias activas y finalizadas
- analitica basica del dashboard

### Recursos y estudio

- `materiales`
- `recursos`
- `resumenes`
- `resumen_votes`
- `user_favorites`

### Simulador

- `preguntas_banco`
- `historial_respuestas`

### IA

- `configuracion_ia`

## Seguridad actual

RLS ya esta habilitado en las tablas activas principales.

Resumen de permisos:

- lectura publica para catalogo y contenido visible
- lectura autenticada para `preguntas_banco`
- datos del usuario solo para su propia sesion o admin
- escritura admin para tablas operativas y de backoffice

Hay una proteccion extra sobre `profiles.role` para impedir que un usuario normal se vuelva admin editando su perfil.

## Pipeline de IA

La pipeline vigente es una sola:

- `app/admin/actions.ts`

Funcionamiento:

1. descarga el PDF desde storage
2. extrae texto
3. busca el prompt en `configuracion_ia`
4. llama a Groq
5. normaliza preguntas
6. evita duplicados
7. inserta en `preguntas_banco`

La function vieja de Supabase ya fue retirada del flujo activo.

## Archivos clave del sistema

- [app/layout.tsx](C:/Users/usuario/Desktop/evaluo/app/layout.tsx:1)
- [components/ClientLayout.tsx](C:/Users/usuario/Desktop/evaluo/components/ClientLayout.tsx:1)
- [proxy.ts](C:/Users/usuario/Desktop/evaluo/proxy.ts:1)
- [hooks/useUser.tsx](C:/Users/usuario/Desktop/evaluo/hooks/useUser.tsx:1)
- [app/login/page.tsx](C:/Users/usuario/Desktop/evaluo/app/login/page.tsx:1)
- [app/auth/callback/route.ts](C:/Users/usuario/Desktop/evaluo/app/auth/callback/route.ts:1)
- [app/dashboard/page.tsx](C:/Users/usuario/Desktop/evaluo/app/dashboard/page.tsx:1)
- [components/dashboard/dashboard-content.tsx](C:/Users/usuario/Desktop/evaluo/components/dashboard/dashboard-content.tsx:1)
- [app/explorar/page.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/page.tsx:1)
- [app/universidad/[id]/page.tsx](C:/Users/usuario/Desktop/evaluo/app/universidad/[id]/page.tsx:1)
- [app/explorar/materia/[id]/page.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/materia/[id]/page.tsx:1)
- [app/explorar/materia/[id]/materia-content.tsx](C:/Users/usuario/Desktop/evaluo/app/explorar/materia/[id]/materia-content.tsx:1)
- [app/recursos/[id]/page.tsx](C:/Users/usuario/Desktop/evaluo/app/recursos/[id]/page.tsx:1)
- [app/simulador/[materia_id]/[parcial]/page.tsx](C:/Users/usuario/Desktop/evaluo/app/simulador/[materia_id]/[parcial]/page.tsx:1)
- [components/simulador/SimuladorExamen.tsx](C:/Users/usuario/Desktop/evaluo/components/simulador/SimuladorExamen.tsx:1)
- [app/admin/page.tsx](C:/Users/usuario/Desktop/evaluo/app/admin/page.tsx:1)
- [app/admin/actions.ts](C:/Users/usuario/Desktop/evaluo/app/admin/actions.ts:1)
- [app/actions.ts](C:/Users/usuario/Desktop/evaluo/app/actions.ts:1)
- [types/supabase.ts](C:/Users/usuario/Desktop/evaluo/types/supabase.ts:1)
- [BASE_DATOS_EVALUO.md](C:/Users/usuario/Desktop/evaluo/BASE_DATOS_EVALUO.md:1)

## Validacion actual

Chequeos locales:

- `npm run lint`: OK
- `npm run test`: OK
- rutas locales: `/`, `/login`, `/explorar`, `/dashboard` responden `200`

Chequeo remoto de RLS:

- `universidades` publica: OK
- `materias` publica: OK
- `profiles` anon: bloqueado
- `configuracion_ia` anon: bloqueado
- `preguntas_banco` anon: sin acceso a datos
- insert anon en `profiles`: bloqueado por RLS

## Lo que todavia queda por mejorar

### Tecnico

- resolver el `spawn EPERM` del entorno al final de `next build`
- revisar policies del bucket `biblioteca`
- decidir futuro de `materias.carrera_id`
- decidir si `resumenes` se integra con `recursos`

### Producto

- mas QA con datos reales
- ampliar tests utiles
- optimizar experiencia del admin
- seguir reduciendo componentes cliente innecesarios

## Documentos de referencia

- [BASE_DATOS_EVALUO.md](C:/Users/usuario/Desktop/evaluo/BASE_DATOS_EVALUO.md:1)
- [MODELO_TABLAS_EVALUO.md](C:/Users/usuario/Desktop/evaluo/MODELO_TABLAS_EVALUO.md:1)
- [SUPABASE_AUDITORIA_REAL.md](C:/Users/usuario/Desktop/evaluo/SUPABASE_AUDITORIA_REAL.md:1)

## Criterio para seguir avanzando

Si vas a seguir creciendo el sistema, el orden sano ahora es:

1. mantener una sola fuente de verdad por concepto
2. tocar schema solo via migraciones
3. no reintroducir tablas o naming legacy
4. validar permisos y UX al mismo tiempo
