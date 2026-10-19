# Auditoría de experiencia de usuario de Evaluo

Fecha: 27 de agosto de 2026

Versión evaluada: `master` · commit `220047c`

Entorno: aplicación local conectada al proyecto remoto configurado en `.env.local`

## Contexto de producto: etapa preusuarios

Evaluo todavía no tiene usuarios reales. Por lo tanto, este documento **no describe comportamiento observado de usuarios, problemas validados, conversión, retención ni product-market fit**. Es una evaluación heurística de la interfaz y una preparación para conseguir los primeros usuarios.

Las afirmaciones se interpretan así:

- **Hecho observado:** algo comprobado en la interfaz, el código o el recorrido local.
- **Inferencia UX:** un riesgo razonable detectado mediante principios de usabilidad, pero todavía no validado con estudiantes.
- **Hipótesis de producto:** una propuesta que debe probarse antes de invertir en una implementación amplia.

En esta etapa, el objetivo no es optimizar un funnel existente. Es lograr que los primeros estudiantes comprendan la propuesta, lleguen a un momento de valor y aporten evidencia cualitativa sobre qué problema consideran más importante.

## Resumen ejecutivo

Evaluo comunica una propuesta valiosa y entendible: reunir materia, materiales y práctica en un solo lugar y transformar PDFs propios en guías de estudio. La home explica el problema y la solución con suficiente claridad, y la experiencia autenticada contiene una base de onboarding superior a la media: perfil académico, pantalla de elección de camino, checklist de activación y tours contextuales.

El principal riesgo de usabilidad detectado no es la ausencia de ayuda, sino su distribución. La orientación más útil aparece después del registro, mientras que el visitante público atraviesa páginas extensas y catálogos con demasiadas opciones antes de experimentar el resultado más diferencial. En móvil, la home alcanza aproximadamente 8.000 px de alto y `/explorar` aproximadamente 13.400 px; por criterios heurísticos, esto puede aumentar la carga cognitiva y hacer que las decisiones principales compitan con contenido secundario. Esto deberá validarse con estudiantes.

### Lectura heurística, no puntuación de usuarios

- Claridad de la propuesta de valor: **7,5/10**
- Claridad del siguiente paso para un visitante: **6/10**
- Facilidad para encontrar carrera y materia: **7/10**
- Demostración temprana del valor diferencial: **5,5/10**
- Orientación del usuario nuevo autenticado: **8/10**
- Usabilidad móvil: **6/10**
- Accesibilidad observable: **7/10**

Estas puntuaciones son una referencia interna sobre la interfaz observada. No representan satisfacción, facilidad de uso ni intención de pago de usuarios reales.

La plataforma es comprensible, pero todavía no conduce a todos los usuarios por un camino principal corto. La mejora de mayor impacto es convertir el recorrido público en una secuencia guiada: **elegí tu objetivo → probá un resultado real → elegí tu materia o subí tu PDF → registrate sólo cuando necesites guardar o procesar**.

## Alcance y método

Se levantó la versión local con Next.js 16.3.0 y se recorrieron como invitado las siguientes superficies:

- `/`
- `/explorar`
- `/materias?carreraId=...`
- `/explorar/materia/[id]`
- `/login` y `/login?mode=signup`
- `/empezar`
- `/demo/material-estudio`

También se revisaron la implementación del onboarding del dashboard, el checklist de activación, el tour guiado general, el tour de materiales y la pantalla `/empezar`. Se validaron desktop y un viewport móvil de 390 × 844 px. Durante el recorrido no aparecieron errores ni advertencias de consola.

No se creó una cuenta ni se modificaron datos remotos. Por eso, la experiencia autenticada se evaluó mediante sus pantallas públicas, redirecciones y código real, no mediante una sesión completa con datos personales.

## 1. ¿El usuario entiende el valor de Evaluo?

### Lo que funciona

La home abre con una frase clara: “Tu materia, tus materiales y tu práctica, en un solo lugar”. El texto siguiente explica acciones concretas: encontrar carrera y materia, abrir recursos compartidos y convertir PDFs en guías para practicar. Esto evita una promesa genérica de “estudiar mejor”.

