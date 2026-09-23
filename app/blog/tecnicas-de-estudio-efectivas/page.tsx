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
    detail: 'Dunlosky et al. (2013) · Psychological Science in the Public Interest',
    href: 'https://www.psychologicalscience.org/journals/pspi/1529100612453266/',
  },
  {
    title: 'Retrieval Practice Consistently Benefits Student Learning',
    detail: 'Agarwal, Nunes & Blunt (2021) · Educational Psychology Review · revisión sistemática de estudios en aulas',
    href: 'https://doi.org/10.1007/s10648-021-09595-9',
  },
  {
    title: 'Practicing Retrieval Facilitates Learning',
    detail: 'McDermott (2021) · Annual Review of Psychology',
    href: 'https://doi.org/10.1146/annurev-psych-010419-051019',
  },
  {
    title: 'Distributed practice in verbal recall tasks: a review and quantitative synthesis',
    detail: 'Cepeda et al. (2006) · Psychological Bulletin · meta-análisis',
    href: 'https://pubmed.ncbi.nlm.nih.gov/16719566/',
  },
  {
    title: 'Similarity matters: A meta-analysis of interleaved learning and its moderators',
    detail: 'Brunmair & Richter (2019) · Psychological Bulletin · meta-análisis',
    href: 'https://pubmed.ncbi.nlm.nih.gov/31556629/',
  },
  {
    title: 'Inducing Self-Explanation: a Meta-Analysis',
    detail: 'Bisra et al. (2018) · Educational Psychology Review · meta-análisis',
    href: 'https://doi.org/10.1007/s10648-018-9434-x',
  },
  {
    title: 'Example-Based Learning: Integrating Cognitive and Social-Cognitive Research Perspectives',
    detail: 'Van Gog & Rummel (2010) · Educational Psychology Review',
    href: 'https://doi.org/10.1007/s10648-010-9134-7',
  },
  {
    title: 'The Past, Present, and Future of the Cognitive Theory of Multimedia Learning',
    detail: 'Mayer (2024) · Educational Psychology Review',
    href: 'https://doi.org/10.1007/s10648-023-09842-1',
  },
  {
    title: 'Mapping and Drawing to Improve Monitoring and Regulation of Learning from Text',
    detail: 'Van de Pol et al. (2020) · Educational Psychology Review',
    href: 'https://doi.org/10.1007/s10648-020-09560-y',
  },
  {
    title: 'The Power of Feedback Revisited: A Meta-Analysis of Educational Feedback Research',
    detail: 'Wisniewski, Zierer & Hattie (2020) · Frontiers in Psychology · meta-análisis',
    href: 'https://pubmed.ncbi.nlm.nih.gov/32038429/',
  },
  {
    title: 'Retrieval Practice Versus Elaborative Encoding: A Systematic and Meta-analytic Review',
    detail: 'Gonçalves, Muniz & Jaeger (2025) · Educational Psychology Review',
    href: 'https://doi.org/10.1007/s10648-025-10076-6',
  },
  {
    title: 'Test-enhanced learning: taking memory tests improves long-term retention',
    detail: 'Roediger & Karpicke (2006) · Psychological Science',
    href: 'https://pubmed.ncbi.nlm.nih.gov/16507066/',
  },
];

