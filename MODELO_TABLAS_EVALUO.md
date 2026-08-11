# Modelo de Tablas Evaluo

## Objetivo

Este documento define el modelo de datos que se toma como referencia para seguir desarrollando Evaluo con una base limpia, estable y entendible.

## Decisiones de modelo

### Materia

La entidad academica oficial es:

- `materias`

No se toma `subjects` como modelo vigente.

### Relacion carrera-materia

La relacion oficial elegida es:

- `carrera_materias`

Motivo:

- permite reusar una materia en mas de una carrera
- evita duplicar materias por catalogo

Compatibilidad actual:

- `materias.carrera_id` todavia existe
- la fuente de verdad objetivo sigue siendo `carrera_materias`

### Usuario

La tabla oficial de usuario es:

- `profiles`

Responsabilidades:

- perfil
- rol admin
- dashboard persistido
- estado academico visible del usuario

### Simulador

La tabla oficial de preguntas es:

- `preguntas_banco`

Y la tabla de trazabilidad es:

- `historial_respuestas`

### Materiales y recursos

Se mantienen dos capas distintas:

- `materiales`
  origen de archivos y pipeline admin
- `recursos`
  catalogo final navegable por el usuario

### Resumenes

`resumenes` sigue vivo por compatibilidad funcional.

Estado actual:

- ya tiene `materia_id`
- `subject_id` ya fue eliminado del schema activo

Objetivo futuro:

- decidir si queda como tabla separada
- o si se absorbe dentro del modelo de `recursos`

### Favoritos

`user_favorites` sigue siendo la tabla de favoritos.

Estado actual:

- ya tiene `materia_id`
- `subject_id` ya fue eliminado del schema activo

## Tablas que forman parte del sistema vigente

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

## Tablas legacy ya retiradas

- `careers`
- `career_subjects`
- `subjects`
- `configuracion`
- `configuracion_sistema`
- `contenidos`
- `pregunteros_ia`
- `progreso`

## Compatibilidades que todavia existen

- `materias.carrera_id`
- naming legacy de dashboard como `last_subject_id`

## Linea tecnica recomendada para seguir creciendo

1. sostener `materia_id` como nombre oficial en todo codigo nuevo
2. decidir si `materias.carrera_id` se elimina a futuro
3. consolidar `resumenes` con `recursos` o mantenerlo como modulo claro
4. endurecer RLS y permisos remotos
