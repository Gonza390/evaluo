'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { supabase } from '@/lib/supabase-client';
import { logError } from '@/lib/observability';
import { findFutureSimulatorExamIntent } from '@/lib/simulator-exam-intent';

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

function buildUploadHref(
  materiaId: string,
  carreraId?: string,
  universidadId?: string,
  examDate?: string
) {
  const params = new URLSearchParams({
    openUpload: '1',
    materiaId,
    source: 'preguntero-exam-intent',
  });
  if (carreraId) params.set('carreraId', carreraId);
  if (universidadId) params.set('universidadId', universidadId);
  if (examDate) params.set('examDate', examDate);
  return `/dashboard?${params.toString()}`;
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
  const [hasReadyOwnMaterial, setHasReadyOwnMaterial] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [materialContextReady, setMaterialContextReady] = useState(!userId);

  const safeTotal = Math.max(1, totalPreguntas);
  const percentage = Math.round((aciertos / safeTotal) * 100);
  const grade = (aciertos / safeTotal) * 10;
  const wrong = Math.max(0, respondidas - aciertos);
  const misErroresHref = '/dashboard/explicaciones';
  const uploadHref = buildUploadHref(materiaId, carreraId, universidadId, examDate);
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

        const materialPromise = userId
          ? supabase
              .from('student_materials')
              .select('id')
              .eq('user_id', userId)
              .eq('materia_id', materiaId)
              .eq('processing_status', 'ready')
              .limit(1)
          : Promise.resolve({ data: [] as Array<{ id: string }>, error: null });

        const examIntentPromise =
          userId && mode === 'regular'
            ? findFutureSimulatorExamIntent({ userId, materiaId, parcial })
            : Promise.resolve(null);

        const [attemptsResult, materialResult, examIntent] = await Promise.all([
          attemptsPromise,
          materialPromise,
          examIntentPromise,
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

        if (materialResult.error) {
          logError('simulatorFinishedResult.ownMaterial', materialResult.error, {
            materiaId,
          });
          setHasReadyOwnMaterial(false);
        } else {
          setHasReadyOwnMaterial(Boolean(materialResult.data?.[0]?.id));
        }
        setExamDate(examIntent?.eventDate ?? '');
        setMaterialContextReady(true);
        setComparisonReady(true);

      } catch (error) {
        if (!active) return;
        logError('simulatorFinishedResult.loadContext', error, { materiaId, parcial });
        setMaterialContextReady(true);
        setComparisonReady(true);
      }
    }

    void loadContext();
    return () => {
      active = false;
    };
  }, [attemptId, isFinishing, materiaId, mode, parcial, userId]);

  const resultMessage =
    wrong === 0
      ? 'Completaste el simulador sin errores. Hacé otro intento para confirmar que podés sostener el resultado.'
      : percentage >= 80
        ? 'Muy buen resultado. Consolidalo con un repaso corto de los errores antes de volver al Simulador.'
        : percentage >= 60
          ? `Tenés una buena base. El mejor siguiente paso es recuperar los ${wrong} puntos que todavía podés reforzar.`
          : `Este intento ya te mostró dónde enfocarte. Repasá los ${wrong} errores antes de volver al Simulador.`;

  return (
    <div className="min-h-[700px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#5D65F6]">Resultado del Simulador</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {materiaNombre || 'Tu materia'} · {getParcialLabel(parcial)}
          </h1>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.09)] sm:rounded-[32px]">
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-slate-200 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Tu nota</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-[4.7rem] leading-none font-bold tracking-[-0.08em] text-[#0F1B3D] sm:text-[5.5rem]">
                  {grade.toFixed(1)}
                </span>
                <span className="pb-2 text-lg font-semibold text-slate-400">/ 10</span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span><strong className="text-slate-950">{aciertos} de {safeTotal}</strong> correctas</span>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{resultMessage}</p>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Tu evolución</p>
                {!comparisonReady ? (
                  <p className="mt-3 text-sm text-slate-500">Comparando con tus intentos anteriores...</p>
                ) : previousAttempt && improvement !== null && previousGrade !== null ? (
                  <div className="mt-3 flex items-start gap-3">
                    <TrendingUp className={`mt-0.5 h-5 w-5 shrink-0 ${improvement > 0 ? 'text-emerald-600' : 'text-[#5D65F6]'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-950 sm:text-base">
                        {improvement > 0 ? `Mejoraste ${improvement}% vs. tu intento anterior` : 'Ya tenés un intento anterior para comparar'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Tu nota anterior fue {previousGrade.toFixed(1)}.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#5D65F6]" />
                    <div>
                      <p className="text-sm font-bold text-slate-950 sm:text-base">Primer intento en esta materia</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">Este resultado queda como punto de partida para medir tu próxima mejora.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="rounded-[24px] border border-indigo-200 bg-[linear-gradient(135deg,#F5F3FF_0%,#FFFFFF_58%,#EEF2FF_100%)] p-5 sm:p-6">
                <p className="text-[12px] font-bold tracking-[0.18em] text-indigo-700 uppercase">Siguiente paso recomendado</p>

                {wrong > 0 ? (
                  !materialContextReady && userId ? (
                    <div className="py-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Preparando el mejor próximo paso con tus apuntes...
                      </p>
                    </div>
                  ) : hasReadyOwnMaterial ? (
                    <>
                      <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                        Ya sabemos qué necesitás reforzar
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                        Tus {wrong} {wrong === 1 ? 'error quedó guardado' : 'errores quedaron guardados'}.
                        Evaluo los cruza con tus apuntes para mostrarte qué tema estudiar y dónde encontrarlo antes de volver a probarte.
                      </p>
                      <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#4F46E5]">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>De tus errores al lugar exacto de tus apuntes que necesitás reforzar.</span>
                      </div>
                      <Link
                        href={misErroresHref}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95 sm:w-auto"
                      >
                        Estudiar lo que fallé en mis apuntes
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                        Ya sabemos qué necesitás reforzar
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                        Detectamos {wrong} {wrong === 1 ? 'punto' : 'puntos'} que te conviene estudiar.
                        Subí los apuntes que realmente entran en tu examen y Evaluo los procesa para encontrar dónde aparece cada tema.
                      </p>
                      <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#4F46E5]">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>Pasá de “qué me salió mal” a “qué tengo que estudiar en mis apuntes”.</span>
                      </div>
                      <TrackedLink
                        href={ownMaterialHref}
                        eventName="cta_click"
                        payload={{
                          location: 'simulator_result_primary_pdf_activation',
                          cta_name: 'upload_notes_to_study_detected_errors',
                          materia_id: materiaId,
                          materia_nombre: materiaNombre || null,
                          parcial,
                          exam_date: examDate || null,
                          source: 'preguntero-exam-intent',
                          destination: ownMaterialHref,
                        }}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95 sm:w-auto"
                      >
                        Subir mis apuntes y saber qué estudiar
                        <ArrowRight className="h-4 w-4" />
                      </TrackedLink>
                      {userId ? (
                        <Link
                          href={misErroresHref}
                          className="mt-4 inline-flex text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
                        >
                          Ver qué fallé
                        </Link>
                      ) : null}
                    </>
                  )
                ) : (
                  <>
                    <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950">Confirmá el resultado</h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">No tenés errores para repasar. Hacé otro Simulador para comprobar que podés sostener esta nota con preguntas distintas.</p>
                    <button type="button" onClick={onNewExam} className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95">
                      Hacer otro Simulador
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {wrong > 0 ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={onNewExam}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Hacer otro Simulador
                  </button>
                </div>
              ) : null}

              {wrong === 0 ? (
                <div className="mt-7 border-t border-slate-200 pt-6">
                  <p className="text-[12px] font-semibold tracking-[0.16em] text-[#2563EB] uppercase">
                    Seguí preparando tu examen
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-950">
                    {hasReadyOwnMaterial
                      ? `Seguí estudiando ${materiaNombre || 'esta materia'} con tus apuntes`
                      : `Convertí tus apuntes de ${materiaNombre || 'esta materia'} en un plan de estudio`}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    {hasReadyOwnMaterial
                      ? 'Evaluo ya tiene tu material: podés seguir repasando, practicando y detectando qué te falta antes del examen.'
                      : 'Subí el material que realmente entra en tu examen. Evaluo lo procesa para decirte qué estudiar, practicar y reforzar.'}
                  </p>

                  {hasReadyOwnMaterial ? (
                    <Link
                      href="/dashboard"
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8] sm:w-auto"
                    >
                      Continuar estudiando
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <TrackedLink
                      href={ownMaterialHref}
                      eventName="cta_click"
                      payload={{
                        location: 'simulator_result_pdf_activation',
                        cta_name: 'upload_own_pdf_after_simulator',
                        materia_id: materiaId,
                        materia_nombre: materiaNombre || null,
                        parcial,
                        exam_date: examDate || null,
                        source: 'preguntero-exam-intent',
                        destination: ownMaterialHref,
                      }}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8] sm:w-auto"
                    >
                      Subir mis apuntes
                      <ArrowRight className="h-4 w-4" />
                    </TrackedLink>
                  )}
                </div>
              ) : null}
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
