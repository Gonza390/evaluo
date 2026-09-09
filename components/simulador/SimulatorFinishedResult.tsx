'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { supabase } from '@/lib/supabase-client';
import { getMateriaRoute } from '@/lib/routes';
import { logError } from '@/lib/observability';

type PreviousAttempt = {
  correct_answers: number;
  total_questions: number;
};

type SimulatorFinishedResultProps = {
  materiaId: string;
  materiaNombre: string;
  parcial: number;
  carreraId?: string;
  universidadId?: string;
  userId: string | null;
  attemptId: string | null;
  mode: 'regular' | 'errores' | 'ultimo_intento';
  aciertos: number;
  respondidas: number;
  totalPreguntas: number;
  isFinishing: boolean;
  onNewExam: () => void;
};

function buildUploadHref(materiaId: string, carreraId?: string, universidadId?: string) {
  const params = new URLSearchParams({ openUpload: '1', materiaId });
  if (carreraId) params.set('carreraId', carreraId);
  if (universidadId) params.set('universidadId', universidadId);
  return `/dashboard/materiales?${params.toString()}`;
}

function getParcialLabel(parcial: number) {
  return Number(parcial) === 3 ? 'Mixto (Parcial 1 + 2)' : `Parcial ${parcial}`;
}

export function SimulatorFinishedResult({
  materiaId,
  materiaNombre,
  parcial,
  carreraId,
  universidadId,
  userId,
  attemptId,
  mode,
  aciertos,
  respondidas,
  totalPreguntas,
  isFinishing,
  onNewExam,
}: SimulatorFinishedResultProps) {
  const [previousAttempt, setPreviousAttempt] = useState<PreviousAttempt | null>(null);
  const [comparisonReady, setComparisonReady] = useState(false);
  const [hasMaterial, setHasMaterial] = useState<boolean | null>(null);

  const safeTotal = Math.max(1, totalPreguntas);
  const percentage = Math.round((aciertos / safeTotal) * 100);
  const grade = (aciertos / safeTotal) * 10;
  const wrong = Math.max(0, respondidas - aciertos);
  const materiaHref = getMateriaRoute(materiaId, carreraId);
  const errorsHref = `/simulador/errores/${materiaId}?parcial=${parcial}`;
  const uploadHref = buildUploadHref(materiaId, carreraId, universidadId);
  const ownMaterialHref = userId
    ? uploadHref
    : `/login?mode=signup&next=${encodeURIComponent(uploadHref)}`;

  const previousGrade = useMemo(() => {
    if (!previousAttempt || previousAttempt.total_questions <= 0) return null;
    return (previousAttempt.correct_answers / previousAttempt.total_questions) * 10;
  }, [previousAttempt]);

  const improvement = useMemo(() => {
    if (!previousAttempt || previousAttempt.total_questions <= 0) return null;
    const previousPercentage = Math.round(
      (previousAttempt.correct_answers / previousAttempt.total_questions) * 100
    );
    return percentage - previousPercentage;
  }, [percentage, previousAttempt]);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      if (isFinishing) return;

      try {
        const attemptsPromise = userId
          ? (() => {
              let query = supabase
                .from('simulator_attempts')
                .select('correct_answers, total_questions')
                .eq('user_id', userId)
                .eq('materia_id', materiaId)
                .eq('parcial', parcial)
                .eq('mode', mode)
                .order('created_at', { ascending: false })
                .limit(1);

              if (attemptId) query = query.neq('id', attemptId);
              return query;
            })()
          : Promise.resolve({ data: [] as PreviousAttempt[], error: null });

        const [attemptsResult, sharedMaterialsResult, resourcesResult] = await Promise.all([
          attemptsPromise,
          supabase
            .from('student_materials')
            .select('id', { count: 'exact', head: true })
            .eq('materia_id', materiaId)
            .eq('processing_status', 'ready'),
          supabase
            .from('recursos')
            .select('id', { count: 'exact', head: true })
            .eq('materia_id', materiaId),
        ]);

        if (!active) return;

        if (attemptsResult.error) {
          logError('simulatorFinishedResult.previousAttempt', attemptsResult.error, {
            materiaId,
            parcial,
          });
          setPreviousAttempt(null);
        } else {
          setPreviousAttempt((attemptsResult.data?.[0] as PreviousAttempt | undefined) ?? null);
        }
        setComparisonReady(true);

        const sharedCount = sharedMaterialsResult.count ?? 0;
        const resourcesCount = resourcesResult.count ?? 0;
        setHasMaterial(sharedCount + resourcesCount > 0);
      } catch (error) {
        if (!active) return;
        logError('simulatorFinishedResult.loadContext', error, { materiaId, parcial });
        setComparisonReady(true);
        setHasMaterial(false);
      }
    }

    void loadContext();
    return () => {
      active = false;
    };
  }, [attemptId, isFinishing, materiaId, mode, parcial, userId]);

  const resultMessage =
    percentage >= 80
      ? 'Muy buen resultado. Podés consolidarlo repasando los puntos que fallaste antes de volver a rendir.'
      : percentage >= 60
        ? `Tenés una buena base. Antes de hacer otro modelo, conviene recuperar los ${wrong} puntos que todavía podés reforzar.`
        : `Este intento ya te mostró dónde enfocarte. Repasá los ${wrong} errores antes de volver a probar.`;

  return (
    <div className="min-h-[700px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#5D65F6]">Resultados del simulador</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {materiaNombre || 'Tu materia'} · {getParcialLabel(parcial)}
          </h1>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.09)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-slate-200 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Tu nota
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-[4.7rem] leading-none font-bold tracking-[-0.08em] text-[#0F1B3D] sm:text-[5.5rem]">
                  {grade.toFixed(1)}
                </span>
                <span className="pb-2 text-lg font-semibold text-slate-400">/ 10</span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  <strong className="text-slate-950">{aciertos} de {safeTotal}</strong> correctas
                </span>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                {resultMessage}
              </p>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Tu evolución
                </p>

                {!comparisonReady ? (
                  <p className="mt-3 text-sm text-slate-500">Comparando con tus intentos anteriores...</p>
                ) : previousAttempt && improvement !== null && previousGrade !== null ? (
                  <div className="mt-3 flex items-start gap-3">
                    <TrendingUp
                      className={`mt-0.5 h-5 w-5 shrink-0 ${improvement > 0 ? 'text-emerald-600' : 'text-[#5D65F6]'}`}
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-950 sm:text-base">
                        {improvement > 0
                          ? `Mejoraste ${improvement}% vs. tu intento anterior`
                          : 'Ya tenés un intento anterior para comparar'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Tu nota anterior fue {previousGrade.toFixed(1)}.
                      </p>
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

              <div className="mt-7 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2">
                <Link
                  href={materiaHref}
                  className="flex min-h-[72px] items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-950">Volver a la materia</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">Seguir estudiando</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={onNewExam}
                  className="flex min-h-[72px] items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <RotateCcw className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-950">Hacer otro modelo</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">Medir tu próxima mejora</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="border-b border-slate-200 pb-6">
                <p className="text-[12px] font-semibold tracking-[0.18em] text-indigo-700 uppercase">
                  Siguiente paso
                </p>

                {wrong > 0 ? (
                  <>
                    <h2 className="mt-3 text-xl font-bold tracking-[-0.03em] text-slate-950">
                      Repasá tus {wrong} errores
                    </h2>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">
                      Volvé sólo sobre las preguntas que fallaste y recuperá esos puntos antes del próximo intento.
                    </p>
                    <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#4F46E5]">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Cada respuesta tiene la explicación correcta para repasar.</span>
                    </div>
                    <Link
                      href={errorsHref}
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95"
                    >
                      Repasar mis errores
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="mt-3 text-xl font-bold tracking-[-0.03em] text-slate-950">
                      No tenés errores para repasar
                    </h2>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">
                      Probá otro modelo para confirmar que podés sostener este resultado.
                    </p>
                    <button
                      type="button"
                      onClick={onNewExam}
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95"
                    >
                      Hacer otro modelo
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              <div className="py-6">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-[#5D65F6] uppercase">
                  Seguí con esta materia
                </p>

                {hasMaterial === null ? (
                  <p className="mt-3 text-sm text-slate-500">Buscando material disponible...</p>
                ) : hasMaterial ? (
                  <div className="mt-3 flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#5D65F6]" />
                    <div>
                      <h3 className="text-lg font-bold tracking-[-0.025em] text-slate-950">
                        Hay material disponible para seguir estudiando
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Revisá los resúmenes y recursos compartidos de {materiaNombre || 'esta materia'} antes de volver a rendir.
                      </p>
                      <Link
                        href={materiaHref}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4F46E5] transition hover:text-[#4338CA]"
                      >
                        Ver material de la materia
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 overflow-hidden rounded-[22px] border border-blue-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_48%,#EEF2FF_100%)] p-4 shadow-[0_14px_34px_rgba(37,99,235,0.08)] sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)]">
                        <UploadCloud className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.14em] text-blue-600 uppercase">
                          Tu próximo paso
                        </p>
                        <h3 className="mt-1 text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950">
                          Ahora estudiá {materiaNombre || 'esta materia'} con tus propios apuntes
                        </h3>
                        <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-slate-600">
                          Subí tu PDF y Evaluo te prepara resumen, glosario, tarjetas y ejercicios sobre tu propio material.
                        </p>
                      </div>
                    </div>

                    <TrackedLink
                      href={ownMaterialHref}
                      eventName="cta_click"
                      payload={{
                        location: 'simulator_result_pdf_activation',
                        cta_name: 'upload_own_pdf_after_simulator',
                        materia_id: materiaId,
                        materia_nombre: materiaNombre || null,
                        parcial,
                        destination: ownMaterialHref,
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8]"
                    >
                      Subir mis apuntes{materiaNombre ? ` de ${materiaNombre}` : ''}
                      <ArrowRight className="h-4 w-4" />
                    </TrackedLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-4 px-1 text-xs text-slate-500">
          <span>{percentage}% de aciertos</span>
          {isFinishing ? <span>Guardando resultado...</span> : null}
        </div>
      </div>
    </div>
  );
}
