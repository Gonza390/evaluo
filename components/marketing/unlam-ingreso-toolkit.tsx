import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2, ClipboardList, ExternalLink, FileText, GraduationCap, Info, Lightbulb, UploadCloud } from 'lucide-react';

import { TrackedLink } from '@/components/marketing/tracked-link';

const UPLOAD_HREF = '/estudiar-pdf-con-ia?source=ingreso-unlam-2027';

const SUBJECT_GROUPS = [
  {
    id: 'economicas',
    name: 'Ciencias Económicas',
    examples: 'Contador Público, Administración, Comercio Internacional y Economía',
    subjects: ['Contabilidad', 'Matemática', 'Seminario de comprensión y producción de textos'],
    tip: 'Para Contabilidad, relacioná cada concepto con un caso o registro de ejemplo; para Matemática, alterná ejercicios y revisión de procedimientos.',
    special: false,
  },
  {
    id: 'ingenieria',
    name: 'Ingeniería e Investigaciones Tecnológicas',
    examples: 'Ingenierías Civil, Industrial, Electrónica, Informática, Mecánica y Energías Renovables',
    subjects: ['Matemática', 'Geometría', 'Seminario de comprensión y producción de textos'],
    tip: 'En Matemática y Geometría, anotá cuál fue el primer paso que no supiste resolver y repetí un ejercicio equivalente sin consultar la solución.',
    special: false,
  },
  {
    id: 'humanidades',
    name: 'Humanidades y Ciencias Sociales',
    examples: 'Comunicación Social, Relaciones Laborales, Relaciones Públicas, Trabajo Social',
    subjects: ['Filosofía', 'Elementos de lógica matemática', 'Seminario de comprensión y producción de textos'],
    tip: 'Armá una ficha por argumento o concepto: definición, ejemplo, contraejemplo y comparación con otro concepto del manual.',
    special: false,
  },
  {
    id: 'educacion-fisica',
    name: 'Profesorado en Educación Física',
    examples: 'Profesorado en Educación Física · programa diferenciado dentro de Humanidades',
    subjects: ['Fundamentos de la Educación Física', 'Filosofía', 'Seminario de comprensión y producción de textos'],
    tip: 'Fundamentos de la Educación Física tiene una evaluación teórica escrita y pruebas prácticas de eficiencia física: ambas son obligatorias. La universidad solicita ficha médica ante la coordinación con al menos 10 días de anticipación a las pruebas. Evaluo sirve para preparar la parte teórica, no para reemplazar la preparación física.',
    special: false,
  },
  {
    id: 'derecho',
    name: 'Derecho y Ciencia Política',
    examples: 'Abogacía y Ciencia Política',
    subjects: ['Historia Argentina', 'Filosofía', 'Seminario de comprensión y producción de textos'],
    tip: 'Prepará respuestas que conecten hechos, contexto y consecuencias. Evitá quedarte únicamente con fechas o definiciones aisladas.',
    special: false,
  },
  {
    id: 'salud',
    name: 'Ciencias de la Salud',
    examples: 'Enfermería, Nutrición, Kinesiología y Fisiatría, Anatomía Patológica',
    subjects: ['Biociencias', 'Filosofía', 'Seminario de comprensión y producción de textos'],
    tip: 'En Biociencias, recuperá las relaciones entre conceptos con tus palabras y contrastá cada explicación con el manual correspondiente a tu carrera.',
    special: false,
  },
  {
    id: 'medicina',
    name: 'Medicina',
    examples: 'Carrera de Medicina · esquema especial de cuatro materias',
    subjects: ['Biociencias', 'Filosofía', 'Seminario de comprensión y producción de textos', 'Educación Médica'],
    tip: 'Organizá las tres primeras materias del tramo regular y la cuarta por separado. Revisá el cronograma oficial del segundo tramo.',
    special: true,
  },
  {
    id: 'arquitectura',
    name: 'Arquitectura',
    examples: 'Carrera de Arquitectura · esquema especial de cuatro materias',
    subjects: ['Matemática', 'Geometría', 'Seminario de comprensión y producción de textos', 'Introducción al conocimiento proyectual'],
    tip: 'Separá ejercicios numéricos, visuales y de explicación de procedimientos; no intentes preparar la materia proyectual sólo con resúmenes.',
    special: true,
  },
  {
    id: 'odontologia',
    name: 'Odontología',
    examples: 'Carrera de Odontología · esquema especial de cuatro materias',
    subjects: ['Biociencias', 'Filosofía', 'Seminario de comprensión y producción de textos', 'Educación Odontológica'],
    tip: 'Usá diagramas y preguntas explicativas sobre Biociencias y verificá las exigencias del cuarto espacio curricular en los canales oficiales.',
    special: true,
  },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Elegí tu carrera y descargá o consultá el programa vigente.',
    body: 'No todas las carreras rinden las mismas materias. Verificá las asignaturas, las unidades y el orden de los exámenes de tu instancia antes de planificar.',
    result: 'Lista real de materias y unidades.',
  },
  {
    number: '02',
    title: 'Dividí el manual en bloques abordables.',
    body: 'Por cada unidad anotá conceptos, definiciones, relaciones y ejercicios. Marcá las dudas, pero evitá copiar todo el texto.',
    result: 'Temario que podés recorrer y controlar.',
  },
  {
    number: '03',
    title: 'Practicá sin mirar la resolución.',
    body: 'Si es Matemática, resolvé ejercicios distintos. Si es una materia teórica, explicá conceptos y argumentos sin mirar las páginas.',
    result: 'Evidencia de lo que comprendiste de verdad.',
  },
  {
    number: '04',
    title: 'Revisá el error y volvé al apartado exacto.',
    body: 'Anotá por qué fallaste: concepto desconocido, confusión entre opciones, procedimiento o interpretación. Repetí luego con otra pregunta.',
    result: 'Lista corta de temas a reforzar.',
  },
] as const;

