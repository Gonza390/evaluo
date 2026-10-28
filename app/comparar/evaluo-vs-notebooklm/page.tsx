import type { Metadata } from 'next';
import { NotebookComparisonPage } from '@/components/marketing/editorial-study-pages';
import { toAbsoluteUrl } from '@/lib/site';
const path = '/comparar/evaluo-vs-notebooklm';
export const metadata: Metadata = {title:'Evaluo vs. NotebookLM: cuál elegir para estudiar',description:'Compará NotebookLM y Evaluo para estudiar con tus apuntes: fuentes, resúmenes, cuestionarios, flashcards, práctica por tema y refuerzo.',alternates:{canonical:toAbsoluteUrl(path)},robots:{index:true,follow:true},openGraph:{title:'Evaluo vs. NotebookLM: dos formas de estudiar',description:'Una comparación clara sobre cómo usar tus apuntes para comprender, practicar y preparar exámenes.',url:toAbsoluteUrl(path),type:'article'}};
export default function Page(){return <NotebookComparisonPage/>;}
