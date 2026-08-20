import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildPedagogicalArtifacts,
  isPedagogicalGlossaryItem,
} from '@/lib/student-materials/pedagogy';
import {
  buildTraceableSummaryChunks,
  extractPdfTextAndPageCount,
} from '@/lib/student-materials/text';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-materials/types';

const pdfPath = resolve('public/material-general-prueba.pdf');
const outputPath = resolve('public/material-general-prueba.study.json');
const existing = JSON.parse(readFileSync(outputPath, 'utf8')) as {
  pageCount: number;
  glossary: StudyGlossaryItem[];
};

const summary: StudentMaterialSummary = {
  shortSummary:
    'El material explica cómo la inteligencia artificial y otras tecnologías transforman actividades cotidianas, productivas y sociales. Recorre los fundamentos de IA, machine learning y modelos generativos; su relación con datos, nube, edge, IoT, 5G, robótica y ciberseguridad; y tecnologías como blockchain, realidad extendida, impresión 3D y computación cuántica. También analiza límites, riesgos, impacto laboral, privacidad, equidad y criterios para adoptar tecnología responsablemente.',
  keyPoints: [
    'La IA reconoce patrones, predice o genera contenido, pero no toda automatización es inteligencia artificial.',
    'Machine learning aprende de datos; deep learning es una familia basada en redes neuronales profundas.',
    'Entrenamiento e inferencia son etapas distintas y la generalización debe comprobarse con datos no utilizados para aprender.',
    'IoT, redes, cloud, edge, robótica e IA se combinan para construir sistemas inteligentes.',
    'La adopción tecnológica debe evaluar utilidad, seguridad, privacidad, sesgos, impacto social y supervisión humana.',
  ],
  sections: [
    {
      title: '1. Fundamentos de inteligencia artificial',
      body: 'La IA desarrolla sistemas capaces de reconocer patrones, interpretar lenguaje, predecir, recomendar, optimizar o generar contenido. La mayoría de los sistemas actuales son IA estrecha: resuelven tareas específicas y no poseen una comprensión general comparable con la humana.\n\nImportante: no debe confundirse IA con cualquier programa, automatización o robot.',
    },
    {
      title: '2. Machine learning y deep learning',
      body: 'El aprendizaje automático ajusta parámetros a partir de ejemplos. Puede ser supervisado, no supervisado o por refuerzo. El deep learning utiliza redes neuronales con múltiples capas.\n\nConceptos clave: dato, característica, parámetro, entrenamiento, inferencia, sobreajuste y generalización.',
    },
    {
      title: '3. Datos, modelos generativos y lenguaje',
      body: 'La calidad de un sistema depende de la relevancia, diversidad y representatividad de sus datos. Los modelos generativos producen texto, imágenes, audio o código estimando patrones aprendidos.\n\nImportante: pueden alucinar, reproducir sesgos o entregar información desactualizada; sus respuestas deben verificarse.',
    },
    {
      title: '4. IoT, conectividad, nube y edge',
      body: 'IoT conecta sensores y objetos; 5G y otras redes transportan datos; cloud ofrece recursos remotos y edge procesa cerca del origen para reducir latencia. Estas tecnologías forman infraestructuras que permiten servicios y decisiones en tiempo real.',
    },
    {
      title: '5. Robótica y automatización',
      body: 'Un robot combina percepción, decisión y acción física. La automatización puede ejecutar tareas repetitivas o adaptarse mediante software y sensores. Los cobots colaboran con personas.\n\nImportante: un robot puede usar IA, pero robótica e inteligencia artificial no son sinónimos.',
    },
    {
      title: '6. Ciberseguridad e identidad digital',
      body: 'La ciberseguridad protege confidencialidad, integridad y disponibilidad. Los riesgos incluyen phishing, malware, robo de credenciales, ingeniería social y deepfakes. La protección requiere contraseñas seguras, autenticación multifactor, actualizaciones, copias de seguridad y criterio humano.',
    },
    {
      title: '7. Tecnologías emergentes',
      body: 'Blockchain permite registros distribuidos y verificables; realidad virtual y aumentada modifican la interacción con entornos digitales; los gemelos digitales simulan objetos o procesos; la impresión 3D conecta diseño y fabricación; la computación cuántica propone un paradigma especializado de cálculo.',
    },
    {
      title: '8. Impacto y adopción responsable',
      body: 'La tecnología puede elevar productividad, acceso y capacidad de análisis, pero también transformar empleos, ampliar brechas, afectar privacidad y consumir recursos. Una adopción responsable comienza por definir el problema, comparar alternativas, evaluar riesgos y mantener supervisión humana.',
    },
  ],
  hasContent: true,
  status: 'ready',
  provider: 'curated-official-demo-v1',
  errorMessage: null,
  sourceChunksCount: 45,
};

const glossary = existing.glossary.filter(isPedagogicalGlossaryItem);
const buffer = readFileSync(pdfPath);
const extracted = await extractPdfTextAndPageCount(buffer);
const chunks = buildTraceableSummaryChunks(extracted.pages, extracted.text);
const pedagogicalArtifacts = buildPedagogicalArtifacts({
  summary,
  glossary,
  chunks: chunks.map((chunk) => ({
    text: chunk.text,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    sectionTitle: chunk.sectionTitle,
    excerpt: '',
  })),
});

writeFileSync(
  outputPath,
  `${JSON.stringify({ pageCount: extracted.pageCount, summary, glossary, pedagogicalArtifacts }, null, 2)}\n`,
  'utf8'
);

console.log(
  JSON.stringify({
    glossary: glossary.length,
    cards: pedagogicalArtifacts.flashcards.map((card) => card.front),
    questions: pedagogicalArtifacts.questions.length,
  })
);
