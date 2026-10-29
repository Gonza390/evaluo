export type StudyGuide = {
  slug: string;
  category: 'Estudiar por materia' | 'Preparar exámenes' | 'Practicar y reforzar';
  title: string;
  seoTitle: string;
  description: string;
  audience: string;
  question: string;
  opening: string;
  focus: string;
  steps: Array<{ title: string; detail: string }>;
  exampleTitle: string;
  exampleContext: string;
  exampleTasks: string[];
  exampleOutcome: string;
  pitfalls: Array<{ title: string; detail: string }>;
  review: string;
  faq: Array<{ q: string; a: string }>;
};

export const STUDY_GUIDES: StudyGuide[] = [
  {
    "slug": "como-estudiar-anatomia",
    "category": "Estudiar por materia",
    "title": "Cómo estudiar anatomía sin memorizar listas interminables",
    "seoTitle": "Cómo estudiar anatomía: método con imágenes y preguntas",
    "description": "Método de estudio de anatomía por regiones, estructuras, funciones y relaciones: ejemplos, autoevaluación y cómo repasar tus apuntes.",
    "audience": "Estudiantes de anatomía, ciencias de la salud y cursos introductorios",
    "question": "¿Cómo pasar de reconocer un dibujo a explicar una estructura sin mirar?",
    "opening": "Estudiar anatomía exige más que leer nombres. Es necesario ubicar estructuras, distinguirlas de sus vecinas, explicar qué hacen y recuperar esa información cuando no tienes el esquema delante. La estrategia cambia según el examen: no se prepara igual una identificación visual que una pregunta que relaciona nervios, músculos y movimientos.",
    "focus": "Empieza con una región anatómica y comprueba cuatro dimensiones: localización, relaciones, función y aplicación. No intentes aprender todo el sistema en una sola sesión.",
    "steps": [
      {
        "title": "Delimita una región y define qué entra",
        "detail": "Escoge, por ejemplo, la cintura escapular. Revisa el programa de la asignatura y anota qué huesos, músculos y movimientos debes identificar; evita sumar estructuras ajenas al examen."
      },
      {
        "title": "Relaciona cada nombre con una posición y una función",
        "detail": "Usa un esquema de tu material e intenta señalar la estructura sin leer la etiqueta. Después explica qué movimiento facilita y con qué otras estructuras se relaciona. Comprueba las inserciones cuando sean relevantes."
      },
      {
        "title": "Alterna dos tipos de pregunta",
        "detail": "Haz una pregunta de identificación (¿qué estructura es esta?) y otra de relación (¿qué movimiento depende de este grupo muscular?). Responder solo con listas puede ocultar dificultades para aplicar el conocimiento."
      },
      {
        "title": "Corrige con la lámina original y repite",
        "detail": "Cuando confundas dos nombres o posiciones, revisa la lámina y escribe una diferencia que te permita distinguirlos. Repite la pregunta en otra sesión y añade alguna estructura ya estudiada."
      }
    ],
    "exampleTitle": "Ejemplo: estudiar los músculos de la cintura escapular",
    "exampleContext": "Supón que tu PDF presenta trapecio, serrato anterior y otros músculos de la región con dibujos y descripciones funcionales.",
    "exampleTasks": [
      "Oculta las etiquetas y localiza en la figura las estructuras exigidas por tu programa.",
      "Formula una pregunta que relacione cada músculo con un movimiento descrito en los apuntes.",
      "Si mezclas funciones o posiciones, contrasta el texto y vuelve a responder sin ver el dibujo."
    ],
    "exampleOutcome": "La sesión termina cuando puedes identificar y explicar las diferencias, no cuando has leído una lista tres veces.",
    "pitfalls": [
      {
        "title": "Leer siempre con las etiquetas visibles",
        "detail": "Reconocer un nombre que aparece junto al dibujo no garantiza recordarlo por tu cuenta. Alterna láminas sin etiquetas y preguntas abiertas."
      },
      {
        "title": "Aprender funciones sin ubicación",
        "detail": "Una misma palabra puede aparecer en distintas regiones. Relaciona función, posición y estructuras próximas en el material."
      },
      {
        "title": "Confiar en una explicación automática sin verificar",
        "detail": "En anatomía una relación espacial equivocada puede arrastrar muchos errores. Comprueba esquemas y nomenclatura con la bibliografía de tu asignatura."
      }
    ],
    "review": "Vuelve a las estructuras que confundiste después de un intervalo de estudio. En el repaso mezcla preguntas nuevas con algunas anteriores: el objetivo es explicar sin depender del orden de la lista.",
    "faq": [
      {
        "q": "¿Es mejor memorizar atlas o crear tarjetas?",
        "a": "Depende de lo que evalúen. El atlas ayuda a ubicar estructuras; las tarjetas sirven para comprobar si recuerdas nombres y funciones. Combinar ambos suele cubrir más tipos de pregunta que utilizar uno solo."
      },
      {
        "q": "¿Puedo usar un PDF de anatomía en Evaluo?",
        "a": "Puedes seleccionar tus apuntes para obtener un resumen, tarjetas y preguntas sobre su contenido. Contrasta especialmente estructuras, diagramas y términos técnicos con las láminas originales."
      }
    ]
  },
  {
    "slug": "como-estudiar-psicologia",
    "category": "Estudiar por materia",
    "title": "Cómo estudiar psicología: autores, teorías y casos",
    "seoTitle": "Cómo estudiar psicología: autores, teorías y ejemplos",
    "description": "Aprende a estudiar psicología comparando teorías y autores, usando preguntas de aplicación y repasando errores con tus apuntes.",
    "audience": "Estudiantes de psicología y materias de comportamiento humano",
    "question": "¿Cómo recordar autores sin confundir las teorías que explican?",
    "opening": "En psicología es frecuente reconocer una teoría al leerla, pero dudar cuando aparece un caso con varias explicaciones posibles. Para preparar el examen conviene organizar autores y conceptos por problemas, no solo por fechas o capítulos.",
    "focus": "Elige dos enfoques que tu asignatura compare y construye una tabla conceptual con pregunta central, términos, explicación y límites. Trabaja únicamente con los autores incluidos en el programa.",
    "steps": [
      {
        "title": "Busca la pregunta que intenta responder cada teoría",
        "detail": "Para una unidad sobre aprendizaje, por ejemplo, identifica qué aspectos del comportamiento explica cada enfoque según tu bibliografía. Resume la idea central en una frase sin copiar el manual."
      },
      {
        "title": "Compara conceptos en paralelo",
        "detail": "Crea una tabla con autores, conceptos clave, ejemplos y diferencias. Si dos teorías usan palabras similares, escribe qué significa cada término en su marco original."
      },
      {
        "title": "Aplica los conceptos a una situación",
        "detail": "Inventa un caso cotidiano coherente con lo leído y pregunta qué teoría permite interpretarlo y por qué. Justifica también por qué otras alternativas serían menos adecuadas."
      },
      {
        "title": "Recupera primero y consulta después",
        "detail": "Intenta explicar la teoría con el PDF cerrado. Si omites un concepto, localiza el apartado, corrige la explicación y programa otra práctica con un caso diferente."
      }
    ],
    "exampleTitle": "Ejemplo: distinguir procesos de memoria",
    "exampleContext": "Tu documento diferencia memoria de trabajo y memoria a largo plazo e incluye procesos de mantenimiento, recuperación y uso de información.",
    "exampleTasks": [
      "Describe sin mirar una tarea que requiere mantener datos y operar con ellos.",
      "Explica qué concepto del capítulo sirve para interpretar la tarea y por qué.",
      "Contrasta las diferencias con el PDF y plantea un nuevo caso que no repita el anterior."
    ],
    "exampleOutcome": "Practicas la comprensión de los procesos, además de la terminología de los autores.",
    "pitfalls": [
      {
        "title": "Memorizar autores sin una idea central",
        "detail": "Una lista de apellidos puede ayudarte a reconocer opciones, pero no siempre explica qué propone cada enfoque. Asocia cada autor al problema estudiado."
      },
      {
        "title": "Confundir un ejemplo con una prueba de la teoría",
        "detail": "Los casos ilustrativos ayudan a comprender; no demuestran por sí solos la validez de una explicación psicológica."
      },
      {
        "title": "Estudiar definiciones fuera de su contexto",
        "detail": "Revisa cómo define los conceptos tu programa: términos parecidos pueden tener sentidos diferentes entre enfoques."
      }
    ],
    "review": "Al regresar al tema, mezcla una definición, una comparación y una pregunta basada en un caso. Usa los errores para elegir qué teoría revisar, no para releer todo el capítulo.",
    "faq": [
      {
        "q": "¿Cómo estudiar muchos autores para un parcial?",
        "a": "Agrúpalos según las preguntas de la asignatura y compáralos por sus conceptos, explicaciones y diferencias. Después intenta explicar cada uno sin consultar la tabla."
      },
      {
        "q": "¿Sirven las flashcards para estudiar psicología?",
        "a": "Son útiles para recuperar definiciones y distinciones, pero complétalas con casos prácticos que exijan aplicar los conceptos."
      }
    ]
  },
  {
    "slug": "como-estudiar-derecho",
    "category": "Estudiar por materia",
    "title": "Cómo estudiar derecho: normas, conceptos y casos prácticos",
    "seoTitle": "Cómo estudiar derecho: casos prácticos y preguntas",
    "description": "Una guía para estudiar derecho con fuentes vigentes, esquemas de conceptos, resolución de casos y práctica sin memorizar artículos aislados.",
    "audience": "Estudiantes de asignaturas jurídicas en distintos países",
    "question": "¿Cómo comprender una norma y aplicarla en una pregunta de examen?",
    "opening": "Las materias de derecho mezclan definiciones, estructuras normativas, excepciones y análisis de situaciones. Memorizar artículos de forma aislada puede fallar cuando el examen plantea hechos y pide justificar una respuesta. Además, los códigos y normas dependen del país y pueden cambiar: empieza por el programa y las fuentes oficiales de tu jurisdicción.",
    "focus": "Trabaja una institución jurídica por vez. Distingue concepto, condiciones, excepciones y consecuencias según la bibliografía y la legislación vigente que corresponda.",
    "steps": [
      {
        "title": "Define la figura y su fuente",
        "detail": "Localiza en el material qué institución estudias, cuál es su definición y qué norma o doctrina corresponde. Anota el país y la versión aplicable cuando trabajes con legislación."
      },
      {
        "title": "Construye un esquema de requisitos y excepciones",
        "detail": "En vez de copiar artículos, convierte el tema en una lista razonada de condiciones. Señala los supuestos que suelen confundirse con figuras próximas."
      },
      {
        "title": "Resuelve un supuesto de hecho breve",
        "detail": "Identifica los hechos relevantes, plantea la cuestión jurídica, explica la regla del material y ensaya una conclusión. No introduzcas normas que no estén en tus fuentes."
      },
      {
        "title": "Comprueba el razonamiento",
        "detail": "Vuelve a la norma y al texto de la cátedra para verificar requisitos, plazos y excepciones. Luego prueba otro supuesto que cambie un hecho decisivo."
      }
    ],
    "exampleTitle": "Ejemplo: analizar un contrato hipotético",
    "exampleContext": "Imagina que tu material desarrolla elementos y condiciones de validez de ciertos contratos, según la legislación asignada en clase.",
    "exampleTasks": [
      "Identifica qué hechos del supuesto son importantes y qué elemento del tema podría estar involucrado.",
      "Explica qué requisito debe verificarse sin citar artículos de memoria.",
      "Consulta la fuente de tu jurisdicción y cambia un hecho para observar si la respuesta sería distinta."
    ],
    "exampleOutcome": "El aprendizaje se centra en argumentar con la fuente correcta, no en repetir una conclusión sin fundamentos.",
    "pitfalls": [
      {
        "title": "Mezclar legislaciones de países distintos",
        "detail": "No traslades automáticamente un artículo, procedimiento o plazo de una jurisdicción a otra. Las explicaciones de IA requieren verificación con fuentes locales."
      },
      {
        "title": "Confundir saber el número de una norma con entenderla",
        "detail": "Recuperar una referencia no sustituye poder identificar su supuesto y su consecuencia jurídica."
      },
      {
        "title": "Aprender solo el caso resuelto",
        "detail": "Si memorizas el resultado de un caso, puedes fallar cuando cambie un hecho relevante. Practica variaciones."
      }
    ],
    "review": "Prepara preguntas breves que obliguen a identificar una figura, explicar sus condiciones y razonar un caso. Al revisar errores, señala si falló la identificación del problema, la regla o la aplicación.",
    "faq": [
      {
        "q": "¿Cómo estudiar derecho sin memorizar cada artículo?",
        "a": "Empieza por los conceptos y sus relaciones, identifica qué reglas debes conocer literalmente y comprueba su aplicación con casos. Sigue siempre el programa de la asignatura."
      },
      {
        "q": "¿Puedo utilizar respuestas de IA como referencia jurídica?",
        "a": "Para estudiar, pueden servir como material de práctica, pero verifica cualquier norma, plazo o conclusión con la legislación vigente de tu país y las fuentes de tu curso. No sustituyen asesoría legal."
      }
    ]
  },
  {
    "slug": "como-estudiar-economia",
    "category": "Estudiar por materia",
    "title": "Cómo estudiar economía entendiendo gráficos y modelos",
    "seoTitle": "Cómo estudiar economía: gráficos, modelos y ejercicios",
    "description": "Método para estudiar economía: interpretar oferta y demanda, distinguir cambios de variables, practicar gráficos y explicar errores.",
    "audience": "Estudiantes de microeconomía, macroeconomía y cursos introductorios",
    "question": "¿Cómo dejar de memorizar gráficos y empezar a razonar qué cambia?",
    "opening": "En economía es fácil recordar la forma de una curva sin comprender los supuestos del modelo. Un ejercicio puede modificar una variable, pedir un nuevo equilibrio o exigir distinguir un movimiento sobre la curva de un desplazamiento. Estudiar bien implica explicar qué se mantiene constante y por qué se espera cierto resultado.",
    "focus": "Para cada modelo identifica variables, ejes, supuestos, mecanismo y resultado. Comprueba que el ejemplo se ajuste al modelo básico que usa tu curso.",
    "steps": [
      {
        "title": "Define el modelo y sus supuestos",
        "detail": "Antes de resolver, lee qué representa cada eje, qué factores se mantienen constantes y en qué condiciones aplica la relación del material."
      },
      {
        "title": "Dibuja y explica desde cero",
        "detail": "Sin consultar, representa el gráfico y escribe una frase que explique el mecanismo económico. No basta con recordar que una línea sube o baja."
      },
      {
        "title": "Cambia una variable por vez",
        "detail": "Plantea un escenario que altere la demanda y otro que altere la oferta. Indica qué curva se mueve y comprueba la predicción con las condiciones del problema."
      },
      {
        "title": "Corrige con una explicación causal",
        "detail": "Si te equivocas, separa si el error fue de ejes, desplazamiento o interpretación. Vuelve al ejemplo original y practica con otra situación."
      }
    ],
    "exampleTitle": "Ejemplo: interpretar un cambio en la demanda",
    "exampleContext": "Tu PDF explica el equilibrio de mercado en el modelo de oferta y demanda. Supón que aumenta la demanda mientras la oferta permanece constante.",
    "exampleTasks": [
      "Dibuja el equilibrio inicial e identifica la curva correspondiente a la demanda.",
      "Predice el efecto sobre el precio de equilibrio y justifica tu respuesta usando el modelo.",
      "Comprueba en los apuntes y ensaya qué ocurriría si, en cambio, disminuyera la oferta."
    ],
    "exampleOutcome": "Aprendes a argumentar a partir de los supuestos, no solo a recordar un gráfico.",
    "pitfalls": [
      {
        "title": "Confundir variación en la cantidad demandada con un desplazamiento",
        "detail": "Distingue entre cambios causados por el precio del bien y otros factores, según cómo lo defina tu curso."
      },
      {
        "title": "Aplicar el modelo sin decir qué se mantiene constante",
        "detail": "Una predicción puede cambiar si varían simultáneamente oferta y demanda. Explicita las condiciones del ejercicio."
      },
      {
        "title": "Copiar ejercicios sin explicar el mecanismo",
        "detail": "Después de resolver, explica por qué el cambio del gráfico conduce al resultado; así detectas si comprendiste."
      }
    ],
    "review": "Alterna preguntas de definición, representación de gráficos y casos nuevos. Si un error se repite, practica primero el concepto causante y después otro problema con datos diferentes.",
    "faq": [
      {
        "q": "¿Cómo aprender economía si me cuestan los gráficos?",
        "a": "Empieza identificando ejes y supuestos; explica una relación verbalmente antes de dibujar. Practica cambios de una variable y comprueba cada paso con tu bibliografía."
      },
      {
        "q": "¿Sirve hacer resúmenes para economía?",
        "a": "Sí, para organizar conceptos, pero complementa con ejercicios y explicaciones causales: saber una definición no garantiza interpretar un cambio en el modelo."
      }
    ]
  },
  {
    "slug": "como-preparar-un-parcial",
    "category": "Preparar exámenes",
    "title": "Cómo preparar un parcial: plan de estudio de siete días",
    "seoTitle": "Cómo preparar un parcial en 7 días: plan de estudio",
    "description": "Plan de siete días para preparar un parcial: ordenar el temario, practicar preguntas, corregir errores y repasar sin depender solo de resúmenes.",
    "audience": "Estudiantes universitarios que tienen un parcial cercano",
    "question": "¿Cómo organizar una semana de estudio cuando quedan varios temas pendientes?",
    "opening": "No existe un plan único que garantice aprobar. La preparación depende del tiempo disponible, del tipo de examen y de lo que ya sabes. Sin embargo, repartir el estudio entre comprensión, recuperación y revisión de errores suele ser más útil que dejar toda la práctica para la noche anterior.",
    "focus": "La prioridad es identificar qué temas entran, practicar con un alcance realista y dejar tiempo para corregir. Ajusta los bloques según trabajo, clases, descanso y la dificultad de la materia.",
    "steps": [
      {
        "title": "Día 1: diagnóstico y alcance",
        "detail": "Confirma temario, tipo de preguntas y bibliografía. Intenta responder tres preguntas sin consultar; marca temas sólidos, dudosos y desconocidos."
      },
      {
        "title": "Días 2 y 3: bloques prioritarios",
        "detail": "Estudia primero los temas de mayor peso o dificultad. Después de cada bloque cierra el PDF y explica la idea central o contesta preguntas cortas."
      },
      {
        "title": "Días 4 y 5: práctica y corrección",
        "detail": "Haz un conjunto de preguntas que combine temas. Anota el motivo de cada error: concepto, lectura del enunciado, procedimiento o falta de tiempo."
      },
      {
        "title": "Días 6 y 7: simulación y repaso dirigido",
        "detail": "Practica en condiciones parecidas a la evaluación cuando tenga sentido. Revisa únicamente los errores relevantes y duerme según tus necesidades antes del examen."
      }
    ],
    "exampleTitle": "Ejemplo: parcial de tres unidades",
    "exampleContext": "Tienes un PDF con tres unidades de una materia introductoria. Conoces bien la primera, dudas en la segunda y apenas has practicado la tercera.",
    "exampleTasks": [
      "Distribuye los primeros bloques con más tiempo para la tercera unidad, sin abandonar la segunda.",
      "Al final de cada bloque responde dos preguntas sin mirar el resumen y registra los errores.",
      "En el último repaso mezcla las tres unidades para comprobar si las distingues cuando cambia el orden."
    ],
    "exampleOutcome": "El calendario se decide por lo que todavía necesitas aprender, no por el número de páginas que te falta leer.",
    "pitfalls": [
      {
        "title": "Estudiar todos los temas el mismo tiempo",
        "detail": "No todas las unidades tienen la misma importancia o dificultad. Ajusta la distribución al programa y al diagnóstico."
      },
      {
        "title": "Medir avance solo por horas",
        "detail": "Completar muchas horas no indica que puedas resolver una pregunta. Reserva sesiones para comprobarlo."
      },
      {
        "title": "Hacer simulacros sin analizar errores",
        "detail": "Repetir un test con las mismas respuestas puede crear falsa confianza. Cambia las preguntas y razona la corrección."
      }
    ],
    "review": "Si dispones de menos de siete días, conserva el orden de prioridades: delimitar contenidos, intentar recuperar, corregir y volver a practicar. Evita sacrificar el descanso para releer todo.",
    "faq": [
      {
        "q": "¿Cómo estudiar para un parcial si me quedan tres días?",
        "a": "Prioriza el temario confirmado y los contenidos de mayor peso. Haz preguntas cortas para detectar lagunas, corrige con la fuente y reserva un repaso final breve. No es realista aprenderlo todo desde cero."
      },
      {
        "q": "¿Qué hago si no tengo modelos de parciales?",
        "a": "Puedes formular preguntas a partir del programa y de tus apuntes, combinando conceptos, relaciones y casos de aplicación. No las confundas con preguntas oficiales."
      }
    ]
  },
  {
    "slug": "como-estudiar-examen-tipo-test",
    "category": "Preparar exámenes",
    "title": "Cómo estudiar para un examen tipo test sin memorizar opciones",
    "seoTitle": "Cómo estudiar para un examen tipo test: técnica y práctica",
    "description": "Consejos para preparar un examen tipo test con preguntas nuevas, justificación de respuestas, análisis de distractores y repaso de errores.",
    "audience": "Estudiantes que rinden exámenes con preguntas de opción múltiple",
    "question": "¿Cómo saber si entiendes una respuesta o solo reconoces la opción?",
    "opening": "Las preguntas de opción múltiple pueden evaluar recuerdo, comprensión o aplicación. Si memorizas la letra correcta de un modelo, puedes fallar ante otro enunciado. La preparación mejora cuando intentas responder antes de mirar opciones y explicas por qué descartas las alternativas.",
    "focus": "Estudia primero el concepto y después practica respuestas bajo distintas formulaciones. Revisa las instrucciones de evaluación de tu asignatura, especialmente si hay penalización por error.",
    "steps": [
      {
        "title": "Cubre el temario por conceptos",
        "detail": "Selecciona una unidad y construye una lista breve de distinciones importantes, excepciones y ejemplos. Confirma cuáles son evaluables según el programa."
      },
      {
        "title": "Recuerda antes de ver alternativas",
        "detail": "Lee la pregunta e intenta anticipar la respuesta. Cuando aparezcan las opciones, compara tu razonamiento con ellas."
      },
      {
        "title": "Explica los distractores",
        "detail": "Para cada respuesta no elegida, identifica qué parte la vuelve incorrecta según el contenido. Si no puedes explicarlo, revisa el concepto."
      },
      {
        "title": "Cambia el contexto de la pregunta",
        "detail": "Vuelve a practicar el mismo tema con un caso o enunciado nuevo. Comprueba que la comprensión se mantenga aunque cambien las palabras."
      }
    ],
    "exampleTitle": "Ejemplo: una pregunta de psicología",
    "exampleContext": "Un ejercicio pregunta qué proceso permite mantener y manipular temporalmente información para resolver una operación mental. En el material se explican distintos tipos de memoria.",
    "exampleTasks": [
      "Responde por tu cuenta qué proceso describe el enunciado antes de ver opciones.",
      "Compara por qué otros procesos de memoria no explican igualmente bien la situación.",
      "Redacta otra pregunta en la que cambie la tarea cotidiana y vuelve a justificar la respuesta."
    ],
    "exampleOutcome": "El ejercicio comprueba si puedes reconocer el mecanismo y no solo una frase conocida.",
    "pitfalls": [
      {
        "title": "Confiar en patrones de letras",
        "detail": "Responder siempre la misma letra o aprender el orden de las alternativas no demuestra dominio del contenido."
      },
      {
        "title": "Memorizar bancos antiguos sin contexto",
        "detail": "Un banco de preguntas puede servir para practicar, pero el temario, las opciones y los criterios de corrección pueden variar."
      },
      {
        "title": "Descuidar las instrucciones del examen",
        "detail": "Comprueba si hay preguntas con varias respuestas, límites de tiempo o penalización: esas reglas pueden cambiar tu estrategia."
      }
    ],
    "review": "Registra el concepto detrás de cada error y reintenta preguntas diferentes después de otro bloque de estudio. En el repaso final combina unidades en lugar de repetir solo las que ya dominas.",
    "faq": [
      {
        "q": "¿Es útil practicar con preguntas creadas por IA?",
        "a": "Puede ser una forma de obtener variaciones de ejercicios sobre tus apuntes. Es importante revisar explicaciones y exactitud; esas preguntas no reproducen necesariamente las oficiales."
      },
      {
        "q": "¿Debo hacer un simulacro cronometrado?",
        "a": "Si el examen tiene límite de tiempo, puede ayudarte a familiarizarte con el ritmo. Hazlo después de estudiar los conceptos; de poco sirve acelerar respuestas que no entiendes."
      }
    ]
  },
  {
    "slug": "como-hacer-preguntas-de-estudio-desde-pdf",
    "category": "Practicar y reforzar",
    "title": "Cómo crear preguntas de estudio útiles a partir de un PDF",
    "seoTitle": "Cómo hacer preguntas de estudio desde un PDF: guía",
    "description": "Aprende a convertir apuntes PDF en preguntas de comprensión, aplicación y repaso sin depender de preguntas automáticas superficiales.",
    "audience": "Estudiantes que quieren transformar sus propios apuntes en práctica",
    "question": "¿Cómo distinguir una buena pregunta de un ejercicio que solo repite una frase?",
    "opening": "Un generador de preguntas puede crear muchas actividades, pero la cantidad no demuestra su calidad. Para estudiar de verdad necesitas preguntas que cubran el temario, tengan una respuesta comprobable y te permitan entender por qué una alternativa es incorrecta. La fuente debe ser tu documento real, no un examen que otra persona haya rendido.",
    "focus": "Antes de generar ejercicios identifica los temas del PDF y el objetivo de cada uno. Evita que un capítulo largo reciba todas las preguntas y otro quede sin práctica.",
    "steps": [
      {
        "title": "Define el alcance y comprueba la extracción",
        "detail": "Selecciona un tema o unidad. Revisa títulos, tablas y fórmulas del PDF: si está escaneado, el texto extraído puede perder datos relevantes."
      },
      {
        "title": "Mezcla preguntas de recuerdo y aplicación",
        "detail": "Pide una pregunta sobre una idea principal, otra que compare conceptos y otra que utilice un caso nuevo. Evita diez preguntas que repitan la misma definición."
      },
      {
        "title": "Verifica la respuesta en la fuente",
        "detail": "Asegúrate de que cada respuesta se pueda justificar con el material. Si aparece un dato ausente o contradictorio, corrige la pregunta antes de usarla."
      },
      {
        "title": "Usa el resultado para decidir qué leer",
        "detail": "Después de contestar, registra errores por tema y vuelve únicamente al apartado necesario. Genera otra pregunta para comprobar la corrección."
      }
    ],
    "exampleTitle": "Ejemplo: convertir una unidad de economía en práctica",
    "exampleContext": "Tu PDF presenta oferta, demanda y equilibrio mediante definiciones y gráficos.",
    "exampleTasks": [
      "Haz una pregunta de concepto que distinga demanda de cantidad demandada.",
      "Haz otra de aplicación donde cambie una condición del mercado y debas explicar el gráfico.",
      "Comprueba el razonamiento en la unidad original y corrige cualquier pregunta ambigua."
    ],
    "exampleOutcome": "El valor está en pasar de las respuestas a una decisión de estudio: qué concepto conviene reforzar.",
    "pitfalls": [
      {
        "title": "Aceptar preguntas demasiado fáciles",
        "detail": "Una respuesta puede deducirse por una palabra repetida, sin conocer el tema. Asegúrate de que la pregunta exija comprender."
      },
      {
        "title": "Generar sin revisar las fuentes",
        "detail": "Los documentos con tablas, símbolos o fragmentos escaneados pueden contener errores de extracción. Comprueba datos y explicaciones."
      },
      {
        "title": "Confundir las preguntas con el examen real",
        "detail": "Son ejercicios de práctica sobre tu PDF, no una filtración ni una predicción de lo que evaluará la cátedra."
      }
    ],
    "review": "Conserva preguntas que cubran distintos objetivos de la unidad. Cuando vuelvas al tema, cambia los ejemplos para comprobar que no memorizaste el enunciado.",
    "faq": [
      {
        "q": "¿Cuántas preguntas necesito por tema?",
        "a": "No hay un número universal. Lo importante es cubrir las ideas relevantes y distintos niveles de comprensión; un tema complejo puede necesitar más preguntas que uno breve."
      },
      {
        "q": "¿Qué hago si el PDF está escaneado?",
        "a": "Revisa la fidelidad del texto, tablas y símbolos extraídos antes de confiar en las preguntas. Consulta el archivo original cuando algo no coincida."
      }
    ]
  },
  {
    "slug": "como-repasar-errores-despues-de-un-examen",
    "category": "Practicar y reforzar",
    "title": "Cómo repasar errores después de un test o simulacro",
    "seoTitle": "Cómo repasar errores de un examen y aprender de ellos",
    "description": "Método de revisión de errores tras una práctica: clasifica fallos, consulta tus apuntes, practica de nuevo y mide el progreso.",
    "audience": "Estudiantes que ya hicieron un examen de prueba o un preguntero",
    "question": "¿Qué hacer después de corregir respuestas en lugar de volver a estudiar todo?",
    "opening": "La corrección no termina al ver una nota. Dos respuestas equivocadas pueden necesitar soluciones diferentes: quizá desconocías el concepto, interpretaste mal el enunciado o aplicaste un procedimiento incorrecto. Clasificar el error te permite escoger una acción específica y comprobar si realmente mejoraste.",
    "focus": "Trabaja con pocos errores relevantes, identifica la causa probable y vuelve al texto original. Evita utilizar la nota de un simulacro como predicción de tu examen oficial.",
    "steps": [
      {
        "title": "Clasifica cada error por causa",
        "detail": "Marca si fue un problema de conocimiento, confusión entre conceptos, interpretación de la pregunta, procedimiento o gestión del tiempo. No todos los fallos implican falta de estudio."
      },
      {
        "title": "Busca una evidencia en tus apuntes",
        "detail": "Localiza el apartado que responde a la pregunta. Explica en una frase qué regla, concepto o procedimiento habías olvidado o confundido."
      },
      {
        "title": "Reformula y vuelve a intentar",
        "detail": "No repitas inmediatamente la misma alternativa. Resuelve una pregunta parecida con otro ejemplo y justifica cada paso."
      },
      {
        "title": "Programa una segunda comprobación",
        "detail": "Regresa al tema en otra sesión; si lo respondes sin mirar y en un contexto nuevo, tendrás una señal mejor de comprensión."
      }
    ],
    "exampleTitle": "Ejemplo: error al interpretar un gráfico",
    "exampleContext": "En un simulacro de economía confundiste un cambio en la demanda con una variación de cantidad demandada.",
    "exampleTasks": [
      "Identifica que el fallo fue de interpretación del modelo, no necesariamente de memoria.",
      "Revisa en el PDF qué factores provocan cada tipo de cambio.",
      "Resuelve una situación nueva y explica por qué se mueve o no la curva."
    ],
    "exampleOutcome": "El error se transforma en un objetivo de estudio verificable: interpretar correctamente otro gráfico.",
    "pitfalls": [
      {
        "title": "Releer toda la unidad ante un solo fallo",
        "detail": "Puede ser innecesario si el problema es muy localizado. Revisa primero el concepto que causó el error."
      },
      {
        "title": "Aprender de memoria la respuesta correcta",
        "detail": "Si solo recuerdas la opción, puedes fallar cuando cambie el enunciado. Explica el motivo de la respuesta."
      },
      {
        "title": "Practicar de nuevo sin cambiar nada",
        "detail": "Repetir la misma pregunta muchas veces puede inflar el resultado sin mostrar comprensión transferible."
      }
    ],
    "review": "Prepara un listado breve de conceptos a reforzar y combina preguntas nuevas con algunas de otras unidades. Si vuelves a fallar, revisa si la causa es diferente a la primera vez.",
    "faq": [
      {
        "q": "¿Cuánto tiempo dedicar a repasar errores?",
        "a": "Depende del número y la gravedad de las dudas. Prioriza errores ligados a conceptos centrales y evita que la revisión desplace toda la práctica posterior."
      },
      {
        "q": "¿Puedo estudiar solo los errores de un simulacro?",
        "a": "Es un buen punto de partida, pero complementa con otros temas del programa para no dejar fuera contenido que no apareció en esa práctica."
      }
    ]
  }
];

export function getStudyGuide(slug: string): StudyGuide | undefined {
  return STUDY_GUIDES.find((guide) => guide.slug === slug);
}
