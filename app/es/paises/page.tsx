import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, Globe2, GraduationCap } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { FooterHome } from '@/components/footer-home';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';
import { SPANISH_MARKETS } from '@/lib/spanish-markets';
import { COUNTRY_NICHE_GUIDES } from '@/lib/es-country-niche-guides';

const path = '/es/paises';
export const metadata: Metadata = {
  title: 'Estudiar con IA en español: guías por país y examen',
  description: 'Recursos para estudiar con apuntes PDF en países de habla hispana. Guías originales para Ceneval, PAES, San Marcos y USAC y métodos de estudio generales.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    locale: 'es',
    type: 'website',
    title: 'Guías para estudiar en español por país | Evaluo',
    description: 'Encuentra métodos de estudio por país y practica tus propios apuntes PDF con Evaluo.',
    url: toAbsoluteUrl(path),
  },
};
const featured = COUNTRY_NICHE_GUIDES.map(g=>({
  ...g, href: `/es/paises/${g.slug}`,
}));
const rest = SPANISH_MARKETS.filter(m=>m.status!=='guía verificada');

export default function PaisesEstudioPage() {
  return (
    <div lang="es" className="min-h-screen bg-white text-slate-950">
      <JsonLd data={buildBreadcrumbJsonLd([{name:'Inicio',path:'/'},{name:'Recursos en español',path:'/es/guias'},{name:'Guías por país',path}])}/>
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader variant="landing" trackingLocation="hispanic_market_hub_header"/>
      </div>
      <main>
        <header className="border-b border-slate-100 bg-[linear-gradient(135deg,#F1F5FF_0%,#FFFFFF_84%)]">
          <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-20">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              <Globe2 className="h-4 w-4" aria-hidden="true" /> Evaluo en español
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Tu país cambia los exámenes. Tu forma de aprender puede mejorar.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              Encuentra guías de estudio para distintos procesos de ingreso universitario y formas
              de estudiar en español. No necesitas un examen oficial de otra institución:
              puedes seleccionar el PDF de tu materia, practicar conceptos y revisar tus errores.
            </p>
            <TrackedLink
              href="/es/estudiar-pdf-con-ia?source=es-paises"
              eventName="cta_click"
              payload={{location:'hispanic_market_hub_hero',cta_name:'seleccionar_pdf',source:'es-paises',destination:'/es/estudiar-pdf-con-ia'}}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Comenzar con mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true"/>
            </TrackedLink>
          </div>
        </header>
        <section className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-18" aria-labelledby="paises-verificados">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Nuevas guías investigadas</p>
          <h2 id="paises-verificados" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Cuatro rutas de estudio con fuentes oficiales
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Cada guía explica un proceso concreto, enlaza la información institucional y muestra
            cómo aprovechar tu propio documento para practicar. Evaluo no pertenece a las instituciones
            mencionadas ni reproduce sus exámenes oficiales.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {featured.map((guide)=>(
              <article key={guide.slug} className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.04)]">
                <p className="text-xs font-bold text-blue-700">{guide.country} · {guide.exam}</p>
                <h3 className="mt-3 text-xl font-bold leading-7 tracking-tight">{guide.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{guide.summary}</p>
                <Link href={guide.href} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-blue-700 hover:underline">
                  Ver método de estudio <ArrowRight className="h-4 w-4" aria-hidden="true"/>
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="border-y border-slate-100 bg-slate-50/70 py-12 sm:py-16" aria-labelledby="otros-mercados">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Aprender en español</p>
            <h2 id="otros-mercados" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Recursos para más países hispanohablantes
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Estas son líneas de investigación, no guías oficiales ni afirmaciones sobre volúmenes de búsqueda.
              Para países sin una guía local verificada, te llevamos a una página de estudio en español
              ya existente, en lugar de publicar contenido repetido bajo distintos nombres.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((market)=>(
                <div key={market.code} className="flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-950">{market.country}</h3>
                    <span className="text-[11px] font-semibold text-slate-500">{market.status === 'en investigación' ? 'En estudio' : 'Disponible'}</span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{market.hypothesis}</p>
                  <Link href={market.href} className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
                    {market.status === 'en investigación' ? 'Ver recursos generales' : 'Explorar recursos'} <ArrowRight className="h-4 w-4" aria-hidden="true"/>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-[1120px] gap-5 px-4 py-14 sm:px-8 md:grid-cols-2" aria-labelledby="elegir-metodo">
          <div className="rounded-[24px] border border-blue-100 bg-blue-50/50 p-6 sm:p-8">
            <GraduationCap className="h-7 w-7 text-blue-700" aria-hidden="true"/>
            <h2 id="elegir-metodo" className="mt-4 text-xl font-bold">¿Buscas cómo estudiar una materia?</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Anatomía, derecho, psicología, economía y técnicas de recuperación con ejemplos adaptables a cualquier universidad.</p>
            <Link href="/es/guias" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
              Explorar guías por materia <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8">
            <FileText className="h-7 w-7 text-blue-700" aria-hidden="true"/>
            <h2 className="mt-4 text-xl font-bold">¿Ya tienes un PDF para estudiar?</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Selecciona tus propios apuntes y prepara preguntas por tema. Compara siempre los conceptos técnicos con el material original.</p>
            <TrackedLink href="/es/estudiar-pdf-con-ia?source=es-paises"
              eventName="cta_click"
              payload={{location:'hispanic_market_hub_bottom',cta_name:'seleccionar_pdf',source:'es-paises',destination:'/es/estudiar-pdf-con-ia'}}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
              Elegir mi PDF <ArrowRight className="h-4 w-4"/>
            </TrackedLink>
          </div>
        </section>
      </main>
      <FooterHome/>
    </div>
  );
}
