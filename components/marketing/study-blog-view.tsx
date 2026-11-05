import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { StudyBlogWorkshopView } from '@/components/marketing/study-blog-workshop';
import { ExamStudyTimeEstimator } from '@/components/marketing/exam-study-time-estimator';
import { STUDY_BLOG_WORKSHOPS_ES } from '@/lib/study-blog-workshops-es';
import { STUDY_BLOG_WORKSHOPS_EN } from '@/lib/study-blog-workshops-en';
import { PublicBrandLink, PublicSiteHeader } from '@/components/marketing/public-site-header';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';
import {
  STUDY_BLOG_ARTICLES,
  getStudyBlogPath,
  getTranslation,
  type StudyBlogLocale,
  type StudyBlogArticle,
} from '@/lib/study-blog-articles';

const words = {
  es: {
    index: 'Blog de estudio',
    subtitle: 'Ideas para estudiar con criterio',
    intro: 'Métodos, ejemplos y ejercicios que podés aplicar con tus propios apuntes. Sin fórmulas milagrosas ni depender de una herramienta concreta.',
    read: 'Leer artículo',
    back: 'Todos los artículos',
    inThisGuide: 'En esta guía',
    takeaway: 'Idea principal',
    workedExample: 'Ejercicio práctico',
    review: 'Cómo comprobarlo',
    mistakes: 'Errores frecuentes',
    faq: 'Preguntas frecuentes',
    sources: 'Fuentes y lectura adicional',
    sourcesNote: 'Referencias sobre técnicas de aprendizaje. Los ejercicios originales de esta guía son ejemplos educativos y deben contrastarse con la bibliografía de tu materia.',
    other: 'También puede interesarte',
    otherLocale: 'Read in English',
    optional: '¿Querés practicar con tus propios apuntes?',
    optionalLink: 'Subir mi material',
    optionalNote: 'Opcional: podés aplicar los ejercicios de estas guías sin crear una cuenta.',
    existing: 'Más recursos sobre técnicas de estudio',
    existingLink: 'Técnicas de estudio efectivas',
    published: '30 de octubre de 2026',
    purpose: 'Contenido educativo gratuito',
  },
  en: {
    index: 'Study blog',
    subtitle: 'Study methods you can actually use',
    intro: 'Clear explanations, worked examples and questions you can use with your own notes. No miracle claims and no app required.',
    read: 'Read article',
    back: 'All articles',
    inThisGuide: 'In this guide',
    takeaway: 'Key idea',
    workedExample: 'Try it yourself',
    review: 'How to check your work',
    mistakes: 'Common mistakes',
    faq: 'Frequently asked questions',
    sources: 'Sources and further reading',
    sourcesNote: 'References on learning strategies. The original activities in this guide are educational examples and should be checked against your course materials.',
    other: 'Keep reading',
    otherLocale: 'Leer en español',
    optional: 'Want to use your own study notes?',
    optionalLink: 'Study my material',
    optionalNote: 'Optional: you can use the methods on this page without creating an account.',
    existing: 'More study resources',
    existingLink: 'Study PDFs with AI',
    published: 'October 30, 2026',
    purpose: 'Free educational content',
  },
} as const;


