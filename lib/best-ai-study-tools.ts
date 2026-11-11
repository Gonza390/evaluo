// Contenido de la guía "Mejores IA para estudiar" (ES neutro y EN).
// Datos revisados el 11/11/2026 contra las fuentes oficiales enlazadas en cada herramienta.
// Criterio editorial: no publicar precios de terceros (cambian seguido); se indica si hay plan
// gratuito y se enlaza la página oficial de precios. Evaluo es nuestro producto y se declara.

export type BestAiLocale = 'es' | 'en';

export type BestAiTool = {
  id: string;
  name: string;
  bestFor: string;
  summary: string;
  strengths: string[];
  watchOut: string[];
  fromYourFiles: string;
  flashcards: string;
  practice: string;
  freePlan: string;
  spanish: string;
  pricing: string;
  officialHref: string;
  sources: Array<{ title: string; href: string }>;
  isEvaluo?: boolean;
};

export type BestAiContent = {
  path: string;
  home: string;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  intro: string;
  disclosure: string;
  author: { name: string; role: string; bio: string; byline: string };
  updatedLabel: string;
  updatedDate: string;
  quickTitle: string;
  quick: Array<{ need: string; pick: string; anchor: string }>;
  tableTitle: string;
  tableHeaders: [string, string, string, string, string, string];
  toolsTitle: string;
  labels: { strengths: string; watchOut: string; pricing: string; official: string; sources: string; bestFor: string };
  tools: BestAiTool[];
  methodTitle: string;
  method: string[];
  tipsTitle: string;
  tips: string[];
  ctaTitle: string;
  ctaText: string;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
  relatedTitle: string;
  related: Array<{ href: string; title: string }>;
};

