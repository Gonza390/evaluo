import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, ExternalLink, ListChecks, UploadCloud } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { UnlamAdmissionGuide } from '@/components/marketing/unlam-admission-guide';
import { UnlamUnifiedPractice } from '@/components/marketing/unlam-unified-practice';
import { UnlamIngresoToolkit } from '@/components/marketing/unlam-ingreso-toolkit';
import { UnlamExamModels } from '@/components/marketing/unlam-exam-models';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';

const uploadHref = '/estudiar-pdf-con-ia?source=ingreso-unlam-2027';

const officialSources = {
  ingreso: 'https://ingresantes.unlam.edu.ar/',
  curso: 'https://www.unlam.edu.ar/curso-de-ingreso/',
  calendario: 'https://www.unlam.edu.ar/calendario-academico/',
  modalidad: 'https://ingresantes.unlam.edu.ar/Home/informacion/248',
  proceso: 'https://ingresantes.unlam.edu.ar/Home/informacion/247',
};

function OfficialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:decoration-blue-500">
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

const FAQ = [
  {
    q: '¿Cuántos puntos necesito para aprobar el ingreso?',
    a: 'UNLaM exige 70 sobre 100 puntos ponderados para el esquema de tres materias y 105 sobre 150 para cuatro materias, con condiciones por tramo. Consultá los ejemplos y las restricciones en la sección de requisitos.'
  },
  {
    q: '¿Todas las carreras tienen las mismas materias?',
    a: 'No. Las asignaturas y el esquema de tres o cuatro materias dependen de tu carrera. Educación Física también tiene asignaturas propias. Revisá la guía por carrera y el programa vigente.'
  },
  {
    q: '¿Puedo hacer el ingreso intensivo a Medicina, Arquitectura u Odontología?',
    a: 'No. Según la información vigente de UNLaM, esas carreras tienen cuatro materias y solo se ofrecen en la primera instancia regular.'
  },
  {
    q: '¿Los modelos anteriores son los exámenes que tomarán en 2027?',
    a: 'No. Son ejemplos históricos de formatos de consigna. Las actividades de Evaluo son originales y no equivalen a exámenes oficiales ni anticipan lo que se evaluará.'
  },
  {
    q: '¿Necesito un manual oficial para utilizar Evaluo?',
    a: 'La fuente de estudio debe ser tu programa y manual vigente. Podés elegir tu PDF antes de registrarte y generar materiales de práctica; verificá las explicaciones con el texto de la cátedra.'
  },
] as const;

