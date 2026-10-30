import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, FileText, Globe2, Layers3, ShieldCheck } from 'lucide-react';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { ENGLISH_PAGES, ENGLISH_PAGE_ORDER, type EnglishPageKey } from '@/lib/english-seo-content';

const slugs: Record<EnglishPageKey, string> = {
  home: 'English study resources',
  'pdf-to-quiz': 'PDF to Quiz',
  'pdf-to-flashcards': 'PDF to Flashcards',
  'study-pdf-with-ai': 'Study a PDF with AI',
};

export function EnglishStudyPage({ pageKey }: { pageKey: EnglishPageKey }) {
  const page = ENGLISH_PAGES[pageKey];
  const otherPages = ENGLISH_PAGE_ORDER.filter((key) => key !== pageKey);
  const breadcrumbs = [{ name: 'English', path: '/en' }];
  if (pageKey !== 'home') breadcrumbs.push({ name: slugs[pageKey], path: page.path });
  const breadcrumbData = buildBreadcrumbJsonLd(breadcrumbs);

  return (
    <div lang="en" className="min-h-screen bg-white text-slate-950">
      <InternationalDocumentLanguage lang="en" />
      <JsonLd data={breadcrumbData} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/en" className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-950" aria-label="Evaluo English study resources">
            <Image src="/evaluo-logo-icono.svg" alt="" width={34} height={34} className="h-9 w-9" />
            Evaluo
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">English</span>
          </Link>
          <nav aria-label="English study guides" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
            <Link className="hover:text-blue-700" href="/en/pdf-to-quiz">PDF to Quiz</Link>
            <Link className="hover:text-blue-700" href="/en/pdf-to-flashcards">Flashcards</Link>
            <Link className="hover:text-blue-700" href="/en/study-pdf-with-ai">Study PDFs</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(118deg,#F0F5FF_0%,#FFFFFF_72%)]">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> {page.eyebrow}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">{page.headline}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{page.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#worked-example" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800">
                Explore the worked example <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#study-method" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-blue-200">
                Read the study method
              </a>
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-600">
              <strong className="font-semibold text-slate-800">For:</strong> {page.audience}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><Layers3 className="h-5 w-5" aria-hidden="true" /> Learning goal</div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">What you should get from this guide</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{page.outcome}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><ShieldCheck className="h-5 w-5" aria-hidden="true" /> Editorial note</div>
              <h2 className="mt-3 text-xl font-bold tracking-tight">Illustrative study examples</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                The passages and questions below are educational examples prepared for this guide, not outputs from a verified Evaluo session or official exam questions. Always check your own course PDF and lecturer instructions.
              </p>
            </div>
          </div>
        </section>

        <section id="worked-example" className="border-y border-slate-100 bg-slate-50/60 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Practice with a source</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-slate-950">{page.exampleTitle}</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><FileText className="h-5 w-5" aria-hidden="true" /> Short teaching passage</div>
                <p className="mt-5 text-base leading-8 text-slate-800">{page.exampleSource}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-6 sm:p-8">
                <p className="text-sm font-bold text-blue-700">Try to answer before looking</p>
                <h3 className="mt-3 text-xl font-semibold leading-8 text-slate-950">{page.exampleQuestion}</h3>
                <details className="group mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <summary className="cursor-pointer text-sm font-bold text-slate-900">Reveal the checked example answer</summary>
                  <p className="mt-4 text-sm font-semibold leading-7 text-slate-950">{page.exampleAnswer}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{page.exampleExplanation}</p>
                </details>
              </div>
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true"/>
              <div>
                <h3 className="text-sm font-bold text-slate-950">How to verify this answer</h3>
                <p className="mt-1 text-sm leading-7 text-slate-700">{page.verification}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="study-method" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Practical process</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">A repeatable method you can use with your own PDF</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {page.steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Common mistakes to avoid</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {page.mistakes.map((mistake) => (
                <div key={mistake.title} className="border-l-2 border-blue-200 py-2 pl-5">
                  <h3 className="font-bold text-slate-950">{mistake.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{mistake.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm leading-7 text-slate-600">
              For a research-based overview of practice testing and distributed practice, see the{' '}
              <a className="font-semibold text-blue-700 underline underline-offset-2" href="https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html" rel="noopener noreferrer" target="_blank">
                Association for Psychological Science review of learning techniques
              </a>.
              This resource supports the study-method discussion; it does not validate individual AI-generated questions.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Frequently asked questions</h2>
          <div className="mt-6 max-w-4xl divide-y divide-slate-200 border-y border-slate-200">
            {page.faq.map((item) => (
              <div key={item.question} className="py-5">
                <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Keep learning</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">More PDF study guides</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {otherPages.map((key) => (
                <Link href={ENGLISH_PAGES[key].path} key={key} className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-900 transition hover:border-blue-300 hover:text-blue-700">
                  {slugs[key]} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true"/>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#101D42] py-12 text-white">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-200"><Globe2 className="h-4 w-4" aria-hidden="true"/> Product language</div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Evaluo’s English study guides are here. The English app is coming later.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-200">
                The current product, including sign-in, navigation and pricing, is primarily in Spanish.
                You can explore it now if you are comfortable using a Spanish-language interface.
                We are not presenting the current app as fully translated or promising international checkout.
              </p>
              <Link href="/estudiar-pdf-con-ia" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50">
                Explore the current Spanish-language app <ArrowRight className="h-4 w-4" aria-hidden="true"/>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-slate-600 sm:px-8">
          <span>© Evaluo · Independent study resources, not official examination materials.</span>
          <nav aria-label="Language and legal links" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/en" className="font-semibold hover:text-blue-700">English</Link>
            <Link href="/es/estudiar-pdf-con-ia" className="hover:text-blue-700">Español</Link>
            <Link href="/privacidad" className="hover:text-blue-700">Privacy (Spanish)</Link>
            <Link href="/terminos" className="hover:text-blue-700">Terms (Spanish)</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
