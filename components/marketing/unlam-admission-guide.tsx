import { ArrowRight, BookOpenCheck, ExternalLink, GraduationCap, ShieldCheck } from 'lucide-react';

const OFFICIAL = 'https://www.unlam.edu.ar/curso-de-ingreso/';

export function UnlamAdmissionGuide() {
  return (
    <section id="aprobar-ingreso-unlam" aria-labelledby="requisitos-ingreso-title" className="scroll-mt-8 border-b border-slate-200 bg-white py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
          <GraduationCap className="h-4 w-4" aria-hidden="true" /> Requisitos publicados por UNLaM
        </p>
        <h2 id="requisitos-ingreso-title" className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          ¿Cuántos puntos necesitás para aprobar el Curso de Ingreso UNLaM?
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Depende del formato de tu carrera. La nota final es <strong>ponderada</strong>: las materias no tienen todas el mismo peso.
          Estos ejemplos están tomados del esquema de cálculo publicado por la universidad, no son una calculadora de admisión
          ni sustituyen los requisitos de tu situación particular.
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 sm:p-6">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">3 materias · instancia regular o intensiva</span>
            <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">70 <span className="text-lg font-semibold text-slate-500">/ 100 puntos</span></p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Se exige un mínimo de 70 puntos ponderados y <strong>no tener aplazos ni ausentes</strong>.
              El cálculo utiliza pesos 4, 3 y 3 según materia específica, complementaria y transversal.
            </p>
            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Ejemplo oficial</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Específica 7 × 4 = 28, complementaria 8 × 3 = 24, transversal 6 × 3 = 18.</p>
              <p className="mt-2 text-sm font-black text-slate-950">Total: 70 puntos.</p>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">4 materias · solo instancia regular</span>
            <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">105 <span className="text-lg font-semibold text-slate-500">/ 150 puntos</span></p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              En Medicina, Arquitectura y Odontología primero necesitás <strong>55 puntos o más</strong>
              en el tramo de tres materias, todas con nota igual o mayor a 4 y sin ausentes.
              Después se cursa la cuarta materia y el total mínimo es 105 puntos.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Ejemplo oficial</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Primer tramo: 7 × 4 + 4 × 3 + 5 × 3 = 55.</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Cuarta materia: 10 × 5 = 50.</p>
              <p className="mt-2 text-sm font-black text-slate-950">Total: 105 puntos.</p>
            </div>
          </article>
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-blue-100 bg-[#f8faff] p-4 sm:flex-row sm:items-start">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <p className="text-sm leading-7 text-slate-700">
            <strong>Recuperatorios y situaciones particulares:</strong> dependen de las notas y el tramo alcanzado.
            Por ejemplo, en el esquema de cuatro materias, UNLaM indica que un aplazo o ausente en las tres primeras
            implica reinscribirse el año siguiente. Verificá la normativa oficial y tu situación individual;
            no asumas que cualquier materia se puede recuperar.
            {' '}
            <a href={OFFICIAL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-blue-700 underline underline-offset-4">
              Consultar criterios oficiales <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </p>
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          Después de revisar los requisitos, elegí tu carrera y practicá con el contenido del manual.
          <a className="underline underline-offset-4" href="#practica-ingreso">Ir a la práctica gratuita <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></a>
        </p>
      </div>
    </section>
  );
}
