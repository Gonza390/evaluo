import type { Metadata } from 'next';
import { SeoStudyLanding } from '@/components/marketing/seo-study-landing';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/estudiar-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Estudiar un PDF con IA: resumen y flashcards',
  description:
    'Subí un PDF y convertí el mismo material en resumen, glosario, flashcards y ejercicios para estudiar y practicar con IA en Evaluo.',
  alternates: {
    canonical: toAbsoluteUrl(path),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    title: 'Estudiar un PDF con IA | Evaluo',
    description:
      'Transformá tu PDF en resumen, glosario, flashcards y ejercicios para pasar de leer a practicar.',
    url: toAbsoluteUrl(path),
  },
};

export default function EstudiarPdfConIaPage() {
  return (
    <SeoStudyLanding
      currentPath={path}
      breadcrumbLabel="Estudiar PDF con IA"
      eyebrow="Tu PDF como punto de partida"
      titleBefore="Convertí tu PDF en"
      titleAccent="material para estudiar con IA"
      description="No te quedes solamente con el documento abierto. Subí tu PDF y usá su contenido para generar un resumen, revisar conceptos, crear flashcards y practicar ejercicios dentro del mismo recorrido."
      proofPoints={[
        'Un solo PDF como fuente de estudio',
        'Pasá de lectura a práctica',
        'Herramientas conectadas entre sí',
      ]}
      featuresHeading="Cuatro formas de trabajar el mismo PDF."
      featuresIntro="El objetivo no es producir un archivo distinto por cada función, sino ayudarte a reutilizar el mismo contenido según la etapa de estudio en la que estés."
      features={[
        {
          icon: 'file',
          title: 'Resumen',
          description: 'Organizá las ideas principales del documento para hacer una primera lectura más clara.',
        },
        {
          icon: 'book',
          title: 'Glosario',
          description: 'Reuní conceptos y definiciones del material para tenerlos a mano durante el repaso.',
        },
        {
          icon: 'cards',
          title: 'Flashcards',
          description: 'Convertí conceptos del PDF en tarjetas para practicar recuerdo y repaso.',
        },
        {
          icon: 'list',
          title: 'Ejercicios',
          description: 'Poné a prueba lo que entendiste con actividades relacionadas con el contenido cargado.',
        },
      ]}
      stepsHeading="Subí, elegí cómo estudiar y practicá."
      stepsIntro="El recorrido está pensado para que no tengas que copiar y pegar el PDF en distintas herramientas cada vez que cambiás de actividad."
      steps={[
        {
          title: 'Subí el PDF',
          description: 'Elegí el material que querés estudiar y cargalo en tu espacio de Evaluo.',
        },
        {
          title: 'Empezá por la vista que te sirva',
          description: 'Podés abrir el resumen, revisar el glosario o pasar directamente a flashcards según lo que necesites.',
        },
        {
          title: 'Terminá practicando sobre ese contenido',
          description: 'Usá ejercicios para comprobar qué partes del material entendiste y cuáles necesitás repasar otra vez.',
        },
      ]}
      exampleEyebrow="De PDF a sesión de estudio"
      exampleHeading="Un documento deja de ser solo algo para leer."
      exampleDescription="Si el PDF contiene tus apuntes de una unidad, Evaluo puede ayudarte a recorrer ese mismo contenido de formas distintas a medida que avanzás."
      exampleItems={[
        {
          label: 'Entrada',
          value: 'Un PDF con los apuntes, una guía o el capítulo que estás preparando.',
        },
        {
          label: 'Primera pasada',
          value: 'Un resumen para ordenar las ideas y un glosario para ubicar conceptos importantes.',
        },
        {
          label: 'Repaso',
          value: 'Flashcards basadas en el contenido del documento para volver sobre los conceptos.',
        },
        {
          label: 'Práctica',
          value: 'Ejercicios vinculados al material para comprobar qué entendiste antes de seguir.',
        },
      ]}
      relatedHeading="Si tu objetivo es más específico, entrá directo a la función."
      relatedIntro="Estas páginas profundizan en tareas concretas sin mezclar intenciones de búsqueda distintas."
      relatedLinks={[
        {
          href: '/ia-para-estudiantes',
          title: 'IA para estudiantes',
          description: 'Conocé el flujo completo de estudio con IA y cómo se conectan las herramientas de Evaluo.',
        },
        {
          href: '/funciones/resumir-pdf-con-ia',
          title: 'Resumir un PDF con IA',
          description: 'Enfocate en ordenar y entender el contenido antes de pasar a la práctica.',
        },
        {
          href: '/funciones/crear-flashcards-desde-pdf',
          title: 'Crear flashcards desde un PDF',
          description: 'Usá el material para generar tarjetas de repaso sobre sus conceptos.',
        },
      ]}
      faqItems={[
        {
          question: '¿Puedo estudiar un PDF sin convertirlo manualmente a otro formato?',
          answer: 'Sí. El flujo de Evaluo parte del PDF que subís y usa ese material como base para las herramientas de estudio disponibles.',
        },
        {
          question: '¿Evaluo solamente resume el PDF?',
          answer: 'No. Además del resumen, el recorrido actual incluye glosario, flashcards y ejercicios para trabajar el mismo contenido de distintas maneras.',
        },
        {
          question: '¿Puedo ir directo a flashcards o ejercicios?',
          answer: 'Sí. No necesitás seguir un orden obligatorio: elegís la herramienta según la etapa de estudio en la que estés.',
        },
        {
          question: '¿Qué conviene subir?',
          answer: 'Conviene usar el material que realmente estés estudiando: tus apuntes, una guía, un capítulo o un PDF de la materia que quieras trabajar.',
        },
      ]}
      primaryCtaLabel="Estudiar mi PDF"
      secondaryCta={{ href: '/ia-para-estudiantes', label: 'Ver IA para estudiantes' }}
      trackingPrefix="seo_estudiar_pdf_ia"
    />
  );
}
