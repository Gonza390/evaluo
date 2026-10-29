import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, FileText, ListChecks, Sparkles, Target, UploadCloud } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';

type Step = { title: string; description: string };
type Faq = { question: string; answer: string };
type PageContent = {
  path: string;
  tracking: string;
  source: string;
  eyebrow: string;
  titlePrefix: string;
  titleAccent: string;
  intro: string;
  heroFacts: string[];
  exampleLabel: string;
  exampleContext: string;
  exampleQuestion: string;
  exampleAnswer: string;
  stepsTitle: string;
  stepsDescription: string;
  steps: Step[];
  whenTitle: string;
  whenIntro: string;
  useCases: Step[];
  qualityTitle: string;
  qualityDescription: string;
  quality: Step[];
  faqTitle: string;
  faqs: Faq[];
  uploaderTitle: string;
  uploaderDescription: string;
  ctaLabel: string;
};

const MOCK: PageContent = {
  path: '/funciones/simulacro-examen-con-ia',
  tracking: 'seo_simulacro_examen_ia',
  source: 'simulacro-examen-con-ia',
  eyebrow: 'Práctica de examen desde tus apuntes',
  titlePrefix: 'Simulacro de examen con IA:',
  titleAccent: 'poné a prueba lo que estudiaste',
  intro:
    'Prepará un simulacro de examen con IA a partir de tus apuntes PDF. En Evaluo podés estudiar los temas, responder preguntas para practicar un parcial o final y revisar resultados y errores para decidir qué reforzar. La práctica no reemplaza una evaluación oficial.',
  heroFacts: ['Trabajá con tus propios apuntes', 'Respondé sin mirar la solución', 'Revisá errores y temas a reforzar'],
  exampleLabel: 'Ejemplo ilustrativo · Marketing I',
  exampleContext: 'Preparación de un parcial · Segmentación',
  exampleQuestion: 'Una empresa quiere ofrecer un producto a públicos con necesidades distintas. ¿Por qué convendría investigar segmentos antes de elegir su mensaje?',
  exampleAnswer: 'La segmentación permite identificar grupos relevantes, comparar sus necesidades y adaptar la propuesta a un público definido. No consiste solo en dividir una lista de clientes.',
  stepsTitle: 'Cómo preparar un simulacro de examen con IA',
  stepsDescription:
    'Un simulacro sirve para comprobar si podés recuperar y aplicar lo aprendido sin consultar los apuntes. Para que sea útil, la corrección debe llevarte de vuelta al material.',
  steps: [
    { title: 'Elegí el PDF que entra en el examen', description: 'Usá el apunte, guía o capítulo que realmente necesitás rendir. Revisá qué temas están incluidos antes de practicar.' },
    { title: 'Estudiá y respondé las preguntas', description: 'Creá tu material en Evaluo y avanzá hacia los ejercicios o simulador disponible. Intentá responder sin ayuda del resumen.' },
    { title: 'Revisá los resultados', description: 'Distinguí los aciertos de las dudas. Consultá las explicaciones, ubicá el tema de cada error y prepará una nueva práctica.' },
  ],
  whenTitle: 'Cuándo conviene hacer un simulacro y cuándo practicar por tema',
  whenIntro:
    'El simulacro es útil para ensayar una instancia de examen. Si descubrís una dificultad específica, conviene dejar la práctica general y trabajar directamente ese tema.',
  useCases: [
    { title: 'Antes del parcial o final', description: 'Probá si podés recuperar definiciones, comparar conceptos y resolver casos sin tener el PDF abierto. El resultado es orientativo, no una predicción de tu nota.' },
    { title: 'Después de estudiar varios temas', description: 'Comprobá si podés conectar ideas de distintas unidades. Revisá qué áreas necesitan más estudio antes de continuar.' },
    { title: 'Cuando fallás repetidamente', description: 'No repitas una evaluación general de inmediato: repasá los conceptos que te cuestan y volvé a practicar con preguntas del tema.' },
  ],
  qualityTitle: 'Qué hace que un simulacro te ayude a estudiar',
  qualityDescription:
    'No se trata de reunir muchas preguntas por reunirlas. Una práctica útil tiene relación con el programa de la materia y permite interpretar los errores.',
  quality: [
    { title: 'Cobertura del contenido', description: 'Comprobá que las preguntas representen los temas importantes del PDF y no solamente su primera sección.' },
    { title: 'Diferentes niveles', description: 'Combiná reconocimiento, explicación, comparación y aplicación. Memorizar una definición no equivale a resolver un caso.' },
    { title: 'Corrección verificable', description: 'Contrastá explicaciones, cifras, fórmulas y excepciones con tus apuntes: una pregunta generada por IA puede contener errores.' },
    { title: 'Un siguiente paso claro', description: 'Usá los resultados para decidir si conviene repasar una definición, practicar un tema o pasar al siguiente capítulo.' },
  ],
  faqTitle: 'Preguntas frecuentes sobre simulacros con IA',
  faqs: [
    { question: '¿Puedo preparar un examen desde mi propio PDF?', answer: 'Sí. Evaluo permite subir tus apuntes en PDF y generar materiales para estudiar y practicar con ese documento. La experiencia disponible depende del material y las funciones habilitadas en tu plan.' },
    { question: '¿Un simulacro predice qué nota voy a sacar?', answer: 'No. El resultado sirve como referencia de estudio; no sustituye una evaluación oficial ni garantiza el rendimiento del día del examen.' },
    { question: '¿Es mejor estudiar por tema o hacer un simulacro?', answer: 'Son tareas complementarias. Practicar por tema ayuda a corregir dificultades específicas; una práctica de examen te permite comprobar cómo respondés sin consultar el material.' },
    { question: '¿Qué hago si me equivoco en muchas preguntas?', answer: 'Identificá los conceptos en los que fallaste, volvé al PDF o al resumen y repetí una práctica del tema. Evitá memorizar las respuestas del intento anterior.' },
    { question: '¿Puedo usarlo para un parcial universitario?', answer: 'Podés usar tus apuntes de universidad como material de estudio. Las preguntas generadas son de práctica, no exámenes oficiales de tu institución.' },
  ],
  uploaderTitle: 'Prepará tu próxima práctica con tus apuntes',
  uploaderDescription:
    'Seleccioná tu PDF antes de registrarte. Después podrás crear el material y elegir el recorrido de estudio y práctica disponible para tus temas.',
  ctaLabel: 'Elegir PDF para practicar',
};

