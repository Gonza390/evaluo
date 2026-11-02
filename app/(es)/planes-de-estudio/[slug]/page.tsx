import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PUBLIC_PLANS } from '@/lib/student-seo-content';
import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return PUBLIC_PLANS.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const plan=PUBLIC_PLANS.find(x=>x.slug===slug);
 return plan?studyMetadata('/planes-de-estudio/'+slug,plan.title,plan.description):{robots:{index:false,follow:false}};
}
export default async function PlanPage({params}:Props){
 const {slug}=await params;const plan=PUBLIC_PLANS.find(x=>x.slug===slug);if(!plan)notFound();
 return <StudentArticleLayout kicker="Organización para el examen" title={plan.title} description={plan.intro} source={'seo-plan-'+slug}>
  <section>
   <h2 className="text-2xl font-bold">Tu recorrido de estudio</h2>
   <p className="mt-3 text-sm leading-7 text-slate-600">Usá este plan como guía y ajustalo según tu temario. Incluí preguntas, revisión de errores y descansos en vez de dedicar todo el tiempo a releer.</p>
   <ol className="mt-7 space-y-4">
    {plan.steps.map((step,index)=><li key={step.label} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{index+1}</span>
      <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{step.label}</p><h3 className="mt-1 text-lg font-bold">{step.goal}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{step.activity}</p></div>
    </li>)}
   </ol>
  </section>
  <section className="mt-9 rounded-2xl bg-slate-50 p-6">
   <h2 className="text-xl font-bold">¿Cuántos temas te conviene hacer por día?</h2>
   <p className="mt-3 text-sm leading-7 text-slate-600">Calculalo según los días y horas que realmente tenés disponibles. Algunos temas requieren más tiempo que otros.</p>
   <Link href="/herramientas/calculadora-de-estudio" className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700 hover:underline">Usar calculadora de estudio</Link>
  </section>
 </StudentArticleLayout>;
}
