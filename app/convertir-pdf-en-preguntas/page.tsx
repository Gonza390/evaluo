import type { Metadata } from 'next';
import { PdfPracticePage } from '@/components/marketing/editorial-study-pages';
import { toAbsoluteUrl } from '@/lib/site';
const path = '/convertir-pdf-en-preguntas';
export const metadata: Metadata = {title: "Generar preguntas a partir de PDF con IA",description: "Generá preguntas a partir de tu PDF con IA: convertí apuntes en ejercicios, respondé por tema, revisá explicaciones y reforzá lo que te cuesta.",alternates:{canonical:toAbsoluteUrl(path)},robots:{index:true,follow:true},openGraph:{title: "Generar preguntas a partir de PDF con IA | Evaluo",description:'Una guía para estudiar, practicar y reforzar desde tu propio PDF.',url:toAbsoluteUrl(path),type:'article'}};
export default function Page(){return <PdfPracticePage/>;}
