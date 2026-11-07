import Link from 'next/link';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { ArrowRight, BookOpenText, CheckCircle2, ClipboardCheck, FileQuestion, Layers3 } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { EnglishSeoHeader } from '@/components/marketing/english-seo-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';

export type PracticeLandingKind = 'true-false' | 'match-concepts';
export type PracticeLandingLocale = 'es' | 'en';

type LandingCopy = {
 eyebrow: string; title: string; metaTitle: string; metaDescription: string; intro: string; exampleHeading: string; examplePrompt: string;
 exampleOptions: string[]; exampleResult: string; stages: {title:string;text:string}[];
 teachingTitle:string;teaching:string[]; cautionTitle:string;caution:string;
 faq:{q:string;a:string}[]; cta:string; secondary:string;
};

const COPY: Record<PracticeLandingLocale,Record<PracticeLandingKind,LandingCopy>> = {
 es: {
  'true-false': {
   eyebrow:'Practicar con Evaluo · Verdadero o falso',
   title:'Preguntas de verdadero o falso con IA para estudiar',
   metaTitle:'Verdadero o falso con IA gratis: preguntas desde tu PDF',
   metaDescription:'Generá preguntas de verdadero o falso con IA a partir de tu PDF, gratis. Elegís el archivo sin registrarte y practicás con explicaciones de cada respuesta.',
   intro:'Convertí tus apuntes en una práctica que te obligue a decidir si una afirmación es correcta y, sobre todo, explicar por qué. Un verdadero o falso bien diseñado no consiste en adivinar: diferencia conceptos parecidos y descubre errores que una lectura rápida puede ocultar.',
   exampleHeading:'Ejemplo de una pregunta que comprueba comprensión',
   examplePrompt:'En una célula eucariota típica, toda la producción de ATP ocurre dentro de las mitocondrias.',
   exampleOptions:['Verdadero','Falso'],
   exampleResult:'Falso. Aunque la mitocondria participa en la fosforilación oxidativa, la glucólisis ocurre en el citosol y también produce ATP. La palabra «toda» vuelve incorrecta la afirmación.',
   stages:[
    {title:'Elegí el material que estás estudiando',text:'Ingresá al recorrido de Evaluo y seleccioná un documento de tu materia. La calidad de las preguntas depende de que el contenido sea legible y esté bien organizado.'},
    {title:'Ubicá el tema que querés practicar',text:'Después de revisar un apartado, elegí practicar sobre ese contenido. En las modalidades disponibles, las preguntas te ayudan a comprobar conocimientos concretos.'},
    {title:'Respondé antes de ver la explicación',text:'Tomá una decisión sin releer la fuente; verificá por qué la afirmación es correcta o cuál es el matiz que la vuelve falsa.'},
    {title:'Corregí la confusión y volvé a intentarlo',text:'Si te equivocás, buscá el concepto original y practicá una variación. El resultado no sustituye la evaluación oficial.'}
   ],
   teachingTitle:'Cómo obtener una práctica más útil',
   teaching:[
    'Una afirmación eficaz es precisa, verificable y no depende de trampas lingüísticas. Cuando aparecen palabras absolutas como «siempre» o «nunca», comprobá que el contenido realmente las justifique.',
    'No memorices solamente si la respuesta era verdadera o falsa. Explicá qué evidencia del material permite sostenerla y qué cambiaría la conclusión.',
    'Mezclá preguntas fáciles con otras que relacionen conceptos. Repetir siempre la misma formulación puede medir memoria de la consigna y no comprensión.'
   ],
   cautionTitle:'La explicación importa más que acertar',
   caution:'Evaluo genera contenido de práctica con IA. Revisá afirmaciones científicas, normativa, cifras y excepciones contra el material original; una respuesta automática puede contener imprecisiones.',
   faq:[
    {q:'¿Para qué materias sirve el verdadero o falso?',a:'Puede ayudar a repasar definiciones, procesos y relaciones en distintas materias. La utilidad depende de que las afirmaciones sean inequívocas y se ajusten al material.'},
    {q:'¿Sirve para preparar un examen de opción múltiple?',a:'Sí como práctica complementaria. Sumá ejercicios que exijan elegir entre alternativas plausibles y justificar la selección.'},
    {q:'¿Necesito memorizar el enunciado?',a:'No. Intentá explicar el concepto con tus palabras y responder otra afirmación sobre la misma idea.'}
   ],
   cta:'Subir mi material',secondary:'Ver simulacros de examen'
  },
  'match-concepts':{
   eyebrow:'Practicar con Evaluo · Unir conceptos',
   title:'Unir conceptos con IA: estudiá relaciones, no solo definiciones',
   metaTitle:'Unir conceptos con IA gratis: ejercicios desde tu PDF',
   metaDescription:'Uní conceptos con IA a partir de tus apuntes en PDF, gratis: elegís el archivo sin registrarte y practicás relaciones entre términos, no solo definiciones.',
   intro:'Los ejercicios de asociación pueden ayudarte a distinguir conceptos cercanos, vincular términos con funciones y recordar qué elemento corresponde a una descripción. En Evaluo podés estudiar tu material por temas y utilizar modalidades de práctica para reforzar lo que todavía confundís.',
   exampleHeading:'Ejemplo de relación conceptual',
   examplePrompt:'¿Qué concepto describe el valor de la mejor alternativa a la que renunciás al elegir una opción?',
   exampleOptions:['Costo de oportunidad','Costo hundido'],
   exampleResult:'Costo de oportunidad. Es la mejor alternativa sacrificada; un costo hundido corresponde a un gasto ya realizado que no se recupera con la decisión actual.',
   stages:[
    {title:'Empezá por una unidad de tu materia',text:'Seleccioná tu material y estudiá un tema específico. Identificá términos que debés saber diferenciar.'},
    {title:'Relacioná conceptos con descripciones',text:'Intentá asociar cada término con la definición o función correcta sin consultar los apuntes.'},
    {title:'Justificá las asociaciones',text:'Antes de dar por aprendida una pareja, explicá qué característica permite distinguirla de otras opciones.'},
    {title:'Reforzá las parejas que confundiste',text:'Revisá el contenido original y practicá después con nuevas descripciones, no únicamente con el mismo orden.'}
   ],
   teachingTitle:'Qué convierte una asociación en aprendizaje',
   teaching:[
    'La consigna debe ofrecer correspondencias claras. Dos definiciones demasiado parecidas o incompletas pueden producir un juego ambiguo, por eso conviene verificar cada pareja.',
    'Una buena práctica introduce distractores plausibles, pero no dos soluciones igualmente defendibles.',
    'Después de unir los elementos, escribí una explicación breve. Poder reconocer la pareja no garantiza poder aplicar el concepto ante un caso nuevo.'
   ],
   cautionTitle:'Comprobá las relaciones importantes',
   caution:'Las asociaciones son un apoyo para practicar, no una fuente oficial de definiciones. Cuando una pareja parezca ambigua, contrastala con tus apuntes y la bibliografía.',
   faq:[
    {q:'¿Cuándo conviene unir conceptos?',a:'Cuando necesitás relacionar términos y funciones, identificar teorías con sus autores o diferenciar definiciones próximas.'},
    {q:'¿Sirve para materias con procedimientos?',a:'Sirve como complemento de conceptos básicos. Para cálculos y procedimientos necesitás también ejercicios aplicados.'},
    {q:'¿Qué hago si dos opciones parecen correctas?',a:'Revisá la fuente y comprobá si falta contexto. Una pregunta ambigua debe reformularse, no memorizarse.'}
   ],
   cta:'Subir mi material',secondary:'Practicar por tema'
  }
 },
 en:{
  'true-false':{
   eyebrow:'Practice with Evaluo · True or false',
   title:'AI True-or-False Questions for Studying Your Notes',
   metaTitle:'AI True or False Question Generator from PDF, Free',
   metaDescription:'Generate true or false questions from your PDF with AI, free. Choose your file without signing up and practice with an explanation for every answer.',
   intro:'A useful true-or-false question does more than ask you to guess. It makes you assess a claim and explain the evidence behind your decision. Practice with your own study material to distinguish related ideas and notice gaps you might miss while rereading.',
   exampleHeading:'A worked question that tests understanding',
   examplePrompt:'In a typical eukaryotic cell, all ATP production takes place in mitochondria.',
   exampleOptions:['True','False'],
   exampleResult:'False. Mitochondria are central to oxidative phosphorylation, but glycolysis also produces ATP in the cytosol. The absolute word “all” makes the claim inaccurate.',
   stages:[
    {title:'Choose the material you are learning',text:'Start in Evaluo and select study material for your course. Well-structured, readable content produces a better basis for questions.'},
    {title:'Focus on a particular topic',text:'Review a section and use the available practice modes to check the ideas introduced there.'},
    {title:'Commit to an answer before reading feedback',text:'Decide whether the statement holds and articulate the relevant qualification or exception.'},
    {title:'Correct the misunderstanding',text:'Return to the original source, then attempt a different question that tests the same concept.'}
   ],
   teachingTitle:'How to make true-or-false practice effective',
   teaching:[
    'A good statement is precise and has an unambiguous answer within the stated context. Absolute terms such as “always” require careful justification rather than automatic rejection.',
    'Explain why each statement is correct or incorrect. Remembering a label without the underlying reason is a weak indicator of learning.',
    'Use a mix of definitions, comparisons, and applications. Repeatedly answering the exact same sentence can become a memory test of that wording.'
   ],
   cautionTitle:'Check important claims against your sources',
   caution:'AI-generated study questions can contain errors. Verify scientific facts, legal details, numbers, and exceptions against your assigned course material.',
   faq:[
    {q:'What subjects work with true-or-false practice?',a:'It can support definitions, processes, and conceptual distinctions in many subjects. Statements must be clear and aligned with the original content.'},
    {q:'Will this prepare me for multiple-choice tests?',a:'It can help, but you should also practice comparing plausible alternatives and explaining your choices.'},
    {q:'Should I memorize the sentence?',a:'No. Explain the principle and answer another formulation of the same idea.'}
   ],cta:'Study my material',secondary:'Explore exam practice'
  },
  'match-concepts':{
   eyebrow:'Practice with Evaluo · Match concepts',
   title:'Match Concepts From Study Notes With AI',
   metaTitle:'Match Concepts with AI, Free: Exercises from Your PDF',
   metaDescription:'Match concepts with AI from your PDF notes, free: choose your file without signing up and practice how terms relate, not just their definitions.',
   intro:'Matching exercises help you connect terms to their functions, distinguish similar concepts, and recall the correct relationship. When studying a topic in Evaluo, use practice as a check of understanding—not merely a game of recognizing familiar words.',
   exampleHeading:'Worked example: distinguish two economic ideas',
   examplePrompt:'Which term means the value of the best alternative you give up when choosing?',
   exampleOptions:['Opportunity cost','Sunk cost'],
   exampleResult:'Opportunity cost. It is the value of the best forgone alternative. A sunk cost is an already-incurred cost that cannot be recovered through the present decision.',
   stages:[
    {title:'Start with a course topic',text:'Select your learning material and identify terms that you need to distinguish.'},
    {title:'Match definitions and functions',text:'Attempt each association without looking up the answers beforehand.'},
    {title:'Explain why each match fits',text:'Name the distinguishing feature of each concept and why a competing option would not work.'},
    {title:'Revisit uncertain pairs',text:'Check the source and later answer a differently worded example rather than memorizing a particular order.'}
   ],
   teachingTitle:'What makes matching practice meaningful',
   teaching:[
    'The matching task must have defensible, unambiguous pairs. Incomplete definitions can make two options look equally correct.',
    'Good distractors are plausible but cannot be interchangeable within the context of the question.',
    'After matching terms, explain a real application in one or two sentences. Recognition alone may not support transfer to a new problem.'
   ],
   cautionTitle:'Treat associations as practice, not authority',
   caution:'Generated associations may be ambiguous or inaccurate. Verify specialist definitions and important distinctions in your course notes.',
   faq:[
    {q:'What is matching best for?',a:'Connecting terms with functions, theories with distinguishing principles, and closely related definitions.'},
    {q:'Can matching replace working through problems?',a:'No. Use it to check conceptual foundations, then solve numerical or applied questions when the subject requires them.'},
    {q:'What if two answers appear valid?',a:'Check the source and add context. An ambiguous question should be corrected rather than memorized.'}
   ],cta:'Study my material',secondary:'Study topic by topic'
  }
 }
};