export function UnlamEditorialGuide() {
  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-blue-100 selection:text-blue-900">
      <MarketingAnalyticsSlot />

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader
            variant="landing"
            actions={
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/login?mode=login" className="inline-flex min-h-11 items-center text-xs font-semibold text-slate-600 hover:text-slate-950">Entrar</Link>
                <TrackedLink href={uploadHref} eventName="cta_click"
                  payload={{ location: 'seo_ingreso_unlam_2027_header', cta_name: 'elegir_manual_pdf', destination: uploadHref }}
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-800 sm:px-4">
                  Elegir PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </div>
            }
          />
        </div>
      </div>

      <main>
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_88%_12%,rgba(99,102,241,0.08),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] lg:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="px-4 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
              <div className="max-w-[820px]">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.17em] text-blue-700">
                  <span>Guía 2027</span>
                  <span className="h-1 w-1 rounded-full bg-gradient-to-r from-brand to-brand-2" />
                  <span>Universidad Nacional de La Matanza</span>
                </div>
                <h1 className="mt-5 max-w-[760px] font-serif text-[2.6rem] leading-[1.01] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[3.45rem] lg:text-[4.1rem]">
                  Curso de Ingreso UNLaM 2027: materias, fechas y cómo estudiar
                </h1>
                <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600 sm:text-[16px] sm:leading-7">
                  Consultá las materias según tu carrera, las fechas oficiales de 2027 y una guía para preparar el manual. Además, podés resolver ejercicios gratuitos y continuar practicando con tus propios apuntes en Evaluo.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <TrackedLink
                    href="#materias-unlam"
                    eventName="cta_click"
                    payload={{ location: 'seo_ingreso_unlam_2027_hero', cta_name: 'ver_materias_por_carrera', destination: '#materias-unlam' }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(29,78,216,0.16)] hover:bg-blue-800"
                  >
                    Ver materias de mi carrera <ArrowRight className="h-4 w-4" aria-hidden="true"/>
                  </TrackedLink>
                  <TrackedLink
                    href="#practica-ingreso"
                    eventName="cta_click"
                    payload={{ location: 'seo_ingreso_unlam_2027_hero', cta_name: 'practicar_sin_registro', destination: '#practica-ingreso' }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50"
                  >
                    <ListChecks className="h-4 w-4" aria-hidden="true"/> Practicar gratis
                  </TrackedLink>
                </div>
                <a
                  href="#modelos-examen-unlam"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-500"
                >
                  Ver modelos de examen y cómo prepararlos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" aria-hidden="true" /> Guía y práctica interactiva</span>
                  <span>Revisado el 20 de octubre de 2026</span>
                  <span>Equipo Evaluo</span>
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-blue-50/60 px-5 py-8 sm:px-8 lg:border-t-0 lg:border-l lg:px-7 lg:py-10">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-blue-700" aria-hidden="true" />
                <p className="text-[11px] font-black uppercase tracking-[0.17em] text-blue-700">Segunda instancia 2027</p>
              </div>
              <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight sm:text-[28px]">Las fechas que importan</h2>
              <dl className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
                {[
                  ['Preinscripción', '28 sep. – 26 oct. 2026'],
                  ['Documentación', '5 – 26 oct. 2026'],
                  ['Cursada intensiva', '1 feb. – 6 mar. 2027'],
                  ['Exámenes', '8 – 12 mar. 2027'],
                ].map(([label, value]) => (
                  <div key={label} className="py-3.5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">{label}</dt>
                    <dd className="mt-1 text-[15px] font-bold text-slate-950">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-xl border border-blue-100 bg-white p-3">
                <p className="text-xs font-bold text-slate-900">Primera instancia regular 2027</p>
                <p className="mt-1 text-xs leading-6 text-slate-600">
                  Cursada presencial: 20 de julio al 9 de diciembre de 2026.
                  Se desarrolla antes de la segunda instancia y la UNLaM la recomienda
                  para quienes ingresan por primera vez.
                </p>
              </div>
              <p className="mt-5 text-xs leading-6 text-slate-600">
                La segunda instancia es intensiva y semipresencial, recomendada para recursantes o aspirantes con experiencia universitaria. Medicina, Arquitectura y Odontología no se ofertan en esta instancia; si es tu primera vez, revisá la modalidad regular.
              </p>
              <div className="mt-4 text-xs">
                <OfficialLink href={officialSources.calendario}>Calendario oficial</OfficialLink>
              </div>
            </aside>
          </div>
        </section>


        <UnlamUnifiedPractice />
        <UnlamAdmissionGuide />
        <UnlamIngresoToolkit />
        <UnlamExamModels />

        <section aria-labelledby="preguntas-ingreso-unlam" className="border-b border-slate-200 bg-white py-12 sm:py-16">
          <div className="mx-auto grid w-full max-w-[1160px] gap-9 px-4 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Antes de rendir</p>
              <h2 id="preguntas-ingreso-unlam" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Preguntas frecuentes del ingreso UNLaM 2027
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                No reemplaza el manual ni las condiciones oficiales de tu carrera.
                Para confirmar modalidades, materiales y requisitos, usá las páginas institucionales.
              </p>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="min-h-10 cursor-pointer pr-5 text-sm font-bold leading-6 text-slate-950 sm:text-base">{item.q}</summary>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="fuentes" aria-labelledby="fuentes-unlam-title" className="scroll-mt-8 bg-[#f8fafc] py-12 sm:py-16">
          <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Transparencia y fuentes</p>
            <h2 id="fuentes-unlam-title" className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Fuentes oficiales del Curso de Ingreso
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Revisado el 20 de octubre de 2026. UNLaM es la autoridad para inscripciones, horarios,
              evaluación, recuperatorios y cambios en el calendario. Los modelos externos de años
              anteriores se identifican en su sección correspondiente.
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <OfficialLink href={officialSources.ingreso}>Sistema de Ingresantes</OfficialLink>
              <OfficialLink href={officialSources.curso}>Materias y régimen de aprobación</OfficialLink>
              <OfficialLink href={officialSources.calendario}>Calendario oficial 2027</OfficialLink>
              <OfficialLink href={officialSources.modalidad}>Modalidad de cursada</OfficialLink>
              <OfficialLink href={officialSources.proceso}>Inscripción y acceso al manual</OfficialLink>
            </div>
            <div className="mt-8 rounded-2xl bg-[#0f1b3d] p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-7 sm:p-7">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-200">Convertí tu material en práctica</p>
                <h3 className="mt-2 text-xl font-bold">Empezá con el PDF de tu curso</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Elegí tu archivo antes de registrarte. Practicá con tus apuntes y compará los resultados con el manual.
                </p>
              </div>
              <TrackedLink href={uploadHref} eventName="cta_click"
                payload={{ location: 'seo_ingreso_unlam_2027_final', cta_name: 'elegir_manual_pdf', destination: uploadHref }}
                className="mt-5 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 hover:bg-blue-50 sm:mt-0">
                <UploadCloud className="h-4 w-4" aria-hidden="true" /> Elegir mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
            </div>
            <p className="mt-6 text-xs leading-6 text-slate-500">
              Evaluo no está afiliado a UNLaM ni representa a la Universidad Nacional de La Matanza.
              Las actividades son ejemplos didácticos independientes, no exámenes oficiales.
            </p>
            <nav aria-label="Seguir estudiando" className="mt-6 flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-sm font-semibold text-blue-700">
              <Link href="/estudiar-pdf-con-ia" className="underline underline-offset-4">Estudiar un PDF con IA</Link>
              <Link href="/funciones/resumir-pdf-con-ia" className="underline underline-offset-4">Resumir mi PDF</Link>
              <Link href="/funciones/crear-flashcards-desde-pdf" className="underline underline-offset-4">Crear flashcards</Link>
            </nav>
          </div>
        </section>
      </main>
      <FooterHome />
    </div>
  );
}
