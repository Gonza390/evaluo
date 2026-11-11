import Link from 'next/link';
import { ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { EnglishSeoHeader } from '@/components/marketing/english-seo-header';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { JsonLd } from '@/components/seo/JsonLd';
import { BEST_AI_CONTENT, type BestAiLocale } from '@/lib/best-ai-study-tools';
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';
import { hreflangAlternatePath } from '@/lib/seo/hreflang-clusters';

// Guía comparativa "Mejores IA para estudiar" (ES neutro y EN). Apunta a búsquedas informativas
// de alto volumen ("best AI for studying") que hoy citan los resúmenes de IA de Google, y declara
// que Evaluo es producto propio. El contenido vive en lib/best-ai-study-tools.ts.
const ISO_DATE = '2026-11-11';

function isExternal(href: string) {
  return href.startsWith('http');
}

export function BestAiStudyPage({ locale }: { locale: BestAiLocale }) {
  const c = BEST_AI_CONTENT[locale];
  const english = locale === 'en';
  const alternate = hreflangAlternatePath(c.path, english ? 'es' : 'en');
  const uploaderAnchor = english ? 'choose-file' : 'elegir-pdf';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.intro,
    inLanguage: english ? 'en' : 'es',
    datePublished: ISO_DATE,
    dateModified: ISO_DATE,
    mainEntityOfPage: toAbsoluteUrl(c.path),
    author: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
    publisher: { '@id': toAbsoluteUrl('/#organization') },
  };
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.title,
    itemListElement: c.tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      url: toAbsoluteUrl(c.path) + '#' + tool.id,
    })),
  };

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
          articleJsonLd,
          itemListJsonLd,
          buildFaqJsonLd(c.faq),
        ]}
      />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        {english ? (
          <EnglishSeoHeader alternateHref={alternate} />
        ) : (
          <PublicSiteHeader variant="landing" trackingLocation="best_ai_es_header" alternateHref={alternate} />
        )}
      </div>

      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(118deg,#F0F5FF_0%,#FFFFFF_72%)]">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{c.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{c.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{c.intro}</p>
            <p className="mt-4 text-xs text-slate-500">
              {c.updatedLabel} <time dateTime={ISO_DATE}>{c.updatedDate}</time>
            </p>
            <p className="mt-6 flex max-w-3xl gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-sm leading-7 text-slate-700">
              <Info className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              {c.disclosure}
            </p>
          </div>
        </section>

        <section aria-labelledby="quick-answer" className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
          <h2 id="quick-answer" className="text-3xl font-bold tracking-tight">{c.quickTitle}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {c.quick.map((item) => (
              <li key={item.need} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm leading-6 text-slate-600">{item.need}</p>
                <a href={'#' + item.anchor} className="mt-2 inline-flex items-center gap-2 text-base font-bold text-blue-700 hover:underline">
                  {item.pick} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="comparison-table" className="border-y border-slate-100 bg-slate-50/60 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 id="comparison-table" className="text-3xl font-bold tracking-tight">{c.tableTitle}</h2>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm leading-6">
                <thead className="bg-slate-50">
                  <tr>
                    {c.tableHeaders.map((header) => (
                      <th key={header} scope="col" className="p-4 font-bold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.tools.map((tool) => (
                    <tr key={tool.id} className={'border-t border-slate-200' + (tool.isEvaluo ? ' bg-blue-50/40' : '')}>
                      <th scope="row" className="p-4 font-bold">
                        <a href={'#' + tool.id} className="hover:underline">{tool.name}</a>
                      </th>
                      <td className="p-4 text-slate-700">{tool.bestFor}</td>
                      <td className="p-4 text-slate-700">{tool.fromYourFiles}</td>
                      <td className="p-4 text-slate-700">{tool.flashcards} · {tool.practice}</td>
                      <td className="p-4 text-slate-700">{tool.freePlan}</td>
                      <td className="p-4 text-slate-700">{tool.spanish}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="tools" className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
          <h2 id="tools" className="text-3xl font-bold tracking-tight">{c.toolsTitle}</h2>
          <div className="mt-8 space-y-6">
            {c.tools.map((tool, index) => (
              <article key={tool.id} id={tool.id} className={'scroll-mt-24 rounded-2xl border p-6 sm:p-8 ' + (tool.isEvaluo ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white')}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                  {index + 1}. {c.labels.bestFor}: {tool.bestFor}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">{tool.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{tool.summary}</p>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-bold">{c.labels.strengths}</h4>
                    <ul className="mt-2 space-y-2">
                      {tool.strengths.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{c.labels.watchOut}</h4>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                      {tool.watchOut.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-700">
                  <strong>{c.labels.pricing}:</strong> {tool.pricing}{' '}
                  {isExternal(tool.officialHref) ? (
                    <a href={tool.officialHref} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{c.labels.official}</a>
                  ) : (
                    <Link href={tool.officialHref} className="text-blue-700 underline">{c.labels.official}</Link>
                  )}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {c.labels.sources}:{' '}
                  {tool.sources.map((source, sourceIndex) => (
                    <span key={source.href}>
                      {sourceIndex > 0 ? ' · ' : ''}
                      {isExternal(source.href) ? (
                        <a href={source.href} target="_blank" rel="noopener noreferrer" className="underline">{source.title}</a>
                      ) : (
                        <Link href={source.href} className="underline">{source.title}</Link>
                      )}
                    </span>
                  ))}
                </p>
                {tool.isEvaluo ? (
                  <a href={'#' + uploaderAnchor} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800">
                    {c.ctaTitle} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="tips" className="border-y border-slate-100 bg-slate-50/60 py-14">
          <div className="mx-auto grid max-w-5xl gap-10 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <h2 id="tips" className="text-2xl font-bold tracking-tight">{c.tipsTitle}</h2>
              <ul className="mt-5 space-y-3">
                {c.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm leading-7 text-slate-700">
                    <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{c.methodTitle}</h2>
              <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-700">
                {c.method.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="cta" className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
          <div className="grid gap-8 rounded-[28px] border border-blue-100 bg-[linear-gradient(118deg,#F0F5FF_0%,#FFFFFF_80%)] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 id="cta" className="text-3xl font-bold tracking-tight">{c.ctaTitle}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">{c.ctaText}</p>
            </div>
            <div id={uploaderAnchor} className="scroll-mt-24">
              <PdfFirstLandingUploader
                trackingLocation={'best_ai_' + locale + '_cta'}
                sourceKey={'best-ai-' + locale}
                locale={english ? 'en' : 'neutral'}
                market={english ? 'en' : undefined}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="faq" className="mx-auto max-w-5xl px-5 pb-14 sm:px-8">
          <h2 id="faq" className="text-3xl font-bold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">
            {c.faq.map((item) => (
              <details key={item.question} className="py-5">
                <summary className="cursor-pointer text-sm font-bold">{item.question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>

          <h2 className="mt-12 text-xl font-bold tracking-tight">{c.relatedTitle}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {c.related.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold hover:border-blue-300">
                  {item.title} <ArrowRight className="h-4 w-4 text-blue-700" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <FooterHome locale={english ? 'en' : 'es'} register={english ? undefined : 'neutral'} />
    </div>
  );
}