const paths:Record<PracticeLandingLocale,Record<PracticeLandingKind,string>>={
 es:{'true-false':'/funciones/verdadero-falso-con-ia','match-concepts':'/funciones/unir-conceptos-con-ia'},
 en:{'true-false':'/en/ai-true-false-questions','match-concepts':'/en/match-concepts-with-ai'}
};

export function practiceLandingCopy(kind:PracticeLandingKind,locale:PracticeLandingLocale) { return COPY[locale][kind]; }
export function practiceLandingPath(kind:PracticeLandingKind,locale:PracticeLandingLocale) { return paths[locale][kind]; }

export function BilingualPracticeLanding({kind,locale}:{kind:PracticeLandingKind;locale:PracticeLandingLocale}){
 const copy=COPY[locale][kind],english=locale==='en';
 const ctaHref=english?'/en/study-pdf-with-ai':'/estudiar-pdf-con-ia';
 const secondaryHref=english?'/en/pdf-to-quiz':kind==='true-false'?'/funciones/simulacro-examen-con-ia':'/funciones/practicar-por-tema';
 return <div lang={locale} className="min-h-screen bg-white text-slate-950">
  <InternationalDocumentLanguage lang={locale} />
  <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
    {english ? <EnglishSeoHeader alternateHref={paths.es[kind]} /> : <PublicSiteHeader variant="landing" trackingLocation={'seo-'+kind+'-'+locale} alternateHref={paths.en[kind]} />}
   </div>
  <main>
   <section className="border-b border-slate-100 bg-[linear-gradient(155deg,#F5F7FF_0%,#FFFFFF_80%)]">
    <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
     <div>
     <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{copy.eyebrow}</p>
     <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl">{copy.title}</h1>
     <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{copy.intro}</p>
     <div className="mt-7 flex flex-wrap gap-3">
      <TrackedLink href={ctaHref+'?source='+kind+'-'+locale} eventName="cta_click" payload={{location:'seo-'+kind+'-'+locale,cta_name:'subir_material',destination:ctaHref}} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800">{copy.cta}<ArrowRight className="h-4 w-4"/></TrackedLink>
      <Link href={secondaryHref} className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:border-blue-200">{copy.secondary}</Link>
     </div>
     </div>
     <div id={english?'choose-file':'elegir-pdf'} className="scroll-mt-24">
      <PdfFirstLandingUploader trackingLocation={'seo_'+kind.replace('-','_')+'_'+locale+'_hero'} sourceKey={kind+'-'+locale} locale={english?'en':undefined} market={english?'en':undefined} />
     </div>
    </div>
   </section>
   <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
    <section className="max-w-3xl" aria-labelledby="sample">
     <div className="flex items-center gap-2 text-blue-700"><FileQuestion className="h-5 w-5"/><span className="text-xs font-bold uppercase tracking-wide">{english?'Worked example':'Ejercicio resuelto'}</span></div>
     <h2 id="sample" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{copy.exampleHeading}</h2>
     <div className="mt-6 rounded-[22px] border border-slate-200 p-6">
      <p className="text-base font-bold leading-7">{copy.examplePrompt}</p>
      <ul className="mt-4 space-y-2">{copy.exampleOptions.map((option,i)=><li key={option} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium">{String.fromCharCode(65+i)}. {option}</li>)}</ul>
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7"><strong>{english?'Explanation':'Explicación'}:</strong> {copy.exampleResult}</div>
     </div>
    </section>
    <section className="mt-14" aria-labelledby="process">
     <div className="flex items-center gap-2 text-blue-700"><Layers3 className="h-5 w-5"/><span className="text-xs font-bold uppercase tracking-wide">{english?'How to use it':'Cómo aprovecharlo'}</span></div>
     <h2 id="process" className="mt-3 text-2xl font-bold">{english?'From notes to practice':'De tus apuntes a la práctica'}</h2>
     <ol className="mt-6 grid gap-4 md:grid-cols-2">{copy.stages.map((step,i)=><li key={step.title} className="rounded-[20px] border border-slate-200 p-6"><span className="text-sm font-bold text-blue-700">0{i+1}</span><h3 className="mt-2 text-lg font-bold">{step.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p></li>)}</ol>
    </section>
    <section className="mt-14 max-w-3xl">
     <h2 className="text-2xl font-bold">{copy.teachingTitle}</h2>
     <ul className="mt-5 space-y-4">{copy.teaching.map(item=><li key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700"/><p className="text-sm leading-7 text-slate-700">{item}</p></li>)}</ul>
    </section>
    <section className="mt-12 max-w-3xl rounded-2xl border border-blue-100 bg-[#F5F7FF] p-6">
     <h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardCheck className="h-5 w-5 text-blue-700"/>{copy.cautionTitle}</h2>
     <p className="mt-3 text-sm leading-7 text-slate-700">{copy.caution}</p>
    </section>
    <section className="mt-14 max-w-3xl" aria-label="Frequently asked questions">
     <h2 className="text-2xl font-bold">{english?'Frequently asked questions':'Preguntas frecuentes'}</h2>
     <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">{copy.faq.map(item=><div key={item.q} className="py-5"><h3 className="font-bold">{item.q}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{item.a}</p></div>)}</div>
    </section>
    <section className="mt-14 rounded-[26px] bg-[#0F1B3D] p-7 text-white sm:p-10">
     <div className="flex items-center gap-2 text-blue-200"><BookOpenText className="h-5 w-5"/><span className="text-xs font-bold uppercase">{english?'Your next study session':'Tu próxima sesión'}</span></div>
     <h2 className="mt-3 text-2xl font-bold">{english?'Practice with your own learning material':'Ahora practicá con tu propio material'}</h2>
     <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">{english?'Use your course material to explore study and practice options in Evaluo.':'Usá el material de tu materia para estudiar por temas y elegir las prácticas que más te ayuden.'}</p>
     <TrackedLink href={ctaHref+'?source='+kind+'-'+locale+'-bottom'} eventName="cta_click" payload={{location:'seo-'+kind+'-'+locale+'-bottom',cta_name:'subir_material',destination:ctaHref}} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-500">{copy.cta}<ArrowRight className="h-4 w-4"/></TrackedLink>
    </section>
    <nav className="mt-9 flex flex-wrap items-center gap-4 text-sm font-bold">
     <Link href={english?'/en/blog':'/blog'} className="text-blue-700 hover:underline">{english?'Study blog':'Blog de estudio'}</Link>
    </nav>
   </div>
  </main><FooterHome locale={locale} />
 </div>;
}
