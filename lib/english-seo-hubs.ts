import type { EnglishHub } from '@/components/marketing/english-hub-page';

export const ENGLISH_HUBS = {
  features: {
    path: '/en/features',
    breadcrumb: 'Features',
    eyebrow: 'Evaluo features',
    headline: 'One set of notes, several ways to study it.',
    intro: 'You do not need a different app for every study task. Upload a PDF or Word file once and use the tool that fits what you need to check right now: understand a topic, remember definitions, see how ideas connect or test yourself before the exam.',
    decisionTitle: 'Which feature fits your goal',
    decisionIntro: 'Start from what you need to check, not from the tool. Each link opens a guide with a worked example you can try without an account.',
    decisions: [
      { need: 'Get the main ideas of a long reading before class', pick: 'AI PDF summarizer', href: '/en/ai-pdf-summarizer' },
      { need: 'See how the ideas of a chapter relate to each other', pick: 'PDF to mind map', href: '/en/pdf-to-mind-map' },
      { need: 'Memorize definitions, formulas and key terms', pick: 'AI flashcard generator', href: '/en/pdf-to-flashcards' },
      { need: 'Find out which topics you do not know yet', pick: 'Practice by topic', href: '/en/practice-by-topic' },
      { need: 'Test yourself with exam-style questions', pick: 'PDF to quiz', href: '/en/pdf-to-quiz' },
      { need: 'Rehearse the whole exam under real conditions', pick: 'AI test prep and mock exams', href: '/en/ai-test-prep' },
    ],
    cardsTitle: 'All study guides',
    cards: [
      { href: '/en/ai-pdf-summarizer', title: 'AI PDF summarizer', text: 'Topic-by-topic summaries that keep definitions and conditions intact, and how to check them.' },
      { href: '/en/pdf-to-mind-map', title: 'PDF to mind map', text: 'Map how the ideas of a topic connect, with a worked history example.', badge: 'Premium' },
      { href: '/en/pdf-to-flashcards', title: 'AI flashcard generator', text: 'Generate flashcards from your notes and make them worth reviewing.' },
      { href: '/en/practice-by-topic', title: 'Practice by topic', text: 'Find your weak topics and stop studying everything with the same effort.' },
      { href: '/en/pdf-to-quiz', title: 'PDF to quiz', text: 'Turn a PDF into questions that test understanding, not just recognition.' },
      { href: '/en/ai-test-prep', title: 'AI test prep', text: 'Build a mock exam from your notes and read the results by topic.' },
      { href: '/en/ai-true-false-questions', title: 'True-or-false questions', text: 'Check claims and explanations against your own material.' },
      { href: '/en/match-concepts-with-ai', title: 'Match concepts', text: 'Practice telling related terms apart.' },
      { href: '/en/ai-for-students', title: 'AI for students', text: 'How to study with AI without cheating, and where it gets things wrong.' },
    ],
    note: 'AI-generated summaries, maps and questions can contain mistakes. Check explanations, formulas and technical data against your original material. Mind maps are a Premium feature; everything else can be tried on the Free plan with one document.',
  },
  compare: {
    path: '/en/compare',
    breadcrumb: 'Compare',
    eyebrow: 'Study tool comparisons',
    headline: 'Which study tool fits the way you study?',
    intro: 'No single tool is best for everything. ChatGPT, NotebookLM, Quizlet and Evaluo overlap in many features, and each is stronger for a different way of studying. These comparisons are based on each product’s public documentation and say where the other tool is the better choice.',
    decisionTitle: 'A quick way to decide',
    decisionIntro: 'A rough guide based on the most common study goals. Read the full comparisons for features, limits and pricing.',
    decisions: [
      { need: 'Talk through a doubt, get an analogy or a custom exercise', pick: 'ChatGPT (see comparison)', href: '/en/compare/evaluo-vs-chatgpt' },
      { need: 'Research and cross-check many sources at once', pick: 'NotebookLM (see comparison)', href: '/en/compare/evaluo-vs-notebooklm' },
      { need: 'Review flashcard sets and memorize definitions', pick: 'Quizlet (see comparison)', href: '/en/compare/evaluo-vs-quizlet' },
      { need: 'Work through one PDF by topic, practice and review mistakes', pick: 'Evaluo', href: '/en/practice-by-topic' },
    ],
    cardsTitle: 'Full comparisons',
    cards: [
      { href: '/en/best-ai-for-studying', title: 'Best AI for studying in 2026', text: 'Eleven AI study tools compared: what each one is best for, its limits and which are free.' },
      { href: '/en/compare/evaluo-vs-chatgpt', title: 'Evaluo vs. ChatGPT', text: 'Guided conversation and Study mode versus practice organized by the topics of your PDF.' },
      { href: '/en/compare/evaluo-vs-notebooklm', title: 'Evaluo vs. NotebookLM', text: 'Researching many sources versus a topic-by-topic study path for one document.' },
      { href: '/en/compare/evaluo-vs-quizlet', title: 'Evaluo vs. Quizlet', text: 'Flashcard sets and tests versus exam preparation built from your own notes.' },
    ],
    note: 'Third-party features, limits and prices change. Each comparison links to the official documentation it was based on and shows its review date. Evaluo is not affiliated with OpenAI, Google or Quizlet.',
  },
} satisfies Record<string, EnglishHub>;

