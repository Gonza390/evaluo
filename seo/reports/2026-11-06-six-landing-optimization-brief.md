# Evaluo — auditoría SEO de seis páginas con ventana de 72 horas

**Fecha de auditoría:** 2026-11-06. **Rama de trabajo:** `master`. **Estado:** análisis y backlog preparados; ninguna de las seis páginas se edita antes de cumplir el mínimo de 72 horas desde su último cambio relevante. **Producción:** no modificar sin autorización expresa y controles completos.

## Fuentes y límites

- Google Search Console conectado: propiedad `sc-domain:evaluoapp.com`, datos consolidados visibles entre 2026-10-31 y 2026-11-03. Las consultas no visibles o anonimizadas no deben inferirse. Un CTR de 0 con pocas impresiones no es señal suficiente para reescribir títulos.
- GitHub `Gonza390/evaluo`, ramas `main` y `master`. Verificar **al ejecutar cada bloque** cuál fue la última edición real de las páginas y componentes compartidos. Una nueva edición reinicia la espera de 72 horas.
- Investigación de intención y fuentes: https://ubaxxi.uba.ar/estudiantes/ ; https://www.unlam.edu.ar/calendario-academico/ ; https://www.unlam.edu.ar/curso-de-ingreso/ ; https://sun.usac.edu.gt/index.php/herramientas/ ; comparación editorial de páginas visibles para `ia para estudiar` (p. ej. https://wesolveapp.com/es/ia-para-estudiar y https://mentoraia.com/mejor-ia-para-estudiar/). No copiar su contenido ni asumir que su posicionamiento está demostrado.
- La migración desde `evaluo.com.ar` hacia `evaluoapp.com` es reciente: interpretar métricas y cambios de ranking con cautela.
- A 2026-11-06, `master` y `main` divergen por el squash merge de reparación USAC. Comprobar y reconciliar la rama antes de futuras modificaciones; no sobrescribir ni revertir el hotfix de producción.

## Prioridades verificadas

| Primera fecha elegible orientativa* | URL | Impresiones | Clics | Posición media | Consultas observadas y acciones candidatas |
|---|---|---:|---:|---:|---|
| 2026-11-07 | `/pregunteros` | 13 | 3 | 7,0 | `pregunteros siglo 21`, `preguntero siglo 21`. Verificar la navegación de materias realmente disponibles y enlaces hacia práctica desde apuntes. No diluir búsquedas institucionales con un discurso genérico de IA. |
| 2026-11-07 | `/uba-xxi/parciales` | 9 | 0 | 14,1 | `parciales uba`, `uba parciales`, `ubaparciales`. Comprobar profundidad real de ejercicios, claridad del proceso de inscripción y distinción inequívoca de simulacros originales frente a evaluaciones oficiales; enlazar guía UBA XXI vigente. |
| 2026-11-08 | `/ia-para-estudiantes` | 16 | 0 | 8,4 | `ia para estudiar` (3 impresiones atribuibles, posición ~6,7). Mejor oportunidad: explicar en pocos pasos `PDF/DOCX propio → resumen → preguntas → corregir errores`, comparación responsable y límites reales del producto. No reescribir título solo por el CTR inicial. |
| 2026-11-08 | `/funciones/crear-mapa-mental-desde-pdf` | 7 | 0 | 4,7 | Search Console no desglosa consultas para esta URL. Revisar que el mapa mental se describa como función Premium, con ejemplo real, expectativas transparentes y alternativa de práctica disponible sin acceso Premium. Sin cambios precipitados de metadata. |
| 2026-11-08 | `/como-estudiar-ingreso-unlam` | 11 | 0 | 26,2 | Consultas desglosadas no disponibles. Confirmar materias según carrera, modelos de práctica y fechas oficiales del ingreso 2027; evitar tratar trámites cerrados como vigentes. En la primera instancia, el curso abarca julio–diciembre de 2026; la segunda cursa febrero–marzo de 2027. Verificar siempre contra la web oficial. |
| 2026-11-09 | `/es/paises/guatemala-pruebas-basicas-usac` | 23 | 0 | 19,3 | `pruebas basicas usac`, `temario examenes basicos usac`, `guias tematicas usac`. La URL fue recuperada en producción el 6/11. Verificar HTTP 200, canonical, sitemap e indexación antes de considerar otra edición. Comprobar que se enlacen las guías oficiales 2027 y que se informe que las materias dependen de la carrera. No reactivar otras URLs retiradas (`410`). |

