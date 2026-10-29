import type { Metadata } from 'next';
import { PdfPracticePage } from '@/components/marketing/editorial-study-pages';
import { toAbsoluteUrl } from '@/lib/site';
const path = '/convertir-pdf-en-preguntas';
export const metadata: Metadata = {title:'Generar preguntas desde PDF con IA | Evaluo',description:'Generá preguntas de examen desde tu PDF con IA. Convertí apuntes en práctica por tema, revisá errores y prepará tus parciales en Evaluo.',alternates:{canonical:toAbsoluteUrl(path)},robots:{index:true,follow:true},openGraph:{title:'Generar preguntas desde PDF con IA | Evaluo',description:'Una guía para estudiar, practicar y reforzar desde tu propio PDF.',url:toAbsoluteUrl(path),type:'article'}};
export default function Page(){return <PdfPracticePage/>;}