function EvidenceRefs({ refs }: { refs: number[] }) {
  return (
    <sup className="ml-1 whitespace-nowrap text-[10px] font-bold text-indigo-700">
      {refs.map((ref, index) => (
        <span key={ref}>
          {index > 0 ? ', ' : ''}
          <a href={`#fuente-${ref}`} className="underline decoration-indigo-200 underline-offset-2 hover:decoration-indigo-500">
            {ref}
          </a>
        </span>
      ))}
    </sup>
  );
}

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
              <span>16 min de lectura</span>
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
                ['#evidencia', 'Qué dice la evidencia'],
                ['#tecnica-01', 'Recuperación activa'],
                ['#tecnica-02', 'Repetición espaciada'],
                ['#tecnica-03', 'Intercalado'],
                ['#tecnica-04', 'Elaboración'],
                ['#tecnica-05', 'Ejemplos resueltos'],
                ['#tecnica-06', 'Codificación dual'],
                ['#elegir', 'Qué técnica elegir'],
                ['#sesion-60', 'Sesión de 60 minutos'],
                ['#dias', 'Según cuánto falta'],
                ['#errores', 'Errores frecuentes'],
                ['#combinar', 'Cómo combinarlas'],
                ['#preguntas', 'Preguntas frecuentes'],
                ['#fuentes', 'Fuentes'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="text-slate-600 transition hover:text-indigo-700">
                  {label}
                </a>
              ))}
            </div>
          </nav>

          <section id="evidencia" className="scroll-mt-8 mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Qué dice la evidencia
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              No todas las técnicas tienen el mismo respaldo ni sirven para lo mismo
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-slate-600">
              Las revisiones de psicología cognitiva suelen ubicar a la <strong className="text-slate-800">práctica de recuperación</strong> y al <strong className="text-slate-800">estudio distribuido</strong> entre las estrategias con evidencia más generalizable. Otras técnicas, como intercalar problemas, autoexplicarse o construir representaciones visuales, también pueden ayudar, pero sus resultados dependen más del contenido, del conocimiento previo y de cómo se implementan.
              <EvidenceRefs refs={[1, 2, 4, 5, 6, 8]} />
            </p>
            <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['Respaldo amplio', 'Recuperación activa y práctica espaciada', 'Funcionan en muchos materiales y contextos, aunque ningún método garantiza resultados por sí solo.'],
                ['Útiles con condiciones', 'Intercalado y autoexplicación', 'Pueden ser muy efectivos cuando la tarea exige discriminar, razonar o explicar relaciones.'],
                ['Dependen mucho del diseño', 'Mapas, diagramas y recursos visuales', 'Ayudan cuando representan relaciones relevantes y obligan a organizar la información; decorar apuntes no equivale a aprender.'],
              ].map(([level, methods, note]) => (
                <div key={level} className="grid gap-2 py-5 sm:grid-cols-[120px_185px_1fr] sm:gap-5">
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{level}</span>
                  <strong className="text-sm leading-6 text-slate-950">{methods}</strong>
                  <span className="text-sm leading-6 text-slate-600">{note}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              También hay límites de generalización: por ejemplo, una revisión de retrieval practice en aulas encontró resultados positivos en distintos niveles y materias, pero señaló que sólo una pequeña parte de los experimentos provenía de países no occidentales.
              <EvidenceRefs refs={[2]} />
            </p>
          </section>

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
                El respaldo es especialmente sólido frente a estrategias pasivas como releer. Una revisión sistemática de 50 experimentos realizados en contextos educativos encontró beneficios de retrieval practice en distintos niveles, materias, formatos de prueba y demoras hasta el examen; otra revisión de la literatura describe el efecto como robusto a través de materiales y edades.
                <EvidenceRefs refs={[2, 3]} />
              </p>
              <p>
                Un estudio clásico también mostró una distinción importante: releer podía rendir mejor en una prueba casi inmediata, mientras que practicar la recuperación produjo mayor retención cuando la evaluación llegó días después. Eso ayuda a explicar por qué “sentir que el texto está fresco” no necesariamente equivale a haberlo aprendido para la semana siguiente.
                <EvidenceRefs refs={[12]} />
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
                La evidencia sobre práctica distribuida es extensa. El meta-análisis de Cepeda y colaboradores reunió 839 comparaciones procedentes de 317 experimentos y mostró que la separación entre sesiones y el tiempo hasta la evaluación interactúan: no existe un intervalo perfecto para todo, pero concentrar todas las repeticiones juntas suele desperdiciar parte del beneficio que aparece al volver al contenido más adelante.
                <EvidenceRefs refs={[4]} />
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
                Acá conviene ser preciso: un meta-análisis de 59 estudios encontró un efecto positivo global del intercalado, pero con diferencias importantes. Funcionó mejor cuando había que distinguir categorías o procedimientos similares; en tareas matemáticas el efecto fue menor pero positivo, mientras que para textos expositivos los resultados fueron ambiguos. No hace falta intercalar todo.
                <EvidenceRefs refs={[5]} />
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="04"
              title="Autoexplicación y elaboración: preguntate cómo y por qué"
              practice={
                <>después de estudiar una definición, hacete preguntas como “¿por qué ocurre?”, “¿cómo se relaciona con este otro concepto?” o “¿qué cambiaría si esta condición fuera distinta?”.</>
              }
            >
              <p>
                Elaborar es conectar la información nueva con ideas que ya conocés y explicar relaciones entre conceptos. Una forma concreta es la interrogación elaborativa: generar preguntas de “cómo” y “por qué” y buscar respuestas verificables en el material.
              </p>
              <p>
                La autoexplicación tiene una base empírica más concreta que el consejo genérico de “pensar más profundo”. Un meta-análisis de 64 trabajos encontró un efecto positivo medio de inducir autoexplicaciones en tareas que incluían resolución de problemas, ejemplos resueltos y estudio de textos. La clave es generar relaciones e inferencias, no repetir la definición con otras palabras.
                <EvidenceRefs refs={[6]} />
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="05"
              title="Ejemplos resueltos: mirá el procedimiento y después hacelo vos"
              practice={
                <>si todavía sos principiante en un tipo de problema, estudiá un ejemplo bien resuelto paso a paso, explicá por qué funciona cada paso y después resolvé un problema parecido sin mirar.</>
              }
            >
              <p>
                Para aprender procedimientos nuevos, empezar directamente con resolución sin guía puede cargar demasiado la memoria de trabajo. La investigación sobre <em>worked examples</em> muestra que estudiar soluciones paso a paso suele ser especialmente útil para principiantes, y que conviene pasar progresivamente de mirar ejemplos a resolver por cuenta propia.
                <EvidenceRefs refs={[7]} />
              </p>
              <p>
                El efecto no significa copiar mecánicamente una solución. Funciona mejor cuando intentás explicar los pasos y después transferís el procedimiento a un ejercicio nuevo. A medida que ganás dominio, la práctica independiente debería ocupar cada vez más espacio.
                <EvidenceRefs refs={[6, 7]} />
              </p>
            </Technique>

            <hr className="border-slate-200" />

            <Technique
              number="06"
              title="Representaciones visuales: usalas para mostrar relaciones, no para decorar"
              practice={
                <>si un tema tiene relaciones, procesos o jerarquías, intentá reconstruir un esquema o mapa simple y después explicalo con palabras sin mirar el original.</>
              }
            >
              <p>
                Texto e imágenes pueden complementarse, pero “agregar un dibujo” no mejora automáticamente el aprendizaje. La investigación sobre aprendizaje multimedia destaca que las representaciones visuales ayudan cuando permiten seleccionar información relevante, organizarla e integrarla con lo que ya sabés.
                <EvidenceRefs refs={[8]} />
              </p>
              <p>
                Dibujar o construir un mapa puede además obligarte a hacer explícitas relaciones causales, jerarquías o secuencias. Revisiones sobre mapping y drawing remarcan justamente ese valor generativo y de monitoreo de la comprensión. Si el gráfico es decorativo o demasiado complejo, ese beneficio puede desaparecer.
                <EvidenceRefs refs={[9]} />
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

          <section id="elegir" className="scroll-mt-8 mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Elegir según la tarea
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Qué técnica usar según lo que tenés que estudiar
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              No todas las materias exigen lo mismo. La técnica conviene elegirla según la tarea que después vas a tener que resolver en el examen.
            </p>
            <div className="mt-7 overflow-hidden border-y border-slate-200">
              {[
                ['Memorizar conceptos o definiciones', 'Recuperación activa + repetición espaciada'],
                ['Resolver ejercicios', 'Práctica + intercalado'],
                ['Entender teoría', 'Elaboración + explicación con tus palabras'],
                ['Relacionar conceptos', 'Esquemas simples + recuperación sin mirar'],
                ['Preparar multiple choice', 'Preguntas + simulacros + revisión de errores'],
                ['Preparar un oral', 'Recuperación + explicación en voz alta'],
              ].map(([goal, method]) => (
                <div key={goal} className="grid gap-2 border-b border-slate-200 py-4 last:border-b-0 sm:grid-cols-[1fr_1.15fr] sm:gap-6">
                  <strong className="text-sm leading-6 text-slate-950">{goal}</strong>
                  <span className="text-sm leading-6 text-slate-600">{method}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              Una misma materia puede necesitar más de una estrategia. Por ejemplo, Derecho puede combinar recuperación de conceptos con comparación de casos; Matemática exige mucha más resolución sin mirar el procedimiento.
            </p>
          </section>

          <section id="sesion-60" className="scroll-mt-8 mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Ejemplo práctico
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Cómo puede verse una sesión de estudio de 60 minutos
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              No es una fórmula rígida. Es un ejemplo para que la sesión termine comprobando qué podés recuperar y aplicar, no sólo cuánto material llegaste a leer.
            </p>
            <ol className="mt-7 border-y border-slate-200">
              {[
                ['0–15 min', 'Entender', 'Trabajá una porción acotada del material. Identificá ideas centrales, relaciones y ejemplos.'],
                ['15–30 min', 'Recordar sin mirar', 'Cerrá la fuente y reconstruí conceptos, respondé preguntas o explicá el tema con tus palabras.'],
                ['30–50 min', 'Practicar', 'Resolvé preguntas o ejercicios sin ayuda. Mezclá contenidos si ya tenés varios temas estudiados.'],
                ['50–60 min', 'Corregir', 'Compará con la fuente, anotá errores y decidí qué tema necesita otro repaso más adelante.'],
              ].map(([time, title, text]) => (
                <li key={time} className="grid gap-2 border-b border-slate-200 py-5 last:border-b-0 sm:grid-cols-[90px_110px_1fr] sm:gap-4">
                  <span className="font-mono text-xs font-bold text-indigo-700">{time}</span>
                  <strong className="text-sm text-slate-950">{title}</strong>
                  <span className="text-sm leading-6 text-slate-600">{text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="dias" className="scroll-mt-8 mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Antes del examen
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Cómo estudiar según cuántos días faltan
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              Cuanto menos tiempo queda, menos sentido tiene intentar rehacer todo el material desde cero. La prioridad debería desplazarse hacia detectar lagunas, practicar y corregir.
            </p>
            <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['14 días o más', 'Construí comprensión y empezá a espaciar repasos. Alterná lectura acotada, recuperación y práctica.'],
                ['7 días', 'Aumentá la proporción de preguntas, ejercicios y repasos de temas débiles. Evitá dedicar sesiones enteras a releer.'],
                ['3 días', 'Priorizá simulacros, errores y los contenidos que todavía no podés recuperar sin ayuda.'],
                ['1 día', 'Hacé un repaso breve de puntos débiles y conceptos centrales. Evitá intentar aprender una unidad completa desde cero.'],
              ].map(([when, action]) => (
                <div key={when} className="grid gap-2 py-5 sm:grid-cols-[130px_1fr] sm:gap-6">
                  <strong className="text-sm text-slate-950">{when}</strong>
                  <p className="text-sm leading-7 text-slate-600">{action}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="errores" className="scroll-mt-8 mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Errores frecuentes
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Cinco formas de estudiar que pueden dar una falsa sensación de avance
            </h2>
            <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['Releer muchas veces', 'Reconocer una página no es lo mismo que poder recuperar la idea sin verla.'],
                ['Hacer resúmenes demasiado largos', 'Si el resumen reproduce casi todo el material, te obliga poco a decidir qué es central.'],
                ['Practicar mirando la respuesta', 'La ayuda constante impide comprobar cuánto podés resolver o recordar por tu cuenta.'],
                ['Repasar sólo lo que ya sale bien', 'La sensación de fluidez puede llevarte a evitar justamente los temas que más necesitan trabajo.'],
                ['Hacer simulacros sin revisar errores', 'El valor del simulacro aumenta cuando identificás por qué fallaste y qué concepto necesitás volver a estudiar.'],
              ].map(([title, text]) => (
                <div key={title} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr] sm:gap-8">
                  <strong className="text-sm leading-6 text-slate-950">{title}</strong>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
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
                ['04', 'Corregí con información útil', 'No te quedes en “bien/mal”: identificá qué respuesta era correcta, por qué y qué concepto explica el error.'],
                ['05', 'Volvé después', 'Programá otro contacto con los temas débiles para recuperar de nuevo sin mirar.'],
              ].map(([number, title, text]) => (
                <li key={number} className="grid gap-2 py-5 sm:grid-cols-[42px_130px_1fr] sm:gap-4">
                  <span className="font-mono text-xs font-bold text-indigo-700">{number}</span>
                  <strong className="text-sm text-slate-950">{title}</strong>
                  <span className="text-sm leading-6 text-slate-600">{text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs leading-6 text-slate-500">
              El feedback no es una intervención única: su impacto depende de la información que aporta. Un meta-análisis de 435 estudios encontró un efecto medio positivo, con mucha variación según el tipo de feedback. Una revisión meta-analítica más reciente también encontró que la ventaja de retrieval practice frente a otras estrategias activas era mayor cuando había feedback correctivo.
              <EvidenceRefs refs={[10, 11]} />
            </p>
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

          <section id="preguntas" className="scroll-mt-8 mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
              Preguntas frecuentes
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Dudas comunes al elegir una técnica de estudio
            </h2>
            <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['¿Cuál es la técnica de estudio más efectiva?', 'No existe una única técnica para todo. Si necesitás una base general, recuperación activa y práctica distribuida tienen respaldo amplio y se adaptan a muchos tipos de contenido.'],
                ['¿Sirve hacer resúmenes?', 'Sí, si el resumen te ayuda a seleccionar y organizar ideas. Conviene complementarlo intentando recuperar lo estudiado sin mirar y usando preguntas o ejercicios.'],
                ['¿Cómo estudiar si tengo poco tiempo?', 'Recortá el contenido a lo evaluable, priorizá temas débiles y dedicá más tiempo a recuperar y practicar que a releer todo desde el principio.'],
                ['¿Cómo estudiar para un examen multiple choice?', 'Practicá preguntas sin mirar la respuesta, justificá por qué elegís una opción y revisá también por qué las alternativas incorrectas no corresponden.'],
                ['¿Cuántas horas conviene estudiar por día?', 'No hay un número universal. Importa más sostener sesiones en las que recuperás, practicás y corregís que acumular muchas horas de lectura pasiva.'],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-slate-950 marker:hidden">
                    {question}
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="fuentes" className="scroll-mt-8 mt-14 border-t border-slate-200 pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Fuentes</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950">
              Investigación y recursos utilizados
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Esta guía prioriza revisiones sistemáticas, meta-análisis y artículos de síntesis, y usa estudios individuales sólo para ilustrar hallazgos concretos. La efectividad de una estrategia puede variar según el contenido, el conocimiento previo, el tipo de evaluación y la forma de implementación.
            </p>
            <ul className="mt-6 space-y-4">
              {sources.map((source, index) => (
                <li id={`fuente-${index + 1}`} key={source.href} className="scroll-mt-8 text-sm">
                  <div className="flex gap-3">
                    <span className="mt-0.5 font-mono text-[11px] font-bold text-slate-400">{index + 1}</span>
                    <div>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-indigo-700 hover:decoration-indigo-300"
                  >
                    {source.title}
                  </a>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{source.detail}</p>
                    </div>
                  </div>
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
