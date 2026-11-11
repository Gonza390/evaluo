import type { StudyBlogArticle } from './study-blog-articles';
export const MASTER_ES_BLOG:StudyBlogArticle[] = [
  {
    "key": "medicine",
    "slug": "como-estudiar-medicina",
    "title": "Cómo estudiar medicina: método, casos y práctica",
    "seoTitle": "Cómo estudiar medicina: método, casos y práctica",
    "description": "Guía completa de razonamiento clínico: método por etapas, ejemplo aplicado, preguntas de autocontrol, errores frecuentes y preparación de exámenes.",
    "category": "Estudiar por materia",
    "lead": "Esta guía de medicina propone problemas específicos de la disciplina: analizá el razonamiento, verificá cada cálculo y corregí errores con la bibliografía de tu programa.",
    "takeaway": "Después de estudiar razonamiento clínico, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Del síntoma al problema clínico, sin saltar al diagnóstico",
        "paragraphs": [
          "Organizá cada cuadro clínico de tu programa en presentación habitual, mecanismos fisiopatológicos, diagnóstico diferencial y criterios que el docente espera. Un cuadro de fiebre y cansancio, por ejemplo, no permite concluir una enfermedad: faltan antecedentes, examen físico y contexto. En un examen teórico, el objetivo es mostrar cómo razonar, no emitir indicaciones para pacientes.",
          "Para cada enfermedad del temario escribí qué dato cambiaría la probabilidad de tu hipótesis y cuál no aporta información decisiva. Contrastar dos cuadros parecidos enseña más que memorizar una lista aislada de manifestaciones."
        ]
      },
      {
        "heading": "Cómo interpretar una prueba: sensibilidad y especificidad",
        "paragraphs": [
          "Supongamos una prueba hipotética con sensibilidad del 90 % y especificidad del 80 %. En una muestra académica de 1.000 personas, con prevalencia del 10 %, habrá 100 con la condición y 900 sin ella. Esperarías 90 verdaderos positivos, 10 falsos negativos, 720 verdaderos negativos y 180 falsos positivos.",
          "Entre los 270 resultados positivos, 90 corresponden a verdaderos positivos: el valor predictivo positivo en ese ejemplo es 90/270, aproximadamente 33,3 %. No confundas sensibilidad con probabilidad de padecer la enfermedad tras un positivo: esta última depende también de la prevalencia. Son cifras didácticas, no propiedades de una prueba clínica real."
        ]
      },
      {
        "heading": "Aprendé mecanismos, no listas de enfermedades",
        "paragraphs": [
          "Elegí un mecanismo del programa, por ejemplo, la respuesta inflamatoria. Explicá desencadenante, mediadores descritos en tu bibliografía, efectos esperados y por qué ciertos hallazgos pueden aparecer juntos. Después preguntate qué cambiaría si fallara una etapa.",
          "Separá hechos consolidados del curso, hipótesis y asociaciones. En medicina, una relación estadística no implica causalidad y una explicación de fisiología no reemplaza la valoración clínica profesional."
        ]
      },
      {
        "heading": "Práctica de casos con justificación y límites",
        "paragraphs": [
          "Practicá con viñetas inventadas donde debas formular dos hipótesis, aportar un dato a favor y uno en contra de cada una y decir qué información falta. Contrastá después con la fuente asignada.",
          "Al corregir, anotá si confundiste un signo con un síntoma, interpretaste mal una prueba o aplicaste una regla fuera del contexto. No utilices estos ejercicios para autodiagnóstico ni para decisiones de atención."
        ]
      }
    ],
    "exercise": {
      "title": "Ejercicio resuelto: interpretar una prueba diagnóstica ficticia",
      "context": "En una población ficticia de 1.000 personas, la prevalencia de una condición es 10 %. Una prueba académica hipotética tiene sensibilidad 90 % y especificidad 80 %.",
      "steps": [
        "De las 1.000 personas, 100 presentan la condición y 900 no la presentan.",
        "Entre las 100 personas con la condición, 90 dan positivo (verdaderos positivos) y 10 negativo.",
        "Entre las 900 personas sin la condición, 720 dan negativo y 180 positivo (falsos positivos).",
        "Calculá la proporción de verdaderos positivos entre todos los positivos: 90 / (90 + 180) = 33,3 %. Explicá por qué no coincide con la sensibilidad del 90 %."
      ],
      "check": "La diferencia depende de la prevalencia y los falsos positivos. Son números didácticos, no recomendaciones de uso de una prueba real."
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
    "description": "Cómo estudiar enfermería: priorización y cuidados por etapas, con ejemplo aplicado, preguntas de autocontrol y errores frecuentes.",
    "category": "Estudiar por materia",
    "lead": "Esta guía de enfermería propone problemas específicos de la disciplina: analizá el razonamiento, verificá cada cálculo y corregí errores con la bibliografía de tu programa.",
    "takeaway": "Después de estudiar priorización y cuidados de enfermería, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Estudiá el proceso de enfermería como una secuencia razonada",
        "paragraphs": [
          "Organizá una ficha con valoración, diagnóstico de enfermería según el marco que use tu curso, planificación, intervención y evaluación. Para cada etapa anotá qué información necesita la siguiente; no se trata de memorizar cinco nombres sin conexión.",
          "Cuando prepares un parcial, contrastá el lenguaje de tu programa con los manuales de referencia. No sustituyas la normativa local ni el criterio de profesionales que supervisan prácticas reales."
        ]
      },
      {
        "heading": "Separá observación, interpretación y acción",
        "paragraphs": [
          "En un escenario ficticio, distinguí lo observado («la persona refiere dolor») de lo inferido («podría existir una necesidad de confort»). Una observación por sí sola no establece una conclusión clínica ni autoriza un procedimiento.",
          "Estudiá el motivo por el cual se registra una observación, a quién se comunica y qué información adicional sería necesaria. La documentación académica debe respetar confidencialidad y precisión."
        ]
      },
      {
        "heading": "Caso académico: comunicar un cambio en el estado",
        "paragraphs": [
          "Un caso simulado describe que una persona previamente orientada responde ahora de manera confusa. Identificá qué es una variación respecto de su estado habitual, qué datos deben verificarse y cómo transmitirlo mediante el esquema de comunicación indicado en tu asignatura.",
          "Para practicar SBAR como formato de comunicación, separá situación, antecedentes, valoración y recomendación de escalar según el protocolo enseñado; no inventes parámetros ni instrucciones terapéuticas. El propósito del ejercicio es ordenar la comunicación, no proporcionar consejo clínico."
        ]
      },
      {
        "heading": "Practicá priorización sin convertirla en instrucciones clínicas",
        "paragraphs": [
          "Compará dos problemas simulados y explicá qué criterio de seguridad aparece en el material de tu curso. Si una consigna exige protocolos concretos, usá exclusivamente los correspondientes a la institución y jurisdicción que estudies.",
          "Terminá la sesión con una pregunta de aplicación y otra de documentación; revisá los errores con bibliografía de enfermería y consulta al docente ante ambigüedades."
        ]
      }
    ],
    "exercise": {
      "title": "Caso resuelto: comunicación estructurada en un escenario ficticio",
      "context": "Durante una práctica escrita, se informa que una persona presenta un cambio reciente respecto del nivel de orientación documentado en un caso simulado.",
      "steps": [
        "Situación: redactá una oración que describa el cambio observado sin asignar una causa no comprobada.",
        "Antecedentes: señalá qué estado previo menciona el ejercicio y qué información relevante falta.",
        "Valoración: separá observaciones verificadas de interpretaciones o posibles explicaciones.",
        "Comunicación: organizá la información para reportarla según el protocolo del programa; explicá por qué inventar datos o asumir un diagnóstico sería incorrecto."
      ],
      "check": "La respuesta académica describe y comunica información observada de manera ordenada. No prescribe tratamientos ni reemplaza protocolos clínicos reales."
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
    "description": "Cómo estudiar ingeniería: resolver problemas con unidades y supuestos, con ejemplo aplicado, autocontrol y errores frecuentes.",
    "category": "Estudiar por materia",
    "lead": "Esta guía de ingeniería propone problemas específicos de la disciplina: analizá el razonamiento, verificá cada cálculo y corregí errores con la bibliografía de tu programa.",
    "takeaway": "Después de estudiar resolución de problemas con unidades y supuestos, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Definí el modelo físico antes de elegir la fórmula",
        "paragraphs": [
          "Para un problema de ingeniería, dibujá la situación, identificá el sistema, listá datos conocidos y incógnitas y escribí los supuestos. Una fórmula puede ser correcta y, sin embargo, no corresponder al fenómeno que te están pidiendo modelar.",
          "Por ejemplo, usar distancia dividida por tiempo representa rapidez media; sólo describe la rapidez en cada instante cuando el movimiento es uniforme. Aclarar el modelo es parte de la solución."
        ]
      },
      {
        "heading": "Unidades y conversiones: el primer control de calidad",
        "paragraphs": [
          "Trabajá con unidades compatibles antes de reemplazar números. Si un vehículo recorre 120 m en 10 s, el resultado inicial es 12 m/s. Para pasarlo a km/h multiplicás por 3,6 y obtenés 43,2 km/h.",
          "Controlá dimensiones: metros divididos por segundos producen rapidez, mientras que metros por segundo cuadrado corresponden a aceleración. Si una magnitud final tiene unidades equivocadas, revisá el planteo antes de revisar la aritmética."
        ]
      },
      {
        "heading": "Ejercicio desarrollado de cinemática con comprobación",
        "paragraphs": [
          "Ejercicio: un móvil mantiene 12 m/s durante 10 s. Distancia = rapidez × tiempo = 12 × 10 = 120 m. Si mantiene la misma rapidez durante 5 s adicionales, recorre otros 60 m, para un total de 180 m en 15 s.",
          "Comprobación: 180 m / 15 s = 12 m/s. Dibujá una gráfica posición-tiempo: bajo los supuestos, la pendiente es constante. No afirmes que el movimiento tuvo aceleración sólo porque recorrió una distancia mayor al pasar más tiempo."
        ]
      },
      {
        "heading": "Qué cambia si el movimiento no es uniforme",
        "paragraphs": [
          "Si el enunciado introduce aceleración constante desde el reposo, ya no alcanza con x = v·t para representar todos los intervalos usando una única rapidez constante. Debés revisar las ecuaciones del movimiento acelerado y las condiciones iniciales.",
          "Cambiar un supuesto deliberadamente es una práctica útil: muestra si entendiste el modelo, no sólo la sustitución numérica."
        ]
      }
    ],
    "exercise": {
      "title": "Ejercicio desarrollado: rapidez, distancia y conversión",
      "context": "Un vehículo recorre 120 m en 10 s con rapidez constante. Luego continúa durante 5 s más manteniendo esa rapidez.",
      "steps": [
        "Identificá el supuesto: movimiento uniforme. No se proporciona aceleración.",
        "Calculá la rapidez: 120 m / 10 s = 12 m/s; convertí a km/h: 12 × 3,6 = 43,2 km/h.",
        "Calculá la distancia adicional: 12 m/s × 5 s = 60 m. La distancia total es 180 m.",
        "Comprobá usando todo el intervalo: 180 m / 15 s = 12 m/s. Dibujá una gráfica posición-tiempo con pendiente constante."
      ],
      "check": "La respuesta es coherente dimensionalmente (m/s y m). Si la velocidad no fuera constante, habría que revisar el procedimiento."
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
    "description": "Cómo estudiar estadística: interpretar resultados y elegir el procedimiento, con ejemplo aplicado y preguntas de autocontrol.",
    "category": "Estudiar por materia",
    "lead": "Esta guía de estadística propone problemas específicos de la disciplina: analizá el razonamiento, verificá cada cálculo y corregí errores con la bibliografía de tu programa.",
    "takeaway": "Después de estudiar interpretación estadística y elección del procedimiento, comprobá si podés justificar tu respuesta sin mirar el material y transferirla a un caso nuevo.",
    "sections": [
      {
        "heading": "Primero leé los datos: nivel de medición y distribución",
        "paragraphs": [
          "Antes de calcular, preguntate qué representa cada observación y qué querés describir. La variable, el tamaño de la muestra y la forma de la distribución condicionan la interpretación.",
          "Con un conjunto pequeño, ordená los datos, visualizalos y explicá qué medida de tendencia central resulta útil. Un cálculo exacto puede comunicar mal la distribución si se presenta aislado."
        ]
      },
      {
        "heading": "Ejercicio resuelto: media, mediana y rango",
        "paragraphs": [
          "Datos de ejemplo: 2, 2, 3, 4, 9. La suma es 20, por lo que la media es 20/5 = 4. Los datos ordenados tienen cinco valores y el central es 3: ésa es la mediana. El rango es 9 − 2 = 7.",
          "Si reemplazás el 9 por un 4, el conjunto pasa a 2, 2, 3, 4, 4. La media es 15/5 = 3, la mediana sigue siendo 3 y el rango se reduce a 2. La comparación muestra que la media cambia más ante ese valor extremo."
        ]
      },
      {
        "heading": "Cómo interpretar el efecto de un valor extremo",
        "paragraphs": [
          "En el primer conjunto, media 4 y mediana 3 no son contradictorias. Responden a definiciones diferentes y la observación 9 desplaza la media hacia arriba.",
          "El hecho de que en un ejemplo la mediana resista mejor un valor extremo no significa que siempre deba reemplazar a la media; la medida adecuada depende de qué describe el problema."
        ]
      },
      {
        "heading": "Elegí el procedimiento según la pregunta, no al revés",
        "paragraphs": [
          "Si la consigna te pide estimar una proporción, no alcanza con calcular media y mediana de cualquier lista. Si te pregunta por asociación entre variables, necesitás otro tipo de análisis y verificar supuestos.",
          "Practicá explicar qué mide cada estadístico, cuál es la unidad y qué conclusión no se puede inferir. Una asociación en datos observacionales no demuestra causalidad."
        ]
      }
    ],
    "exercise": {
      "title": "Ejercicio desarrollado: dos conjuntos y tres medidas",
      "context": "Compará A = [2, 2, 3, 4, 9] y B = [2, 2, 3, 4, 4]. Calculá media, mediana y rango.",
      "steps": [
        "A: suma = 20; media = 20/5 = 4. Valor central = 3; mediana = 3. Rango = 9−2 = 7.",
        "B: suma = 15; media = 15/5 = 3. Valor central = 3; mediana = 3. Rango = 4−2 = 2.",
        "Explicá por qué la media cambia de 4 a 3 mientras la mediana permanece en 3.",
        "Elegí qué medida comunicarías para destacar la presencia de un valor alto y justificá la elección según la pregunta."
      ],
      "check": "La media responde a todos los valores, la mediana depende de la posición central y el rango de los extremos. No extraigas conclusiones poblacionales de estas cinco observaciones inventadas."
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
    "description": "Cómo preparar un examen en una semana: plan de siete días por etapas, con ejemplo aplicado, autocontrol y errores frecuentes.",
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
    "description": "Recuperación activa frente a relectura: cómo aplicarla por etapas, con ejemplo, preguntas de autocontrol y errores frecuentes.",
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
    "lead": "This medicine guide uses discipline-specific examples. Work through the reasoning, verify each calculation or assumption, and check your answers against the assigned course materials.",
    "takeaway": "After studying clinical reasoning, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "From presenting features to a clinical problem",
        "paragraphs": [
          "Organize each condition in your syllabus around the presenting features, underlying mechanisms, differential considerations, and evidence your instructor expects. Fever and fatigue, for example, are not enough to identify a diagnosis: context and additional findings are missing.",
          "For every condition, identify which observation would strengthen a hypothesis, which would weaken it, and which is not discriminatory. Comparing two plausible explanations builds more transferable reasoning than memorizing isolated symptom lists."
        ]
      },
      {
        "heading": "Understanding diagnostic test performance",
        "paragraphs": [
          "Consider a fictional test with 90% sensitivity and 80% specificity. In a hypothetical group of 1,000 people where prevalence is 10%, 100 have the condition and 900 do not. The expected counts are 90 true positives, 10 false negatives, 720 true negatives, and 180 false positives.",
          "Of 270 positive results, just 90 are true positives: positive predictive value is 90/270, or roughly 33.3%. Sensitivity is not the probability of having a condition after testing positive; prevalence also matters. These values are instructional, not performance claims about a real medical test."
        ]
      },
      {
        "heading": "Learn mechanisms, not lists of conditions",
        "paragraphs": [
          "Choose a mechanism from the course such as the inflammatory response. Explain the trigger, relevant mediators in your assigned sources, predicted consequences, and how the findings relate to one another.",
          "Distinguish causal mechanisms from associations and hypotheses. A classroom exercise is not a substitute for professional clinical assessment."
        ]
      },
      {
        "heading": "Practice explanatory cases while respecting limits",
        "paragraphs": [
          "Use fictional vignettes: propose competing explanations, name evidence for and against each, and identify essential missing information. Check the reasoning against the course reference.",
          "Log whether you confused a sign with a symptom, misread a diagnostic measure, or applied a rule without context. Do not use educational vignettes for personal diagnosis or patient care."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example: a fictional diagnostic test",
      "context": "In a purely hypothetical population of 1,000, a condition has 10% prevalence. A fictional test has 90% sensitivity and 80% specificity.",
      "steps": [
        "Separate the population into 100 people with the condition and 900 without it.",
        "Among those with the condition, expect 90 positive and 10 negative results.",
        "Among those without it, expect 720 negative and 180 positive results.",
        "Calculate 90 / (90 + 180) = 33.3%, the positive predictive value in this example. Explain why it differs from the test's 90% sensitivity."
      ],
      "check": "Prevalence and false positives explain the difference. The numbers are educational only and do not describe an actual diagnostic test."
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
    "lead": "This nursing guide uses discipline-specific examples. Work through the reasoning, verify each calculation or assumption, and check your answers against the assigned course materials.",
    "takeaway": "After studying clinical prioritization and nursing care, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Learn the nursing process as connected reasoning",
        "paragraphs": [
          "Build a worksheet around assessment, nursing diagnosis under the framework required by your course, planning, implementation, and evaluation. Write what information flows from one stage to the next; remembering labels alone does not demonstrate reasoning.",
          "Match the terminology to your syllabus and assigned texts. Educational explanations do not override local regulations, clinical protocols, or professional supervision."
        ]
      },
      {
        "heading": "Separate observation, interpretation, and action",
        "paragraphs": [
          "In a fictional scenario, distinguish the observation 'the person reports discomfort' from an interpretation about possible care needs. A single observation is not a diagnosis and does not authorize an intervention.",
          "Explain why observations should be documented and communicated, and what further information might be needed. Accurate academic reporting also respects confidentiality."
        ]
      },
      {
        "heading": "Fictional case: communicate a change in status",
        "paragraphs": [
          "A simulated patient who had been described as oriented is now reported as confused. Identify the change from baseline, the information that needs verification, and the structured handover approach used in your course.",
          "If your program teaches SBAR, distinguish situation, background, assessment, and recommendation to escalate under the taught protocol. Do not invent measurements or treatment decisions; the example tests communication structure."
        ]
      },
      {
        "heading": "Practice prioritization without improvising care",
        "paragraphs": [
          "Compare two fictional situations and justify which safety principles from your course apply. If the task involves institution-specific protocols, use the exact materials assigned by your instructor.",
          "Finish with an application question and a documentation question, and review mistakes against your nursing references."
        ]
      }
    ],
    "exercise": {
      "title": "Worked exercise: structured communication in a simulated case",
      "context": "A written scenario reports a recent change in a person's orientation compared with the documented baseline.",
      "steps": [
        "Situation: describe the observed change in one sentence without inventing its cause.",
        "Background: identify the baseline information and which relevant details are unavailable.",
        "Assessment: distinguish verified findings from interpretations and unanswered questions.",
        "Communication: organize the information for reporting according to your course protocol; explain why making up measurements would be unacceptable."
      ],
      "check": "The educational answer communicates observed information accurately. It does not prescribe care or replace real institutional procedures."
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
    "lead": "This engineering guide uses discipline-specific examples. Work through the reasoning, verify each calculation or assumption, and check your answers against the assigned course materials.",
    "takeaway": "After studying problem solving with units and assumptions, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Choose a physical model before an equation",
        "paragraphs": [
          "For engineering problems, sketch the system, list known values and unknowns, and state your assumptions. An equation can be mathematically correct and still be inappropriate for the physical process in the question.",
          "Distance divided by elapsed time gives average speed; it describes speed throughout an interval only under a constant-speed assumption."
        ]
      },
      {
        "heading": "Use units as an error-detection tool",
        "paragraphs": [
          "Before substituting values, express quantities in compatible units. A vehicle covering 120 m in 10 s has a speed of 12 m/s in this example. Converting with a factor of 3.6 gives 43.2 km/h.",
          "Check dimensions: metres per second represent speed, whereas metres per second squared describe acceleration. If the units of the answer do not match the requested quantity, inspect the model, not just the arithmetic."
        ]
      },
      {
        "heading": "Worked kinematics problem and independent check",
        "paragraphs": [
          "A moving object maintains 12 m/s for 10 s, so it covers 120 m. Another 5 s at the same speed adds 60 m. Total distance is 180 m over 15 s.",
          "Check by dividing 180 m by 15 s to recover 12 m/s. The position-time graph has a constant slope in the assumed model. Additional distance over more time does not itself imply acceleration."
        ]
      },
      {
        "heading": "What changes when motion is not uniform",
        "paragraphs": [
          "If the problem instead specifies acceleration from rest, a single constant-speed equation will not describe the entire motion. Review the appropriate acceleration model and initial conditions.",
          "Deliberately changing one assumption is an effective way of checking whether you understand why the original solution worked."
        ]
      }
    ],
    "exercise": {
      "title": "Worked example: speed, distance, and unit conversion",
      "context": "A vehicle travels 120 m in 10 s at constant speed, then keeps moving at that speed for another 5 s.",
      "steps": [
        "State the model: uniform motion; the question does not specify acceleration.",
        "Compute speed: 120 m / 10 s = 12 m/s. Convert using 12 × 3.6 = 43.2 km/h.",
        "Find the extra distance: 12 m/s × 5 s = 60 m, making the total 180 m.",
        "Check using the full interval: 180 m / 15 s = 12 m/s. A position-time sketch would have a constant slope."
      ],
      "check": "The numerical results and units are consistent under constant-speed assumptions. A nonuniform motion model would require different reasoning."
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
    "lead": "This statistics guide uses discipline-specific examples. Work through the reasoning, verify each calculation or assumption, and check your answers against the assigned course materials.",
    "takeaway": "After studying statistical interpretation and method choice, check whether you can explain your answer without notes and apply the idea to an unfamiliar situation.",
    "sections": [
      {
        "heading": "Inspect measurement and distribution before calculating",
        "paragraphs": [
          "Before calculating, ask what each observation represents, what you want to describe, and whether your data have a meaningful numeric scale. Sample size and distribution shape influence how useful a summary will be.",
          "For a small data set, order the values and examine their spread. A mathematically valid average can be misleading if reported without context."
        ]
      },
      {
        "heading": "Worked example: mean, median, and range",
        "paragraphs": [
          "Consider 2, 2, 3, 4, 9. Their sum is 20, so the mean is 20/5 = 4. The middle of five ordered values is 3, so the median is 3. The range is 9 − 2 = 7.",
          "Replace the 9 with a 4: the values become 2, 2, 3, 4, 4. The mean is 15/5 = 3, the median remains 3, and the range falls to 2. This makes the influence of the large observation visible."
        ]
      },
      {
        "heading": "Explain how an extreme value changes the summary",
        "paragraphs": [
          "There is no contradiction between mean 4 and median 3 in the original data. The two statistics answer different questions, and the observation 9 pulls the mean upward.",
          "A median can be less sensitive to an extreme observation, but that does not mean it should always replace the mean. Choose based on the task and properties of the data."
        ]
      },
      {
        "heading": "Match statistical methods to the question",
        "paragraphs": [
          "If the problem asks about a proportion, an arithmetic mean and median of unrelated values may not be appropriate. If it asks about association, choose a method suited to the variables and check its assumptions.",
          "Practice explaining what each statistic measures, the units involved, and the conclusions you cannot justify. Correlation in observational data is not proof of causation."
        ]
      }
    ],
    "exercise": {
      "title": "Worked calculation: two datasets and three summaries",
      "context": "Compare A = [2, 2, 3, 4, 9] with B = [2, 2, 3, 4, 4]. Find each mean, median, and range.",
      "steps": [
        "A: sum = 20; mean = 20/5 = 4. Middle value = 3; median = 3. Range = 9−2 = 7.",
        "B: sum = 15; mean = 15/5 = 3. Middle value = 3; median = 3. Range = 4−2 = 2.",
        "Explain why the mean changes by one while the median remains unchanged.",
        "Decide which summary best conveys the presence of a high observation and justify your choice for a stated audience."
      ],
      "check": "The mean accounts for all values, the median is positional, and the range uses the endpoints. Five fictional values do not justify population-level conclusions."
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
