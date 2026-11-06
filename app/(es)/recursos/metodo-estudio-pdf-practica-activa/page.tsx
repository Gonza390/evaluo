import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/recursos/metodo-estudio-pdf-practica-activa';
const title = 'De leer un PDF a practicar: método de estudio activo con ejemplos';
const description = 'Guía práctica para convertir un PDF en aprendizaje activo: sesión de 40 minutos, preguntas de recuperación, corrección de errores y fuentes científicas.';

export const metadata = studyMetadata(path, title, description);

const sesion = [
  ['0–8 min', 'Comprender', 'Leé una sección corta y explicá dos ideas clave con tus propias palabras.', 'Dos conceptos sin copiar todo el párrafo.'],
  ['8–20 min', 'Recuperar', 'Cerrá el PDF. Respondé una definición, una comparación y un caso.', 'Respuestas propias, incluso incompletas.'],
  ['20–30 min', 'Corregir', 'Contrastá el razonamiento con el material y clasificá el error.', 'Corrección con apartado de respaldo.'],
  ['30–40 min', 'Variar y organizar', 'Respondé otra pregunta cambiando los datos y prepará el siguiente repaso.', 'Un nuevo intento y un próximo paso.'],
] as const;

const checks = [
  'Puedo explicar el tema sin mirar el resumen.',
  'Respondí al menos una pregunta distinta de las definiciones del texto.',
  'Sé dónde se encuentra el fundamento de la corrección.',
  'Registré lo que todavía no puedo explicar o resolver.',
  'Tengo definido cuándo y con qué ejercicio volveré al tema.',
];

