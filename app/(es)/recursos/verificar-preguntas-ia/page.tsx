import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/recursos/verificar-preguntas-ia';
const title = 'Cómo verificar si las preguntas de IA son correctas';
const description = 'Guía de Evaluo para revisar preguntas de IA: siete controles, ejemplos de errores, una rúbrica práctica y referencias académicas.';
export const metadata = studyMetadata(path, title, description);

const controles = [
  ['Fidelidad a la fuente', '¿La respuesta se puede justificar con el material de estudio?', 'Ubicá el apartado o procedimiento original. Si no aparece, no la des por correcta.'],
  ['Enunciado claro', '¿Incluye las condiciones necesarias y evita afirmaciones absolutas?', 'Agregá supuestos y eliminá el «siempre» cuando existan excepciones.'],
  ['Respuesta verificable', '¿La respuesta marcada coincide con lo que realmente pregunta?', 'Resolvé sin mirar la clave y contrastá cada paso.'],
  ['Alternativas válidas', '¿Existe una sola respuesta defendible y los distractores son razonables?', 'Revisá que no haya dos opciones correctas.'],
  ['Explicación útil', '¿Explica el razonamiento y ayuda a corregir el error?', 'Agregá la regla, comparación o procedimiento pertinente.'],
  ['Aplicación', '¿Hay situaciones nuevas además de definiciones para memorizar?', 'Variá los datos o pedí comparar dos casos.'],
  ['Cobertura', '¿El conjunto aborda los temas principales sin repetir siempre lo mismo?', 'Contrastá las preguntas con el índice del documento.'],
] as const;