El bloque “¿Cómo funciona Evaluo?” explica cuatro etapas coherentes:

1. elegir carrera y materia;
2. estudiar con materiales;
3. practicar con preguntas;
4. reforzar errores.

La comparación contra WhatsApp, Drive, PDFs desordenados y herramientas genéricas conecta con un problema reconocible. La demostración `/demo/material-estudio` es especialmente fuerte: muestra un resultado concreto con resumen, glosario, tarjetas, ejercicios y mapa mental. Es la evidencia más convincente del producto.

### Lo que debilita la comprensión

Hay dos propuestas que compiten por ser “la principal”:

- catálogo comunitario por universidad, carrera y materia;
- transformación de PDFs propios con IA.

Ambas son compatibles, pero el producto no pregunta temprano cuál de las dos necesita el usuario. Como resultado, algunos visitantes pueden interpretar Evaluo como un repositorio de apuntes y otros como una herramienta de IA para PDFs.

La home explica mucho antes de permitir experimentar. La demo real aparece bastante abajo y no es el CTA principal del primer bloque. “Explorar catálogo” lleva a una decisión académica; “Crear cuenta gratis” pide compromiso. Falta un CTA de baja fricción como **“Ver una guía creada desde un PDF”** o **“Probar una pregunta ahora”** junto a los CTAs principales.

### Conclusión

El usuario entiende qué hace Evaluo, pero puede tardar en descubrir por qué es mejor para su necesidad particular. La propuesta debería presentarse como un único resultado: **“Pasá de tus materiales a una preparación concreta para el parcial”**, con dos caminos subordinados: usar contenido de la comunidad o subir el propio.

## 2. ¿El usuario sabe qué hacer?

### Visitante público

En la home hay dos acciones principales válidas, pero ninguna clasifica la intención del usuario. Una persona que quiere preparar un parcial hoy debe inferir si primero explora, se registra o busca una demo.

En `/explorar`, el encabezado y el buscador son claros. Las etiquetas “Más completa”, “Con contenido” y “En expansión” ayudan a manejar expectativas. Sin embargo, la página muestra una universidad y 43 carreras completas en la misma vista. En móvil, la página alcanza aproximadamente 13.400 px. El usuario recibe un catálogo exhaustivo cuando probablemente necesita una recomendación o una búsqueda enfocada.

Al entrar en una carrera, el plan de Psicología mostró 58 materias en una lista continua. El buscador ayuda, pero no hay agrupación visible por año, cuatrimestre, materias con contenido o recomendación para empezar. Además, “Agregar a favoritos” aparece para cada materia aunque el visitante no inició sesión; esto expone una acción que probablemente derivará a un gate, antes de demostrar valor.

En la materia evaluada, las dos acciones principales son correctas y muy comprensibles:

- “Preparar mis apuntes”;
- “Practicar preguntero”.

El problema aparece cuando la materia no tiene contenido ni preguntas: al desplegar el preguntero, Parcial 1, Parcial 2 e Integrador figuran como “Sin preguntas”; la biblioteca también está vacía. Aunque existe el CTA para aportar apuntes, la primera experiencia puede sentirse como un callejón sin salida.

### Usuario autenticado nuevo

La estructura es buena:

- `/empezar` presenta dos caminos explícitos: explorar contenido o subir un PDF;
- el dashboard reconoce al usuario nuevo;
- muestra “Armemos tu espacio de estudio”;
- ofrece “Elegir mi primera materia” y “Explorar materias”;
- mantiene un checklist de cuatro hitos;
- abre un tour de cuatro pasos;
- la sección de materiales tiene un tour propio de tres pasos.

Esto responde muy bien al pedido de “pasos útiles”. La mejora necesaria no es crear otro tour general, sino hacer que la ayuda sea recuperable y contextual. Hoy los tours se marcan como vistos en `localStorage`; si el usuario los cierra, debería tener siempre una opción visible “Volver a ver guía”.

