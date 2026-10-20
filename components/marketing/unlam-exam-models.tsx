import { ArrowRight, ExternalLink, FileQuestion, UploadCloud } from 'lucide-react';
import { UnlamExamFormatSample } from '@/components/marketing/unlam-exam-format-sample';
import { TrackedLink } from '@/components/marketing/tracked-link';

const PDF_HREF = '/estudiar-pdf-con-ia?source=ingreso-unlam-2027';
const HISTORICAL_OFFICIAL_MANUAL = 'https://mielingreso.unlam.edu.ar/data4/data/ingreso/contenido/INGRESO_2021004/Manual-Curso-de-Ingreso-2022---Economicas.pdf';
const SHARED_2026_MATH = 'https://www.studocu.com/es-ar/document/universidad-nacional-de-la-matanza/matematica-curso-de-ingreso/examen-de-matematicas-unlam-ingreso-2026-primera-instancia/155107586';
const OFFICIAL_MIeL = 'https://mielingreso.unlam.edu.ar/';
const SHARED_2026_SEMINARIO = 'https://www.studocu.com/es-ar/document/universidad-nacional-de-la-matanza/seminario-de-comprension-y-produccion-de-textos/manual-de-ingreso-2026-seminario-de-comprension-y-produccion-de-textos/140155038';
const SHARED_ACCOUNTING = 'https://www.studocu.com/es-ar/document/universidad-nacional-de-la-matanza/contabilidadcurso-ingreso/modelo-de-examen-contabilidad-ingreso-unlam/146892896';

const FORMATS = [
  {
    number: '01',
    heading: 'Comprender un texto y reconocer cómo se construye',
    evidence: 'El manual 2022 alojado por UNLaM incluye un examen modelo de Seminario con lectura y análisis de un texto.',
    preparation: 'Identificá la finalidad del texto, su idea central, los recursos de argumentación y las marcas de enunciación. Practicá con fragmentos diferentes.',
    tool: 'Preguntas de comprensión sobre tu material y repaso de conceptos en Evaluo.',
  },
  {
    number: '02',
    heading: 'Responder y justificar, no solamente elegir una opción',
    evidence: 'El modelo del manual incluye consignas que piden fundamentar las respuestas usando información del propio texto.',
    preparation: 'Escribí por qué elegiste una respuesta y señalá qué idea del material la respalda. Después compará tu explicación con el manual.',
    tool: 'Preguntas a desarrollar y revisión de tus errores a partir del PDF cargado.',
  },
  {
    number: '03',
    heading: 'Redactar un informe o desarrollar una explicación',
    evidence: 'El ejemplo histórico incluye un informe descriptivo de lectura y una producción argumentativa, con criterios de evaluación para la escritura.',
    preparation: 'Ordená tema, postura o propuesta del texto, desarrollo y conclusión. Revisá coherencia, uso de fuentes y claridad.',
    tool: 'Glosario, resumen y preguntas abiertas para preparar los conceptos; contrastá la redacción final con la bibliografía y tu docente.',
  },
  {
    number: '04',
    heading: 'Matemática: resolver procedimientos y fundamentar',
    evidence: 'Una copia de un examen de Matemática 2026 compartida por estudiantes presenta ejercicios de cálculo, verdadero/falso justificado y resolución de problemas.',
    preparation: 'No memorices solo el resultado: practicá restricciones de dominio, ecuaciones, funciones y explicaciones paso a paso según el programa de tu carrera.',
    tool: 'Organizar tu guía y generar práctica conceptual con tu PDF; para comprobar cálculos y desarrollos extensos, contrastá con las soluciones y el docente.',
  },
  {
    number: '05',
    heading: 'Contabilidad: aplicar conceptos a operaciones',
    evidence: 'Un modelo externo de ingreso en Contabilidad, subido por un estudiante, contiene situaciones de registración, cuentas y variaciones patrimoniales.',
    preparation: 'Tomá cada operación, identificá qué cuentas intervienen, explicá el efecto patrimonial y contrastá después con la resolución correcta.',
    tool: 'Usar el PDF para reforzar definiciones y generar preguntas conceptuales; los asientos y cálculos deben validarse con el material de la cátedra.',
  },
] as const;