const TOPIC: PageContent = {
  path: '/funciones/practicar-por-tema',
  tracking: 'seo_practicar_por_tema',
  source: 'practicar-por-tema',
  eyebrow: 'Estudio por tema · diagnóstico y refuerzo',
  titlePrefix: 'Practicar por tema con IA:',
  titleAccent: 'enfocate en lo que te cuesta',
  intro:
    'Si necesitás practicar preguntas de un tema con IA, no hace falta repetir el PDF entero. Elegí el capítulo de tus apuntes que querés trabajar: Evaluo te ayuda a responder ejercicios, revisar explicaciones y reforzar lo que todavía no dominás.',
  heroFacts: ['Elegí un tema concreto', 'Respondé preguntas de ese tema', 'Reforzá tus errores y continuá'],
  exampleLabel: 'Ejemplo ilustrativo · Marketing I',
  exampleContext: 'Tema 02 · Segmentación de mercados',
  exampleQuestion: '¿En qué se diferencia un segmento de mercado de un mercado objetivo?',
  exampleAnswer: 'Un segmento es un grupo con características o necesidades compartidas; el mercado objetivo es el segmento o conjunto de segmentos que una empresa decide atender.',
  stepsTitle: 'Cómo estudiar y practicar un PDF tema por tema',
  stepsDescription:
    'Este recorrido evita estudiar todo con la misma intensidad: primero detectás qué conocés, después practicás y, por último, reforzás las dificultades.',
  steps: [
    { title: 'Subí tus apuntes', description: 'Seleccioná el PDF de la materia para tener una referencia común en resúmenes, conceptos y ejercicios.' },
    { title: 'Elegí el tema que vas a trabajar', description: 'Revisá el apartado del resumen o empezá por la práctica si ya conocés el contenido. Respondé sin consultar las soluciones.' },
    { title: 'Interpretá el resultado y reforzá', description: 'Volvé a los conceptos de las preguntas que no pudiste resolver. Cuando estés listo, repetí la práctica o seguí con otro tema.' },
  ],
  whenTitle: 'Por qué practicar un tema es distinto de releer todo el PDF',
  whenIntro:
    'Leer suele dar sensación de familiaridad, pero responder exige recuperar información de memoria. Acotar la práctica a un tema permite saber con más precisión qué necesitás revisar.',
  useCases: [
    { title: 'Cuando empezás un capítulo', description: 'Probá qué recordás antes de profundizar. Así podés concentrarte en definiciones o relaciones que todavía no entendés.' },
    { title: 'Después del resumen o las flashcards', description: 'Usá preguntas que te exijan explicar y aplicar conceptos. Las tarjetas ayudan a recordar; los ejercicios comprueban cómo los utilizás.' },
    { title: 'Después de una práctica con errores', description: 'Agrupá las dificultades por tema. Un repaso dirigido puede ser más útil que volver a leer todo el documento.' },
  ],
  qualityTitle: 'Ejemplo de práctica por tema: segmentación de mercados',
  qualityDescription:
    'Las preguntas de una misma unidad pueden evaluar habilidades distintas. Este ejemplo es didáctico y no se generó desde un archivo real.',
  quality: [
    { title: 'Recordar', description: '¿Qué significa segmentar un mercado? Intentá definir el concepto con tus palabras antes de revisar la fuente.' },
    { title: 'Comparar', description: '¿Qué diferencia hay entre segmentar por edad y segmentar por hábitos de consumo?' },
    { title: 'Aplicar', description: 'Si una marca vende productos para distintos niveles de actividad física, ¿qué criterio usarías para definir grupos y por qué?' },
    { title: 'Corregir', description: 'Si confundiste un criterio con un segmento, revisá la definición en el PDF y respondé una pregunta nueva.' },
  ],
  faqTitle: 'Preguntas frecuentes sobre estudiar por temas',
  faqs: [
    { question: '¿Puedo practicar un solo tema de mi PDF?', answer: 'Sí. Evaluo organiza el recorrido por temas para que puedas trabajar una parte del material sin tener que empezar siempre desde el principio.' },
    { question: '¿Cuántas preguntas conviene responder por tema?', answer: 'La cantidad depende del contenido y de tu objetivo. Es importante que las preguntas sean variadas, tengan explicaciones y permitan comprobar lo aprendido; más preguntas no implica necesariamente mejor estudio.' },
    { question: '¿Qué hago si ya entiendo el tema?', answer: 'Podés comenzar directamente por una práctica, comprobar tus respuestas y pasar al siguiente tema si los resultados acompañan.' },
    { question: '¿Qué pasa si me equivoco?', answer: 'Revisá la explicación, buscá el concepto en tus apuntes y probá nuevamente. Los errores pueden orientar qué reforzar en lugar de obligarte a repetir todo el PDF.' },
    { question: '¿En qué se diferencia de hacer un simulacro?', answer: 'Una práctica por tema acota la dificultad a un capítulo o concepto. Un simulacro busca ensayar una instancia más amplia de examen. Podés combinar ambos enfoques.' },
  ],
  uploaderTitle: 'Empezá por el tema que necesitás estudiar',
  uploaderDescription:
    'Elegí tu PDF antes de crear una cuenta. Después seguí el recorrido por temas: comprensión, preguntas, resultado y refuerzo.',
  ctaLabel: 'Elegir PDF para estudiar por tema',
};