const CONTEXTUAL_LINKS: Partial<Record<StudyBlogLocale, Record<string, {href:string;label:string;description:string}[]>>> = {
 es:{
  medicine:[{href:'/es/guias/como-estudiar-anatomia',label:'Guía de anatomía',description:'Repasá estructuras y mecanismos con esquemas.'},{href:'/funciones/practicar-por-tema',label:'Practicar por tema',description:'Reforzá cada unidad con preguntas de tu material.'}],
  nursing:[{href:'/es/guias/como-estudiar-anatomia',label:'Estudiar anatomía',description:'Recuperá relaciones entre estructuras y funciones.'},{href:'/funciones/verdadero-falso-con-ia',label:'Verdadero o falso',description:'Comprobá afirmaciones de tus apuntes y revisá el razonamiento.'}],
  engineering:[{href:'/blog/como-estudiar-estadistica',label:'Estudiar estadística',description:'Ejercitá cálculos, interpretación y supuestos.'},{href:'/funciones/practicar-por-tema',label:'Práctica por tema',description:'Separá los conceptos antes de un simulacro.'}],
  statistics:[{href:'/blog/como-estudiar-ingenieria',label:'Estudiar ingeniería',description:'Aplicá unidades, modelos y comprobaciones.'},{href:'/funciones/unir-conceptos-con-ia',label:'Unir conceptos',description:'Distinguí términos y definiciones próximas.'}],
  'exam-planning':[{href:'/planes-de-estudio/estudiar-en-7-dias',label:'Plan de estudio de siete días',description:'Organizá sesiones de diagnóstico, práctica y repaso.'},{href:'/funciones/simulacro-examen-con-ia',label:'Simulacro de examen',description:'Comprobá qué falta reforzar antes de rendir.'}],
  'active-recall':[{href:'/blog/repeticion-espaciada-para-estudiar',label:'Repetición espaciada',description:'Aprendé cuándo retomar preguntas anteriores.'},{href:'/funciones/crear-flashcards-desde-pdf',label:'Flashcards de estudio',description:'Recuperá conceptos sin consultar primero las respuestas.'}]
 },
 en:{
  medicine:[{href:'/en/blog/how-to-study-biology',label:'Study biology',description:'Reconstruct mechanisms and examine scientific explanations.'},{href:'/en/pdf-to-quiz',label:'Study questions from notes',description:'Explore quiz-based practice using your own learning material.'}],
  nursing:[{href:'/en/blog/how-to-study-biology',label:'Biology study guide',description:'Review structures and processes before application.'},{href:'/en/ai-true-false-questions',label:'True-or-false practice',description:'Check the reasoning behind factual claims.'}],
  engineering:[{href:'/en/blog/how-to-study-statistics',label:'Study statistics',description:'Interpret numerical results and assumptions.'},{href:'/en/pdf-to-quiz',label:'Quiz from your notes',description:'Explore retrieval practice with course material.'}],
  statistics:[{href:'/en/blog/how-to-study-engineering',label:'Study engineering',description:'Work through models and unit checks.'},{href:'/en/match-concepts-with-ai',label:'Match concepts',description:'Practice distinguishing closely related definitions.'}],
  'exam-planning':[{href:'/en/blog/how-to-study-for-final-exams',label:'Preparing for finals',description:'Organize cumulative revision across multiple topics.'},{href:'/en/pdf-to-quiz',label:'Quiz-based practice',description:'Use questions to assess understanding.'}],
  'active-recall':[{href:'/en/blog/spaced-repetition-for-studying',label:'Spaced repetition',description:'Review older material across study sessions.'},{href:'/en/pdf-to-flashcards',label:'Flashcards',description:'Practice retrieving concepts from your notes.'}],
  'exam-study-time-nov2026':[{href:'/en/blog/how-to-study-for-final-exams',label:'Preparing for finals',description:'Learn to organize a cumulative assessment across topics.'},{href:'/en/pdf-to-quiz',label:'Practice questions from notes',description:'Test recall and identify which topics need more work.'}]
 }
};

function BlogHeader({ locale }: { locale: StudyBlogLocale }) {
  return (
    <>
      <InternationalDocumentLanguage lang={locale} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        {locale === 'es' ? (
          <PublicSiteHeader variant="landing" trackingLocation="study_blog_es" />
        ) : (
          <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-3">
            <PublicBrandLink />
            <nav aria-label="Study navigation" className="flex items-center gap-4 text-sm font-semibold text-slate-700">
              <Link href="/en" className="min-h-11 py-3 hover:text-blue-700">Study guides</Link>
              <Link href="/en/blog" className="min-h-11 py-3 hover:text-blue-700">Blog</Link>
              <Link href="/en/study-pdf-with-ai" className="hidden min-h-11 rounded-xl bg-blue-700 px-4 py-3 text-white hover:bg-blue-800 sm:inline-flex">Study with AI</Link>
            </nav>
          </header>
        )}
      </div>
    </>
  );
}

