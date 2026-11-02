import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PUBLIC_DOCS } from '@/lib/student-seo-content';
import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return PUBLIC_DOCS.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const doc=PUBLIC_DOCS.find(x=>x.slug===slug);
 return doc?studyMetadata('/docs/'+slug,doc.title,doc.description):{robots:{index:false,follow:false}};
}
export default async function DocPage({params}:Props){
 const {slug}=await params;const doc=PUBLIC_DOCS.find(x=>x.slug===slug);if(!doc)notFound();
 return <StudentArticleLayout kicker="Ayuda de Evaluo" title={doc.title} description={doc.description} source={'seo-docs-'+slug}>
  <ol className="space-y-5">{doc.steps.map((step,index)=><li key={step.title} className="flex gap-4 border-b border-slate-200 pb-5">
   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{index+1}</span>
   <div><h2 className="text-xl font-bold">{step.title}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{step.text}</p></div>
  </li>)}</ol>
  <p className="mt-8 rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">La interfaz y los límites pueden cambiar. Para cuestiones importantes, comprobá siempre la información y las opciones que aparecen en tu cuenta.</p>
 </StudentArticleLayout>;
}
