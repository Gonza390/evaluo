import Link from 'next/link';

type EditorialMethodologyProps = {
  kind: 'study' | 'admissions';
  sourceName?: string;
  sourceUrl?: string;
};

/** Clear editorial ownership, sourcing and limitations; never invent reviewers. */
export function EditorialMethodology({ kind, sourceName, sourceUrl }: EditorialMethodologyProps) {
  return (
    <section aria-labelledby="metodologia-editorial" className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
      <h2 id="metodologia-editorial" className="text-xl font-bold tracking-tight text-slate-950">
        Cómo se preparó esta guía
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Publicación educativa de Evaluo, una plataforma independiente. Los ejemplos y actividades
        son propuestas para practicar y comprender el contenido: no son preguntas oficiales,
        no proceden de una filtración de exámenes y no garantizan resultados.
      </p>
      {kind === 'admissions' ? (
        <p className="mt-3 text-sm leading-7 text-slate-700">
          El método de preparación se organiza a partir de la documentación del organismo
          responsable. Las fechas, los requisitos y los temarios pueden variar entre convocatorias
          e instituciones. Antes de inscribirte o estudiar una edición concreta, verificá la información
          vigente en{' '}
          {sourceName && sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline underline-offset-2">
              {sourceName}
            </a>
          ) : 'la fuente institucional correspondiente'}.
        </p>
      ) : (
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Las actividades se adaptan a la materia y se apoyan en estrategias como recuperar lo
          aprendido sin mirar y revisar errores. La evidencia y los ejemplos no reemplazan la
          bibliografía de la asignatura ni la revisión de un docente. Consultá la{' '}
          <a href="https://www.aft.org/ae/fall2013/dunlosky" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline underline-offset-2">
            revisión divulgativa de técnicas de aprendizaje
          </a>.
        </p>
      )}
      <p className="mt-3 text-xs leading-6 text-slate-600">
        Para conocer las funciones de la plataforma y el tratamiento de tus documentos, consultá{' '}
        <Link href="/privacidad" className="font-semibold text-blue-700 underline underline-offset-2">Privacidad</Link>
        {' '}y{' '}
        <Link href="/terminos" className="font-semibold text-blue-700 underline underline-offset-2">Términos</Link>.
      </p>
    </section>
  );
}
