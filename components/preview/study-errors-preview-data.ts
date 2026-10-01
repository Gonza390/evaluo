// Datos ficticios: este preview no consulta materiales ni genera IA.
export type PreviewError = {
  id: string;
  materialId: string | null;
  topic: string;
  source: string;
  failures: number;
  question: string;
  options: string[];
  chosen: number;
  correct: number;
  page: number | null;
  section: string;
  excerpt: string;
  explanation: string;
  takeaway: string;
  evidence: 'supported' | 'missing' | 'conflict';
  resolved?: boolean;
};

export const previewMaterials = [
  { id: 'penal', title: 'Derecho penal · Unidad 2.pdf', subject: 'Derecho penal', pages: 32 },
  { id: 'biologia', title: 'Biología celular.pdf', subject: 'Biología', pages: 24 },
  { id: 'historia', title: 'Historia · Unidad 1.pdf', subject: 'Historia', pages: 18 },
];

export const previewErrors: PreviewError[] = [
  {
    id: 'finalismo',
    materialId: 'penal',
    topic: 'Finalismo',
    source: 'Preguntero',
    failures: 3,
    question: '¿Qué caracteriza a la acción en la teoría finalista?',
    options: [
      'Un movimiento corporal explicado solo por su causalidad.',
      'Una conducta orientada conscientemente a un fin.',
      'Un resultado sin relación con la voluntad.',
    ],
    chosen: 0,
    correct: 1,
    page: 12,
    section: 'Teoría de la acción',
    excerpt:
      'La acción humana se caracteriza por su finalidad. El sujeto dirige conscientemente su conducta hacia un objetivo, anticipando las consecuencias de su actuación.',
    explanation:
      'Tu respuesta describe la acción únicamente como una cadena causal. El fragmento de tus apuntes incorpora una diferencia: la persona anticipa consecuencias y dirige su conducta hacia un fin. Por eso corresponde elegir la conducta orientada conscientemente a un objetivo.',
    takeaway: 'Finalismo: además de causar un resultado, la conducta se dirige hacia un fin.',
    evidence: 'supported',
  },
  {
    id: 'culpabilidad',
    materialId: 'penal',
    topic: 'Culpabilidad',
    source: 'Flashcards',
    failures: 2,
    question: '¿Qué expresa la culpabilidad en el fragmento de tus apuntes?',
    options: [
      'La mera producción del resultado.',
      'El reproche personal por una conducta cuando era exigible actuar de otro modo.',
      'La descripción objetiva del tipo penal.',
    ],
    chosen: 0,
    correct: 1,
    page: 19,
    section: 'Juicio de reproche',
    excerpt:
      'La culpabilidad supone un juicio de reproche personal. Se considera si, en las circunstancias del caso, al autor le era exigible actuar conforme a derecho.',
    explanation:
      'Producir un resultado no equivale al reproche personal. Tus apuntes relacionan la culpabilidad con la exigibilidad de actuar conforme a derecho. Esa distinción permite separar el resultado de la valoración de la conducta del autor.',
    takeaway: 'Buscá la exigibilidad de actuar de otro modo, no solo el resultado.',
    evidence: 'supported',
  },
  {
    id: 'conflicto',
    materialId: 'penal',
    topic: 'Ubicación del dolo',
    source: 'Práctica',
    failures: 1,
    question: 'Según este material, ¿dónde se ubica el dolo en la teoría finalista?',
    options: ['En la culpabilidad.', 'En el tipo subjetivo.', 'Fuera del análisis del delito.'],
    chosen: 1,
    correct: 0,
    page: 14,
    section: 'Tipo subjetivo',
    excerpt:
      'En el esquema finalista presentado en estos apuntes, el dolo se analiza como parte del tipo subjetivo.',
    explanation:
      'La actividad marcó «En la culpabilidad» como correcta, pero el fragmento de este PDF ubica el dolo en el tipo subjetivo. Tu respuesta coincide con el pasaje citado. Hace falta revisar la actividad antes de atribuirte un error.',
    takeaway: 'Este caso queda pendiente de revisión; no vamos a forzar una explicación.',
    evidence: 'conflict',
  },
  {
    id: 'dogmatica',
    materialId: 'penal',
    topic: 'Dogmática penal',
    source: 'Diagnóstico',
    failures: 1,
    question: '¿Cuál es una función de la dogmática penal?',
    options: [
      'Organizar e interpretar las categorías jurídicas.',
      'Reemplazar el texto de la ley.',
      'Eliminar las reglas de interpretación.',
    ],
    chosen: 1,
    correct: 0,
    page: 5,
    section: 'Introducción',
    excerpt:
      'La dogmática organiza e interpreta las categorías jurídicas para favorecer una aplicación sistemática del derecho.',
    explanation:
      'El PDF habla de organizar e interpretar las categorías jurídicas. Eso no implica reemplazar el texto de la ley.',
    takeaway: 'Organizar e interpretar no significa sustituir la ley.',
    evidence: 'supported',
    resolved: true,
  },
  {
    id: 'transporte',
    materialId: 'biologia',
    topic: 'Transporte pasivo',
    source: 'Práctica',
    failures: 2,
    question: '¿Qué caracteriza al transporte pasivo?',
    options: [
      'Siempre consume ATP directamente.',
      'Ocurre a favor del gradiente sin consumo directo de ATP.',
      'Siempre mueve sustancias contra el gradiente.',
    ],
    chosen: 0,
    correct: 1,
    page: 8,
    section: 'Membrana plasmática',
    excerpt:
      'El transporte pasivo ocurre a favor del gradiente y no requiere consumo directo de ATP. Incluye difusión simple y difusión facilitada.',
    explanation:
      'Confundiste el consumo de ATP con el transporte pasivo. Tu PDF indica que este ocurre a favor del gradiente sin consumo directo de ATP.',
    takeaway: 'Pasivo: a favor del gradiente, sin consumo directo de ATP.',
    evidence: 'supported',
  },
  {
    id: 'evidencia',
    materialId: 'biologia',
    topic: 'Regulación epigenética',
    source: 'Preguntero',
    failures: 1,
    question: '¿Qué efecto tiene la metilación del ADN en este caso?',
    options: [
      'Siempre aumenta la expresión.',
      'Puede asociarse con una reducción de la expresión.',
      'No tiene ninguna relación con la expresión.',
    ],
    chosen: 0,
    correct: 1,
    page: null,
    section: '',
    excerpt: '',
    explanation: '',
    takeaway: '',
    evidence: 'missing',
  },
  {
    id: 'historia',
    materialId: 'historia',
    topic: 'Fuentes primarias',
    source: 'Flashcards',
    failures: 1,
    question: '¿Qué es una fuente primaria?',
    options: [
      'Un testimonio o documento de la época estudiada.',
      'Cualquier resumen posterior.',
      'Solo un manual escolar.',
    ],
    chosen: 1,
    correct: 0,
    page: 4,
    section: 'Fuentes históricas',
    excerpt:
      'Las fuentes primarias son documentos o testimonios producidos en la época que se estudia.',
    explanation:
      'Un resumen posterior no se convierte en fuente primaria. El PDF remite a documentos y testimonios de la época.',
    takeaway: 'Primaria: producida en la época estudiada.',
    evidence: 'supported',
    resolved: true,
  },
  {
    id: 'sin-pdf',
    materialId: null,
    topic: 'División celular',
    source: 'Diagnóstico',
    failures: 1,
    question: '¿Qué proceso produce dos células hijas en este ejercicio?',
    options: ['Mitosis.', 'Difusión.', 'Transporte activo.'],
    chosen: 1,
    correct: 0,
    page: null,
    section: '',
    excerpt: '',
    explanation: '',
    takeaway: '',
    evidence: 'missing',
  },
];
