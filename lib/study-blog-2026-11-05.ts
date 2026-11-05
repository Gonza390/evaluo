import type { StudyBlogArticle } from './study-blog-articles';

// Original, source-backed, bilingual articles drafted 2026-11-05. No competitor text is reproduced.
// The same key links language variants for canonical/hreflang in the existing blog routing.
export const NOV5_ES_BLOG: StudyBlogArticle[] = [
  {
    "key": "concept-maps-nov2026",
    "slug": "como-hacer-un-mapa-conceptual-para-estudiar",
    "title": "Cómo hacer un mapa conceptual para estudiar: ejemplo completo y práctica",
    "seoTitle": "Mapa conceptual para estudiar: pasos, ejemplo y errores",
    "description": "Aprendé a construir un mapa conceptual con enlaces que tengan sentido, un ejemplo resuelto de biología y preguntas para comprobar lo aprendido.",
    "category": "Técnicas de estudio",
    "lead": "Un mapa conceptual útil no es un dibujo lleno de recuadros. Es una forma de comprobar si podés unir ideas mediante afirmaciones correctas. Si dos conceptos están conectados pero no podés decir qué relación tienen, todavía no terminaste de estudiar ese vínculo.",
    "takeaway": "Uní conceptos con verbos que formen afirmaciones verificables, contrastá cada relación con tus apuntes y después cerrá el mapa para responder preguntas sin mirar.",
    "sections": [
      {
        "heading": "Qué diferencia un mapa conceptual de un mapa mental",
        "paragraphs": [
          "En un mapa conceptual se representan conceptos y relaciones explícitas. Un recuadro puede decir «fotosíntesis», otro «cloroplastos» y el conector «ocurre en»: la afirmación completa es comprobable. Un mapa mental suele organizar asociaciones alrededor de una idea central y puede usar ramas, colores o imágenes sin escribir proposiciones entre todos los nodos.",
          "Ninguno reemplaza por sí solo el estudio activo. Elegí un mapa conceptual cuando necesites razonar mecanismos, causas o jerarquías; elegí un esquema para ordenar un temario o un mapa mental para explorar asociaciones. La herramienta de mapas mentales de Evaluo no debe confundirse con un editor de mapas conceptuales."
        ]
      },
      {
        "heading": "Paso a paso: de una pregunta a relaciones justificadas",
        "paragraphs": [
          "Primero escribí una pregunta guía, por ejemplo «¿qué necesita y qué produce la fotosíntesis?». Después elegí entre ocho y doce conceptos del material, priorizando los que responden esa pregunta. Colocá arriba la noción general; debajo, procesos, condiciones, lugares y resultados. No copies todos los sustantivos de una página.",
          "Conectá pares de conceptos con expresiones que conviertan la flecha en una oración correcta: «fotosíntesis — ocurre principalmente en — cloroplastos». Revisá la dirección de cada relación, agregá enlaces cruzados cuando tengan sentido y eliminá flechas decorativas. Finalmente compará el mapa con el PDF o el libro de cátedra."
        ]
      },
      {
        "heading": "Ejemplo resuelto: fotosíntesis y sus componentes",
        "paragraphs": [
          "En un esquema básico de plantas, escribimos «fotosíntesis» como concepto principal. Desde allí podemos conectar «requiere energía de — luz», «utiliza — agua» y «utiliza — dióxido de carbono». Otra relación válida es «fotosíntesis — produce — azúcares» y «libera — oxígeno». La explicación exacta de las etapas depende del nivel de la materia.",
          "El vínculo problemático «la luz se convierte directamente en oxígeno» parece corto, pero es conceptualmente incorrecto: el oxígeno liberado procede del agua en las reacciones luminosas y la energía luminosa se transforma mediante varios procesos. Corregir una sola flecha así puede revelar una confusión que un gráfico bonito habría ocultado."
        ]
      },
      {
        "heading": "Cómo comprobar si el mapa ayuda a aprender",
        "paragraphs": [
          "Tapá palabras de enlace y preguntate qué verbo completa cada proposición. Después ocultá tres nodos y reconstruí relaciones sin consultar el material. Una última pregunta debe exigir una aplicación: «¿qué proceso cambiaría si faltara luz?»; respondé sin exagerar lo que el esquema permite concluir.",
          "Volvé al material para corregir relaciones dudosas. La evidencia sobre práctica de recuperación indica que responder sin mirar puede favorecer aprendizaje y transferencia; no asumas que crear el mapa por sí solo garantiza recordar. Si ya tenés tu PDF o DOCX en Evaluo, podés usar la práctica por temas para detectar qué relaciones entendés y cuáles necesitás reforzar."
        ]
      },
      {
        "heading": "Errores frecuentes y una plantilla para volver a intentarlo",
        "paragraphs": [
          "Revisá cuatro cosas antes de dar el mapa por terminado: ¿cada flecha forma una oración?, ¿los conceptos están a un nivel parecido de precisión?, ¿hay una relación causal confundida con una mera asociación?, ¿podés justificar los enlaces con una página concreta del apunte? Una flecha sin verbo no demuestra comprensión.",
          "Usá una plantilla textual mínima: «pregunta guía → concepto general → 3 grupos de conceptos → enlaces verbales → excepción o condición → pregunta de aplicación». No hace falta software; papel, pizarra o un editor de diagramas alcanzan. Separá la construcción visual de la práctica de preguntas que comprueba lo que aprendiste."
        ]
      }
    ],
    "exercise": {
      "title": "Ejercicio resuelto: corregí cinco conexiones de un mapa",
      "context": "Un estudiante prepara un mapa sobre fotosíntesis a partir de una unidad introductoria de biología. Debe validar cada conexión usando el texto de su curso.",
      "steps": [
        "1. «Fotosíntesis — ocurre en — cloroplastos»: correcta como explicación general para plantas. Agregá la precisión que exija la cátedra si distingue tejidos o etapas.",
        "2. «Fotosíntesis — utiliza — dióxido de carbono»: correcta. El carbono de los azúcares sintetizados se obtiene del CO₂ fijado en el proceso.",
        "3. «Fotosíntesis — utiliza — agua»: correcta. El agua participa en las reacciones luminosas; la ecuación global puede simplificar varias etapas.",
        "4. «Fotosíntesis — produce directamente desde la luz — oxígeno»: incorrecta. El oxígeno liberado procede del agua; la luz aporta energía para las reacciones.",
        "5. «Fotosíntesis — permite formar — azúcares»: correcta como resultado neto simplificado. Pregunta final: ¿podés justificar cada vínculo sin mirar el esquema?"
      ],
      "check": "La corrección no consiste en contar cinco flechas: la clave es descubrir por qué la cuarta relación era engañosa y contrastarla con la bibliografía del programa."
    },
    "mistakes": [
      {
        "title": "Dibujar flechas sin palabras",
        "why": "Si no podés leer una proposición completa, una conexión puede parecer correcta aunque relacione dos ideas equivocadas."
      },
      {
        "title": "Confundir mapa conceptual y mapa mental",
        "why": "Un mapa mental ordena asociaciones; un mapa conceptual requiere explicitar y verificar el vínculo entre conceptos."
      },
      {
        "title": "Memorizar el diagrama en lugar de comprenderlo",
        "why": "Si solo lo reconocés cuando está abierto, completá la actividad con preguntas de recuperación y aplicación."
      }
    ],
    "faq": [
      {
        "question": "¿Cuántos conceptos debe tener un mapa conceptual?",
        "answer": "Usá solo los necesarios para responder una pregunta guía. Para empezar, ocho a doce pueden ser manejables; una unidad compleja necesitará más o varios mapas."
      },
      {
        "question": "¿Puedo hacerlo gratis?",
        "answer": "Sí. Papel, pizarra o un editor de diagramas son suficientes. Lo importante son las relaciones verificables, no el programa elegido."
      },
      {
        "question": "¿Evaluo crea mapas conceptuales automáticamente?",
        "answer": "Evaluo ofrece mapas mentales y herramientas para estudiar materiales. Esta guía enseña a construir manualmente mapas conceptuales y a comprobar conceptos mediante práctica; no presenta ambas funciones como idénticas."
      }
    ],
    "sources": [
      {
        "title": "Carnegie Mellon University · Using Concept Maps",
        "url": "https://www.cmu.edu/teaching/assessment/assesslearning/conceptmaps.html"
      },
      {
        "title": "Stanford CTL · Concept Mapping",
        "url": "https://ctl.stanford.edu/students/concept-mapping"
      },
      {
        "title": "Karpicke & Blunt (2011) · Retrieval practice and concept mapping",
        "url": "https://pubmed.ncbi.nlm.nih.gov/21252317/"
      }
    ]
  },
  {
    "key": "pomodoro-nov2026",
    "slug": "metodo-pomodoro-para-estudiar",
    "title": "Método Pomodoro para estudiar: ejemplo de 85 minutos y práctica real",
    "seoTitle": "Método Pomodoro para estudiar: 25/5, ejemplo y límites",
    "description": "Usá el método Pomodoro con objetivos concretos, pausas y preguntas de práctica. Incluye un ejemplo de 85 minutos y cuándo conviene adaptar el reloj.",
    "category": "Técnicas de estudio",
    "lead": "El método Pomodoro puede ayudarte a empezar una tarea y reducir las interrupciones, pero un temporizador no comprueba que entendiste una unidad. Para estudiar en la universidad, necesitás definir qué vas a lograr en cada bloque y terminar con una evidencia de aprendizaje.",
    "takeaway": "La sesión no se mide solo en minutos: al terminar, deberías poder explicar un concepto, resolver una pregunta o detectar un error que antes no habías visto.",
    "sections": [
      {
        "heading": "Qué es el método Pomodoro y cómo se adapta al estudio",
        "paragraphs": [
          "Una versión habitual propone 25 minutos de concentración y 5 minutos de descanso. Tras varios bloques se utiliza una pausa más larga. El objetivo práctico es dedicar un intervalo definido a una tarea, reducir interrupciones y descansar de manera regular; no es una ley científica sobre la duración óptima de la atención.",
          "Si tu examen exige resolver problemas largos, no hace falta cortar un razonamiento a mitad de cada cálculo. Podés terminar el paso lógico, registrar por dónde seguir y ajustar los intervalos. Una sesión de 40 minutos con pausas puede ser más conveniente que forzar la regla 25/5."
        ]
      },
      {
        "heading": "Elegí una meta comprobable antes de activar el reloj",
        "paragraphs": [
          "«Estudiar biología» no es una meta operativa. En cambio, «explicar la diferencia entre difusión simple y facilitada y responder tres preguntas» indica qué trabajo concreto cabe en un bloque. Prepará el PDF o los apuntes, elegí la unidad que entra al examen y silenciá notificaciones.",
          "Anotá en una hoja las distracciones que aparezcan sin investigarlas en el momento, salvo una urgencia real. Si la tarea dura menos de 25 minutos, agrupá dos objetivos compatibles. Si es extensa, dividila por resultados que puedas revisar en vez de por páginas leídas."
        ]
      },
      {
        "heading": "Ejemplo: una sesión universitaria de 85 minutos",
        "paragraphs": [
          "Bloque 1 (25 minutos): leé un apartado de historia económica y escribí de memoria dos causas y dos consecuencias de un cambio histórico que figure en el programa. Descansá 5 minutos. Bloque 2 (25 minutos): contrastá tu explicación con el material, corregí lo que omitiste y elaborá tres preguntas de aplicación.",
          "Después de otros 5 minutos de descanso, bloque 3 (25 minutos): respondé las tres preguntas sin mirar, explicá por qué descartaste las otras interpretaciones y anotá los errores. Son 75 minutos de trabajo y 10 de pausas. Si el tercer bloque revela una confusión importante, el siguiente estudio debería enfocarse en ella, no en completar más páginas."
        ]
      },
      {
        "heading": "Cuándo el Pomodoro no está resolviendo tu problema",
        "paragraphs": [
          "Si terminás cuatro bloques sin poder contestar una pregunta del temario, estás controlando el tiempo pero no el aprendizaje. En materias cuantitativas, dedicar media hora a comprobar un desarrollo puede valer más que tres bloques de lectura. Para tareas breves y repetitivas el ritmo puede ayudar; para una demostración compleja puede interrumpirla.",
          "Tampoco conviene usar el reloj para ignorar cansancio extremo o necesidades básicas. Ajustá duración, pausas y carga a tus circunstancias. El sistema funciona como apoyo organizativo, no como tratamiento ni prueba automática de que la memoria mejoró."
        ]
      },
      {
        "heading": "Cómo conectarlo con el PDF y el simulacro de examen",
        "paragraphs": [
          "Usá el primer bloque para comprender un tema del PDF o DOCX, el segundo para generar preguntas a partir de sus conceptos y el tercero para recuperar respuestas sin ver el material. Al terminar, revisá qué enunciados fallaste y si el error fue de concepto, aplicación o lectura. Volvé a practicar otro día.",
          "En Evaluo podés cargar el material, estudiar por temas y practicar con preguntas y explicaciones de error. Podés usar cualquier reloj externo para marcar tus intervalos; esta guía no supone que Evaluo incluya un temporizador Pomodoro ni garantiza que una cantidad fija de bloques equivalga a dominar la materia."
        ]
      }
    ],
    "exercise": {
      "title": "Plan resuelto: tres Pomodoros para una unidad de examen",
      "context": "Disponés de 85 minutos para repasar una unidad que ya leíste parcialmente. Necesitás comprobar lo que recordás, no volver a leerla entera.",
      "steps": [
        "0–25 min: escribí una explicación de dos mecanismos presentes en tu apunte, sin copiar las frases del PDF.",
        "25–30 min: pausa corta, levantate y evitá abrir nuevas tareas digitales.",
        "30–55 min: revisá el texto, corregí las afirmaciones incorrectas y prepará tres preguntas con respuestas verificables.",
        "55–60 min: segunda pausa. Antes de continuar, elegí la pregunta que te parece más difícil.",
        "60–85 min: respondé sin mirar las tres preguntas, justificá cada respuesta y registrá un concepto que necesite repaso mañana."
      ],
      "check": "Comprobación aritmética: 3 × 25 = 75 minutos de estudio; 2 × 5 = 10 de descanso; total = 85. La medida pedagógica es lo que pudiste responder, no el tiempo acumulado."
    },
    "mistakes": [
      {
        "title": "Completar sesiones sin objetivos",
        "why": "Un bloque solo es útil si termina con una tarea observable, como explicar, resolver o corregir."
      },
      {
        "title": "Cortar una demostración en un punto crítico",
        "why": "En problemas que requieren continuidad conviene registrar el paso, terminar una unidad lógica y adaptar la duración."
      },
      {
        "title": "Confundir estar enfocado con recordar",
        "why": "Después de leer, cerrá el material y comprobá aprendizaje con preguntas y repaso distribuido."
      }
    ],
    "faq": [
      {
        "question": "¿El Pomodoro siempre debe durar 25 minutos?",
        "answer": "No. Es una convención práctica. Elegí intervalos que se ajusten a tu materia y pausas que realmente puedas sostener."
      },
      {
        "question": "¿Sirve para estudiar un PDF largo?",
        "answer": "Sí, como forma de dividir tareas por temas. No alcanza con medir lectura: incluí explicaciones y preguntas sin consultar el archivo."
      },
      {
        "question": "¿Evaluo tiene un temporizador Pomodoro?",
        "answer": "Esta guía no presenta un temporizador integrado. Podés combinar un reloj externo con los materiales, prácticas por temas y revisiones de Evaluo."
      }
    ],
    "sources": [
      {
        "title": "Duke University · Pomodoro Technique",
        "url": "https://arc.duke.edu/pomodoro-technique/"
      },
      {
        "title": "Stanford CTL · Concentrate to Improve Learning",
        "url": "https://ctl.stanford.edu/students/concentrate-improve-learning-and-productivity"
      },
      {
        "title": "Karpicke & Blunt (2011) · Retrieval practice and concept mapping",
        "url": "https://pubmed.ncbi.nlm.nih.gov/21252317/"
      }
    ]
  },
  {
    "key": "mcq-exam-nov2026",
    "slug": "como-estudiar-examen-tipo-test",
    "title": "Cómo estudiar para un examen tipo test: seis preguntas resueltas",
    "seoTitle": "Examen tipo test: cómo estudiar, practicar y corregir errores",
    "description": "Guía para exámenes de opción múltiple con seis preguntas originales de marketing, distractores explicados y un plan de práctica desde tus apuntes.",
    "category": "Preparación de exámenes",
    "lead": "En un examen tipo test, reconocer un término no es lo mismo que distinguirlo de otros parecidos. Prepararte implica ensayar respuestas sin mirar el texto, identificar trampas conceptuales y aprender por qué las alternativas incorrectas son incorrectas.",
    "takeaway": "Corregí las opciones, no solo el puntaje: después de cada práctica sabé qué diferencia conceptual te faltó y en qué parte del material podés verificarla.",
    "sections": [
      {
        "heading": "Qué medir antes de empezar a responder preguntas",
        "paragraphs": [
          "Revisá formato, alcance y criterios reales de tu examen: cantidad de temas, preguntas con una o varias respuestas correctas, penalización por errores y tiempo disponible. No uses una estrategia de adivinación sin conocer la regla de puntuación. Construí una tabla con «concepto», «concepto parecido», «diferencia decisiva» y «página del material».",
          "Si la materia es marketing, por ejemplo, es fácil confundir segmentación de mercado, elección del público objetivo y posicionamiento. Antes de ver opciones, explicá con tus palabras qué hace cada proceso: agrupar clientes, seleccionar a quién dirigirse y definir el lugar o beneficio que se busca comunicar."
        ]
      },
      {
        "heading": "Entrená recuperación antes de leer las opciones",
        "paragraphs": [
          "Tapá las alternativas y tratá de resolver el enunciado. Luego leé todas, incluso si la primera parece correcta. Prestá atención a palabras como «excepto» y «siempre», pero no descartes una respuesta automáticamente solo por ser absoluta: la clave es contrastar con la teoría y el caso.",
          "Intercalá preguntas de diferentes temas cuando hayas aprendido sus fundamentos. Un banco que contiene seis preguntas idénticas con palabras cambiadas no mide transferencia; incorporá casos breves, comparaciones y excepciones del programa."
        ]
      },
      {
        "heading": "Taller de seis preguntas originales: un caso común",
        "paragraphs": [
          "Imaginá una aplicación de estudio ficticia que ofrece ejercicios desde apuntes universitarios. El equipo estudia qué estudiantes la usan, elige un segmento para una campaña y comunica la ventaja de practicar por temas. Usaremos ese mismo caso para distinguir operaciones de marketing, no para describir datos reales de Evaluo.",
          "Cada ejercicio tiene una opción correcta y dos distractores plausibles. Respondé primero, revisá la explicación completa y etiquetá tu fallo: definición, interpretación del caso o lectura del enunciado. La corrección de distractores es importante: la investigación sobre pruebas de opción múltiple encuentra beneficios del feedback para reducir la incorporación de información equivocada."
        ]
      },
      {
        "heading": "Qué hacer después de acertar por casualidad o equivocarte",
        "paragraphs": [
          "Un acierto con dudas debe revisarse igual que un error: registrá la alternativa que casi elegís, por qué era atractiva y qué dato la refuta. No copies la definición completa del tema; escribí la regla breve que te habría permitido responder correctamente.",
          "Programá una segunda pregunta sobre la misma distinción, pero con otro caso, y un repaso más adelante. Si una opción es ambigua o el enunciado carece de datos, marcá la pregunta para revisión en lugar de memorizar una corrección dudosa. El objetivo es calidad del razonamiento, no acumular intentos."
        ]
      },
      {
        "heading": "Plan para el simulacro y el examen real",
        "paragraphs": [
          "Primero practicá por temas para localizar lagunas; después mezclá preguntas de todas las unidades en una sesión cronometrada si el examen real tiene límite de tiempo. Reservá los últimos minutos para revisar preguntas marcadas y verificar instrucciones de respuesta. El modo de calificación del docente define cómo gestionar preguntas inciertas.",
          "Si cargás tu PDF o DOCX en Evaluo, podés estudiar el tema y practicar con preguntas antes de pasar a un simulacro más amplio, cuando esté disponible para tu material y plan. Revisá las explicaciones para volver al concepto erróneo. Las seis preguntas que siguen son didácticas y no sustituyen los contenidos exactos de tu cátedra."
        ]
      }
    ],
    "exercise": {
      "title": "Simulacro resuelto: seis preguntas de introducción al marketing",
      "context": "Una app educativa ficticia prepara una campaña. Cada enunciado tiene UNA respuesta correcta; leé primero la pregunta y luego compará la explicación de cada distractor.",
      "steps": [
        "1. La app divide clientes por año de carrera. ¿Qué acción realiza? A) Segmentación. B) Posicionamiento. C) Fijación de precios. Correcta: A, porque agrupa personas por una característica. B define cómo se quiere percibir la propuesta; C establece condiciones de precio.",
        "2. Tras estudiar los grupos, decide dirigirse a estudiantes de primer año. ¿Qué hizo? A) Investigó precios. B) Seleccionó mercado objetivo. C) Diseñó un logotipo. Correcta: B: eligió uno de los segmentos. A podría informar decisiones pero no describe la elección; C es una acción de identidad visual.",
        "3. Publica «practicá con preguntas basadas en tus apuntes». ¿Qué expresa principalmente? A) Canal de distribución. B) Propuesta de valor. C) Tamaño del mercado. Correcta: B, porque comunica un beneficio. A trata cómo llega el producto; C refiere cuántos compradores potenciales existen.",
        "4. Una encuesta muestra que 7 de 10 participantes quieren practicar más. ¿Qué conclusión es válida? A) El 70 % del país pagará. B) En esa muestra, el 70 % expresó esa preferencia. C) El precio ideal queda demostrado. Correcta: B: describe la muestra. A generaliza indebidamente; C atribuye información de precios que no se preguntó.",
        "5. ¿Qué ejemplo mide una conversión definida como «registro»? A) Número de visitas. B) Número de cuentas creadas. C) Número de veces que aparece el anuncio. Correcta: B: es el evento definido. A mide tráfico; C impresiones publicitarias.",
        "6. Una campaña consigue 100 clics y 5 registros. ¿Qué tasa de registro por clic tuvo? A) 5 %. B) 20 %. C) 95 %. Correcta: A: 5/100 × 100 = 5 %. B invierte incorrectamente la proporción; C confunde clics sin registro con registros."
      ],
      "check": "Respuesta final: 1A, 2B, 3B, 4B, 5B, 6A. El ejercicio enseña distinciones y un cálculo simple; para un examen real contrastá definiciones y convenciones con tu bibliografía."
    },
    "mistakes": [
      {
        "title": "Estudiar solo la respuesta correcta",
        "why": "Los distractores plausibles revelan distinciones débiles; explicalos para no reforzar interpretaciones falsas."
      },
      {
        "title": "Practicar con preguntas ajenas al temario",
        "why": "Un test popular puede ser entretenido y aun así evaluar conceptos que tu docente no exige."
      },
      {
        "title": "No revisar aciertos dudosos",
        "why": "Adivinar bien no significa dominar el concepto. Revisá también respuestas correctas con poca confianza."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo estudiar para un examen tipo test en pocos días?",
        "answer": "Priorizá temas que entran realmente, practicá preguntas con opciones creíbles y revisá errores por concepto. El tiempo disponible no garantiza cubrirlo todo."
      },
      {
        "question": "¿Es mejor practicar por temas o hacer simulacros?",
        "answer": "Usá ambos en momentos distintos: por temas para aprender y corregir, y simulacros mixtos para comprobar reconocimiento y gestión del tiempo."
      },
      {
        "question": "¿Cambiar una respuesta siempre es bueno?",
        "answer": "No. Cambiala si detectás un error verificable de lectura o contenido, no por ansiedad. Revisá las reglas de puntuación y las indicaciones de tu examen."
      }
    ],
    "sources": [
      {
        "title": "Butler & Roediger (2008) · Feedback and multiple-choice testing",
        "url": "https://pubmed.ncbi.nlm.nih.gov/18491500/"
      },
      {
        "title": "Butler, Karpicke & Roediger (2007) · Feedback timing",
        "url": "https://pubmed.ncbi.nlm.nih.gov/18194050/"
      },
      {
        "title": "Roediger & Karpicke (2006) · The Power of Testing Memory",
        "url": "https://pubmed.ncbi.nlm.nih.gov/26151629/"
      }
    ]
  },
  {
    "key": "feynman-nov2026",
    "slug": "tecnica-feynman-para-estudiar",
    "title": "Técnica Feynman para estudiar: explicá, detectá errores y practicá",
    "seoTitle": "Técnica Feynman: pasos y ejemplo de biología resuelto",
    "description": "Aprendé a usar la técnica Feynman con un ejemplo completo de ósmosis, corrección de errores y preguntas para comprobar la comprensión.",
    "category": "Técnicas de estudio",
    "lead": "Explicar una idea con palabras sencillas puede mostrarte dónde terminan tus certezas. Pero una explicación fluida también puede estar equivocada: el paso decisivo no es sonar convincente, sino comparar lo que dijiste con una fuente correcta y poder aplicar el concepto.",
    "takeaway": "Convertí cada laguna de tu explicación en una pregunta comprobable. Volvé al apunte, corregí la idea y probá un caso distinto sin mirar.",
    "sections": [
      {
        "heading": "Los cuatro momentos de la técnica y qué no garantiza",
        "paragraphs": [
          "Elegí un concepto delimitado; intentá explicarlo a una persona sin conocimientos previos; anotá exactamente dónde te trabaste o simplificaste de más; contrastá esas partes con el material y reconstruí la explicación. Después de repetir, probá aplicarlo a una situación nueva. No hace falta enseñar realmente a alguien para descubrir dudas.",
          "El nombre de la técnica no implica que cualquier uso esté validado por un ensayo específico. Hay evidencia sobre expectativa de enseñar, autoexplicación y recuperación de información, pero esos estudios no prueban que seguir cuatro pasos fijos sea siempre superior para cualquier materia. Contrastá resultados con preguntas de aplicación."
        ]
      },
      {
        "heading": "Ejemplo: una explicación que parece clara pero es falsa",
        "paragraphs": [
          "Supongamos que estudiás ósmosis en biología general y escribís: «el agua va desde donde hay más sal hacia donde hay menos para equilibrarlas». La frase es simple, pero invierte la dirección esperada del movimiento neto de agua en una comparación introductoria de dos soluciones separadas por membrana permeable al agua.",
          "Identificá la laguna: confundir movimiento de agua con difusión de solutos. En el caso simplificado sin diferencias de presión relevantes, el agua se mueve netamente hacia el lado con mayor concentración de solutos no permeantes. El contexto real puede incluir gradientes de presión, membranas y solutos con distintas permeabilidades; no repitas la regla fuera de sus supuestos."
        ]
      },
      {
        "heading": "Cómo reconstruir la explicación correctamente",
        "paragraphs": [
          "Escribí: «La ósmosis es movimiento neto de agua a través de una membrana semipermeable, impulsado por diferencias de potencial químico del agua. En el caso simple de soluciones acuosas separadas, el agua tiende a desplazarse hacia la solución con mayor concentración efectiva de solutos que no atraviesan la membrana». Eso tiene más precisión, aunque siga siendo una simplificación pedagógica.",
          "Volvé a simplificar sin perder lo importante: «si la membrana deja pasar agua, pero no ciertos solutos, el agua se redistribuye según el gradiente relevante». Señalá en tu PDF qué definición, esquema o experimento respalda la frase. Si el curso utiliza tonicidad, diferenciá solutos penetrantes y no penetrantes."
        ]
      },
      {
        "heading": "Dos preguntas de transferencia para evitar memorizar la frase",
        "paragraphs": [
          "Pregunta 1: en un modelo de célula con medio externo hipotónico respecto del interior, ¿qué dirección neta de agua esperás al inicio? En condiciones típicas, hacia la célula, porque el medio externo tiene menor concentración efectiva de solutos no penetrantes. Debés verificar el tipo celular y la membrana del ejemplo del curso.",
          "Pregunta 2: ¿podés afirmar lo mismo si una presión hidrostática externa importante se opone al movimiento? No sin analizar ese factor adicional. Esta segunda respuesta demuestra el límite de una explicación simple, un matiz que resulta más valioso que repetir «el agua se mueve» de memoria."
        ]
      },
      {
        "heading": "De la autoexplicación a la práctica en Evaluo",
        "paragraphs": [
          "Elegí una unidad de tu PDF/DOCX y escribí una explicación de tres a cinco frases sin copiar el resumen. Etiquetá cada duda como definición, mecanismo, excepción o aplicación. Contrastá las frases con la fuente original; si tu explicación era falsa, corregila antes de enseñarla.",
          "Después respondé preguntas del mismo tema y revisá explicaciones de error. Si no tenés problemas, intentá una pregunta de transferencia o una comparación con otro proceso. Evaluo permite pasar del material a la práctica por temas; la técnica Feynman es una actividad de estudio que podés hacer con o sin la plataforma."
        ]
      }
    ],
    "exercise": {
      "title": "Ejercicio resuelto: detective de errores en una explicación",
      "context": "Estás preparando un parcial de membranas celulares y un compañero explica ósmosis. Tu tarea es detectar el supuesto omitido y proponer una prueba.",
      "steps": [
        "1. Explicación inicial: «en ósmosis, el agua siempre va del lado más salado al menos salado». Señalá «siempre» y el sentido del flujo como focos de error.",
        "2. Contrastá: si dos soluciones están separadas por una membrana permeable al agua pero no a un soluto y no hay otras fuerzas dominantes, el movimiento neto se dirige hacia el lado con mayor concentración efectiva de solutos no penetrantes.",
        "3. Reconstruí una versión más simple: «el agua tiende a pasar hacia el lado con mayor concentración de solutos que la membrana no deja cruzar, bajo las condiciones del ejemplo».",
        "4. Aplicación: una célula animal en medio hipotónico tiende a ganar agua al principio; una célula vegetal tiene pared celular, así que sus consecuencias mecánicas difieren.",
        "5. Límite: con diferencias de presión importantes o solutos permeantes no alcanza con la regla corta. Consultá el material de clase y justificá el modelo utilizado."
      ],
      "check": "Para comprobar comprensión, redactá una pregunta nueva que cambie una condición del sistema y resolvela sin leer tu explicación."
    },
    "mistakes": [
      {
        "title": "Creer que hablar con soltura es prueba de dominio",
        "why": "Las explicaciones convincentes pueden contener inversiones causales o generalizaciones; contrastalas con una fuente."
      },
      {
        "title": "Simplificar hasta borrar las condiciones",
        "why": "Una regla corta sin excepciones puede fallar en un caso distinto. Conservá las condiciones relevantes del programa."
      },
      {
        "title": "No comprobar transferencia",
        "why": "Repetir exactamente el mismo ejemplo no muestra si podés aplicar el concepto en otra situación."
      }
    ],
    "faq": [
      {
        "question": "¿Sirve la técnica Feynman para materias difíciles?",
        "answer": "Puede ayudar a localizar lagunas, pero en cálculo, derecho o medicina también tenés que resolver casos y contrastar criterios especializados."
      },
      {
        "question": "¿Tengo que explicar el tema a otra persona?",
        "answer": "No necesariamente. Podés escribir, hablar en voz alta o grabarte, siempre que identifiques y corrijas puntos dudosos."
      },
      {
        "question": "¿Qué hago cuando la explicación está mal?",
        "answer": "Volvé a la definición o mecanismo del material, escribí la corrección, comprobá sus supuestos y resolvé una pregunta nueva."
      }
    ],
    "sources": [
      {
        "title": "University of Colorado Boulder · The Feynman Technique",
        "url": "https://www.colorado.edu/artssciences-advising/resource-library/life-skills/the-feynman-technique-in-academic-coaching"
      },
      {
        "title": "Nestojko et al. (2014) · Expecting to teach and learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/24845756/"
      },
      {
        "title": "Roediger & Karpicke (2006) · The Power of Testing Memory",
        "url": "https://pubmed.ncbi.nlm.nih.gov/26151629/"
      }
    ]
  }
];

