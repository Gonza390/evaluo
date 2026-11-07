import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { EnglishSeoHeader } from '@/components/marketing/english-seo-header';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { hreflangAlternatePath } from '@/lib/seo/hreflang-clusters';
import { toAbsoluteUrl } from '@/lib/site';

export type EnglishHub = {
  /** 'es' = hub en español neutro (rutas /es/). Por defecto, inglés. */
  locale?: 'es';
  path: string;
  breadcrumb: string;
  eyebrow: string;
  headline: string;
  intro: string;
  decisionTitle: string;
  decisionIntro: string;
  /** Tabla de decisión: necesidad → recomendación, con enlace a la guía. */
  decisions: Array<{ need: string; pick: string; href: string }>;
  cardsTitle: string;
  cards: Array<{ href: string; title: string; text: string; badge?: string }>;
  note: string;
};

/** Hub público en inglés: decisión rápida + enlaces internos a cada guía del cluster. */
const LABELS = {
  en: { home: '/en', cta: 'Start free with my notes', signup: '/en/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1', need: 'If you need to…', use: 'Use', read: 'Read the guide' },
  es: { home: '/', cta: 'Probar gratis con mis apuntes', signup: '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1', need: 'Si necesitas…', use: 'Usa', read: 'Ver la página' },
} as const;

export function EnglishHubPage({ hub }: { hub: EnglishHub }) {
  const spanish = hub.locale === 'es';
  const l = LABELS[spanish ? 'es' : 'en'];
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: hub.headline,
    itemListElement: hub.cards.map((card, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: card.title,
      url: toAbsoluteUrl(card.href),
    })),
  };
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Evaluo', path: l.home },
    { name: hub.breadcrumb, path: hub.path },
  ]);

  return (
    <div lang={spanish ? 'es' : 'en'} className="min-h-screen bg-white text-slate-950">
      {spanish ? null : <InternationalDocumentLanguage lang="en" />}
      <JsonLd data={[breadcrumbs, itemList]} />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {spanish ? (
          <PublicSiteHeader
            variant="landing"
            trackingLocation="hub_es_header"
            alternateHref={hreflangAlternatePath(hub.path, 'en')}
            actions={
              <Link href={l.signup} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800">
                Probar gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        ) : (
          <EnglishSeoHeader alternateHref={hreflangAlternatePath(hub.path, 'es')} />
        )}
      </div>
      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(118deg,#F0F5FF_0%,#FFFFFF_72%)]">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{hub.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{hub.headline}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{hub.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={l.signup} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800">
                {l.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#decision" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-blue-200">
                {hub.decisionTitle}
              </a>
            </div>
          </div>
        </section>

        <section id="decision" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">{hub.decisionTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{hub.decisionIntro}</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-6">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="w-1/2 p-4 font-bold">{l.need}</th>
                  <th scope="col" className="p-4 font-bold">{l.use}</th>
                </tr>
              </thead>
              <tbody>
                {hub.decisions.map((row) => (
                  <tr key={row.need} className="border-t border-slate-200">
                    <td className="p-4 align-top text-slate-700">{row.need}</td>
                    <td className="p-4 align-top"><Link href={row.href} className="font-semibold text-blue-700 underline underline-offset-4">{row.pick}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/60 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">{hub.cardsTitle}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hub.cards.map((card) => (
                <Link key={card.href} href={card.href} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-slate-950 group-hover:text-blue-700">{card.title}</span>
                    {card.badge ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{card.badge}</span> : null}
                  </span>
                  <span className="mt-3 flex-1 text-sm leading-7 text-slate-600">{card.text}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-700">{l.read} <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
            <p className="mt-8 flex max-w-4xl gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
              <Info className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              <span>{hub.note}</span>
            </p>
          </div>
        </section>
      </main>
      <FooterHome locale={spanish ? 'es' : 'en'} register={spanish ? 'neutral' : undefined} />
    </div>
  );
}
