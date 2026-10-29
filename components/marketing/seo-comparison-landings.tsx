import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, FileText, Layers3, Scale, Target, UploadCloud } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

type ComparisonId = 'notebooklm' | 'chatgpt' | 'quizlet';
type Feature = { label: string; other: string; evaluo: string };
type Detail = { title: string; description: string };
type Faq = { question: string; answer: string };
type Source = { title: string; href: string };
type Comparison = {
  path: string;
  name: string;
  kicker: string;
  highlight: string;
  intro: string;
  fact: string;
  rows: Feature[];
  bestForOther: Detail[];
  bestForEvaluo: Detail[];
  exampleOther: string;
  exampleEvaluo: string;
  practicalTip: string;
  limitations: string;
  otherPricing: string;
  faqs: Faq[];
  sources: Source[];
};

const comparisons: Record<ComparisonId, Comparison> = {
  notebooklm: {
    path: '/comparar/evaluo-vs-notebooklm',
    name: 'NotebookLM',
    kicker: 'Comparación para estudiantes universitarios',
    highlight: 'investigar fuentes o seguir un recorrido de estudio',
    intro: 'NotebookLM (ahora presentado también como Gemini Notebook) y Evaluo ayudan a estudiar con tus materiales. Ambos ofrecen herramientas para practicar; la diferencia principal está en si priorizás explorar varias fuentes o avanzar por los temas de un PDF con resultados y refuerzo.',
    fact: 'NotebookLM también tiene cuestionarios, flashcards, mapas mentales, explicaciones y seguimiento en sus recursos de estudio. No es solo un chat con documentos.',
    rows: [
      { label: 'Material de partida', other: 'Notebooks con documentos, enlaces, audio y otras fuentes compatibles.', evaluo: 'PDF de apuntes como referencia del recorrido de estudio.' },
      { label: 'Comprender', other: 'Chat con fuentes, resúmenes, guías e informes, mapas mentales y vistas de audio.', evaluo: 'Resumen, glosario y mapa mental conectados al PDF.' },
      { label: 'Practicar', other: 'Cuestionarios personalizables, flashcards, explicaciones y revisión de resultados.', evaluo: 'Preguntas por tema, resultados, explicaciones y refuerzo de errores.' },
      { label: 'Seguimiento', other: 'Progreso en cuestionarios y tarjetas; permite retomar y repasar fallos.', evaluo: 'Progreso y continuidad de estudio organizados por tema del material.' },
      { label: 'Acceso', other: 'Opciones gratuitas y de pago; los límites dependen del plan.', evaluo: 'Plan gratuito y Premium con límites y funciones diferentes.' },
    ],
    bestForOther: [
      { title: 'Consultar distintas fuentes', description: 'Relacioná apuntes, bibliografía y otras fuentes; pedí explicaciones fundamentadas y revisá sus referencias.' },
      { title: 'Aprender con formatos variados', description: 'Podés escuchar resúmenes de audio, consultar mapas mentales, crear tarjetas y responder cuestionarios.' },
      { title: 'Personalizar cuestionarios', description: 'Ajustá la dificultad y revisá tarjetas o preguntas que te resultaron difíciles, según las opciones disponibles.' },
    ],
    bestForEvaluo: [
      { title: 'Trabajar un PDF por temas', description: 'Elegí un apartado de tus apuntes y conectá comprensión, preguntas y práctica de ese tema.' },
      { title: 'Detectar qué reforzar', description: 'Usá el resultado de tus ejercicios para volver a los conceptos donde tuviste dificultades.' },
      { title: 'Mantener un siguiente paso', description: 'Continuá desde un tema hacia la práctica, el refuerzo o el siguiente apartado del material.' },
    ],
    exampleOther: 'Subí una lectura, una clase y un artículo complementario para contrastar sus explicaciones sobre segmentación. Pedí un cuestionario con un nivel de dificultad adecuado y revisá sus fuentes.',
    exampleEvaluo: 'Subí el PDF de Marketing I, repasá el tema Segmentación y resolvé preguntas. Si confundís criterios de segmentación con mercados objetivo, volvé a ese contenido y repetí la práctica.',
    practicalTip: 'Para una materia con muchas lecturas, NotebookLM puede resultar más conveniente para explorar fuentes. Para seguir un recorrido de práctica por tema sobre tu PDF, podés probar Evaluo. También se pueden complementar.',
    limitations: 'Las funciones y límites de NotebookLM cambian según el plan y el despliegue de Google. No todas las modalidades de estudio equivalen a una evaluación académica oficial.',
    otherPricing: 'NotebookLM/Gemini Notebook ofrece acceso sin costo y opciones superiores con límites ampliados. Consultá las condiciones de Google para tu cuenta y país.',
    faqs: [
      { question: '¿NotebookLM también hace flashcards y cuestionarios?', answer: 'Sí. Permite generar tarjetas y cuestionarios desde las fuentes, personalizar su dificultad, obtener explicaciones y revisar el rendimiento. Esa funcionalidad no es exclusiva de Evaluo.' },
      { question: '¿NotebookLM tiene mapas mentales y audio?', answer: 'Sí. Incluye mapas mentales y resúmenes de audio, entre otros formatos de estudio. La disponibilidad específica depende de tu cuenta y plan.' },
      { question: '¿Qué conviene para preparar un parcial desde un solo PDF?', answer: 'Si querés estudiar un documento por tema, practicar, ver resultados y reforzar los conceptos fallados, Evaluo está organizado alrededor de ese flujo. Si necesitás explorar fuentes diversas, NotebookLM es una alternativa sólida.' },
      { question: '¿Puedo usar NotebookLM y Evaluo juntos?', answer: 'Sí. Por ejemplo, podés consultar varias fuentes en NotebookLM y después practicar sobre tus apuntes de examen en Evaluo.' },
    ],
    sources: [
      { title: 'Ayuda oficial de Gemini Notebook: tarjetas y cuestionarios', href: 'https://support.google.com/gemininotebook/answer/16958963?hl=es-419' },
      { title: 'Google: novedades de estudio de septiembre de 2026', href: 'https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/' },
      { title: 'Ayuda oficial de Gemini Notebook', href: 'https://support.google.com/gemininotebook/?hl=es-419' },
    ],
  },
  chatgpt: {
    path: '/comparar/evaluo-vs-chatgpt',
    name: 'ChatGPT',
    kicker: 'Dos formas de usar IA para estudiar',
    highlight: 'conversar con una IA o practicar por tema',
    intro: 'ChatGPT es un asistente general que también ofrece Modo de estudio, admite PDFs y puede hacer preguntas, dar pistas y explicar errores. Evaluo está diseñado como un recorrido específico para estudiar un PDF, practicar por temas y decidir qué reforzar.',
    fact: 'ChatGPT tiene Modo de estudio y puede ayudarte a preparar exámenes con archivos, preguntas y explicaciones. La comparación es de flujo de trabajo, no de una capacidad exclusiva.',
    rows: [
      { label: 'Punto de partida', other: 'Una conversación donde podés subir archivos o plantear cualquier consulta.', evaluo: 'Un PDF que se transforma en material y recorrido por temas.' },
      { label: 'Explicar conceptos', other: 'Explicaciones guiadas, preguntas socráticas y ayuda ajustable a tus dudas.', evaluo: 'Resumen, glosario y mapa mental del documento que subiste.' },
      { label: 'Preguntas y corrección', other: 'Modo de estudio, ejercicios, preguntas de práctica y feedback conversacional.', evaluo: 'Banco de práctica por tema, resultados y refuerzo en la experiencia del material.' },
      { label: 'Continuidad', other: 'Podés continuar una conversación y pedir que vuelva a evaluar un concepto.', evaluo: 'Secuencia visible entre temas, práctica y seguimiento de progreso.' },
      { label: 'Acceso', other: 'Planes gratis y pagos con distintos límites de mensajes, archivos y herramientas.', evaluo: 'Plan gratuito y Premium según las funciones de estudio utilizadas.' },
    ],
    bestForOther: [
      { title: 'Resolver dudas abiertas', description: 'Pedí una analogía, una explicación alternativa, un ejercicio a medida o una discusión paso a paso.' },
      { title: 'Aprender con preguntas guiadas', description: 'En Modo de estudio puede preguntarte lo que sabés, dar pistas y corregir conceptos equivocados.' },
      { title: 'Trabajar más allá de un solo archivo', description: 'Sirve también para escribir, programar, investigar y otras tareas no relacionadas con exámenes.' },
    ],
    bestForEvaluo: [
      { title: 'Organizar la materia', description: 'Partí de un PDF y mantené los temas, resumen, tarjetas y ejercicios conectados.' },
      { title: 'Practicar sin escribir instrucciones', description: 'Entrá a un tema y usá las opciones de práctica de la plataforma, en vez de diseñar cada consigna en una conversación.' },
      { title: 'Elegir qué estudiar después', description: 'La experiencia conecta resultados, refuerzo y avance hacia los siguientes temas.' },
    ],
    exampleOther: 'Subí un apunte de Marketing I al Modo de estudio y pedile: «Haceme una pregunta sobre segmentación, esperá mi respuesta y corregime con una explicación». Podés pedir otra pregunta si la primera fue sencilla.',
    exampleEvaluo: 'Seleccioná tu PDF, revisá Segmentación en el resumen y pasá a la práctica del tema. Después de responder, revisá lo que te costó y usá las opciones de refuerzo.',
    practicalTip: 'Para una duda puntual, una explicación o un ejercicio personalizado, ChatGPT es muy flexible. Para sostener un recorrido estructurado a través de tus apuntes, Evaluo puede reducir el trabajo de organizar cada sesión.',
    limitations: 'Las respuestas generadas por IA pueden cometer errores en ambos casos. ChatGPT tiene límites diferentes según el plan, y el uso de archivos depende de las funciones habilitadas.',
    otherPricing: 'ChatGPT dispone de una opción gratuita y planes pagos con límites ampliados. Verificá el precio y disponibilidad de cada plan en la página oficial.',
    faqs: [
      { question: '¿ChatGPT puede leer PDFs y hacer preguntas para estudiar?', answer: 'Sí. Puede trabajar con PDFs y otros archivos compatibles. También puede crear ejercicios de práctica y explicar las respuestas, según las funciones y límites de la cuenta.' },
      { question: '¿ChatGPT tiene Modo de estudio?', answer: 'Sí. El Modo de estudio acompaña con preguntas guiadas, explicaciones graduales y correcciones. Se puede usar en las cuentas compatibles de ChatGPT.' },
      { question: '¿Qué ventaja aporta Evaluo frente a un chat?', answer: 'La diferencia de enfoque es la estructura: documento, temas, recursos de estudio, preguntas, resultados y refuerzo dentro de un mismo recorrido, sin tener que redactar instrucciones para cada etapa.' },
      { question: '¿Conviene usar ChatGPT o Evaluo?', answer: 'Depende de tu objetivo. ChatGPT es especialmente flexible para dialogar sobre dudas. Evaluo está orientado al seguimiento de la preparación de exámenes a partir de tus apuntes PDF.' },
    ],
    sources: [
      { title: 'OpenAI: usar el Modo de estudio en ChatGPT', href: 'https://help.openai.com/es-419/articles/11780217-using-study-mode-in-chatgpt' },
      { title: 'OpenAI: cargar archivos y audio', href: 'https://help.openai.com/es-419/articles/8555545-uploading-files-and-audio-to-chatgpt' },
      { title: 'OpenAI: información de planes y límites', href: 'https://help.openai.com/es-419/articles/12677804-what-is-chatgpt-faq' },
    ],
  },
  quizlet: {
    path: '/comparar/evaluo-vs-quizlet',
    name: 'Quizlet',
    kicker: 'Herramientas para repasar y rendir',
    highlight: 'tarjetas, tests o un recorrido desde tu PDF',
    intro: 'Quizlet ofrece flashcards, modos de aprendizaje, pruebas y herramientas de IA que también procesan apuntes y PDFs. Evaluo parte de un PDF de estudio y conecta sus temas con preguntas, resultados y refuerzo. Las dos herramientas permiten practicar; cambian los recorridos.',
    fact: 'Quizlet no es solo un creador manual de flashcards: incluye guías de estudio con IA, pruebas generadas desde apuntes y modalidades de repaso adaptativo.',
    rows: [
      { label: 'Material de estudio', other: 'Sets de tarjetas, apuntes, documentos y PDFs compatibles con herramientas de IA.', evaluo: 'PDF propio organizado en temas, resumen y herramientas de estudio.' },
      { label: 'Recordar conceptos', other: 'Flashcards y modo Learn con preguntas y repaso adaptativo.', evaluo: 'Flashcards conectadas al tema y a la fuente del PDF.' },
      { label: 'Preparar exámenes', other: 'Modo Test y pruebas de práctica generadas desde materiales de estudio.', evaluo: 'Preguntas por tema, simulaciones y resultados para orientar el refuerzo.' },
      { label: 'Progreso', other: 'Learn ajusta la práctica según respuestas; los modos ofrecen resultados.', evaluo: 'Seguimiento del avance por tema y revisión de errores.' },
      { label: 'Acceso', other: 'Funciones gratuitas y suscripciones Quizlet Plus con límites que pueden variar.', evaluo: 'Funciones gratuitas y Premium; consultá el detalle del plan.' },
    ],
    bestForOther: [
      { title: 'Estudiar con conjuntos de tarjetas', description: 'Creá o encontrá sets, repasá definiciones y practicá con Learn y Test.' },
      { title: 'Variar formatos de evaluación', description: 'Combiná tarjetas, selección múltiple, escritura y pruebas de práctica según la herramienta disponible.' },
      { title: 'Generar recursos desde notas', description: 'Las guías de estudio con IA convierten apuntes y PDFs en resúmenes, tarjetas y otros recursos.' },
    ],
    bestForEvaluo: [
      { title: 'Partir de tu programa en PDF', description: 'Organizá el material por temas antes de decidir qué estudiar y practicar.' },
      { title: 'Vincular preguntas y errores', description: 'Comprobá qué entendiste de un tema y volvé a sus conceptos al corregir.' },
      { title: 'Continuar hacia el siguiente tema', description: 'Pasá de la comprensión a la práctica y al refuerzo sin separar cada etapa del documento.' },
    ],
    exampleOther: 'Creá un set de términos de segmentación o subí tus notas para generar materiales. Practicá con Learn o un test y revisá en qué conceptos fallaste.',
    exampleEvaluo: 'Subí el PDF de Marketing I, elegí Segmentación y usá resumen, flashcards y preguntas. Cuando una respuesta no alcance, reforzá el tema antes de continuar.',
    practicalTip: 'Si tu objetivo principal es repasar sets o memorizar definiciones con distintos modos, Quizlet es una opción sólida. Si preferís recorrer tu PDF desde un tema hasta la corrección de la práctica, probá Evaluo.',
    limitations: 'Quizlet ofrece distintas modalidades y disponibilidad por plan, país, idioma y tipo de cuenta. Es importante revisar las condiciones locales antes de contratar.',
    otherPricing: 'Quizlet permite comenzar gratis y ofrece suscripciones Plus. Las funciones incluidas y los precios pueden variar según país, plataforma y período de facturación.',
    faqs: [
      { question: '¿Quizlet puede convertir PDFs en materiales de estudio?', answer: 'Sí. Las herramientas de IA de Quizlet pueden transformar apuntes, diapositivas y PDFs en guías, tarjetas y pruebas, según la función y sus condiciones de acceso.' },
      { question: '¿Quizlet tiene tests además de flashcards?', answer: 'Sí. Dispone de modo Test y herramientas de pruebas con IA, con distintas modalidades de preguntas y límites según la cuenta.' },
      { question: '¿Qué cambia al estudiar por tema en Evaluo?', answer: 'Evaluo conecta la práctica a los temas del PDF y orienta la revisión de errores. En Quizlet podés seguir un recorrido basado en sets, modos Learn y pruebas.' },
      { question: '¿Cuál sirve más para memorizar definiciones?', answer: 'Quizlet tiene una experiencia consolidada de tarjetas y repaso. Evaluo también incluye tarjetas, pero las ubica en un recorrido que suma práctica y refuerzo del tema.' },
    ],
    sources: [
      { title: 'Quizlet: herramientas de estudio con IA', href: 'https://quizlet.com/features/ai-study-tools' },
      { title: 'Quizlet: modo Learn y preguntas adaptativas', href: 'https://quizlet.com/features/learn' },
      { title: 'Quizlet: suscripciones y condiciones', href: 'https://help.quizlet.com/hc/es/articles/360041181691-Suscripci%C3%B3n-a-Quizlet' },
    ],
  },
};

