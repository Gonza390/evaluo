import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';
export const metadata=studyMetadata('/recursos/registro-de-errores','Plantilla gratuita de registro de errores para estudiar','Tabla modelo de revisión de errores con ejemplo y preguntas para utilizar después de practicar para un examen.');
const columns=['Fecha','Tema y pregunta','Por qué fallé','Corrección verificada','Nuevo intento'];
export default function Page(){
 return <StudentArticleLayout kicker="Plantilla de repaso" title="Registro de errores: qué anotar después de practicar"
 description="Una plantilla sencilla para dejar de repetir los mismos errores. Podés copiar la tabla en tu cuaderno o imprimirla desde el navegador." source="seo-recurso-errores">
  <section className="space-y-5">
   <h2 className="text-2xl font-bold">Un ejemplo antes de completar tu tabla</h2>
   <p className="text-sm leading-7 text-slate-700">Supongamos que confundís un movimiento a lo largo de la curva de demanda con un desplazamiento. No basta con anotar “me equivoqué”: escribí qué variable cambió y qué supuesto pasaste por alto.</p>
   <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[680px] border-collapse text-left text-sm">
    <thead className="bg-slate-50"><tr>{columns.map(x=><th scope="col" key={x} className="border-b border-slate-200 p-3 font-bold">{x}</th>)}</tr></thead>
    <tbody><tr className="align-top text-slate-700"><td className="border-r border-slate-100 p-3">Ejemplo</td><td className="border-r border-slate-100 p-3">Economía: sube el precio del bien</td><td className="border-r border-slate-100 p-3">Confundí precio propio con cambio de preferencias</td><td className="border-r border-slate-100 p-3">Si solo cambia el precio propio, hay movimiento sobre la curva</td><td className="p-3">Resolver otra pregunta cambiando el ingreso, no el precio</td></tr>
    {Array.from({length:4},(_,i)=><tr key={i}>{columns.map((x,j)=><td key={x} className={'h-20 border-t border-slate-200 p-3 '+(j<columns.length-1?'border-r border-slate-100':'')}>&nbsp;</td>)}</tr>)}
    </tbody></table></div>
   <h2 className="text-xl font-bold">Cómo usarla para aprender</h2>
   <ol className="list-decimal space-y-3 pl-6 text-sm leading-7 text-slate-700">
    <li>Registrá el error inmediatamente después de la práctica.</li>
    <li>Distinguí si fallaste por concepto, lectura, cálculo o procedimiento.</li>
    <li>Comprobá la corrección con una fuente confiable de la materia.</li>
    <li>En otra sesión, resolvé un ejercicio distinto que compruebe el mismo conocimiento.</li>
   </ol>
   <p className="rounded-xl bg-blue-50 p-4 text-sm leading-7 text-slate-700">Para imprimir la tabla, utilizá la opción Imprimir de tu navegador. La plantilla no guarda tus respuestas ni las envía a ningún servidor.</p>
  </section>
 </StudentArticleLayout>;
}
