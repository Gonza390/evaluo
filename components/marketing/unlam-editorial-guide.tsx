import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Sigma,
  UploadCloud,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { TrackedLink } from '@/components/marketing/tracked-link';

const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';
const demoHref = '/demo/material-estudio?source=seo_ingreso_unlam_2027';

const officialSources = {
  ingreso: 'https://ingresantes.unlam.edu.ar/',
  curso: 'https://www.unlam.edu.ar/curso-de-ingreso/',
  calendario: 'https://www.unlam.edu.ar/calendario-academico/',
  modalidad: 'https://ingresantes.unlam.edu.ar/Home/informacion/248',
  proceso: 'https://ingresantes.unlam.edu.ar/Home/informacion/247',
};

function OfficialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-semibold text-[#8f321f] underline decoration-[#8f321f]/30 underline-offset-4 transition hover:decoration-[#8f321f]"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#8f321f]">{children}</p>
  );
}

function StudyNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-8 border-l-4 border-[#c8533d] bg-[#eee6d7] px-5 py-4 text-[15px] leading-7 text-[#3a403b]">
      <div className="flex gap-3">
        <Lightbulb className="mt-1 h-4.5 w-4.5 shrink-0 text-[#8f321f]" aria-hidden="true" />
        <div>{children}</div>
      </div>
    </aside>
  );
}

