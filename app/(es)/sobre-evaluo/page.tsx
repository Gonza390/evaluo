import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, FileText, Sparkles, Target } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildOrganizationJsonLd, buildSoftwareApplicationJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/sobre-evaluo';
const startHref = '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';

export const metadata: Metadata = {
  title: 'Qué es Evaluo: estudiá tus apuntes con IA y prepará tus exámenes',
  description: 'Conocé Evaluo: convertí tus apuntes PDF o Word en resúmenes, preguntas y flashcards. Practicá por tema, revisá errores y organizá tu plan de estudio.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Evaluo',
    locale: 'es_AR',
    url: toAbsoluteUrl(path),
    title: 'Sobre Evaluo | De tus apuntes a una preparación más clara',
    description: 'Cómo funciona Evaluo: comprendé, practicá, revisá errores y avanzá tema por tema con tus propios apuntes.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Evaluo, plataforma de estudio con IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qué es Evaluo y cómo funciona',
    description: 'Estudiá con tus apuntes y descubrí qué temas necesitás reforzar.',
    images: ['/opengraph-image.png'],
  },
};

const journey = [
  {
    number: '01', title: 'Subí tu material',
    description: 'Empezá desde tus propios apuntes en PDF o Word (DOCX). No hace falta que tu universidad o materia esté en un catálogo.',
  },
  {
    number: '02', title: 'Comprendé tema por tema',
    description: 'Explorá un resumen organizado por temas. Podés consultar conceptos clave y volver al documento original.',
  },
  {
    number: '03', title: 'Elegí cómo comenzar',
    description: 'Si no estudiaste, empezá por el resumen y una comprobación breve. Si ya tenés una base, podés comenzar con el diagnóstico.',
  },
  {
    number: '04', title: 'Practicá y corregí',
    description: 'Respondé preguntas sobre tus apuntes y el tema que preparás. Usá también flashcards, glosario, casos y otras actividades.',
  },
  {
    number: '05', title: 'Detectá qué reforzar',
    description: 'Revisá las respuestas corregidas y los errores. El progreso diferencia entre temas sin evaluar, en progreso y dominados según la práctica.',
  },
  {
    number: '06', title: 'Organizá tus repasos',
    description: 'Usá la fecha del examen y el tiempo disponible para planificar sesiones y repasos desde el plan de estudio y el calendario.',
  },
];

const features = [
  ['Resúmenes por temas', 'Ordená un documento extenso en una lectura más clara antes de practicar.', '/funciones/resumir-pdf-con-ia'],
  ['Preguntas y práctica por tema', 'Comprobá qué comprendiste y qué conceptos requieren otro intento.', '/funciones/practicar-por-tema'],
  ['Flashcards y glosario', 'Reforzá definiciones y relaciones entre conceptos sin perder el contexto del material.', '/funciones/crear-flashcards-desde-pdf'],
  ['Simulacros de examen', 'Prepará una instancia de práctica con preguntas relacionadas con tus apuntes.', '/funciones/simulacro-examen-con-ia'],
  ['Planes y calendario', 'Distribuí sesiones de estudio de acuerdo con la fecha de tu examen.', '/planes-de-estudio'],
  ['Mapas mentales en Premium', 'Visualizá vínculos entre conceptos principales cuando necesites una mirada global.', '/funciones/crear-mapa-mental-desde-pdf'],
] as const;

const questions = [
  {
    question: '¿Qué es Evaluo y para qué sirve?',
    answer: 'Evaluo es una plataforma educativa con inteligencia artificial para estudiar apuntes en PDF o Word, practicar por tema, revisar errores y preparar exámenes con un plan de estudio. Su propuesta conecta comprensión, práctica y seguimiento en un mismo recorrido.',
  },
  {
    question: '¿Puedo cargar mis propios apuntes?',
    answer: 'Sí. Podés cargar archivos PDF o documentos Word (DOCX). Las actividades parten del contenido procesado y no requieren que tu materia figure en un listado público. Conviene comprobar las explicaciones importantes contra el documento original.',
  },
  {
    question: '¿Y si todavía no estudié el material?',
    answer: 'Podés empezar por el resumen de un tema, hacer una comprobación breve y pasar a practicar. Si ya lo estudiaste, podés comenzar con un diagnóstico y continuar desde ahí.',
  },
  {
    question: '¿Cómo sabe Evaluo qué temas necesito reforzar?',
    answer: 'Las respuestas corregidas y los errores registrados ayudan a orientar el siguiente repaso. Leer un tema sin responder preguntas no equivale a tenerlo dominado; los temas sin práctica se distinguen de los evaluados.',
  },
  {
    question: '¿Evaluo tiene una versión gratuita?',
    answer: 'Sí. El plan Gratis permite comenzar sin tarjeta con un material PDF o Word nuevo por mes, sujeto a límites de actividades. Premium permite subir hasta tres materiales PDF o Word nuevos por día y amplía las herramientas de práctica. Los cupos, precios y medios de pago vigentes se detallan en la página de planes.',
  },
  {
    question: '¿Sirve si mi universidad no está en Evaluo?',
    answer: 'Sí. La plataforma puede trabajar a partir de tus propios materiales de una materia, un curso o un ingreso universitario. Evaluo es una herramienta independiente y no representa oficialmente a las universidades que puedan mencionarse en sus contenidos.',
  },
  {
    question: '¿La inteligencia artificial puede equivocarse?',
    answer: 'Sí. Los resúmenes y las preguntas generadas pueden contener imprecisiones u omitir matices. Usalos como apoyo, contrastá las respuestas con el documento original y seguí la bibliografía y las indicaciones docentes.',
  },
  {
    question: '¿Qué incluye Premium?',
    answer: 'Premium amplía la cantidad de materiales nuevos, las posibilidades de práctica y refuerzo, e incluye mapas mentales. La página de precios muestra los límites y condiciones actuales, que pueden variar según el país.',
  },
];

