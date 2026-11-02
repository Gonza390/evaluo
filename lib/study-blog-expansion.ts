import type { StudyBlogArticle } from './study-blog-articles';
// Editorially developed original articles. The English versions use distinct text and examples.
export const EXPANDED_ES_BLOG: StudyBlogArticle[] = [
  {
    "key": "biology",
    "slug": "como-estudiar-biologia",
    "title": "Cómo estudiar biología: procesos, esquemas y ejercicios",
    "seoTitle": "Cómo estudiar biología para un examen: método y práctica",
    "description": "Guía para estudiar biología universitaria: procesos celulares, dibujos, preguntas de aplicación, un ejercicio resuelto y un plan de repaso.",
    "category": "Estudiar por materia",
    "lead": "Estudiar biología no consiste solamente en recordar nombres de partes de una célula. En un parcial pueden pedirte que relaciones estructuras, expliques procesos o predigas qué cambia cuando falta un componente. Para prepararte, combiná una representación visual del tema con explicaciones en voz alta y ejercicios sin consultar los apuntes.",
    "takeaway": "Para cada proceso, identificá dónde ocurre, qué entra, qué cambia, qué sale y qué evidencia del material respalda tu respuesta.",
    "sections": [
      {
        "heading": "1. Leé el programa y organizá el temario por procesos",
        "paragraphs": [
          "Revisá qué unidades entran en el examen. Separá temas de estructura (por ejemplo, orgánulos), mecanismos (como transporte de membrana) y relaciones entre sistemas (como homeostasis). No todos requieren la misma técnica: una tabla puede servir para comparar partes; un diagrama de flujo es mejor para reconstruir etapas.",
          "Armá una ficha por proceso con cinco campos: punto de partida, lugar donde ocurre, secuencia de pasos, resultado y condiciones necesarias. Si la cátedra exige nombres de enzimas o detalles moleculares, incorporalos desde la bibliografía en lugar de inventarlos con un resumen automático."
        ]
      },
      {
        "heading": "2. Dibujá relaciones en lugar de copiar esquemas",
        "paragraphs": [
          "Elegí un gráfico de tu PDF y ocultá las etiquetas. Reconstruí el recorrido de una molécula o el orden de un mecanismo y después compará tu dibujo con la fuente. El objetivo no es producir una ilustración estética, sino comprobar si entendés las conexiones.",
          "Si estudiás respiración celular en una célula eucariota, distinguí la glucólisis en el citosol del ciclo del ácido cítrico en la matriz mitocondrial y de la fosforilación oxidativa en la membrana interna mitocondrial. No simplifiques diciendo que todo el ATP se fabrica dentro de la mitocondria: la glucólisis también produce ATP."
        ]
      },
      {
        "heading": "3. Pasá de definiciones a preguntas de aplicación",
        "paragraphs": [
          "Después de leer un apartado, cerrá el material y respondé una pregunta de recuperación, una de comparación y una de aplicación. Por ejemplo: ¿qué es la difusión facilitada?, ¿en qué se diferencia de la difusión simple?, ¿qué esperás que ocurra si una proteína transportadora deja de funcionar?",
          "Intentá justificar por qué una alternativa sería incorrecta; esa explicación revela confusiones que un simple verdadero/falso podría ocultar. Si no podés justificar, volvé al apartado específico del material y reformulá la pregunta con un caso distinto."
        ]
      },
      {
        "heading": "4. Distribuí el repaso según tus errores",
        "paragraphs": [
          "Hacé una primera práctica breve el mismo día, otra tras un intervalo y una tercera mezclando preguntas de unidades anteriores. Usá el intervalo como orientación, no como una regla rígida: cuanto más difícil el tema y más cercano el examen, más conviene revisar el nivel real de dominio.",
          "Registrá fallos por categoría: vocabulario, ubicación, secuencia, causa-efecto o lectura del enunciado. Corregí primero el concepto que originó el error y después repetí una actividad diferente. Releer cinco veces una definición correcta no sustituye la comprobación activa."
        ]
      },
      {
        "heading": "5. Ajustá el método al tipo de examen",
        "paragraphs": [
          "Si el examen usa figuras, practicá identificar estructuras sin etiquetas. Si exige desarrollo, escribí explicaciones de cuatro a seis frases con términos correctos. Si tiene opción múltiple, trabajá distractores plausibles: una respuesta puede ser verdadera en general y aun así no contestar lo que pregunta el enunciado.",
          "Dejá una sesión para preguntas mezcladas de todos los temas; resolver siempre una unidad por vez puede producir una falsa sensación de dominio. Usá tus apuntes como fuente de verificación cuando el contenido involucre valores, rutas metabólicas, fórmulas o excepciones."
        ]
      }
    ],
    "exercise": {
      "title": "Ejercicio resuelto: ¿dónde se produce ATP?",
      "context": "Imaginá que el parcial pide explicar la relación entre glucólisis, mitocondria y ATP en una célula eucariota típica. Es un ejemplo introductorio, sin pretender cubrir toda la bioenergética.",
      "steps": [
        "Escribí sin mirar: la glucólisis ocurre en el citosol; el ciclo del ácido cítrico ocurre en la matriz mitocondrial; la fosforilación oxidativa ocurre en la membrana interna mitocondrial.",
        "Marcá qué afirmación sería errónea: «todo el ATP celular se produce en la mitocondria». Explicá que la glucólisis también aporta ATP.",
        "Planteá una pregunta nueva: ¿por qué una proteína de la membrana interna mitocondrial podría afectar la fosforilación oxidativa? Contestá según lo estudiado en tu curso.",
        "Volvé al PDF, verificá ubicaciones y condiciones y anotá una duda específica para tu siguiente sesión."
      ],
      "check": "Autocontrol: si podés ubicar las etapas y justificar por qué no toda la producción de ATP ocurre en la mitocondria, comprendiste la distinción básica. No atribuyas a este ejemplo un rendimiento universal fijo de ATP."
    },
    "mistakes": [
      {
        "title": "Memorizar etiquetas sin entender funciones",
        "why": "Reconocer «mitocondria» en un diagrama no asegura que puedas explicar su papel en la respiración celular."
      },
      {
        "title": "Releer en lugar de recordar",
        "why": "Que una explicación resulte familiar al verla no prueba que puedas reconstruirla sin ayuda."
      },
      {
        "title": "Confundir una generalización con una regla absoluta",
        "why": "Afirmaciones como «todo el ATP se produce en la mitocondria» ignoran etapas y contextos del metabolismo."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo estudiar biología cuando tengo muchos capítulos?",
        "answer": "Agrupá las unidades por mecanismos y conceptos conectados, priorizá lo que exige el programa y dedicá parte de cada sesión a responder preguntas antiguas sin consultar material."
      },
      {
        "question": "¿Sirven las flashcards para biología?",
        "answer": "Son útiles para terminología, funciones y distinciones. Para procesos complejos, combinalas con diagramas reconstruidos y problemas de aplicación."
      },
      {
        "question": "¿Cómo sé si realmente comprendí el tema?",
        "answer": "Explicá un proceso sin mirar, resolvé una situación diferente a la del apunte y justificá qué dato del material respalda tu respuesta."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006) · Test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006) · Distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "marketing",
    "slug": "como-estudiar-marketing",
    "title": "Cómo estudiar marketing: de los conceptos a las decisiones",
    "seoTitle": "Cómo estudiar marketing para un parcial: casos y ejercicios",
    "description": "Método para estudiar marketing con casos de segmentación, posicionamiento, marketing mix y métricas, más un ejercicio guiado.",
    "category": "Estudiar por materia",
    "lead": "Marketing suele parecer una materia de definiciones: segmentación, posicionamiento, precio, canales o conversión. Sin embargo, un examen con casos exige elegir criterios y justificar decisiones. Aprender una lista de modelos no alcanza si no podés aplicarlos a una situación con restricciones reales.",
    "takeaway": "Estudiá cada concepto junto a la pregunta que ayuda a resolver, la información que exige y un ejemplo donde cambiaría la decisión.",
    "sections": [
      {
        "heading": "1. Convertí cada concepto en una pregunta de negocio",
        "paragraphs": [
          "Separá términos que suelen confundirse. Segmentar es identificar grupos con características o necesidades relevantes; elegir un segmento objetivo implica decidir a cuáles atender; posicionar es construir una propuesta y una percepción diferenciadas. No son tres nombres para la misma tarea.",
          "Armá una tabla con concepto, decisión, datos necesarios e indicador. Por ejemplo, para seleccionar un segmento necesitás información sobre necesidades, tamaño, accesibilidad y encaje; para evaluar una campaña necesitás saber qué acción concreta intentaba conseguir."
        ]
      },
      {
        "heading": "2. Practicá con un caso y cambiá las condiciones",
        "paragraphs": [
          "Imaginá una app para estudiantes que convierte apuntes en preguntas. Tiene presupuesto reducido y quiere conseguir usuarios que completen su primera práctica. Definí un público concreto, su necesidad principal y dos canales posibles; después justificá uno con argumentos, no con frases genéricas como «usar redes sociales».",
          "Modificá una variable: ahora el público son profesionales que preparan una certificación. ¿Cambian la promesa, el contenido, el horario de consumo o la métrica de activación? Si respondés exactamente lo mismo, probablemente aprendiste una plantilla en lugar de comprender la lógica."
        ]
      },
      {
        "heading": "3. Separá métricas del embudo de conversión",
        "paragraphs": [
          "Impresiones, clics, registros, activaciones y compras describen etapas diferentes. Una campaña con muchas visualizaciones puede aportar pocos estudiantes activos, mientras que una fuente de menor volumen puede atraer personas con una necesidad inmediata.",
          "Cuando analices un caso, escribí primero el objetivo y después la métrica. Si el objetivo es que una persona estudie con su primer PDF, medir solamente clics no demuestra éxito. Considerá también los límites del dato: atribución, calidad de las fuentes y período de observación."
        ]
      },
      {
        "heading": "4. Combiná memoria de modelos con análisis",
        "paragraphs": [
          "Las flashcards funcionan para recuperar conceptos: propuesta de valor, CAC, segmentación, marketing mix o customer journey. Pero después de cada bloque hacé una pregunta de caso. Elegí qué modelo es pertinente y explicá por qué otro no lo sería.",
          "Una vez por semana, mezclá preguntas de producto, precio, distribución, comunicación y medición. Esto entrena a reconocer qué herramienta corresponde a cada situación sin que el título del capítulo te dé la respuesta."
        ]
      },
      {
        "heading": "5. Prepará respuestas claras para un parcial",
        "paragraphs": [
          "Usá una estructura breve: problema, información disponible, criterio de decisión, propuesta y medida de éxito. Señalá supuestos cuando falten datos; un caso no admite una única estrategia correcta sin contexto.",
          "Al corregir, separá errores de definición, diagnóstico y recomendación. La pregunta relevante no es solo «¿qué alternativa era correcta?», sino «¿qué dato del caso tendría que haber considerado para llegar a ella?»."
        ]
      }
    ],
    "exercise": {
      "title": "Caso guiado: campaña de una app educativa",
      "context": "Una plataforma tiene 500 visitas a una landing, 40 registros y 8 usuarios que completan una práctica. Quiere mejorar activación, no solamente visitas.",
      "steps": [
        "Identificá el evento que representa el objetivo: completar la primera práctica.",
        "Calculá la conversión de visita a registro: 40/500 = 8 %. Calculá la proporción de registros que completaron una práctica: 8/40 = 20 %.",
        "Proponé una hipótesis concreta para mejorar la segunda conversión, por ejemplo reducir pasos entre seleccionar el material y comenzar la primera práctica.",
        "Decidí qué medirías en un experimento: tasa de primera práctica completada, abandonos por paso y calidad de la experiencia; evitá declarar éxito por clics solamente."
      ],
      "check": "El 8 % y el 20 % corresponden a denominadores diferentes. Si los confundís, podrías recomendar aumentar tráfico cuando el problema principal está después del registro."
    },
    "mistakes": [
      {
        "title": "Confundir segmentación y posicionamiento",
        "why": "La segmentación define grupos; el posicionamiento describe la propuesta diferencial que una oferta busca ocupar para un público."
      },
      {
        "title": "Elegir un canal por moda",
        "why": "Un canal debe justificarse por audiencia, objetivo, recursos disponibles y capacidad de medir resultados."
      },
      {
        "title": "Usar métricas sin denominador",
        "why": "Una tasa de clics y una tasa de activación miden acciones diferentes y no son comparables sin contexto."
      }
    ],
    "faq": [
      {
        "question": "¿Cómo estudiar marketing para un examen con casos?",
        "answer": "Practicá identificar el problema del caso, elegir un modelo, justificar una recomendación y explicar qué dato permitiría comprobarla."
      },
      {
        "question": "¿Es suficiente memorizar las 4P?",
        "answer": "No para resolver casos. Relacioná producto, precio, distribución y comunicación con el segmento, la propuesta de valor y las restricciones."
      },
      {
        "question": "¿Qué ejercicios son útiles para marketing digital?",
        "answer": "Analizar embudos con números simples, formular hipótesis de experimentación y distinguir métricas de alcance, conversión y retención."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006) · Test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006) · Distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  }
];
export const EXPANDED_EN_BLOG: StudyBlogArticle[] = [
  {
    "key": "biology",
    "slug": "how-to-study-biology",
    "title": "How to Study Biology: Processes, Diagrams, and Practice",
    "seoTitle": "How to Study Biology for Exams: A Practical Method",
    "description": "A practical university biology study guide using process maps, explanation exercises, retrieval questions, and a worked cellular respiration example.",
    "category": "Study by subject",
    "lead": "Biology exams often ask more than whether you remember an organelle's name. You may need to connect structures with functions, explain a sequence, or predict the consequences of changing one condition. Studying effectively means moving between diagrams, spoken explanations, and questions you answer without the notes in front of you.",
    "takeaway": "For each biological process, identify its location, inputs, steps, outputs, and the evidence in your course materials that supports your explanation.",
    "sections": [
      {
        "heading": "1. Sort your syllabus by what you need to do",
        "paragraphs": [
          "Review your course objectives and distinguish identification tasks from mechanism questions and application problems. Labeling cell structures calls for different practice than explaining membrane transport or interpreting an experiment.",
          "Build a one-page process card with the starting conditions, location, key stages, outcome, and possible points of failure. Use the level of technical detail required by your lecturer rather than importing unexplained facts from another syllabus."
        ]
      },
      {
        "heading": "2. Reconstruct diagrams without labels",
        "paragraphs": [
          "Choose a diagram from your textbook, cover the labels, and redraw the relationships. Explain what each arrow represents and what would change if a component were missing. Then compare your drawing with the original source.",
          "For example, in a typical eukaryotic cell, glycolysis takes place in the cytosol, the citric acid cycle takes place in the mitochondrial matrix, and oxidative phosphorylation occurs at the inner mitochondrial membrane. The statement that all cellular ATP comes from mitochondria overlooks ATP made during glycolysis."
        ]
      },
      {
        "heading": "3. Ask three kinds of questions",
        "paragraphs": [
          "After each section, answer a recall question, a comparison question, and an application question. For membrane transport: define facilitated diffusion, contrast it with simple diffusion, and explain what might change when a particular transporter is unavailable.",
          "For multiple-choice questions, do not stop at picking the correct option. Explain why the alternatives are inappropriate in that situation. If you cannot justify your choice, return to the relevant paragraph in your notes and try a different application."
        ]
      },
      {
        "heading": "4. Revisit difficult topics across sessions",
        "paragraphs": [
          "Use short retrieval sessions spread over time rather than a single long rereading session. Include questions from earlier units alongside the current topic. The exact schedule should reflect your exam date and how well you can answer, not an arbitrary calendar rule.",
          "Record the type of error: terminology, location, sequence, cause-and-effect, or reading the question. Fix the underlying confusion and test it with a new question instead of merely memorizing the answer you missed."
        ]
      },
      {
        "heading": "5. Match your practice to the exam format",
        "paragraphs": [
          "For image identification, test yourself on unlabeled figures. For short-answer questions, explain a process in five coherent sentences. For multiple-choice tests, practice rejecting plausible distractors that answer a different question.",
          "Use a final mixed-topic session to avoid relying on chapter headings as prompts. Check equations, scientific exceptions, diagrams, and terminology against the assigned course material."
        ]
      }
    ],
    "exercise": {
      "title": "Worked exercise: where is ATP produced?",
      "context": "An introductory course asks how glycolysis, mitochondria, and ATP production are related in a typical eukaryotic cell.",
      "steps": [
        "Without looking up the answer, place glycolysis in the cytosol, the citric acid cycle in the mitochondrial matrix, and oxidative phosphorylation at the inner mitochondrial membrane.",
        "Evaluate the claim 'all cellular ATP is produced in mitochondria'. Explain why ATP from glycolysis makes that statement inaccurate.",
        "Write a new question about how a protein involved in the inner mitochondrial membrane might affect oxidative phosphorylation.",
        "Check each explanation against your course notes and note one question to revisit tomorrow."
      ],
      "check": "You have understood the basic distinction if you can locate the stages and explain why ATP production is not restricted to mitochondria. The example does not assume a universal ATP yield."
    },
    "mistakes": [
      {
        "title": "Memorizing labels without functions",
        "why": "Recognizing 'mitochondrion' does not show that you understand the role it plays in a metabolic pathway."
      },
      {
        "title": "Mistaking familiarity for knowledge",
        "why": "A diagram looks familiar when the labels are visible; retrieval means reconstructing the relationship without them."
      },
      {
        "title": "Treating simplifications as absolute rules",
        "why": "Biological systems have different stages and conditions. Verify broad statements before using them in an exam."
      }
    ],
    "faq": [
      {
        "question": "How should I study biology when I have many chapters?",
        "answer": "Group the material by connected processes, use your syllabus to set priorities, and reserve some practice time for earlier topics in every study session."
      },
      {
        "question": "Are flashcards good for biology?",
        "answer": "They help with terminology and distinctions. Combine them with blank diagrams, process explanations, and application questions."
      },
      {
        "question": "How can I tell if I understand the topic?",
        "answer": "Explain a process without notes, solve a new problem, and point to the evidence that supports your answer."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006) · Test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006) · Distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  },
  {
    "key": "marketing",
    "slug": "how-to-study-marketing",
    "title": "How to Study Marketing: Concepts, Cases, and Decisions",
    "seoTitle": "How to Study Marketing for Exams: Case-Based Practice",
    "description": "Learn marketing through segmentation, positioning, marketing mix, funnel metrics, and a worked case instead of memorizing definitions.",
    "category": "Study by subject",
    "lead": "Marketing coursework can look like a collection of frameworks: segmentation, targeting, positioning, the marketing mix, or campaign metrics. In a case-based exam, though, you must select a relevant idea and defend a decision using the information available. A list of terms is only the starting point.",
    "takeaway": "Attach each framework to the decision it supports, the evidence it requires, and a case where the recommendation would change.",
    "sections": [
      {
        "heading": "1. Translate each concept into a decision",
        "paragraphs": [
          "Distinguish segmentation (grouping customers by relevant needs or characteristics), targeting (choosing whom to serve), and positioning (developing a meaningful differentiated proposition). These are related choices, not interchangeable terms.",
          "For each concept, make a table with the business question, required evidence, candidate action, and useful metric. For targeting, you might assess needs, reachability, and product fit; for campaign performance, define the behavior the campaign is meant to produce."
        ]
      },
      {
        "heading": "2. Work through a case with constraints",
        "paragraphs": [
          "Imagine a new study app with a limited budget. Its objective is to attract students who complete their first learning activity. Choose one audience, state its problem, and justify two possible acquisition channels. Avoid recommendations such as 'use social media' without specifying the audience and intended action.",
          "Now change the scenario: the audience becomes working professionals preparing for a certification. Explain which parts of the message, distribution, and activation flow would need to change. This tests whether you understand the decision rather than merely repeating an example."
        ]
      },
      {
        "heading": "3. Keep funnel metrics separate",
        "paragraphs": [
          "Impressions, visits, sign-ups, completed first sessions, and purchases represent different actions. A campaign with high reach may still fail to activate learners. State the objective before choosing the numerator and denominator of a conversion rate.",
          "If the purpose is to encourage a first study session, clicks alone are not an adequate success measure. Also consider the observation window, the reliability of the data, and the limitations of attribution."
        ]
      },
      {
        "heading": "4. Combine flashcards with case analysis",
        "paragraphs": [
          "Use flashcards to retrieve clear definitions such as positioning, customer acquisition cost, or activation. Then practice questions that require you to choose a framework and defend your reasoning. Switch between product, pricing, distribution, promotion, and measurement cases.",
          "Interleave older cases with new ones. If the chapter heading always tells you which framework to use, you may not be practicing the most important exam skill: identifying the relevant problem independently."
        ]
      },
      {
        "heading": "5. Write exam answers with explicit assumptions",
        "paragraphs": [
          "Structure a response as problem, available evidence, choice, justification, and measurement. If the case omits the budget or target market, say what you are assuming. Several recommendations may be defensible, but unsupported certainty is not.",
          "When reviewing an incorrect answer, ask whether your misunderstanding concerned the model, the diagnosis, or the recommendation. Identify which case detail you failed to use and answer a different variation."
        ]
      }
    ],
    "exercise": {
      "title": "Worked case: improving first-study activation",
      "context": "An educational app receives 500 landing-page visits, 40 registrations, and 8 users who complete their first study activity. The team wants to improve activation.",
      "steps": [
        "Identify the target event: completion of the first study activity.",
        "Calculate visit-to-registration conversion: 40/500 = 8%. Then calculate registration-to-first-activity conversion: 8/40 = 20%.",
        "Propose a testable hypothesis, such as simplifying the steps between selecting notes and starting the first practice.",
        "Decide which measures to inspect: first-activity completion, drop-off by step, and whether users received useful feedback."
      ],
      "check": "The 8% and 20% rates have different denominators. Mixing them up can lead to optimizing traffic when the main issue occurs after registration."
    },
    "mistakes": [
      {
        "title": "Confusing segmentation with positioning",
        "why": "Segmentation identifies groups; positioning concerns the differentiated meaning of the offer for a chosen audience."
      },
      {
        "title": "Choosing channels by popularity",
        "why": "A recommendation needs an audience, objective, resource constraint, and way to assess success."
      },
      {
        "title": "Comparing metrics without definitions",
        "why": "A click-through rate and an activation rate describe different behaviors and cannot be substituted for each other."
      }
    ],
    "faq": [
      {
        "question": "How do I prepare for a marketing exam with case studies?",
        "answer": "Practice identifying the problem, selecting a relevant framework, defending a recommendation, and stating what additional evidence you would need."
      },
      {
        "question": "Is memorizing the 4 Ps enough?",
        "answer": "Not for case questions. Connect the marketing mix to the audience, the value proposition, and practical constraints."
      },
      {
        "question": "What should I practice for digital marketing?",
        "answer": "Analyze simple funnels, formulate testable hypotheses, and distinguish reach, conversion, and retention metrics."
      }
    ],
    "sources": [
      {
        "title": "Roediger & Karpicke (2006) · Test-enhanced learning",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/"
      },
      {
        "title": "Cepeda et al. (2006) · Distributed practice",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/"
      }
    ]
  }
];