export default function MetodoEstudioPDF() {
  return <>
    <JsonLd data={[
      buildBreadcrumbJsonLd([{name:'Inicio',path:'/'},{name:'Recursos',path:'/recursos'},{name:'Estudio activo con PDF',path}]),
      {
        '@context':'https://schema.org','@type':'Article','@id':toAbsoluteUrl(path+'#article'),
        url:toAbsoluteUrl(path),headline:title,description,inLanguage:'es',
        datePublished:'2026-11-06',dateModified:'2026-11-06',
        author:{'@type':'Organization',name:'Equipo Evaluo',url:toAbsoluteUrl('/sobre-evaluo')},
        publisher:{'@id':toAbsoluteUrl('/#organization')},
        citation:[
          'https://doi.org/10.1177/1529100612453266',
          'https://doi.org/10.1126/science.1152408',
          'https://doi.org/10.1037/a0019902',
        ],
      },
    ]} />
    <StudentArticleLayout kicker="Guía original · Práctica de recuperación" title={title}
      description="Generar un resumen no significa recordar lo estudiado. Convertí tus apuntes en preguntas, compará respuestas y decidí qué tema reforzar después."
      source="geo-metodo-estudio-pdf">
      <article className="space-y-10 text-sm leading-7 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Respuesta directa: ¿cómo estudiar activamente un PDF?</h2>
          <p>Primero leé una parte para comprenderla. Después, <strong>cerrá el archivo e intentá recuperar las ideas sin mirarlas</strong>. Respondé preguntas, verificá con el documento qué falló y practicá de nuevo las partes difíciles en otra sesión.</p>
          <p>No se trata de dejar de leer. La lectura es necesaria para comprender; la recuperación ayuda a comprobar cuánto podés explicar o aplicar cuando el material no está abierto.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Ejemplo original: sesión de estudio de 40 minutos</h2>
          <p>Este reparto de minutos es <strong>un ejemplo organizativo creado por Evaluo</strong>, no una duración óptima demostrada por estudios. Ajustalo según la complejidad y tu tiempo disponible.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-slate-50"><tr>{['Momento','Actividad','Qué hacer','Resultado verificable'].map(x=><th key={x} scope="col" className="p-3 font-bold">{x}</th>)}</tr></thead>
              <tbody>{sesion.map(([min,tarea,accion,resultado])=><tr key={min} className="border-t border-slate-200 align-top"><th scope="row" className="p-3 font-semibold text-blue-700">{min}</th><td className="p-3 font-semibold text-slate-950">{tarea}</td><td className="p-3">{accion}</td><td className="p-3">{resultado}</td></tr>)}</tbody>
            </table>
          </div>
          <p>Una sesión puede requerir más de 40 minutos si el tema es difícil. Importa que haya oportunidades reales de responder y corregir, no cumplir el reloj exactamente.</p>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Ejemplo trabajado: demanda y precio</h2>
          <p>Imaginá un apunte introductorio que explica: «Cuando cambia solo el precio propio de un bien, manteniendo los demás determinantes constantes, cambia la cantidad demandada sobre la misma curva». El fragmento es original de esta guía, no proviene de una cátedra.</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">1. Lectura y comprensión</h3>
            <p className="mt-2">Intentá explicar qué es la demanda y por qué el precio propio provoca un movimiento sobre la curva en el modelo introductorio.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">2. Recuperación sin mirar</h3>
            <p className="mt-2">«Si solo sube el precio de un bien, ¿se desplaza la curva de demanda o cambia la cantidad demandada sobre esa curva?» Escribí la respuesta antes de consultar el PDF.</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <h3 className="font-bold text-slate-950">3. Corrección con explicación</h3>
            <p className="mt-2">En el supuesto descrito, se produce un movimiento sobre la curva. Si respondiste «desplazamiento», registrá la diferencia entre un cambio de precio propio y un cambio de otros determinantes.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">4. Una variación para comprobar transferencia</h3>
            <p className="mt-2">«¿Qué podría pasar con la demanda si aumenta el ingreso de los consumidores de un bien normal, manteniendo lo demás constante?» En este caso, la curva puede desplazarse. Justificá por qué es distinto del ejemplo anterior.</p>
          </div>
          <p>Esta variación obliga a usar la regla en un contexto diferente. Repetir una pregunta ya memorizada sería una comprobación más limitada.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Cómo adaptar el procedimiento a cada materia</h2>
          <p><strong>Matemáticas y estadísticas:</strong> resolvé problemas con nuevos datos y verificá cada operación. Las preguntas de opción múltiple no reemplazan el procedimiento.</p>
          <p><strong>Derecho e historia:</strong> compará conceptos, explicá causas y analizá pequeños casos. Las normas, fechas y afirmaciones deben contrastarse con fuentes vigentes y bibliografía de la materia.</p>
          <p><strong>Ciencias naturales:</strong> alterná recordar partes, explicar relaciones y usar ejemplos. Una imagen o un gráfico verificable puede aportar información que el resumen textual no contiene.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Repaso distribuido: volver al tema sin releer todo</h2>
          <p>Una vez terminada la primera sesión, podés volver a recuperar lo aprendido en días posteriores. La práctica distribuida cuenta con apoyo en la literatura científica, pero <strong>no existe un intervalo fijo que funcione igual para todas las personas y exámenes</strong>.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[580px] border-collapse text-left text-sm">
              <thead className="bg-slate-50"><tr><th scope="col" className="p-3">Momento ilustrativo</th><th scope="col" className="p-3">Qué revisar</th></tr></thead>
              <tbody>{[
                ['Primera sesión','Comprender y recuperar un tema; registrar dudas reales.'],
                ['Próxima sesión','Responder sin mirar y corregir con el material.'],
                ['Días posteriores','Resolver un caso nuevo que mezcle conceptos.'],
                ['Antes del examen','Revisar errores pendientes con preguntas de aplicación.'],
              ].map(([momento,tarea])=><tr key={momento} className="border-t border-slate-200"><th scope="row" className="p-3 font-semibold text-slate-950">{momento}</th><td className="p-3">{tarea}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Lista de comprobación para cerrar una sesión</h2>
          <ul className="space-y-2">{checks.map(x=><li key={x} className="flex gap-3"><span aria-hidden="true" className="font-bold text-blue-700">□</span><span>{x}</span></li>)}</ul>
          <p>Antes de confiar en ejercicios producidos por una IA, usá el <Link href="/recursos/verificar-preguntas-ia" className="font-semibold text-blue-700 underline">protocolo para verificar preguntas</Link>. Para registrar un error, podés utilizar la <Link href="/recursos/registro-de-errores" className="font-semibold text-blue-700 underline">plantilla de registro de errores</Link>.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Qué respalda la investigación y qué no</h2>
          <p>Dunlosky y colaboradores (2013) revisaron técnicas de estudio e identificaron la práctica de pruebas y el estudio distribuido como estrategias de alta utilidad general. Karpicke y Roediger (2008) demostraron beneficios de la recuperación para la retención demorada. Butler (2010) estudió efectos de pruebas repetidas sobre retención y transferencia.</p>
          <p><strong>Estos trabajos no evaluaron Evaluo ni establecen que 40 minutos sea la duración ideal.</strong> El protocolo, los tiempos y las preguntas de esta página son una adaptación editorial con ejemplos originales, no un experimento propio.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><a href="https://doi.org/10.1177/1529100612453266" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">Dunlosky et al. (2013), <em>Improving Students’ Learning With Effective Learning Techniques</em></a>.</li>
            <li><a href="https://doi.org/10.1126/science.1152408" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">Karpicke y Roediger (2008), <em>The Critical Importance of Retrieval for Learning</em></a>.</li>
            <li><a href="https://doi.org/10.1037/a0019902" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">Butler (2010), <em>Repeated Testing Produces Superior Transfer of Learning Relative to Repeated Studying</em></a>.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Equipo Evaluo · 6 de noviembre de 2026. Ejemplos didácticos propios, no exámenes oficiales.</p>
        </section>
      </article>
    </StudentArticleLayout>
  </>;
}
