import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PUBLIC_TOPICS } from '@/lib/student-seo-content';
import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';
import { PublicPractice } from '@/components/marketing/public-practice';

type Props = { params: Promise<{materia:string;slug:string}> };
export const dynamicParams = false;
export function generateStaticParams() { return PUBLIC_TOPICS.map(t=>({materia:t.subject,slug:t.slug})); }
export async function generateMetadata({params}:Props):Promise<Metadata> {
 const {materia,slug}=await params;
 const topic=PUBLIC_TOPICS.find(t=>t.subject===materia&&t.slug===slug);
 return topic?studyMetadata('/temas/'+materia+'/'+slug,topic.title,topic.description):{robots:{index:false,follow:false}};
}
export default async function TopicPage({params}:Props) {
 const {materia,slug}=await params;
 const topic=PUBLIC_TOPICS.find(t=>t.subject===materia&&t.slug===slug);
 if(!topic)notFound();
 return <StudentArticleLayout kicker={'Tema de '+topic.subject} title={topic.title} description={topic.lead} source={'seo-tema-'+topic.slug}>
  <article className="space-y-9">
   {topic.sections.map(section=><section key={section.title}>
    <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
    <p className="mt-4 text-base leading-8 text-slate-700">{section.body}</p>
   </section>)}
   <PublicPractice questions={[topic.practice]}/>
   <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">Esta explicación es introductoria y no reemplaza el programa de tu materia. Para profundizar, consultá <Link href={topic.relatedHref} className="font-bold text-blue-700 underline">nuestra guía de estudio relacionada</Link> y comprobá los conceptos en tus apuntes.</p>
  </article>
 </StudentArticleLayout>;
}
