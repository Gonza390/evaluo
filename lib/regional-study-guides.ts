import type { StudyMarket } from '@/lib/international-study-landings';

type GuideStep = { title: string; description: string };
type Guide = {
  question: string;
  approach: string;
  guideTitle: string;
  guideIntro: string;
  steps: GuideStep[];
  mistakesTitle: string;
  mistakes: GuideStep[];
  selfCheckTitle: string;
  selfCheckIntro: string;
  selfCheckQuestions: string[];
};

export const REGIONAL_STUDY_GUIDES: Record<StudyMarket, Guide> = {
  es: {
    question: '¿Cómo estudiar un PDF con IA sin limitarte a leer un resumen?',
    approach: 'Empieza con un documento propio: un capítulo de un libro, una presentación exportada a PDF o los apuntes de una materia. No necesitas buscar un banco de preguntas de otra institución.',
    guideTitle: 'Un método práctico para estudiar cualquier PDF',
    guideIntro: 'El objetivo no es producir más documentos, sino transformar la lectura en comprensión y práctica. Puedes seguir este recorrido con una unidad concreta y adaptarlo al tiempo disponible.',
    steps: [
      { title: 'Delimita un tema', description: 'Busca un capítulo con una idea central identificable. Si el archivo tiene muchos temas, trabaja una unidad cada vez para poder relacionar las preguntas con la fuente.' },
      { title: 'Comprueba los conceptos', description: 'Lee el resumen y localiza en el PDF las definiciones, fórmulas o datos que resulten importantes. El resumen ayuda a orientarse, pero no reemplaza el texto original.' },
      { title: 'Recuerda sin consultar', description: 'Oculta el material e intenta explicar dos conceptos con tus palabras. Después utiliza tarjetas o preguntas para poner a prueba lo que recuerdas.' },
      { title: 'Corrige y repite más adelante', description: 'Cuando una respuesta falle, identifica el apartado que debes revisar y programa otra sesión breve de práctica. Volver a intentarlo permite comprobar si entendiste el tema.' },
    ],
    mistakesTitle: 'Errores habituales al estudiar archivos PDF',
    mistakes: [
      { title: 'Confiar solo en un resumen', description: 'Puedes reconocer una explicación al leerla y aun así no ser capaz de responder una pregunta sobre ella. Combina la lectura con preguntas sin mirar.' },
      { title: 'Estudiar el archivo entero de una vez', description: 'Si mezclas temas sin delimitar, es más difícil comprender de dónde viene cada error. Prioriza capítulos o unidades.' },
      { title: 'Aceptar cualquier respuesta de IA', description: 'Contrasta fechas, cifras, fórmulas y afirmaciones importantes con el documento original. Un PDF escaneado también puede contener errores de extracción.' },
    ],
    selfCheckTitle: 'Comprueba si dominas el tema',
    selfCheckIntro: 'Antes de cerrar la sesión, intenta responder estas preguntas sin mirar el texto.',
    selfCheckQuestions: ['¿Puedo explicar la idea central con mis propias palabras?', '¿Sé aplicar el concepto a un ejemplo nuevo?', '¿Qué apartado del PDF consultaré si me equivoco?', '¿Cuándo volveré a practicar este tema?'],
  },
  'es-mx': {
    question: '¿Cómo crear una guía de estudio con IA a partir de tus apuntes?',
    approach: 'Una guía útil no es únicamente una lista de definiciones. Debe ayudarte a identificar los temas del examen, organizar conceptos y practicar preguntas sobre tu propia materia.',
    guideTitle: 'De tus apuntes a una guía de estudio que puedas utilizar',
    guideIntro: 'Si tienes un PDF con varias unidades, no empieces memorizando cada párrafo. Construye un recorrido breve: entender los conceptos, reconocer las relaciones y comprobar si puedes aplicarlos.',
    steps: [
      { title: 'Identifica las unidades del examen', description: 'Separa el PDF por temas y revisa qué conceptos corresponden a la evaluación. Si tu profesor dio una lista de contenidos, utilízala como referencia principal.' },
      { title: 'Prepara el resumen de una unidad', description: 'Conserva definiciones y relaciones importantes, y anota qué términos necesitas consultar en el glosario. No copies el resumen sin contrastarlo con los apuntes.' },
      { title: 'Transforma la guía en preguntas', description: 'Utiliza tarjetas para recordar ideas y ejercicios para aplicar los conceptos a situaciones nuevas. Una pregunta de aplicación revela dudas que una simple relectura no muestra.' },
      { title: 'Prioriza lo que necesitas reforzar', description: 'Después de responder, revisa el contenido en el que fallaste y vuelve a practicarlo. No necesitas empezar de cero con toda la materia cada vez.' },
    ],
    mistakesTitle: 'Qué conviene evitar al preparar una guía de estudio',
    mistakes: [
      { title: 'Memorizar conceptos sin ejemplos', description: 'Conocer una definición no garantiza poder utilizarla. Para cada unidad, intenta resolver al menos una situación que requiera aplicar el tema.' },
      { title: 'Usar guías ajenas como única referencia', description: 'El temario y la forma de evaluar pueden cambiar entre cursos. Comienza por el PDF o los apuntes de tu propia materia.' },
      { title: 'Practicar solo una vez', description: 'Repite los temas que te costaron en otra sesión. El repaso espaciado puede ser más útil que concentrar toda la preparación en una sola jornada.' },
    ],
    selfCheckTitle: 'Lista para revisar tu guía de estudio',
    selfCheckIntro: 'Antes del examen, comprueba si tu guía realmente te ayuda a responder.',
    selfCheckQuestions: ['¿Sé qué unidades entran en el examen?', '¿Puedo explicar cada término sin copiar el resumen?', '¿Respondí preguntas que aplican los conceptos?', '¿Tengo claro qué tema repasaré primero?'],
  },
  'es-co': {
    question: '¿Cómo practicar para un parcial usando tus propios apuntes?',
    approach: 'En lugar de buscar preguntas de un examen que puede tener otro temario, utiliza el contenido que debes estudiar y conviértelo en una práctica de recuperación, revisión y refuerzo.',
    guideTitle: 'Prepara un parcial con un ciclo corto de práctica y corrección',
    guideIntro: 'Organiza el material por temas y prueba lo que recuerdas antes de volver a leer. Así sabrás qué partes del curso requieren otra sesión de estudio.',
    steps: [
      { title: 'Elige el tema del parcial', description: 'Selecciona un capítulo, una unidad o un conjunto de apuntes concreto. Confirma qué temas anunció el docente y usa ese alcance para organizar tu preparación.' },
      { title: 'Responde antes de revisar la explicación', description: 'Intenta resolver una pregunta sin abrir el resumen. Si dudas, escribe brevemente por qué elegiste esa respuesta: te ayudará a localizar el concepto que falta comprender.' },
      { title: 'Contrasta los errores con el PDF', description: 'No te quedes en acertar o fallar. Revisa la explicación y comprueba el apartado del documento que la sustenta, especialmente cuando haya cifras o conceptos técnicos.' },
      { title: 'Refuerza primero los temas difíciles', description: 'Después de practicar, dedica el siguiente repaso a los conceptos con errores. Vuelve a responder preguntas para comprobar si pudiste corregirlos.' },
    ],
    mistakesTitle: 'Tres errores que pueden hacerte perder tiempo antes de un parcial',
    mistakes: [
      { title: 'Estudiar solo lo que resulta familiar', description: 'Los temas conocidos producen sensación de avance. Reserva tiempo para responder preguntas de las unidades que todavía cuestan.' },
      { title: 'Buscar respuestas de un parcial ajeno', description: 'Las preguntas externas pueden usar otro programa o enfoque. Usa tu material del curso como fuente de práctica.' },
      { title: 'Interpretar un error como una nota final', description: 'Una respuesta incorrecta es información para repasar, no una predicción de tu calificación. Vuelve al concepto y repite el ejercicio.' },
    ],
    selfCheckTitle: 'Antes de presentar el parcial',
    selfCheckIntro: 'Una revisión rápida ayuda a organizar la última sesión sin prometer una nota.',
    selfCheckQuestions: ['¿Reconozco el tema en el que más me equivoco?', '¿Puedo justificar mis respuestas con el contenido del curso?', '¿Estoy practicando sin mirar el material?', '¿Tengo tiempo reservado para revisar mis errores?'],
  },
  'es-es': {
    question: '¿Cómo preparar un examen tipo test a partir de un temario en PDF?',
    approach: 'Practicar preguntas sobre tus apuntes sirve para comprobar si recuerdas y aplicas los conceptos. Un test de práctica no reproduce necesariamente la estructura ni las preguntas de tu examen oficial.',
    guideTitle: 'Del temario a las preguntas de práctica: método de repaso',
    guideIntro: 'Si tu asignatura incluye evaluaciones tipo test, alterna comprensión y recuperación: entiende primero los conceptos, responde sin consultar y analiza por qué una respuesta es adecuada.',
    steps: [
      { title: 'Separa el temario por bloques', description: 'Trabaja una parte concreta del PDF. Identifica definiciones, diferencias entre conceptos y ejemplos que puedan convertirse en preguntas de comprensión.' },
      { title: 'Resume para orientarte, no para memorizar', description: 'Utiliza el resumen y el mapa mental para detectar relaciones. Vuelve al archivo cuando necesites comprobar una explicación o una excepción.' },
      { title: 'Responde preguntas sin consultar', description: 'Pon a prueba lo que recuerdas; si hay opciones de respuesta, justifica también por qué descartas las alternativas. No te limites a reconocer palabras del temario.' },
      { title: 'Revisa los fallos y repite', description: 'Anota qué concepto explica el error y vuelve a él con el documento original. Practica de nuevo en otra sesión, sin confiar en que leer la solución equivale a aprenderla.' },
    ],
    mistakesTitle: 'Errores frecuentes al estudiar para una prueba tipo test',
    mistakes: [
      { title: 'Memorizar solo la opción correcta', description: 'Es fácil recordar la forma de una respuesta y fallar si cambia el enunciado. Intenta explicar el concepto y reconocerlo en otra situación.' },
      { title: 'Confundir preguntas generadas con exámenes oficiales', description: 'Evaluo crea actividades de práctica sobre tus apuntes. Comprueba siempre los criterios de evaluación de la asignatura.' },
      { title: 'Ignorar los apartados con tablas o fórmulas', description: 'La extracción automática de un PDF puede cometer errores. Contrasta símbolos, tablas y datos importantes antes de dar una respuesta por válida.' },
    ],
    selfCheckTitle: 'Antes de cerrar el repaso del temario',
    selfCheckIntro: 'Estas comprobaciones funcionan tanto para preguntas tipo test como para ejercicios de comprensión.',
    selfCheckQuestions: ['¿Puedo razonar por qué una respuesta es correcta?', '¿Conozco las excepciones y matices del concepto?', '¿Soy capaz de resolver una pregunta con otro enunciado?', '¿Qué apartado debo repasar antes del examen?'],
  },
};
