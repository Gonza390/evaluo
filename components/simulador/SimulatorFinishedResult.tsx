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

        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.09)]">
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
                  <>
                    <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950">Repaso de errores</h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                      Volvé sólo sobre las {wrong} preguntas que fallaste, entendé la explicación y reforzá esos temas antes de hacer otro Simulador.
                    </p>
                    <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#4F46E5]">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Primero corregí lo que falló; después medí de nuevo.</span>
                    </div>
                    <Link href={errorsHref} className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(99,102,241,0.24)] transition hover:opacity-95">
                      Repasar mis errores
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
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

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
                <Link href={materiaHref} className="inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-indigo-700">
                  <BookOpen className="h-4 w-4" />
                  Volver a la materia
                </Link>
                {wrong > 0 ? (
                  <button type="button" onClick={onNewExam} className="inline-flex items-center gap-2 font-semibold text-slate-500 transition hover:text-indigo-700">
                    <RotateCcw className="h-4 w-4" />
                    Hacer otro Simulador
                  </button>
                ) : null}
              </div>

              {hasMaterial === null ? (
                <p className="mt-7 border-t border-slate-200 pt-6 text-sm text-slate-500">Buscando material disponible...</p>
              ) : hasMaterial ? (
                <div className="mt-7 border-t border-slate-200 pt-6">
                  <p className="text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Para reforzar antes de volver</p>
                  <div className="mt-3 flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#5D65F6]" />
                    <div>
                      <h3 className="text-base font-bold tracking-[-0.025em] text-slate-950">Hay material disponible de esta materia</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">Revisá resúmenes y recursos compartidos si necesitás reforzar un tema puntual.</p>
                      <Link href={materiaHref} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4F46E5] transition hover:text-[#4338CA]">
                        Ver material de la materia
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-7 overflow-hidden rounded-[22px] border border-blue-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_48%,#EEF2FF_100%)] p-4 shadow-[0_14px_34px_rgba(37,99,235,0.08)] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)]"><UploadCloud className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tracking-[0.14em] text-blue-600 uppercase">Estudiá con tus apuntes</p>
                      <h3 className="mt-1 text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950">Prepará {materiaNombre || 'esta materia'} desde tu propio PDF</h3>
                      <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-slate-600">Evaluo te prepara resumen, glosario, tarjetas y práctica sobre tu propio material.</p>
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
                    Subir mi PDF
                    <ArrowRight className="h-4 w-4" />
                  </TrackedLink>
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
