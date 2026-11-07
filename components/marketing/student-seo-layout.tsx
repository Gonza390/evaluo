import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenText, CheckCircle2, FileText } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { toAbsoluteUrl } from '@/lib/site';
import type { SeoHub } from '@/lib/student-seo-content';

export function studyMetadata(path:string,title:string,description:string):Metadata {
  return {
    // El layout ya aplica la plantilla '%s | Evaluo'; agregar la marca acá la duplicaba.
    title,
    description,
    alternates:{canonical:toAbsoluteUrl(path)},
    robots:{index:true,follow:true},
    openGraph:{title:title+' | Evaluo',description,url:toAbsoluteUrl(path),locale:'es_AR',type:'website'}
  };
}

export function StudentSeoShell({children}:{children:ReactNode}) {
  return (
    <div lang="es" className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader variant="landing" trackingLocation="student_seo_header"/>
      </div>
      <main>{children}</main>
      <FooterHome/>
    </div>
  );
}

export function StudentSeoHero({
  kicker,title,description,children
}:{kicker:string;title:string;description:string;children?:ReactNode}) {
  return (
    <header className="border-b border-slate-100 bg-[linear-gradient(145deg,#F4F7FF_0%,#FFFFFF_78%)]">
      <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{kicker}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </header>
  );
}

export function StudyCta({source='student-seo',label='Estudiar con mis apuntes'}:{source?:string;label?:string}) {
  const href='/estudiar-pdf-con-ia?source='+encodeURIComponent(source);
  return (
    <TrackedLink href={href} eventName="cta_click"
      payload={{location:source,cta_name:'estudiar_pdf',destination:'/estudiar-pdf-con-ia'}}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      {label}<ArrowRight className="h-4 w-4" aria-hidden="true"/>
    </TrackedLink>
  );
}

export function StudentSeoCards({cards}:{cards:{title:string;description:string;href:string;label?:string}[]}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map(card=>(
        <article key={card.href} className="flex flex-col rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{card.label||'Recurso gratuito'}</p>
          <h3 className="mt-3 text-xl font-bold leading-7">
            <Link href={card.href} className="hover:text-blue-700 focus-visible:underline">{card.title}</Link>
          </h3>
          <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{card.description}</p>
          <Link href={card.href} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-blue-700 hover:underline">
            Explorar <ArrowRight className="h-4 w-4" aria-hidden="true"/>
          </Link>
        </article>
      ))}
    </div>
  );
}

export function StudentSeoHub({hub}: {hub: SeoHub}) {
  return (
    <StudentSeoShell>
      <StudentSeoHero kicker={hub.kicker} title={hub.title} description={hub.description}>
        <div className="flex flex-wrap gap-3">
          <StudyCta source={'seo-hub-'+hub.path.slice(1)}/>
          <a href="#contenido" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:border-blue-300">Ver recursos</a>
        </div>
      </StudentSeoHero>
      <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-16">
        <section aria-labelledby="intro-recursos">
          <h2 id="intro-recursos" className="text-2xl font-bold tracking-tight">Estudiá con un objetivo concreto</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{hub.intro}</p>
        </section>
        <section id="contenido" className="mt-12 scroll-mt-20" aria-labelledby="recursos-disponibles">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpenText className="h-5 w-5"/></span>
            <h2 id="recursos-disponibles" className="text-2xl font-bold tracking-tight">Recursos para empezar</h2>
          </div>
          <StudentSeoCards cards={hub.cards}/>
        </section>
        <section className="mt-14" aria-labelledby="metodo-de-estudio">
          <h2 id="metodo-de-estudio" className="text-2xl font-bold tracking-tight">Un método para aprovecharlos</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {hub.steps.map((step,index)=>(
              <li key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <span className="text-sm font-black text-blue-700">0{index+1}</span>
                <h3 className="mt-3 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="mt-14 rounded-[26px] border border-blue-100 bg-[#F5F7FF] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-blue-700"><CheckCircle2 className="h-5 w-5"/><span className="text-xs font-bold uppercase tracking-wide">Para estudiar mejor</span></div>
          <h2 className="mt-3 text-2xl font-bold">{hub.benefitTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{hub.benefit}</p>
          <div className="mt-6"><StudyCta source={'seo-hub-bottom-'+hub.path.slice(1)} label="Empezar con mi PDF"/></div>
        </section>
        <nav aria-label="Otras secciones de estudio" className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-bold">También te puede servir</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            {[{href:'/blog',title:'Blog'},{href:'/es/guias',title:'Guías'},{href:'/examenes',title:'Exámenes'},{href:'/planes-de-estudio',title:'Planes'},{href:'/funciones',title:'Funciones'}]
              .filter(item=>item.href!==hub.path).map(item=>(
                <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-slate-700 hover:border-blue-300 hover:text-blue-700">{item.title}</Link>
              ))}
          </div>
        </nav>
      </div>
    </StudentSeoShell>
  );
}
export function StudentArticleLayout({
  kicker,title,description,children,source='student-seo-article'
}:{kicker:string;title:string;description:string;children:ReactNode;source?:string}) {
  return (
    <StudentSeoShell>
      <StudentSeoHero kicker={kicker} title={title} description={description}>
        <StudyCta source={source} label="Practicar con mis apuntes"/>
      </StudentSeoHero>
      <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-16">
        <div className="max-w-[800px]">{children}</div>
        <div className="mt-12 rounded-[26px] border border-blue-100 bg-[#F5F7FF] p-6 sm:p-8">
          <div className="flex items-center gap-3"><FileText className="h-6 w-6 text-blue-700"/><h2 className="text-2xl font-bold">Ahora usá el material de tu materia</h2></div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Estos ejercicios son ejemplos originales de estudio. En Evaluo podés seleccionar tus apuntes y practicar específicamente los temas que estás preparando.</p>
          <div className="mt-5"><StudyCta source={source+'-bottom'} label="Estudiar mi material"/></div>
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/examenes" className="inline-flex min-h-11 items-center gap-2 text-blue-700 hover:underline">Mini exámenes<ArrowRight className="h-4 w-4"/></Link>
          <Link href="/planes-de-estudio" className="inline-flex min-h-11 items-center gap-2 text-blue-700 hover:underline">Planes de estudio<ArrowRight className="h-4 w-4"/></Link>
        </div>
      </div>
    </StudentSeoShell>
  );
}
