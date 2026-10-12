import { isolateUntrustedContent, PROMPT_INJECTION_GUARD } from '@/lib/ai/safety';

export function buildStudyErrorReviewPrompt(input: {
  question: string;
  topic: string;
  correctAnswer: string;
  selectedAnswer?: string | null;
  reviewedExplanation?: string | null;
  source: string;
  previousQuestion?: string;
}) {
  return [
    'Creá una comprobación breve de comprensión universitaria basada EXCLUSIVAMENTE en el fragmento recibido.',
    'Evaluá el mismo concepto de la actividad original en una situación diferente. No copies el enunciado ni cambies solamente sinónimos.',
    'Usá la respuesta equivocada para identificar la confusión que hay que comprobar. No supongas otras dificultades del alumno.',
    'Si hay una explicación repasada, evaluá la distinción que enseña con un caso nuevo: no copies su ejemplo ni permitas responder sólo por repetir una frase. La explicación orienta el objetivo; el fragmento del PDF es la única fuente de verdad.',
    'Cambiá también el escenario concreto. Por ejemplo, si la actividad trata una cuenta mental, no vuelvas a preguntar por un cálculo o un problema matemático: aplicá el concepto en otra tarea cotidiana. El caso puede ser hipotético, pero su resolución debe derivarse del fragmento.',
    'Usá español sencillo y voseo argentino. Evitá "según el texto" cuando no aporte al problema.',
    'Pedí aplicar o distinguir el concepto, no reconocer su nombre. El título del tema no debe revelar la respuesta.',
    'Ofrecé exactamente tres opciones plausibles y mutuamente excluyentes, de longitud semejante, con una sola correcta.',
    'Incluí en el caso todas las condiciones necesarias para distinguir la respuesta correcta. Cada distractor debe representar una confusión diferente; no ofrezcas dos paráfrasis de la misma idea equivocada.',
    'Los distractores deben reflejar confusiones del concepto; incluí la confusión de la respuesta equivocada cuando corresponda. No uses alternativas absurdas o ajenas al tema que permitan acertar por descarte superficial.',
    'No uses todas/ninguna de las anteriores. No inventes datos académicos ni dependas de conocimiento fuera del fragmento.',
    'Si no hay evidencia suficiente, o si la respuesta original contradice el fragmento, devolvé {"supported":false}.',
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
