# Auditoria Real de Supabase

## Fecha

2026-04-26

## Proyecto auditado

- proyecto: `Evaluo-nuevo`
- ref: `ybssujvrptqwpfqrelzk`

## Resultado final

La base remota quedo alineada con el codigo activo en los puntos que antes eran fuente real de inconsistencia:

- schema principal
- tablas legacy
- transicion `subject_id -> materia_id`
- RLS y permisos

## Tablas activas despues de la consolidacion

- `profiles`
- `universidades`
- `carreras`
- `materias`
- `carrera_materias`
- `materiales`
- `recursos`
- `preguntas_banco`
- `historial_respuestas`
- `configuracion_ia`
- `resumenes`
- `resumen_votes`
- `user_favorites`

## Tablas eliminadas del remoto

- `career_subjects`
- `careers`
- `subjects`
- `configuracion`
- `configuracion_sistema`
- `contenidos`
- `pregunteros_ia`
- `progreso`

## Backup antes del borrado

- [manifest.json](C:/Users/usuario/Desktop/evaluo/backups/supabase-legacy-2026-04-26T20-42-14-085Z/manifest.json:1)

## Alineaciones hechas

### `profiles`

Ya incluye:

- `role`
- `last_subject_id`
- `last_subject_name`
- `active_subjects`
- `finished_subjects`
- `dashboard_analytics`

### `historial_respuestas`

Ya incluye:

- `peso`
- `fecha_respuesta`

### `recursos`

Ya incluye:

- `etiqueta`

### `preguntas_banco`

Ya incluye:

- `es_ia_generada`

### `resumenes`

Ya incluye:

- `materia_id`
- `subject_id`

### `user_favorites`

Ya incluye:

- `materia_id`
- `subject_id`

## Estado de RLS

RLS ya esta habilitado y versionado por migracion en las tablas activas principales.

Comportamiento verificado:

- anon puede leer `universidades` y `materias`
- anon no puede insertar en `profiles`
- anon no obtiene datos de `profiles`
- anon no obtiene datos de `configuracion_ia`
- anon no obtiene datos de `preguntas_banco`

## Riesgos que aun quedan

- falta revisar policies de storage
- `materias.carrera_id` sigue conviviendo con `carrera_materias`
- `resumenes` sigue siendo un modelo paralelo a `recursos`

## Conclusion

La base ya no esta en estado mezclado o caotico. Quedo suficientemente limpia y consistente para seguir desarrollando arriba sin cargar deuda estructural gruesa.