### Inconsistencias detectadas

- El hero del usuario nuevo promete acompañamiento con “3 pasos”, pero el checklist real contiene **4 hitos**.
- El segundo hito pide responder cinco preguntas y el tercero completar un simulacro; ambos llevan inicialmente al mismo simulador. La diferencia conceptual existe, pero el usuario puede percibirlos como duplicados.
- `/empezar` redirige al login con un mensaje genérico: “Ingresá para continuar estudiando donde lo dejaste”. No anticipa que, después del acceso, se configurará el espacio en pasos breves.

## 3. Arquitectura de información y navegación

### Fortalezas

- Migas de pan completas en la materia.
- Contexto persistente de universidad, carrera y materia.
- CTAs con verbos concretos: explorar, preparar, practicar, subir.
- Navegación móvil disponible con Inicio, Explorar, Pregunteros e Ingresar.
- El contenido del producto se estructura alrededor de conceptos que el estudiante reconoce.

### Problemas

- Existen dos niveles de breadcrumbs/navegación contextual en la página de materia, lo que puede sentirse redundante.
- La home es demasiado extensa para un usuario que ya está convencido.
- `/explorar` mezcla entrada por universidad y entrada directa por carrera en una misma página muy larga.
- Las listas de carrera y materia priorizan exhaustividad sobre decisión.
- “Preguntero”, “simulador”, “práctica” y “simulacro” se usan para conceptos cercanos. Conviene definir una taxonomía estable y explicarla una sola vez.

## 4. Onboarding recomendado

No se recomienda agregar un tour obligatorio más largo. Se recomienda un sistema de orientación en tres capas.

### Capa 1: selector de intención público

En el primer viewport de la home:

**¿Qué querés hacer hoy?**

- **Tengo un PDF** → ver demo y luego subir;
- **Busco material de mi materia** → elegir carrera/materia;
- **Quiero practicar para un parcial** → demo de pregunta y luego materia.

Cada opción debe mostrar el resultado esperado y el tiempo aproximado, por ejemplo: “En 2 minutos ves cómo quedaría tu guía”.

### Capa 2: primera victoria antes del registro

Permitir que el usuario experimente una parte del valor sin crear una cuenta:

- abrir la demo de guía;
- cambiar entre resumen, glosario, tarjetas y ejercicios;
- responder una pregunta de ejemplo;
- ver qué se guarda al registrarse.

El registro debe aparecer después de la evidencia, con copy contextual: **“Creá tu cuenta para subir tu PDF y guardar esta guía”**.

### Capa 3: checklist autenticado persistente

Mantener el checklist actual, pero convertirlo en una secuencia más directa:

1. Elegí una materia.
2. Elegí tu camino: usar contenido o subir PDF.
3. Completá una sesión corta de cinco preguntas o tarjetas.
4. Agendá tu parcial para recibir el siguiente paso.

El simulacro completo debería aparecer como logro posterior, no necesariamente como requisito de onboarding inicial. La activación debe ocurrir cuando el usuario consigue una primera victoria pequeña.

Agregar en el menú de ayuda:

- “¿Qué puedo hacer en Evaluo?”;
- “Volver a ver la guía”;
- “Elegir otra materia”;
- “No encuentro contenido”;
- “Cómo preparar un PDF”.

## 5. Estados vacíos y prevención de callejones sin salida

Los estados vacíos tienen buen tono y CTA, pero deberían ofrecer una alternativa inmediata además del aporte comunitario.

### Materia sin contenido

Estado recomendado:

> Todavía no hay material compartido de esta materia.
>
> Podés subir tus apuntes para crear una guía privada, pedir que te avisemos cuando haya contenido o explorar una materia con contenido de ejemplo.

Acciones:

- Primaria: “Crear guía con mi PDF”.
- Secundaria: “Ver una guía de ejemplo”.
- Terciaria: “Avisarme cuando haya contenido”.

### Pregontero sin preguntas

