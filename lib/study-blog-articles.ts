export type StudyBlogLocale = 'es' | 'en';
export type StudyBlogArticle = {
  key: string;
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  lead: string;
  takeaway: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  exercise: { title: string; context: string; steps: string[]; check: string };
  mistakes: Array<{ title: string; why: string }>;
  faq: Array<{ question: string; answer: string }>;
  sources: Array<{ title: string; url: string }>;
};

const retrieval = { title: 'Roediger & Karpicke (2006) · Test-enhanced learning', url: 'https://pubmed.ncbi.nlm.nih.gov/16507066/' };
const spacing = { title: 'Cepeda et al. (2006) · Distributed practice: meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/16719566/' };
const toolbox = { title: 'Dunlosky (2013) · Strengthening the student toolbox', url: 'https://files.eric.ed.gov/fulltext/EJ1021069.pdf' };

export const STUDY_BLOG_ARTICLES: Record<StudyBlogLocale, StudyBlogArticle[]> = {
  es: [
    {
      key: 'accounting',
      slug: 'como-estudiar-contabilidad',
      title: 'Cómo estudiar contabilidad: del asiento al balance sin memorizar todo',
      seoTitle: 'Cómo estudiar contabilidad: diario, mayor y balance resuelto',
      description: 'Guía de contabilidad con ejemplo completo de libro diario, mayor, balance de comprobación, asientos y ejercicios resueltos paso a paso.',
      category: 'Estudiar por materia',
      lead: 'En contabilidad no alcanza con reconocer definiciones: tenés que identificar qué ocurrió, decidir qué cuentas intervienen, justificar su movimiento y verificar que los importes cierren. Un método útil combina comprensión de las reglas con ejercicios completos y corrección de errores.',
      takeaway: 'Primero entendé la operación; después registrala y comprobá el resultado. La rapidez viene con la práctica, no con memorizar asientos aislados.',
      sections: [
        { heading: 'Empezá por la lógica de la operación', paragraphs: [
          'Antes de escribir Debe y Haber, describí en una oración qué pasó: ¿entró efectivo, nació una obligación, se consumió un recurso o se obtuvo un ingreso? Identificá qué cambia en el patrimonio. El plan de cuentas y los criterios contables que te pida la cátedra tienen prioridad sobre los ejemplos generales.',
          'Armá una tabla de cuatro columnas: hecho económico, cuentas afectadas, tipo de cuenta y variación. Si no podés explicar por qué se mueve cada cuenta, todavía no conviene memorizar el asiento. Volvé al concepto y comparalo con una operación parecida que produzca un resultado distinto.'
        ]},
        { heading: 'Recorré el ciclo contable completo', paragraphs: [
          'Trabajá una misma operación desde el comprobante hasta el libro diario, el mayor y el balance de comprobación. Esto permite encontrar errores que no se ven cuando practicás únicamente asientos sueltos: fechas, saldos mal arrastrados, signos equivocados o cuentas incorrectas.',
          'Separá los ejercicios introductorios de los que incluyen IVA, devengamientos, ajustes o distintos criterios de valuación. No mezcles tratamientos normativos sin aclarar jurisdicción y período; para un examen, utilizá el marco técnico y las instrucciones que indique el docente.'
        ]},
        { heading: 'Practicá variaciones, no diez copias de la misma pregunta', paragraphs: [
          'Si dominás una compra al contado, pasá a la compra a crédito, al pago parcial y a una devolución. Cambiá una condición por vez y preguntate qué cuenta se modifica. Después alterná ejercicios de diferente tipo para comprobar si podés elegir el procedimiento sin que el enunciado te lo sugiera.',
          'Intentá resolver sin consultar la solución. Cuando termines, verificá igualdad de importes, clasificación de cuentas y coherencia del saldo. Revisar de manera crítica un ejercicio terminado enseña más que copiar un modelo correcto.'
        ]},
        { heading: 'Organizá un repaso antes del parcial', paragraphs: [
          'Dividí el temario en cuentas patrimoniales, resultados, registración y ajustes; adaptá los bloques a tu programa. En cada sesión, incluí un caso nuevo y uno que hayas resuelto mal anteriormente. Anotá el motivo concreto del fallo: clasificación, criterio, cálculo o lectura del hecho económico.',
          'Reservá una práctica acumulativa con límite de tiempo, pero no uses la velocidad como único indicador. Un asiento correcto que no podés explicar podría fallar cuando cambie el contexto del enunciado. La investigación sobre recuperación activa respalda intentar responder antes de releer, aunque no reemplaza la práctica de procedimientos contables.'
        ]}
      ],
      exercise: { title: 'Ejemplo resuelto: compra de mercaderías a crédito', context: 'Un negocio compra mercaderías por 100 unidades monetarias a un proveedor y pagará después. Para simplificar, no consideramos impuestos ni gastos accesorios.', steps: [
        'Identificá el hecho: aumenta el recurso mercaderías y nace una deuda con el proveedor.',
        'Registrá Mercaderías en el Debe por 100 y Proveedores en el Haber por 100, sujeto al plan de cuentas del curso.',
        'Explicá el efecto: cambia la composición del patrimonio, pero la igualdad del asiento se conserva.',
        'Probá la variación: si la compra hubiese sido al contado, ¿qué cuenta reemplazaría a Proveedores?'
      ], check: 'Autocontrol: Debe = Haber. Si el ejercicio de tu curso incluye impuestos o condiciones adicionales, el registro debe adaptarse. No presentes este ejemplo simplificado como una norma universal.' },
      mistakes: [
        { title: 'Aprender asientos por memoria', why: 'Cuando cambia el pago, el impuesto o el plazo, la plantilla deja de servir. Justificá las cuentas desde el hecho económico.' },
        { title: 'Confundir cuadrar con estar correcto', why: 'Dos importes iguales pueden esconder una clasificación equivocada. Comprobá tanto la igualdad como el sentido contable.' },
        { title: 'No revisar el criterio exigido', why: 'Las cuentas y reglas dependen del curso y del marco contable. Usá la bibliografía y los criterios del examen.' }
      ],
      faq: [
        { question: '¿Conviene estudiar primero teoría o ejercicios?', answer: 'Alterná teoría breve y ejercicios. Leé el criterio, aplicalo a un caso simple y verificá el razonamiento antes de aumentar la dificultad.' },
        { question: '¿Cómo sé si estoy listo para rendir?', answer: 'Probá un conjunto de operaciones nuevas sin mirar el solucionario y explicá el porqué de cada cuenta. Revisá especialmente los errores repetidos.' }
      ],
      sources: [retrieval, toolbox]
    },
    {
      key: 'oral',
      slug: 'como-preparar-un-examen-oral',
      title: 'Cómo preparar un examen oral: explicá ideas sin aprender un discurso',
      seoTitle: 'Cómo preparar un examen oral: simulacro y rúbrica práctica',
      description: 'Prepará un examen oral con respuestas modelo, simulación realista, repreguntas, rúbrica de evaluación y ejercicios para practicar sin memorizar.',
      category: 'Preparar exámenes',
      lead: 'En un examen oral importa lo que sabés y cómo lo explicás frente a una pregunta imprevista. Memorizar un párrafo exacto puede dar seguridad, pero suele fallar cuando el docente repregunta o cambia el orden de los temas.',
      takeaway: 'Prepará conceptos y relaciones, no un libreto. Practicá respuestas breves que puedas ampliar con evidencia y ejemplos.',
      sections: [
        { heading: 'Convertí el programa en preguntas', paragraphs: [
          'Tomá cada unidad y escribí tres clases de preguntas: una definición, una relación entre dos conceptos y una situación de aplicación. Para Derecho, por ejemplo, no basta con definir una institución: también conviene explicar su finalidad, sus condiciones y distinguirla de figuras cercanas.',
          'Ordená estas preguntas por dominio: las que podés responder sin mirar, las que recordás parcialmente y las que todavía no entendés. Esta clasificación es un diagnóstico provisional, no una nota. Empezá el repaso por las dos últimas categorías.'
        ]},
        { heading: 'Usá la estructura respuesta–razón–ejemplo', paragraphs: [
          'Ensayá una respuesta de 30 a 60 segundos: primero contestá directamente; después explicá por qué; al final ofrecé un ejemplo y, cuando haga falta, una excepción. Este formato evita comenzar con un rodeo largo mientras intentás recordar la primera frase del apunte.',
          'No todas las preguntas caben en un minuto. Prepará una versión corta para abrir la explicación y otra ampliada para repreguntas. Una buena explicación distingue lo central de lo accesorio y respeta el lenguaje técnico de la disciplina.'
        ]},
        { heading: 'Simulá condiciones reales', paragraphs: [
          'Pedile a otra persona que formule las preguntas en orden aleatorio. Si estudiás solo, usá tarjetas o un listado numerado y grabate respondiendo. No leas mientras hablás. Después escuchá si respondés la consigna, si confundís términos o si omitís el paso decisivo del razonamiento.',
          'Practicá también la repregunta: «¿En qué se diferencia?», «¿Por qué?», «¿Qué excepción existe?». Una interrupción del docente no implica que estés fallando; es una oportunidad para precisar lo que quisiste decir.'
        ]},
        { heading: 'Prepará una estrategia para los bloqueos', paragraphs: [
          'Si perdés el hilo, no inventes información. Reformulá la pregunta, recuperá el concepto más seguro y construí desde ahí. Podés decir que necesitás ordenar la respuesta antes de continuar. Es preferible una explicación breve y precisa a una larga que mezcla contenidos.',
          'En el último repaso priorizá los conceptos que requieren relacionar ideas y los errores de simulacros. Dormir y descansar forma parte de una preparación razonable; la lectura apresurada de todo el temario la noche anterior no sustituye las sesiones previas.'
        ]}
      ],
      exercise: { title: 'Ejemplo de simulacro: una pregunta de psicología', context: 'Pregunta: «¿En qué se diferencia recordar una lista de reconocerla?».', steps: [
        'Respuesta inicial: recordar exige producir la información; reconocer implica identificarla entre opciones o estímulos.',
        'Razón: las tareas ofrecen apoyos de recuperación diferentes, por lo que pueden producir resultados distintos.',
        'Ejemplo: escribir cinco conceptos sin mirar frente a identificarlos en una lista.',
        'Repregunta: ¿por qué una sensación de familiaridad al releer no demuestra que podrías explicar el contenido?'
      ], check: 'Evaluá si definiste, justificaste y ejemplificaste. Contrastá los términos con el material de tu curso, especialmente si el docente utiliza definiciones específicas.' },
      mistakes: [
        { title: 'Repetir una respuesta palabra por palabra', why: 'Cuesta adaptarla cuando cambia el orden o la formulación de la pregunta.' },
        { title: 'Ensayar solamente los temas fáciles', why: 'La soltura no compensa las lagunas conceptuales. Alterná cuestiones conocidas con otras difíciles.' },
        { title: 'Hablar mucho sin contestar', why: 'Empezá con una respuesta directa y agregá contexto después.' }
      ],
      faq: [
        { question: '¿Conviene practicar frente al espejo?', answer: 'Puede servir para familiarizarte con hablar en voz alta, pero para evaluar contenido es más útil responder preguntas variadas y escuchar tus grabaciones.' },
        { question: '¿Qué hago si no sé la respuesta?', answer: 'No inventes. Explicá qué parte reconocés, delimitá lo que desconocés y pedí precisión si la consigna es ambigua.' }
      ],
      sources: [retrieval, toolbox]
    },
    {
      key: 'spacing',
      slug: 'repeticion-espaciada-para-estudiar',
      title: 'Repetición espaciada: cómo organizar repasos que realmente sirven',
      seoTitle: 'Repetición espaciada: calendario real para varias materias',
      description: 'Calendario práctico de repetición espaciada para tres materias, ejemplos de tarjetas, autocorrección y plantilla gratuita de repaso.',
      category: 'Técnicas de estudio',
      lead: 'Repetir un tema cinco veces seguidas no es lo mismo que volver a él en diferentes días. La repetición espaciada distribuye las oportunidades de recordar el material y ayuda a detectar qué olvidaste cuando ya no tenés el texto fresco.',
      takeaway: 'El calendario es una herramienta, no una fórmula mágica: intentá recordar antes de mirar y ajustá los intervalos según tu dificultad y la fecha del examen.',
      sections: [
        { heading: 'Qué significa espaciar el estudio', paragraphs: [
          'La práctica distribuida consiste en separar las sesiones de aprendizaje de un mismo contenido. Una revisión de Cepeda y colaboradores examinó numerosos experimentos y encontró que los efectos de la separación dependen tanto del intervalo entre sesiones como del tiempo hasta la evaluación. Por eso no existe una única secuencia óptima válida para todos.',
          'La ventaja aparece cuando volvés a recuperar algo que ya no está completamente disponible. Si solo releés el título de una tarjeta hasta reconocerlo, podés crear familiaridad sin comprobar si sabés dar la respuesta.'
        ]},
        { heading: 'Un calendario sencillo para empezar', paragraphs: [
          'Como ejemplo organizativo —no como intervalo científico universal— podés estudiar un tema el lunes, comprobarlo el martes, revisarlo el viernes y volver a él la semana siguiente. Si el examen está muy cerca, acercá las revisiones; si falta mucho, podés espaciar más las sesiones.',
          'Registrá cada tema con tres estados: lo recordé correctamente, dudé o fallé. Si fallaste, volvé al material, corregí la idea y programá otro intento antes. Si acertaste con explicación completa en varias ocasiones, alargá el intervalo.'
        ]},
        { heading: 'Combinala con recuperación activa', paragraphs: [
          'El repaso más útil no siempre es leer. Cerrá el apunte y escribí una definición, resolvé un problema corto o explicá el mecanismo en voz alta. Después verificá la respuesta con el original. Esta práctica permite distinguir recuerdo real de reconocimiento pasivo.',
          'Las tarjetas funcionan bien para conceptos concretos, fórmulas o distinciones. Para materias que exigen razonamiento, sumá preguntas de aplicación y ejercicios que cambien el contexto. Las tarjetas no reemplazan ensayos, casos o problemas largos.'
        ]},
        { heading: 'Cuándo adaptarla', paragraphs: [
          'Si estás empezando desde cero, primero necesitás comprender: leer, preguntar, observar un ejemplo resuelto. Espaciar respuestas que no entendés no corrige el problema de base. Si el material cambia durante la cursada, actualizá las tarjetas antes de repetirlas.',
          'Una agenda saturada con cientos de repasos vencidos termina siendo difícil de sostener. Limitá la cantidad de tarjetas nuevas, priorizá las de mayor relevancia y hacé sesiones breves de revisión. El método debe servir al temario, no dominar todo tu día.'
        ]}
      ],
      exercise: { title: 'Ejemplo: estudiar el ciclo del agua durante dos semanas', context: 'Tenés que explicar evaporación, condensación y precipitación, además de relacionarlas con ejemplos meteorológicos.', steps: [
        'Día 1: leé el tema y escribí tres preguntas, una por proceso, más una pregunta de relación.',
        'Día 2: respondé sin apuntes; corregí definiciones incompletas.',
        'Día 5: contestá con un ejemplo nuevo y marcá qué confundiste.',
        'Día 10: explicá el ciclo completo y revisá los errores previos antes de decidir el siguiente repaso.'
      ], check: 'Las fechas son ilustrativas. Si ya olvidaste una idea, adelantá su revisión; si la dominás, probá un intervalo mayor. Medí la capacidad de explicarla, no la cantidad de veces que abriste el apunte.' },
      mistakes: [
        { title: 'Confundir espaciar con repetir sin pensar', why: 'Cada sesión debe incluir un intento de recuperación y contraste con la fuente.' },
        { title: 'Copiar un calendario rígido', why: 'Los intervalos dependen del material, del dominio previo y del plazo hasta el examen.' },
        { title: 'Crear demasiadas tarjetas', why: 'La acumulación puede quitarle tiempo a comprender y resolver ejercicios relevantes.' }
      ],
      faq: [
        { question: '¿La repetición espaciada sirve para matemáticas?', answer: 'Sí, para recuperar procedimientos y criterios, pero debe acompañarse de resolución de problemas variados y no solo de tarjetas.' },
        { question: '¿Es obligatorio usar una aplicación?', answer: 'No. Un cuaderno, una hoja de cálculo o un calendario pueden alcanzar si registrás qué revisar y corregís tus respuestas.' }
      ],
      sources: [spacing, retrieval, toolbox]
    },
    {
      key: 'finals',
      slug: 'como-estudiar-para-un-examen-final',
      title: 'Cómo estudiar para un examen final acumulativo sin empezar de cero',
      seoTitle: 'Cómo estudiar para un final: plan completo de 14 días',
      description: 'Planificá un final acumulativo con un cronograma de 14 días, simulacros, ejercicios con respuestas y alternativas para 3 o 7 días.',
      category: 'Preparar exámenes',
      lead: 'Un examen final acumulativo combina temas aprendidos en momentos distintos. El desafío es reconstruir conexiones, no volver a leer todos los apuntes desde la primera página. Un buen plan empieza con un diagnóstico y reserva tiempo para practicar.',
      takeaway: 'Dividí el programa, identificá qué temas dominás y usá preguntas acumulativas para decidir dónde concentrarte.',
      sections: [
        { heading: 'Reconstruí el alcance real del final', paragraphs: [
          'Revisá el programa vigente, la bibliografía obligatoria, el formato y los criterios anunciados por la materia. Diferenciá unidades evaluadas, contenidos de apoyo y temas complementarios. No uses una guía genérica como sustituto del programa oficial.',
          'Hacé una tabla por unidad: temas, importancia dentro del curso, tiempo estimado, dominio actual y un ejemplo de pregunta. El objetivo es convertir un temario extenso en tareas verificables, no en una lista de páginas por leer.'
        ]},
        { heading: 'Diagnosticá antes de planificar', paragraphs: [
          'Intentá responder dos preguntas de cada unidad sin mirar los apuntes. Podés usar ejercicios de años anteriores si están autorizados, preguntas propias o casos del manual. Marcá qué no pudiste explicar, qué confundiste y qué resolviste bien.',
          'Priorizá los contenidos que combinan relevancia y dificultad. Un tema central que todavía no manejás merece más tiempo que un detalle secundario que ya recordás. Reservá, sin embargo, repasos cortos de temas fuertes para no abandonarlos.'
        ]},
        { heading: 'Distribuí el tiempo entre comprensión y práctica', paragraphs: [
          'Un ejemplo para dos semanas puede ser: primeros días para cerrar lagunas importantes, días intermedios para mezclar unidades y últimos días para simulacros, revisión y descanso. Adaptá la duración a tu disponibilidad y a la complejidad de la materia.',
          'En cada sesión realizá una tarea concreta: explicar un concepto, comparar dos teorías, resolver un caso o escribir una respuesta sin mirar. Terminar una unidad debería significar poder aplicar lo aprendido, no simplemente haber leído todas sus páginas.'
        ]},
        { heading: 'Simulá el examen y revisá el tipo de error', paragraphs: [
          'Hacé al menos una práctica acumulativa: preguntas de diferentes unidades y, cuando corresponda, un límite razonable de tiempo. La mezcla revela si sabés identificar qué método requiere cada enunciado. Una nota de práctica no predice automáticamente el resultado final.',
          'Clasificá errores en falta de conocimiento, confusión entre temas, aplicación incorrecta y manejo del tiempo. Reestudiar todo suele ser menos eficiente que trabajar la causa concreta de cada fallo. Terminá con una nueva pregunta para comprobar la corrección.'
        ]}
      ],
      exercise: { title: 'Ejemplo: preparar un final de economía en 14 días', context: 'El programa tiene seis unidades y disponés de dos horas por día. Este cronograma es una propuesta adaptable, no una garantía.', steps: [
        'Días 1–2: probá preguntas breves de las seis unidades y detectá los conceptos esenciales que no recordás.',
        'Días 3–8: alterná las tres unidades más difíciles con repasos breves de las restantes.',
        'Días 9–11: resolvé casos que combinen oferta, demanda, elasticidad y política económica cuando estén incluidos en el programa.',
        'Días 12–14: hacé un simulacro, corregí errores frecuentes y reservá tiempo para descanso antes de rendir.'
      ], check: 'Comprobá que el plan cubra todas las unidades evaluables. Si no llegás a todo, priorizá con criterios explícitos y no confundas un resumen breve con dominio del tema.' },
      mistakes: [
        { title: 'Leer el programa entero en orden', why: 'Puede consumir la mayor parte del tiempo antes de empezar a comprobar qué sabés.' },
        { title: 'Dejar la práctica para el último día', why: 'La corrección necesita margen para volver a estudiar y probar otra vez.' },
        { title: 'Estudiar solo lo que resulta familiar', why: 'La sensación de fluidez puede ocultar temas centrales todavía débiles.' }
      ],
      faq: [
        { question: '¿Cuántas horas necesito para preparar un final?', answer: 'Depende del programa, tus conocimientos previos y los días disponibles. Estimá horas por unidad a partir de tareas concretas y reajustá según los resultados de práctica.' },
        { question: '¿Qué hago si faltan tres días?', answer: 'Usá el programa para priorizar conceptos centrales, resolvé preguntas representativas y corregí errores. Evitá prometerte abarcar todo superficialmente.' }
      ],
      sources: [retrieval, spacing, toolbox]
    },
    {
      key: 'pdf',
      slug: 'como-estudiar-un-pdf-largo',
      title: 'Cómo estudiar un PDF largo sin releerlo de principio a fin',
      seoTitle: 'Cómo estudiar un PDF largo: ejemplo completo por temas',
      description: 'Ejemplo completo para estudiar un PDF extenso: dividir capítulos, resumir un fragmento real, crear preguntas y corregir respuestas.',
      category: 'Organizar apuntes',
      lead: 'Cuando un PDF tiene cien páginas o más, la tentación es leerlo completo y subrayar todo. Ese recorrido sirve para reconocer el material, pero no te dice qué aprendiste ni qué partes requieren otra explicación. Conviene separar orientación, comprensión y práctica.',
      takeaway: 'No midas el avance por páginas recorridas: medilo por ideas que podés explicar, relacionar y aplicar sin tener el PDF abierto.',
      sections: [
        { heading: 'Inspeccioná el archivo antes de leer', paragraphs: [
          'Revisá índice, títulos, objetivos de aprendizaje, gráficos y tipo de documento. Un manual de teoría no se trabaja igual que una presentación de diapositivas o un conjunto de ejercicios. Anotá qué temas entran en el examen; si el material contiene capítulos extra, no hace falta procesarlos todos.',
          'Comprobá que las páginas estén completas y en orden. Si es un PDF escaneado, el reconocimiento automático puede confundir cifras, columnas, fórmulas o etiquetas de figuras. Ante cualquier duda, conservá el original como referencia.'
        ]},
        { heading: 'Dividilo en bloques con objetivos propios', paragraphs: [
          'Elegí una sección breve, por ejemplo un subtema de entre cinco y quince páginas cuando la densidad lo permita. Formulá un objetivo observable: «explicar los tres factores de la fotosíntesis», no «leer el capítulo 3». La extensión del bloque debe adaptarse a la dificultad del texto.',
          'Después de leer, escribí las ideas esenciales con tus palabras y añadí la página donde se encuentran. No copies todos los ejemplos. Conservá las definiciones exactas cuando la materia las exija y diferenciá afirmaciones del autor de tus propias interpretaciones.'
        ]},
        { heading: 'Hacé preguntas para comprobar comprensión', paragraphs: [
          'Cerrá el PDF y escribí dos preguntas de recuerdo y una de aplicación. Por ejemplo: «¿qué es la memoria de trabajo?», «¿en qué se diferencia de la memoria a largo plazo?» y «¿qué tarea cotidiana exige mantener y manipular información?». Contrastá las respuestas con el documento.',
          'Si una respuesta está incompleta, anotá qué relación o condición falta. Volvé únicamente a esa sección, corregí y planteá una pregunta diferente. No supongas que volver a leer una explicación implica poder recuperarla en el examen.'
        ]},
        { heading: 'Construí un mapa de avance real', paragraphs: [
          'Llevá un registro simple por tema: sin empezar, leído, explicado, practicado o pendiente de refuerzo. El número de páginas completadas es útil para organizarte, pero no sustituye comprobar tu comprensión.',
          'Terminá cada sesión con una pregunta de un tema anterior. Esa mezcla permite detectar qué olvidaste y programar un repaso. Cuando uses una herramienta de IA para resumir o generar preguntas, revisá las respuestas importantes contra el PDF, especialmente tablas, citas y fórmulas.'
        ]}
      ],
      exercise: { title: 'Ejemplo: 120 páginas de biología', context: 'El documento contiene seis capítulos de veinte páginas. El examen cubre los primeros cuatro.', steps: [
        'Leé el índice y anotá las cuatro unidades evaluables; evitá dedicar la misma energía a las dos restantes.',
        'Dividí cada capítulo en temas con un objetivo específico y registrá la página inicial de cada uno.',
        'Leé una sección, explicala sin mirar y resolvé tres preguntas distintas.',
        'Al finalizar el día, revisá errores y respondé una pregunta de un capítulo anterior.'
      ], check: 'Al terminar no preguntes «¿leí 80 páginas?», sino «¿puedo explicar los conceptos evaluables y resolver una pregunta nueva?». Ajustá el ritmo a la dificultad.' },
      mistakes: [
        { title: 'Subrayar casi todas las páginas', why: 'Si todo parece importante, no hay criterio de selección. Usá objetivos y preguntas del programa.' },
        { title: 'Confiar en un resumen automático sin verificar', why: 'La IA puede omitir excepciones o interpretar mal figuras y tablas.' },
        { title: 'Intentar estudiar 100 páginas en una sola sesión', why: 'La carga de trabajo impide verificar la comprensión de cada tema.' }
      ],
      faq: [
        { question: '¿Es mejor resumir antes o después de leer?', answer: 'Primero inspeccioná la estructura y comprendé una sección. Después redactá una síntesis y comprobala con preguntas.' },
        { question: '¿Sirve para PDFs escaneados?', answer: 'Sí, pero tenés que verificar legibilidad, fórmulas y gráficos. No confíes ciegamente en el texto extraído automáticamente.' }
      ],
      sources: [retrieval, toolbox]
    }
  ],
  en: [
    {
      key: 'accounting',
      slug: 'how-to-study-accounting',
      title: 'How to Study Accounting: Understand the Transaction Before the Journal Entry',
      seoTitle: 'How to Study Accounting: Journal, Ledger & Trial Balance',
      description: 'A complete service-business example from journal entries to ledgers and trial balance, plus answers to practice questions and a study checklist.',
      category: 'Study by subject',
      lead: 'Accounting exams rarely reward memorizing isolated debit-and-credit patterns. They ask you to interpret transactions, choose accounts, apply the relevant rules and explain why the records balance. Build fluency through short explanations followed by increasingly varied problems.',
      takeaway: 'Describe what changed in the business before recording it. A correct entry should make sense, not just balance.',
      sections: [
        { heading: 'Identify the economic event first', paragraphs: [
          'Before writing an entry, describe the transaction in plain language. Did the business receive cash, acquire inventory, incur a liability or earn revenue? Name the accounts affected and classify each one. Use the chart of accounts and standards required by your course.',
          'Create four columns for the event, affected accounts, account types and direction of change. Explain each movement aloud. If you cannot justify a debit or credit without reading the solution, return to the underlying rule before completing more examples.'
        ]},
        { heading: 'Follow transactions through the accounting cycle', paragraphs: [
          'Take one event from its source document to the journal, ledger and trial balance. This shows how an early classification error affects later totals. A balanced trial balance is necessary in many exercises, but it does not prove every account was chosen correctly.',
          'Distinguish basic entries from those involving taxes, accruals, depreciation or adjustments. Different jurisdictions and accounting frameworks use different details. Follow your instructor’s specified approach rather than combining rules from unrelated examples.'
        ]},
        { heading: 'Practice meaningful variations', paragraphs: [
          'Once you understand a cash purchase, practice a credit purchase, a partial payment and a return. Change one condition at a time, then mix different transactions so you have to decide which method fits instead of following a predictable sequence.',
          'Solve each problem before looking at the answer. Afterward check amounts, account classification and economic meaning. Note the cause of each error: misunderstanding the event, selecting the wrong account, calculation or carrying a balance forward.'
        ]},
        { heading: 'Review for the exam with mixed questions', paragraphs: [
          'Organize short blocks by foundational concepts, recording transactions and adjustments. Include one new problem and one previously missed problem in each session. Revisit earlier material after a delay so a correct answer is not just the result of seeing the same solution recently.',
          'Use timed mixed sets only after you can explain the operations accurately. Research on retrieval practice supports testing your knowledge rather than relying solely on rereading; procedural competence still requires full worked problems.'
        ]}
      ],
      exercise: { title: 'Worked example: inventory purchased on credit', context: 'A business purchases inventory for 100 monetary units and will pay the supplier later. Ignore taxes and additional charges for this introductory example.', steps: [
        'Describe the event: inventory increases, and the business owes the supplier.',
        'Debit Inventory for 100 and credit Accounts Payable for 100, subject to the course’s account conventions.',
        'Check that the entry balances and explain how the asset and liability changed.',
        'Now change the transaction to a cash purchase: which account would replace Accounts Payable?'
      ], check: 'The example is deliberately simplified. VAT, sales taxes, valuation rules or other conditions may change the required entry.' },
      mistakes: [
        { title: 'Memorizing entries without a reason', why: 'A new payment condition or tax changes the transaction. Explain the event first.' },
        { title: 'Assuming balanced means correct', why: 'The wrong pair of accounts can still balance. Check economic meaning as well.' },
        { title: 'Mixing accounting frameworks', why: 'Apply the conventions and standards taught in your course.' }
      ],
      faq: [
        { question: 'Should I study definitions before exercises?', answer: 'Alternate brief theory with examples. Understand one rule, apply it to a simple transaction and explain the result before increasing difficulty.' },
        { question: 'How can I tell whether I am ready?', answer: 'Solve unfamiliar transactions without a worked answer and justify each account choice. Recheck recurring mistakes.' }
      ],
      sources: [retrieval, toolbox]
    },
    {
      key: 'oral',
      slug: 'how-to-prepare-for-an-oral-exam',
      title: 'How to Prepare for an Oral Exam Without Memorizing a Script',
      seoTitle: 'How to Prepare for an Oral Exam: Mock Viva and Rubric',
      description: 'Learn oral exam preparation with a mock viva, strong and weak answers, follow-up questions, a scoring rubric and a five-session plan.',
      category: 'Exam preparation',
      lead: 'An oral exam tests more than remembering a definition. You need to respond to the question asked, organize an explanation and adapt when the examiner follows up. Memorizing a speech word for word may feel safe but can become fragile when the conversation changes.',
      takeaway: 'Practice explaining ideas flexibly: answer, give your reason, then add an example or qualification.',
      sections: [
        { heading: 'Turn each syllabus topic into questions', paragraphs: [
          'For each topic, prepare a definition question, a comparison and a scenario requiring application. In law, for instance, a concept may need to be defined, distinguished from a related principle and applied to a brief hypothetical case.',
          'Mark questions as secure, uncertain or not understood yet. This is a guide for study priorities, not a predicted grade. Concentrate first on gaps that are central to the syllabus.'
        ]},
        { heading: 'Build flexible short and long answers', paragraphs: [
          'Practice a concise opening response in roughly 30–60 seconds: state the core answer, justify it and give a relevant example. Prepare a longer explanation for follow-up questions. Not every subject fits neatly into one minute, so treat the format as a starting point.',
          'Avoid beginning with a long historical background if the examiner asked for a distinction. Use precise terminology and signpost the parts of your reasoning: definition, mechanism, limitation and example.'
        ]},
        { heading: 'Rehearse with unpredictable prompts', paragraphs: [
          'Ask a study partner to select questions randomly. Studying alone? Shuffle cards or numbered questions and record yourself speaking without notes. Listen for missing steps, vague wording and answers that never address the question.',
          'Add follow-ups such as “why?”, “how is this different?” or “what is the exception?”. The goal is to understand concepts well enough to adapt, not to sound flawless on a memorized prompt.'
        ]},
        { heading: 'Prepare for uncertainty without bluffing', paragraphs: [
          'If you lose your thread, pause briefly, restate the question and start from the part you can establish. It is better to identify a limitation than to invent a rule, quotation or experimental result. You can ask for clarification when the prompt is ambiguous.',
          'In the final days, revisit mistakes from mock exams and alternate familiar topics with weak ones. Sleep and breaks matter; rereading the entire syllabus at the last minute does not replace earlier retrieval practice.'
        ]}
      ],
      exercise: { title: 'Mini mock exam: working memory', context: 'Prompt: “How does recall differ from recognition?”', steps: [
        'Answer directly: recall requires producing information, whereas recognition involves identifying information presented among cues or options.',
        'Explain why the tasks differ in the amount of retrieval support they provide.',
        'Give an example: writing definitions unaided versus identifying them in a list.',
        'Practice the follow-up: why might a familiar paragraph still be difficult to explain without looking?'
      ], check: 'Check whether your response states a distinction, explains it and offers a valid example. Verify course-specific terminology before the exam.' },
      mistakes: [
        { title: 'Reciting a fixed speech', why: 'A different question order can interrupt the memorized sequence.' },
        { title: 'Practicing only comfortable topics', why: 'Fluency in familiar material can conceal conceptual gaps.' },
        { title: 'Talking around the question', why: 'Give the direct answer before adding useful context.' }
      ],
      faq: [
        { question: 'Is practicing in front of a mirror enough?', answer: 'It can help with speaking aloud, but varied questions and recording your explanations are better checks of the content.' },
        { question: 'What if I do not know an answer?', answer: 'Avoid guessing. State what you know accurately, clarify the uncertainty and request clarification if the question is ambiguous.' }
      ],
      sources: [retrieval, toolbox]
    },
    {
      key: 'spacing',
      slug: 'spaced-repetition-for-studying',
      title: 'Spaced Repetition for Studying: A Schedule You Can Actually Maintain',
      seoTitle: 'Spaced Repetition: Study Calendar, Examples and Answers',
      description: 'A spaced repetition calendar for three courses, improved flashcards, worked answers and a free review tracker you can copy.',
      category: 'Learning techniques',
      lead: 'Five consecutive reviews of a topic are not the same as returning to it over several days. Spaced repetition distributes retrieval attempts so you can notice what has become harder to remember and revisit it deliberately.',
      takeaway: 'There is no universal perfect interval. Attempt recall, check the answer and adjust the next review to the material and exam date.',
      sections: [
        { heading: 'Understand the spacing effect', paragraphs: [
          'Distributed practice separates encounters with the same material. Cepeda and colleagues reviewed a large body of experiments and found that the spacing interval and the delay before the final test work together. A schedule that fits a test next week may not fit a test next semester.',
          'Recognizing a flashcard answer after seeing it repeatedly is not the same as retrieving it independently. Cover the answer, try to produce it and then check the source.'
        ]},
        { heading: 'Start with a flexible review calendar', paragraphs: [
          'As an illustrative schedule, learn a topic on Monday, retrieve it Tuesday, test again Friday and revisit it the following week. These dates are examples for organizing time, not scientifically optimal universal intervals. Shorten or lengthen the gap based on difficulty and how soon you need the knowledge.',
          'Keep three simple results: recalled accurately, hesitated or incorrect. A miss means reviewing the explanation and scheduling another attempt sooner. Consistent success can justify a longer gap.'
        ]},
        { heading: 'Pair spacing with active recall', paragraphs: [
          'Try a definition, short answer, diagram from memory or calculation before opening the notes. Afterward correct the response against the original material. This exposes missing conditions and misleading familiarity from rereading.',
          'Flashcards are useful for focused facts, but they are not enough for every goal. In mathematics, sciences and case-based subjects, also solve new problems and explain why a method applies.'
        ]},
        { heading: 'Keep the system realistic', paragraphs: [
          'If a concept is not understood, begin with explanation and worked examples before scheduling retrieval. Spacing repeated confusion will not automatically create understanding. Check formulas, figures and qualifications before turning them into cards.',
          'Avoid adding so many new cards that each day becomes a backlog. Focus on the topics that matter for your course and leave time for longer writing, projects or calculations where required.'
        ]}
      ],
      exercise: { title: 'Two-week example: review the water cycle', context: 'You need to explain evaporation, condensation, precipitation and the connections between them.', steps: [
        'Day 1: understand the diagram and write three process questions and one relationship question.',
        'Day 2: answer from memory and correct incomplete descriptions.',
        'Day 5: explain the cycle using a new weather example.',
        'Day 10: draw and explain the full cycle, revisiting earlier mistakes.'
      ], check: 'The timing is illustrative. Decide the next review using what you could actually explain without looking.' },
      mistakes: [
        { title: 'Spacing passive rereading', why: 'Include genuine retrieval before checking the material.' },
        { title: 'Using rigid intervals', why: 'Different subjects, delays and prior knowledge call for adjustments.' },
        { title: 'Tracking cards instead of learning goals', why: 'Use written explanations and problems as well as flashcards.' }
      ],
      faq: [
        { question: 'Does spaced repetition help with mathematics?', answer: 'It can help retain rules and recognize procedures, but it should be combined with varied problem-solving practice.' },
        { question: 'Do I need a dedicated app?', answer: 'No. A notebook, paper calendar or spreadsheet is enough if you record upcoming reviews and correct your answers.' }
      ],
      sources: [spacing, retrieval, toolbox]
    },
    {
      key: 'finals',
      slug: 'how-to-study-for-final-exams',
      title: 'How to Study for Final Exams: Build a Plan Around What You Can Recall',
      seoTitle: 'How to Study for Finals: 14-Day Schedule and Mock Tests',
      description: 'Follow a detailed 14-day revision plan with mock exams, statistics questions and answers, and 3-, 7-, and 14-day alternatives.',
      category: 'Exam preparation',
      lead: 'A cumulative final brings together topics taught months apart. Starting again from page one can use up the time you need for practice. A stronger plan identifies the tested concepts, checks what you already know and focuses on the gaps.',
      takeaway: 'Measure progress through questions you can answer and problems you can solve, not pages you have reread.',
      sections: [
        { heading: 'Map the real exam requirements', paragraphs: [
          'Check the latest syllabus, required readings, assessment format and any official guidance from your instructor. Separate tested units from background material. Past exams can inform practice when legitimately available, but may not reflect the current syllabus.',
          'Create a table of units, topics, importance, estimated study effort and an example question. This turns a vague reading goal into concrete tasks that can be checked.'
        ]},
        { heading: 'Diagnose your starting point', paragraphs: [
          'Without looking at the notes, attempt two questions per unit. Include a definition and an application or comparison where possible. Label each result as secure, partial or not yet understood and write down what was missing.',
          'Prioritize difficult concepts that matter across several units. Keep brief reviews of strong topics so you can still retrieve them later. A self-test is a planning tool, not a guaranteed prediction of exam performance.'
        ]},
        { heading: 'Allocate study time to learning and retrieval', paragraphs: [
          'For a two-week plan, spend the first days repairing major knowledge gaps, the middle period mixing topics and the final days taking mock exams and reviewing errors. Adapt this balance to your available hours and the depth of each unit.',
          'Each session should end with a measurable outcome: explain a process, compare theories or solve an unfamiliar problem. Finishing an assigned page count is useful for tracking workload but says less about your ability to apply the material.'
        ]},
        { heading: 'Practice cumulative questions and correct the cause', paragraphs: [
          'Use a set containing multiple units. The mixture tests whether you can identify the relevant method from the problem rather than relying on a predictable chapter order. Include timing only when the exam has a comparable constraint.',
          'Classify mistakes as missing knowledge, confusion between concepts, misapplication or time management. Revisit the specific cause and then answer a different question to check whether the correction held.'
        ]}
      ],
      exercise: { title: 'Example: a 14-day economics final plan', context: 'Your course has six units, and you have about two hours daily. Adjust the sequence to your syllabus.', steps: [
        'Days 1–2: attempt sample questions from all six units and identify the main gaps.',
        'Days 3–8: alternate work on three weak units with short retrieval sessions from stronger ones.',
        'Days 9–11: practice mixed problems across the units, using course-relevant applications.',
        'Days 12–14: take a mock exam, correct recurring errors and allow time for rest.'
      ], check: 'Confirm every assessed unit is covered. If time is short, prioritize openly instead of claiming a superficial summary equals mastery.' },
      mistakes: [
        { title: 'Rereading the whole course in order', why: 'It can delay retrieval practice until little correction time remains.' },
        { title: 'Leaving the first mock exam too late', why: 'Errors need time for focused review and a second attempt.' },
        { title: 'Studying only familiar chapters', why: 'Comfort can hide weaknesses in central topics.' }
      ],
      faq: [
        { question: 'How many hours should I study for finals?', answer: 'There is no single number. Estimate time by assessed units, prior knowledge and tasks you need to master, then revise the plan with practice results.' },
        { question: 'What if I only have three days?', answer: 'Use the syllabus to prioritize essential concepts, practice representative questions and correct the biggest gaps. Avoid promising complete coverage if it is unrealistic.' }
      ],
      sources: [retrieval, spacing, toolbox]
    },
    {
      key: 'pdf',
      slug: 'how-to-study-a-long-pdf',
      title: 'How to Study a Long PDF Without Rereading Every Page',
      seoTitle: 'How to Study a Long PDF: Lecture Slides, Worked Example',
      description: 'A worked guide to studying long lecture-slide PDFs: a 48-slide plan, statistics example, self-test questions and answer key.',
      category: 'Study organization',
      lead: 'A 120-page PDF can feel manageable once every paragraph has been highlighted, but highlighting does not tell you whether you could explain the material without looking. Use a sequence of overview, focused reading, recall and correction instead.',
      takeaway: 'Count concepts you can explain and questions you can answer, not only pages you have scrolled through.',
      sections: [
        { heading: 'Inspect the document before reading', paragraphs: [
          'Look at the table of contents, headings, learning outcomes, diagrams and document type. A slide deck, textbook chapter and problem set need different approaches. Match the relevant sections to the actual exam syllabus so you do not study unrelated material first.',
          'Check that pages and diagrams are readable. Scanned PDFs and automatic text extraction can misread columns, equations and figure labels. Preserve the original page as the reference when checking summaries or generated questions.'
        ]},
        { heading: 'Split the PDF into testable topics', paragraphs: [
          'Choose a short section with one observable learning goal: “compare osmosis and diffusion” is more useful than “read chapter four.” Depending on density, a section might be only a few pages or much longer; do not force a fixed page count.',
          'After reading, write the core ideas in your own words, adding page references for definitions and important claims. Keep exact language only when required. Separate what the author states from your own interpretation.'
        ]},
        { heading: 'Check understanding without the document open', paragraphs: [
          'Write two recall questions and one application question for each topic. For working memory, you might ask for its definition, how it differs from long-term memory and which daily activity depends on holding and manipulating information.',
          'Try answering first, then compare with the original PDF. Record what was missing rather than just marking an answer wrong. Return to that part of the text and retry with a slightly different question.'
        ]},
        { heading: 'Track progress by what you can do', paragraphs: [
          'Use a simple topic list: not started, read, explained, practiced or needs review. Page completion helps organize time, but it should not substitute demonstrated understanding.',
          'End each session with a question from a topic studied earlier. If you use an AI summarizer, audit the important output against the PDF—especially numerical values, definitions, tables and formulas.'
        ]}
      ],
      exercise: { title: 'Example: four chapters from a 120-page biology PDF', context: 'The file has six chapters of 20 pages each. The exam covers the first four.', steps: [
        'Use the syllabus and contents page to identify the four assessed chapters.',
        'Split each chapter into named topics with one learning goal and a source page.',
        'Read one topic, explain it unaided and answer three varied questions.',
        'Finish with a question from a previous chapter and note what needs review.'
      ], check: 'At the end ask whether you can explain and apply the assessed content, not whether you have scrolled through 80 pages.' },
      mistakes: [
        { title: 'Highlighting everything', why: 'Without a selection rule, highlighted text is just another full document.' },
        { title: 'Trusting an unchecked AI summary', why: 'Important exceptions, scanned text, tables and formulas can be mishandled.' },
        { title: 'Studying the entire file in one sitting', why: 'There may be little opportunity to test whether each topic was understood.' }
      ],
      faq: [
        { question: 'Should I summarize before or after reading?', answer: 'First inspect the structure and understand a section. Then write a concise synthesis and check it with questions.' },
        { question: 'Does this work with scanned PDFs?', answer: 'Yes, but verify text recognition, equations and figures against the original. Automatic extraction is not infallible.' }
      ],
      sources: [retrieval, toolbox]
    }
  ],
};

export function getStudyBlogArticle(locale: StudyBlogLocale, slug: string) {
  return STUDY_BLOG_ARTICLES[locale].find(article => article.slug === slug);
}

export function getStudyBlogPath(locale: StudyBlogLocale, article: StudyBlogArticle) {
  return (locale === 'es' ? '/blog/' : '/en/blog/') + article.slug;
}

export function getTranslation(locale: StudyBlogLocale, article: StudyBlogArticle) {
  const other: StudyBlogLocale = locale === 'es' ? 'en' : 'es';
  return STUDY_BLOG_ARTICLES[other].find(item => item.key === article.key);
}