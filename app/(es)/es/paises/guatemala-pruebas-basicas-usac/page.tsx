import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ExternalLink, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, DEFAULT_OG_IMAGES } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/es/paises/guatemala-pruebas-basicas-usac';
const title = 'Pruebas Básicas USAC 2027: temario, guías y simulador';
const description =
  'Prepárate para las Pruebas Básicas (PCB) del SUN USAC: materias por carrera, temario, guías oficiales, simulador y ejercicios resueltos.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'article',
    title: title + ' | Evaluo',
    description,
    url: toAbsoluteUrl(path),
    locale: 'es_GT',
  },
};

const sources = [
  {
    title: 'SUN USAC: proceso oficial de ingreso',
    url: 'https://sun.usac.edu.gt/index.php/proceso-de-ingreso/',
    description: 'Orden del proceso, materias requeridas por carrera, asignación y resultados',
  },
  {
    title: 'SUN USAC: plataforma de inscripción y resultados (SAAR)',
    url: 'https://sunenlinea.usac.edu.gt/saar/index.html',
    description: 'Registro, asignación y acceso a la constancia según tu convocatoria',
  },
  {
    title: 'SUN USAC: guías y recursos de estudio',
    url: 'https://sun.usac.edu.gt/index.php/herramientas/',
    description: 'Revisa los materiales oficiales y verifica que sean del ciclo vigente',
  },
  {
    title: 'USAC: simulador y apoyo para aspirantes',
    url: 'https://virtual.usac.edu.gt/aspirantes/servicio/',
    description: 'Acceso al simulador institucional y orientación sobre los cursos de apoyo',
  },
] as const;

const subjects = [
  { name: 'Lenguaje', focus: 'Identificar ideas principales e inferencias; justificar respuestas con el texto.' },
  { name: 'Matemática', focus: 'Resolver procedimientos y comprobar resultados, unidades y condiciones del problema.' },
  { name: 'Biología', focus: 'Relacionar estructuras, procesos y funciones a partir del temario oficial.' },
  { name: 'Química', focus: 'Explicar conceptos y resolver cálculos básicos con unidades y supuestos explícitos.' },
  { name: 'Física', focus: 'Interpretar magnitudes, fórmulas, unidades y situaciones de aplicación.' },
] as const;

const practice = [
  {
    subject: 'Lenguaje',
    prompt: 'Texto de ejemplo: «El grupo preparó una feria científica. Como llovió, las actividades previstas para el patio se trasladaron al salón». ¿Qué conclusión está respaldada por el texto?',
    choices: ['A. Se canceló la feria.', 'B. Cambió el lugar de las actividades.', 'C. La feria duró dos días.'],
    answer: 'B. El texto señala que las actividades se trasladaron al salón. No indica que la feria se cancelara ni cuánto duró.',
  },
  {
    subject: 'Matemática',
    prompt: 'Un estudiante respondió correctamente el 40 % de 250 preguntas de práctica. ¿Cuántas respondió correctamente?',
    choices: ['A. 100', 'B. 90', 'C. 125'],
    answer: 'A. 40 % = 0,40. Entonces 250 × 0,40 = 100. Comprueba que el resultado sea menor que 250.',
  },
  {
    subject: 'Matemática · ecuaciones',
    prompt: 'Resuelve la ecuación x / 3 + 5 = 11.',
    choices: ['A. 2', 'B. 18', 'C. 48'],
    answer: 'B. Resta 5 de ambos lados: x / 3 = 6. Multiplica por 3 y obtén x = 18. Verificación: 18 / 3 + 5 = 11.',
  },
  {
    subject: 'Física',
    prompt: 'Un objeto recorre 120 metros en 15 segundos con rapidez media constante. ¿Cuál es su rapidez media?',
    choices: ['A. 8 m/s', 'B. 1.800 m/s', 'C. 0,125 m/s'],
    answer: 'A. Rapidez media = distancia / tiempo = 120 m / 15 s = 8 m/s. En un problema real debes revisar el movimiento descrito.',
  },
  {
    subject: 'Química',
    prompt: 'Una solución contiene 10 g de soluto y tiene una masa total de 100 g. ¿Cuál es el porcentaje en masa de soluto?',
    choices: ['A. 1 %', 'B. 10 %', 'C. 90 %'],
    answer: 'B. Porcentaje en masa = (masa de soluto / masa total de la solución) × 100 = (10 / 100) × 100 = 10 %.',
  },
  {
    subject: 'Biología',
    prompt: '¿Qué orgánulo participa especialmente en la producción de ATP mediante la respiración celular aeróbica en células eucariotas?',
    choices: ['A. Mitocondria', 'B. Núcleo', 'C. Aparato de Golgi'],
    answer: 'A. La mitocondria participa en procesos centrales de la respiración celular aeróbica. El ATP también puede producirse por otras vías: evita interpretar la respuesta como una afirmación exclusiva.',
  },
] as const;

