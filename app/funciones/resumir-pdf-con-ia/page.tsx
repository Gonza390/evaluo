import type { Metadata } from 'next';
import { SeoStudyLanding } from '@/components/marketing/seo-study-landing';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/resumir-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Resumir PDF con IA para estudiar',
  description:
    'Resumí un PDF con IA y seguí estudiando el mismo contenido con glosario, flashcards y ejercicios en Evaluo.',
  alternates: {
    canonical: toAbsoluteUrl(path),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    title: 'Resumir PDF con IA para estudiar | Evaluo',
    description:
      'Organizá las ideas principales de tu PDF y continuá el estudio con herramientas conectadas al mismo material.',
    url: toAbsoluteUrl(path),
  },
};

export default function ResumirPdfConIaPage() {
  return (
    <SeoStudyLanding
      currentPath={path}
      breadcrumbLabel="Resumir PDF con IA"
      eyebrow="Resumen desde tus apuntes"
      titleBefore="Resumí tu PDF con IA"
      titleAccent="y seguí estudiando"
      description="Usá el resumen para ordenar las ideas principales del material que subiste y, cuando necesites avanzar, pasá al glosario, las flashcards o los ejercicios sin perder el contexto del PDF."
      proofPoints={[
        'Resumen basado en tu material',
        'Conectado con otras herramientas de estudio',
        'Pensado para continuar practicando',
      ]}
      featuresHeading="El resumen es una etapa del estudio, no el destino final."
      featuresIntro="Evaluo usa el PDF como fuente para organizar el contenido y mantenerlo conectado con las herramientas que podés necesitar después."
      features={[
        {
          icon: 'scan',
          title: 'Ideas centrales',
          description: 'Reducí el ruido del documento y recorré una versión más organizada de los puntos principales.',
        },
        {
          icon: 'book',
          title: 'Conceptos relacionados',
          description: 'Usá el glosario para volver sobre términos y definiciones presentes en el mismo material.',
        },
        {
          icon: 'cards',
          title: 'Repaso posterior',
          description: 'Pasá del resumen a flashcards cuando quieras practicar los conceptos que acabás de leer.',
        },
        {
          icon: 'target',
          title: 'Comprobación',
          description: 'Cerrá el recorrido con ejercicios sobre el contenido para revisar qué entendiste.',
        },
      ]}
      stepsHeading="De un PDF largo a una ruta de estudio más clara."
      stepsIntro="No necesitás copiar el texto ni preparar un prompt distinto para cada paso. El documento que subís queda como base del recorrido."
      steps={[
        {
          title: 'Subí el PDF que necesitás estudiar',
          description: 'Partí del documento real de la materia que querés trabajar en ese momento.',
        },
        {
          title: 'Leé el resumen con el material en contexto',
          description: 'Usalo para ubicar temas, ideas principales y relaciones antes de profundizar o repasar.',
        },
        {
          title: 'Seguí con la herramienta que necesites',
          description: 'Abrí el glosario, las flashcards o los ejercicios sin tener que volver a cargar el mismo contenido.',
        },
      ]}
      exampleEyebrow="Ejemplo de uso"
      exampleHeading="Un buen resumen te ayuda a decidir qué revisar después."
      exampleDescription="La utilidad no está en acortar por acortar, sino en organizar el material para que después puedas volver a conceptos concretos y ponerlos en práctica."
      exampleItems={[
        {
          label: 'PDF',
          value: 'Tus apuntes o una guía de la materia que estás preparando.',
        },
        {
          label: 'Resumen',
          value: 'Una estructura más breve de los ejes principales del documento para hacer una primera pasada.',
        },
        {
          label: 'Después',
          value: 'Abrís el glosario si necesitás aclarar términos o pasás a flashcards para repasar conceptos.',
        },
        {
          label: 'Práctica',
          value: 'Usás ejercicios sobre el mismo material para comprobar si el resumen realmente quedó entendido.',
        },
      ]}
      relatedHeading="Seguí trabajando el mismo material."
      relatedIntro="El resumen puede ser tu primera entrada, pero el resto del cluster te permite continuar sin cambiar de contexto."
      relatedLinks={[
        {
          href: '/estudiar-pdf-con-ia',
          title: 'Estudiar un PDF con IA',
          description: 'Mirá el recorrido completo desde el documento hasta el repaso y la práctica.',
        },
        {
          href: '/funciones/crear-flashcards-desde-pdf',
          title: 'Crear flashcards desde un PDF',
          description: 'Convertí conceptos del documento en tarjetas para volver a repasarlos.',
        },
        {
          href: '/ia-para-estudiantes',
          title: 'IA para estudiantes',
          description: 'Conocé cómo se conectan las distintas herramientas de estudio dentro de Evaluo.',
        },
      ]}
      faqItems={[
        {
          question: '¿El resumen se basa en el PDF que subo?',
          answer: 'Sí. El flujo parte del material que elegís para estudiar y usa ese contenido como base de la herramienta de resumen.',
        },
        {
          question: '¿Puedo usar el mismo PDF para hacer flashcards después?',
          answer: 'Sí. Evaluo conecta el material con distintas vistas de estudio, entre ellas resumen, glosario, flashcards y ejercicios.',
        },
        {
          question: '¿Tengo que leer solamente el resumen?',
          answer: 'No. El resumen está pensado como una forma de organizar el contenido. El PDF original sigue siendo la fuente y podés volver a él cuando lo necesites.',
        },
        {
          question: '¿Sirve para preparar un parcial?',
          answer: 'Puede ayudarte a ordenar el material que estás preparando y a continuar con herramientas de repaso y práctica sobre ese mismo contenido.',
        },
      ]}
      primaryCtaLabel="Resumir mi PDF"
      secondaryCta={{ href: '/estudiar-pdf-con-ia', label: 'Ver el flujo completo' }}
      trackingPrefix="seo_resumir_pdf_ia"
    />
  );
}