export const NOV5_EN_BLOG: StudyBlogArticle[] = [
  {
    "key": "concept-maps-nov2026",
    "slug": "how-to-make-a-concept-map-for-studying",
    "title": "How to Make a Concept Map for Studying: A Worked Example",
    "seoTitle": "Concept Maps for Studying: Steps, Examples and Checks",
    "description": "Learn how to make a concept map with meaningful linking phrases, a worked ecology example and retrieval questions to check understanding.",
    "category": "Study methods",
    "lead": "A concept map is more than a set of boxes joined by lines. Each labeled link should express a claim you can verify. Used carefully, the map can reveal where your understanding is detailed—and where it is only a collection of familiar words.",
    "takeaway": "Read each connection as a sentence. Verify it against the course material, then close the diagram and answer questions that require the same ideas in a new situation.",
    "sections": [
      {
        "heading": "Concept maps, mind maps and outlines are not the same thing",
        "paragraphs": [
          "Concept maps make relationships explicit with linking words: «producer — obtains energy from — sunlight» is a proposition you can evaluate. Mind maps commonly radiate associations from a central term; outlines organize a sequence or hierarchy. All three can support organization, but only labeled relationships let you inspect a proposition directly.",
          "Choose a concept map when a subject depends on mechanisms, comparisons or cause-and-effect links. Do not mistake an attractive drawing for evidence of learning. Evaluo can support the study process with materials and topic practice; its mind-map feature is not described here as a concept-map editor."
        ]
      },
      {
        "heading": "Start with a question, not a graphic template",
        "paragraphs": [
          "Write a focused question such as «How does energy move through a simple food web?» List about ten terms from your textbook: sunlight, producer, photosynthesis, herbivore, carnivore, decomposer, energy, biomass, respiration, nutrients and ecosystem. Adjust the list to the definitions used in your course.",
          "Arrange the most inclusive ideas first, then add more specific terms. Turn each connection into a grammatical statement. Cross-links should explain a relationship between branches, not fill empty space. Check each sentence against the source and fix any claim whose direction or scope is wrong."
        ]
      },
      {
        "heading": "Worked example: a simple ecosystem",
        "paragraphs": [
          "Put «ecosystem» at the top and connect «includes — organisms». A second branch can say «producers — convert — light energy into chemical energy» and «consumers — obtain energy by eating — organisms». Add «decomposers — break down — dead organic matter» and «nutrients — are recycled through — ecological processes».",
          "Do not add «energy — is recycled indefinitely» because energy flows through ecosystems and is dissipated, whereas elements such as carbon and nitrogen can cycle. This contrast is a useful cross-link between the energy branch and the matter branch. Verify the details at the level your class requires."
        ]
      },
      {
        "heading": "Use the map to test understanding rather than just recall its layout",
        "paragraphs": [
          "Hide a linking phrase and reconstruct the statement from memory. Then cover a node and identify which claims change. Finally ask a transfer question: «What would happen to the energy available to consumers if producer productivity declined?» State what you would need to know before predicting an exact magnitude.",
          "Return to the textbook to correct unsupported claims. Research comparing retrieval practice with concept mapping shows that the act of retrieving and applying ideas deserves attention alongside organizing them. Consider a short set of practice questions in Evaluo if you are studying from an assigned PDF or DOCX."
        ]
      },
      {
        "heading": "Revise efficiently and avoid misleading visual shortcuts",
        "paragraphs": [
          "Ask whether every arrow can be read aloud, whether you used «causes» where the text only supports «is associated with», and whether two branches disagree. Remove unnecessary nodes and write sources beside facts that are easy to misstate.",
          "You can make the diagram on paper or with a general drawing tool. The point is the reasoning you can defend. Finish with one applied question for each major branch rather than treating the completed map as the end of the lesson."
        ]
      }
    ],
    "exercise": {
      "title": "Worked exercise: identify the misleading ecosystem link",
      "context": "An undergraduate draws five propositions about ecosystem energy and matter. Evaluate each one, then explain the incorrect link.",
      "steps": [
        "1. «Producers — can convert — sunlight into chemical energy»: valid for photosynthetic primary producers in the model.",
        "2. «Consumers — obtain energy by eating — other organisms»: valid as a general description for the simple food web.",
        "3. «Decomposers — break down — dead organic material»: valid, although ecological pathways are more varied than this one diagram.",
        "4. «Energy — returns unchanged to — producers»: incorrect. Energy transfers through the system and a portion dissipates as heat; it is not recycled in the same way as matter.",
        "5. «Matter — can cycle through — ecosystems»: valid at this level, provided you distinguish particular materials and pathways."
      ],
      "check": "The diagnostic step is explaining why link four confused energy flow with the cycling of matter, then writing a new question about a change to producer productivity."
    },
    "mistakes": [
      {
        "title": "Using unlabeled arrows",
        "why": "A line that says only «connected to» may hide a wrong causal or hierarchical claim."
      },
      {
        "title": "Confusing energy flow with nutrient cycling",
        "why": "One diagram can include both, but the connecting statements must preserve the distinction."
      },
      {
        "title": "Copying the map rather than answering from memory",
        "why": "Rebuild links and test a new case without referring to the illustration."
      }
    ],
    "faq": [
      {
        "question": "How many nodes do I need?",
        "answer": "Start with enough concepts to answer one focused question. A small, accurate map is better than a large one with vague links."
      },
      {
        "question": "Can I make a concept map without a paid app?",
        "answer": "Yes. Paper or a general diagram tool works; the quality comes from verified propositions."
      },
      {
        "question": "Does Evaluo generate concept maps?",
        "answer": "This guide is about making a concept map yourself. Evaluo supports other study tools, including mind maps and question practice, which are different tasks."
      }
    ],
    "sources": [
      {
        "title": "Stanford CTL · Concept Mapping",
        "url": "https://ctl.stanford.edu/students/concept-mapping"
      },
      {
        "title": "Carnegie Mellon University · Using Concept Maps",
        "url": "https://www.cmu.edu/teaching/assessment/assesslearning/conceptmaps.html"
      },
      {
        "title": "Karpicke & Blunt (2011) · Retrieval practice and concept mapping",
        "url": "https://pubmed.ncbi.nlm.nih.gov/21252317/"
      }
    ]
  },
  {
    "key": "pomodoro-nov2026",
    "slug": "pomodoro-study-method",
    "title": "Pomodoro Study Method: Three Focus Blocks With Real Learning Checks",
    "seoTitle": "Pomodoro Study Method: 25/5, Example and Limitations",
    "description": "Build a focused study routine using three timed blocks, short breaks and questions that show whether you learned anything.",
    "category": "Study methods",
    "lead": "A timer can help you begin, but it cannot tell you whether you understand your class notes. Use Pomodoro-style sessions to complete small, measurable learning tasks rather than treating a streak of uninterrupted minutes as a learning score.",
    "takeaway": "At the end of a focused block, name something you can explain, calculate or correct without opening the material. That is more informative than the timer alone.",
    "sections": [
      {
        "heading": "What the 25/5 structure means",
        "paragraphs": [
          "The familiar version uses 25 minutes on one task followed by a 5-minute break, with a longer rest after several cycles. It is a time-management technique, not a universal cognitive law. Duke University describes it as a way to make work manageable and protect focused attention.",
          "Adapt the intervals to the course. A long proof or lab calculation may need a natural stopping point, while short vocabulary retrieval tasks may fit neatly inside a timed block. Keep the objective precise even if the clock changes."
        ]
      },
      {
        "heading": "Define a task that produces evidence of understanding",
        "paragraphs": [
          "«Read chemistry» is hard to evaluate. «Explain the difference between an ionic and a covalent bond, then answer three application questions» is testable. Prepare your assigned sources, put notifications away and write down off-topic thoughts instead of following them.",
          "If your notes are extensive, divide by learning outcome rather than page count. A single dense diagram may deserve an entire block; several short definitions might fit together. Make room to verify facts against the course's actual requirements."
        ]
      },
      {
        "heading": "A practical 85-minute plan for an introductory psychology module",
        "paragraphs": [
          "Block one: explain independent and dependent variables in a short experimental scenario from memory. Take five minutes away from the screen. Block two: verify those definitions with your class materials and create three contrasting situations where the variable roles might be confused.",
          "Take another five-minute break, then use block three to answer the scenarios without notes and record the specific mistakes you made. This is 75 minutes of focused work plus 10 minutes of breaks—not an artificial promise that you mastered the topic."
        ]
      },
      {
        "heading": "When a timer stops helping",
        "paragraphs": [
          "If you complete four blocks but cannot explain the core idea, change the activity rather than increasing the count. In math-heavy subjects, uninterrupted problem-solving can be necessary. A clock break in the middle of an important reasoning step may not be useful; finish a coherent step and note where to resume.",
          "Rest and physical needs matter. The 25/5 schedule is adjustable and should not be used as a rigid measure of discipline. The purpose is to help create conditions for studying, not to replace decisions about understanding."
        ]
      },
      {
        "heading": "Combine timed blocks with materials and practice questions",
        "paragraphs": [
          "Use a first block to understand one part of a PDF, a second to explain and compare ideas, and a third to practice without prompts. Check not just whether your answer is correct, but whether the reasoning and evidence are sound. Revisit weak topics on another day.",
          "With Evaluo you can upload course materials and move from topic study to practice and feedback. Use any external timer you like; this guide does not claim that Evaluo includes a dedicated Pomodoro clock."
        ]
      }
    ],
    "exercise": {
      "title": "Worked timetable: learning with three blocks",
      "context": "You have 85 minutes to revise variables in basic research methods. The aim is to answer applications, not to finish a page quota.",
      "steps": [
        "Minutes 0–25: write from memory what independent and dependent variables mean, including one experiment example.",
        "Minutes 25–30: five-minute break away from the material.",
        "Minutes 30–55: compare your answer with the lecture notes and draft three new scenarios; label the manipulated and measured variables.",
        "Minutes 55–60: take another five-minute break.",
        "Minutes 60–85: solve the three scenarios without notes, explain each variable choice and schedule one mistaken case for later review."
      ],
      "check": "Three 25-minute study intervals give 75 focused minutes; two five-minute breaks make the session 85 minutes. Check the answers—not the number of timers completed."
    },
    "mistakes": [
      {
        "title": "Counting sessions as mastery",
        "why": "Time spent is not equivalent to demonstrated understanding."
      },
      {
        "title": "Stopping complex work mid-reasoning",
        "why": "Allow yourself to complete a coherent logical step before taking a planned break."
      },
      {
        "title": "Skipping retrieval practice",
        "why": "Without answering or applying ideas, a focused reading block may still leave major gaps."
      }
    ],
    "faq": [
      {
        "question": "Must every Pomodoro be 25 minutes?",
        "answer": "No. Treat 25/5 as a starting pattern and adjust to your task, available time and sustainable attention."
      },
      {
        "question": "Does Pomodoro work for a long PDF?",
        "answer": "It can help you organize one topic at a time, but you still need to explain, solve and review the relevant concepts."
      },
      {
        "question": "Is a Pomodoro timer included in Evaluo?",
        "answer": "This guide makes no such claim. Use your preferred clock alongside Evaluo's material-based study and practice tools."
      }
    ],
    "sources": [
      {
        "title": "Duke University · Pomodoro Technique",
        "url": "https://arc.duke.edu/pomodoro-technique/"
      },
      {
        "title": "University of Colorado Boulder · Study Tips",
        "url": "https://www.colorado.edu/sasc/academics/study-tips"
      },
      {
        "title": "Roediger & Karpicke (2006) · The Power of Testing Memory",
        "url": "https://pubmed.ncbi.nlm.nih.gov/26151629/"
      }
    ]
  },
  {
    "key": "mcq-exam-nov2026",
    "slug": "how-to-study-for-multiple-choice-exams",
    "title": "How to Study for Multiple-Choice Exams: Six Questions With Feedback",
    "seoTitle": "Study for Multiple-Choice Exams: Practice and Feedback",
    "description": "Prepare for multiple-choice university exams with six original questions, believable distractors, detailed answer explanations and a revision routine.",
    "category": "Exam preparation",
    "lead": "Multiple-choice exams are not simply exercises in spotting a familiar word. They often test whether you can separate neighboring concepts and apply a rule to an unfamiliar example. Practice should include an explanation for each tempting but incorrect option.",
    "takeaway": "Predict an answer before seeing the choices, evaluate the alternatives and use your mistakes to identify the exact part of the course material that needs work.",
    "sections": [
      {
        "heading": "Map the exam before building your practice set",
        "paragraphs": [
          "Check the syllabus, question format, time limit and any marking penalty. A question may have one best answer, several correct options or a 'select all' instruction. Guessing advice is meaningless unless you know how your exam is graded. Group topics by both importance and confidence.",
          "Make a small comparison list of concepts students often mix up. For a research methods course, this might include correlation and causation, random sampling and random assignment, or reliability and validity. Those distinctions are ideal for plausible distractors."
        ]
      },
      {
        "heading": "Retrieve the idea before you read the choices",
        "paragraphs": [
          "Cover the options and answer the question stem first. Then uncover every option, looking for the most accurate answer under the stated conditions. Read qualifiers carefully but do not turn words such as 'always' into a mechanical trick: sometimes an absolute statement is correct.",
          "Mix new and previously studied topics once the foundations are stable. This prevents chapter headings from giving away which formula or framework to use. Choose prompts that demand an explanation, not just a memorized label."
        ]
      },
      {
        "heading": "An original six-item exercise in research methods",
        "paragraphs": [
          "Imagine a student team evaluating a campus library pilot. They recruit volunteers, compare study conditions, and measure quiz scores. The following questions are invented for learning purposes, not claims about a real university study.",
          "Work through each stem before looking at its options. Each explanation diagnoses why a distractor is attractive. Feedback matters: research on multiple-choice learning found that supplying feedback can reduce errors carried forward from misleading alternatives."
        ]
      },
      {
        "heading": "Turn your error list into a learning plan",
        "paragraphs": [
          "After each item, mark whether you answered confidently, guessed or were wrong. For the last two, write one sentence describing the confusion: 'I treated assignment as sampling' is more actionable than 'I need to review chapter two.' Verify your correction against the assigned lecture or textbook.",
          "Retry with a different scenario and revisit the same distinction later. If an AI-generated question contains ambiguous wording, do not memorize its answer. Rewrite it or consult the source. The point is trustworthy reasoning, not a growing attempt count."
        ]
      },
      {
        "heading": "Practice by topic, then simulate exam conditions",
        "paragraphs": [
          "Begin with short topic-level exercises to find gaps, and move to mixed questions after you can justify answers. Use a timed mock only when it matches the real exam's format and scope. Keep a few minutes for marked items and follow your professor's scoring instructions.",
          "Evaluo lets students use their PDF or DOCX materials for topic practice and, where available, mock exams and feedback. Verify important facts against the original course documents. The six questions below provide a model of good correction, not a substitute for your actual course question bank."
        ]
      }
    ],
    "exercise": {
      "title": "Six explained practice questions: campus library research",
      "context": "An imaginary college wants to evaluate a new quiet study space. Each question has ONE correct answer.",
      "steps": [
        "1. Researchers assign volunteers by chance to quiet or ordinary rooms. What process is described? A) Random assignment. B) Random sampling. C) Observational coding. Correct: A. Assignment allocates conditions; B would concern how people were selected from a population; C would classify observations.",
        "2. The team records each student's score after a study session. Which is the measured dependent variable? A) Room type. B) Quiz score. C) The recruitment email. Correct: B. Room type is the condition; the email was used for recruitment.",
        "3. The team recruits only volunteers from a single first-year course. What is the safest claim? A) Results automatically generalize to all students. B) The sample may not represent the whole university. C) The study has no participants. Correct: B. A overgeneralizes; C contradicts the setup.",
        "4. A correlation of 0.7 between weekly study hours and scores is observed. What follows? A) Longer studying causes higher scores in every case. B) An association was observed. C) The variables are unrelated. Correct: B. Correlation alone cannot establish causation; C conflicts with the stated association.",
        "5. Two graders consistently produce nearly identical scores using the same rubric. What property is illustrated most directly? A) Inter-rater reliability. B) Construct validity. C) Random selection. Correct: A. Agreement speaks to reliability, not automatically to whether the rubric measures the intended skill.",
        "6. In 80 responses, 20 students select an incorrect option. What percentage chose it? A) 20%. B) 25%. C) 40%. Correct: B, since 20/80 × 100 = 25. A mistakes the count for a percent; C miscalculates the ratio."
      ],
      "check": "Answers: 1A, 2B, 3B, 4B, 5A, 6B. Explain why the wrong options fail before you claim the topics are mastered."
    },
    "mistakes": [
      {
        "title": "Only checking the answer letter",
        "why": "Correcting the reasoning behind attractive distractors makes the next unfamiliar question easier to diagnose."
      },
      {
        "title": "Using a bank unrelated to the syllabus",
        "why": "A large practice bank cannot replace your professor's stated topics and definitions."
      },
      {
        "title": "Ignoring lucky guesses",
        "why": "A guess that happened to be right still indicates a concept worth reviewing."
      }
    ],
    "faq": [
      {
        "question": "What is the best way to revise for MCQ exams?",
        "answer": "Practice with credible alternatives, explain your choices, and spread correction and re-testing across sessions."
      },
      {
        "question": "Should I start with topic quizzes or mixed mocks?",
        "answer": "Start by diagnosing weaknesses within topics, then use mixed questions and simulations to prepare for an unfamiliar sequence."
      },
      {
        "question": "Is switching an answer always a mistake?",
        "answer": "No. Reconsider when a content-based reason or a reread of the stem changes your interpretation, not purely because you feel uncertain."
      }
    ],
    "sources": [
      {
        "title": "Butler & Roediger (2008) · Feedback and multiple-choice testing",
        "url": "https://pubmed.ncbi.nlm.nih.gov/18491500/"
      },
      {
        "title": "Butler, Karpicke & Roediger (2007) · Feedback timing",
        "url": "https://pubmed.ncbi.nlm.nih.gov/18194050/"
      },
      {
        "title": "Roediger & Karpicke (2006) · The Power of Testing Memory",
        "url": "https://pubmed.ncbi.nlm.nih.gov/26151629/"
      }
    ]
  },
  {
    "key": "feynman-nov2026",
    "slug": "feynman-technique-for-studying",
    "title": "The Feynman Technique for Studying: Explain and Correct a Bad Idea",
    "seoTitle": "Feynman Technique: Steps, Worked Economics Example",
    "description": "Use the Feynman technique to catch a misconception about opportunity cost, repair the explanation and answer transfer questions.",
    "category": "Study methods",
    "lead": "A simple explanation is valuable only when it is accurate. The useful part of the Feynman technique is often the moment you notice that you cannot justify a claim, name a condition or handle a new example. That is a prompt to check the source, not to speak more confidently.",
    "takeaway": "Explain from memory, flag the exact gap, verify it in the assigned material and test whether your repaired explanation works in a different case.",
    "sections": [
      {
        "heading": "Four steps, without turning the name into a miracle claim",
        "paragraphs": [
          "Choose a focused concept, explain it plainly, identify confusing or missing parts, and return to the source to correct them. Try again with a new situation. You can speak to a classmate, write to an imaginary beginner or record your explanation; the key is exposing unsupported statements.",
          "Research on expecting to teach can inform why students organize their knowledge more carefully, but that study did not isolate and prove every step of a named four-part Feynman technique. Treat the method as a structured self-explanation habit that still needs accuracy checks and independent practice."
        ]
      },
      {
        "heading": "A misleading explanation of opportunity cost",
        "paragraphs": [
          "Suppose you are revising introductory economics and write, 'Opportunity cost is the money you've already spent.' That sounds concrete, but it confuses opportunity cost with a sunk cost. Opportunity cost is the value of the next-best alternative you give up when choosing one option.",
          "A sunk cost is a cost already incurred that cannot be recovered by changing the current choice. It usually should not determine the marginal decision in a standard rational-choice model. Your simple explanation failed because two neighboring definitions were mixed up."
        ]
      },
      {
        "heading": "Repair the account with a realistic choice",
        "paragraphs": [
          "You have a free Saturday afternoon and must choose between earning $90 from a short shift or attending a free workshop. If the shift is your best alternative, the opportunity cost of attending the workshop is the value of the foregone shift, assuming all other relevant benefits and costs are held aside.",
          "Now imagine you paid $20 for a nonrefundable ticket to an event but no longer want to go. That $20 is a sunk cost. It does not become the opportunity cost of every later choice. What matters for a new decision is the value of the options available from now onward."
        ]
      },
      {
        "heading": "Transfer questions show whether you understood the correction",
        "paragraphs": [
          "Question one: If the student has a different available shift paying $120, which alternative matters? The opportunity cost depends on the best forgone alternative under the relevant constraints, not automatically the first shift mentioned.",
          "Question two: If the $20 ticket can be resold for $15, is its full price necessarily sunk? No. The recoverable resale value may be relevant to the current decision; check assumptions before applying a rule learned from an earlier example."
        ]
      },
      {
        "heading": "Use your course material to check the explanation",
        "paragraphs": [
          "Write a three-sentence summary without reading your PDF, then add one 'but what if…?' question. Look up the precise definition, correct the misleading part and test a fresh case. If an essential condition is missing, keep it in the explanation even when it makes the sentence slightly longer.",
          "With Evaluo you can study a particular topic from a document and then answer questions on that subject, checking explanations when you miss something. This is a way to test the idea you just explained; it is not a substitute for your source or evidence that speaking alone guarantees mastery."
        ]
      }
    ],
    "exercise": {
      "title": "Worked diagnosis: opportunity versus sunk cost",
      "context": "A classmate explains an economics decision using the wrong kind of cost. Follow the correction and check its limits.",
      "steps": [
        "1. Original explanation: 'The opportunity cost is the $20 already spent on the ticket.' Identify the category error: the ticket purchase is a past expenditure.",
        "2. Define opportunity cost as the value of the best forgone alternative at the time of the choice; a past, nonrecoverable ticket price is a sunk cost.",
        "3. Apply: attending a free workshop instead of a $90 shift forgoes the value of that shift, provided it is the next-best available alternative.",
        "4. Change the scenario: if the ticket can now be resold, its recoverable value may affect the choice. Do not label all of it sunk.",
        "5. Final check: invent another decision and distinguish future trade-offs from unrecoverable past expenses without opening your notes."
      ],
      "check": "A successful explanation includes the time of decision, the next-best option and whether a prior cost is recoverable."
    },
    "mistakes": [
      {
        "title": "Using simple language to hide a wrong definition",
        "why": "Clarity of delivery is not a substitute for verifying the underlying economic concept."
      },
      {
        "title": "Leaving out the alternatives or constraints",
        "why": "An opportunity cost calculation depends on which alternatives are actually available."
      },
      {
        "title": "Repeating exactly the example you memorized",
        "why": "Transfer requires explaining a changed scenario without leaning on the same numbers."
      }
    ],
    "faq": [
      {
        "question": "Does the Feynman technique require teaching someone?",
        "answer": "No. Writing or speaking to an imagined beginner can expose gaps, as long as you verify and test the explanation."
      },
      {
        "question": "Does it work for quantitative subjects?",
        "answer": "It may reveal conceptual errors, but you still need to solve calculations and proofs under the rules of your course."
      },
      {
        "question": "What if my explanation sounds good but is wrong?",
        "answer": "Treat it as a useful signal. Locate the error in the source, repair it and answer a new application question."
      }
    ],
    "sources": [
      {
        "title": "University of Colorado Boulder · The Feynman Technique",
        "url": "https://www.colorado.edu/artssciences-advising/resource-library/life-skills/the-feynman-technique-in-academic-coaching"
      },
      {
        "title": "Nestojko et al. (2014) · Expecting to teach and learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/24845756/"
      },
      {
        "title": "Roediger & Karpicke (2006) · The Power of Testing Memory",
        "url": "https://pubmed.ncbi.nlm.nih.gov/26151629/"
      }
    ]
  }
];