export const BEST_AI_CONTENT: Record<BestAiLocale, BestAiContent> = {
  es: {
    path: '/es/mejores-ia-para-estudiar',
    home: '/es',
    breadcrumb: 'Mejores IA para estudiar',
    eyebrow: 'Guía comparativa · 2026',
    title: 'Las mejores IA para estudiar en 2026: cuál conviene según cómo estudias',
    intro:
      'No hay una única "mejor IA para estudiar": depende de si necesitas investigar varias fuentes, que te expliquen un tema paso a paso, memorizar con tarjetas o prepararte para un examen a partir de tus apuntes. Comparamos once herramientas por lo que hacen bien, sus límites y si tienen plan gratuito.',
    author: {
      name: 'Gonzalo Olmos',
      role: 'Fundador de Evaluo',
      byline: 'Escrito por',
      bio: 'Gonzalo creó Evaluo en Córdoba, Argentina, para que estudiar con IA signifique practicar y entender, no solo leer resúmenes. Desarrolla la plataforma y sigue de cerca cómo estudian sus usuarios.',
    },
    disclosure:
      'Transparencia: Evaluo es nuestro producto y está incluido en la lista. Por eso también te decimos en qué casos te conviene más otra herramienta. No tenemos acuerdos comerciales con las demás.',
    updatedLabel: 'Revisado el',
    updatedDate: '11 de noviembre de 2026',
    quickTitle: 'Respuesta rápida: qué IA usar para cada necesidad',
    quick: [
      { need: 'Investigar y cruzar varias fuentes (apuntes, artículos, videos)', pick: 'Gemini Notebook (antes NotebookLM)', anchor: 'gemini-notebook' },
      { need: 'Que te expliquen un tema paso a paso, con preguntas', pick: 'ChatGPT (Modo de estudio), Gemini (Aprendizaje guiado) o Claude', anchor: 'chatgpt' },
      { need: 'Memorizar con flashcards y repetición espaciada', pick: 'Anki (gratis) o Knowt; Quizlet si ya usas sus mazos', anchor: 'anki' },
      { need: 'Buscar información con fuentes para un trabajo', pick: 'Perplexity', anchor: 'perplexity' },
      { need: 'Resolver ejercicios de matemática paso a paso', pick: 'Photomath', anchor: 'photomath' },
      { need: 'Estudiar tus apuntes por temas y practicar para un examen', pick: 'Evaluo', anchor: 'evaluo' },
    ],
    tableTitle: 'Comparación rápida',
    tableHeaders: ['Herramienta', 'Mejor para', 'Desde tus archivos', 'Flashcards · Preguntas', 'Plan gratuito', 'En español'],
    toolsTitle: 'Las herramientas, una por una',
    labels: { strengths: 'Lo mejor', watchOut: 'A tener en cuenta', pricing: 'Precio', official: 'Sitio oficial', sources: 'Fuentes', bestFor: 'Ideal para' },
    tools: [
      {
        id: 'gemini-notebook',
        name: 'Gemini Notebook (antes NotebookLM)',
        bestFor: 'Investigar varias fuentes',
        summary:
          'La herramienta de Google para trabajar con tus propias fuentes. El 16 de julio de 2026 NotebookLM pasó a llamarse Gemini Notebook; es el mismo producto. Responde usando solo los documentos que cargas y cita de dónde sale cada respuesta.',
        strengths: [
          'Combina muchas fuentes en un cuaderno: PDF, sitios web, audio y más.',
          'Genera guías de estudio, mapas mentales, resúmenes en audio y video, flashcards y cuestionarios.',
          'Las respuestas citan la fuente, así que es fácil verificar.',
        ],
        watchOut: [
          'Está pensada para investigar: no arma un recorrido de estudio por temas ni te dice qué repasar antes del examen.',
          'El nombre cambió hace poco y en algunos lugares todavía aparece como NotebookLM.',
        ],
        fromYourFiles: 'Sí, varias fuentes',
        flashcards: 'Sí',
        practice: 'Cuestionarios',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Gratis con cuenta de Google; los planes pagos de Google AI amplían los límites.',
        officialHref: 'https://notebooklm.google/',
        sources: [
          { title: 'Google: NotebookLM ahora es Gemini Notebook (16/07/2026)', href: 'https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/' },
          { title: 'Ayuda de Gemini Notebook: tarjetas y cuestionarios', href: 'https://support.google.com/gemininotebook/answer/16958963?hl=es-419' },
        ],
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT (Modo de estudio)',
        bestFor: 'Explicaciones paso a paso',
        summary:
          'El asistente general de OpenAI. Su Modo de estudio cambia la forma de responder: en lugar de darte la respuesta, te hace preguntas, te da pistas y corrige lo que entendiste mal.',
        strengths: [
          'Muy flexible: analogías, ejercicios a medida, resolver dudas puntuales.',
          'Puede trabajar con PDF y otros archivos que subas.',
          'El Modo de estudio está incluido en todos los planes, también en el gratuito.',
        ],
        watchOut: [
          'Tienes que guiar la conversación: no organiza tu material por temas ni guarda un registro de qué temas te faltan.',
          'Como cualquier IA puede equivocarse; contrasta datos importantes con tu material.',
        ],
        fromYourFiles: 'Sí',
        flashcards: 'Si se lo pides',
        practice: 'Sí, en la conversación',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Plan gratuito con límites; planes pagos con más uso.',
        officialHref: 'https://chatgpt.com/pricing',
        sources: [
          { title: 'OpenAI: usar el Modo de estudio en ChatGPT', href: 'https://help.openai.com/es-419/articles/11780217-using-study-mode-in-chatgpt' },
          { title: 'OpenAI: cargar archivos en ChatGPT', href: 'https://help.openai.com/es-419/articles/8555545-uploading-files-and-audio-to-chatgpt' },
        ],
      },
      {
        id: 'gemini',
        name: 'Gemini (Aprendizaje guiado y cuadernos de estudio)',
        bestFor: 'Tutor paso a paso con diagnóstico',
        summary:
          'El asistente de Google. Su Aprendizaje guiado explica un tema por etapas, y desde junio de 2026 los cuadernos de estudio de la app de Gemini parten de un cuestionario de diagnóstico para armar lecciones según lo que ya sabes.',
        strengths: [
          'Aprendizaje guiado: explicaciones paso a paso con preguntas para comprobar que entendiste.',
          'Cuadernos de estudio: diagnóstico inicial y lecciones que se ajustan a tus resultados.',
          'Se conecta con Gemini Notebook, así que puedes reutilizar tus fuentes.',
        ],
        watchOut: [
          'Algunas funciones llegan primero a la versión web y de forma gradual a la app.',
          'La oferta de Google cambia rápido: hay funciones con nombres parecidos (Gemini Notebook y cuadernos de estudio son cosas distintas).',
        ],
        fromYourFiles: 'Sí',
        flashcards: 'Sí',
        practice: 'Sí',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Gratis con cuenta de Google; los planes pagos amplían modelos y límites.',
        officialHref: 'https://gemini.google.com/',
        sources: [
          { title: 'Google: cuadernos de estudio en la app de Gemini (25/06/2026)', href: 'https://blog.google/innovation-and-ai/products/gemini-app/gemini-study-notebooks/' },
          { title: 'Google: investigación sobre Aprendizaje guiado (03/11/2026)', href: 'https://blog.google/products-and-platforms/products/education/guided-learning-uk-japan/' },
        ],
      },
      {
        id: 'quizlet',
        name: 'Quizlet',
        bestFor: 'Mazos de tarjetas y repaso',
        summary:
          'La plataforma de flashcards más conocida. Además de crear tus tarjetas, tiene millones de mazos de la comunidad y herramientas con IA que convierten apuntes en guías de estudio.',
        strengths: [
          'Muchos mazos ya hechos por otros estudiantes.',
          'Modos de repaso variados: Learn, pruebas, juegos.',
          'Las guías de estudio con IA generan resúmenes y tarjetas desde tus apuntes.',
        ],
        watchOut: [
          'Varias funciones de estudio y de IA están en el plan pago (Quizlet Plus).',
          'Los mazos de la comunidad varían en calidad: revisa que coincidan con tu programa.',
        ],
        fromYourFiles: 'Sí (guías de estudio con IA)',
        flashcards: 'Sí',
        practice: 'Sí',
        freePlan: 'Sí, con límites',
        spanish: 'Sí',
        pricing: 'Gratis con funciones básicas; Quizlet Plus es pago.',
        officialHref: 'https://quizlet.com/upgrade',
        sources: [
          { title: 'Quizlet: herramientas de estudio con IA', href: 'https://quizlet.com/features/ai-study-tools' },
          { title: 'Quizlet: modo Learn', href: 'https://quizlet.com/features/learn' },
        ],
      },
      {
        id: 'knowt',
        name: 'Knowt',
        bestFor: 'Flashcards con IA gratis',
        summary:
          'Una alternativa a Quizlet centrada en flashcards. Genera tarjetas y pruebas de práctica desde apuntes, PDF y clases grabadas, y permite importar mazos de Quizlet.',
        strengths: [
          'Lo esencial (flashcards, modo Learn, pruebas de práctica) es gratis, con anuncios.',
          'Importa mazos de Quizlet con un clic.',
          'Tutor con IA para hacer preguntas sobre tu material.',
        ],
        watchOut: [
          'La interfaz y la mayoría del contenido de la comunidad están en inglés.',
          'Los planes pagos suben los límites de las funciones de IA.',
        ],
        fromYourFiles: 'Sí',
        flashcards: 'Sí',
        practice: 'Sí',
        freePlan: 'Sí, con anuncios',
        spanish: 'Interfaz en inglés',
        pricing: 'Gratis con anuncios; plan Ultra pago para más IA.',
        officialHref: 'https://knowt.com/plans',
        sources: [{ title: 'Knowt: planes', href: 'https://knowt.com/plans' }],
      },
      {
        id: 'studyfetch',
        name: 'StudyFetch',
        bestFor: 'Tutor con IA sobre tus clases',
        summary:
          'Convierte clases, PDF y apuntes en flashcards, cuestionarios y guías, con un tutor de IA (Spark.E) que responde sobre tu material.',
        strengths: [
          'Trabaja con audio, video, texto y PDF.',
          'Incluye tutor de IA, flashcards, cuestionarios y calendario de estudio.',
        ],
        watchOut: [
          'El plan gratuito es limitado (pocas cargas y conversaciones).',
          'La interfaz está en inglés.',
        ],
        fromYourFiles: 'Sí',
        flashcards: 'Sí',
        practice: 'Sí',
        freePlan: 'Sí, limitado',
        spanish: 'Interfaz en inglés',
        pricing: 'Plan gratuito limitado; planes pagos mensuales o anuales.',
        officialHref: 'https://www.studyfetch.com/',
        sources: [{ title: 'StudyFetch: sitio oficial', href: 'https://www.studyfetch.com/' }],
      },
      {
        id: 'anki',
        name: 'Anki',
        bestFor: 'Memorizar a largo plazo',
        summary:
          'El clásico de la repetición espaciada: te muestra cada tarjeta justo antes de que la olvides. No es una IA, pero sigue siendo una de las mejores herramientas para memorizar, y combina bien con tarjetas generadas por IA.',
        strengths: [
          'Repetición espaciada muy eficaz para memorizar a largo plazo.',
          'Gratis en computadora y en la web; enorme comunidad de mazos y complementos.',
        ],
        watchOut: [
          'No genera tarjetas con IA por sí solo: tienes que crearlas o importarlas.',
          'La curva de aprendizaje es más alta que en otras apps.',
        ],
        fromYourFiles: 'No (importación manual)',
        flashcards: 'Sí',
        practice: 'Solo tarjetas',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Gratis en computadora, web y Android; la app de iPhone es paga.',
        officialHref: 'https://apps.ankiweb.net/',
        sources: [{ title: 'Anki: sitio oficial', href: 'https://apps.ankiweb.net/' }],
      },
      {
        id: 'perplexity',
        name: 'Perplexity',
        bestFor: 'Buscar información con fuentes',
        summary:
          'Un buscador con IA que responde citando las páginas de donde saca cada dato. Es muy útil para investigar un tema o preparar un trabajo, y tiene un modo de búsqueda académica centrado en publicaciones científicas.',
        strengths: [
          'Cada respuesta enlaza sus fuentes, así que es fácil verificar.',
          'Búsqueda académica para trabajar con artículos y publicaciones.',
          'Con la verificación de estudiante se habilitan funciones de estudio como flashcards y cuestionarios sobre tu material.',
        ],
        watchOut: [
          'Está pensado para encontrar información, no para organizar tu estudio ni seguir tu progreso.',
          'El análisis de archivos en el plan gratuito es limitado.',
        ],
        fromYourFiles: 'Sí, con límites',
        flashcards: 'Con verificación de estudiante',
        practice: 'Con verificación de estudiante',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Plan gratuito; Pro pago, con descuento para estudiantes verificados.',
        officialHref: 'https://www.perplexity.ai/',
        sources: [{ title: 'Perplexity: sitio oficial', href: 'https://www.perplexity.ai/' }],
      },
      {
        id: 'claude',
        name: 'Claude (modo de aprendizaje)',
        bestFor: 'Razonar un tema con un tutor',
        summary:
          'El asistente de Anthropic. Su modo de aprendizaje responde con preguntas en lugar de darte la solución: te pide que expliques tu razonamiento y te marca los conceptos clave. Destaca para leer y discutir textos largos.',
        strengths: [
          'Modo de aprendizaje con preguntas socráticas, pensado para que razones tú.',
          'Trabaja bien con documentos largos y explicaciones detalladas.',
          'Puede generar flashcards, guías o ejercicios cuando se lo pides.',
        ],
        watchOut: [
          'Como todo asistente general, no organiza tu material por temas ni sigue tu progreso hacia el examen.',
          'Algunas funciones educativas llegan a través de acuerdos con universidades; revisa qué incluye tu plan.',
        ],
        fromYourFiles: 'Sí',
        flashcards: 'Si se lo pides',
        practice: 'Sí, en la conversación',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Plan gratuito con límites; planes pagos con más uso.',
        officialHref: 'https://claude.ai/',
        sources: [{ title: 'Anthropic: Claude para educación', href: 'https://www.anthropic.com/education' }],
      },
      {
        id: 'photomath',
        name: 'Photomath',
        bestFor: 'Matemática paso a paso',
        summary:
          'App de Google para matemática: le sacas una foto a un ejercicio y te muestra la solución explicada paso a paso, desde aritmética hasta cálculo.',
        strengths: [
          'Las explicaciones paso a paso están incluidas en la versión gratuita.',
          'Muy rápida para revisar cómo se resuelve un ejercicio.',
        ],
        watchOut: [
          'Sirve para matemática, no para estudiar teoría ni otras materias.',
          'Si solo copias la solución no aprendes: úsala para revisar después de intentarlo tú.',
        ],
        fromYourFiles: 'Foto del ejercicio',
        flashcards: 'No',
        practice: 'Ejercicios de matemática',
        freePlan: 'Sí',
        spanish: 'Sí',
        pricing: 'Gratis con explicaciones paso a paso; Photomath Plus es pago.',
        officialHref: 'https://photomath.com/',
        sources: [{ title: 'Photomath: sitio oficial', href: 'https://photomath.com/' }],
      },
      {
        id: 'evaluo',
        name: 'Evaluo',
        bestFor: 'Preparar un examen desde tu material',
        summary:
          'Nuestra plataforma. Subes tu material de estudio y Evaluo lo organiza por temas: resumen y glosario de cada tema, flashcards, preguntas de opción múltiple y de verdadero o falso, simulacros y un plan de estudio, con tus resultados por tema.',
        strengths: [
          'Recorrido de estudio armado: no tienes que escribir instrucciones.',
          'Te muestra qué temas dominas y cuáles repasar antes del examen.',
          'Pensada en español (y también en inglés); eliges el archivo sin registrarte.',
        ],
        watchOut: [
          'Trabaja sobre un documento a la vez: para cruzar muchas fuentes, Gemini Notebook es mejor.',
          'No es un chat abierto ni permite elegir el modelo de IA.',
          'El plan gratuito incluye 1 material por mes.',
        ],
        fromYourFiles: 'Sí (PDF o Word)',
        flashcards: 'Sí',
        practice: 'Sí, por tema y simulacros',
        freePlan: 'Sí (1 material por mes)',
        spanish: 'Sí',
        pricing: 'Plan gratuito; Premium para más materiales y práctica.',
        officialHref: '/pricing',
        sources: [{ title: 'Evaluo: planes y límites', href: '/pricing' }],
        isEvaluo: true,
      },
    ],
    methodTitle: 'Cómo elegimos y comparamos',
    method: [
      'Incluimos herramientas que estudiantes usan para estudiar con IA o con tarjetas, con versión gratuita para probarlas.',
      'Comparamos lo que cada una hace con tus propios archivos, qué tipos de práctica ofrece, si tiene plan gratuito y si funciona en español.',
      'Los datos salen de las páginas oficiales de cada herramienta (enlazadas en cada una) y se revisaron en la fecha indicada. Las funciones y precios cambian: confirma siempre en el sitio oficial.',
    ],
    tipsTitle: 'Cómo estudiar con IA sin que piense por ti',
    tips: [
      'Usa la IA para practicar, no solo para resumir: responder preguntas fija más que releer un resumen.',
      'Intenta responder antes de mirar la explicación.',
      'Verifica datos, fechas y fórmulas contra tu material y lo que pide tu docente.',
      'Repasa lo que fallaste unos días después, no solo el día anterior al examen.',
    ],
    ctaTitle: 'Prueba Evaluo con tus apuntes',
    ctaText: 'Si tu caso es preparar un examen a partir de tu material de estudio, elige tu archivo: no necesitas registrarte para elegirlo.',
    faqTitle: 'Preguntas frecuentes',
    faq: [
      { question: '¿Cuál es la mejor IA para estudiar gratis?', answer: 'Depende de cómo estudias. Gemini Notebook (antes NotebookLM) es gratis y muy completa para investigar fuentes; ChatGPT y Gemini tienen modos de estudio gratuitos para explicaciones paso a paso; Anki es gratis para memorizar; y Evaluo tiene un plan gratuito para estudiar un PDF por temas y practicar para el examen.' },
      { question: '¿Qué IA es mejor para estudiar un PDF?', answer: 'Si quieres consultar y cruzar varios documentos, Gemini Notebook. Si quieres convertir un PDF en un recorrido de estudio con preguntas, resultados por tema y repaso de errores, Evaluo. ChatGPT también lee PDF, pero tienes que guiar la conversación.' },
      { question: '¿NotebookLM cambió de nombre?', answer: 'Sí. El 16 de julio de 2026 Google renombró NotebookLM a Gemini Notebook. Es el mismo producto y la dirección notebooklm.google sigue funcionando.' },
      { question: '¿Qué IA sirve para estudiar matemática?', answer: 'Para ver cómo se resuelve un ejercicio paso a paso, Photomath (gratis). Para entender el razonamiento detrás, un asistente con modo de estudio como ChatGPT, Gemini o Claude, que te hace preguntas en lugar de darte la respuesta. Intenta resolver primero y usa la IA para revisar.' },
      { question: '¿Puedo usar varias IA a la vez?', answer: 'Sí, y suele ser lo mejor: por ejemplo, investigar fuentes en Gemini Notebook, resolver dudas en ChatGPT y practicar para el examen en Evaluo o memorizar con Anki.' },
      { question: '¿La IA puede equivocarse al estudiar?', answer: 'Sí. Todas pueden cometer errores en datos, fórmulas o matices. Usa la IA para practicar y entender, y verifica lo importante con tu material y tus docentes.' },
    ],
    relatedTitle: 'Comparaciones en detalle',
    related: [
      { href: '/comparar/evaluo-vs-notebooklm', title: 'Evaluo vs NotebookLM' },
      { href: '/comparar/evaluo-vs-chatgpt', title: 'Evaluo vs ChatGPT' },
      { href: '/comparar/evaluo-vs-quizlet', title: 'Evaluo vs Quizlet' },
      { href: '/es/como-funciona', title: 'Cómo funciona Evaluo' },
    ],
  },
  en: {
    path: '/en/best-ai-for-studying',
    home: '/en',
    breadcrumb: 'Best AI for studying',
    eyebrow: 'Comparison guide · 2026',
    title: 'The best AI study tools and apps in 2026: which one fits how you study',
    intro:
      'There is no single "best AI for studying": it depends on whether you need to research several sources, get a topic explained step by step, memorize with flashcards or prepare for an exam from your own notes. We compared eleven tools by what they do well, their limits and whether they have a free plan.',
    author: {
      name: 'Gonzalo Olmos',
      role: 'Founder of Evaluo',
      byline: 'Written by',
      bio: 'Gonzalo built Evaluo in Córdoba, Argentina, so that studying with AI means practicing and understanding, not just reading summaries. He develops the platform and follows closely how its users study.',
    },
    disclosure:
      'Disclosure: Evaluo is our product and it is on this list. That is why we also tell you when another tool is a better fit. We have no commercial agreements with the others.',
    updatedLabel: 'Reviewed on',
    updatedDate: 'November 11, 2026',
    quickTitle: 'Quick answer: which AI to use for each need',
    quick: [
      { need: 'Research and cross-check several sources (notes, articles, videos)', pick: 'Gemini Notebook (formerly NotebookLM)', anchor: 'gemini-notebook' },
      { need: 'Get a topic explained step by step, with questions', pick: 'ChatGPT (Study mode), Gemini (Guided Learning) or Claude', anchor: 'chatgpt' },
      { need: 'Memorize with flashcards and spaced repetition', pick: 'Anki (free) or Knowt; Quizlet if you already use its decks', anchor: 'anki' },
      { need: 'Research a paper with sources', pick: 'Perplexity', anchor: 'perplexity' },
      { need: 'Work through math problems step by step', pick: 'Photomath', anchor: 'photomath' },
      { need: 'Study your notes by topic and practice for an exam', pick: 'Evaluo', anchor: 'evaluo' },
    ],
    tableTitle: 'Quick comparison',
    tableHeaders: ['Tool', 'Best for', 'From your files', 'Flashcards · Questions', 'Free plan', 'Spanish'],
    toolsTitle: 'The tools, one by one',
    labels: { strengths: 'Strengths', watchOut: 'Keep in mind', pricing: 'Price', official: 'Official site', sources: 'Sources', bestFor: 'Best for' },
    tools: [
      {
        id: 'gemini-notebook',
        name: 'Gemini Notebook (formerly NotebookLM)',
        bestFor: 'Researching several sources',
        summary:
          "Google's tool for working with your own sources. On July 16, 2026 NotebookLM was renamed Gemini Notebook; it is the same product. It answers using only the documents you add and cites where each answer comes from.",
        strengths: [
          'Combines many sources in one notebook: PDFs, websites, audio and more.',
          'Creates study guides, mind maps, audio and video overviews, flashcards and quizzes.',
          'Answers cite the source, so checking them is easy.',
        ],
        watchOut: [
          'It is built for research: it does not set up a topic-by-topic study path or tell you what to review before the exam.',
          'The name changed recently and some places still call it NotebookLM.',
        ],
        fromYourFiles: 'Yes, many sources',
        flashcards: 'Yes',
        practice: 'Quizzes',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free with a Google account; paid Google AI plans raise the limits.',
        officialHref: 'https://notebooklm.google/',
        sources: [
          { title: 'Google: NotebookLM is now Gemini Notebook (07/16/2026)', href: 'https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/' },
          { title: 'Gemini Notebook Help: flashcards and quizzes', href: 'https://support.google.com/gemininotebook/answer/16958963?hl=en' },
        ],
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT (Study mode)',
        bestFor: 'Step-by-step explanations',
        summary:
          "OpenAI's general assistant. Study mode changes how it answers: instead of handing you the answer, it asks questions, gives hints and corrects misunderstandings.",
        strengths: [
          'Very flexible: analogies, custom exercises, quick questions.',
          'Can work with PDFs and other files you upload.',
          'Study mode is included on every plan, including the free one.',
        ],
        watchOut: [
          'You have to steer the conversation: it does not organize your material by topic or track which topics you still need.',
          'Like any AI it can be wrong; check important facts against your material.',
        ],
        fromYourFiles: 'Yes',
        flashcards: 'If you ask',
        practice: 'Yes, in the chat',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free plan with limits; paid plans for more usage.',
        officialHref: 'https://chatgpt.com/pricing',
        sources: [
          { title: 'OpenAI: using Study mode in ChatGPT', href: 'https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt' },
          { title: 'OpenAI: uploading files to ChatGPT', href: 'https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt' },
        ],
      },
      {
        id: 'gemini',
        name: 'Gemini (Guided Learning and study notebooks)',
        bestFor: 'Step-by-step tutor with a diagnosis',
        summary:
          "Google's assistant. Guided Learning explains a topic in stages, and since June 2026 the Gemini app's study notebooks start with a diagnostic quiz and build lessons around what you already know.",
        strengths: [
          'Guided Learning: step-by-step explanations with questions to check your understanding.',
          'Study notebooks: an initial diagnosis and lessons that adapt to your results.',
          'Connects with Gemini Notebook, so you can reuse your sources.',
        ],
        watchOut: [
          'Some features reach the web version first and roll out gradually to the app.',
          "Google's lineup changes fast and names overlap (Gemini Notebook and study notebooks are different things).",
        ],
        fromYourFiles: 'Yes',
        flashcards: 'Yes',
        practice: 'Yes',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free with a Google account; paid plans add models and limits.',
        officialHref: 'https://gemini.google.com/',
        sources: [
          { title: 'Google: study notebooks in the Gemini app (06/25/2026)', href: 'https://blog.google/innovation-and-ai/products/gemini-app/gemini-study-notebooks/' },
          { title: 'Google: research on Guided Learning (11/03/2026)', href: 'https://blog.google/products-and-platforms/products/education/guided-learning-uk-japan/' },
        ],
      },
      {
        id: 'quizlet',
        name: 'Quizlet',
        bestFor: 'Flashcard decks and review',
        summary:
          'The best-known flashcard platform. Besides making your own cards, it has millions of community decks and AI tools that turn notes into study guides.',
        strengths: [
          'Many ready-made decks from other students.',
          'Varied review modes: Learn, tests, games.',
          'AI study guides create summaries and cards from your notes.',
        ],
        watchOut: [
          'Several study and AI features are on the paid plan (Quizlet Plus).',
          'Community decks vary in quality: check they match your syllabus.',
        ],
        fromYourFiles: 'Yes (AI study guides)',
        flashcards: 'Yes',
        practice: 'Yes',
        freePlan: 'Yes, limited',
        spanish: 'Yes',
        pricing: 'Free with basic features; Quizlet Plus is paid.',
        officialHref: 'https://quizlet.com/upgrade',
        sources: [
          { title: 'Quizlet: AI study tools', href: 'https://quizlet.com/features/ai-study-tools' },
          { title: 'Quizlet: Learn mode', href: 'https://quizlet.com/features/learn' },
        ],
      },
      {
        id: 'knowt',
        name: 'Knowt',
        bestFor: 'Free AI flashcards',
        summary:
          'A Quizlet alternative focused on flashcards. It creates cards and practice tests from notes, PDFs and recorded lectures, and imports Quizlet sets.',
        strengths: [
          'The core (flashcards, Learn mode, practice tests) is free, with ads.',
          'One-click import of Quizlet sets.',
          'AI tutor for questions about your material.',
        ],
        watchOut: [
          'Paid plans raise the limits on AI features.',
          'Most community content is in English.',
        ],
        fromYourFiles: 'Yes',
        flashcards: 'Yes',
        practice: 'Yes',
        freePlan: 'Yes, with ads',
        spanish: 'English interface',
        pricing: 'Free with ads; paid Ultra plan for more AI.',
        officialHref: 'https://knowt.com/plans',
        sources: [{ title: 'Knowt: plans', href: 'https://knowt.com/plans' }],
      },
      {
        id: 'studyfetch',
        name: 'StudyFetch',
        bestFor: 'AI tutor on your lectures',
        summary:
          'Turns lectures, PDFs and notes into flashcards, quizzes and study guides, with an AI tutor (Spark.E) that answers questions about your material.',
        strengths: [
          'Works with audio, video, text and PDFs.',
          'Includes an AI tutor, flashcards, quizzes and a study calendar.',
        ],
        watchOut: [
          'The free plan is limited (few uploads and chats).',
          'Paid plans are needed for regular use.',
        ],
        fromYourFiles: 'Yes',
        flashcards: 'Yes',
        practice: 'Yes',
        freePlan: 'Yes, limited',
        spanish: 'English interface',
        pricing: 'Limited free plan; monthly or annual paid plans.',
        officialHref: 'https://www.studyfetch.com/',
        sources: [{ title: 'StudyFetch: official site', href: 'https://www.studyfetch.com/' }],
      },
      {
        id: 'anki',
        name: 'Anki',
        bestFor: 'Long-term memorization',
        summary:
          'The spaced-repetition classic: it shows each card right before you would forget it. It is not an AI, but it is still one of the best tools for memorizing, and it pairs well with AI-generated cards.',
        strengths: [
          'Highly effective spaced repetition for long-term memory.',
          'Free on desktop and the web; huge community of decks and add-ons.',
        ],
        watchOut: [
          'It does not generate cards with AI on its own: you create or import them.',
          'Steeper learning curve than other apps.',
        ],
        fromYourFiles: 'No (manual import)',
        flashcards: 'Yes',
        practice: 'Cards only',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free on desktop, web and Android; the iPhone app is paid.',
        officialHref: 'https://apps.ankiweb.net/',
        sources: [{ title: 'Anki: official site', href: 'https://apps.ankiweb.net/' }],
      },
      {
        id: 'perplexity',
        name: 'Perplexity',
        bestFor: 'Research with sources',
        summary:
          'An AI search engine that answers by citing the pages each fact comes from. It is very useful for researching a topic or a paper, and it has an academic search mode focused on scholarly publications.',
        strengths: [
          'Every answer links its sources, so checking is easy.',
          'Academic search for working with papers and publications.',
          'With student verification you get study features such as flashcards and quizzes on your material.',
        ],
        watchOut: [
          'It is built to find information, not to organize your studying or track your progress.',
          'File analysis on the free plan is limited.',
        ],
        fromYourFiles: 'Yes, with limits',
        flashcards: 'With student verification',
        practice: 'With student verification',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free plan; paid Pro, with a discount for verified students.',
        officialHref: 'https://www.perplexity.ai/',
        sources: [{ title: 'Perplexity: official site', href: 'https://www.perplexity.ai/' }],
      },
      {
        id: 'claude',
        name: 'Claude (learning mode)',
        bestFor: 'Reasoning through a topic with a tutor',
        summary:
          "Anthropic's assistant. Its learning mode answers with questions instead of giving you the solution: it asks you to explain your reasoning and points out the key concepts. It is strong at reading and discussing long texts.",
        strengths: [
          'Learning mode with Socratic questions, designed so you do the thinking.',
          'Works well with long documents and detailed explanations.',
          'Can create flashcards, study guides or exercises when you ask.',
        ],
        watchOut: [
          'Like any general assistant, it does not organize your material by topic or track your progress toward the exam.',
          'Some education features come through university agreements; check what your plan includes.',
        ],
        fromYourFiles: 'Yes',
        flashcards: 'If you ask',
        practice: 'Yes, in the chat',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free plan with limits; paid plans for more usage.',
        officialHref: 'https://claude.ai/',
        sources: [{ title: 'Anthropic: Claude for Education', href: 'https://www.anthropic.com/education' }],
      },
      {
        id: 'photomath',
        name: 'Photomath',
        bestFor: 'Step-by-step math',
        summary:
          "Google's math app: snap a photo of a problem and it shows the solution explained step by step, from arithmetic to calculus.",
        strengths: [
          'Step-by-step explanations are included in the free version.',
          'Very fast for checking how a problem is solved.',
        ],
        watchOut: [
          'It is for math only, not for theory or other subjects.',
          'Copying the solution does not teach you: use it to check after you try.',
        ],
        fromYourFiles: 'Photo of the problem',
        flashcards: 'No',
        practice: 'Math problems',
        freePlan: 'Yes',
        spanish: 'Yes',
        pricing: 'Free with step-by-step explanations; Photomath Plus is paid.',
        officialHref: 'https://photomath.com/',
        sources: [{ title: 'Photomath: official site', href: 'https://photomath.com/' }],
      },
      {
        id: 'evaluo',
        name: 'Evaluo',
        bestFor: 'Exam prep from your own material',
        summary:
          'Our platform. Upload your study material and Evaluo organizes it by topic: a summary and glossary for each topic, flashcards, multiple-choice and true/false questions, mock exams and a study plan, with your results by topic.',
        strengths: [
          'A ready-made study path: no prompts to write.',
          'Shows which topics you know and which to review before the exam.',
          'Works in English and Spanish; you can pick your file before signing up.',
        ],
        watchOut: [
          'Works on one document at a time: to cross-check many sources, Gemini Notebook is better.',
          'It is not an open chat and you cannot choose the AI model.',
          'The free plan includes 1 study material per month.',
        ],
        fromYourFiles: 'Yes (PDF or Word)',
        flashcards: 'Yes',
        practice: 'Yes, by topic and mock exams',
        freePlan: 'Yes (1 material/month)',
        spanish: 'Yes',
        pricing: 'Free plan; Premium for more materials and practice.',
        officialHref: '/en/pricing',
        sources: [{ title: 'Evaluo: plans and limits', href: '/en/pricing' }],
        isEvaluo: true,
      },
    ],
    methodTitle: 'How we chose and compared',
    method: [
      'We included tools students use to study with AI or flashcards, each with a free version to try.',
      'We compared what each one does with your own files, which kinds of practice it offers, whether it has a free plan and whether it works in Spanish.',
      'Facts come from each tool\'s official pages (linked under each one) and were checked on the date shown. Features and prices change: always confirm on the official site.',
    ],
    tipsTitle: 'How to study with AI without letting it think for you',
    tips: [
      'Use AI to practice, not just to summarize: answering questions sticks better than rereading a summary.',
      'Try to answer before looking at the explanation.',
      'Check facts, dates and formulas against your material and what your teacher asks for.',
      'Review what you got wrong a few days later, not only the night before the exam.',
    ],
    ctaTitle: 'Try Evaluo with your notes',
    ctaText: 'If you are preparing for an exam from your own study material, choose your file: no sign-up needed to pick it.',
    faqTitle: 'Frequently asked questions',
    faq: [
      { question: 'What is the best free AI for studying?', answer: 'It depends on how you study. Gemini Notebook (formerly NotebookLM) is free and very complete for researching sources; ChatGPT and Gemini have free study modes for step-by-step explanations; Anki is free for memorizing; and Evaluo has a free plan to study a PDF by topic and practice for the exam.' },
      { question: 'Which AI is best for studying a PDF?', answer: 'To query and cross-check several documents, Gemini Notebook. To turn one PDF into a study path with questions, results by topic and mistake review, Evaluo. ChatGPT also reads PDFs, but you have to steer the conversation.' },
      { question: 'Did NotebookLM change its name?', answer: 'Yes. On July 16, 2026 Google renamed NotebookLM to Gemini Notebook. It is the same product and notebooklm.google still works.' },
      { question: 'Which AI is best for studying math?', answer: 'To see how a problem is solved step by step, Photomath (free). To understand the reasoning behind it, an assistant with a study mode such as ChatGPT, Gemini or Claude, which asks you questions instead of giving the answer. Try first and use AI to check.' },
      { question: 'Can I use several AI tools together?', answer: 'Yes, and it often works best: for example, research sources in Gemini Notebook, ask questions in ChatGPT and practice for the exam in Evaluo or memorize with Anki.' },
      { question: 'Can AI make mistakes when studying?', answer: 'Yes. Every tool can get facts, formulas or nuances wrong. Use AI to practice and understand, and check what matters against your material and your teachers.' },
    ],
    relatedTitle: 'Detailed comparisons',
    related: [
      { href: '/en/compare/evaluo-vs-notebooklm', title: 'Evaluo vs NotebookLM' },
      { href: '/en/compare/evaluo-vs-chatgpt', title: 'Evaluo vs ChatGPT' },
      { href: '/en/compare/evaluo-vs-quizlet', title: 'Evaluo vs Quizlet' },
      { href: '/en/how-it-works', title: 'How Evaluo works' },
    ],
  },
};