const relatedPages: Array<{ href: string; title: string; description: string }> = [
  { href: '/comparar/evaluo-vs-notebooklm', title: 'Evaluo vs. NotebookLM', description: 'Compará la consulta de fuentes y los recorridos de estudio.' },
  { href: '/comparar/evaluo-vs-chatgpt', title: 'Evaluo vs. ChatGPT', description: 'Diferencias entre conversación guiada y práctica por temas.' },
  { href: '/comparar/evaluo-vs-quizlet', title: 'Evaluo vs. Quizlet', description: 'Tarjetas y tests frente a preparación desde tu PDF.' },
];

function CompareSection({ title, subtitle, points }: { title: string; subtitle: string; points: Detail[] }) {
  return (
    <div>
      <h3 className="text-xl font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>
      <div className="mt-5 space-y-4">
        {points.map((point) => (
          <article key={point.title} className="border-l-2 border-blue-200 pl-4">
            <h4 className="text-sm font-bold text-slate-950">{point.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">{point.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SeoComparisonLanding({ comparison }: { comparison: ComparisonId }) {
  const c = comparisons[comparison];
  const uploaderAnchor = '#elegir-pdf-comparacion';
  const tracking = 'seo_comparison_' + comparison;
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <MarketingAnalyticsSlot />
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Evaluo', path: '/' }, { name: 'Evaluo vs. ' + c.name, path: c.path }])} />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader primaryHref="/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1" trackingLocation={tracking + '_header'} />
      </div>
      <main>
        <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_75%_0%,rgba(99,102,241,0.14),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1180px] gap-9 px-4 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700"><Scale className="h-4 w-4" aria-hidden="true" />{c.kicker}</span>
              <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[60px]">
                Evaluo vs. {c.name}: <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">{c.highlight}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">{c.intro}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <TrackedLink href={uploaderAnchor} eventName="cta_click" payload={{ location: tracking + '_hero', cta_name: 'elegir_pdf', destination: uploaderAnchor }} className="from-brand to-brand-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />Probar Evaluo con mi PDF<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
                <Link href="#tabla-comparativa" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">Ver comparación</Link>
              </div>
              <p className="mt-6 text-xs leading-6 text-slate-500">Comparación elaborada por Evaluo · Revisada el 29 de octubre de 2026 · Sin afiliación con {c.name}</p>
            </div>
            <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_25px_65px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
                <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Una decisión práctica</p><h2 className="text-lg font-bold text-slate-950">¿Qué necesitás hoy?</h2></div>
              </div>
              <div className="mt-6 space-y-5">
                <div className="flex gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" /><div><p className="font-bold text-slate-950">Comprender y explorar</p><p className="mt-1 text-sm leading-7 text-slate-600">Usá las herramientas de {c.name} cuando sus formatos te resulten más útiles.</p></div></div>
                <div className="flex gap-3"><Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /><div><p className="font-bold text-slate-950">Practicar con una secuencia por tema</p><p className="mt-1 text-sm leading-7 text-slate-600">Empezá por tu PDF en Evaluo y continuá hacia preguntas, resultados y refuerzo.</p></div></div>
              </div>
              <p className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-slate-700">{c.fact}</p>
            </div>
          </div>
        </section>

        <section id="tabla-comparativa" className="scroll-mt-24 border-b border-slate-100 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">01 / Comparación</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Qué ofrece cada herramienta para estudiar</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Son enfoques diferentes y tienen funciones que se superponen. La tabla describe las experiencias principales sin sugerir que una sea mejor en todos los casos.</p>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm leading-6">
                <thead className="bg-slate-50 text-slate-950"><tr><th scope="col" className="w-1/4 p-5 font-bold">Criterio</th><th scope="col" className="p-5 font-bold">{c.name}</th><th scope="col" className="bg-blue-50/60 p-5 font-bold">Evaluo</th></tr></thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.label} className="border-t border-slate-200">
                      <th scope="row" className="p-5 align-top font-bold text-slate-900">{r.label}</th>
                      <td className="p-5 align-top text-slate-600">{r.other}</td>
                      <td className="bg-blue-50/40 p-5 align-top text-slate-700">{r.evaluo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">La disponibilidad puede variar según plan, país, cuenta o cambios de producto. Revisá la documentación oficial enlazada al final.</p>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-slate-50/60 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">02 / Según tu objetivo</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">¿Cuándo elegir {c.name} y cuándo Evaluo?</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><CompareSection title={'Cuándo tiene sentido ' + c.name} subtitle={'Situaciones donde sus herramientas pueden ayudarte.'} points={c.bestForOther} /></div>
              <div className="rounded-2xl border border-blue-200 bg-white p-6 sm:p-8"><CompareSection title="Cuándo tiene sentido Evaluo" subtitle="Situaciones donde conviene estudiar con una secuencia basada en tu PDF." points={c.bestForEvaluo} /></div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">03 / Ejemplo universitario</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Preparar un parcial de Marketing I con cada herramienta</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Ejemplo didáctico, no un resultado de una evaluación real. Supongamos que tenés que estudiar segmentación de mercados.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-6"><Layers3 className="h-5 w-5 text-slate-600" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-950">Con {c.name}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{c.exampleOther}</p></article>
              <article className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6"><Target className="h-5 w-5 text-blue-700" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-950">Con Evaluo</h3><p className="mt-3 text-sm leading-7 text-slate-600">{c.exampleEvaluo}</p></article>
            </div>
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-base font-bold text-slate-950">Cómo decidir</h3><p className="mt-2 text-sm leading-7 text-slate-600">{c.practicalTip}</p><p className="mt-3 text-sm leading-7 text-slate-600">{c.limitations}</p></div>
            <p className="mt-6 text-sm leading-7 text-slate-600">También podés <Link href="/convertir-pdf-en-preguntas" className="font-bold text-blue-700 underline underline-offset-4">generar preguntas desde tu PDF</Link>, <Link href="/funciones/practicar-por-tema" className="font-bold text-blue-700 underline underline-offset-4">practicar por tema</Link> o <Link href="/funciones/simulacro-examen-con-ia" className="font-bold text-blue-700 underline underline-offset-4">preparar un simulacro</Link>.</p>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-slate-50/60 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1120px] gap-9 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">04 / Acceso y planes</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">¿Cuál es gratis y qué cambia al pagar?</h2></div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-950">{c.name}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{c.otherPricing}</p><a href={c.sources[0].href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold text-blue-700 underline underline-offset-4">Consultar la información oficial</a></div>
              <div className="rounded-xl border border-blue-200 bg-white p-5"><h3 className="font-bold text-slate-950">Evaluo</h3><p className="mt-2 text-sm leading-7 text-slate-600">Podés comenzar gratis y pasar a Premium para ampliar las funciones de estudio. El precio vigente se muestra en la página de planes; evitamos mostrar un importe fijo desactualizado.</p><Link href="/pricing" className="mt-3 inline-block text-xs font-bold text-blue-700 underline underline-offset-4">Ver planes y precios de Evaluo</Link></div>
            </div>
          </div>
        </section>

        <section id="elegir-pdf-comparacion" className="scroll-mt-24 border-b border-slate-100 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1120px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">05 / Probá con tu archivo</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Elegí un PDF para estudiar en Evaluo</h2><p className="mt-4 text-sm leading-7 text-slate-600">Seleccioná tus apuntes antes de registrarte. Después creá el material y empezá a trabajar sus temas, preguntas y resultados con las funciones disponibles en tu plan.</p><p className="mt-5 flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="h-4 w-4 text-blue-600" aria-hidden="true" />No necesitás registrarte para elegir el archivo.</p></div>
            <PdfFirstLandingUploader trackingLocation={tracking} sourceKey={'compare-' + comparison} />
          </div>
        </section>

        <section className="border-b border-slate-100 bg-slate-50/40 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1120px] gap-9 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">06 / Dudas habituales</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Preguntas sobre Evaluo y {c.name}</h2></div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {c.faqs.map((faq) => <details key={faq.question} className="py-5"><summary className="cursor-pointer text-sm font-bold text-slate-950">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">07 / Fuentes y transparencia</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Cómo verificamos esta comparación</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Esta guía editorial se elaboró a partir de documentación pública de {c.name} y las funciones documentadas de Evaluo. No es una prueba controlada de calidad ni una certificación de ninguna de las dos plataformas. Revisada el 29 de octubre de 2026.</p>
            <ul className="mt-5 space-y-2 text-sm text-blue-700">
              {c.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{source.title}</a></li>)}
              <li><Link href="/pricing" className="font-semibold underline underline-offset-4">Funciones y precios de Evaluo</Link></li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Otras comparaciones para elegir cómo estudiar</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {relatedPages.filter((r) => r.href !== c.path).map((r) => <Link key={r.href} href={r.href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200"><h3 className="text-base font-bold text-slate-950">{r.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{r.description}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-700">Ver comparación <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link>)}
            </div>
          </div>
        </section>
      </main>
      <FooterHome />
    </div>
  );
}

export function getComparisonCanonical(id: ComparisonId) {
  return toAbsoluteUrl(comparisons[id].path);
}
