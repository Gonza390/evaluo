import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  ListChecks,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/como-estudiar-ingreso-unlam';
const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';
const demoHref = '/demo/material-estudio?source=seo_ingreso_unlam_2027';
const reviewedAt = '2026-09-17';

const officialSources = {
  ingreso: 'https://ingresantes.unlam.edu.ar/',
  curso: 'https://www.unlam.edu.ar/curso-de-ingreso/',
  calendario: 'https://www.unlam.edu.ar/calendario-academico/',
  modalidad: 'https://ingresantes.unlam.edu.ar/Home/informacion/248',
  proceso: 'https://ingresantes.unlam.edu.ar/Home/informacion/247',
};

export const metadata: Metadata = {
  title: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027',
  description:
    'Guía para preparar el Curso de Ingreso UNLaM 2027: cómo organizar el manual, estudiar las materias, practicar para los exámenes y repasar mejor.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027 | Evaluo',
    description:
      'Método práctico para estudiar el material del ingreso UNLaM 2027, organizar temas, repasar y llegar mejor preparado a las evaluaciones.',
    url: toAbsoluteUrl(path),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027 | Evaluo',
    description:
      'Guía práctica para organizar el material del ingreso UNLaM, estudiar las materias y preparar las evaluaciones.',
  },
};

function PrimaryCta() {
  return (
    <TrackedLink
      href={uploadHref}
      eventName="cta_click"
      payload={{
        location: 'seo_ingreso_unlam_2027_hero',
        cta_name: 'subir_material_ingreso',
        destination: uploadHref,
      }}
      className="from-brand to-brand-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
      Estudiar mi material de ingreso
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </TrackedLink>
  );
}

