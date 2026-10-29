import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, ExternalLink, FileText, Globe2 } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { FooterHome } from '@/components/footer-home';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';
import { COUNTRY_NICHE_GUIDES, getCountryNicheGuide } from '@/lib/es-country-niche-guides';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTRY_NICHE_GUIDES.map(({slug}) => ({slug}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  const guide = getCountryNicheGuide(slug);
  if (!guide) return {robots:{index:false,follow:false},title:'Guía de estudio'};
  const path = `/es/paises/${slug}`;
  return {
    title: guide.seoTitle,
    description: guide.description,
    alternates: {canonical:toAbsoluteUrl(path)},
    robots: {index:true,follow:true},
    openGraph: {
      type:'article',title:guide.seoTitle+' | Evaluo',
      description:guide.description,url:toAbsoluteUrl(path),locale:'es',
    },
  };
}

export default async function CountryStudyGuidePage({params}: Props) {
  const {slug}=await params;
  const guide=getCountryNicheGuide(slug);
  if(!guide) notFound();

  const path=`/es/paises/${guide.slug}`;
  const source=`pais-${guide.slug}`;
  const ctaHref=`/es/estudiar-pdf-con-ia?source=${encodeURIComponent(source)}`;
  const related=COUNTRY_NICHE_GUIDES.filter(x=>x.slug!==guide.slug).slice(0,3);

  return (
    <div lang="es" className="min-h-screen bg-white text-slate-950">
      <JsonLd data={[
        buildBreadcrumbJsonLd([
          {name:'Inicio',path:'/'},
          {name:'Guías por país',path:'/es/paises'},
          {name:guide.title,path},
        ]),
        {
          '@context':'https://schema.org',
          '@type':'Article',
          headline:guide.title,
          description:guide.description,
          inLanguage:'es',
          datePublished:'2026-10-29',
          dateModified:'2026-10-29',
          author:{'@type':'Organization',name:'Evaluo'},
          publisher:{'@type':'Organization',name:'Evaluo'},
          mainEntityOfPage:toAbsoluteUrl(path),
          about:{'@type':'Thing',name:guide.exam},
        },
      ]}/>
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader variant="landing" trackingLocation="hispanic_market_guide_header"/>
      </div>
      <main>
        <header className="border-b border-blue-100 bg-[linear-gradient(140deg,#EFF6FF_0%,#FFFFFF_85%)]">
          <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-16">
            <Link href="/es/paises" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true"/> Todas las guías por país
            </Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-blue-700">{guide.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{guide.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{guide.focus}</p>
            <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">Para quién: {guide.audience}</p>
            <TrackedLink href={ctaHref}
              eventName="cta_click"
              payload={{location:'hispanic_country_guide_hero',cta_name:'practicar_pdf',country:guide.country,source,guide_slug:guide.slug,destination:'/es/estudiar-pdf-con-ia'}}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">
              Practicar con mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true"/>
            </TrackedLink>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
          <article className="min-w-0">
            <section aria-labelledby="fuente-oficial" className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-blue-700" aria-hidden="true"/>
                <h2 id="fuente-oficial" className="text-lg font-bold">Empieza en la fuente oficial</h2>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Esta guía es editorial e independiente. Para conocer requisitos, ediciones del temario,
                convocatorias y materiales oficiales consulta siempre la institución responsable.
              </p>
              <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-4">
                {guide.sourceName} <ExternalLink className="h-4 w-4" aria-hidden="true"/>
              </a>
            </section>

            <section id="metodo" className="mt-12 scroll-mt-24" aria-labelledby="metodo-pais">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Preparación paso a paso</p>
              <h2 id="metodo-pais" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Cómo estudiar el material que realmente necesitas
              </h2>
              <ol className="mt-6 space-y-5">
                {guide.steps.map(([heading,detail],i)=>(
                  <li key={heading} className="flex gap-4 border-b border-slate-100 pb-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{i+1}</span>
                    <div>
                      <h3 className="text-lg font-bold">{heading}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="ejemplo" className="mt-12 scroll-mt-24 rounded-[26px] border border-blue-100 bg-blue-50/50 p-6 sm:p-8" aria-labelledby="ejemplo-pais">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Ejemplo educativo · No oficial</p>
              <h2 id="ejemplo-pais" className="mt-3 text-2xl font-bold tracking-tight">{guide.exampleTitle}</h2>
              <p className="mt-3 text-sm leading-8 text-slate-700 sm:text-base">{guide.example}</p>
              <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-6 text-slate-600">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true"/>
                Para practicar, intenta contestar antes de revisar el documento. Las explicaciones automáticas pueden contener errores.
              </p>
            </section>

            <section id="errores" className="mt-12 scroll-mt-24" aria-labelledby="errores-pais">
              <h2 id="errores-pais" className="text-2xl font-bold tracking-tight">Errores que conviene evitar</h2>
              <div className="mt-5 space-y-6">
                {guide.pitfalls.map(([heading,detail])=>(
                  <div key={heading} className="border-l-2 border-blue-200 pl-5">
                    <h3 className="text-base font-bold">{heading}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="preguntas" className="mt-12 scroll-mt-24" aria-labelledby="preguntas-pais">
              <h2 id="preguntas-pais" className="text-2xl font-bold tracking-tight">Preguntas frecuentes</h2>
              <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                {guide.faq.map(([q,a])=>(
                  <div key={q} className="py-5">
                    <h3 className="text-base font-bold">{q}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12 rounded-[26px] border border-blue-100 bg-[linear-gradient(115deg,#EFF6FF_0%,white_100%)] p-6 sm:p-8">
              <BookOpenCheck className="h-6 w-6 text-blue-700" aria-hidden="true"/>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Del temario a la práctica por temas</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Si tienes un documento que puedas utilizar legalmente, selecciona tu PDF
                y empieza con los contenidos que necesitas reforzar. Evaluo crea material
                de estudio desde el archivo: no ofrece preguntas oficiales ni garantiza resultados.
              </p>
              <TrackedLink href={ctaHref} eventName="cta_click"
                payload={{location:'hispanic_country_guide_after_article',cta_name:'practicar_pdf',country:guide.country,source,guide_slug:guide.slug,destination:'/es/estudiar-pdf-con-ia'}}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">
                Seleccionar mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true"/>
              </TrackedLink>
              <p className="mt-3 text-xs text-slate-500">Puedes elegir tu archivo antes de registrarte. El plan gratuito tiene límites de uso.</p>
            </section>
            <p className="mt-8 text-xs leading-6 text-slate-500">
              Publicado el 29 de octubre de 2026. Evaluo es independiente de las instituciones
              mencionadas. La fuente oficial enlazada es la referencia válida para programas y reglas de admisión.
            </p>
          </article>

          <aside className="min-w-0">
            <nav aria-label="Navegación de la guía" className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">En esta guía</p>
              <div className="mt-3 flex flex-col gap-1 text-sm font-semibold text-blue-700">
                {[['#fuente-oficial','Fuente oficial'],['#metodo','Método'],['#ejemplo','Ejemplo'],['#errores','Errores'],['#preguntas','Preguntas frecuentes']].map(([href,label])=>(
                  <a href={href} key={href} className="flex min-h-10 items-center hover:underline">{label}</a>
                ))}
              </div>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold">Guías de otros países</p>
                <div className="mt-2 flex flex-col gap-2">
                  {related.map(item=>(
                    <Link key={item.slug} href={`/es/paises/${item.slug}`}
                      className="min-h-10 py-2 text-sm leading-6 text-slate-600 hover:text-blue-700">
                      {item.country}: {item.exam}
                    </Link>
                  ))}
                </div>
                <Link href="/es/paises" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
                  Todos los países <ArrowRight className="h-4 w-4" aria-hidden="true"/>
                </Link>
              </div>
            </nav>
          </aside>
        </div>
      </main>
      <FooterHome/>
    </div>
  );
}