export function UnlamIngresoToolkit() {
  return (
    <div className="bg-white text-slate-950">
      <section id="materias-unlam" aria-labelledby="titulo-materias-unlam" className="scroll-mt-8 border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
          <div className="flex max-w-4xl flex-col gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              <GraduationCap className="h-4 w-4" aria-hidden="true" /> Materias por carrera
            </p>
            <h2 id="titulo-materias-unlam" className="text-[2rem] font-black leading-[1.15] tracking-[-0.04em] sm:text-4xl">
              ¿Qué materias tiene el Curso de Ingreso UNLaM 2027?
            </h2>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              El programa depende de la carrera. Buscá tu departamento en esta guía y usá
              los nombres de las materias como punto de partida para organizar tu manual.
              Los planes, la denominación de alguna asignatura y los requisitos se deben
              confirmar siempre en el sitio oficial de la UNLaM.
            </p>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            {SUBJECT_GROUPS.map((group) => (
              <details
                key={group.id}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 open:border-blue-200 open:bg-blue-50/40 sm:p-5"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left">
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-slate-950">{group.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{group.examples}</span>
                  </span>
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xl font-light text-blue-700 ring-1 ring-slate-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    {group.special ? 'Cuatro materias · sólo instancia regular' : 'Materias de referencia'}
                  </p>
                  <ol className="mt-3 space-y-2">
                    {group.subjects.map((subject, index) => (
                      <li key={subject} className="flex items-start gap-2 text-sm leading-6 text-slate-800">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-black text-blue-700">
                          {index + 1}
                        </span>
                        {subject}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 rounded-xl border border-blue-100 bg-white p-3">
                    <p className="flex gap-2 text-sm leading-6 text-slate-600">
                      <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true"/>
                      <span>{group.tip}</span>
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-start">
            <Info className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-slate-700">
              <strong>Importante:</strong> Medicina, Arquitectura y Odontología cursan un esquema
              de cuatro materias que se ofrece en la primera instancia regular. Esas carreras
              no se ofertan en la instancia intensiva 2027. El Profesorado en Educación Física tiene materias propias y aparece identificado por separado en esta guía.
              {' '}
              <a href="https://www.unlam.edu.ar/curso-de-ingreso/" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline underline-offset-4">
                Ver materias oficiales <ExternalLink className="inline h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      </section>

      <section id="plan-ingreso" aria-labelledby="titulo-plan" className="scroll-mt-8 border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Guía para estudiar</p>
              <h2 id="titulo-plan" className="mt-3 text-[2rem] font-black leading-[1.15] tracking-[-0.04em] sm:text-4xl">
                Cómo estudiar el manual de ingreso UNLaM
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                La lectura es el comienzo, no toda la preparación. Un plan útil transforma
                cada unidad del manual en preguntas, explicaciones y ejercicios que puedas
                resolver sin ayuda.
              </p>
              <a href="https://ingresantes.unlam.edu.ar/Home/informacion/247" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-4">
                <BookOpenCheck className="h-4 w-4" aria-hidden="true"/> Cómo obtener el manual oficial <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <ol className="space-y-3">
              {STEPS.map((step) => (
                <li key={step.number} className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-black text-blue-800">{step.number}</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                    <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5 text-blue-700">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
                      {step.result}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <FileText className="h-6 w-6 text-blue-700" aria-hidden="true" />
              <h3 className="mt-3 text-xl font-bold">¿Dónde consigo el manual del Curso de Ingreso?</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                La UNLaM indica que entrega el manual impreso al completar la inscripción
                presencial. También informa que el entorno MIeL Ingreso brinda material de
                cursada. Evaluo <strong>no aloja ni distribuye una copia oficial</strong>:
                trabajás con los materiales que te corresponden.
              </p>
              <a href="https://mielingreso.unlam.edu.ar/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-4">
                Acceder a MIeL Ingreso <ExternalLink className="h-4 w-4" aria-hidden="true"/>
              </a>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <CalendarDays className="h-6 w-6 text-blue-700" aria-hidden="true" />
              <h3 className="mt-3 text-xl font-bold">¿Cómo preparo la última semana?</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Alterná simulacros breves sin mirar el material con sesiones de corrección.
                Marcá los temas que no podés explicar y repetilos con ejemplos nuevos.
                No dependas de memorizar un supuesto examen anterior: lo importante es
                resolver consignas distintas del mismo contenido.
              </p>
              <a href="https://ingresantes.unlam.edu.ar/Home/informacion/273" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-4">
                Consultar clases de apoyo gratuitas <ExternalLink className="h-4 w-4" aria-hidden="true"/>
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-[#0f1b3d] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-blue-200">Del manual a la práctica</p>
              <h3 className="mt-2 text-xl font-bold text-white">¿Ya tenés tus apuntes o el manual en PDF?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Elegí el archivo primero. En Evaluo vas a poder generar materiales de estudio
                y preguntas sobre el contenido que realmente necesitás rendir.
              </p>
            </div>
            <TrackedLink href={UPLOAD_HREF} eventName="cta_click"
              payload={{ location: 'seo_unlam_study_plan', cta_name: 'elegir_manual_pdf', destination: UPLOAD_HREF }}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 hover:bg-blue-50">
              <UploadCloud className="h-4 w-4" aria-hidden="true" /> Estudiar mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true"/>
            </TrackedLink>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-500">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>
            Contenido de orientación independiente, actualizado el 20 de octubre de 2026.
            La universidad es la única fuente válida para inscripciones, programas y fechas.
          </p>
        </div>
      </section>
    </div>
  );
}
