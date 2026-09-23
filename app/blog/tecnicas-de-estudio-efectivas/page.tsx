import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/blog/tecnicas-de-estudio-efectivas';
const publishedAt = '2026-09-23';
const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';

export const metadata: Metadata = {
  title: 'Técnicas de estudio efectivas para preparar un examen',
  description:
    'Conocé técnicas de estudio con respaldo en investigación: active recall, repetición espaciada, intercalado, elaboración y más. Cómo aplicarlas antes de un examen.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Técnicas de estudio efectivas para preparar un examen | Evaluo',
    description:
      'Una guía práctica para estudiar con recuperación activa, repetición espaciada y otras estrategias respaldadas por investigación sobre aprendizaje.',
    url: toAbsoluteUrl(path),
    images: [
      {
        url: toAbsoluteUrl('/opengraph-image.png'),
        width: 1200,
        height: 630,
        alt: 'Técnicas de estudio efectivas | Evaluo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Técnicas de estudio efectivas para preparar un examen | Evaluo',
    description:
      'Cómo combinar recuperación activa, repetición espaciada y práctica para estudiar mejor antes de un examen.',
    images: ['/opengraph-image.png'],
  },
};

const sources = [
  {
    title: 'Improving Students’ Learning With Effective Learning Techniques',
    detail: 'Dunlosky et al. (2013) · Association for Psychological Science',
    href: 'https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html',
  },
  {
    title: 'Test-enhanced learning: taking memory tests improves long-term retention',
    detail: 'Roediger & Karpicke (2006) · Psychological Science / PubMed',
    href: 'https://pubmed.ncbi.nlm.nih.gov/16507066/',
  },
  {
    title: 'Distributed practice in verbal recall tasks: a review and quantitative synthesis',
    detail: 'Cepeda et al. (2006) · Psychological Bulletin / PubMed',
    href: 'https://pubmed.ncbi.nlm.nih.gov/16719566/',
  },
  {
    title: 'Six Strategies for Effective Learning',
    detail: 'The Learning Scientists',
    href: 'https://www.learningscientists.org/blog/2016/8/18-1',
  },
];

function Technique({
  number,
  title,
  children,
  practice,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  practice: React.ReactNode;
}) {
  return (
    <section id={`tecnica-${number}`} className="scroll-mt-8">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-bold text-indigo-700">{number}</span>
        <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-5 space-y-4 text-[15px] leading-7 text-slate-600">{children}</div>
      <div className="mt-5 border-l-2 border-indigo-500 pl-4 text-sm leading-7 text-slate-700">
        <strong className="text-slate-950">Cómo aplicarlo:</strong> {practice}
      </div>
    </section>
  );
}

export default function TecnicasDeEstudioEfectivasPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Técnicas de estudio efectivas para preparar un examen',
    description:
      'Guía práctica sobre técnicas de estudio respaldadas por investigación en aprendizaje y memoria.',
    datePublished: publishedAt,
    dateModified: publishedAt,
    inLanguage: 'es-AR',
    isAccessibleForFree: true,
    image: [toAbsoluteUrl('/opengraph-image.png')],
    author: {
      '@type': 'Organization',
      '@id': toAbsoluteUrl('/#organization'),
      name: 'Evaluo',
      url: toAbsoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      '@id': toAbsoluteUrl('/#organization'),
      name: 'Evaluo',
      url: toAbsoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/icon.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': toAbsoluteUrl(path),
    },
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-indigo-100 selection:text-indigo-950">
      <MarketingAnalyticsSlot />
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Evaluo', path: '/' },
            { name: 'Técnicas de estudio efectivas', path },
          ]),
          articleJsonLd,
        ]}
      />

      <div className="border-b border-slate-100">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader
            variant="landing"
            primaryHref={uploadHref}
            trackingLocation="seo_tecnicas_estudio_header"
          />
        </div>
      </div>

      <main>
        <article className="mx-auto max-w-[780px] px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:pb-20">
          <header>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Guía de estudio
            </p>
            <h1 className="mt-4 text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[3.6rem]">
              Técnicas de estudio efectivas para preparar un examen
            </h1>
            <p className="mt-6 max-w-3xl text-[17px] leading-8 text-slate-600">
              Estudiar más horas no siempre significa aprender más. La diferencia suele estar en qué hacés con el material: recuperar información sin mirar, distribuir el estudio y practicar de una forma parecida a la que vas a necesitar en el examen.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <span>10 min de lectura</span>
              <span>Publicado el 23 de septiembre de 2026</span>
              <span>Equipo Evaluo</span>
            </div>
          </header>

          <aside className="my-9 border-y border-slate-200 py-6">
            <p className="text-sm font-bold text-slate-950">Si te quedás con tres ideas</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li><strong className="text-slate-800">1.</strong> Intentá recordar antes de volver a leer.</li>
              <li><strong className="text-slate-800">2.</strong> Repartí el estudio en varios momentos en vez de concentrarlo todo al final.</li>
              <li><strong className="text-slate-800">3.</strong> Usá preguntas, ejercicios y ejemplos para comprobar qué sabés de verdad.</li>
            </ol>
          </aside>

          <nav aria-label="Contenido de la guía" className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">En esta guía</p>
            <div className="mt-4 grid gap-x-6 gap-y-2 border-l border-slate-200 pl-4 text-sm sm:grid-cols-2">
              {[
                ['#tecnica-01', 'Recuperación activa'],
                ['#tecnica-02', 'Repetición espaciada'],
                ['#tecnica-03', 'Intercalado'],
                ['#tecnica-04', 'Elaboración'],
                ['#tecnica-05', 'Ejemplos concretos'],
                ['#tecnica-06', 'Codificación dual'],
                ['#combinar', 'Cómo combinarlas'],
                ['#fuentes', 'Fuentes'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="text-slate-600 transition hover:text-indigo-700">
                  {label}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-12">
            <Technique
              number="01"
              title="Recuperación activa: intentá recordar sin mirar"
              practice={
                <>cerrá el apunte e intentá responder preguntas, explicar un tema o escribir lo que recordás. Después compará con la fuente y corregí lo que faltó.</>
              }
            >
              <p>
                La recuperación activa —también conocida como <em>retrieval practice</em> o active recall— consiste en traer la información a la memoria en lugar de volver a verla pasivamente.
              </p>
              <p>
                En una revisión amplia de técnicas de aprendizaje, la práctica de recuperación fue una de las estrategias con mayor utilidad general. En estudios experimentales, practicar el recuerdo también produjo mejor retención a largo plazo que releer repetidamente el mismo material.
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="02"
              title="Repetición espaciada: volvé al tema más de una vez"
              practice={
                <>si tenés siete días, no dediques todo el tiempo a una sola sesión. Repartí varios repasos cortos y usá cada vuelta para recuperar, practicar y corregir.</>
              }
            >
              <p>
                La repetición espaciada distribuye las oportunidades de estudio en el tiempo. No significa repetir exactamente lo mismo: cada sesión puede empezar recuperando lo anterior y después avanzar sobre lo que todavía cuesta.
              </p>
              <p>
                La evidencia sobre práctica distribuida es extensa. Una revisión cuantitativa que reunió cientos de experimentos encontró una ventaja consistente de espaciar las oportunidades de aprendizaje frente a concentrarlas.
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="03"
              title="Intercalado: mezclá tipos de problemas y temas"
              practice={
                <>en vez de resolver diez ejercicios iguales seguidos, alterná categorías relacionadas. La dificultad extra de decidir qué procedimiento usar forma parte del aprendizaje.</>
              }
            >
              <p>
                Intercalar significa alternar tipos de problemas o conceptos relacionados durante una misma etapa de práctica. Es diferente de estudiar un tema completo, terminarlo y recién después pasar al siguiente.
              </p>
              <p>
                No funciona igual en todos los contenidos, pero puede ser especialmente útil cuando necesitás aprender a distinguir qué estrategia corresponde aplicar en cada caso.
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="04"
              title="Elaboración: preguntate cómo y por qué"
              practice={
                <>después de estudiar una definición, hacete preguntas como “¿por qué ocurre?”, “¿cómo se relaciona con este otro concepto?” o “¿qué cambiaría si esta condición fuera distinta?”.</>
              }
            >
              <p>
                Elaborar es conectar la información nueva con ideas que ya conocés y explicar relaciones entre conceptos. Una forma concreta es la interrogación elaborativa: generar preguntas de “cómo” y “por qué” y buscar respuestas verificables en el material.
              </p>
              <p>
                Sirve para ir más allá de reconocer una frase y comprobar si realmente entendés su estructura y sus relaciones.
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="05"
              title="Ejemplos concretos: bajá las ideas abstractas a casos"
              practice={
                <>por cada concepto abstracto, buscá al menos un ejemplo real y explicá qué característica del caso representa la idea que estás estudiando.</>
              }
            >
              <p>
                Cuando un concepto es abstracto, un ejemplo específico ayuda a darle forma. La parte importante no es memorizar el ejemplo aislado, sino entender por qué ese caso representa el concepto.
              </p>
              <p>
                Comparar varios ejemplos también puede ayudarte a separar los detalles superficiales de la estructura que realmente importa.
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="06"
              title="Codificación dual: combiná palabras con representaciones visuales"
              practice={
                <>si un tema tiene relaciones, procesos o jerarquías, intentá reconstruir un esquema o mapa simple y después explicalo con palabras sin mirar el original.</>
              }
            >
              <p>
                La codificación dual combina información verbal con representaciones visuales relevantes. Puede ser un diagrama, una línea de tiempo, una relación entre conceptos o un esquema que ayude a representar cómo se organiza una idea.
              </p>
              <p>
                No se trata de decorar apuntes. El valor está en representar el contenido de otra manera y poder explicar la relación entre el texto y lo visual.
              </p>
            </Technique>
          </div>

          <section className="mt-14 border-y border-slate-200 py-8">
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950">
              ¿Y releer, subrayar o resumir?
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              Pueden servir como parte del proceso, pero no conviene que sean la única forma de estudiar. La revisión de Dunlosky y colaboradores encontró evidencia más generalizable para la práctica de recuperación y el estudio distribuido que para releer o subrayar por sí solos.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              Un resumen es más útil cuando después lo cerrás y tratás de reconstruir las ideas, responder preguntas o resolver una consigna.
            </p>
          </section>

          <section id="combinar" className="scroll-mt-8 mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Cómo llevarlo a la práctica
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Una sesión de estudio puede combinar varias técnicas
            </h2>
            <ol className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['01', 'Entendé', 'Leé una parte acotada del material y detectá conceptos, relaciones y ejemplos.'],
                ['02', 'Cerrá la fuente', 'Intentá recuperar las ideas centrales sin mirar.'],
                ['03', 'Practicá', 'Respondé preguntas o resolvé ejercicios mezclando contenidos relacionados.'],
                ['04', 'Corregí y volvé después', 'Revisá los errores y programá otro contacto con esos temas en otro momento.'],
              ].map(([number, title, text]) => (
                <li key={number} className="grid gap-2 py-5 sm:grid-cols-[42px_130px_1fr] sm:gap-4">
                  <span className="font-mono text-xs font-bold text-indigo-700">{number}</span>
                  <strong className="text-sm text-slate-950">{title}</strong>
                  <span className="text-sm leading-6 text-slate-600">{text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-14 border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Aplicarlo con tu propio material
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950">
              Tu PDF puede ser el punto de partida, no el final.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              En Evaluo podés trabajar sobre tus propios apuntes o PDFs y pasar del material a distintas formas de estudio: una guía para entender, flashcards para recuperar conceptos y práctica para comprobar qué recordás.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
              <Link href="/estudiar-pdf-con-ia" className="text-indigo-700 hover:text-indigo-900">
                Cómo estudiar un PDF con IA
              </Link>
              <Link href="/funciones/crear-flashcards-desde-pdf" className="text-indigo-700 hover:text-indigo-900">
                Crear flashcards desde un PDF
              </Link>
              <Link href="/pregunteros" className="text-indigo-700 hover:text-indigo-900">
                Practicar con Pregunteros
              </Link>
            </div>
            <TrackedLink
              href={uploadHref}
              eventName="cta_click"
              payload={{
                location: 'seo_tecnicas_estudio_article',
                cta_name: 'estudiar_mi_material',
                destination: uploadHref,
              }}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Estudiar mi material
            </TrackedLink>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950">
              ¿Cuál es la mejor técnica de estudio?
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              No hay una única técnica que resuelva todos los tipos de aprendizaje. Si necesitás una base simple, empezá por <strong className="text-slate-800">recuperación activa + repetición espaciada</strong>: son dos de las estrategias con respaldo más amplio y pueden combinarse con las demás.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              El contenido también importa. Una materia práctica exige resolver problemas; una materia conceptual puede exigir explicar relaciones, comparar casos y recuperar definiciones. La técnica tiene que acercarse a lo que después vas a necesitar hacer en el examen.
            </p>
          </section>

          <section id="fuentes" className="scroll-mt-8 mt-14 border-t border-slate-200 pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Fuentes</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950">
              Investigación y recursos utilizados
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Esta guía resume principios generales de investigación sobre aprendizaje. La efectividad concreta puede variar según el contenido, la tarea y la persona.
            </p>
            <ul className="mt-6 space-y-4">
              {sources.map((source) => (
                <li key={source.href} className="text-sm">
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-indigo-700 hover:decoration-indigo-300"
                  >
                    {source.title}
                  </a>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{source.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>

      <FooterHome variant="compact" />
    </div>
  );
}
