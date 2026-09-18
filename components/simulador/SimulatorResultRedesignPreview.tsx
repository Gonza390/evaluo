import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

type Props = {
  improved?: boolean;
};

const PREVIEW_MATERIA_ID = 'a3f01be6-2087-493f-b436-83bdd39eed8a';

export function SimulatorResultRedesignPreview({ improved = false }: Props) {
  const correct = 20;
  const total = 30;
  const wrong = total - correct;
  const percentage = Math.round((correct / total) * 100);
  const grade = ((correct / total) * 10).toFixed(1);
  const errorsHref = `/simulador/errores/${PREVIEW_MATERIA_ID}?parcial=1`;
  const uploadHref = `/dashboard/materiales?openUpload=1&materiaId=${PREVIEW_MATERIA_ID}`;

  const previewStateHref = improved
    ? '/preview/resultado-simulador'
    : '/preview/resultado-simulador?estado=mejora';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#5D65F6]">Resultados del simulador</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Derecho Procesal Público · Parcial 1
            </h1>
          </div>
          <Link
            href={previewStateHref}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            {improved ? 'Ver primer intento' : 'Ver caso con mejora'}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.09)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-slate-200 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Tu nota
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-[4.7rem] leading-none font-bold tracking-[-0.08em] text-[#0F1B3D] sm:text-[5.5rem]">
                  {grade}
                </span>
                <span className="pb-2 text-lg font-semibold text-slate-400">/ 10</span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  <strong className="text-slate-950">{correct} de {total}</strong> correctas
                </span>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Tenés una buena base. Antes de hacer otro modelo, conviene recuperar los {wrong}{' '}
                puntos que todavía podés reforzar.
              </p>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Tu evolución
                </p>
                {improved ? (
                  <div className="mt-3 flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-950 sm:text-base">
                        Mejoraste 12% vs. tu intento anterior
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Tu nota anterior fue 5,9.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#5D65F6]" />
                    <div>
                      <p className="text-sm font-bold text-slate-950 sm:text-base">
                        Primer intento en esta materia
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Este resultado queda como punto de partida para medir tu próxima mejora.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <RotateCcw className="h-4 w-4" />
                  Hacer otro Simulador
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="border-b border-slate-200 pb-6">
                <p className="text-[12px] font-semibold tracking-[0.18em] text-indigo-700 uppercase">
                  Siguiente paso
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-[-0.03em] text-slate-950">
                  Repasá tus {wrong} errores
                </h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">
                  Volvé sólo sobre las preguntas que fallaste y recuperá esos puntos antes del
                  próximo intento.
                </p>
                <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#4F46E5]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Cada respuesta tiene la explicación correcta para repasar.</span>
                </div>
                <Link
                  href={errorsHref}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95"
                >
                  Repasar mis errores
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="py-6">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-[#2563EB] uppercase">
                  Seguí estudiando con tus apuntes
                </p>
                <h3 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-950">
                  Prepará Derecho Procesal Público con tu propio PDF
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Subí tus apuntes y Evaluo te guía para repasar y practicar sobre el material que realmente entra en tu examen.
                </p>
                <Link
                  href={uploadHref}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8]"
                >
                  Subir mi PDF
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-4 px-1 text-xs text-slate-500">
          <span>{percentage}% de aciertos</span>
          <span>Preview de diseño · sin datos reales</span>
        </div>
      </div>
    </main>
  );
}
