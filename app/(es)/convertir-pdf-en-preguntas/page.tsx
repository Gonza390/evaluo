import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { PdfPracticePage } from '@/components/marketing/editorial-study-pages';
import { toAbsoluteUrl } from '@/lib/site';
const path = '/convertir-pdf-en-preguntas';
export const metadata: Metadata = {title: 'Generar preguntas a partir de un PDF con IA, gratis',description:
    'Generá preguntas a partir de un PDF con IA, gratis: elegís el archivo sin registrarte, respondés por tema y revisás explicaciones de lo que te cuesta.',alternates:hreflangAlternates('pdf-to-quiz', 'es'),robots:{index:true,follow:true},openGraph:{title: 'Generar preguntas a partir de un PDF con IA, gratis | Evaluo',description:'Una guía para estudiar, practicar y reforzar desde tu propio PDF.',url:toAbsoluteUrl(path),type:'article'}};
export default function Page(){return <PdfPracticePage/>;}