export function StudyBlogHub({ locale }: { locale: StudyBlogLocale }) {
  const copy = words[locale];
  const articles = STUDY_BLOG_ARTICLES[locale];
  const path = locale === 'es' ? '/blog' : '/en/blog';
  return (
    <div lang={locale} className="min-h-screen bg-white text-[#0F1B3D]">
      <JsonLd data={buildBreadcrumbJsonLd([
        { name: locale === 'es' ? 'Inicio' : 'Home', path: locale === 'es' ? '/' : '/en' },
        { name: copy.index, path },
      ])} />
      <BlogHeader locale={locale} />
      <main>
        <header className="border-b border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-[1080px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{copy.index} / Evaluo</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-[-0.04em] sm:text-5xl">{copy.subtitle}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">{copy.intro}</p>
            <Link href={locale === 'es' ? '/en/blog' : '/blog'} hrefLang={locale === 'es' ? 'en' : 'es'} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline underline-offset-4">
              {locale === 'es' ? 'English version' : 'Versión en español'} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>
        <section className="mx-auto max-w-[1080px] px-4 py-12 sm:px-8 sm:py-16" aria-label={copy.index}>
          <div className="grid gap-5 sm:grid-cols-2">
            {articles.map((article, index) => (
              <article key={article.key} className={"flex flex-col border-b border-slate-200 pb-8 " + (index === 0 ? "sm:col-span-2" : "")}>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-700">{article.category}</p>
                <h2 className={"mt-3 font-bold tracking-[-0.025em] " + (index === 0 ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl")}>
                  <Link href={getStudyBlogPath(locale, article)} className="hover:text-blue-700">{article.title}</Link>
                </h2>
                <p className="mt-3 max-w-2xl flex-1 text-sm leading-7 text-slate-600 sm:text-base">{article.description}</p>
                <Link href={getStudyBlogPath(locale, article)} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-blue-700 hover:underline">
                  {copy.read} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold">{copy.existing}</h2>
            <Link href={locale === 'es' ? '/blog/tecnicas-de-estudio-efectivas' : '/en/study-pdf-with-ai'}
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              {copy.existingLink} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <FooterHome variant="full" />
    </div>
  );
}

export function StudyBlogArticlePage({ locale, article }: { locale: StudyBlogLocale; article: StudyBlogArticle }) {
  const copy = words[locale];
  const path = getStudyBlogPath(locale, article);
  const translation = getTranslation(locale, article);
  const workshop = locale === 'es'
    ? STUDY_BLOG_WORKSHOPS_ES[article.key]
    : STUDY_BLOG_WORKSHOPS_EN[article.key];
  const relatedKeys: Record<string, string[]> = {
    medicine: ['nursing','biology','exam-planning'],
    nursing: ['medicine','biology','active-recall'],
    engineering: ['statistics','exam-planning','active-recall'],
    statistics: ['engineering','exam-planning','active-recall'],
    'exam-planning': ['exam-study-time-nov2026','active-recall','medicine','engineering'],
    'exam-study-time-nov2026': ['exam-planning','active-recall'],
    'active-recall': ['exam-planning','statistics','nursing'],
  };
  const available = STUDY_BLOG_ARTICLES[locale].filter(item => item.key !== article.key);
  const preferences = relatedKeys[article.key] ?? [];
  const others = [...available].sort((a,b) => {
    const rank = (key:string) => { const index = preferences.indexOf(key); return index === -1 ? 100 : index; };
    return rank(a.key) - rank(b.key);
  }).slice(0, 3);
  const mainIndex = locale === 'es' ? '/' : '/en';
  const blogIndex = locale === 'es' ? '/blog' : '/en/blog';
  const newArticleKeys = new Set(['medicine','nursing','engineering','statistics','exam-planning','active-recall']);
  const isNov5Article = article.key.endsWith('-nov2026');
  const articleDate = isNov5Article ? '2026-11-05' : newArticleKeys.has(article.key) ? '2026-11-02' : '2026-10-30';
  const articleDateLabel = isNov5Article
    ? (locale === 'es' ? '5 de noviembre de 2026' : 'November 5, 2026')
    : newArticleKeys.has(article.key) ? (locale === 'es' ? '2 de noviembre de 2026' : 'November 2, 2026') : copy.published;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: articleDate,
    dateModified: articleDate,
    inLanguage: locale,
    author: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
    publisher: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
    mainEntityOfPage: toAbsoluteUrl(path),
    isAccessibleForFree: true,
  };
  return (
    <div lang={locale} className="min-h-screen bg-white text-[#0F1B3D]">
      <JsonLd data={[
        buildBreadcrumbJsonLd([
          { name: locale === 'es' ? 'Inicio' : 'Home', path: mainIndex },
          { name: copy.index, path: blogIndex },
          { name: article.title, path },
        ]),
        articleJsonLd,
      ]} />
      <BlogHeader locale={locale} />
      <main>
        <header className="border-b border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-8 sm:py-16">
            <Link href={blogIndex} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {copy.back}
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              <span className="text-blue-700">{article.category}</span><span aria-hidden="true">·</span>
              <time dateTime={articleDate}>{articleDateLabel}</time><span aria-hidden="true">·</span><span>{copy.purpose}</span>
            </div>
            <h1 className="mt-4 max-w-[880px] text-[2.2rem] font-extrabold leading-[1.13] tracking-[-0.04em] sm:text-5xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{article.lead}</p>
            {translation && (
              <Link href={getStudyBlogPath(locale === 'es' ? 'en' : 'es', translation)}
                hrefLang={locale === 'es' ? 'en' : 'es'}
                className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline underline-offset-4">
                {copy.otherLocale} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </header>

        <div className="mx-auto grid max-w-[1080px] gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16 lg:py-16">
          <article className="min-w-0">
            <section className="border-l-4 border-[#4F5DFF] bg-[#F8FAFF] px-5 py-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-blue-700">{copy.takeaway}</h2>
              <p className="mt-2 text-base font-medium leading-8 text-[#0F1B3D]">{article.takeaway}</p>
            </section>
            {article.key === 'exam-study-time-nov2026' && <ExamStudyTimeEstimator />}
            {workshop && <StudyBlogWorkshopView locale={locale} workshop={workshop} />}
            {article.sections.map((section, index) => (
              <section className="mt-12 scroll-mt-24" id={'seccion-' + (index + 1)} key={section.heading}>
                <h2 className="text-2xl font-bold tracking-[-0.025em] sm:text-[1.8rem]">{section.heading}</h2>
                {section.paragraphs.map((paragraph, i) => <p key={i} className="mt-5 text-[15px] leading-[1.85] text-slate-700 sm:text-base">{paragraph}</p>)}
              </section>
            ))}
            <section id="ejercicio" className="mt-14 scroll-mt-24 border-y border-slate-200 py-9">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{copy.workedExample}</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">{article.exercise.title}</h2>
              <p className="mt-4 text-[15px] leading-8 text-slate-700">{article.exercise.context}</p>
              <ol className="mt-5 space-y-4">
                {article.exercise.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-7 text-slate-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{i+1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <h3 className="mt-6 text-base font-bold">{copy.review}</h3>
              <p className="mt-2 text-[15px] leading-7 text-slate-700">{article.exercise.check}</p>
            </section>
            <section id="errores" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight">{copy.mistakes}</h2>
              <div className="mt-5 space-y-5">
                {article.mistakes.map(item => (
                  <div key={item.title} className="border-b border-slate-100 pb-5">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-slate-700">{item.why}</p>
                  </div>
                ))}
              </div>
            </section>
            <section id="preguntas" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight">{copy.faq}</h2>
              <div className="mt-5 space-y-6">
                {article.faq.map(item => (
                  <div key={item.question}>
                    <h3 className="text-base font-bold text-slate-900">{item.question}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-slate-700">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
            <section id="fuentes" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold">{copy.sources}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy.sourcesNote}</p>
              <ul className="mt-4 space-y-3">
                {article.sources.map(source => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm font-semibold leading-6 text-blue-700 underline underline-offset-4">
                      {source.title} <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            {CONTEXTUAL_LINKS[locale]?.[article.key] && (
              <section aria-labelledby="related-resources" className="mt-12 border-t border-slate-200 pt-8">
                <h2 id="related-resources" className="text-xl font-bold">{locale === 'es' ? 'Seguí estudiando este tema' : 'Continue learning this topic'}</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {CONTEXTUAL_LINKS[locale]![article.key].map(link => (
                    <Link key={link.href} href={link.href} className="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
                      <span className="block font-bold text-blue-700">{link.label} <ArrowRight className="inline h-4 w-4" aria-hidden="true" /></span>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">{link.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <aside className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-base font-bold">{copy.optional}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{copy.optionalNote}</p>
              <Link href={(locale === 'es' ? '/estudiar-pdf-con-ia' : '/en/study-pdf-with-ai') + '?source=blog-' + encodeURIComponent(article.slug)} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
                {copy.optionalLink} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </aside>
          </article>
          <aside className="hidden lg:block">
            <div className="sticky top-6 border-l border-slate-200 pl-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.inThisGuide}</p>
              <nav aria-label={copy.inThisGuide} className="mt-4 flex flex-col gap-4">
                {article.sections.map((section, i) => (
                  <a className="text-sm leading-6 text-slate-600 hover:text-blue-700" key={section.heading} href={'#seccion-' + (i+1)}>{section.heading}</a>
                ))}
                {workshop && <a href="#guia-practica" className="text-sm font-semibold text-blue-700 hover:underline">{locale === 'es' ? 'Guía práctica completa' : 'Complete worked guide'}</a>}
                {workshop && <a href="#autoevaluacion" className="text-sm text-slate-600 hover:text-blue-700">{locale === 'es' ? 'Ejercicios con respuestas' : 'Exercises with answers'}</a>}
                {workshop && <a href="#plantilla" className="text-sm text-slate-600 hover:text-blue-700">{locale === 'es' ? 'Plantilla para llevarte' : 'Reusable study template'}</a>}
                <a href="#ejercicio" className="text-sm text-slate-600 hover:text-blue-700">{copy.workedExample}</a>
                <a href="#errores" className="text-sm text-slate-600 hover:text-blue-700">{copy.mistakes}</a>
                <a href="#preguntas" className="text-sm text-slate-600 hover:text-blue-700">{copy.faq}</a>
              </nav>
            </div>
          </aside>
        </div>
        <section className="border-t border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-8 sm:py-14">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-700" aria-hidden="true" /><h2 className="text-xl font-bold">{copy.other}</h2></div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {others.map(item => (
                <article key={item.key} className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{item.category}</p>
                  <h3 className="mt-2 font-bold leading-6">
                    <Link href={getStudyBlogPath(locale, item)} className="hover:text-blue-700">{item.title}</Link>
                  </h3>
                </article>
              ))}
            </div>
            <Link href={blogIndex} className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">{copy.back} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <FooterHome variant="full" />
    </div>
  );
}