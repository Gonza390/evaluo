import type { Metadata } from 'next';
import { SeoStudyLanding } from '@/components/marketing/seo-study-landing';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/ia-para-estudiantes';

export const metadata: Metadata = {
  title: 'IA para estudiantes: estudiá apuntes y PDFs',
  description:
    'Usá IA para transformar tus apuntes y PDFs en resúmenes, glosarios, flashcards y ejercicios. Estudiá y practicá el mismo material en Evaluo.',
  alternates: {
    canonical: toAbsoluteUrl(path),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    title: 'IA para estudiantes: estudiá tus apuntes con Evaluo',
    description:
      'Transformá tus propios materiales en resúmenes, glosarios, flashcards y ejercicios para estudiar y practicar.',
    url: toAbsoluteUrl(path),
  },
};

export default function IaParaEstudiantesPage() {
  return (
    <SeoStudyLanding
      currentPath={path}
      breadcrumbLabel="IA para estudiantes"
      eyebrow="IA aplicada al estudio"
      titleBefore="Usá IA para estudiar"
      titleAccent="tus propios apuntes"
      description="Subí el material que ya estás estudiando y usalo de distintas maneras: entendé las ideas centrales, repasá conceptos y practicá sobre el mismo contenido sin empezar de cero en cada herramienta."
      proofPoints={[
        'Trabajá sobre tu propio material',
        'Resumen, glosario, flashcards y ejercicios',
        'Estudio y práctica conectados',
      ]}
      featuresHeading="Una IA para estudiar, no una colección de funciones sueltas."
      featuresIntro="Evaluo parte del material que vos elegís. La idea es que cada herramienta mantenga el contexto de lo que estás estudiando y te ayude a avanzar desde la lectura hasta la práctica."
      features={[
        {
          icon: 'file',
          title: 'Estudiá un PDF',
          description: 'Usá un mismo PDF como punto de partida para organizar y trabajar el contenido.',
        },
        {
          icon: 'scan',
          title: 'Entendé lo importante',
          description: 'Pasá del documento completo a un resumen y un glosario centrados en el material.',
        },
        {
          icon: 'cards',
          title: 'Repasá con flashcards',
          description: 'Convertí conceptos del apunte en tarjetas para volver sobre lo que necesitás recordar.',
        },
        {
          icon: 'target',
          title: 'Comprobá qué entendiste',
          description: 'Usá ejercicios sobre el mismo contenido para pasar del repaso a la práctica.',
        },
      ]}
      stepsHeading="Del apunte a una sesión de estudio completa."
      stepsIntro="No hace falta preparar el contenido para cada herramienta. El flujo empieza con tu material y después elegís cómo querés trabajarlo."
      steps={[
        {
          title: 'Subí el PDF que estás estudiando',
          description: 'Elegí tus apuntes, una guía, un capítulo o el material que quieras usar como base de estudio.',
        },
        {
          title: 'Recorré el contenido de distintas formas',
          description: 'Usá el resumen y el glosario para ordenar conceptos, o pasá a flashcards y ejercicios cuando quieras practicar.',
        },
        {
          title: 'Volvé al mismo material cuando lo necesites',
          description: 'Mantené estudio y práctica conectados para no perder el contexto entre una herramienta y otra.',
        },
      ]}
      exampleEyebrow="Un caso concreto"
      exampleHeading="El mismo apunte puede acompañar distintas etapas del estudio."
      exampleDescription="Por ejemplo, si subís material de Marketing I, podés usarlo primero para ubicar los conceptos centrales y después repasar o practicar sin cambiar de fuente."
      exampleItems={[
        {
          label: 'Resumen',
          value: 'Una vista organizada de las ideas principales del material que subiste.',
        },
        {
          label: 'Glosario',
          value: 'Conceptos como segmentación, posicionamiento o propuesta de valor reunidos para repasarlos.',
        },
        {
          label: 'Flashcards',
          value: 'Tarjetas construidas sobre esos conceptos para volver a recordarlos activamente.',
        },
        {
          label: 'Ejercicios',
          value: 'Preguntas de práctica relacionadas con el mismo contenido para comprobar qué entendiste.',
        },
      ]}
      relatedHeading="Elegí la herramienta según lo que necesitás hacer ahora."
      relatedIntro="Cada página cubre una intención distinta. Podés empezar por el flujo completo o ir directo a la función que necesitás."
      relatedLinks={[
        {
          href: '/estudiar-pdf-con-ia',
          title: 'Estudiar un PDF con IA',
          description: 'Convertí un PDF en distintas formas de estudio y práctica dentro de Evaluo.',
        },
        {
          href: '/funciones/resumir-pdf-con-ia',
          title: 'Resumir un PDF con IA',
          description: 'Organizá el contenido del PDF en un resumen pensado para seguir estudiando.',
        },
        {
          href: '/funciones/crear-flashcards-desde-pdf',
          title: 'Crear flashcards desde un PDF',
          description: 'Transformá conceptos del material en tarjetas para repasar.',
        },
      ]}
      faqItems={[
        {
          question: '¿Qué tipo de material puedo usar para estudiar con IA en Evaluo?',
          answer: 'El flujo de estudio de Evaluo permite partir de tus propios PDFs. Elegís el material que querés trabajar y después accedés a las herramientas disponibles sobre ese contenido.',
        },
        {
          question: '¿Qué puede generar Evaluo a partir del material?',
          answer: 'El recorrido actual conecta resumen, glosario, flashcards y ejercicios construidos a partir del contenido que estás estudiando.',
        },
        {
          question: '¿Tengo que usar todas las herramientas?',
          answer: 'No. Podés entrar por la necesidad que tengas en ese momento: entender el material, repasar conceptos o practicar.',
        },
        {
          question: '¿La IA reemplaza el estudio del material?',
          answer: 'No. Evaluo organiza y transforma el contenido para que puedas trabajarlo de distintas maneras. El material sigue siendo la base de la sesión de estudio.',
        },
      ]}
      primaryCtaLabel="Subir mi PDF"
      secondaryCta={{ href: '/estudiar-pdf-con-ia', label: 'Ver cómo estudiar un PDF' }}
      trackingPrefix="seo_ia_estudiantes"
    />
  );
}
