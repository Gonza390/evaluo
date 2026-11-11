import type { StudyBlogArticle } from './study-blog-articles';

export const NOV11_ES_BLOG: StudyBlogArticle[] = [
  {
    "key": "cumulative-final-nov11",
    "slug": "como-estudiar-para-un-final-acumulativo",
    "title": "Final acumulativo: cómo repasar un cuatrimestre sin releer todo",
    "seoTitle": "Cómo estudiar para un final acumulativo: plan y ejercicio",
    "description": "Prepará un final acumulativo con un mapa de dependencias, diez días de práctica mixta y un ejercicio resuelto de probabilidad condicional.",
    "category": "Preparar exámenes",
    "lead": "Un final acumulativo evalúa relaciones entre unidades, no solamente el último tema. Para prepararlo, conviene identificar conocimientos previos indispensables, diagnosticar errores de parciales y practicar mezclando contenidos. El alcance y la ponderación exactos dependen de tu cátedra.",
    "takeaway": "Organizá el repaso por dependencias y errores, no por el orden de las páginas: intentá resolver antes de consultar apuntes.",
    "sections": [
      {
        "heading": "Confirmá el alcance y las condiciones del final",
        "paragraphs": [
          "Revisá programa, consignas de exámenes anteriores y criterios oficiales. Marcá qué unidades entran, cuáles tienen mayor peso y qué tipos de ejercicios exigen justificar procedimientos. No supongas que todas las unidades pesan igual.",
          "Armá una tabla con tema, prerrequisitos, evidencia de dominio y último error. Por ejemplo, probabilidad condicional requiere comprender primero frecuencias, eventos y denominadores. Un error en esas bases perjudica varias unidades posteriores."
        ]
      },
      {
        "heading": "Diagnosticá por tema con preguntas, no con sensaciones",
        "paragraphs": [
          "Elegí dos o tres preguntas de cada unidad y respondé sin mirar. Clasificá cada fallo: concepto, selección de procedimiento, cálculo, interpretación o falta de tiempo. Un tema que te resulta familiar al releerlo puede no estar disponible cuando tenés que resolver solo.",
          "Priorizá primero las unidades fundamentales con errores repetidos. Mezclá luego problemas de unidades distintas para practicar la elección de método: no conviene que el título del capítulo te revele qué fórmula aplicar."
        ]
      },
      {
        "heading": "Ejercicio integrador: probabilidad condicional y tasas base",
        "paragraphs": [
          "En un diagnóstico ficticio participaron 1.000 estudiantes: 200 cursaron un módulo avanzado A y 800 no. Aprobaron 160 de A y 320 de quienes no cursaron A. Si elegimos al azar una persona que aprobó, ¿qué probabilidad hay de que haya cursado A?",
          "Construí una tabla: A y aprobado 160, A y no aprobado 40; no A y aprobado 320, no A y no aprobado 480. Hay 480 aprobados en total. La probabilidad buscada es P(A | aprobado)=160/480=1/3≈33,33%. En cambio P(aprobado | A)=160/200=80%. Invertir el orden de la condición cambia el denominador y la pregunta."
        ]
      },
      {
        "heading": "Plan de diez días con práctica mixta",
        "paragraphs": [
          "Días 1 y 2: inventario y diagnóstico; días 3 y 4: prerrequisitos débiles; días 5 y 6: ejercicios mezclados de unidades conectadas; día 7: simulacro con el tiempo real; día 8: corrección argumentada; día 9: segunda práctica sobre errores; día 10: repaso breve y descanso. Adaptá el reparto a tus horas disponibles.",
          "No conviertas el calendario en una garantía de aprobar. Si solo disponés de tres días, mantené el orden diagnóstico→práctica→corrección, pero reducí alcance según el programa y las prioridades reales."
        ]
      },
      {
        "heading": "Cómo pasar del material al repaso activo",
        "paragraphs": [
          "Podés subir tus PDF o DOCX a Evaluo para comprender conceptos, practicar por temas y revisar errores. Elegí el archivo antes de registrarte cuando uses la landing que ofrece ese flujo; después seguí los pasos que muestre la plataforma.",
          "El ejercicio numérico de esta guía se resuelve y comprueba manualmente: Evaluo no promete calcular automáticamente probabilidades ni reproducir el examen exacto de tu docente. Para una preparación general, también consultá /blog/como-estudiar-para-un-examen-final."
        ]
      }
    ],
    "exercise": {
      "title": "Autocontrol: invertí la condición",
      "context": "En el grupo de 1.000 estudiantes, 200 cursaron A; 160 de ellos aprobaron. Otros 320 aprobaron sin cursar A. Calculá P(aprobado | A) y comparala con P(A | aprobado).",
      "steps": [
        "Aprobados totales: 160+320=480.",
        "P(A | aprobado)=160/480=0,3333, es decir 33,33%.",
        "P(aprobado | A)=160/200=0,8, es decir 80%.",
        "El denominador es siempre el total del grupo que aparece después de la barra vertical.",
        "Variante: si 240 estudiantes sin A aprobaran, el total aprobado sería 400 y P(A | aprobado)=160/400=40%; P(aprobado | A) seguiría en 80%."
      ],
      "check": "Si escribiste 80% para la primera pregunta, confundiste las probabilidades inversas. Revisá qué conjunto condiciona la selección antes de dividir."
    },
    "mistakes": [
      {
        "title": "Releer todo en el mismo orden",
        "why": "Puede ocultar dependencias y dejar sin práctica los temas que más fallan."
      },
      {
        "title": "Confundir P(A|B) con P(B|A)",
        "why": "El evento después de la barra determina el denominador: 480 frente a 200."
      },
      {
        "title": "Hacer solo ejercicios de un capítulo",
        "why": "No practica elegir la estrategia cuando aparecen unidades mezcladas."
      }
    ],
    "faq": [
      {
        "question": "¿Cuántos días necesito para un final acumulativo?",
        "answer": "Depende del programa, las horas disponibles y tu diagnóstico. Diez días es un ejemplo adaptable, no una duración universal."
      },
      {
        "question": "¿Evaluo resuelve el ejercicio de Bayes automáticamente?",
        "answer": "No se promete un solucionador numérico. Usá tus materiales para comprender y practicar; verificá los cálculos con el curso."
      }
    ],
    "sources": [
      {
        "title": "OpenStax — Introductory Statistics",
        "url": "https://openstax.org/details/books/introductory-statistics"
      },
      {
        "title": "Roediger y Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "case-based-nov11",
    "slug": "como-estudiar-para-examenes-con-casos-practicos",
    "title": "Exámenes con casos prácticos: método y ejercicio resuelto",
    "seoTitle": "Cómo estudiar casos prácticos para un examen universitario",
    "description": "Aprendé a resolver casos prácticos con hechos, teoría, aplicación y conclusión. Incluye un caso de economía, respuesta modelo y rúbrica.",
    "category": "Preparar exámenes",
    "lead": "Un examen con casos prácticos exige elegir una teoría y justificar cómo se aplica a hechos nuevos. Esta guía propone un método para separar información comprobada de suposiciones, resolver un caso de economía y evaluar tu respuesta sin inventar una corrección automática.",
    "takeaway": "Antes de calcular, identificá la decisión, las alternativas disponibles y el concepto que realmente corresponde.",
    "sections": [
      {
        "heading": "Leé el caso en dos pasadas",
        "paragraphs": [
          "Primero subrayá hechos explícitos: recursos, restricciones, alternativas y objetivo. En la segunda pasada separá lo que se pregunta de lo que no está dado. No supongas preferencias, costes monetarios o consecuencias que el caso no proporciona.",
          "Redactá una frase con la cuestión central. Después elegí el principio teórico y explicá por qué aplica. En un caso jurídico puede ser una norma; en economía, un coste de oportunidad; en biología, un mecanismo causal."
        ]
      },
      {
        "heading": "Usá cinco partes para justificar una respuesta",
        "paragraphs": [
          "Estructura recomendada: hechos relevantes, pregunta, regla o concepto, aplicación concreta y conclusión con límites. No alcanza con nombrar una fórmula: mostrale al corrector qué datos seleccionaste y por qué.",
          "Contrastá una respuesta débil («la opción A es mejor porque atiende más estudiantes») con una completa («A atiende más sesiones, pero sacrifica la alternativa B; sin conocer la prioridad institucional no puede concluirse cuál produce mayor bienestar»)."
        ]
      },
      {
        "heading": "Caso resuelto: capacidad de tutorías y coste de oportunidad",
        "paragraphs": [
          "Un centro universitario dispone de un bloque indivisible de 6 horas. Opción A: atender 12 sesiones individuales de matemáticas, 2 por hora. Opción B: atender 9 sesiones individuales de química, 1,5 por hora. Las alternativas son mutuamente excluyentes y las tasas se suponen constantes. Si el centro elige A, ¿qué sacrifica?",
          "El coste de oportunidad es la mejor alternativa no elegida: 9 sesiones de química. No es 12−9=3, porque esa resta mezcla resultados de servicios distintos y no representa la alternativa sacrificada. Elegir A entrega 12 sesiones de matemáticas, pero no demuestra por sí solo que sea socialmente preferible. La decisión depende del valor asignado a cada servicio."
        ]
      },
      {
        "heading": "Rúbrica manual y variante",
        "paragraphs": [
          "Evaluá tu respuesta con cuatro criterios: (1) identificar alternativas excluyentes, (2) indicar qué se sacrifica y sus unidades, (3) justificar el concepto, (4) reconocer límites de la decisión. Un punto por criterio es solo una herramienta de autoevaluación, no una nota oficial.",
          "Variante: 4 horas, A ofrece 2 sesiones/hora y B 1,5 sesiones/hora. A produce 8 sesiones de matemáticas; B produce 6 de química. Si se elige A, el coste de oportunidad es 6 sesiones de química. No se resta 8−6 para hallar el coste."
        ]
      },
      {
        "heading": "Practicá transferir el método a otro caso",
        "paragraphs": [
          "Cambiá una condición por vez: objetivo, restricción de tiempo o alternativa disponible. Volvé a responder sin consultar y clasificá errores de interpretación, concepto, unidades o justificación.",
          "En Evaluo podés subir el material de tu materia, comprenderlo y practicar por temas. El análisis del caso y la rúbrica aquí se realizan manualmente: no se promete que la plataforma corrija respuestas abiertas o resuelva decisiones económicas paso a paso."
        ]
      }
    ],
    "exercise": {
      "title": "Caso de autocorrección: cuatro horas disponibles",
      "context": "A permite 2 sesiones de matemáticas por hora y B 1,5 de química. El bloque es de cuatro horas y solo puede elegirse una alternativa.",
      "steps": [
        "Opción A: 4×2=8 sesiones de matemáticas.",
        "Opción B: 4×1,5=6 sesiones de química.",
        "Si se elige A, la mejor alternativa sacrificada es B: coste de oportunidad = 6 sesiones de química.",
        "Una decisión sobre qué opción conviene exige conocer objetivos, demanda y valor relativo; los conteos solos no bastan."
      ],
      "check": "No respondas 2 sesiones como coste: 8−6 compara servicios diferentes. Expresá siempre qué alternativa se sacrifica y en qué unidades."
    },
    "mistakes": [
      {
        "title": "Restar producciones heterogéneas",
        "why": "La diferencia 12−9 no mide el valor de la mejor alternativa sacrificada."
      },
      {
        "title": "Inventar preferencias institucionales",
        "why": "Más sesiones no implica automáticamente más bienestar ni mayor prioridad."
      },
      {
        "title": "Dar solo la conclusión",
        "why": "Sin hechos, concepto y aplicación, una respuesta puede ser correcta por casualidad y difícil de evaluar."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo practicar casos sin tener un solucionario?",
        "answer": "Construí una rúbrica basada en los criterios del programa, explicitá supuestos y contrastá cada paso con bibliografía fiable."
      },
      {
        "question": "¿Evaluo corrige automáticamente mi respuesta abierta?",
        "answer": "No se promete una corrección automática de ensayos o casos. La rúbrica de esta guía es manual."
      }
    ],
    "sources": [
      {
        "title": "OpenStax — Production possibilities frontier and social choices",
        "url": "https://openstax.org/books/principles-economics-3e/pages/2-2-the-production-possibilities-frontier-and-social-choices"
      },
      {
        "title": "OpenStax — How individuals make choices",
        "url": "https://openstax.org/books/principles-economics-3e/pages/2-1-how-individuals-make-choices-based-on-their-budget-constraint"
      },
      {
        "title": "Roediger y Karpicke (2006), retrieval practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      }
    ]
  }
];

export const NOV11_EN_BLOG: StudyBlogArticle[] = [
  {
    "key": "cumulative-final-nov11",
    "slug": "how-to-study-for-a-cumulative-final-exam",
    "title": "How to prepare for a cumulative final without rereading the semester",
    "seoTitle": "How to Study for a Cumulative Final: Mixed Practice Plan",
    "description": "Build a 10-day cumulative final study plan, diagnose gaps across units, and solve a conditional-probability example with answers.",
    "category": "Exam preparation",
    "lead": "A cumulative final often connects ideas taught weeks apart. Rather than rereading an entire semester, identify prerequisites, test your recall across units and review the reasons behind missed questions. Always confirm the scope and weighting with your instructor.",
    "takeaway": "Prioritize prerequisite gaps, mix topics and explain mistakes before repeating a question.",
    "sections": [
      {
        "heading": "Find out what the final actually covers",
        "paragraphs": [
          "Check the syllabus, exam format, permitted materials and whether earlier units receive different weights. Cumulative does not necessarily mean equal emphasis on every chapter.",
          "Create a dependency map: descriptive counts support probability, which supports conditional probability and Bayes. If the foundation is weak, later formulas will feel harder than they are."
        ]
      },
      {
        "heading": "Run a short diagnostic before making a calendar",
        "paragraphs": [
          "Attempt two unseen questions from each unit without notes. Record whether a miss came from recalling a definition, selecting the wrong method, arithmetic, interpreting a result or running out of time.",
          "Use the errors to prioritize, then interleave questions from different units. Mixed sets require you to choose a method instead of being told by a chapter heading which formula to use."
        ]
      },
      {
        "heading": "Worked statistics example: conditional probability",
        "paragraphs": [
          "A hypothetical course has 1,000 students. Of those, 200 took an advanced module (A) and 800 did not. A diagnostic was passed by 160 students who took A and 320 who did not. Among students who passed, what proportion took A?",
          "Total passes = 160+320=480. Thus P(A | passed)=160/480=1/3≈33.33%. By contrast, P(passed | A)=160/200=80%. The two questions use different reference groups. A useful frequency table includes 40 failures among A and 480 failures among non-A."
        ]
      },
      {
        "heading": "A flexible ten-day mixed-practice schedule",
        "paragraphs": [
          "Days 1–2: inventory and diagnostic. Days 3–4: repair prerequisite gaps. Days 5–6: mixed practice. Day 7: timed mock. Day 8: annotate errors. Day 9: retry the weakest ideas with changed numbers. Day 10: brief retrieval and rest.",
          "Adapt this sequence to your real calendar. The plan is an example, not evidence that ten days is sufficient for every course."
        ]
      },
      {
        "heading": "Use your own course materials with Evaluo",
        "paragraphs": [
          "Upload your PDF or DOCX to review concepts and practice by topic. The English upload landing lets you choose a file before continuing through the account flow when that feature is available.",
          "Use the worked numerical example here as a manual exercise: Evaluo does not claim to calculate Bayes problems automatically or predict your instructor's exact final."
        ]
      }
    ],
    "exercise": {
      "title": "Check the direction of the condition",
      "context": "Of 1,000 students, 200 took module A; 160 of them passed. Another 320 students passed without taking A. Compare P(A | passed) and P(passed | A).",
      "steps": [
        "Count all students who passed: 160+320=480.",
        "P(A | passed)=160/480≈33.33%.",
        "P(passed | A)=160/200=80%.",
        "The event after the vertical bar determines the denominator.",
        "If only 240 students outside A passed, P(A | passed)=160/(160+240)=40%, while P(passed | A) remains 80%."
      ],
      "check": "An answer of 80% to the first question reverses the conditional. Name the reference population before dividing."
    },
    "mistakes": [
      {
        "title": "Rereading every chapter in order",
        "why": "It can hide gaps in prerequisite knowledge and leave little time for application."
      },
      {
        "title": "Reversing conditional probabilities",
        "why": "P(A | passed) and P(passed | A) have different denominators."
      },
      {
        "title": "Practicing only one topic at a time",
        "why": "A cumulative exam often requires selecting among methods from different units."
      }
    ],
    "faq": [
      {
        "question": "How long should I study for a cumulative final?",
        "answer": "That depends on your course scope, diagnostic results and available time. The ten-day plan is adjustable."
      },
      {
        "question": "Will Evaluo solve the Bayes calculation for me?",
        "answer": "No automatic numerical solver is promised. Use your own notes to study concepts and practice, then check calculations manually."
      }
    ],
    "sources": [
      {
        "title": "OpenStax — Introductory Statistics",
        "url": "https://openstax.org/details/books/introductory-statistics"
      },
      {
        "title": "Roediger y Karpicke (2006), test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006), distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "case-based-nov11",
    "slug": "how-to-study-for-case-based-exams",
    "title": "Case-based exams: apply theory to unfamiliar scenarios",
    "seoTitle": "How to Study for Case-Based Exams: Worked Example",
    "description": "Prepare for case-based exams using a five-part answer structure, a worked opportunity-cost scenario and a self-check rubric.",
    "category": "Exam preparation",
    "lead": "Case-based assessments test whether you can select and apply concepts when the question looks different from your notes. The method below separates given facts from assumptions, works through an economics case and shows how to assess your reasoning manually.",
    "takeaway": "Identify the decision and its constraints before selecting a theory or formula.",
    "sections": [
      {
        "heading": "Read for facts before looking for formulas",
        "paragraphs": [
          "On the first pass, underline the resources, constraints, alternatives and requested decision. On the second, separate facts from assumptions. Do not invent monetary costs or institutional priorities that the prompt never gives.",
          "State the core question in one sentence. Only then choose the applicable concept, such as opportunity cost in economics or a mechanism in biology."
        ]
      },
      {
        "heading": "Use a five-part answer",
        "paragraphs": [
          "A robust response has five parts: relevant facts, issue, rule or concept, application and qualified conclusion. This makes it easier to distinguish understanding from a lucky answer.",
          "Weak answer: 'Choose A because it serves more students.' Stronger answer: 'A produces more math sessions but gives up nine chemistry sessions; without a stated priority, the count alone does not establish the better social outcome.'"
        ]
      },
      {
        "heading": "Worked economics case: opportunity cost",
        "paragraphs": [
          "A university tutoring center has one indivisible six-hour block. Option A provides 12 individual math tutoring sessions (two per hour). Option B provides nine chemistry sessions (1.5 per hour). Both are mutually exclusive, with constant productivity assumed. If the center chooses A, what is the opportunity cost?",
          "The best forgone alternative is B: nine chemistry sessions. Subtracting 12−9=3 mixes outputs of different services and does not measure what was sacrificed. Choosing A may serve more sessions, but welfare depends on priorities and relative value not specified here."
        ]
      },
      {
        "heading": "Score your reasoning with a manual rubric",
        "paragraphs": [
          "Check four criteria: did you identify mutually exclusive choices, name the forgone alternative with units, justify the economic concept, and state the limits of the conclusion? One point per criterion is a study aid, not an instructor-issued grade.",
          "Try a variation: four hours, A at two math sessions per hour and B at 1.5 chemistry sessions per hour. Outputs are eight and six respectively; choosing A gives up six chemistry sessions, not two."
        ]
      },
      {
        "heading": "Practice transfer using your course material",
        "paragraphs": [
          "Change one assumption at a time and answer without notes. Classify errors as interpretation, theory selection, units or justification. This is more useful than memorizing a single model response.",
          "You can upload a PDF or DOCX to Evaluo to review concepts and practice by topic. This guide's open-ended rubric is manual: it does not promise automated essay scoring or step-by-step numerical case solving."
        ]
      }
    ],
    "exercise": {
      "title": "Practice case: a four-hour tutoring block",
      "context": "A offers two math sessions per hour; B offers 1.5 chemistry sessions per hour. The center has four hours and can choose only one.",
      "steps": [
        "A produces 4×2=8 math sessions.",
        "B produces 4×1.5=6 chemistry sessions.",
        "If A is chosen, the opportunity cost is six forgone chemistry sessions.",
        "Determining which choice is preferable requires information about institutional priorities and relative value."
      ],
      "check": "The difference 8−6=2 is not the opportunity cost. State the forgone alternative and its units."
    },
    "mistakes": [
      {
        "title": "Subtracting unlike outputs",
        "why": "The difference between math and chemistry sessions is not the value of the best forgone alternative."
      },
      {
        "title": "Assuming more sessions always means better",
        "why": "Relative value and institutional objectives are not supplied in the case."
      },
      {
        "title": "Giving a conclusion without reasoning",
        "why": "Explain the relevant facts, principle, application and limits."
      }
    ],
    "faq": [
      {
        "question": "How do I practice without an official answer key?",
        "answer": "Use a course-aligned rubric, state assumptions and verify each step against reliable readings."
      },
      {
        "question": "Does Evaluo automatically grade my case response?",
        "answer": "No automatic free-text grading is promised. The rubric here is for manual self-assessment."
      }
    ],
    "sources": [
      {
        "title": "OpenStax — Production possibilities frontier and social choices",
        "url": "https://openstax.org/books/principles-economics-3e/pages/2-2-the-production-possibilities-frontier-and-social-choices"
      },
      {
        "title": "OpenStax — How individuals make choices",
        "url": "https://openstax.org/books/principles-economics-3e/pages/2-1-how-individuals-make-choices-based-on-their-budget-constraint"
      },
      {
        "title": "Roediger y Karpicke (2006), retrieval practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      }
    ]
  }
];