*Fecha orientativa de calendario, **no permiso automático**: cada cambio debe esperar **72 horas completas desde la última edición**, incluyendo componentes compartidos directamente relevantes. Si el período no se cumplió, excluir la URL y documentar el motivo.

## Plan de ejecución por tandas

### Bloque A: Pregunteros y UBA XXI

1. Releer código y fuentes antes de tocar `master`; verificar si una automatización editorial modificó la página desde esta auditoría.
2. Analizar CTR por **consulta y URL**, no solo posición promedio. Mirar snippets competidores, diferenciar intención de búsqueda y medir si la página responde a ella.
3. Comprobar los enlaces existentes hacia materias, preguntas, simulacros, resumen y carga de apuntes: **no duplicar CTAs ni inventar URLs**.
4. Añadir valor sustantivo solo donde falte; para UBA XXI, contrastar calendario y mecanismos de examen con https://ubaxxi.uba.ar/estudiantes/ . Ninguna pregunta creada por Evaluo debe presentarse como oficial.
5. Ejecutar pruebas de metadata, canonical, enlaces y render. Reportar cambios + resultados.

### Bloque B: IA, mapa mental, UNLaM

1. `/ia-para-estudiantes`: auditar la intención `ia para estudiar` y demostrar el ciclo de práctica sobre los apuntes del usuario; garantizar coherencia con límites del Free/Premium vigente, sin prometer subidas ilimitadas.
2. `/funciones/crear-mapa-mental-desde-pdf`: presentar la función como **Premium**, probar CTA y recorrido posterior, y mantener fidelidad al branding de Evaluo; no alterar metadata sin nuevas consultas representativas.
3. `/como-estudiar-ingreso-unlam`: revisar calendario oficial, instancias de ingreso 2027, temarios según carrera, ejercicios originales y enlaces externos. Diferenciar hechos de preparación orientativa.
4. Comprobar fechas reales en commits; no editar ninguna URL cuyo último cambio sea menor a 72 horas.

### Bloque C: Pruebas Básicas USAC

1. Verificar URL pública y status HTTP 200 y que no se esté ofreciendo 410; comprobar canonical y sitemap.
2. Extraer consultas reales adicionales de Search Console antes de editar. Evitar interpretar impresiones como clics.
3. Revisar el cuadro de materias y guías **Ciclo 2027** y el simulador oficial de SUN/USAC en https://sun.usac.edu.gt/index.php/herramientas/ .
4. Conservar un descargo claro: ejercicios de Evaluo son originales, no son reactivos institucionales ni representan afiliación.
5. No reactivar `/es/paises` ni otras rutas `/es/paises/[slug]` retiradas; mantener tests que comprueban la excepción única de Guatemala.

## Criterios antes de una publicación

- Investigar **cada keyword y página exacta**; tamaño de muestra y fechas visibles.
- No cambiar títulos por siete, nueve o dieciséis impresiones sin analizar intención y SERP.
- Corregir contenido/internos solo cuando haya evidencia de valor adicional. No introducir duplicados o afirmaciones no verificadas.
- Comprobar los planes Free y Premium actuales, formatos aceptados (PDF/DOCX), enlaces, estilo visual, accesibilidad, canonical, robots, JSON-LD y sitemap.
- Trabajar solo en `master`; no fusionar `main` ni publicar en producción. Verificar branch divergence antes de escribir.
- Correr typecheck/lint/tests y build si existe acceso; si no, documentar limitación.
- Reportar URLs modificadas, commits y resultados reales; **no declarar producción lista sin CI y validación del deploy**.

## Métricas del próximo control

Para cada URL: impresiones/clics/CTR/posición **por consulta y país** en ventanas comparables; estado de indexación verificado con Search Console (no confundir 580 URLs enviadas con indexadas), enlaces orgánicos que llegan al flujo de carga PDF y, si hay analítica de producto, activación al primer ejercicio. No inventar conversiones o visibilidad no registrada.
