export type CountryNicheGuide = {
 slug: string; country: string; flag: string; exam: string; title: string; seoTitle: string;
 description: string; summary: string; audience: string; focus: string;
 sourceName: string; sourceUrl: string; eyebrow: string;
 steps: Array<[string,string]>; exampleTitle: string; example: string;
 pitfalls: Array<[string,string]>; faq: Array<[string,string]>;
};
export const COUNTRY_NICHE_GUIDES: CountryNicheGuide[] = [
  {
    "slug": "mexico-guia-exani-ii-pdf",
    "country": "México",
    "flag": "🇲🇽",
    "exam": "EXANI-II / Ceneval",
    "title": "Cómo estudiar el EXANI-II con la guía oficial y tus apuntes",
    "seoTitle": "Cómo estudiar para el EXANI-II: guía y preguntas de práctica",
    "description": "Organiza la guía del EXANI-II de Ceneval, estudia por áreas, crea preguntas de práctica y revisa errores sin confundir ejercicios de IA con reactivos oficiales.",
    "summary": "Preparación de exámenes de ingreso con materiales oficiales, diagnóstico y práctica por áreas.",
    "audience": "Aspirantes a educación superior que necesitan organizar su guía de Ceneval",
    "focus": "El EXANI-II es una evaluación de ingreso de Ceneval. La institución a la que aspiras puede establecer requisitos propios: comprueba siempre su convocatoria. Esta guía explica un método para estudiar el documento oficial que te corresponda, sin prometer exámenes filtrados ni usar preguntas atribuidas a Ceneval.",
    "sourceName": "Guías para el sustentante — Ceneval",
    "sourceUrl": "https://ceneval.edu.mx/instituciones-guias_ceneval/",
    "eyebrow": "Guías de estudio y EXANI-II",
    "steps": [
      [
        "Localiza la guía y las áreas que realmente evaluarán",
        "Empieza en el sitio de Ceneval y en la convocatoria de tu institución. Comprueba la edición de la guía, las áreas y el tipo de evaluación; no prepares un temario obtenido de un foro sin verificarlo."
      ],
      [
        "Organiza el PDF por habilidades",
        "Agrupa los contenidos del documento en bloques de razonamiento, comprensión y conocimientos específicos solo cuando aparezcan en tu guía. Anota para cada bloque qué ideas manejas y cuáles necesitas trabajar desde cero."
      ],
      [
        "Practica con preguntas propias",
        "Después de leer una unidad, cierra el PDF. Resuelve primero una pregunta de recuerdo y otra de aplicación. Revisa por qué fallaste y verifica el concepto en la fuente, especialmente si incluye tablas o gráficos."
      ],
      [
        "Repite una pregunta diferente y mide avances",
        "No repitas únicamente la misma clave. Cambia el contexto de la pregunta y vuelve a practicar el tema en otra sesión; así identificas si recuerdas el concepto o memorizaste una respuesta."
      ]
    ],
    "exampleTitle": "Ejemplo de práctica: comprensión de lectura",
    "example": "Imagina que tu material incluye un texto argumentativo breve. Identifica la tesis y dos razones que la respaldan. Luego responde qué cambio en una premisa debilitaría el argumento y justifica tu elección con el mismo texto. Esta práctica es ilustrativa; no reproduce un reactivo oficial.",
    "pitfalls": [
      [
        "Guías desactualizadas",
        "Confirma edición, convocatoria y materias solicitadas por tu institución. Dos aspirantes pueden necesitar preparación distinta."
      ],
      [
        "Memorizar reactivos como si fueran el examen",
        "Una pregunta de práctica ayuda a razonar, pero no hay garantía de que aparezca en la evaluación."
      ],
      [
        "Estudiar únicamente lo que ya dominas",
        "Si comprendes bien lectura pero fallas al aplicar un procedimiento, asigna el siguiente bloque a ese error concreto."
      ]
    ],
    "faq": [
      [
        "¿Evaluo tiene el examen oficial EXANI-II?",
        "No. Evaluo no reproduce ni ofrece reactivos oficiales. Puedes utilizar tus materiales permitidos para crear ejercicios originales de práctica."
      ],
      [
        "¿Qué documento debo seleccionar?",
        "El documento que corresponda a tu convocatoria y que tengas derecho a utilizar. La fuente de requisitos y contenidos es Ceneval junto con tu institución."
      ],
      [
        "¿Puedo practicar sin pagar?",
        "Evaluo tiene una experiencia gratuita sujeta a límites. Puedes seleccionar tu PDF antes de crear tu cuenta para comenzar la preparación."
      ]
    ]
  },
  {
    "slug": "chile-preparar-paes-con-temario",
    "country": "Chile",
    "flag": "🇨🇱",
    "exam": "PAES / DEMRE",
    "title": "Cómo estudiar para la PAES con el temario oficial y práctica por temas",
    "seoTitle": "Cómo estudiar para la PAES: temario y preguntas de práctica",
    "description": "Prepara la PAES de Chile desde los temarios de DEMRE: divide contenidos, practica habilidades y repasa errores con tu material en PDF.",
    "summary": "Temarios de PAES, competencias evaluadas y preparación por habilidades.",
    "audience": "Estudiantes que preparan la Prueba de Acceso a la Educación Superior (PAES)",
    "focus": "La PAES evalúa habilidades y conocimientos que dependen de la prueba elegida. DEMRE publica temarios y materiales de referencia por proceso. Utiliza esos documentos para saber qué preparar: Evaluo puede ayudarte a estudiar los conceptos que cargues, pero no sustituye los ensayos oficiales ni predice los ítems.",
    "sourceName": "Pruebas y temarios PAES — DEMRE",
    "sourceUrl": "https://portaldemre.demre.cl/paes/factores-seleccion/pruebas-acceso-paes",
    "eyebrow": "PAES · Chile",
    "steps": [
      [
        "Distingue las pruebas que necesitas rendir",
        "Identifica qué pruebas corresponden a tu postulación. Revisa con DEMRE los temarios vigentes de Competencia Lectora, Matemática M1 o M2, Ciencias e Historia, según corresponda."
      ],
      [
        "Divide el temario en contenidos y habilidades",
        "No confundas conocer una fórmula con interpretar un problema. Para cada eje, marca el contenido y la habilidad que necesitas poner en práctica: argumentar, analizar evidencia o resolver ejercicios."
      ],
      [
        "Combina práctica oficial con repaso de apuntes",
        "Resuelve ejemplos y ensayos del organismo correspondiente cuando estén disponibles. Para los conceptos que cuestan, trabaja la sección relevante del PDF propio y practica preguntas de estudio adicionales."
      ],
      [
        "Revisa por qué falla cada respuesta",
        "Distingue si el error provino de lectura del enunciado, desconocimiento de una idea, cálculo o gestión del tiempo. Después reintenta un problema distinto de la misma habilidad."
      ]
    ],
    "exampleTitle": "Ejemplo: un problema de Matemática M1",
    "example": "Supón que tus apuntes explican porcentajes y proporcionalidad. Primero explica qué representa cada cantidad en un problema cotidiano. Resuélvelo sin ver el procedimiento, comprueba los pasos en tu PDF y prueba un enunciado con números distintos. No es una pregunta PAES oficial.",
    "pitfalls": [
      [
        "Tomar la PAES como una prueba de memoria solamente",
        "La preparación también exige interpretar situaciones y aplicar habilidades en problemas nuevos."
      ],
      [
        "Ignorar el temario de tu proceso",
        "Los documentos oficiales pueden actualizarse entre admisiones. Evita basarte únicamente en resúmenes de años anteriores."
      ],
      [
        "Confundir ejercicios generados con ensayos oficiales",
        "Evaluo genera práctica a partir de tu PDF; para conocer el formato oficial utiliza las publicaciones de DEMRE."
      ]
    ],
    "faq": [
      [
        "¿Evaluo ofrece ensayos PAES oficiales?",
        "No. Evaluo es una herramienta de estudio independiente que genera material desde tus documentos. Utiliza DEMRE para ensayos y temarios oficiales."
      ],
      [
        "¿Sirve para estudiar PAES Matemática o Ciencias?",
        "Puedes preparar los conceptos incluidos en tus apuntes y hacer preguntas de repaso; comprueba fórmulas, gráficos y soluciones con el material original."
      ],
      [
        "¿Dónde encuentro el temario vigente?",
        "En el portal oficial de DEMRE, verificando el proceso de admisión para el que te preparas."
      ]
    ]
  },
  {
    "slug": "peru-preparar-admision-san-marcos",
    "country": "Perú",
    "flag": "🇵🇪",
    "exam": "Admisión UNMSM / San Marcos",
    "title": "Cómo organizar el estudio para la admisión a San Marcos",
    "seoTitle": "Admisión San Marcos: cómo estudiar con temarios y preguntas",
    "description": "Método para preparar la admisión a San Marcos (UNMSM) usando información oficial, material por áreas y práctica de preguntas con corrección.",
    "summary": "Preparación por áreas, temarios y análisis de errores para admisión universitaria.",
    "audience": "Postulantes a la Universidad Nacional Mayor de San Marcos",
    "focus": "La Universidad Nacional Mayor de San Marcos publica convocatorias, reglamentos, áreas y cronogramas de admisión. La preparación debe empezar por el proceso al que vas a postular. Una pregunta generada por IA no equivale a un examen histórico ni a un simulacro oficial de San Marcos.",
    "sourceName": "Admisión UNMSM — portal oficial",
    "sourceUrl": "https://www.unmsm.edu.pe/formacion-academica/admision",
    "eyebrow": "Admisión universitaria · Perú",
    "steps": [
      [
        "Confirma tu área y convocatoria",
        "Busca en el portal oficial de la UNMSM el proceso que te corresponde y revisa las áreas académicas, materiales y reglas. No uses una fecha de otro proceso como referencia actual."
      ],
      [
        "Separa materias y temas prioritarios",
        "Organiza tu bibliografía en bloques según tu área. Crea una lista de conceptos imprescindibles y reserva tiempo para reforzar las materias que todavía no puedes explicar sin mirar."
      ],
      [
        "Alterna concepto, aplicación y explicación",
        "Por ejemplo, en Biología distingue procesos, realiza una pregunta de relación y explica por qué una alternativa no corresponde. En Matemática comprueba el procedimiento, no únicamente el resultado."
      ],
      [
        "Crea un registro de errores por tema",
        "Al finalizar una práctica, señala si el fallo fue de conocimientos, interpretación o procedimiento. Vuelve al apartado original y resuelve una variación antes del siguiente simulacro."
      ]
    ],
    "exampleTitle": "Ejemplo: razonamiento con un capítulo de Biología",
    "example": "Tu PDF de estudio explica las funciones de distintos orgánulos celulares. Sin mirar, relaciona cada estructura con su función. Luego responde qué proceso se vería afectado si una estructura no funcionara como describe el documento. Contrasta con tu fuente: es un ejercicio ilustrativo, no un reactivo de la UNMSM.",
    "pitfalls": [
      [
        "Usar un banco de preguntas sin verificar su procedencia",
        "Un ejercicio encontrado en internet puede estar equivocado o utilizar un temario distinto. Contrasta explicaciones y fuentes."
      ],
      [
        "Dejar toda la corrección para el final",
        "Revisar fallos después de cada bloque reduce la repetición de errores durante el siguiente estudio."
      ],
      [
        "Confundir contenido de academia con programa oficial",
        "Para convocatoria y reglas usa el sitio institucional; los materiales complementarios son apoyo, no la autoridad del proceso."
      ]
    ],
    "faq": [
      [
        "¿Evaluo reproduce preguntas oficiales de San Marcos?",
        "No. Evaluo genera actividades a partir de tu propio PDF. No presenta esas preguntas como exámenes reales de la universidad."
      ],
      [
        "¿Qué hago si me preparo para otra universidad de Perú?",
        "Conserva el método de repaso pero utiliza el programa oficial de la universidad correspondiente, ya que las áreas y el examen pueden ser diferentes."
      ],
      [
        "¿Puedo usar mi separata o apuntes?",
        "Sí, si tienes derecho a utilizarlos. Selecciona el material y revisa cualquier explicación técnica contra la fuente original."
      ]
    ]
  },
  {
    "slug": "guatemala-pruebas-basicas-usac",
    "country": "Guatemala",
    "flag": "🇬🇹",
    "exam": "Pruebas PCB / USAC",
    "title": "Cómo preparar las Pruebas de Conocimientos Básicos de la USAC",
    "seoTitle": "Pruebas básicas USAC: guía para estudiar y practicar",
    "description": "Organiza las guías temáticas y las Pruebas de Conocimientos Básicos de la USAC: preparación por materia, ejemplos y revisión de errores.",
    "summary": "Pruebas de Conocimientos Básicos de la USAC, guías temáticas y simulador oficial.",
    "audience": "Aspirantes al ingreso a la Universidad de San Carlos de Guatemala (USAC)",
    "focus": "La USAC explica que el proceso de ingreso incluye orientación vocacional, Pruebas de Conocimientos Básicos (PCB), pruebas específicas según carrera y trámites posteriores. Las PCB pueden incluir Lenguaje, Matemática, Biología, Química o Física. No todas las carreras requieren las mismas materias: verifica el cuadro y tu constancia.",
    "sourceName": "Guías temáticas y simulador — SUN USAC",
    "sourceUrl": "https://sun.usac.edu.gt/index.php/herramientas/",
    "eyebrow": "Pruebas básicas USAC · Guatemala",
    "steps": [
      [
        "Confirma las pruebas correspondientes a tu carrera",
        "Revisa el proceso de ingreso y el cuadro oficial de PCB requerido por carrera para tu ciclo. No prepares asignaturas que tu unidad académica no solicita."
      ],
      [
        "Descarga la guía temática oficial",
        "El Sistema de Ubicación y Nivelación ofrece documentos por asignatura. Utiliza el temario de Lenguaje, Matemática, Física, Química o Biología según tus requisitos."
      ],
      [
        "Usa el simulador de la USAC para un diagnóstico",
        "Cuando reúnes las condiciones de acceso, el simulador oficial permite reconocer áreas por fortalecer. Registra errores por tema sin confundir una nota de práctica con un resultado definitivo."
      ],
      [
        "Refuerza los conceptos con tus PDFs",
        "Para cada tema difícil, lee una sección de tus apuntes, responde una pregunta de comprensión y otra de aplicación y revisa contra la guía original. Más adelante vuelve a responder sin consultar."
      ]
    ],
    "exampleTitle": "Ejemplo: repasar una unidad de Lenguaje",
    "example": "En tus apuntes encuentras un texto informativo y una sección de comprensión lectora. Extrae la idea principal sin copiar una frase. Después intenta distinguir un dato explícito de una inferencia y justifica dónde aparece la evidencia. No es un reactivo USAC oficial.",
    "pitfalls": [
      [
        "Saltar directamente a pruebas específicas",
        "El orden y los requisitos dependen del proceso de ingreso; consulta el sitio de la USAC antes de planificar."
      ],
      [
        "Estudiar con guías de otro año sin comprobarlas",
        "Consulta los materiales y el calendario vigentes para tu ciclo en SUN USAC."
      ],
      [
        "Pensar que una actividad de IA reemplaza el simulador oficial",
        "Usa el simulador oficial para reconocer el formato y Evaluo para estudiar tus temas en PDF."
      ]
    ],
    "faq": [
      [
        "¿Dónde se encuentran las guías oficiales USAC?",
        "En el portal del Sistema de Ubicación y Nivelación (SUN) de la USAC, que publica guías temáticas y orientaciones."
      ],
      [
        "¿Evaluo incluye las pruebas oficiales PCB?",
        "No. La plataforma te permite estudiar desde tus propios documentos y generar ejercicios independientes. Verifica requisitos y simuladores en la USAC."
      ],
      [
        "¿Hay que preparar todas las asignaturas?",
        "No necesariamente. Las materias requeridas varían según la carrera o unidad académica; revisa el cuadro oficial del ciclo correspondiente."
      ]
    ]
  }
];
export function getCountryNicheGuide(slug: string) {
 return COUNTRY_NICHE_GUIDES.find(item=>item.slug===slug);
}
