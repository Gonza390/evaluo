# Estrategia SEO hispanohablante de Evaluo — 29/10/2026

## Objetivo y límite comercial

Construir descubrimiento orgánico y activación gratuita internacional **sin vender ni dirigir a un checkout internacional que aún no está disponible**.

Preservar el SEO argentino existente: `/pregunteros`, páginas de Siglo 21, UBA XXI, UNLaM, sus slugs, redirecciones 301, títulos y canonicals. **No** convertir automáticamente las URLs argentinas en `/es-ar/`, fusionar países o modificar `hreflang` de otras intenciones.

## Datos disponibles y qué significan

Windsor.ai Search Console `sc-domain:evaluo.com.ar` del 15/09 al 25/10/2026, `country, clicks, impressions, position`. Dominio antiguo y tráfico anterior a estabilización del traslado: **no usar para afirmar desempeño de las nuevas páginas**.

| País | Impresiones | Clics |
|---|---:|---:|
| Argentina | 6.923 | 343 |
| México | 602 | 0 |
| Colombia | 235 | 0 |
| Perú | 162 | 3 |
| Guatemala | 109 | 0 |
| Venezuela | 95 | 0 |
| España | 74 | 2 |
| Ecuador | 64 | 0 |
| Chile | 50 | 0 |
| Nicaragua | 48 | 0 |
| Honduras | 39 | 0 |
| República Dominicana | 33 | 1 |
| Costa Rica | 32 | 0 |
| Panamá | 29 | 0 |
| Puerto Rico | 16 | 0 |
| Bolivia | 12 | 0 |

El desglose `country + query` muestra principalmente `evaluo` fuera de Argentina; no valida volumen transaccional ni posiciones de keywords de estudio. `country + page` contiene sobre todo la home del dominio viejo. No interpretarlos como impacto de landings internacionales.

La propiedad `evaluoapp.com` todavía no está habilitada en el conector de Windsor.ai en esta consulta, a pesar de estar verificada en Google Search Console según el propietario. No asignar click, indexación o conversiones inventadas a nuevas rutas.

## Arquitectura elegida

- **Argentina**: dejar todas las rutas existentes en `/` y páginas especializadas.
- **Español general**: `/es/estudiar-pdf-con-ia` y `/es/guias` funcionan como recursos compartidos, sin copiar una página para cada país.
- **Países ya trabajados**: `/es-mx/estudiar-pdf-con-ia`, `/es-es/estudiar-pdf-con-ia`, `/es-co/estudiar-pdf-con-ia` conservan su contenido y etiquetas `hreflang`.
- **Nuevo índice**: `/es/paises` muestra los 20 países hispanohablantes considerados y Puerto Rico / hispanohablantes de EE. UU. Las ideas de mercados sin respaldo son **hipótesis por investigar**, no nuevas URLs.
- **Cuatro guías nicho con fuente institucional y contenido distintivo**:
  1. `/es/paises/mexico-guia-exani-ii-pdf` — guía Ceneval EXANI-II, preguntas de práctica sobre material propio.
  2. `/es/paises/chile-preparar-paes-con-temario` — temarios DEMRE y diferencia entre habilidades y contenido.
  3. `/es/paises/peru-preparar-admision-san-marcos` — portal de admisión UNMSM y método por áreas.
  4. `/es/paises/guatemala-pruebas-basicas-usac` — guías SUN USAC / PCB y diagnóstico por asignatura.

**Son cuatro intenciones de examen específicas, no traducciones paralelas del mismo producto.** Cada una tiene canonical propio y no incluye `hreflang` con páginas que no son equivalentes. Se evita crear versiones por país genéricas con cuerpo repetido y solo cambio de nombre.

Fuentes institucionales consultadas:
- https://ceneval.edu.mx/instituciones-guias_ceneval/
- https://portaldemre.demre.cl/paes/factores-seleccion/pruebas-acceso-paes
- https://www.unmsm.edu.pe/formacion-academica/admision
- https://sun.usac.edu.gt/index.php/herramientas/
- https://sun.usac.edu.gt/index.php/proceso-de-ingreso/

