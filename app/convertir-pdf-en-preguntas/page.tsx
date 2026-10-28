import type { Metadata } from 'next';
import { PdfPracticePage } from '@/components/marketing/editorial-study-pages';
import { toAbsoluteUrl } from '@/lib/site';
const path = '/convertir-pdf-en-preguntas';
export const metadata: Metadata = {title:'Convertir PDF en preguntas con IA para practicar',description:'Convertí tus apuntes PDF en preguntas para estudiar por tema, revisar errores y reforzar antes del examen. Guía práctica con Evaluo.',alternates:{canonical:toAbsoluteUrl(path)},robots:{index:true,follow:true},openGraph:{title:'De PDF a preguntas de práctica | Evaluo',description:'Una guía para estudiar, practicar y reforzar desde tu propio PDF.',url:toAbsoluteUrl(path),type:'article'}};
export default function Page(){return <PdfPracticePage/>;}
