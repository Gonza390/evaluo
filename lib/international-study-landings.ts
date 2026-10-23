import type { Metadata } from 'next';
import { toAbsoluteUrl } from '@/lib/site';

export type StudyMarket = 'es' | 'es-mx' | 'es-co' | 'es-es';

type StudyCopy = {
  path: string;
  htmlLang: string;
  country: string;
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  intro: string;
  benefitTitle: string;
  benefitDescription: string;
  exampleLabel: string;
  exampleTopic: string;
  exampleQuestion: string;
  exampleAnswer: string;
  exampleOptions?: string[];
  searchContext: string;
  faqs: { question: string; answer: string }[];
};

export const STUDY_MARKETS: Record<StudyMarket, StudyCopy> = {
  'es': {
    path: '/es/estudiar-pdf-con-ia',
    htmlLang: 'es',
    country: 'Español internacional',
    title: 'Estudiar un PDF con IA: practica y repasa para tus exámenes',
    description: 'Convierte tus apuntes en resúmenes, tarjetas y preguntas de práctica. Descubre qué temas necesitas repasar antes del examen con Evaluo.',
    eyebrow: 'Tu material de estudio, en un solo lugar',
    headline: 'Estudia con tus apuntes y descubre cuánto has aprendido',
    intro: 'Selecciona tu PDF, organiza las ideas principales y practica con preguntas basadas en el documento. Revisa tus errores y vuelve a los temas que necesitas reforzar.',
    benefitTitle: 'No te quedes solo con el resumen: comprueba lo que sabes.',
    benefitDescription: 'Leer ayuda a comprender. Responder sin mirar, corregir errores y regresar al texto original te permite detectar qué necesitas practicar antes del examen.',
    exampleLabel: 'Ejemplo: un capítulo de biología',
    exampleTopic: 'Fotosíntesis',
    exampleQuestion: '¿Por qué la intensidad de luz puede limitar la tasa de fotosíntesis?',
    exampleAnswer: 'Porque la luz aporta la energía necesaria para las reacciones fotosintéticas; cuando escasea, disminuye la capacidad de producir compuestos energéticos.',
    searchContext: 'Estudia tus propios materiales sin depender de apuntes de una universidad concreta.',
    faqs: [
      { question: '¿Puedo estudiar un PDF propio con IA?', answer: 'Sí. Eliges un archivo PDF antes del registro y, después de crear tu cuenta, puedes preparar resúmenes, tarjetas y preguntas sobre ese material.' },
      { question: '¿Evaluo predice las preguntas de mi examen?', answer: 'No. Las actividades se generan para practicar con el contenido de tu documento, no para predecir un examen oficial.' },
      { question: '¿Tengo que pagar para elegir un PDF?', answer: 'Puedes seleccionar el archivo antes de registrarte. La plataforma dispone de una experiencia gratuita con límites de uso.' },
    ],
  },
  'es-mx': {
    path: '/es-mx/estudiar-pdf-con-ia',
    htmlLang: 'es-MX',
    country: 'México',
    title: 'Guía de estudio con IA desde PDF: preguntas y repaso',
    description: 'Crea una guía de estudio desde tus apuntes en PDF: resumen, conceptos, preguntas para tu examen y temas que necesitas reforzar.',
    eyebrow: 'Guía de estudio para tus materias',
    headline: 'Convierte tus apuntes en una guía de estudio con IA',
    intro: 'Sube el PDF de tu materia, repasa los conceptos importantes y practica con preguntas creadas desde el mismo documento. Identifica qué necesitas estudiar para tu próximo examen.',
    benefitTitle: 'Una guía de estudio es más útil cuando también puedes practicar.',
    benefitDescription: 'Del resumen de una unidad puedes pasar a tarjetas y preguntas para comprobar lo que recuerdas. Así descubres dónde necesitas repasar, sin perder la referencia de tus apuntes.',
    exampleLabel: 'Ejemplo: unidad de administración',
    exampleTopic: 'Planeación estratégica',
    exampleQuestion: '¿Por qué conviene definir objetivos antes de elegir las actividades de un proyecto?',
    exampleAnswer: 'Porque los objetivos permiten priorizar acciones, asignar recursos y evaluar si el proyecto avanzó hacia el resultado esperado.',
    searchContext: 'Funciona con el PDF de tu materia o guía de estudio, sin depender de un temario oficial de una institución.',
    faqs: [
      { question: '¿Cómo hacer una guía de estudio con un PDF?', answer: 'Selecciona el PDF de tu materia, crea tu cuenta y utiliza el resumen, el glosario, las tarjetas y los ejercicios para organizar tu repaso.' },
      { question: '¿Sirve para preparar exámenes parciales?', answer: 'Puedes practicar sobre los temas del archivo y revisar las respuestas. No reemplaza las indicaciones del profesor ni garantiza que esas preguntas aparezcan en el examen.' },
      { question: '¿Puedo empezar gratis?', answer: 'Puedes elegir tu PDF sin registrarte; para procesarlo se requiere una cuenta. Evaluo tiene una modalidad gratuita con límites de uso.' },
    ],
  },
  'es-co': {
    path: '/es-co/estudiar-pdf-con-ia',
    htmlLang: 'es-CO',
    country: 'Colombia',
    title: 'Preparar parciales con IA: preguntas desde tus apuntes PDF',
    description: 'Prepara parciales con preguntas basadas en tus apuntes PDF. Practica, revisa tus errores y descubre los temas que necesitas reforzar con Evaluo.',
    eyebrow: 'Tus apuntes para el próximo parcial',
    headline: 'Prepara tus parciales con preguntas de tus propios apuntes',
    intro: 'Selecciona el PDF de tu materia, practica con preguntas sobre su contenido y revisa los temas que necesitas reforzar. Usa el resumen y las tarjetas para repasar antes del parcial.',
    benefitTitle: 'Saber qué corregir puede ser más útil que volver a leer todo.',
    benefitDescription: 'Primero responde preguntas sin mirar el documento. Después contrasta las explicaciones con tus apuntes y vuelve a practicar las partes en las que te equivocaste.',
    exampleLabel: 'Ejemplo: preparación de un parcial de economía',
    exampleTopic: 'Oferta y demanda',
    exampleQuestion: 'Si aumenta la demanda y la oferta permanece igual, ¿qué sucede normalmente con el precio de equilibrio?',
    exampleAnswer: 'En el modelo básico, el precio de equilibrio tiende a aumentar, porque más compradores compiten por una cantidad ofrecida que no cambió.',
    searchContext: 'Practica desde el material de tu curso, sin necesitar un banco de parciales de otra institución.',
    faqs: [
      { question: '¿Puedo crear preguntas para estudiar un parcial?', answer: 'Sí. Evaluo utiliza el contenido de tu PDF para generar actividades de práctica y facilitar el repaso de tus temas.' },
      { question: '¿Las preguntas son parciales oficiales?', answer: 'No. Son preguntas originales de práctica basadas en el documento que proporcionas; no son exámenes oficiales ni una predicción de tu evaluación.' },
      { question: '¿Qué hago después de responder mal?', answer: 'Revisa la explicación, comprueba la información importante en tu PDF y vuelve al tema que necesitas reforzar.' },
    ],
  },
  'es-es': {
    path: '/es-es/estudiar-pdf-con-ia',
    htmlLang: 'es-ES',
    country: 'España',
    title: 'Crear preguntas tipo test con IA desde tus apuntes PDF',
    description: 'Convierte tus apuntes PDF en preguntas para estudiar. Comprueba cuánto sabes, revisa tus errores y repasa el temario de tus exámenes.',
    eyebrow: 'Del temario a la práctica',
    headline: 'Convierte tus apuntes en preguntas tipo test y comprueba cuánto sabes',
    intro: 'Selecciona tus apuntes en PDF, repasa el temario y practica con preguntas sobre el documento. Descubre qué conceptos necesitas revisar antes del examen.',
    benefitTitle: 'Preparar un examen no consiste solo en releer el temario.',
    benefitDescription: 'Pon a prueba tu comprensión con preguntas, revisa las explicaciones y consulta los apartados originales cuando tengas dudas. El mismo PDF sirve para resumir, recordar y practicar.',
    exampleLabel: 'Ejemplo: temario de psicología',
    exampleTopic: 'Memoria de trabajo',
    exampleQuestion: '¿Cuál de estas actividades exige utilizar la memoria de trabajo?',
    exampleOptions: [
      'Recordar automáticamente una contraseña muy conocida.',
      'Mantener varios datos en mente y combinarlos para resolver un problema.',
      'Reconocer una imagen que viste hace años.',
    ],
    exampleAnswer: 'La segunda opción. La memoria de trabajo permite mantener y manipular información de forma temporal para tareas como razonar o resolver problemas; no consiste solo en almacenarla.',
    searchContext: 'Úsalo con tus propios apuntes o un tema concreto de una asignatura, sin depender de una academia o universidad específica.',
    faqs: [
      { question: '¿Puedo crear tests a partir de mis apuntes en PDF?', answer: 'Evaluo genera preguntas para practicar a partir de tu documento. Las actividades son de estudio y no sustituyen los tests oficiales.' },
      { question: '¿Sirve para estudiar un temario largo?', answer: 'Es recomendable trabajar por unidades y contrastar las respuestas con el archivo original, especialmente si incluye tablas, fórmulas o escaneos.' },
      { question: '¿Necesito registrarme antes de seleccionar el PDF?', answer: 'No. Primero seleccionas el archivo y, cuando quieras crear el material de estudio, se solicita una cuenta.' },
    ],
  },
};

export const STUDY_MARKET_ORDER: StudyMarket[] = ['es', 'es-mx', 'es-co', 'es-es'];

export const STUDY_HREFLANG: Record<string, string> = {
  es: toAbsoluteUrl(STUDY_MARKETS.es.path),
  'es-MX': toAbsoluteUrl(STUDY_MARKETS['es-mx'].path),
  'es-CO': toAbsoluteUrl(STUDY_MARKETS['es-co'].path),
  'es-ES': toAbsoluteUrl(STUDY_MARKETS['es-es'].path),
  'es-AR': toAbsoluteUrl('/estudiar-pdf-con-ia'),
  'x-default': toAbsoluteUrl(STUDY_MARKETS.es.path),
};

export function getStudyLandingMetadata(market: StudyMarket): Metadata {
  const content = STUDY_MARKETS[market];
  const url = toAbsoluteUrl(content.path);
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: url, languages: STUDY_HREFLANG },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      title: content.title + ' | Evaluo',
      description: content.description,
      locale: content.htmlLang.replace('-', '_'),
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Evaluo: estudiar con PDF y practicar preguntas' }],
    },
  };
}
