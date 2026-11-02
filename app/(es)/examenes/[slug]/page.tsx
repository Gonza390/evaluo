import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PUBLIC_EXAMS } from '@/lib/student-seo-content';
import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';
import { PublicPractice } from '@/components/marketing/public-practice';

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return PUBLIC_EXAMS.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const exam=PUBLIC_EXAMS.find(x=>x.slug===slug);
 return exam?studyMetadata('/examenes/'+slug,exam.title,exam.description):{robots:{index:false,follow:false}};
}
export default async function ExamPage({params}:Props){
 const {slug}=await params;const exam=PUBLIC_EXAMS.find(x=>x.slug===slug);if(!exam)notFound();
 return <StudentArticleLayout kicker="Práctica educativa gratuita" title={exam.title} description={exam.intro} source={'seo-mini-examen-'+slug}>
  <PublicPractice questions={exam.questions}/>
  <section className="mt-8 rounded-2xl border border-slate-200 p-6">
   <h2 className="text-xl font-bold">¿Cómo usar el resultado para estudiar?</h2>
   <p className="mt-3 text-sm leading-7 text-slate-600">Separá las respuestas incorrectas por concepto, revisá el fundamento de cada una y resolvé una pregunta nueva sin consultar la solución. La puntuación de este ejercicio no predice tu nota en un examen real.</p>
   <Link href={exam.nextHref} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Leer la guía de esta materia</Link>
  </section>
 </StudentArticleLayout>;
}