export default function SobreEvaluoPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader trackingLocation="sobre_evaluo_header" primaryHref={startHref} />
      </div>
      <JsonLd data={[
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([{ name: 'Inicio', path: '/' }, { name: 'Sobre Evaluo', path }]),
        buildFaqJsonLd(questions),
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': toAbsoluteUrl('/sobre-evaluo#about'),
          url: toAbsoluteUrl(path),
          name: 'Qué es Evaluo y cómo funciona',
          description: 'Información sobre Evaluo, plataforma educativa para estudiar PDF y Word con IA, practicar temas y preparar exámenes.',
          inLanguage: 'es-AR',
          isPartOf: { '@id': toAbsoluteUrl('/#website') },
          mainEntity: { '@id': toAbsoluteUrl('/#organization') },
        },
        buildSoftwareApplicationJsonLd(),
      ]} />
      <main id="contenido">
        <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Conocé Evaluo
              </p>
              <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[3.6rem]">
                Tus apuntes son el comienzo. <span className="text-blue-700">Saber qué reforzar es lo que te hace avanzar.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                Evaluo es una plataforma educativa que utiliza inteligencia artificial para transformar apuntes en PDF o Word en resúmenes, preguntas, flashcards y planes de estudio. Te acompaña desde el primer tema hasta los repasos previos al examen.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                No se trata solo de resumir un archivo. Se trata de entenderlo, practicar, reconocer errores y seguir estudiando con un objetivo claro.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={startHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  Empezar a estudiar gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="#como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  Conocer cómo funciona
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-500">Comenzá sin tarjeta. Consultá los cupos del plan Gratis.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,27,61,0.08)] sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Un recorrido de estudio</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">Del material al próximo paso</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <ol className="mt-6 space-y-5">
                {[
                  { icon: FileText, label: 'Entendé', text: 'Un resumen organizado por temas.' },
                  { icon: BookOpen, label: 'Practicá', text: 'Preguntas basadas en tu material.' },
                  { icon: Target, label: 'Reforzá', text: 'Errores y conceptos a revisar.' },
                  { icon: CalendarDays, label: 'Avanzá', text: 'Un siguiente paso antes del examen.' },
                ].map((step, index) => (
                  <li key={step.label} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <step.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1 border-b border-slate-100 pb-4">
                      <p className="text-xs font-semibold text-slate-400">PASO {index + 1}</p>
                      <p className="mt-0.5 font-bold">{step.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-2 rounded-2xl bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-950">
                El progreso se construye con las respuestas que practicás, no solamente con las páginas que leés.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] gap-8 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Por qué existe Evaluo</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Estudiar mucho no siempre significa saber qué aprendiste.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-700">
            <p>Cuando preparás un parcial o un final es fácil pasar horas subrayando, releyendo y acumulando resúmenes sin comprobar qué recordarías frente a una pregunta. Evaluo fue pensado para conectar esas etapas en un mismo lugar.</p>
            <p>Partimos del material que vos elegís. Lo organizamos para que puedas estudiarlo por partes y te damos formas diferentes de practicar. Después de responder, podés volver sobre lo que costó más y continuar con el siguiente tema.</p>
            <p>Nuestro enfoque es <strong className="font-semibold text-slate-950">comprender, practicar, revisar y reforzar</strong>. La IA ayuda a organizar ese proceso; la comprensión, el criterio y el aprendizaje siguen siendo tuyos.</p>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Cómo funciona Evaluo</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Un método de estudio que no termina cuando se genera el resumen.</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">El recorrido se adapta al punto en el que estás: desde una primera lectura hasta la práctica y el repaso de los temas que te cuestan.</p>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {journey.map((item) => (
                <li key={item.number} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
                  <span className="text-sm font-bold tracking-[0.13em] text-blue-700">{item.number}</span>
                  <h3 className="mt-4 text-lg font-bold leading-6 tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="que-incluye" className="mx-auto max-w-[1240px] px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Herramientas de estudio</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Distintas formas de estudiar. Un mismo material como punto de partida.</h2>
            </div>
            <Link href="/funciones" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
              Todas las funciones <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, description, href]) => (
              <article key={title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{description}</p>
                <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
                  Explorar herramienta <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-blue-50/60">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">El siguiente paso importa</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">No todos los temas necesitan el mismo repaso.</h2>
              <p className="mt-5 text-base leading-8 text-slate-700">Releer cada capítulo desde el principio puede quitarte tiempo para trabajar lo que todavía no comprendés. Con la práctica y el seguimiento por tema, Evaluo te ayuda a distinguir lo que ya resolviste de aquello que conviene volver a intentar.</p>
              <p className="mt-4 text-sm leading-7 text-slate-700">Un tema leído, pero todavía sin preguntas corregidas, no se muestra como dominado: primero hace falta comprobar tu comprensión.</p>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold">Qué cambia en tu forma de estudiar</h3>
              <ul className="mt-6 space-y-5">
                {[
                  'Pasás de acumular lecturas a responder preguntas.',
                  'Podés practicar un tema sin perder de vista el material completo.',
                  'Los errores orientan tu próximo repaso.',
                  'La fecha del examen ayuda a ordenar las sesiones.',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Para quién es</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Para llegar al examen con una idea más clara de lo que sabés.</h2>
            <p className="mt-5 text-base leading-8 text-slate-700">Evaluo puede acompañarte durante una materia universitaria, al preparar un ingreso o cuando estudiás de forma independiente. Funciona con tus propios archivos: no dependés de que exista contenido público de tu carrera.</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">Tenemos recursos en español e inglés, además de páginas orientadas a estudiantes de Argentina, España, México y Colombia. La disponibilidad de planes y pagos puede variar según el país.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
            <p className="text-sm font-bold text-slate-900">Ejemplo de una sesión de estudio</p>
            <p className="mt-4 text-sm leading-7 text-slate-700">Imaginá que tenés un parcial con varios temas y una semana para prepararlo. Subís tus apuntes, revisás el resumen y respondés preguntas del primer tema. Si aparecen errores, podés dedicarles otra ronda antes de avanzar. Después organizás las próximas sesiones según la fecha del examen.</p>
            <p className="mt-4 text-xs leading-6 text-slate-500">Es un ejemplo ilustrativo del recorrido, no un resultado académico garantizado.</p>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Empezá a tu ritmo</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Probá Evaluo gratis y ampliá cuando lo necesites.</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">El plan Gratis te permite conocer el recorrido con un material PDF o Word nuevo por mes y cupos de actividades. Premium amplía la capacidad de estudio para quienes preparan más materiales.</p>
            <div className="mt-9 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-7">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Gratis</span>
                <h3 className="mt-3 text-2xl font-bold">Empezá con tus apuntes</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">Un material PDF o Word gratis por mes, con resúmenes, práctica y seguimiento sujetos a los límites del plan.</p>
              </article>
              <article className="rounded-3xl border border-blue-200 bg-white p-7">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Premium</span>
                <h3 className="mt-3 text-2xl font-bold">Seguí practicando más</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">Hasta tres materiales PDF o Word nuevos por día, más posibilidades de práctica y refuerzo, y mapas mentales.</p>
              </article>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">Consultá los cupos, precios y medios de pago vigentes en <Link href="/pricing" className="font-bold text-blue-700 underline underline-offset-4">planes y precios</Link>.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Preguntas frecuentes</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Lo que conviene saber antes de empezar.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">También podés consultar nuestras <Link href="/docs" className="font-semibold text-blue-700 underline underline-offset-4">guías de uso</Link>.</p>
          </div>
          <div className="space-y-3">
            {questions.map((item) => (
              <details key={item.question} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 open:border-blue-200">
                <summary className="cursor-pointer pr-3 text-sm font-bold leading-6 marker:text-blue-700 sm:text-base">{item.question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-8 lg:px-10">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Tu próximo tema puede empezar hoy</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Dejá de preguntarte si estudiaste suficiente. Empezá a comprobar qué sabés.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Subí tus apuntes, empezá con un tema y transformá tu próxima sesión de estudio en un paso concreto.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={startHref} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50 sm:w-auto">Crear cuenta gratis <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/estudiar-pdf-con-ia" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/30 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto">Ver cómo estudiar un PDF</Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-600 sm:flex-row">
            <p className="max-w-2xl">Evaluo es una herramienta de apoyo educativo: no reemplaza a docentes, bibliografía oficial ni requisitos de evaluación de las instituciones.</p>
            <div className="flex gap-4">
              <Link href="/privacidad" className="font-semibold text-blue-700 hover:underline">Privacidad</Link>
              <Link href="/terminos" className="font-semibold text-blue-700 hover:underline">Términos</Link>
            </div>
          </div>
        </section>
      </main>
      <FooterHome />
    </div>
  );
}