No conviene mostrar tres destinos inactivos como primera respuesta. Mostrar un único mensaje y dos alternativas:

- “Crear ejercicios desde mis apuntes”.
- “Probar un simulador de ejemplo”.

### Búsqueda sin resultados

Debe conservar la consulta y ofrecer:

- revisar ortografía;
- buscar sólo carreras o universidades;
- solicitar universidad;
- explorar opciones con más contenido.

## 6. Mobile y responsive

No se detectó desbordamiento horizontal relevante en 390 px. Los CTAs principales se adaptan y existe navegación inferior. Esto es positivo.

El problema móvil es de longitud y densidad:

- home: aproximadamente 8.000 px;
- explorar: aproximadamente 13.400 px;
- 43 carreras en una sola lista;
- planes de estudio extensos sin agrupación progresiva.

Recomendaciones:

- limitar inicialmente carreras a “más completas” y “recientes”, con “Ver todas”;
- agrupar materias por año/cuatrimestre cuando exista el dato;
- agregar filtro “Con materiales” y “Con preguntas”;
- usar encabezado/buscador sticky en listados largos;
- conservar la selección y posición al volver desde una materia;
- evitar duplicar acciones de acceso entre header y bottom nav si compiten visualmente.

## 7. Accesibilidad

### Aspectos positivos observados

- Jerarquía de headings coherente en las pantallas principales.
- Inputs de login y búsqueda con nombres accesibles.
- Tabs de la demo expuestas como `tablist`, `tab` y `tabpanel`.
- Tour con cierre por Escape, restauración de foco y etiquetas accesibles.
- Breadcrumb principal etiquetado como “Migas de pan”.
- Botones de zoom, navegación de PDF y compartir poseen nombres.

### Riesgos y mejoras

- El tour declara `role="dialog"` con `aria-modal="false"`, pero el overlay oscurece el resto y la implementación menciona focus trap sin implementar un ciclo completo de Tab. Debe definirse si es modal o no y ajustar interacción/foco.
- La barra de progreso del tour usa fondo blanco dentro de tarjeta blanca, lo que puede reducir visibilidad del track.
- Revisar contraste de textos blancos con opacidades bajas sobre gradientes.
- Verificar objetivos táctiles y separación de acciones en listas densas.
- Añadir un `aria-label` más contextual a cada “Agregar a favoritos”, por ejemplo “Agregar Introducción a la Psicología a favoritos”.
- Validar que estados “Sin preguntas” no parezcan controles habilitados para lectores de pantalla.

## 8. Priorización

Las prioridades siguientes separan correcciones evidentes de hipótesis que requieren validación. Sin usuarios, no debe interpretarse “impacto alto” como impacto medido.

### P0 — necesario antes de invitar a los primeros usuarios

1. Corregir inconsistencia de 3 pasos vs. 4 hitos.
2. Resolver materias sin contenido con al menos una alternativa funcional de demo o PDF propio.
3. Elegir un pequeño conjunto de materias con contenido real para las pruebas iniciales.
4. Hacer recuperable la ayuda principal después de cerrar el tour.
5. Preparar las cinco pruebas de usabilidad y registrar observaciones de forma consistente.

### P1 — hipótesis a prototipar y probar con estudiantes

1. Llevar la demo de guía al primer viewport de la home.
2. Probar un selector de intención con tres caminos.
3. Reducir `/explorar` con ranking, filtros y revelado progresivo.
4. Agrupar materias por ciclo y priorizar las que tienen contenido.
5. Simplificar el onboarding para lograr una primera victoria corta.
6. Unificar terminología de práctica, preguntero, simulador y simulacro.
7. Contextualizar el copy de login según el destino solicitado.

### P2 — optimización

1. Reducir la longitud de la home y mover detalle a páginas específicas.
2. Afinar breadcrumbs y navegación contextual redundante.
3. Mejorar accesibilidad del tour y de favoritos.
4. Implementar ayuda contextual y búsqueda de ayuda.

## 9. Validación recomendada antes de optimizar métricas