export function UnlamEditorialGuide() {
  const toc = [
    ['#como-funciona', 'Cómo funciona el ingreso'],
    ['#material', 'Qué material estudiar'],
    ['#metodo', 'Método de estudio'],
    ['#matematica', 'Cómo preparar Matemática'],
    ['#semana-previa', 'La semana previa'],
    ['#evaluo', 'Usar Evaluo con tu material'],
    ['#errores', 'Errores frecuentes'],
    ['#fuentes', 'Fuentes oficiales'],
  ] as const;

  return (
    <div className="min-h-screen bg-[#f4f0e6] text-[#17201b] selection:bg-[#d9b8a8] selection:text-[#17201b]">
      <MarketingAnalyticsSlot />

      <header className="border-b border-[#17201b]/15 bg-[#f4f0e6]">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight text-[#17201b]">
            <Image src="/icon.png" alt="" width={30} height={30} className="h-7.5 w-7.5" />
            <span>Evaluo</span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#56605a]">
            <span className="hidden sm:inline">Guías de ingreso</span>
            <span aria-hidden="true" className="hidden h-3.5 w-px bg-[#17201b]/20 sm:block" />
            <Link href="/ia-para-estudiantes" className="underline decoration-[#17201b]/20 underline-offset-4 hover:decoration-[#17201b]">
              Estudiar con Evaluo
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#17201b]/15">
          <div className="mx-auto grid w-full max-w-[1240px] lg:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="px-4 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
              <div className="max-w-[820px]">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.17em] text-[#8f321f]">
                  <span>Guía 2027</span>
                  <span className="h-1 w-1 rounded-full bg-[#8f321f]" />
                  <span>Universidad Nacional de La Matanza</span>
                </div>
                <h1 className="mt-6 font-serif text-[3rem] leading-[0.98] font-semibold tracking-[-0.045em] text-[#17201b] sm:text-[4.5rem] lg:text-[5.4rem]">
                  Cómo estudiar para el Curso de Ingreso UNLaM 2027
                </h1>
                <p className="mt-7 max-w-3xl text-[17px] leading-8 text-[#4f5953] sm:text-[19px] sm:leading-9">
                  Una guía para organizar el manual, estudiar las materias con un método concreto y llegar a cada evaluación sabiendo qué dominás y qué todavía necesitás practicar.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#17201b]/15 pt-5 text-xs text-[#6d756f]">
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" aria-hidden="true" /> 12 min de lectura</span>
                  <span>Revisado el 17 de septiembre de 2026</span>
                  <span>Equipo Evaluo</span>
                </div>
              </div>
            </div>

            <aside className="border-t border-[#17201b]/15 bg-[#e7dfcf] px-5 py-8 sm:px-8 lg:border-t-0 lg:border-l lg:px-7 lg:py-12">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-[#8f321f]" aria-hidden="true" />
                <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#8f321f]">Segunda instancia 2027</p>
              </div>
              <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight">Las fechas que importan</h2>
              <dl className="mt-7 divide-y divide-[#17201b]/12 border-y border-[#17201b]/15">
                {[
                  ['Preinscripción', '28 sep. – 26 oct. 2026'],
                  ['Documentación', '5 – 26 oct. 2026'],
                  ['Cursada intensiva', '1 feb. – 6 mar. 2027'],
                  ['Exámenes', '8 – 12 mar. 2027'],
                ].map(([label, value]) => (
                  <div key={label} className="py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-[#687169]">{label}</dt>
                    <dd className="mt-1 text-[15px] font-bold text-[#17201b]">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs leading-6 text-[#5c655f]">
                La segunda instancia es intensiva y semipresencial. Si es tu primera vez, revisá también la modalidad regular publicada por la Universidad.
              </p>
              <div className="mt-4 text-xs">
                <OfficialLink href={officialSources.calendario}>Calendario oficial</OfficialLink>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-[#17201b]/15 bg-[#fbf8f1]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-0 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="hidden border-r border-[#17201b]/12 px-8 py-14 lg:block">
              <div className="sticky top-8">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8f321f]">En esta guía</p>
                <nav className="mt-5 flex flex-col gap-3">
                  {toc.map(([href, label], index) => (
                    <a key={href} href={href} className="group flex gap-3 text-sm leading-5 text-[#667069] hover:text-[#17201b]">
                      <span className="font-mono text-[11px] text-[#9a9f9b] group-hover:text-[#8f321f]">{String(index + 1).padStart(2, '0')}</span>
                      <span>{label}</span>
                    </a>
                  ))}
                </nav>
                <div className="mt-8 border-t border-[#17201b]/12 pt-6">
                  <p className="text-xs leading-6 text-[#737a75]">Esta guía no reemplaza la información oficial de UNLaM.</p>
                </div>
              </div>
            </aside>

            <article className="min-w-0 px-4 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
              <div className="max-w-[780px]">
                <section id="como-funciona" className="scroll-mt-8">
                  <SectionKicker>01 · Antes de estudiar</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">Entendé primero qué vas a rendir.</h2>
                  <p className="mt-6 text-[16px] leading-8 text-[#4f5953]">
                    UNLaM ofrece una primera instancia regular y una segunda intensiva. En ambas se rinde un examen por asignatura. La Universidad informa formatos de tres materias y, para Odontología, Arquitectura y Medicina, un recorrido de cuatro materias dentro de la instancia regular.
                  </p>
                  <p className="mt-5 text-[16px] leading-8 text-[#4f5953]">
                    Eso significa que tu estrategia no debería arrancar por “hacer resúmenes”, sino por identificar cuántas materias tenés, qué unidades entran y cuánto tiempo real hay entre clases y evaluaciones.
                  </p>
                  <StudyNote>
                    <strong>Primera decisión útil:</strong> armá una lista de materias y unidades antes de estudiar. Si no sabés qué entra, cualquier técnica de estudio se vuelve improvisación.
                  </StudyNote>
                  <div className="mt-7 border border-[#17201b]/15 bg-white p-5 sm:p-6">
                    <p className="text-sm leading-7 text-[#4f5953]">
                      Revisá la modalidad correspondiente a tu carrera en el <OfficialLink href={officialSources.curso}>Curso de Ingreso oficial de UNLaM</OfficialLink> y en la <OfficialLink href={officialSources.modalidad}>información de modalidad</OfficialLink>.
                    </p>
                  </div>
                </section>

                <hr className="my-16 border-[#17201b]/12" />

                <section id="material" className="scroll-mt-8">
                  <SectionKicker>02 · Material de estudio</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">El manual oficial es el centro del plan.</h2>
                  <p className="mt-6 text-[16px] leading-8 text-[#4f5953]">
                    UNLaM entrega una versión impresa del <strong>Manual del Curso de Ingreso</strong> al completar la inscripción presencial. Ese material, tus apuntes de clase y el contenido de MIeL Ingreso deberían ser la base de tu preparación.
                  </p>

                  <div className="mt-9 grid gap-px border border-[#17201b]/15 bg-[#17201b]/15 sm:grid-cols-2">
                    {[
                      [FileText, 'Manual', 'Marcá unidades, definiciones, ejemplos y ejercicios que se repiten.'],
                      [NotebookPen, 'Apuntes', 'Usalos para registrar lo que el docente enfatiza o explica de otra manera.'],
                      [BookOpen, 'MIeL Ingreso', 'Consultá consignas, avisos y material complementario de cada materia.'],
                      [ListChecks, 'Práctica', 'Separá ejercicios para resolver sin mirar la teoría.'],
                    ].map(([Icon, title, text]) => {
                      const IconComponent = Icon as typeof FileText;
                      return (
                        <div key={String(title)} className="bg-[#fbf8f1] p-5 sm:p-6">
                          <IconComponent className="h-5 w-5 text-[#8f321f]" aria-hidden="true" />
                          <h3 className="mt-4 font-serif text-2xl font-semibold">{String(title)}</h3>
                          <p className="mt-2 text-sm leading-7 text-[#5b645e]">{String(text)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-sm leading-7 text-[#5b645e]">
                    La entrega del manual forma parte del proceso informado por UNLaM. Podés revisar el detalle en el <OfficialLink href={officialSources.proceso}>proceso de inscripción oficial</OfficialLink>.
                  </p>
                </section>

                <hr className="my-16 border-[#17201b]/12" />

                <section id="metodo" className="scroll-mt-8">
                  <SectionKicker>03 · Método</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">Estudiá en ciclos, no en maratones de lectura.</h2>
                  <p className="mt-6 text-[16px] leading-8 text-[#4f5953]">
                    Una sesión útil debería terminar con una respuesta concreta a esta pregunta: <em>¿qué puedo recuperar sin mirar el material?</em> Para llegar ahí, conviene alternar comprensión, organización y práctica.
                  </p>

                  <ol className="mt-10 border-t border-[#17201b]/15">
                    {[
                      ['01', 'Ubicar', 'Leé la unidad completa y marcá qué conceptos, definiciones y procedimientos aparecen.'],
                      ['02', 'Entender', 'Explicá cada idea con tus propias palabras y comparala con el manual.'],
                      ['03', 'Reducir', 'Armá una síntesis breve de lo central; no copies párrafos enteros.'],
                      ['04', 'Recuperar', 'Cerrá el material e intentá responder preguntas o reconstruir conceptos.'],
                      ['05', 'Practicar', 'Resolvé ejercicios o consignas sin ayuda y registrá dónde te equivocaste.'],
                      ['06', 'Volver', 'Revisá solo los temas débiles y repetí el ciclo.'],
                    ].map(([number, title, text]) => (
                      <li key={number} className="grid gap-3 border-b border-[#17201b]/15 py-5 sm:grid-cols-[54px_120px_1fr] sm:items-start">
                        <span className="font-mono text-sm font-bold text-[#8f321f]">{number}</span>
                        <span className="font-bold text-[#17201b]">{title}</span>
                        <span className="text-sm leading-7 text-[#5b645e]">{text}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <hr className="my-16 border-[#17201b]/12" />

                <section id="matematica" className="scroll-mt-8">
                  <SectionKicker>04 · Materias prácticas</SectionKicker>
                  <div className="flex items-start gap-4">
                    <Sigma className="mt-1 h-7 w-7 shrink-0 text-[#8f321f]" aria-hidden="true" />
                    <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">Matemática se aprende resolviendo.</h2>
                  </div>
                  <p className="mt-6 text-[16px] leading-8 text-[#4f5953]">
                    En una materia práctica, leer un procedimiento y reconocerlo no alcanza. Necesitás resolverlo sin apoyo. Usá la teoría para entender el método y reservá la mayor parte de la sesión para aplicar ese método en ejercicios nuevos.
                  </p>

                  <div className="mt-8 border-l border-[#17201b]/20 pl-6">
                    {[
                      ['Concepto', '¿Qué representa y cuándo se usa?'],
                      ['Ejemplo resuelto', 'Seguí cada paso y explicá por qué se hace.'],
                      ['Ejercicio guiado', 'Resolvé con el procedimiento todavía visible.'],
                      ['Ejercicio solo', 'Cerrá la teoría y hacelo desde cero.'],
                      ['Corrección', 'Anotá en qué paso apareció el error.'],
                    ].map(([title, text]) => (
                      <div key={title} className="relative pb-6 last:pb-0">
                        <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-[#8f321f]" />
                        <h3 className="font-bold">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#5b645e]">{text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <hr className="my-16 border-[#17201b]/12" />

                <section id="semana-previa" className="scroll-mt-8">
                  <SectionKicker>05 · Antes del examen</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">La última semana sirve para diagnosticar, no para empezar de cero.</h2>
                  <p className="mt-6 text-[16px] leading-8 text-[#4f5953]">
                    Este esquema es orientativo. Ajustalo a la materia y a tu calendario, pero mantené una idea: cada día tiene que reducir incertidumbre sobre lo que todavía no dominás.
                  </p>

                  <div className="mt-9 overflow-hidden border border-[#17201b]/15 bg-white">
                    {[
                      ['7–6 días antes', 'Hacé una lista de temas y marcá verde, amarillo o rojo según tu nivel.'],
                      ['5–4 días antes', 'Trabajá únicamente los temas amarillos y rojos.'],
                      ['3 días antes', 'Practicá sin apuntes y cronometrá algunos bloques.'],
                      ['2 días antes', 'Corregí errores y volvé a los conceptos que explican esos errores.'],
                      ['1 día antes', 'Repaso breve. Nada de intentar incorporar una unidad completa nueva.'],
                    ].map(([when, action]) => (
                      <div key={when} className="grid border-b border-[#17201b]/10 last:border-b-0 sm:grid-cols-[170px_1fr]">
                        <div className="bg-[#eee6d7] px-5 py-4 text-sm font-bold text-[#17201b]">{when}</div>
                        <div className="px-5 py-4 text-sm leading-7 text-[#59625c]">{action}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section id="evaluo" className="scroll-mt-8 my-16 -mx-4 overflow-hidden bg-[#111827] text-white sm:-mx-8 lg:-mx-16">
                <div className="grid lg:grid-cols-[0.86fr_1.14fr]">
                  <div className="px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-indigo-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                      Evaluo aplicado a tu material
                    </div>
                    <p className="mt-7 text-[11px] font-black uppercase tracking-[0.18em] text-[#e59c7f]">06 · Del manual a una sesión de estudio</p>
                    <h2 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-5xl">
                      La guía te dice qué hacer. Evaluo te ayuda a hacerlo con tu material.
                    </h2>
                    <p className="mt-6 max-w-xl text-[16px] leading-8 text-slate-300">
                      Subís tus apuntes o un PDF y mantenés esa misma fuente mientras pasás de entender un tema a recordarlo y practicarlo. No reemplaza el manual: lo convierte en un espacio de estudio activo.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                      {['Resumen', 'Conceptos', 'Flashcards', 'Práctica'].map((label) => (
                        <span key={label} className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                      <TrackedLink
                        href={uploadHref}
                        eventName="cta_click"
                        payload={{ location: 'seo_ingreso_unlam_editorial', cta_name: 'subir_material_ingreso', destination: uploadHref }}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(79,70,229,0.3)] transition hover:bg-indigo-400"
                      >
                        <UploadCloud className="h-4 w-4" aria-hidden="true" />
                        Estudiar mi material
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </TrackedLink>
                      <TrackedLink
                        href={demoHref}
                        eventName="cta_click"
                        payload={{ location: 'seo_ingreso_unlam_editorial', cta_name: 'ver_demo_material', destination: '/demo/material-estudio' }}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                      >
                        Ver sesión de ejemplo
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </TrackedLink>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-[#0b1020] p-4 sm:p-7 lg:border-t-0 lg:border-l lg:p-10">
                    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#f7f8fc] text-slate-900 shadow-[0_28px_70px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                            <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Fuente de estudio</p>
                            <p className="text-sm font-bold text-slate-950">Manual de ingreso · Matemática</p>
                          </div>
                        </div>
                        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline">Mismo material</span>
                      </div>

                      <div className="grid gap-3 p-4 sm:p-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">01 · Resumen</p>
                            <span className="text-[10px] text-slate-400">Ecuaciones</span>
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-950">Idea central</p>
                          <p className="mt-1 text-xs leading-6 text-slate-600">
                            Una ecuación expresa una igualdad con una incógnita. Resolverla implica encontrar los valores que mantienen verdadera esa igualdad.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">02 · Flashcard</p>
                            <p className="mt-3 text-xs font-bold leading-5 text-slate-900">¿Qué debe conservarse al operar ambos miembros de una ecuación?</p>
                            <div className="mt-3 border-t border-indigo-100 pt-3 text-[11px] leading-5 text-slate-600">Intentá responder antes de ver la explicación.</div>
                          </div>
                          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">03 · Práctica</p>
                            <p className="mt-3 text-xs font-bold leading-5 text-slate-900">Resolvé sin mirar el procedimiento:</p>
                            <p className="mt-3 font-mono text-lg font-bold text-slate-950">3x + 7 = 22</p>
                            <p className="mt-2 text-[11px] leading-5 text-slate-600">Después compará el error con el concepto del manual.</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-300">Siguiente paso</p>
                            <p className="mt-1 text-xs font-semibold">Volver solo a lo que todavía cuesta</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                      Ejemplo visual del flujo de estudio. El contenido real depende del material que subas.
                    </p>
                  </div>
                </div>
              </section>

              <div className="max-w-[780px]">
                <section id="errores" className="scroll-mt-8">
                  <SectionKicker>07 · Errores frecuentes</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">Lo que suele hacer perder tiempo.</h2>
                  <div className="mt-8 divide-y divide-[#17201b]/12 border-y border-[#17201b]/12">
                    {[
                      ['Leer muchas veces sin intentar responder', 'La familiaridad con una página no demuestra que puedas recuperar la información sin verla.'],
                      ['Resumir todo', 'Si el resumen reproduce casi todo el manual, no te obliga a decidir qué es central.'],
                      ['Dejar los ejercicios para el final', 'La práctica sirve también para descubrir qué parte de la teoría todavía no entendiste.'],
                      ['Usar IA sin volver a la fuente', 'Cualquier explicación generada debería contrastarse con el material oficial que realmente estás preparando.'],
                    ].map(([title, text]) => (
                      <div key={title} className="grid gap-2 py-5 sm:grid-cols-[230px_1fr] sm:gap-8">
                        <h3 className="font-bold leading-6">{title}</h3>
                        <p className="text-sm leading-7 text-[#5b645e]">{text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <hr className="my-16 border-[#17201b]/12" />

                <section>
                  <SectionKicker>Preguntas frecuentes</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em]">Dudas comunes sobre el ingreso UNLaM.</h2>
                  <div className="mt-8 divide-y divide-[#17201b]/12 border-y border-[#17201b]/12">
                    {[
                      ['¿Conviene hacer la instancia regular o la intensiva?', 'UNLaM recomienda la regular para quienes hacen el Curso de Ingreso por primera vez. La intensiva concentra más cursadas por semana y suele recomendarse a recursantes o personas con experiencia universitaria.'],
                      ['¿Todas las carreras tienen las mismas materias?', 'No necesariamente. Revisá siempre el formato correspondiente a tu carrera en la información oficial del Curso de Ingreso.'],
                      ['¿Evaluo tiene material oficial de UNLaM?', 'Evaluo no reemplaza ni distribuye el material oficial. La idea es que trabajes sobre tus propios apuntes, PDFs y el material que te entrega la Universidad.'],
                      ['¿Puedo estudiar Matemática solo con resúmenes?', 'No es recomendable. Los resúmenes ayudan a ordenar conceptos, pero una materia práctica requiere resolver ejercicios sin mirar el procedimiento.'],
                    ].map(([question, answer]) => (
                      <details key={question} className="group py-5">
                        <summary className="cursor-pointer list-none pr-8 font-bold marker:hidden">{question}</summary>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5b645e]">{answer}</p>
                      </details>
                    ))}
                  </div>
                </section>

                <hr className="my-16 border-[#17201b]/12" />

                <section id="fuentes" className="scroll-mt-8">
                  <SectionKicker>08 · Fuentes</SectionKicker>
                  <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.03em]">Información oficial utilizada.</h2>
                  <p className="mt-5 text-sm leading-7 text-[#5b645e]">
                    La información institucional de esta guía fue revisada el 17 de septiembre de 2026. Las fechas y modalidades pueden cambiar, por lo que conviene confirmar siempre cualquier decisión en los canales oficiales de UNLaM.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 text-sm">
                    <OfficialLink href={officialSources.ingreso}>Sistema de Ingresantes UNLaM</OfficialLink>
                    <OfficialLink href={officialSources.curso}>Curso de Ingreso UNLaM</OfficialLink>
                    <OfficialLink href={officialSources.calendario}>Calendario académico UNLaM</OfficialLink>
                    <OfficialLink href={officialSources.modalidad}>Modalidad y evaluaciones del Curso de Ingreso</OfficialLink>
                    <OfficialLink href={officialSources.proceso}>Proceso de inscripción y entrega del manual</OfficialLink>
                  </div>

                  <div className="mt-10 border-t border-[#17201b]/15 pt-6 text-xs leading-6 text-[#727a74]">
                    Evaluo no está afiliado a UNLaM ni representa a la Universidad Nacional de La Matanza. Las marcas mencionadas pertenecen a sus respectivos titulares.
                  </div>
                </section>

                <section className="mt-16 border-t border-[#17201b]/15 pt-8">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f321f]">Seguir estudiando</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      ['/estudiar-pdf-con-ia', 'Estudiar un PDF con IA'],
                      ['/funciones/resumir-pdf-con-ia', 'Resumir un PDF para estudiar'],
                      ['/funciones/crear-flashcards-desde-pdf', 'Crear flashcards desde un PDF'],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} className="border-t-2 border-[#17201b] pt-3 text-sm font-bold leading-6 transition hover:text-[#8f321f]">
                        {label} <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </article>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
}
