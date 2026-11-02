import type { StudyBlogArticle } from './study-blog-articles';
// Six original bilingual editorial additions; no duplicate Pregunteros content.
export const MASTER_ES_BLOG:StudyBlogArticle[] = [
  {
    "key": "medicine",
    "slug": "como-estudiar-medicina",
    "title": "Cómo estudiar medicina: método, casos y práctica",
    "seoTitle": "Cómo estudiar medicina: método, casos y práctica",
    "description": "Guía completa de razonamiento clínico: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Estudiar por materia",
    "lead": "Una forma útil de estudiar medicina es pasar de reconocer información a explicar decisiones. Esta guía desarrolla razonamiento clínico con un método que podés comprobar utilizando tu propio programa. El objetivo no es acumular páginas leídas: es responder preguntas nuevas y detectar qué razonamiento te falta.",
    "takeaway": "Después de estudiar razonamiento clínico, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del programa a las preguntas",
        "paragraphs": [
          "Primero separá los objetivos de aprendizaje: definir, comparar, explicar un mecanismo o resolver un caso. Anotá de dónde sale cada criterio y cuál es el nivel de detalle que exige tu materia. Si un examen utiliza situaciones, no prepares solamente definiciones.",
          "Construí una tabla con tres columnas: concepto, evidencia del material y pregunta que comprueba su uso. Para cada unidad, planteá una pregunta de explicación y otra donde cambie una condición del problema."
        ]
      },
      {
        "heading": "Un ejemplo que exige razonar",
        "paragraphs": [
          "Para razonamiento clínico, empezá con una situación limitada y explicitá tus supuestos. Anotá qué datos conocés, qué resultado se pide y qué parte del razonamiento necesitás justificar.",
          "Resolvés mejor cuando podés explicar por qué elegiste un procedimiento antes de ejecutarlo. Contrastar alternativas evita memorizar una respuesta que funciona solamente en un ejercicio."
        ]
      },
      {
        "heading": "Recuperación y corrección",
        "paragraphs": [
          "Al terminar un bloque de lectura, cerrá los apuntes y recuperá la información sin pistas. Después compará con la fuente e identificá si el error fue de concepto, procedimiento, interpretación o vocabulario.",
          "No repitas inmediatamente el mismo ejemplo de memoria. Cambiá una variable y comprobá si podés transferir el criterio. Si el material incluye fórmulas, tablas, diagramas o normativa, verificá el resultado en la bibliografía."
        ]
      },
      {
        "heading": "Repaso y simulación",
        "paragraphs": [
          "Planificá sesiones breves de repaso con preguntas anteriores mezcladas con preguntas nuevas. Ajustá el orden a lo que todavía no dominás, no solo al índice del documento.",
          "Antes de rendir, hacé una simulación acorde al formato: ejercicios numéricos, preguntas abiertas o escenarios. Revisá cada explicación y anotá qué tema requiere otra sesión."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto y autocontrol",
      "context": "Caso de estudio: una persona consulta por fiebre y cansancio. Antes de elegir un diagnóstico, separá síntomas, antecedentes, signos que faltan y pruebas que el material del curso considera pertinentes. No infieras una enfermedad real a partir de dos síntomas.",
      "steps": [
        "Identificá los datos disponibles y la pregunta central antes de elegir una respuesta.",
        "Explicá en voz alta qué concepto o procedimiento conecta esos datos con la conclusión.",
        "Cambiá una condición del caso y anticipá si cambia la respuesta; verificá la diferencia en tus apuntes.",
        "Anotá una pregunta distinta para responder en otra sesión sin consultar la solución."
      ],
      "check": "La comprobación es poder justificar el resultado y explicar un caso modificado. Confundir reconocimiento de síntomas con diagnóstico; sin contexto, un hallazgo tiene múltiples explicaciones."
    },
    "mistakes": [
      {
        "title": "Confundir reconocimiento con dominio",
        "why": "Confundir reconocimiento de síntomas con diagnóstico; sin contexto, un hallazgo tiene múltiples explicaciones."
      },
      {
        "title": "Practicar solo ejercicios idénticos",
        "why": "Un ejercicio conocido puede resolverse por memoria. Cambiar condiciones obliga a identificar el concepto."
      },
      {
        "title": "Ignorar las fuentes de la materia",
        "why": "La terminología, la profundidad y los procedimientos evaluados dependen de tu programa."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo empezar a estudiar medicina?",
        "answer": "Revisá el programa, separá los objetivos, trabajá una unidad y cerrá cada sesión con preguntas que respondas sin consultar."
      },
      {
        "question": "¿Cómo organizar el repaso?",
        "answer": "Mezclá preguntas actuales con otras de sesiones anteriores, priorizá errores y ajustá el tiempo a la dificultad."
      },
      {
        "question": "¿Sirven las tarjetas?",
        "answer": "Sirven para recuperar información breve. Completalas con problemas o casos para comprobar aplicación."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "nursing",
    "slug": "como-estudiar-enfermeria",
    "title": "Cómo estudiar enfermeria: método, casos y práctica",
    "seoTitle": "Cómo estudiar enfermeria: método, casos y práctica",
    "description": "Guía completa de priorización y cuidados de enfermería: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Estudiar por materia",
    "lead": "Una forma útil de estudiar enfermeria es pasar de reconocer información a explicar decisiones. Esta guía desarrolla priorización y cuidados de enfermería con un método que podés comprobar utilizando tu propio programa. El objetivo no es acumular páginas leídas: es responder preguntas nuevas y detectar qué razonamiento te falta.",
    "takeaway": "Después de estudiar priorización y cuidados de enfermería, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del programa a las preguntas",
        "paragraphs": [
          "Primero separá los objetivos de aprendizaje: definir, comparar, explicar un mecanismo o resolver un caso. Anotá de dónde sale cada criterio y cuál es el nivel de detalle que exige tu materia. Si un examen utiliza situaciones, no prepares solamente definiciones.",
          "Construí una tabla con tres columnas: concepto, evidencia del material y pregunta que comprueba su uso. Para cada unidad, planteá una pregunta de explicación y otra donde cambie una condición del problema."
        ]
      },
      {
        "heading": "Un ejemplo que exige razonar",
        "paragraphs": [
          "Para priorización y cuidados de enfermería, empezá con una situación limitada y explicitá tus supuestos. Anotá qué datos conocés, qué resultado se pide y qué parte del razonamiento necesitás justificar.",
          "Resolvés mejor cuando podés explicar por qué elegiste un procedimiento antes de ejecutarlo. Contrastar alternativas evita memorizar una respuesta que funciona solamente en un ejercicio."
        ]
      },
      {
        "heading": "Recuperación y corrección",
        "paragraphs": [
          "Al terminar un bloque de lectura, cerrá los apuntes y recuperá la información sin pistas. Después compará con la fuente e identificá si el error fue de concepto, procedimiento, interpretación o vocabulario.",
          "No repitas inmediatamente el mismo ejemplo de memoria. Cambiá una variable y comprobá si podés transferir el criterio. Si el material incluye fórmulas, tablas, diagramas o normativa, verificá el resultado en la bibliografía."
        ]
      },
      {
        "heading": "Repaso y simulación",
        "paragraphs": [
          "Planificá sesiones breves de repaso con preguntas anteriores mezcladas con preguntas nuevas. Ajustá el orden a lo que todavía no dominás, no solo al índice del documento.",
          "Antes de rendir, hacé una simulación acorde al formato: ejercicios numéricos, preguntas abiertas o escenarios. Revisá cada explicación y anotá qué tema requiere otra sesión."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto y autocontrol",
      "context": "Caso simulado: recibís cuatro datos de una persona hospitalizada. Organizalos en observaciones, necesidades, acciones previstas por el protocolo del curso y reevaluación; explicá por qué la seguridad y la comunicación deben documentarse. No uses una guía educativa para decidir cuidados reales.",
      "steps": [
        "Identificá los datos disponibles y la pregunta central antes de elegir una respuesta.",
        "Explicá en voz alta qué concepto o procedimiento conecta esos datos con la conclusión.",
        "Cambiá una condición del caso y anticipá si cambia la respuesta; verificá la diferencia en tus apuntes.",
        "Anotá una pregunta distinta para responder en otra sesión sin consultar la solución."
      ],
      "check": "La comprobación es poder justificar el resultado y explicar un caso modificado. Memorizar una intervención sin justificar qué valoración la desencadena ni cómo se evalúa la respuesta."
    },
    "mistakes": [
      {
        "title": "Confundir reconocimiento con dominio",
        "why": "Memorizar una intervención sin justificar qué valoración la desencadena ni cómo se evalúa la respuesta."
      },
      {
        "title": "Practicar solo ejercicios idénticos",
        "why": "Un ejercicio conocido puede resolverse por memoria. Cambiar condiciones obliga a identificar el concepto."
      },
      {
        "title": "Ignorar las fuentes de la materia",
        "why": "La terminología, la profundidad y los procedimientos evaluados dependen de tu programa."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo empezar a estudiar enfermeria?",
        "answer": "Revisá el programa, separá los objetivos, trabajá una unidad y cerrá cada sesión con preguntas que respondas sin consultar."
      },
      {
        "question": "¿Cómo organizar el repaso?",
        "answer": "Mezclá preguntas actuales con otras de sesiones anteriores, priorizá errores y ajustá el tiempo a la dificultad."
      },
      {
        "question": "¿Sirven las tarjetas?",
        "answer": "Sirven para recuperar información breve. Completalas con problemas o casos para comprobar aplicación."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "engineering",
    "slug": "como-estudiar-ingenieria",
    "title": "Cómo estudiar ingenieria: método, casos y práctica",
    "seoTitle": "Cómo estudiar ingenieria: método, casos y práctica",
    "description": "Guía completa de resolución de problemas con unidades y supuestos: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Estudiar por materia",
    "lead": "Una forma útil de estudiar ingenieria es pasar de reconocer información a explicar decisiones. Esta guía desarrolla resolución de problemas con unidades y supuestos con un método que podés comprobar utilizando tu propio programa. El objetivo no es acumular páginas leídas: es responder preguntas nuevas y detectar qué razonamiento te falta.",
    "takeaway": "Después de estudiar resolución de problemas con unidades y supuestos, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del programa a las preguntas",
        "paragraphs": [
          "Primero separá los objetivos de aprendizaje: definir, comparar, explicar un mecanismo o resolver un caso. Anotá de dónde sale cada criterio y cuál es el nivel de detalle que exige tu materia. Si un examen utiliza situaciones, no prepares solamente definiciones.",
          "Construí una tabla con tres columnas: concepto, evidencia del material y pregunta que comprueba su uso. Para cada unidad, planteá una pregunta de explicación y otra donde cambie una condición del problema."
        ]
      },
      {
        "heading": "Un ejemplo que exige razonar",
        "paragraphs": [
          "Para resolución de problemas con unidades y supuestos, empezá con una situación limitada y explicitá tus supuestos. Anotá qué datos conocés, qué resultado se pide y qué parte del razonamiento necesitás justificar.",
          "Resolvés mejor cuando podés explicar por qué elegiste un procedimiento antes de ejecutarlo. Contrastar alternativas evita memorizar una respuesta que funciona solamente en un ejercicio."
        ]
      },
      {
        "heading": "Recuperación y corrección",
        "paragraphs": [
          "Al terminar un bloque de lectura, cerrá los apuntes y recuperá la información sin pistas. Después compará con la fuente e identificá si el error fue de concepto, procedimiento, interpretación o vocabulario.",
          "No repitas inmediatamente el mismo ejemplo de memoria. Cambiá una variable y comprobá si podés transferir el criterio. Si el material incluye fórmulas, tablas, diagramas o normativa, verificá el resultado en la bibliografía."
        ]
      },
      {
        "heading": "Repaso y simulación",
        "paragraphs": [
          "Planificá sesiones breves de repaso con preguntas anteriores mezcladas con preguntas nuevas. Ajustá el orden a lo que todavía no dominás, no solo al índice del documento.",
          "Antes de rendir, hacé una simulación acorde al formato: ejercicios numéricos, preguntas abiertas o escenarios. Revisá cada explicación y anotá qué tema requiere otra sesión."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto y autocontrol",
      "context": "Ejercicio: un vehículo recorre 120 metros en 10 segundos con rapidez constante. Calculá 12 m/s y convertí a 43,2 km/h. Después justificá por qué el resultado no describe un movimiento acelerado y qué supuesto cambiaría la fórmula.",
      "steps": [
        "Identificá los datos disponibles y la pregunta central antes de elegir una respuesta.",
        "Explicá en voz alta qué concepto o procedimiento conecta esos datos con la conclusión.",
        "Cambiá una condición del caso y anticipá si cambia la respuesta; verificá la diferencia en tus apuntes.",
        "Anotá una pregunta distinta para responder en otra sesión sin consultar la solución."
      ],
      "check": "La comprobación es poder justificar el resultado y explicar un caso modificado. Reemplazar números en fórmulas sin comprobar las unidades ni las condiciones de aplicación."
    },
    "mistakes": [
      {
        "title": "Confundir reconocimiento con dominio",
        "why": "Reemplazar números en fórmulas sin comprobar las unidades ni las condiciones de aplicación."
      },
      {
        "title": "Practicar solo ejercicios idénticos",
        "why": "Un ejercicio conocido puede resolverse por memoria. Cambiar condiciones obliga a identificar el concepto."
      },
      {
        "title": "Ignorar las fuentes de la materia",
        "why": "La terminología, la profundidad y los procedimientos evaluados dependen de tu programa."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo empezar a estudiar ingenieria?",
        "answer": "Revisá el programa, separá los objetivos, trabajá una unidad y cerrá cada sesión con preguntas que respondas sin consultar."
      },
      {
        "question": "¿Cómo organizar el repaso?",
        "answer": "Mezclá preguntas actuales con otras de sesiones anteriores, priorizá errores y ajustá el tiempo a la dificultad."
      },
      {
        "question": "¿Sirven las tarjetas?",
        "answer": "Sirven para recuperar información breve. Completalas con problemas o casos para comprobar aplicación."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "statistics",
    "slug": "como-estudiar-estadistica",
    "title": "Cómo estudiar estadistica: método, casos y práctica",
    "seoTitle": "Cómo estudiar estadistica: método, casos y práctica",
    "description": "Guía completa de interpretación estadística y elección del procedimiento: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Estudiar por materia",
    "lead": "Una forma útil de estudiar estadistica es pasar de reconocer información a explicar decisiones. Esta guía desarrolla interpretación estadística y elección del procedimiento con un método que podés comprobar utilizando tu propio programa. El objetivo no es acumular páginas leídas: es responder preguntas nuevas y detectar qué razonamiento te falta.",
    "takeaway": "Después de estudiar interpretación estadística y elección del procedimiento, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del programa a las preguntas",
        "paragraphs": [
          "Primero separá los objetivos de aprendizaje: definir, comparar, explicar un mecanismo o resolver un caso. Anotá de dónde sale cada criterio y cuál es el nivel de detalle que exige tu materia. Si un examen utiliza situaciones, no prepares solamente definiciones.",
          "Construí una tabla con tres columnas: concepto, evidencia del material y pregunta que comprueba su uso. Para cada unidad, planteá una pregunta de explicación y otra donde cambie una condición del problema."
        ]
      },
      {
        "heading": "Un ejemplo que exige razonar",
        "paragraphs": [
          "Para interpretación estadística y elección del procedimiento, empezá con una situación limitada y explicitá tus supuestos. Anotá qué datos conocés, qué resultado se pide y qué parte del razonamiento necesitás justificar.",
          "Resolvés mejor cuando podés explicar por qué elegiste un procedimiento antes de ejecutarlo. Contrastar alternativas evita memorizar una respuesta que funciona solamente en un ejercicio."
        ]
      },
      {
        "heading": "Recuperación y corrección",
        "paragraphs": [
          "Al terminar un bloque de lectura, cerrá los apuntes y recuperá la información sin pistas. Después compará con la fuente e identificá si el error fue de concepto, procedimiento, interpretación o vocabulario.",
          "No repitas inmediatamente el mismo ejemplo de memoria. Cambiá una variable y comprobá si podés transferir el criterio. Si el material incluye fórmulas, tablas, diagramas o normativa, verificá el resultado en la bibliografía."
        ]
      },
      {
        "heading": "Repaso y simulación",
        "paragraphs": [
          "Planificá sesiones breves de repaso con preguntas anteriores mezcladas con preguntas nuevas. Ajustá el orden a lo que todavía no dominás, no solo al índice del documento.",
          "Antes de rendir, hacé una simulación acorde al formato: ejercicios numéricos, preguntas abiertas o escenarios. Revisá cada explicación y anotá qué tema requiere otra sesión."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto y autocontrol",
      "context": "Ejercicio: cinco observaciones son 2, 2, 3, 4 y 9. La media es 4 y la mediana es 3. Explicá cómo el valor 9 afecta a ambas y por qué describir la distribución importa antes de elegir una medida de tendencia central.",
      "steps": [
        "Identificá los datos disponibles y la pregunta central antes de elegir una respuesta.",
        "Explicá en voz alta qué concepto o procedimiento conecta esos datos con la conclusión.",
        "Cambiá una condición del caso y anticipá si cambia la respuesta; verificá la diferencia en tus apuntes.",
        "Anotá una pregunta distinta para responder en otra sesión sin consultar la solución."
      ],
      "check": "La comprobación es poder justificar el resultado y explicar un caso modificado. Confundir un resultado matemáticamente correcto con una interpretación adecuada del problema."
    },
    "mistakes": [
      {
        "title": "Confundir reconocimiento con dominio",
        "why": "Confundir un resultado matemáticamente correcto con una interpretación adecuada del problema."
      },
      {
        "title": "Practicar solo ejercicios idénticos",
        "why": "Un ejercicio conocido puede resolverse por memoria. Cambiar condiciones obliga a identificar el concepto."
      },
      {
        "title": "Ignorar las fuentes de la materia",
        "why": "La terminología, la profundidad y los procedimientos evaluados dependen de tu programa."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo empezar a estudiar estadistica?",
        "answer": "Revisá el programa, separá los objetivos, trabajá una unidad y cerrá cada sesión con preguntas que respondas sin consultar."
      },
      {
        "question": "¿Cómo organizar el repaso?",
        "answer": "Mezclá preguntas actuales con otras de sesiones anteriores, priorizá errores y ajustá el tiempo a la dificultad."
      },
      {
        "question": "¿Sirven las tarjetas?",
        "answer": "Sirven para recuperar información breve. Completalas con problemas o casos para comprobar aplicación."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "exam-planning",
    "slug": "como-preparar-un-examen-en-una-semana",
    "title": "Cómo preparar un examen en una semana: plan de siete días",
    "seoTitle": "Cómo preparar un examen en una semana: plan de siete días",
    "description": "Guía completa de planificación de exámenes en siete días: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Preparar exámenes y técnicas",
    "lead": "Una forma útil de estudiar este tema es pasar de reconocer información a explicar decisiones. Esta guía desarrolla planificación de exámenes en siete días con un método que podés comprobar utilizando tu propio programa. El objetivo no es acumular páginas leídas: es responder preguntas nuevas y detectar qué razonamiento te falta.",
    "takeaway": "Después de estudiar planificación de exámenes en siete días, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del programa a las preguntas",
        "paragraphs": [
          "Primero separá los objetivos de aprendizaje: definir, comparar, explicar un mecanismo o resolver un caso. Anotá de dónde sale cada criterio y cuál es el nivel de detalle que exige tu materia. Si un examen utiliza situaciones, no prepares solamente definiciones.",
          "Construí una tabla con tres columnas: concepto, evidencia del material y pregunta que comprueba su uso. Para cada unidad, planteá una pregunta de explicación y otra donde cambie una condición del problema."
        ]
      },
      {
        "heading": "Un ejemplo que exige razonar",
        "paragraphs": [
          "Para planificación de exámenes en siete días, empezá con una situación limitada y explicitá tus supuestos. Anotá qué datos conocés, qué resultado se pide y qué parte del razonamiento necesitás justificar.",
          "Resolvés mejor cuando podés explicar por qué elegiste un procedimiento antes de ejecutarlo. Contrastar alternativas evita memorizar una respuesta que funciona solamente en un ejercicio."
        ]
      },
      {
        "heading": "Recuperación y corrección",
        "paragraphs": [
          "Al terminar un bloque de lectura, cerrá los apuntes y recuperá la información sin pistas. Después compará con la fuente e identificá si el error fue de concepto, procedimiento, interpretación o vocabulario.",
          "No repitas inmediatamente el mismo ejemplo de memoria. Cambiá una variable y comprobá si podés transferir el criterio. Si el material incluye fórmulas, tablas, diagramas o normativa, verificá el resultado en la bibliografía."
        ]
      },
      {
        "heading": "Repaso y simulación",
        "paragraphs": [
          "Planificá sesiones breves de repaso con preguntas anteriores mezcladas con preguntas nuevas. Ajustá el orden a lo que todavía no dominás, no solo al índice del documento.",
          "Antes de rendir, hacé una simulación acorde al formato: ejercicios numéricos, preguntas abiertas o escenarios. Revisá cada explicación y anotá qué tema requiere otra sesión."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto y autocontrol",
      "context": "Caso: tenés siete días y cuatro unidades. Usá el día 1 para diagnosticar, los días 2–4 para contenidos difíciles, el día 5 para preguntas mezcladas, el 6 para un simulacro y el 7 para corregir errores prioritarios y descansar. Ajustá el reparto según tu temario.",
      "steps": [
        "Identificá los datos disponibles y la pregunta central antes de elegir una respuesta.",
        "Explicá en voz alta qué concepto o procedimiento conecta esos datos con la conclusión.",
        "Cambiá una condición del caso y anticipá si cambia la respuesta; verificá la diferencia en tus apuntes.",
        "Anotá una pregunta distinta para responder en otra sesión sin consultar la solución."
      ],
      "check": "La comprobación es poder justificar el resultado y explicar un caso modificado. Distribuir todas las horas en lectura y dejar la primera pregunta de práctica para la víspera."
    },
    "mistakes": [
      {
        "title": "Confundir reconocimiento con dominio",
        "why": "Distribuir todas las horas en lectura y dejar la primera pregunta de práctica para la víspera."
      },
      {
        "title": "Practicar solo ejercicios idénticos",
        "why": "Un ejercicio conocido puede resolverse por memoria. Cambiar condiciones obliga a identificar el concepto."
      },
      {
        "title": "Ignorar las fuentes de la materia",
        "why": "La terminología, la profundidad y los procedimientos evaluados dependen de tu programa."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo empezar a estudiar este contenido?",
        "answer": "Revisá el programa, separá los objetivos, trabajá una unidad y cerrá cada sesión con preguntas que respondas sin consultar."
      },
      {
        "question": "¿Cómo organizar el repaso?",
        "answer": "Mezclá preguntas actuales con otras de sesiones anteriores, priorizá errores y ajustá el tiempo a la dificultad."
      },
      {
        "question": "¿Sirven las tarjetas?",
        "answer": "Sirven para recuperar información breve. Completalas con problemas o casos para comprobar aplicación."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "active-recall",
    "slug": "recuperacion-activa-para-estudiar",
    "title": "Recuperación activa: cómo estudiar sin releer siempre",
    "seoTitle": "Recuperación activa: cómo estudiar sin releer siempre",
    "description": "Guía completa de recuperación activa frente a relectura: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Preparar exámenes y técnicas",
    "lead": "Una forma útil de estudiar este tema es pasar de reconocer información a explicar decisiones. Esta guía desarrolla recuperación activa frente a relectura con un método que podés comprobar utilizando tu propio programa. El objetivo no es acumular páginas leídas: es responder preguntas nuevas y detectar qué razonamiento te falta.",
    "takeaway": "Después de estudiar recuperación activa frente a relectura, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del programa a las preguntas",
        "paragraphs": [
          "Primero separá los objetivos de aprendizaje: definir, comparar, explicar un mecanismo o resolver un caso. Anotá de dónde sale cada criterio y cuál es el nivel de detalle que exige tu materia. Si un examen utiliza situaciones, no prepares solamente definiciones.",
          "Construí una tabla con tres columnas: concepto, evidencia del material y pregunta que comprueba su uso. Para cada unidad, planteá una pregunta de explicación y otra donde cambie una condición del problema."
        ]
      },
      {
        "heading": "Un ejemplo que exige razonar",
        "paragraphs": [
          "Para recuperación activa frente a relectura, empezá con una situación limitada y explicitá tus supuestos. Anotá qué datos conocés, qué resultado se pide y qué parte del razonamiento necesitás justificar.",
          "Resolvés mejor cuando podés explicar por qué elegiste un procedimiento antes de ejecutarlo. Contrastar alternativas evita memorizar una respuesta que funciona solamente en un ejercicio."
        ]
      },
      {
        "heading": "Recuperación y corrección",
        "paragraphs": [
          "Al terminar un bloque de lectura, cerrá los apuntes y recuperá la información sin pistas. Después compará con la fuente e identificá si el error fue de concepto, procedimiento, interpretación o vocabulario.",
          "No repitas inmediatamente el mismo ejemplo de memoria. Cambiá una variable y comprobá si podés transferir el criterio. Si el material incluye fórmulas, tablas, diagramas o normativa, verificá el resultado en la bibliografía."
        ]
      },
      {
        "heading": "Repaso y simulación",
        "paragraphs": [
          "Planificá sesiones breves de repaso con preguntas anteriores mezcladas con preguntas nuevas. Ajustá el orden a lo que todavía no dominás, no solo al índice del documento.",
          "Antes de rendir, hacé una simulación acorde al formato: ejercicios numéricos, preguntas abiertas o escenarios. Revisá cada explicación y anotá qué tema requiere otra sesión."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto y autocontrol",
      "context": "Ejercicio: leé durante diez minutos una explicación sobre oferta y demanda. Cerrá el material y respondé qué pasa cuando cambia el precio propio y qué pasa cuando cambia el ingreso. Compará tu respuesta con el texto y elaborá una pregunta diferente para mañana.",
      "steps": [
        "Identificá los datos disponibles y la pregunta central antes de elegir una respuesta.",
        "Explicá en voz alta qué concepto o procedimiento conecta esos datos con la conclusión.",
        "Cambiá una condición del caso y anticipá si cambia la respuesta; verificá la diferencia en tus apuntes.",
        "Anotá una pregunta distinta para responder en otra sesión sin consultar la solución."
      ],
      "check": "La comprobación es poder justificar el resultado y explicar un caso modificado. Llamar recuperación activa a releer una tarjeta con la respuesta visible."
    },
    "mistakes": [
      {
        "title": "Confundir reconocimiento con dominio",
        "why": "Llamar recuperación activa a releer una tarjeta con la respuesta visible."
      },
      {
        "title": "Practicar solo ejercicios idénticos",
        "why": "Un ejercicio conocido puede resolverse por memoria. Cambiar condiciones obliga a identificar el concepto."
      },
      {
        "title": "Ignorar las fuentes de la materia",
        "why": "La terminología, la profundidad y los procedimientos evaluados dependen de tu programa."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo empezar a estudiar este contenido?",
        "answer": "Revisá el programa, separá los objetivos, trabajá una unidad y cerrá cada sesión con preguntas que respondas sin consultar."
      },
      {
        "question": "¿Cómo organizar el repaso?",
        "answer": "Mezclá preguntas actuales con otras de sesiones anteriores, priorizá errores y ajustá el tiempo a la dificultad."
      },
      {
        "question": "¿Sirven las tarjetas?",
        "answer": "Sirven para recuperar información breve. Completalas con problemas o casos para comprobar aplicación."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  }
];
export const MASTER_EN_BLOG:StudyBlogArticle[] = [
  {
    "key": "medicine",
    "slug": "how-to-study-medicine",
    "title": "How to Study Medicine: Cases and Practice",
    "seoTitle": "How to Study Medicine: Cases and Practice",
    "description": "A practical guide to clinical reasoning: structured method, a worked example, self-checks, common mistakes, and exam preparation.",
    "category": "Study by subject",
    "lead": "To study medicine effectively, move beyond recognition toward explaining decisions. This guide develops clinical reasoning with a practical method that you can check against your own syllabus. The goal is not to finish more pages; it is to answer new questions and find gaps in your reasoning.",
    "takeaway": "After studying clinical reasoning, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Translate the syllabus into questions",
        "paragraphs": [
          "Begin by identifying the learning objective: define a term, compare approaches, explain a mechanism, or solve a problem. Check the course syllabus for the expected level of detail; a case-based exam cannot be prepared with definitions alone.",
          "Make a three-column sheet listing the concept, relevant evidence from your assigned material, and a question that would test its use. Include an explanation question and one where a condition changes."
        ]
      },
      {
        "heading": "Reason through a worked situation",
        "paragraphs": [
          "For clinical reasoning, start with a bounded scenario and make your assumptions explicit. Separate known information, the result being requested, and the reasoning that needs to be justified.",
          "The ability to explain why a method applies is more useful than repeating a familiar worked solution. Compare at least two approaches and state why one is unsuitable for this particular case."
        ]
      },
      {
        "heading": "Retrieve and correct",
        "paragraphs": [
          "After reading a section, close your notes and retrieve the explanation without hints. Then compare with the source and classify the error: concept, method, interpretation, or terminology.",
          "Avoid immediately repeating exactly the same question. Change a condition to test transfer. Check equations, charts, diagrams, and specialist claims against the assigned material."
        ]
      },
      {
        "heading": "Revisit and simulate",
        "paragraphs": [
          "Schedule short retrieval sessions that mix earlier topics with new questions. Revise the schedule according to what you can actually answer, rather than the table of contents alone.",
          "Before your assessment, simulate its real format: calculations, explanations, or cases. Inspect why each answer worked and decide which topic needs another attempt."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example and self-check",
      "context": "Study case: a person presents with fever and fatigue. Before proposing a diagnosis, separate symptoms, history, missing observations, and investigations addressed in your course. Two symptoms do not establish a real diagnosis.",
      "steps": [
        "Identify the known information and the question before selecting an answer.",
        "Explain which concept or method connects the evidence to the conclusion.",
        "Change one condition and predict whether the answer changes; verify the reasoning against your notes.",
        "Write a different question to answer in a later session without using the worked solution."
      ],
      "check": "The test is whether you can justify the outcome and handle a changed case. Confusing symptom recognition with diagnosis: without context, a finding can have several explanations."
    },
    "mistakes": [
      {
        "title": "Mistaking recognition for mastery",
        "why": "Confusing symptom recognition with diagnosis: without context, a finding can have several explanations."
      },
      {
        "title": "Practicing only repeated examples",
        "why": "A familiar example can be reproduced from memory. Changing conditions tests understanding."
      },
      {
        "title": "Ignoring course sources",
        "why": "Required terminology, depth, and procedures depend on your syllabus."
      }
    ],
    "faq": [
      {
        "question": "Where should I start?",
        "answer": "Review your syllabus, separate learning objectives, work through one unit, and end with questions answered without notes."
      },
      {
        "question": "How should I schedule review?",
        "answer": "Mix current and older questions, prioritize mistakes, and adjust the schedule to difficulty."
      },
      {
        "question": "Are flashcards enough?",
        "answer": "Flashcards can test short facts and distinctions. Add cases and problems to assess application."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "nursing",
    "slug": "how-to-study-nursing",
    "title": "How to Study Nursing: Cases and Practice",
    "seoTitle": "How to Study Nursing: Cases and Practice",
    "description": "A practical guide to clinical prioritization and nursing care: structured method, a worked example, self-checks, common mistakes, and exam preparation.",
    "category": "Study by subject",
    "lead": "To study nursing effectively, move beyond recognition toward explaining decisions. This guide develops clinical prioritization and nursing care with a practical method that you can check against your own syllabus. The goal is not to finish more pages; it is to answer new questions and find gaps in your reasoning.",
    "takeaway": "After studying clinical prioritization and nursing care, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Translate the syllabus into questions",
        "paragraphs": [
          "Begin by identifying the learning objective: define a term, compare approaches, explain a mechanism, or solve a problem. Check the course syllabus for the expected level of detail; a case-based exam cannot be prepared with definitions alone.",
          "Make a three-column sheet listing the concept, relevant evidence from your assigned material, and a question that would test its use. Include an explanation question and one where a condition changes."
        ]
      },
      {
        "heading": "Reason through a worked situation",
        "paragraphs": [
          "For clinical prioritization and nursing care, start with a bounded scenario and make your assumptions explicit. Separate known information, the result being requested, and the reasoning that needs to be justified.",
          "The ability to explain why a method applies is more useful than repeating a familiar worked solution. Compare at least two approaches and state why one is unsuitable for this particular case."
        ]
      },
      {
        "heading": "Retrieve and correct",
        "paragraphs": [
          "After reading a section, close your notes and retrieve the explanation without hints. Then compare with the source and classify the error: concept, method, interpretation, or terminology.",
          "Avoid immediately repeating exactly the same question. Change a condition to test transfer. Check equations, charts, diagrams, and specialist claims against the assigned material."
        ]
      },
      {
        "heading": "Revisit and simulate",
        "paragraphs": [
          "Schedule short retrieval sessions that mix earlier topics with new questions. Revise the schedule according to what you can actually answer, rather than the table of contents alone.",
          "Before your assessment, simulate its real format: calculations, explanations, or cases. Inspect why each answer worked and decide which topic needs another attempt."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example and self-check",
      "context": "Simulated case: you receive four observations about a hospitalized patient. Sort them into assessment findings, care needs, course-protocol actions, and reassessment. Explain why safety and communication must be documented. A study guide must not direct real patient care.",
      "steps": [
        "Identify the known information and the question before selecting an answer.",
        "Explain which concept or method connects the evidence to the conclusion.",
        "Change one condition and predict whether the answer changes; verify the reasoning against your notes.",
        "Write a different question to answer in a later session without using the worked solution."
      ],
      "check": "The test is whether you can justify the outcome and handle a changed case. Memorizing an intervention without explaining which assessment triggers it or how the response is evaluated."
    },
    "mistakes": [
      {
        "title": "Mistaking recognition for mastery",
        "why": "Memorizing an intervention without explaining which assessment triggers it or how the response is evaluated."
      },
      {
        "title": "Practicing only repeated examples",
        "why": "A familiar example can be reproduced from memory. Changing conditions tests understanding."
      },
      {
        "title": "Ignoring course sources",
        "why": "Required terminology, depth, and procedures depend on your syllabus."
      }
    ],
    "faq": [
      {
        "question": "Where should I start?",
        "answer": "Review your syllabus, separate learning objectives, work through one unit, and end with questions answered without notes."
      },
      {
        "question": "How should I schedule review?",
        "answer": "Mix current and older questions, prioritize mistakes, and adjust the schedule to difficulty."
      },
      {
        "question": "Are flashcards enough?",
        "answer": "Flashcards can test short facts and distinctions. Add cases and problems to assess application."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "engineering",
    "slug": "how-to-study-engineering",
    "title": "How to Study Engineering: Cases and Practice",
    "seoTitle": "How to Study Engineering: Cases and Practice",
    "description": "A practical guide to problem solving with units and assumptions: structured method, a worked example, self-checks, common mistakes, and exam preparation.",
    "category": "Study by subject",
    "lead": "To study engineering effectively, move beyond recognition toward explaining decisions. This guide develops problem solving with units and assumptions with a practical method that you can check against your own syllabus. The goal is not to finish more pages; it is to answer new questions and find gaps in your reasoning.",
    "takeaway": "After studying problem solving with units and assumptions, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Translate the syllabus into questions",
        "paragraphs": [
          "Begin by identifying the learning objective: define a term, compare approaches, explain a mechanism, or solve a problem. Check the course syllabus for the expected level of detail; a case-based exam cannot be prepared with definitions alone.",
          "Make a three-column sheet listing the concept, relevant evidence from your assigned material, and a question that would test its use. Include an explanation question and one where a condition changes."
        ]
      },
      {
        "heading": "Reason through a worked situation",
        "paragraphs": [
          "For problem solving with units and assumptions, start with a bounded scenario and make your assumptions explicit. Separate known information, the result being requested, and the reasoning that needs to be justified.",
          "The ability to explain why a method applies is more useful than repeating a familiar worked solution. Compare at least two approaches and state why one is unsuitable for this particular case."
        ]
      },
      {
        "heading": "Retrieve and correct",
        "paragraphs": [
          "After reading a section, close your notes and retrieve the explanation without hints. Then compare with the source and classify the error: concept, method, interpretation, or terminology.",
          "Avoid immediately repeating exactly the same question. Change a condition to test transfer. Check equations, charts, diagrams, and specialist claims against the assigned material."
        ]
      },
      {
        "heading": "Revisit and simulate",
        "paragraphs": [
          "Schedule short retrieval sessions that mix earlier topics with new questions. Revise the schedule according to what you can actually answer, rather than the table of contents alone.",
          "Before your assessment, simulate its real format: calculations, explanations, or cases. Inspect why each answer worked and decide which topic needs another attempt."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example and self-check",
      "context": "Worked example: a vehicle covers 120 meters in 10 seconds at constant speed. Calculate 12 m/s, convert it to 43.2 km/h, then explain why the result is not a model of acceleration and which assumption would invalidate the formula.",
      "steps": [
        "Identify the known information and the question before selecting an answer.",
        "Explain which concept or method connects the evidence to the conclusion.",
        "Change one condition and predict whether the answer changes; verify the reasoning against your notes.",
        "Write a different question to answer in a later session without using the worked solution."
      ],
      "check": "The test is whether you can justify the outcome and handle a changed case. Substituting numbers into equations without checking units or the assumptions that make the formula valid."
    },
    "mistakes": [
      {
        "title": "Mistaking recognition for mastery",
        "why": "Substituting numbers into equations without checking units or the assumptions that make the formula valid."
      },
      {
        "title": "Practicing only repeated examples",
        "why": "A familiar example can be reproduced from memory. Changing conditions tests understanding."
      },
      {
        "title": "Ignoring course sources",
        "why": "Required terminology, depth, and procedures depend on your syllabus."
      }
    ],
    "faq": [
      {
        "question": "Where should I start?",
        "answer": "Review your syllabus, separate learning objectives, work through one unit, and end with questions answered without notes."
      },
      {
        "question": "How should I schedule review?",
        "answer": "Mix current and older questions, prioritize mistakes, and adjust the schedule to difficulty."
      },
      {
        "question": "Are flashcards enough?",
        "answer": "Flashcards can test short facts and distinctions. Add cases and problems to assess application."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "statistics",
    "slug": "how-to-study-statistics",
    "title": "How to Study Statistics: Cases and Practice",
    "seoTitle": "How to Study Statistics: Cases and Practice",
    "description": "A practical guide to statistical interpretation and method choice: structured method, a worked example, self-checks, common mistakes, and exam preparation.",
    "category": "Study by subject",
    "lead": "To study statistics effectively, move beyond recognition toward explaining decisions. This guide develops statistical interpretation and method choice with a practical method that you can check against your own syllabus. The goal is not to finish more pages; it is to answer new questions and find gaps in your reasoning.",
    "takeaway": "After studying statistical interpretation and method choice, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Translate the syllabus into questions",
        "paragraphs": [
          "Begin by identifying the learning objective: define a term, compare approaches, explain a mechanism, or solve a problem. Check the course syllabus for the expected level of detail; a case-based exam cannot be prepared with definitions alone.",
          "Make a three-column sheet listing the concept, relevant evidence from your assigned material, and a question that would test its use. Include an explanation question and one where a condition changes."
        ]
      },
      {
        "heading": "Reason through a worked situation",
        "paragraphs": [
          "For statistical interpretation and method choice, start with a bounded scenario and make your assumptions explicit. Separate known information, the result being requested, and the reasoning that needs to be justified.",
          "The ability to explain why a method applies is more useful than repeating a familiar worked solution. Compare at least two approaches and state why one is unsuitable for this particular case."
        ]
      },
      {
        "heading": "Retrieve and correct",
        "paragraphs": [
          "After reading a section, close your notes and retrieve the explanation without hints. Then compare with the source and classify the error: concept, method, interpretation, or terminology.",
          "Avoid immediately repeating exactly the same question. Change a condition to test transfer. Check equations, charts, diagrams, and specialist claims against the assigned material."
        ]
      },
      {
        "heading": "Revisit and simulate",
        "paragraphs": [
          "Schedule short retrieval sessions that mix earlier topics with new questions. Revise the schedule according to what you can actually answer, rather than the table of contents alone.",
          "Before your assessment, simulate its real format: calculations, explanations, or cases. Inspect why each answer worked and decide which topic needs another attempt."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example and self-check",
      "context": "Worked example: five observations are 2, 2, 3, 4, and 9. The mean is 4 and the median is 3. Explain why the observation 9 affects the measures differently and why distribution shape matters before selecting a summary.",
      "steps": [
        "Identify the known information and the question before selecting an answer.",
        "Explain which concept or method connects the evidence to the conclusion.",
        "Change one condition and predict whether the answer changes; verify the reasoning against your notes.",
        "Write a different question to answer in a later session without using the worked solution."
      ],
      "check": "The test is whether you can justify the outcome and handle a changed case. Treating a numerically correct result as an adequate interpretation of the underlying question."
    },
    "mistakes": [
      {
        "title": "Mistaking recognition for mastery",
        "why": "Treating a numerically correct result as an adequate interpretation of the underlying question."
      },
      {
        "title": "Practicing only repeated examples",
        "why": "A familiar example can be reproduced from memory. Changing conditions tests understanding."
      },
      {
        "title": "Ignoring course sources",
        "why": "Required terminology, depth, and procedures depend on your syllabus."
      }
    ],
    "faq": [
      {
        "question": "Where should I start?",
        "answer": "Review your syllabus, separate learning objectives, work through one unit, and end with questions answered without notes."
      },
      {
        "question": "How should I schedule review?",
        "answer": "Mix current and older questions, prioritize mistakes, and adjust the schedule to difficulty."
      },
      {
        "question": "Are flashcards enough?",
        "answer": "Flashcards can test short facts and distinctions. Add cases and problems to assess application."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "exam-planning",
    "slug": "how-to-prepare-for-an-exam-in-one-week",
    "title": "How to Prepare for an Exam in One Week: A 7-Day Plan",
    "seoTitle": "How to Prepare for an Exam in One Week: A 7-Day Plan",
    "description": "A practical guide to seven-day exam planning: structured method, a worked example, self-checks, common mistakes, and exam preparation.",
    "category": "Exam preparation and methods",
    "lead": "To study this topic effectively, move beyond recognition toward explaining decisions. This guide develops seven-day exam planning with a practical method that you can check against your own syllabus. The goal is not to finish more pages; it is to answer new questions and find gaps in your reasoning.",
    "takeaway": "After studying seven-day exam planning, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Translate the syllabus into questions",
        "paragraphs": [
          "Begin by identifying the learning objective: define a term, compare approaches, explain a mechanism, or solve a problem. Check the course syllabus for the expected level of detail; a case-based exam cannot be prepared with definitions alone.",
          "Make a three-column sheet listing the concept, relevant evidence from your assigned material, and a question that would test its use. Include an explanation question and one where a condition changes."
        ]
      },
      {
        "heading": "Reason through a worked situation",
        "paragraphs": [
          "For seven-day exam planning, start with a bounded scenario and make your assumptions explicit. Separate known information, the result being requested, and the reasoning that needs to be justified.",
          "The ability to explain why a method applies is more useful than repeating a familiar worked solution. Compare at least two approaches and state why one is unsuitable for this particular case."
        ]
      },
      {
        "heading": "Retrieve and correct",
        "paragraphs": [
          "After reading a section, close your notes and retrieve the explanation without hints. Then compare with the source and classify the error: concept, method, interpretation, or terminology.",
          "Avoid immediately repeating exactly the same question. Change a condition to test transfer. Check equations, charts, diagrams, and specialist claims against the assigned material."
        ]
      },
      {
        "heading": "Revisit and simulate",
        "paragraphs": [
          "Schedule short retrieval sessions that mix earlier topics with new questions. Revise the schedule according to what you can actually answer, rather than the table of contents alone.",
          "Before your assessment, simulate its real format: calculations, explanations, or cases. Inspect why each answer worked and decide which topic needs another attempt."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example and self-check",
      "context": "Scenario: you have seven days and four units. Use day 1 to diagnose gaps, days 2–4 to learn difficult material, day 5 for mixed retrieval, day 6 for a mock test, and day 7 for targeted corrections and rest. Adapt the schedule to the syllabus.",
      "steps": [
        "Identify the known information and the question before selecting an answer.",
        "Explain which concept or method connects the evidence to the conclusion.",
        "Change one condition and predict whether the answer changes; verify the reasoning against your notes.",
        "Write a different question to answer in a later session without using the worked solution."
      ],
      "check": "The test is whether you can justify the outcome and handle a changed case. Allocating all available hours to reading and postponing the first practice question until the night before."
    },
    "mistakes": [
      {
        "title": "Mistaking recognition for mastery",
        "why": "Allocating all available hours to reading and postponing the first practice question until the night before."
      },
      {
        "title": "Practicing only repeated examples",
        "why": "A familiar example can be reproduced from memory. Changing conditions tests understanding."
      },
      {
        "title": "Ignoring course sources",
        "why": "Required terminology, depth, and procedures depend on your syllabus."
      }
    ],
    "faq": [
      {
        "question": "Where should I start?",
        "answer": "Review your syllabus, separate learning objectives, work through one unit, and end with questions answered without notes."
      },
      {
        "question": "How should I schedule review?",
        "answer": "Mix current and older questions, prioritize mistakes, and adjust the schedule to difficulty."
      },
      {
        "question": "Are flashcards enough?",
        "answer": "Flashcards can test short facts and distinctions. Add cases and problems to assess application."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "active-recall",
    "slug": "active-recall-study-method",
    "title": "Active Recall: Study Without Constant Rereading",
    "seoTitle": "Active Recall: Study Without Constant Rereading",
    "description": "A practical guide to active recall versus rereading: structured method, a worked example, self-checks, common mistakes, and exam preparation.",
    "category": "Exam preparation and methods",
    "lead": "To study this topic effectively, move beyond recognition toward explaining decisions. This guide develops active recall versus rereading with a practical method that you can check against your own syllabus. The goal is not to finish more pages; it is to answer new questions and find gaps in your reasoning.",
    "takeaway": "After studying active recall versus rereading, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Translate the syllabus into questions",
        "paragraphs": [
          "Begin by identifying the learning objective: define a term, compare approaches, explain a mechanism, or solve a problem. Check the course syllabus for the expected level of detail; a case-based exam cannot be prepared with definitions alone.",
          "Make a three-column sheet listing the concept, relevant evidence from your assigned material, and a question that would test its use. Include an explanation question and one where a condition changes."
        ]
      },
      {
        "heading": "Reason through a worked situation",
        "paragraphs": [
          "For active recall versus rereading, start with a bounded scenario and make your assumptions explicit. Separate known information, the result being requested, and the reasoning that needs to be justified.",
          "The ability to explain why a method applies is more useful than repeating a familiar worked solution. Compare at least two approaches and state why one is unsuitable for this particular case."
        ]
      },
      {
        "heading": "Retrieve and correct",
        "paragraphs": [
          "After reading a section, close your notes and retrieve the explanation without hints. Then compare with the source and classify the error: concept, method, interpretation, or terminology.",
          "Avoid immediately repeating exactly the same question. Change a condition to test transfer. Check equations, charts, diagrams, and specialist claims against the assigned material."
        ]
      },
      {
        "heading": "Revisit and simulate",
        "paragraphs": [
          "Schedule short retrieval sessions that mix earlier topics with new questions. Revise the schedule according to what you can actually answer, rather than the table of contents alone.",
          "Before your assessment, simulate its real format: calculations, explanations, or cases. Inspect why each answer worked and decide which topic needs another attempt."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example and self-check",
      "context": "Exercise: read a short explanation of supply and demand for ten minutes. Close the notes and explain the difference between a change in a good's own price and a change in consumer income. Check your answer and write a different question for a later session.",
      "steps": [
        "Identify the known information and the question before selecting an answer.",
        "Explain which concept or method connects the evidence to the conclusion.",
        "Change one condition and predict whether the answer changes; verify the reasoning against your notes.",
        "Write a different question to answer in a later session without using the worked solution."
      ],
      "check": "The test is whether you can justify the outcome and handle a changed case. Calling an activity active recall while keeping the answer visible throughout."
    },
    "mistakes": [
      {
        "title": "Mistaking recognition for mastery",
        "why": "Calling an activity active recall while keeping the answer visible throughout."
      },
      {
        "title": "Practicing only repeated examples",
        "why": "A familiar example can be reproduced from memory. Changing conditions tests understanding."
      },
      {
        "title": "Ignoring course sources",
        "why": "Required terminology, depth, and procedures depend on your syllabus."
      }
    ],
    "faq": [
      {
        "question": "Where should I start?",
        "answer": "Review your syllabus, separate learning objectives, work through one unit, and end with questions answered without notes."
      },
      {
        "question": "How should I schedule review?",
        "answer": "Mix current and older questions, prioritize mistakes, and adjust the schedule to difficulty."
      },
      {
        "question": "Are flashcards enough?",
        "answer": "Flashcards can test short facts and distinctions. Add cases and problems to assess application."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  }
];