Sin usuarios, un test A/B no es la prioridad: no existe tráfico suficiente ni un comportamiento base contra el cual comparar. Primero hay que obtener evidencia cualitativa y aprender qué propuesta despierta interés real.

### Primer experimento: cinco pruebas de usabilidad

Reclutar cinco estudiantes universitarios del segmento inicial, idealmente de Universidad Siglo 21 y con un parcial próximo. No explicarles Evaluo antes de comenzar.

Tareas:

1. Mirar la home durante 15 segundos y explicar qué creen que ofrece Evaluo.
2. Encontrar su carrera y una materia.
3. Descubrir cómo convertirían un PDF propio en material de estudio.
4. Encontrar una forma de practicar para un parcial.
5. Decidir si crearían una cuenta y explicar por qué.

Observar sin ayudar:

- primera acción elegida;
- palabras o conceptos que no comprenden;
- momentos de duda o retroceso;
- si encuentran la demo;
- si distinguen contenido comunitario de material generado desde su PDF;
- qué resultado consideran suficientemente valioso para registrarse.

Criterio inicial de decisión: si al menos cuatro de cinco participantes pueden explicar la propuesta y llegar a una acción de valor sin asistencia, conservar la estructura y realizar ajustes puntuales. Si tres o más se desorientan en el mismo punto, priorizar ese cambio antes de ampliar funcionalidades.

### Segundo experimento: entrevistas de problema

Realizar entre 8 y 12 entrevistas breves con estudiantes, evitando vender la solución al comienzo. Validar:

- cómo consiguen actualmente apuntes;
- cómo preparan un parcial;
- qué hacen con PDFs extensos;
- qué herramienta o proceso les genera más frustración;
- si prefieren material compartido, transformar el propio o practicar preguntas;
- qué información académica están dispuestos a configurar;
- qué tendría que ocurrir para que vuelvan la semana siguiente.

La decisión estratégica más importante es descubrir cuál de los dos caminos produce una necesidad más intensa: **contenido comunitario por materia** o **transformación y práctica desde PDFs propios**. Hasta contar con esa evidencia, no conviene declarar uno como propuesta principal definitiva.

### Instrumentación mínima para los primeros usuarios

Preparar, sin sobredimensionar analytics, estos eventos:

1. `home_view`
2. `primary_cta_clicked`
3. `demo_started`
4. `catalog_search_started`
5. `signup_started`
6. `signup_completed`
7. `first_subject_selected`
8. `first_study_action_completed`
9. `day_7_returned`

El “momento de valor” deberá elegirse después de las pruebas cualitativas. Candidatos: abrir una guía generada, completar cinco preguntas o encontrar material útil de una materia. No asumir todavía que los tres tienen el mismo valor.

## 10. Criterios de aceptación UX

La mejora se considera lista cuando:

- un visitante puede explicar en una frase qué obtiene de Evaluo después del primer viewport;
- puede elegir un camino sin conocer la arquitectura interna del producto;
- puede experimentar valor antes del registro;
- ninguna materia vacía termina sin alternativa útil;
- el catálogo móvil no obliga a recorrer todas las carreras para encontrar una opción relevante;
- el usuario nuevo siempre ve un siguiente paso único y accionable;
- la guía puede cerrarse, retomarse y volver a abrirse;
- el lenguaje de práctica es consistente en home, materia, dashboard y simulador;
- teclado y lector de pantalla pueden recorrer tours, tabs, formularios y estados vacíos;
- se puede medir el paso desde intención hasta primera acción de estudio.

## Decisión recomendada

No reconstruir el producto ni agregar más funcionalidades antes de hablar con estudiantes. Evaluo ya tiene suficiente producto para aprender: demo, catálogo, onboarding, materiales y práctica. Primero deben corregirse los callejones sin salida evidentes y realizar cinco pruebas de usabilidad. Después, con esa evidencia, se decidirá si la primera iteración debe concentrarse en home, catálogo, PDFs propios o práctica. La prioridad actual es aprendizaje validado, no optimización prematura.
