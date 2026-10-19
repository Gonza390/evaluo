// Evaluación manual acotada: PDF público, sin cuentas ni escritura de contenido del alumno.
// node --env-file=.env.local --import ./tests/alias-loader.mjs --experimental-strip-types scripts/evaluate-study-error-review.mts
import { writeFile } from 'node:fs/promises';
import { generateTutorQuickHelp, generateStudyErrorReviewQuestion } from '../lib/ai-tutor.ts';

const cases = [
  {
    topic: 'Machine learning y deep learning',
    question:
      'Un modelo acierta durante el entrenamiento pero falla con datos nuevos. ¿Qué ocurre?',
    selectedAnswer: 'Generalización correcta',
    correctAnswer: 'Sobreajuste',
    source:
      'Sobreajuste: ocurre cuando el modelo memoriza demasiado los datos de entrenamiento y rinde peor en casos nuevos.',
  },
  {
    topic: 'Machine learning y deep learning',
    question:
      '¿Cómo se llama el uso de un modelo ya entrenado para producir una salida ante una entrada nueva?',
    selectedAnswer: 'Entrenamiento',
    correctAnswer: 'Inferencia',
    source:
      'Inferencia: uso del modelo ya entrenado para producir una salida ante una entrada nueva.',
  },
  {
    topic: 'Datos, modelos generativos y lenguaje',
    question:
      '¿Una respuesta convincente de un modelo de lenguaje garantiza que la información sea correcta?',
    selectedAnswer: 'Sí, si está bien redactada',
    correctAnswer: 'No: puede contener errores o datos inventados',
    source:
      'Sus respuestas pueden parecer razonadas, pero el modelo sigue siendo susceptible de errores, contradicciones y datos inventados.',
  },
];
const results = [];
for (const input of cases) {
  const help = await generateTutorQuickHelp({
    ...input,
    kind: 'why_wrong',
    context: [input.source],
  });
  const question =
    help.provider !== 'fallback-local'
      ? await generateStudyErrorReviewQuestion({ ...input, reviewedExplanation: help.text })
      : null;
  results.push({ input, help, question });
  console.log(
    `${input.correctAnswer}: ayuda=${help.provider !== 'fallback-local'}, pregunta=${Boolean(question)}`
  );
}
await writeFile(
  'docs/progreso-refuerzo-evaluacion-ia.json',
  JSON.stringify({ evaluatedAt: new Date().toISOString(), results }, null, 2)
);
if (results.some((result) => !result.question)) process.exitCode = 1;
