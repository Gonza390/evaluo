import { isolateUntrustedContent, PROMPT_INJECTION_GUARD } from '@/lib/ai/safety';
import { studyGenerationInstruction } from '@/lib/i18n/study-language';
import type { AppLocale } from '@/lib/i18n/app-locale';

export function buildStudyErrorReviewPrompt(input: {
  locale?: AppLocale;
  question: string;
  topic: string;
  correctAnswer: string;
  selectedAnswer?: string | null;
  reviewedExplanation?: string | null;
  source: string;
  previousQuestion?: string;
}) {
  return [
    studyGenerationInstruction(input.locale ?? 'es'),
    'Creá una comprobación breve de comprensión universitaria basada EXCLUSIVAMENTE en el fragmento recibido.',
    'Evaluá el mismo concepto de la actividad original en una situación diferente. No copies el enunciado ni cambies solamente sinónimos.',
    'Usá la respuesta equivocada para identificar la confusión que hay que comprobar. No supongas otras dificultades del alumno.',
    'Si hay una explicación repasada, evaluá la distinción que enseña con un caso nuevo: no copies su ejemplo ni permitas responder sólo por repetir una frase. La explicación orienta el objetivo; el fragmento del PDF es la única fuente de verdad.',
    'Cambiá el escenario o la tarea cognitiva, pero no inventes hechos académicos. En contenidos conceptuales podés plantear un caso breve de interpretación o contrastar dos definiciones presentes en el PDF, sin exigir una situación externa que el fragmento no explica.',
    input.locale === 'en' ? 'Write the student-facing question, options and feedback in English. Keep evidenceQuote verbatim in the source document language.' : 'Usá español sencillo y voseo argentino. Evitá "según el texto" cuando no aporte al problema.',
    'Pedí aplicar o distinguir el concepto, no reconocer su nombre. El título del tema no debe revelar la respuesta.',
    'Ofrecé exactamente tres opciones plausibles y mutuamente excluyentes, de longitud semejante, con una sola correcta.',
    'Incluí en el caso todas las condiciones necesarias para distinguir la respuesta correcta. Cada distractor debe representar una confusión diferente; no ofrezcas dos paráfrasis de la misma idea equivocada.',
    'Los distractores deben reflejar confusiones del concepto; incluí la confusión de la respuesta equivocada cuando corresponda. No uses alternativas absurdas o ajenas al tema que permitan acertar por descarte superficial.',
    'No uses todas/ninguna de las anteriores. No inventes datos académicos ni dependas de conocimiento fuera del fragmento.',
    'Si la respuesta equivocada define otro concepto que también figura en el fragmento, eso NO contradice la respuesta correcta: usá esa diferencia para evaluar la confusión sin revelar la respuesta en el enunciado.',
    'No rechaces la tarea por no encontrar un nuevo escenario factual: un caso hipotético de clasificación o de interpretación entre conceptos respaldados también evalúa comprensión.',
    'Si ni la respuesta correcta ni una distinción verificable pueden sostenerse con el fragmento, o si la respuesta original contradice la fuente, devolvé {"supported":false}.',
    'Devolvé sólo JSON: {"supported":true,"question":"...","options":["...","...","..."],"correctIndex":0,"feedback":"Por qué la correcta se sostiene en el PDF","evidenceQuote":"Cita literal de 20 a 300 caracteres del fragmento"}.',
    PROMPT_INJECTION_GUARD,
    `Tema: ${isolateUntrustedContent(input.topic.slice(0, 300))}`,
    `Actividad original: ${isolateUntrustedContent(input.question.slice(0, 2000))}`,
    `Respuesta original: ${isolateUntrustedContent(input.correctAnswer.slice(0, 1000))}`,
    `Respuesta equivocada del alumno: ${isolateUntrustedContent((input.selectedAnswer ?? '').slice(0, 1000))}`,
    `Explicación repasada: ${isolateUntrustedContent((input.reviewedExplanation ?? '').slice(0, 2400))}`,
    `Evitá repetir esta comprobación anterior: ${isolateUntrustedContent((input.previousQuestion ?? '').slice(0, 1000))}`,
    `Fragmento: ${isolateUntrustedContent(input.source.slice(0, 3000))}`,
  ].join('\n');
}