// Página principal en español neutro (/es): punto de entrada para el mundo hispano fuera
// de Argentina. Pareja de /funciones (es-AR) y /en/features (en) en el cluster features-hub.
export const ES_NEUTRAL_HUB: EnglishHub = {
  locale: 'es',
  path: '/es',
  breadcrumb: 'Plataforma de estudio con IA',
  eyebrow: 'Plataforma de estudio con inteligencia artificial',
  headline: 'Estudia con inteligencia artificial a partir de tus propios apuntes.',
  intro:
    'Evaluo convierte el PDF o el documento de Word con el que estudias en temas, resúmenes, flashcards, preguntas de práctica y simulacros, y te muestra qué repasar antes del examen. No necesitas aprender a escribir instrucciones para la IA: eliges tu material y empiezas a estudiar.',
  decisionTitle: 'Qué herramienta usar según tu objetivo',
  decisionIntro: 'Empieza por lo que necesitas hoy. Todas trabajan sobre el mismo documento y se conectan entre sí.',
  decisions: [
    { need: 'Entender un tema largo antes de la clase o de leerlo a fondo', pick: 'Resúmenes con IA', href: '/es/resumenes-con-ia' },
    { need: 'Memorizar definiciones, fórmulas o vocabulario', pick: 'Flashcards con IA', href: '/es/flashcards-con-ia' },
    { need: 'Comprobar qué sabes y qué no antes del examen', pick: 'Generador de exámenes con IA', href: '/es/generador-de-examenes-con-ia' },
    { need: 'Estudiar un PDF completo, tema por tema', pick: 'Estudiar un PDF con IA', href: '/es/estudiar-pdf-con-ia' },
    { need: 'Usar la IA para aprender sin que piense por ti', pick: 'Cómo estudiar con IA', href: '/es/guias/como-estudiar-con-ia' },
    { need: 'Ver el recorrido completo y lo que incluye cada plan', pick: 'Cómo funciona Evaluo', href: '/es/como-funciona' },
  ],
  cardsTitle: 'Todas las herramientas y guías',
  cards: [
    { href: '/es/generador-de-examenes-con-ia', title: 'Generador de exámenes con IA', text: 'Preguntas de práctica por tema y un simulacro con todo el temario.' },
    { href: '/es/resumenes-con-ia', title: 'Resúmenes con IA', text: 'Un resumen y un glosario por tema, conectados al documento original.' },
    { href: '/es/flashcards-con-ia', title: 'Flashcards con IA', text: 'Tarjetas de estudio por tema para repasar con espacios.' },
    { href: '/es/estudiar-pdf-con-ia', title: 'Estudiar un PDF con IA', text: 'De un documento largo a temas, preguntas y repasos.' },
    { href: '/es/como-funciona', title: 'Cómo funciona', text: 'Los cinco pasos, los formatos admitidos y los planes.' },
    { href: '/es/mejores-ia-para-estudiar', title: 'Mejores IA para estudiar', text: 'Once herramientas comparadas: para qué sirve cada una y cuáles son gratis.' },
    { href: '/es/guias', title: 'Guías de estudio', text: 'Métodos para estudiar materias, preparar parciales y repasar errores.' },
  ],
  note: 'Las preguntas, resúmenes y tarjetas generados con IA pueden contener errores: compruébalos con tu material. Puedes empezar gratis con un documento; el mapa mental y más documentos están en Premium.',
};