export default function VerificarPreguntasIA() {
  return <>
    <JsonLd data={[
      buildBreadcrumbJsonLd([{ name: 'Inicio', path: '/' }, { name: 'Recursos', path: '/recursos' }, { name: 'Verificar preguntas de IA', path }]),
      {
        '@context': 'https://schema.org', '@type': 'Article', '@id': toAbsoluteUrl(path + '#article'),
        url: toAbsoluteUrl(path), headline: title, description, inLanguage: 'es',
        datePublished: '2026-11-06', dateModified: '2026-11-06',
        author: { '@type': 'Organization', name: 'Equipo Evaluo', url: toAbsoluteUrl('/sobre-evaluo') },
        publisher: { '@id': toAbsoluteUrl('/#organization') },
        citation: ['https://doi.org/10.1177/1529100612453266', 'https://doi.org/10.1037/a0019902'],
      },
    ]} />
    <StudentArticleLayout kicker="Guía original · Calidad de preguntas" title={title}
      description="Una pregunta con la respuesta marcada no siempre es buena. Aprendé a identificar preguntas incorrectas, ambiguas o poco útiles antes de estudiar con ellas."
      source="geo-verificar-preguntas">
      <article className="space-y-10 text-sm leading-7 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Respuesta breve: ¿cómo verificar una pregunta de IA?</h2>
          <p>Una pregunta de práctica es más confiable cuando <strong>la respuesta está fundamentada en el documento original</strong>, el enunciado es inequívoco, la explicación permite reconstruir el razonamiento y las alternativas no incluyen una segunda respuesta válida.</p>
          <p>Para revisar un conjunto de ejercicios, Evaluo propone siete comprobaciones. Son <strong>criterios editoriales de Evaluo</strong>, no una escala psicométrica validada ni una garantía de ausencia de errores.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Protocolo Evaluo: siete comprobaciones</h2>
          <ol className="mt-5 space-y-4">
            {controles.map(([titulo, pregunta, accion], i) => (
              <li key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Control {i + 1}</p>
                <h3 className="mt-1 text-base font-bold text-slate-950">{titulo}</h3>
                <p className="mt-2"><strong>Qué revisar:</strong> {pregunta}</p>
                <p className="mt-1"><strong>Qué hacer:</strong> {accion}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Ejemplo trabajado: economía introductoria</h2>
          <p>Partimos de este <strong>fragmento didáctico original</strong>, no de un apunte universitario: «Si solo cambia el precio del propio bien y se mantienen constantes los otros determinantes, cambia la cantidad demandada sobre la misma curva. Un cambio del ingreso puede desplazar la curva de demanda».</p>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Pregunta defectuosa</p>
            <p className="mt-2 font-semibold text-slate-950">«Si sube el precio, ¿la demanda siempre baja?»</p>
            <p className="mt-2">Confunde demanda con cantidad demandada, omite supuestos y usa «siempre». La formulación no permite comprobar bien la distinción.</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Pregunta corregida</p>
            <p className="mt-2 font-semibold text-slate-950">«Si aumenta únicamente el precio propio de un bien, manteniendo los demás determinantes constantes, ¿qué ocurre en su curva de demanda?»</p>
            <ol className="mt-3 list-[upper-alpha] space-y-1 pl-5">
              <li>Se desplaza necesariamente hacia la derecha.</li>
              <li>Se produce un movimiento sobre la misma curva.</li>
              <li>La demanda desaparece por completo.</li>
            </ol>
            <p className="mt-3"><strong>Respuesta: B.</strong> En el modelo introductorio, el cambio del precio propio provoca un movimiento a lo largo de la curva. Para desplazarla tiene que cambiar otro determinante.</p>
          </div>
          <p>Incluso una pregunta mejor redactada debe contrastarse con los conceptos y supuestos enseñados en la materia.</p>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Una rúbrica orientativa de 0 a 14</h2>
          <p>Para cada control asigná <strong>0 si no cumple, 1 si requiere revisión y 2 si cumple</strong>. Podés sumar los resultados, pero no es un indicador estadístico de fiabilidad. Una clave errónea obliga a revisar o descartar la pregunta aunque su puntaje total sea alto.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead className="bg-slate-50"><tr><th scope="col" className="p-3 font-bold">Puntaje</th><th scope="col" className="p-3 font-bold">Qué indica</th></tr></thead>
              <tbody>{[
                ['0', 'Carece de evidencia, tiene error o es ambigua; rehacer o descartar.'],
                ['1', 'Puede servir tras corregir condiciones, opciones o explicación.'],
                ['2', 'El criterio se satisface y hay fundamento verificable.'],
              ].map(([score, note]) => <tr key={score} className="border-t border-slate-200"><th scope="row" className="p-3 font-semibold">{score}</th><td className="p-3">{note}</td></tr>)}</tbody>
            </table>
          </div>
          <p><strong>Ficha para copiar:</strong> tema, apartado del documento, pregunta, opciones, respuesta, evidencia, explicación, siete controles y decisión final (usar / corregir / descartar).</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Cómo cambia la revisión según la materia</h2>
          <p><strong>Matemática:</strong> comprobá procedimientos, signos y unidades. Si la ecuación es <code>x + 3 = 8</code>, la resolución debe justificar <code>x = 5</code>, no limitarse a marcar una opción.</p>
          <p><strong>Materias teóricas:</strong> incorporá comparaciones y casos, además de definiciones. Pedir que se explique un desplazamiento de demanda exige algo distinto a repetir la definición de memoria.</p>
          <p><strong>Normativa o salud:</strong> cualquier afirmación que dependa de normas vigentes o evidencia clínica debe contrastarse con bibliografía autorizada; no basta una respuesta generada por IA.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Señales de alerta</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>La IA cita una página, una ley o un autor inexistente.</li>
            <li>Dos opciones parecen correctas porque falta una condición.</li>
            <li>La explicación repite la clave sin justificarla.</li>
            <li>Promete que esa pregunta va a aparecer en el examen.</li>
            <li>Solo repite definiciones y no incluye aplicaciones.</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Fundamento científico y limitaciones</h2>
          <p>Dunlosky y colaboradores (2013) destacaron la práctica de pruebas y el estudio distribuido entre técnicas de utilidad amplia. Butler (2010) encontró beneficios de las pruebas repetidas para la retención y la transferencia en los experimentos estudiados.</p>
          <p><strong>Estos estudios no validaron esta rúbrica, no evaluaron Evaluo y no prueban que cualquier cuestionario creado con IA enseñe mejor.</strong> Este protocolo es una herramienta de revisión editorial.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><a className="font-semibold text-blue-700 underline" href="https://doi.org/10.1177/1529100612453266" target="_blank" rel="noopener noreferrer">Dunlosky et al. (2013), <em>Improving Students’ Learning With Effective Learning Techniques</em></a>.</li>
            <li><a className="font-semibold text-blue-700 underline" href="https://doi.org/10.1037/a0019902" target="_blank" rel="noopener noreferrer">Butler (2010), <em>Repeated Testing Produces Superior Transfer of Learning Relative to Repeated Studying</em></a>.</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Del control a la práctica</h2>
          <p>Una vez revisadas las preguntas, seguí la <Link href="/recursos/metodo-estudio-pdf-practica-activa" className="font-semibold text-blue-700 underline">guía de práctica activa con PDF</Link> y utilizá la <Link href="/recursos/registro-de-errores" className="font-semibold text-blue-700 underline">plantilla de registro de errores</Link> para preparar el próximo intento.</p>
          <p className="text-xs text-slate-500">Equipo Evaluo · 6 de noviembre de 2026. Ejemplos originales, no preguntas de exámenes oficiales.</p>
        </section>
      </article>
    </StudentArticleLayout>
  </>;
}