const questions = [
  {
    question: '¿Las Pruebas de Conocimientos Básicos de la USAC son gratuitas?',
    answer: 'Sí. El Sistema de Ubicación y Nivelación indica que las PCB no tienen costo. Verifica siempre las condiciones de otros trámites o programas de preparación directamente con la institución.',
  },
  {
    question: '¿Todas las carreras exigen las cinco materias?',
    answer: 'No. Las materias requeridas dependen de la carrera y de la unidad académica. Consulta el cuadro oficial del ciclo al que te postulás antes de preparar o asignarte a una prueba.',
  },
  {
    question: '¿Dónde me inscribo y consulto los resultados?',
    answer: 'El SUN informa que la asignación y la consulta de resultados se realizan a través de los sistemas oficiales enlazados desde su sitio. Conserva la constancia y comprueba fecha y modalidad de evaluación.',
  },
  {
    question: '¿Estos ejercicios son preguntas reales de la USAC?',
    answer: 'No. Son seis ejemplos educativos originales de Evaluo. No reproducen reactivos institucionales ni permiten predecir resultados en el examen oficial.',
  },
  {
    question: '¿Qué sucede después de aprobar las PCB requeridas?',
    answer: 'Según la carrera, el siguiente paso suele incluir las pruebas específicas de su unidad académica y posteriormente los trámites de inscripción. Consulta las instrucciones oficiales de esa facultad o escuela.',
  },
] as const;

