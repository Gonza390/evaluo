import Link from 'next/link';
import { ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { EnglishSeoHeader } from '@/components/marketing/english-seo-header';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/lib/seo';
import { hreflangAlternatePath } from '@/lib/seo/hreflang-clusters';

// Página pública e indexable que explica el producto paso a paso. Reemplaza como destino
// a las demos con noindex (/demo, /preview) que hoy reciben visitas desde buscadores con IA.
// Español neutro (tuteo) e inglés. Los datos de planes salen de /pricing y /en/pricing.
export type HowItWorksLocale = 'es' | 'en';

type Content = {
  path: string;
  home: string;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  ctaHref: string;
  stepsTitle: string;
  steps: Array<{ title: string; detail: string }>;
  plansTitle: string;
  plansIntro: string;
  planRows: Array<{ feature: string; free: string; premium: string }>;
  planHeaders: [string, string, string];
  pricingLink: string;
  pricingHref: string;
  limitsTitle: string;
  limits: string[];
  privacy: { before: string; link: string; href: string; after: string };
  featuresTitle: string;
  features: Array<{ href: string; title: string; text: string }>;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
  updated: string;
};

const CONTENT: Record<HowItWorksLocale, Content> = {
  es: {
    path: '/es/como-funciona',
    home: '/es/estudiar-pdf-con-ia',
    breadcrumb: 'Cómo funciona',
    eyebrow: 'Cómo funciona Evaluo',
    title: 'De tus apuntes a un plan para el examen, en cinco pasos',
    intro:
      'Evaluo es una plataforma de estudio con inteligencia artificial que trabaja sobre tu propio material. Subes el PDF o el documento de Word con el que estudias y la plataforma lo organiza por temas, te ayuda a entenderlo, te pone a prueba y te muestra qué repasar antes del examen.',
    cta: 'Probar gratis con mis apuntes',
    ctaHref: '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1',
    stepsTitle: 'El recorrido completo',
    steps: [
      { title: 'Sube tu PDF o documento de Word', detail: 'Archivos de hasta 20 MB. También funcionan los PDF escaneados, aunque la calidad del resultado depende de que el texto se lea bien. En el plan Free, cada PDF puede tener hasta 100 páginas.' },
      { title: 'Evaluo lo organiza por temas', detail: 'Divide el material en temas y prepara para cada uno un resumen y un glosario con los conceptos clave. Todo queda conectado al documento original para que puedas volver a la fuente.' },
      { title: 'Practica tema por tema', detail: 'Preguntas de opción múltiple, verdadero o falso, relacionar conceptos, casos prácticos y flashcards, generadas a partir de ese tema, con explicaciones para revisar las respuestas.' },
      { title: 'Revisa tus resultados por tema', detail: 'En lugar de una sola nota, ves qué temas dominas y cuáles necesitan repaso, con los errores agrupados para volver al concepto que falló.' },
      { title: 'Sigue un plan hasta el examen', detail: 'Con la fecha del examen, Evaluo reparte el repaso en un plan de estudio. Antes del examen puedes hacer un simulacro que mezcla todos los temas.' },
    ],
    plansTitle: 'Qué incluye cada plan',
    plansIntro: 'Puedes empezar gratis con un documento. Premium amplía la cantidad de material y de práctica.',
    planHeaders: ['Función', 'Free', 'Premium'],
    planRows: [
      { feature: 'Documentos', free: '1 en total', premium: 'Hasta 3 nuevos por día' },
      { feature: 'Páginas por PDF', free: 'Hasta 100', premium: 'Sin límite de páginas (archivo de hasta 20 MB)' },
      { feature: 'Resumen y glosario por tema', free: 'Incluido', premium: 'Incluido' },
      { feature: 'Preguntas de práctica', free: '12 de opción múltiple y 10 de verdadero o falso', premium: 'Más explicaciones y ejercicios para repasar errores' },
      { feature: 'Flashcards, casos y relacionar conceptos', free: '25 flashcards, 2 casos y 1 ronda', premium: 'Todo lo del plan Free' },
      { feature: 'Mapa mental', free: 'No', premium: 'Incluido' },
      { feature: 'Simulacro y plan de estudio', free: '1 simulacro y 1 plan', premium: 'Modos de simulacro Premium y explicaciones más detalladas' },
    ],
    pricingLink: 'Ver precios vigentes',
    pricingHref: '/pricing',
    limitsTitle: 'Lo que conviene saber antes de empezar',
    limits: [
      'Las preguntas son de práctica y salen de tu material. No son preguntas oficiales ni filtradas de ningún examen.',
      'La IA puede equivocarse, sobre todo con fórmulas, tablas o páginas escaneadas. Verifica lo importante con tu documento y tu docente.',
      'Evaluo te ayuda a estudiar; no reemplaza las clases ni la bibliografía de tu curso.',
      'Si tu institución tiene reglas sobre el uso de IA, respétalas: usa la práctica para aprender, no para entregar trabajos.',
    ],
    privacy: { before: 'Para saber cómo se tratan tus archivos y tus datos, consulta la ', link: 'política de privacidad', href: '/privacidad', after: '.' },
    featuresTitle: 'Cada parte, en detalle',
    features: [
      { href: '/es/generador-de-examenes-con-ia', title: 'Generador de exámenes con IA', text: 'Preguntas de práctica y simulacros a partir de tus apuntes.' },
      { href: '/es/estudiar-pdf-con-ia', title: 'Estudiar un PDF con IA', text: 'Cómo convertir un documento en temas, preguntas y repasos.' },
      { href: '/es/guias/como-estudiar-con-ia', title: 'Cómo estudiar con IA', text: 'Método para aprender con IA sin que piense por ti.' },
    ],
    faqTitle: 'Preguntas frecuentes',
    faq: [
      { question: '¿Necesito crear una cuenta?', answer: 'Para generar el material de estudio, sí: la cuenta es gratuita y te permite guardar tu progreso. Puedes elegir el archivo antes de registrarte.' },
      { question: '¿Qué formatos acepta?', answer: 'PDF y documentos de Word (.docx) de hasta 20 MB, incluidos PDF escaneados. Si el texto del escaneo no se lee bien, el resultado puede tener errores.' },
      { question: '¿En qué idiomas funciona?', answer: 'La plataforma está disponible en español y en inglés.' },
      { question: '¿Se puede usar en el celular?', answer: 'Sí. Evaluo funciona en el navegador, tanto en computadora como en celular, sin instalar nada.' },
      { question: '¿Es gratis?', answer: 'Puedes empezar gratis con un documento. Premium amplía los documentos, las explicaciones, el mapa mental y los modos de simulacro; los precios vigentes están en la página de planes.' },
    ],
    updated: '2026-11-07',
  },
  en: {
    path: '/en/how-it-works',
    home: '/en',
    breadcrumb: 'How it works',
    eyebrow: 'How Evaluo works',
    title: 'From your notes to an exam-ready plan, in five steps',
    intro:
      'Evaluo is an AI study assistant that works from your own course material. Upload the PDF or Word document you study from and Evaluo organizes it by topic, helps you understand it, tests you on it and shows you what to review before the exam.',
    cta: 'Try it free with my notes',
    ctaHref: '/en/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1',
    stepsTitle: 'The full study loop',
    steps: [
      { title: 'Upload your PDF or Word document', detail: 'Files up to 20 MB. Scanned PDFs work too, although the result depends on how readable the text is. On the Free plan, each PDF can have up to 100 pages.' },
      { title: 'Evaluo organizes it by topic', detail: 'It splits the material into topics and prepares a summary and a glossary of key terms for each one, linked to the original document so you can always go back to the source.' },
      { title: 'Practice topic by topic', detail: 'Multiple-choice, true/false, matching, practical cases and flashcards generated from that topic, with explanations to review your answers.' },
      { title: 'Check your results by topic', detail: 'Instead of one overall score, you see which topics you know and which need review, with mistakes grouped so you can go back to the concept you missed.' },
      { title: 'Follow a plan until exam day', detail: 'Add your exam date and Evaluo spreads your review into a study plan. Before the exam, take a mock exam that mixes every topic.' },
    ],
    plansTitle: 'What each plan includes',
    plansIntro: 'Start free with one document. Premium adds more material and more practice.',
    planHeaders: ['Feature', 'Free', 'Premium'],
    planRows: [
      { feature: 'Documents', free: '1 in total', premium: 'Up to 3 new per day' },
      { feature: 'Pages per PDF', free: 'Up to 100', premium: 'No page limit (files up to 20 MB)' },
      { feature: 'Topic summaries and glossary', free: 'Included', premium: 'Included' },
      { feature: 'Practice questions', free: '12 multiple-choice and 10 true/false', premium: 'More AI explanations and exercises to review mistakes' },
      { feature: 'Flashcards, cases and matching', free: '25 flashcards, 2 cases and 1 round', premium: 'Everything in Free' },
      { feature: 'Mind map', free: 'No', premium: 'Included' },
      { feature: 'Mock exam and study plan', free: '1 mock exam and 1 plan', premium: 'Premium mock exam modes and more detailed explanations' },
    ],
    pricingLink: 'See current prices',
    pricingHref: '/en/pricing',
    limitsTitle: 'Good to know before you start',
    limits: [
      'Questions are practice questions generated from your material. They are not official or leaked exam questions.',
      'AI can make mistakes, especially with formulas, tables or scanned pages. Check what matters against your document and your instructor.',
      'Evaluo helps you study; it does not replace your classes or course readings.',
      'If your institution has rules about AI, follow them: use practice to learn, not to submit work.',
    ],
    privacy: { before: 'To learn how your files and data are handled, read the ', link: 'privacy policy', href: '/en/privacy', after: '.' },
    featuresTitle: 'Each part in detail',
    features: [
      { href: '/en/ai-test-prep', title: 'AI test prep', text: 'Practice tests and mock exams built from your notes.' },
      { href: '/en/pdf-to-flashcards', title: 'AI flashcard generator', text: 'Flashcards from your PDF that are worth reviewing.' },
      { href: '/en/ai-pdf-summarizer', title: 'AI PDF summarizer', text: 'Topic-by-topic summaries you can check against the source.' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      { question: 'Do I need an account?', answer: 'To generate your study material, yes: the account is free and saves your progress. You can choose your file before signing up.' },
      { question: 'Which file formats are supported?', answer: 'PDF and Word documents (.docx) up to 20 MB, including scanned PDFs. If a scan is hard to read, the result may contain errors.' },
      { question: 'Which languages does it support?', answer: 'The platform is available in English and Spanish.' },
      { question: 'Does it work on my phone?', answer: 'Yes. Evaluo runs in the browser on both computers and phones, with nothing to install.' },
      { question: 'Is it free?', answer: 'You can start free with one document. Premium adds more documents, explanations, mind maps and mock exam modes; current prices are on the pricing page.' },
    ],
    updated: '2026-11-07',
  },
};

export function getHowItWorksContent(locale: HowItWorksLocale) {
  return CONTENT[locale];
}

export function HowItWorksPage({ locale }: { locale: HowItWorksLocale }) {
  const c = CONTENT[locale];
  const english = locale === 'en';
  const alternate = hreflangAlternatePath(c.path, english ? 'es' : 'en');

  return (
    <div lang={english ? 'en' : 'es'} className="min-h-screen bg-white text-slate-950">
      {english ? <InternationalDocumentLanguage lang="en" /> : null}
      <MarketingAnalyticsSlot />
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Evaluo', path: c.home },
            { name: c.breadcrumb, path: c.path },
          ]),
          buildFaqJsonLd(c.faq),
        ]}
      />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        {english ? (
          <EnglishSeoHeader alternateHref={alternate} />
        ) : (
          <PublicSiteHeader
            variant="landing"
            trackingLocation="how_it_works_es_header"
            alternateHref={alternate}
            actions={
              <Link href={c.ctaHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800">
                Probar gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        )}
      </div>

      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(118deg,#F0F5FF_0%,#FFFFFF_72%)]">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{c.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{c.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{c.intro}</p>
            <Link href={c.ctaHref} className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800">
              {c.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="steps" className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 id="steps" className="text-3xl font-bold tracking-tight">{c.stepsTitle}</h2>
          <ol className="mt-8 space-y-4">
            {c.steps.map((step, index) => (
              <li key={step.title} className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">{index + 1}</span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="plans" className="border-y border-slate-100 bg-slate-50/60 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <h2 id="plans" className="text-3xl font-bold tracking-tight">{c.plansTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{c.plansIntro}</p>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-6">
                <thead className="bg-slate-50">
                  <tr>
                    {c.planHeaders.map((header) => <th key={header} scope="col" className="p-4 font-bold">{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {c.planRows.map((row) => (
                    <tr key={row.feature} className="border-t border-slate-200">
                      <th scope="row" className="p-4 font-semibold text-slate-900">{row.feature}</th>
                      <td className="p-4 text-slate-600">{row.free}</td>
                      <td className="p-4 text-slate-700">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href={c.pricingHref} className="mt-4 inline-block text-sm font-semibold text-blue-700 underline underline-offset-4">{c.pricingLink}</Link>
          </div>
        </section>

        <section aria-labelledby="limits" className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 id="limits" className="text-3xl font-bold tracking-tight">{c.limitsTitle}</h2>
          <ul className="mt-6 space-y-3">
            {c.limits.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-700">
            <Info className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
            <span>
              {c.privacy.before}
              <Link href={c.privacy.href} className="font-semibold text-blue-700 underline underline-offset-4">{c.privacy.link}</Link>
              {c.privacy.after}
            </span>
          </p>
        </section>

        <section aria-labelledby="features" className="border-t border-slate-100 bg-slate-50/60 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <h2 id="features" className="text-3xl font-bold tracking-tight">{c.featuresTitle}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {c.features.map((feature) => (
                <Link key={feature.href} href={feature.href} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300">
                  <span className="block text-base font-bold group-hover:text-blue-700">{feature.title}</span>
                  <span className="mt-2 block text-sm leading-7 text-slate-600">{feature.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="faq" className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 id="faq" className="text-3xl font-bold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {c.faq.map((item) => (
              <details key={item.question} className="py-5">
                <summary className="cursor-pointer text-sm font-bold">{item.question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <FooterHome locale={english ? 'en' : 'es'} register={english ? undefined : 'neutral'} />
    </div>
  );
}