function DemoCta() {
  return (
    <TrackedLink
      href={demoHref}
      eventName="cta_click"
      payload={{
        location: 'seo_ingreso_unlam_2027_demo',
        cta_name: 'ver_demo_material',
        destination: '/demo/material-estudio',
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      Ver una sesión de estudio de ejemplo
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </TrackedLink>
  );
}

function OfficialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:decoration-indigo-500"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

export default function ComoEstudiarIngresoUnlamPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cómo estudiar para el Curso de Ingreso UNLaM 2027',
    description:
      'Guía práctica para preparar el Curso de Ingreso de la Universidad Nacional de La Matanza usando el material oficial como fuente de estudio.',
    datePublished: reviewedAt,
    dateModified: reviewedAt,
    inLanguage: 'es-AR',
    author: { '@type': 'Organization', name: 'Evaluo' },
    publisher: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
    mainEntityOfPage: toAbsoluteUrl(path),
  };

  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <MarketingAnalyticsSlot />
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Evaluo', path: '/' },
            { name: 'Guía de ingreso UNLaM 2027', path },
          ]),
          articleJsonLd,
        ]}
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader primaryHref={uploadHref} trackingLocation="seo_ingreso_unlam_2027_header" />
      </div>

      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_85%_12%,rgba(99,102,241,0.15),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Guía actualizada para Ingreso 2027
              </span>
              <h1 className="mt-5 max-w-4xl text-[2.55rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
                Cómo estudiar para el <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">Curso de Ingreso UNLaM 2027</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-8 text-slate-600 sm:text-[17px]">
                Si ya estás preparando el ingreso a la Universidad Nacional de La Matanza, el objetivo no es releer el manual una y otra vez. Necesitás ordenar las materias, entender los conceptos, practicar sin mirar y detectar qué temas todavía te cuestan antes de cada examen.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <PrimaryCta />
                <DemoCta />
              </div>
              <p className="mt-5 text-xs leading-6 text-slate-500">
                Información institucional revisada el 17 de septiembre de 2026. Las fechas pueden cambiar: verificá siempre el sitio oficial de UNLaM.
              </p>
            </div>

            <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.09)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Segunda instancia · Ingreso 2027</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">Fechas que tenés que tener presentes</h2>
                </div>
              </div>
              <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
                {[
                  ['Preinscripción virtual', '28 sep. – 26 oct. 2026'],
                  ['Entrega de documentación', '5 – 26 oct. 2026'],
                  ['Cursada intensiva', '1 feb. – 6 mar. 2027'],
                  ['Exámenes', '8 – 12 mar. 2027'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-5 py-4">
                    <dt className="text-sm text-slate-600">{label}</dt>
                    <dd className="text-right text-sm font-bold text-slate-950">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs leading-6 text-slate-600">
                La UNLaM describe esta segunda instancia como intensiva y semipresencial. La Universidad recomienda la instancia regular para quienes hacen el Curso de Ingreso por primera vez.
              </p>
              <div className="mt-4 text-xs">
                <OfficialLink href={officialSources.calendario}>Ver calendario oficial de UNLaM</OfficialLink>
              </div>
            </aside>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Antes de planificar</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
                Entendé cómo funciona el Curso de Ingreso antes de decidir cómo vas a estudiar.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                La UNLaM ofrece una primera instancia regular y una segunda intensiva. En ambas tenés que rendir un examen de cada asignatura. El formato de tres materias se ofrece en las dos instancias; el formato de cuatro materias corresponde a Odontología, Arquitectura y Medicina y se desarrolla en la instancia regular, con un cuarto tramo entre febrero y marzo.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-[26px] border border-slate-200 bg-slate-50/50 p-6 sm:p-7">
                <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Instancia regular</p>
                <h3 className="mt-3 text-xl font-bold text-slate-950">Más tiempo para incorporar el ritmo universitario</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  La cursada 2027 se desarrolla de julio a diciembre de 2026. La propia Universidad la recomienda para quienes hacen el Curso de Ingreso por primera vez.
                </p>
              </article>
              <article className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] sm:p-7">
                <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Instancia intensiva</p>
                <h3 className="mt-3 text-xl font-bold text-slate-950">Menos semanas y una carga de estudio mucho más concentrada</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Se cursa en febrero y marzo de 2027 con seis cursadas por semana. UNLaM la recomienda principalmente para quienes recursan o ya tienen experiencia universitaria.
                </p>
              </article>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <p className="text-sm leading-7 text-amber-950">
                  <strong>Importante:</strong> no asumas que todas las carreras tienen exactamente el mismo recorrido. Revisá siempre el formato correspondiente a tu carrera en el <OfficialLink href={officialSources.curso}>Curso de Ingreso oficial</OfficialLink>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Tu material real</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
                Empezá por el Manual del Curso de Ingreso y tus apuntes de clase.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                UNLaM entrega una versión impresa del Manual del Curso de Ingreso cuando completás la inscripción presencial. Ese material, junto con tus apuntes y el contenido disponible en MIeL Ingreso, debería ser tu fuente principal: primero identificá qué unidades tenés que aprender y recién después decidí cómo resumir, memorizar o practicar.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                [FileText, '1. Ubicá las unidades', 'Dividí el manual por materias, unidades y temas antes de empezar a resumir.'],
                [BookOpen, '2. Entendé conceptos', 'Explicá definiciones, procedimientos y relaciones con tus propias palabras.'],
                [Layers3, '3. Recuperá de memoria', 'Usá preguntas o flashcards sin mirar primero la respuesta.'],
                [ListChecks, '4. Practicá', 'Resolvé ejercicios y registrá errores para volver al tema correcto.'],
              ].map(([Icon, title, text]) => {
                const IconComponent = Icon as typeof FileText;
                return (
                  <article key={String(title)} className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <IconComponent className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                    <h3 className="mt-4 text-base font-bold text-slate-950">{String(title)}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-600">{String(text)}</p>
                  </article>
                );
              })}
            </div>

            <p className="mt-7 text-sm leading-7 text-slate-600">
              La información sobre el Manual está publicada por UNLaM en su <OfficialLink href={officialSources.proceso}>proceso oficial de inscripción</OfficialLink>.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Método de estudio</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
                Cómo organizar el estudio para no llegar al examen habiendo solo releído.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                Una sesión útil debería terminar con una acción que te obligue a recuperar o aplicar lo que estudiaste. Podés usar este recorrido como base y ajustarlo según la materia.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              {[
                ['01', 'Primera lectura', 'Recorré una unidad completa y marcá qué conceptos, fórmulas o procedimientos aparecen. No intentes memorizar todavía.'],
                ['02', 'Comprensión', 'Cerrá el material e intentá explicar el tema con tus palabras. Volvé al manual cuando algo no cierre.'],
                ['03', 'Organización', 'Reducí el tema a una estructura clara: ideas principales, relaciones, fórmulas, pasos o excepciones.'],
                ['04', 'Recuperación activa', 'Hacete preguntas sin mirar la respuesta. Si fallás, registrá exactamente qué parte necesitás revisar.'],
                ['05', 'Práctica', 'Resolvé ejercicios o preguntas nuevas sin ayuda. La corrección tiene que llevarte nuevamente al concepto que originó el error.'],
              ].map(([n, title, text], index) => (
                <div key={n} className={`grid gap-3 p-6 sm:grid-cols-[70px_220px_1fr] sm:items-start sm:p-7 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                  <span className="text-xs font-black text-indigo-700">{n}</span>
                  <h3 className="text-base font-bold text-slate-950">{title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Matemática y materias prácticas</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Si la materia tiene ejercicios, estudiar significa resolverlos.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                Un resumen puede ayudarte a entender una fórmula o un procedimiento, pero no reemplaza la práctica. Para Matemática o cualquier asignatura con resolución de problemas, organizá cada tema como una secuencia de concepto, ejemplo, ejercicio y corrección.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Concepto', 'Entendé qué representa la fórmula o procedimiento y en qué situaciones se usa.'],
                ['Ejemplo', 'Seguí un caso resuelto prestando atención a cada decisión, no solamente al resultado.'],
                ['Intento propio', 'Resolvé un ejercicio sin mirar el ejemplo. Si te trabás, identificá el paso exacto.'],
                ['Corrección', 'No marques solo correcto o incorrecto: anotá por qué fallaste y repetí otro ejercicio del mismo tipo.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <Target className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Semana previa</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
                Cómo organizar los últimos días antes de una evaluación del ingreso.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                No existe un calendario universal, pero este esquema te ayuda a priorizar diagnóstico y práctica en lugar de dejar toda la revisión para la noche anterior.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                ['7 días antes', 'Hacé un diagnóstico: qué unidades dominás, cuáles dudás y cuáles todavía no podés resolver.'],
                ['5 días antes', 'Volvé sobre los temas débiles y alterná explicación con ejercicios.'],
                ['3 días antes', 'Practicá sin apuntes y simulá bloques de preguntas o ejercicios.'],
                ['1 día antes', 'Repasá errores frecuentes, conceptos que confundís y procedimientos que todavía necesitás verificar.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[24px] border border-slate-200 p-5 sm:p-6">
                  <p className="text-xs font-black text-indigo-700">{title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-indigo-100 bg-indigo-50/55 py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Usar IA sin perder la fuente</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Convertí tu material del ingreso en distintas formas de estudiar.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                La IA es más útil cuando trabaja sobre el material que realmente tenés que aprender. En Evaluo podés usar tus apuntes o un PDF como fuente y pasar de comprensión a repaso y práctica sin reemplazar el manual oficial.
              </p>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
                <PrimaryCta />
                <DemoCta />
              </div>
            </div>

            <div className="rounded-[28px] border border-indigo-100 bg-white p-6 shadow-[0_20px_50px_rgba(79,70,229,0.08)] sm:p-7">
              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 p-5 text-center">
                <FileText className="mx-auto h-6 w-6 text-indigo-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-950">Manual / apuntes del Curso de Ingreso</p>
              </div>
              <div className="mx-auto my-4 h-7 w-px bg-indigo-200" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [Brain, 'Entender', 'Resumen y conceptos para ubicarte.'],
                  [BookOpen, 'Organizar', 'Glosario y mapa para relacionar temas.'],
                  [Layers3, 'Recordar', 'Flashcards para recuperar sin mirar.'],
                  [ListChecks, 'Comprobar', 'Preguntas y ejercicios sobre la misma fuente.'],
                ].map(([Icon, title, text]) => {
                  const IconComponent = Icon as typeof Brain;
                  return (
                    <div key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <IconComponent className="h-4.5 w-4.5 text-indigo-700" aria-hidden="true" />
                      <p className="mt-3 text-xs font-bold text-slate-950">{String(title)}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-600">{String(text)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Errores frecuentes</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Cuatro formas de estudiar mucho y comprobar demasiado tarde que todavía faltaba práctica.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                ['Releer sin intentar recordar', 'La familiaridad con una página no demuestra que puedas explicar el concepto sin tenerla delante.'],
                ['Hacer resúmenes de absolutamente todo', 'Si el resumen conserva cada detalle, probablemente todavía no decidiste qué estructura el tema y qué es secundario.'],
                ['Dejar los ejercicios para el final', 'La práctica también sirve para aprender: te muestra qué conceptos todavía no sabés aplicar.'],
                ['Usar IA como reemplazo del manual', 'Tomá las respuestas como apoyo y contrastalas con el material oficial que efectivamente forma parte de tu cursada.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <h2 className="max-w-3xl text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">Seguí profundizando según lo que necesitás hacer con el material.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ['/estudiar-pdf-con-ia', 'Estudiar un PDF con IA', 'Cómo pasar del documento a resumen, conceptos, flashcards y práctica.'],
                ['/funciones/resumir-pdf-con-ia', 'Resumir un PDF para estudiar', 'Cómo ordenar ideas sin convertir el resumen en el final del estudio.'],
                ['/funciones/crear-flashcards-desde-pdf', 'Crear flashcards desde un PDF', 'Cómo transformar conceptos de tus apuntes en preguntas para recuperar de memoria.'],
              ].map(([href, title, description]) => (
                <Link key={href} href={href} className="group rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 sm:p-6">
                  <h3 className="text-sm font-bold text-slate-950 group-hover:text-indigo-700">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
                    Ver guía <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1040px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:gap-14">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Preguntas frecuentes</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">Sobre el Ingreso UNLaM 2027</h2>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['¿Cuándo abre la segunda inscripción para el Curso de Ingreso UNLaM 2027?', 'El formulario de preinscripción de la segunda instancia abre el 28 de septiembre de 2026 y el período se extiende hasta el 26 de octubre, según el calendario oficial consultado el 17 de septiembre de 2026.'],
                ['¿Cuándo se cursa la segunda instancia?', 'La cursada intensiva está prevista del 1 de febrero al 6 de marzo de 2027, con evaluaciones entre el 8 y el 12 de marzo.'],
                ['¿La segunda instancia es recomendable si es mi primer ingreso?', 'UNLaM indica que la instancia intensiva se recomienda principalmente para quienes recursan o ya tienen experiencia universitaria, mientras que para quienes hacen el Curso de Ingreso por primera vez sugiere la instancia regular.'],
                ['¿Dónde consigo el Manual del Curso de Ingreso?', 'UNLaM informa que la versión impresa del Manual se entrega cuando completás la inscripción presencial en la Dirección de Alumnos.'],
                ['¿Evaluo reemplaza el material oficial de UNLaM?', 'No. La propuesta es usar tus apuntes o material como fuente para resumir, organizar, crear tarjetas y practicar. Para fechas, requisitos, contenidos y reglas del ingreso, la referencia debe seguir siendo la Universidad.'],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5 sm:py-6">
                  <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-slate-950 marker:hidden">{question}</summary>
                  <p className="mt-3 max-w-[680px] text-xs leading-6 text-slate-600 sm:text-[13px]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-50/60 py-14 sm:py-16">
          <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-8">
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Fuentes y revisión de esta guía</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Contenido preparado por el equipo de Evaluo y revisado el 17 de septiembre de 2026 utilizando información oficial publicada por la Universidad Nacional de La Matanza. Evaluo no está afiliado a UNLaM. Las fechas y condiciones pueden ser modificadas por la Universidad.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs">
                    <OfficialLink href={officialSources.ingreso}>Sistema de Ingresantes</OfficialLink>
                    <OfficialLink href={officialSources.curso}>Curso de Ingreso</OfficialLink>
                    <OfficialLink href={officialSources.calendario}>Calendario académico</OfficialLink>
                    <OfficialLink href={officialSources.modalidad}>Modalidad de cursada</OfficialLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
}