export default function GuatemalaPruebasBasicasUSACPage() {
  return (
    <div lang="es" className="min-h-screen bg-white text-[#0F1B3D]">
      <JsonLd data={[
        buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Guías de estudio', path: '/es/guias' },
          { name: 'Pruebas Básicas USAC', path },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          mainEntityOfPage: toAbsoluteUrl(path),
          datePublished: '2026-10-29',
          dateModified: '2026-11-11',
          inLanguage: 'es-GT',
          author: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
          publisher: { '@type': 'Organization', name: 'Evaluo', url: toAbsoluteUrl('/') },
          isAccessibleForFree: true,
        },
        buildFaqJsonLd(questions.map((item) => ({ question: item.question, answer: item.answer }))),
      ]} />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader variant="landing" trackingLocation="usac_pcb_guide_header" />
      </div>

      <main>
        <header className="border-b border-[#E7EBF4] bg-[#F5F7FB]">
          <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-8 sm:py-16">
            <Link href="/es/guias" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">
              Guías de estudio <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Guatemala · Ingreso USAC · Ciclo 2027</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Pruebas Básicas USAC: qué estudiar y cómo prepararte
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#42506A] sm:text-lg">
              Antes de estudiar todo el temario, identifica qué Pruebas Básicas solicita realmente tu carrera.
              Esta guía te explica el recorrido oficial de las PCB, cómo usar los materiales de la USAC
              y cómo practicar con ejemplos resueltos sin confundirlos con el examen institucional.
            </p>
            <p className="mt-4 text-sm text-[#7F8AA3]">Información revisada: 11 de noviembre de 2026 · Recurso independiente, no oficial de la USAC</p>
            <a href="https://sun.usac.edu.gt/index.php/proceso-de-ingreso/" target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#456DBD] px-5 text-sm font-bold text-white hover:bg-[#3a5ca8]">
              Consultar ingreso oficial de la USAC <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#cta" className="mt-6 ml-0 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#456DBD] px-5 text-sm font-bold text-[#456DBD] hover:bg-white sm:ml-3">
              Practicar con mis guías <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-8">
          <section aria-labelledby="etapas" className="max-w-3xl">
            <h2 id="etapas" className="text-2xl font-bold">1. ¿Cómo es el proceso de ingreso a la USAC?</h2>
            <p className="mt-3 leading-8 text-[#42506A]">
              El Sistema de Ubicación y Nivelación (SUN) describe un proceso por etapas. Primero verifica
              tu orientación vocacional y los requisitos para la carrera; luego asígnate a las Pruebas
              de Conocimientos Básicos (PCB) que correspondan. Si obtienes resultados satisfactorios,
              consulta las pruebas específicas de tu unidad académica y los requisitos de inscripción.
              Las fechas, modalidades y requisitos pueden cambiar entre convocatorias.
            </p>
            <ol className="mt-5 space-y-3">
              {[
                ['Orientación vocacional', 'Consulta la orientación y obtén tu documentación o número correspondiente.'],
                ['Pruebas de Conocimientos Básicos', 'Confirma las materias exigidas por tu carrera y realiza la asignación oficial.'],
                ['Pruebas específicas', 'Si corresponden a tu carrera, revisa el procedimiento de la facultad o escuela.'],
                ['Trámite de inscripción', 'Sigue las instrucciones del Departamento de Registro y Estadística de la USAC.'],
              ].map(([heading, detail], index) => (
                <li key={heading} className="flex gap-4 border-b border-[#E7EBF4] py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-sm font-bold text-blue-700">{index + 1}</span>
                  <div><h3 className="font-bold">{heading}</h3><p className="mt-1 text-sm leading-6 text-[#42506A]">{detail}</p></div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-7 text-[#42506A]">
              Las PCB son gratuitas según el SUN. Si no apruebas alguna de las requeridas, el sitio oficial
              explica cómo consultar otras oportunidades; no confundas la inscripción al examen con cursos de apoyo opcionales.
            </p>
          </section>

          <section aria-labelledby="materias" className="mt-12">
            <h2 id="materias" className="text-2xl font-bold">2. ¿Qué materias entran en las PCB?</h2>
            <p className="mt-3 max-w-3xl leading-8 text-[#42506A]">
              Las cinco áreas de conocimientos básicos que presenta el SUN son Lenguaje, Matemática, Biología,
              Química y Física. <strong>No significa que debas rendir las cinco:</strong> confirma el cuadro
              actualizado para tu carrera, sede y ciclo.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {subjects.map((subject) => (
                <div key={subject.name} className="rounded-xl border border-[#E7EBF4] p-5">
                  <div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-blue-700" aria-hidden="true" /><h3 className="font-bold">{subject.name}</h3></div>
                  <p className="mt-2 text-sm leading-7 text-[#42506A]">{subject.focus}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="fuentes" className="mt-12">
            <h2 id="fuentes" className="text-2xl font-bold">3. Guías oficiales, inscripción y simulador</h2>
            <p className="mt-3 max-w-3xl leading-8 text-[#42506A]">
              Empieza por las páginas oficiales. Usa el simulador de la USAC cuando esté disponible y tu
              convocatoria permita acceder; no presentamos ejercicios de Evaluo como reactivos de la universidad.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"
                  className="group rounded-xl border border-[#E7EBF4] p-5 hover:border-blue-400">
                  <span className="flex items-start justify-between gap-3 text-sm font-bold text-blue-700">
                    {source.title}<ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <span className="mt-2 block text-sm leading-7 text-[#42506A]">{source.description}</span>
                </a>
              ))}
            </div>
          </section>

          <section aria-labelledby="plan" className="mt-12 max-w-3xl">
            <h2 id="plan" className="text-2xl font-bold">4. Un plan de repaso adaptable de siete días</h2>
            <p className="mt-3 leading-8 text-[#42506A]">
              Este ejemplo supone que ya conoces las materias asignadas y tienes acceso al temario.
              Si necesitas preparar varias materias desde cero, una semana puede no ser suficiente.
            </p>
            <div className="mt-5 space-y-3">
              {[
                ['Día 1', 'Lee el temario de tus PCB y resuelve preguntas de diagnóstico. Identifica temas débiles.'],
                ['Días 2 y 3', 'Alterna comprensión de conceptos y ejercicios por tema; explica cada respuesta.'],
                ['Día 4', 'Reintenta preguntas anteriores sin consultar el material y trabaja los errores.'],
                ['Día 5', 'Mezcla temas y resuelve problemas nuevos; comprueba unidades y lectura de consignas.'],
                ['Día 6', 'Utiliza el simulador oficial si está disponible; registra los temas pendientes.'],
                ['Día 7', 'Repasa fallos relevantes, relee indicaciones oficiales y prepara tu documentación.'],
              ].map(([day, instruction]) => (
                <div key={day} className="flex gap-4 border-b border-[#E7EBF4] pb-3">
                  <span className="w-20 shrink-0 text-sm font-bold text-blue-700">{day}</span>
                  <p className="text-sm leading-7 text-[#42506A]">{instruction}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="practica" className="mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Ejercicios originales de Evaluo</p>
            <h2 id="practica" className="mt-2 text-2xl font-bold">5. Seis preguntas para practicar y corregirte</h2>
            <p className="mt-3 max-w-3xl leading-8 text-[#42506A]">
              Estos ejemplos introductorios muestran cómo responder, justificar y corregir errores.
              <strong> No son preguntas oficiales de la USAC ni replican necesariamente la dificultad o el formato de las PCB.</strong>
              Prueba primero sin mirar la explicación.
            </p>
            <div className="mt-6 space-y-4">
              {practice.map((item, index) => (
                <div key={item.prompt} className="rounded-xl border border-[#E7EBF4] p-5 sm:p-6">
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-700">{index + 1}. {item.subject}</span>
                  <h3 className="mt-2 text-base font-semibold leading-7">{item.prompt}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#42506A]">
                    {item.choices.map((choice) => <li key={choice}>{choice}</li>)}
                  </ul>
                  <details className="mt-4 border-t border-[#E7EBF4] pt-3">
                    <summary className="cursor-pointer text-sm font-bold text-blue-700">Mostrar respuesta y explicación</summary>
                    <p className="mt-3 text-sm leading-7 text-[#42506A]">{item.answer}</p>
                  </details>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="errores" className="mt-12 max-w-3xl">
            <h2 id="errores" className="text-2xl font-bold">6. Cómo mejorar después de una práctica</h2>
            <div className="mt-5 space-y-4">
              {[
                ['Separa las materias', 'Anota el tema exacto: comprensión lectora, porcentajes, movimiento, células o concentración.'],
                ['Explica el error', 'No basta con saber la opción correcta. Revisa por qué elegiste otra y qué evidencia faltaba.'],
                ['Vuelve al temario', 'Contrasta la explicación con los materiales oficiales y las guías de tu convocatoria.'],
                ['Reintenta después', 'Responde una variación sin mirar la solución para comprobar que aprendiste el procedimiento.'],
              ].map(([heading, detail]) => (
                <div key={heading} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                  <div><h3 className="font-bold">{heading}</h3><p className="mt-1 text-sm leading-7 text-[#42506A]">{detail}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="faq" className="mt-12 max-w-3xl">
            <h2 id="faq" className="text-2xl font-bold">Preguntas frecuentes sobre las PCB</h2>
            <div className="mt-5 space-y-5">
              {questions.map((item) => (
                <div key={item.question} className="border-b border-[#E7EBF4] pb-4">
                  <h3 className="font-bold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#42506A]">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-2xl bg-[#EEF2FF] p-6 sm:p-8" aria-labelledby="cta">
            <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-700" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Preparación con tus propios apuntes</p></div>
            <h2 id="cta" className="mt-3 text-2xl font-bold">Convierte tus guías en preguntas de práctica</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#42506A]">
              Evaluo puede ayudarte a estudiar PDFs o documentos Word con preguntas por tema y revisión de errores.
              Empieza gratis con tu material; corrobora las respuestas generadas con las guías oficiales de la USAC.
              Evaluo es independiente y no está afiliado ni respaldado por la universidad.
            </p>
            <div className="mt-6 max-w-2xl">
              <PdfFirstLandingUploader trackingLocation="usac_pcb_guide_cta" sourceKey="usac-pcb-guide" locale="neutral" market="gt" />
            </div>
          </section>
        </div>
      </main>
      <FooterHome variant="full" register="neutral" />
    </div>
  );
}
