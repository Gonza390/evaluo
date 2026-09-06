import type { Metadata } from 'next';
import { SeoStudyLanding } from '@/components/marketing/seo-study-landing';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/crear-flashcards-desde-pdf';

export const metadata: Metadata = {
  title: 'Crear flashcards desde un PDF con IA',
  description:
    'Convertí conceptos de tu PDF en flashcards para estudiar y repasar con IA. Después seguí practicando el mismo material en Evaluo.',
  alternates: {
    canonical: toAbsoluteUrl(path),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    title: 'Crear flashcards desde un PDF con IA | Evaluo',
    description:
      'Transformá conceptos de tus apuntes en tarjetas de estudio y mantené el repaso conectado con el mismo material.',
    url: toAbsoluteUrl(path),
  },
};

export default function CrearFlashcardsDesdePdfPage() {
  return (
    <SeoStudyLanding
      currentPath={path}
      breadcrumbLabel="Crear flashcards desde PDF"
      eyebrow="Repaso desde tu propio material"
      titleBefore="Convertí tu PDF en"
      titleAccent="flashcards para estudiar"
      description="Subí tus apuntes y usá los conceptos del mismo documento para crear tarjetas de repaso. Después podés volver al resumen, revisar definiciones o pasar a ejercicios sin perder el contexto."
      proofPoints={[
        'Tarjetas basadas en tu PDF',
        'Repaso conectado con el material',
        'Del concepto a la práctica',
      ]}
      featuresHeading="Flashcards que forman parte de una sesión de estudio más completa."
      featuresIntro="La tarjeta sirve mejor cuando sabés de qué material viene y podés volver al concepto original. Por eso el flujo mantiene las flashcards conectadas con el resto del contenido."
      features={[
        {
          icon: 'cards',
          title: 'Conceptos del PDF',
          description: 'Usá términos e ideas presentes en el material que subiste como base del repaso.',
        },
        {
          icon: 'brain',
          title: 'Repaso activo',
          description: 'Intentá recuperar la respuesta antes de verla y detectá qué conceptos todavía necesitás revisar.',
        },
        {
          icon: 'book',
          title: 'Volver al contexto',
          description: 'Si una tarjeta no queda clara, retomá el resumen o el glosario del mismo material.',
        },
        {
          icon: 'target',
          title: 'Pasar a ejercicios',
          description: 'Cuando el concepto ya está más firme, continuá con actividades sobre el contenido trabajado.',
        },
      ]}
      stepsHeading="Del PDF a tarjetas que podés repasar."
      stepsIntro="El objetivo es que la flashcard no quede aislada: empieza en el documento que estás estudiando y sigue conectada con el resto del recorrido."
      steps={[
        {
          title: 'Subí tus apuntes en PDF',
          description: 'Elegí el material del tema, unidad o parcial que querés repasar.',
        },
        {
          title: 'Usá flashcards sobre los conceptos del contenido',
          description: 'Recorré las tarjetas y tratá de responder antes de revelar la información de repaso.',
        },
        {
          title: 'Volvé al material o seguí practicando',
          description: 'Si algo no queda claro, revisá el resumen o glosario; si ya lo dominás, avanzá hacia ejercicios.',
        },
      ]}
      exampleEyebrow="Ejemplo de flashcard"
      exampleHeading="Una tarjeta útil mantiene una relación clara con el tema que estás estudiando."
      exampleDescription="En lugar de generar preguntas desconectadas, la idea es que el repaso siga el contenido del PDF que elegiste como fuente."
      exampleItems={[
        {
          label: 'Tema',
          value: 'Segmentación de mercado dentro de un material de Marketing I.',
        },
        {
          label: 'Frente',
          value: '¿Qué significa segmentar un mercado?',
        },
        {
          label: 'Reverso',
          value: 'Dividir el mercado en grupos con características o necesidades relevantes para analizarlos y elegir a cuáles dirigirse.',
        },
        {
          label: 'Siguiente paso',
          value: 'Volver al resumen si necesitás contexto o continuar con ejercicios relacionados con el mismo contenido.',
        },
      ]}
      relatedHeading="Conectá las flashcards con el resto del estudio."
      relatedIntro="El repaso gana contexto cuando podés volver al documento y moverte entre distintas formas de trabajar el mismo material."
      relatedLinks={[
        {
          href: '/estudiar-pdf-con-ia',
          title: 'Estudiar un PDF con IA',
          description: 'Recorré el flujo completo desde el PDF hasta el resumen, las tarjetas y los ejercicios.',
        },
        {
          href: '/funciones/resumir-pdf-con-ia',
          title: 'Resumir un PDF con IA',
          description: 'Ordená primero las ideas principales y después usalas como contexto para el repaso.',
        },
        {
          href: '/ia-para-estudiantes',
          title: 'IA para estudiantes',
          description: 'Conocé todas las formas de trabajar tus propios apuntes dentro de Evaluo.',
        },
      ]}
      faqItems={[
        {
          question: '¿Las flashcards se crean a partir del PDF que subo?',
          answer: 'Sí. El flujo de estudio parte del material que elegís y usa ese contenido como base para las herramientas disponibles, incluidas las flashcards.',
        },
        {
          question: '¿Puedo volver al resumen desde el mismo material?',
          answer: 'Sí. Resumen, glosario, flashcards y ejercicios forman parte del mismo recorrido de estudio sobre el contenido cargado.',
        },
        {
          question: '¿Tengo que crear las tarjetas una por una?',
          answer: 'El objetivo de esta función es aprovechar el contenido del material para generar tarjetas de estudio sin tener que volver a preparar el mismo apunte desde cero.',
        },
        {
          question: '¿Las flashcards sirven como único método de estudio?',
          answer: 'No tienen por qué usarse solas. En Evaluo podés combinarlas con el resumen, el glosario y los ejercicios del mismo material según lo que necesites repasar.',
        },
      ]}
      primaryCtaLabel="Crear flashcards"
      secondaryCta={{ href: '/estudiar-pdf-con-ia', label: 'Ver el flujo completo' }}
      trackingPrefix="seo_flashcards_pdf"
    />
  );
}