const SOURCES = [
  {
    title: 'Manual del Curso de Ingreso UNLaM 2022 · Ciencias Económicas',
    badge: 'Fuente alojada por UNLaM · histórica',
    url: HISTORICAL_OFFICIAL_MANUAL,
    description: 'Incluye módulos de Seminario, anexos con modelos de examen y ejercicios de Matemática. Es una edición anterior; no se debe usar como programa 2027 sin comprobar cambios.',
  },
  {
    title: 'Manual de Seminario identificado como edición 2026',
    badge: 'Copia compartida por estudiantes · no oficial',
    url: SHARED_2026_SEMINARIO,
    description: 'Describe ejercicios de opción múltiple, completamiento, justificación y respuesta construida, y remite a modelos en MIeL. No es el programa 2027 verificado por Evaluo.',
  },
  {
    title: 'Modelo de examen de Matemática, ingreso 2026',
    badge: 'Copia aportada por estudiantes',
    url: SHARED_2026_MATH,
    description: 'Referencia externa de un examen atribuido a la primera instancia 2026. Evaluo no ha verificado su autenticidad con la universidad ni reproduce sus consignas.',
  },
  {
    title: 'Modelo de examen de Contabilidad del ingreso',
    badge: 'Copia aportada por estudiantes · referencia',
    url: SHARED_ACCOUNTING,
    description: 'Ejercicios de registros contables, cuentas y variaciones patrimoniales. La autenticidad y vigencia para 2027 no están certificadas por la universidad.',
  },
  {
    title: 'MIeL Ingreso · UNLaM',
    badge: 'Plataforma oficial vigente',
    url: OFFICIAL_MIeL,
    description: 'Acceso al material, fichas de clase y prácticas correspondientes al curso actual. Requiere credenciales de estudiante.',
  },
] as const;

export function UnlamExamModels() {
  return (
    <section id="modelos-examen-unlam" aria-labelledby="unlam-exam-models-title" className="scroll-mt-8 border-b border-slate-200 bg-[#f6f8fe] py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
            <FileQuestion className="h-4 w-4" aria-hidden="true" /> Modelos y tipos de consignas
          </p>
          <h2 id="unlam-exam-models-title" className="mt-3 text-[2rem] font-black leading-[1.14] tracking-[-0.04em] text-slate-950 sm:text-[2.6rem]">
            Modelos de examen de ingreso UNLaM: qué se pregunta y cómo prepararte
          </h2>
          <p className="mt-5 text-sm leading-8 text-slate-700 sm:text-base">
            Para preparar bien un examen no alcanza con conocer los temas: necesitás entender <strong>qué te piden hacer con esos contenidos</strong>.
            Encontramos modelos y ejercicios de años anteriores que permiten identificar habilidades evaluadas, como leer,
            justificar, redactar y resolver problemas matemáticos.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Lo siguiente describe <strong>formatos documentados en materiales anteriores</strong>.
            No representa una filtración, una predicción del examen 2027 ni un modelo oficial actualizado.
            Las materias y consignas cambian según la carrera, cátedra y período.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FORMATS.map((format) => (
            <article key={format.number} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                  {format.number}
                </span>
                <h3 className="text-base font-bold leading-6 text-slate-950 sm:text-lg">{format.heading}</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                <span className="font-bold text-slate-900">Qué encontramos. </span>{format.evidence}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                <span className="font-bold text-slate-900">Cómo prepararte. </span>{format.preparation}
              </p>
              <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-950">
                <span className="font-bold">Con Evaluo. </span>{format.tool}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black tracking-tight text-slate-950">Material de referencia encontrado</h3>
            <span className="text-xs font-semibold text-slate-500">Fuentes y ediciones identificadas</span>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {SOURCES.map((source) => (
              <div key={source.url} className="py-4 first:pt-0 last:pb-0">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{source.badge}</p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-10 items-center gap-2 text-sm font-bold leading-6 text-slate-950 underline decoration-blue-200 underline-offset-4 hover:text-blue-700"
                >
                  {source.title} <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
                <p className="mt-1 text-sm leading-6 text-slate-600">{source.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <UnlamExamFormatSample />
        </div>

        <div className="mt-8 grid gap-5 rounded-2xl border border-blue-100 bg-white p-5 sm:p-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-blue-700">Del modelo de examen a tu propio estudio</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">El siguiente paso es practicar con tu material real</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Un examen viejo sirve para conocer posibles tipos de consignas.
              Tu programa y manual vigente determinan qué contenido necesitás preparar hoy.
            </p>
          </div>
          <div>
            <ol className="space-y-3">
              {[
                'Conseguí el material de tu curso en MIeL o el manual entregado por UNLaM.',
                'Seleccioná el PDF en Evaluo antes de registrarte.',
                'Generá materiales de repaso y preguntas sobre los temas de tu cursada.',
                'Practicá, revisá las explicaciones y contrastá tus respuestas escritas con la bibliografía.',
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <TrackedLink
              href={PDF_HREF}
              eventName="cta_click"
              payload={{ location: 'seo_unlam_exam_formats_steps', cta_name: 'practicar_con_manual', destination: PDF_HREF }}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Preparar el ingreso con mi PDF
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
