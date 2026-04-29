# Base de Datos Evaluo

## Resumen

Este documento describe el estado real de la base de datos de Evaluo despues de la limpieza, alineacion de schema y endurecimiento de RLS hechos el 2026-04-26.

Hoy la base ya esta alineada con el codigo activo en estos puntos:

- `profiles` soporta rol y estado del dashboard
- `historial_respuestas` soporta `peso` y `fecha_respuesta`
- `recursos` soporta `etiqueta`
- `preguntas_banco` soporta `es_ia_generada`
- `resumenes` y `user_favorites` ya tienen `materia_id`
- RLS ya esta activo sobre las tablas principales

## Como esta organizada la base

La base sostiene 6 bloques:

1. usuarios y permisos
2. catalogo academico
3. materiales y almacenamiento
4. recursos y resumenes
5. simulador e historial
6. configuracion de IA

## Tablas core

### `profiles`

Es la tabla central del usuario.

Campos importantes:

- `id`
- `nombre`
- `whatsapp`
- `universidad_id`
- `carrera_id`
- `role`
- `last_subject_id`
- `last_subject_name`
- `active_subjects`
- `finished_subjects`
- `dashboard_analytics`
- `updated_at`
- `creado_at`

Responsabilidades:

- perfil del estudiante
- rol admin
- persistencia del dashboard
- estado academico visible del usuario

### `universidades`

Catalogo principal de instituciones.

Campos:

- `id`
- `nombre`

### `carreras`

Catalogo principal de carreras.

Campos:

- `id`
- `nombre`
- `universidad_id`
- `created_at`

### `materias`

Entidad academica principal.

Campos:

- `id`
- `nombre`
- `slug`
- `carrera_id`
- `es_general`

Nota:

- `carrera_id` sigue existiendo por compatibilidad
- la relacion oficial objetivo queda en `carrera_materias`

### `carrera_materias`

Relacion carrera-materia.

Campos:

- `id`
- `carrera_id`
- `materia_id`
- `prioridad`

Decision tecnica:

- esta es la fuente de verdad objetivo para vincular carreras y materias

### `materiales`

Representa la carga fuente de archivos desde admin.

Campos:

- `id`
- `materia_id`
- `titulo`
- `tipo`
- `parcial`
- `archivo_url`
- `creado_at`

Uso:

- backoffice
- origen del PDF o material cargado
- insumo para la pipeline de IA

### `recursos`

Catalogo consumible por la app.

Campos:

- `id`
- `nombre`
- `tipo`
- `url_archivo`
- `materia_id`
- `carrera_id`
- `universidad_id`
- `etiqueta`
- `paginas`
- `creado_at`

Uso:

- biblioteca visible al usuario
- recursos por materia

### `preguntas_banco`

Banco oficial del simulador.

Campos:

- `id`
- `materia_id`
- `material_id`
- `enunciado`
- `opciones`
- `respuesta_correcta`
- `parcial`
- `universidad_id`
- `carrera_id`
- `es_general`
- `es_ia_generada`
- `creado_at`

Uso:

- simulador
- preguntas generadas desde admin

### `historial_respuestas`

Registro de respuestas del usuario.

Campos:

- `id`
- `usuario_id`
- `pregunta_id`
- `materia_id`
- `es_correcta`
- `peso`
- `fecha_intento`
- `fecha_respuesta`

Uso:

- historial del simulador
- base para futura personalizacion

### `configuracion_ia`

Configuracion viva de la pipeline IA.

Campos:

- `id`
- `prompt_sistema`
- `updated_at`

Uso:

- prompt editable desde admin

## Tablas de compatibilidad activa

### `resumenes`

Sigue siendo usada por la vista de materia.

Campos:

- `id`
- `materia_id`
- `module_id`
- `title`
- `author_name`
- `file_url`
- `score`
- `created_at`

Estado:

- el codigo ya consulta por `materia_id`
- `subject_id` fue eliminado en la limpieza final del 28/04/2026

### `resumen_votes`

Guarda votos de resumenes.

Campos:

- `id`
- `user_id`
- `resumen_id`
- `vote_type`

Nota:

- `vote_type` es numerico
- el codigo ya usa `1` y `-1`

### `user_favorites`

Favoritos del usuario.

Campos:

- `id`
- `user_id`
- `materia_id`
- `created_at`