Estas instituciones no están asociadas con Evaluo. No se usan sus nombres para afirmar respaldo, exámenes oficiales de Evaluo ni garantizar resultados.

## Matriz de nichos para próxima investigación

| Región/país | Tema a contrastar en SERP y con fuentes oficiales | Motivo |
|---|---|---|
| México | guías EXANI-II, guía estudio desde PDF | Institución oficial localizada |
| Chile | PAES, temario por competencias, certámenes universitarios | Vocabulario local diferenciable |
| Perú | San Marcos/UNMSM, prácticas y balotarios | Alta especialización; competencia real |
| Guatemala | USAC PCB, guías temáticas | Documentación oficial disponible |
| España | tests desde temario, preguntas por unidad, oposición solo tras validar producto | Landing existente es-ES |
| Colombia | parciales, quizzes universitarios | Landing existente es-CO |
| Ecuador | requisitos y temarios específicos por universidad | No inventar un examen nacional uniforme |
| Bolivia | cursos preuniversitarios y exámenes de ingreso | Validación pendiente |
| Venezuela | guías por materia y procesos de ingreso | Validación pendiente |
| República Dominicana | pruebas de ingreso y repaso universitario | Validación pendiente |
| Costa Rica | preparación de ingreso según institución | Validación pendiente |
| Honduras | examen de admisión y guías oficiales de cada institución | Atención a cambios de nombre/estructura de pruebas |
| Nicaragua | aprendizaje por unidad y admisión | Validación pendiente |
| El Salvador | selección de exámenes de ingreso por institución | Validación pendiente |
| Panamá | procesos de ingreso según universidad | Validación pendiente |
| Paraguay | exámenes de ingreso según facultad | Validación pendiente |
| Uruguay | ingreso y evaluaciones universitarias | Validación pendiente |
| Cuba | estudio de materias y preparación por especialidad | Validación pendiente |
| Guinea Ecuatorial | recursos generales de estudio en español | No inventar información institucional |
| Puerto Rico | guías y repaso de asignaturas en español | Localización lingüística futura |
| EE. UU. hispanohablante | recursos de estudio en español | No prometer equivalencia de exámenes en inglés |

Todos están en el directorio, pero solo las cuatro páginas documentadas tienen una URL especializada nueva. El directorio enlaza a recursos internacionales existentes para el resto.

## Reglas de expansión

1. Validar la búsqueda por país: estudiar SERP local, quién está posicionado, tipo de documento, si hay instituciones oficiales, competencia, valor de experiencia gratuita y volúmenes cuando haya datos accesibles.
2. Publicar solo guías con fuentes confiables, ejemplos pedagógicos propios, FAQ útiles y diferencia clara frente a otra página publicada. No crear docenas de URLs geográficas thin content.
3. Añadir nueva ruta al sitemap solo cuando esté completa e indexable; conservar canonical autoref y enlaces internos.
4. `hreflang` solo para variantes verdaderamente equivalentes; no intercambiar `/es/paises/chile-preparar-paes-con-temario` con `/es-es/estudiar-pdf-con-ia`.
5. No redirigir a personas según IP y no generar precios de otros países; CTA secundario gratis en `/es/estudiar-pdf-con-ia`.
6. Medir por país y fuente (sin atribuir identidad o geografía solo por slug): GSC clicks/impressions, `cta_click`, `pdf_first_landing_viewed`, `pdf_selected`, registro, `pdf_uploaded` y primera práctica.
7. Mantener registro de URLs de Argentina y ejecutar auditoría de dominio para comprobar que no cambien las redirecciones ni canonicals.
8. Asegurar que el producto realmente acepta y muestra materiales del idioma del estudiante antes de ofrecer garantías lingüísticas; todavía no hay checkout internacional.

## Fuentes técnicas de Google

- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/essentials/spam-policies