const related = [
  { href: '/convertir-pdf-en-preguntas', title: 'Generar preguntas desde PDF', description: 'Transformá el material en preguntas que te ayuden a recuperar y aplicar conceptos.' },
  { href: '/funciones/simulacro-examen-con-ia', title: 'Simulacro de examen con IA', description: 'Ensayá cómo respondés y decidí qué temas conviene volver a estudiar.' },
  { href: '/funciones/practicar-por-tema', title: 'Practicar por tema', description: 'Concentrá las preguntas en los conceptos que necesitás reforzar.' },
  { href: '/funciones/resumir-pdf-con-ia', title: 'Resumir PDF con IA', description: 'Ubicá las ideas principales y conservá el material como referencia.' },
];

function Landing({ page }: { page: PageContent }) {
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <MarketingAnalyticsSlot />
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Evaluo', path: '/' }, { name: page.titlePrefix.replace(':', ''), path: page.path }])} />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader primaryHref="/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1" trackingLocation={page.tracking + '_header'} />
      </div>
      <main>
        <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.15),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />{page.eyebrow}
              </span>
              <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[60px]">
                {page.titlePrefix} <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">{page.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">{page.intro}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <TrackedLink
                  href="#elegir-pdf"
                  eventName="cta_click"
                  payload={{ location: page.tracking + '_hero', cta_name: 'elegir_pdf', destination: '#elegir-pdf' }}
                  className="from-brand to-brand-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />{page.ctaLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
                <Link href="/demo/material-estudio" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-700">Ver una demo de estudio</Link>
              </div>
              <ul className="mt-8 grid gap-2 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                {page.heroFacts.map((fact) => <li key={fact} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />{fact}</li>)}
              </ul>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.09)] sm:p-7">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FileText className="h-5 w-5" aria-hidden="true" /></span>
                <div><p className="text-xs font-semibold text-slate-500">{page.exampleLabel}</p><p className="text-sm font-bold text-slate-950">{page.exampleContext}</p></div>
              </div>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Pregunta de práctica</p>
              <h2 className="mt-3 text-lg font-bold leading-7 text-slate-950">{page.exampleQuestion}</h2>
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <p className="text-xs font-bold text-blue-700">Explicación orientativa</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{page.exampleAnswer}</p>
              </div>
              <p className="mt-5 text-xs leading-6 text-slate-500">Ejemplo educativo elaborado para esta página; no muestra preguntas ni resultados de usuarios.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 py-16 sm:py-20" aria-labelledby="pasos-practica">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">01 / Cómo funciona</span>
            <h2 id="pasos-practica" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.stepsTitle}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{page.stepsDescription}</p>
            <ol className="mt-9 grid gap-4 lg:grid-cols-3">
              {page.steps.map((step, i) => <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="text-sm font-black text-blue-700">0{i + 1}</span><h3 className="mt-4 text-lg font-bold text-slate-950">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-slate-50/60 py-16 sm:py-20">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">02 / Elegí el método</span>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.whenTitle}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{page.whenIntro}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {page.useCases.map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6"><Target className="h-5 w-5 text-blue-700" aria-hidden="true" /><h3 className="mt-4 text-base font-bold text-slate-950">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p></article>)}
            </div>
            <p className="mt-7 max-w-3xl text-sm leading-7 text-slate-700">
              Para generar preguntas sobre tus apuntes, empezá por <Link href="/convertir-pdf-en-preguntas" className="font-semibold text-blue-700 underline underline-offset-4">convertir el PDF en preguntas</Link>. Si querés otra modalidad, consultá <Link href={page.path === MOCK.path ? TOPIC.path : MOCK.path} className="font-semibold text-blue-700 underline underline-offset-4">{page.path === MOCK.path ? 'cómo practicar por tema' : 'cómo preparar un simulacro de examen'}</Link>.
            </p>
          </div>
        </section>

        <section className="border-b border-slate-100 py-16 sm:py-20">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">03 / Guía práctica</span>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.qualityTitle}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{page.qualityDescription}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {page.quality.map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 p-6"><ListChecks className="h-5 w-5 text-blue-700" aria-hidden="true" /><h3 className="mt-4 text-base font-bold text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="elegir-pdf" className="scroll-mt-24 border-b border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1120px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">04 / Tu material</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.uploaderTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{page.uploaderDescription}</p>
              <p className="mt-5 text-sm leading-7 text-slate-600"><BookOpen className="mr-2 inline h-4 w-4 text-blue-700" aria-hidden="true" />Tus preguntas se basan en tu propio material; comprobá siempre la información importante con la fuente original.</p>
            </div>
            <PdfFirstLandingUploader trackingLocation={page.tracking} sourceKey={page.source} />
          </div>
        </section>

        <section className="border-b border-slate-100 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1080px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div><span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">05 / Preguntas frecuentes</span><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.faqTitle}</h2></div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {page.faqs.map((faq) => <details key={faq.question} className="py-5"><summary className="cursor-pointer pr-3 text-sm font-bold text-slate-950">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Otras formas de estudiar con el mismo PDF</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {related.filter((item) => item.href !== page.path).map((item) => <Link key={item.href} href={item.href} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-200"><h3 className="text-base font-bold text-slate-950 group-hover:text-blue-700">{item.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-700">Conocer la herramienta <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link>)}
            </div>
          </div>
        </section>
      </main>
      <FooterHome />
    </div>
  );
}

export function SimulacroExamenIaLanding() {
  return <Landing page={MOCK} />;
}

export function PracticarPorTemaLanding() {
  return <Landing page={TOPIC} />;
}