Estado:

- el codigo ya usa `materia_id`
- `subject_id` fue eliminado en la limpieza final del 28/04/2026

## Como se conectan las tablas

### Flujo de navegacion academica

1. `universidades`
2. `carreras`
3. `carrera_materias`
4. `materias`

### Flujo de contenido

1. admin sube archivo a bucket `biblioteca`
2. se registra en `materiales`
3. se crea entrada visible en `recursos`
4. si es preguntero, la IA genera preguntas en `preguntas_banco`

### Flujo del simulador

1. el usuario entra a una materia
2. abre `/simulador/[materia_id]/[parcial]`
3. el sistema lee `preguntas_banco`
4. cada respuesta se registra en `historial_respuestas`

### Flujo del dashboard

1. el usuario inicia sesion
2. el dashboard lee y escribe en `profiles`
3. ahi quedan ultima materia, materias activas, materias finalizadas y analitica basica

### Flujo de favoritos y resumenes

1. la vista de materia lee `resumenes`
2. el usuario vota en `resumen_votes`
3. el usuario guarda materias en `user_favorites`

## RLS y permisos

RLS ya esta habilitado en las tablas activas principales.

### Lectura publica

Quedaron publicas para lectura:

- `universidades`
- `carreras`
- `materias`
- `carrera_materias`
- `recursos`
- `resumenes`

Esto permite:

- home
- buscadores
- exploracion publica
- pagina de universidad
- pagina de materia
- recursos visibles

### Lectura autenticada

`preguntas_banco` requiere usuario autenticado para lectura.

Esto acompana al `proxy.ts`, que protege `/simulador`.

### Datos privados por usuario

Estas tablas quedaron restringidas al duenio de la fila o admin:

- `profiles`
- `historial_respuestas`
- `user_favorites`
- `resumen_votes`

### Solo admin

Estas tablas quedaron reservadas a admin para escritura, y algunas tambien para lectura:

- `materiales`
- `configuracion_ia`
- escritura sobre `universidades`
- escritura sobre `carreras`
- escritura sobre `materias`
- escritura sobre `carrera_materias`
- escritura sobre `recursos`
- escritura sobre `resumenes`
- escritura sobre `preguntas_banco`

### Funcion helper

La logica admin vive en:

- `public.current_user_is_admin()`

Esa funcion considera:

- `auth.jwt().app_metadata.role`
- o `profiles.role`

### Proteccion extra en profiles

Existe un trigger:

- `profiles_protect_role`

Su objetivo es evitar que un usuario normal se autoasigne rol admin al escribir su propio perfil.

## Verificaciones hechas

Desde anon contra Supabase:

- `universidades` sigue legible
- `materias` sigue legible
- `profiles` ya no expone filas
- `configuracion_ia` ya no expone filas
- `preguntas_banco` ya no devuelve datos a anon
- insertar en `profiles` sin sesion devuelve error RLS

## Tablas legacy eliminadas

Estas tablas fueron respaldadas y luego borradas del remoto:

- `career_subjects`
- `careers`
- `subjects`
- `configuracion`
- `configuracion_sistema`
- `contenidos`
- `pregunteros_ia`
- `progreso`

Backup local:

- [manifest.json](C:/Users/usuario/Desktop/evaluo/backups/supabase-legacy-2026-04-26T20-42-14-085Z/manifest.json:1)

## Migraciones aplicadas

- `20260426143000_profiles_admin_dashboard.sql`
- `20260426175000_runtime_schema_alignment.sql`
- `20260426211500_drop_legacy_tables_and_subject_aliases.sql`
- `20260426213000_finalize_materia_id_transition.sql`
- `20260426221500_enable_rls_and_policies.sql`

## Deuda tecnica que todavia queda

- `materias.carrera_id` convive con `carrera_materias`
- `resumenes` sigue siendo un modelo paralelo a `recursos`
- `subject_id` ya no existe en `resumenes` ni `user_favorites`
- falta revisar storage policies del bucket `biblioteca`

## Siguiente recomendacion tecnica

El siguiente paso sano ya no es limpiar basura estructural, sino endurecer lo que queda:

1. revisar policies del bucket `biblioteca`
2. decidir si `materias.carrera_id` se retira
3. decidir si `resumenes` se absorbe en `recursos`
4. seguir reduciendo compatibilidad legacy
