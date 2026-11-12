'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, RotateCcw, Upload, X } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { supabase } from '@/lib/supabase-client';
import { logError } from '@/lib/observability';
import { findFutureSimulatorExamIntent } from '@/lib/simulator-exam-intent';
import {
  getSimulatorResultContextAction,
  type SimulatorResultContext,
} from '@/lib/actions/simulator-result';

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
  // Errores pendientes, enunciados y disponibilidad del repaso (onboarding etapa 3).
  const [resultContext, setResultContext] = useState<SimulatorResultContext | null>(null);

  useEffect(() => {
    if (isFinishing || !userId) return;
    let active = true;
    void getSimulatorResultContextAction({ materiaId, parcial, attemptId, mode })
      .then((context) => { if (active) setResultContext(context); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [attemptId, isFinishing, materiaId, mode, parcial, userId]);

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

  const isReview = mode === 'errores';
  const reviewHref = `/simulador/errores/${materiaId}?parcial=${parcial}`;
  // En el resultado normal, si todavía no llegó el conteo (o los errores eran de preguntas
  // Premium, que no entran al repaso), se usa la cantidad de errores del intento.
  const pendingCount = isReview
    ? resultContext?.pendingCount ?? wrong
    : resultContext && resultContext.pendingCount > 0
      ? resultContext.pendingCount
      : wrong;
  const prompts = resultContext?.prompts ?? [];
  const reviewAvailable = resultContext?.reviewAvailable ?? true;
  const nextFreeReview = resultContext?.nextFreeReviewDate
    ? formatReviewDate(resultContext.nextFreeReviewDate)
    : null;
  const subject = materiaNombre || 'tu materia';
  const gradeLabel = grade.toLocaleString('es-AR', { maximumFractionDigits: 1 });
  const gradeDelta =
    previousGrade !== null ? Math.round((grade - previousGrade) * 10) / 10 : null;

  const materialCard = hasReadyOwnMaterial ? (
    <section data-simulator-result-material className="mt-6 rounded-[18px] border border-[#e3eaf5] p-[18px]">
      <h2 className="text-subtitulo font-semibold leading-snug tracking-[-0.02em] text-[#0f1623]">
        ¿Querés entender por qué te equivocaste?
      </h2>
      <p className="mt-1.5 text-ui leading-[1.45] text-[#4b5565] sm:text-cuerpo">
        Ya tenemos tu apunte de {subject}: te mostramos dónde está cada tema que fallaste.
      </p>
      <Link href={misErroresHref} className="mt-3.5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dbe6f8] px-[18px] text-ui font-semibold text-[#3c6cba] hover:bg-[#eef4ff]">
        <BookOpen className="size-[17px]" aria-hidden="true" />
        Ver mis errores en mi apunte
      </Link>
    </section>
  ) : (
    <section data-simulator-result-material className="mt-6 rounded-[18px] border border-[#e3eaf5] p-[18px]">
      <h2 className="text-subtitulo font-semibold leading-snug tracking-[-0.02em] text-[#0f1623]">
        {wrong > 0 || isReview ? '¿Querés entender por qué te equivocaste?' : '¿Querés llegar al examen con todo cubierto?'}
      </h2>
      <p className="mt-1.5 text-ui leading-[1.45] text-[#4b5565] sm:text-cuerpo">
        {wrong > 0 || isReview
          ? `Subí tu apunte de ${subject} y te mostramos dónde está cada tema en tu material.`
          : `Subí tu apunte de ${subject} y te armamos un plan de estudios hasta el examen.`}
      </p>
      <TrackedLink
        href={ownMaterialHref}
        eventName="cta_click"
        payload={{
          location: wrong > 0 || isReview ? 'simulator_result_primary_pdf_activation' : 'simulator_result_pdf_activation',
          cta_name: wrong > 0 || isReview ? 'upload_notes_to_study_detected_errors' : 'upload_own_pdf_after_simulator',
          materia_id: materiaId,
          materia_nombre: materiaNombre || null,
          parcial,
          exam_date: examDate || null,
          source: 'preguntero-exam-intent',
          destination: ownMaterialHref,
        }}
        className="mt-3.5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dbe6f8] px-[18px] text-ui font-semibold text-[#3c6cba] hover:bg-[#eef4ff]"
      >
        <Upload className="size-[17px]" aria-hidden="true" />
        Subir mi apunte
      </TrackedLink>
    </section>
  );

  const promptList = (items: string[], total: number, tone: 'wrong' | 'pending') =>
    items.length ? (
      <ul aria-label={tone === 'wrong' ? 'Preguntas que fallaste' : 'Errores que quedan'} className="mt-4 flex flex-col gap-2">
        {items.slice(0, tone === 'wrong' ? 2 : 3).map((prompt) => (
          <li key={prompt} className="flex items-start gap-2.5 text-ui leading-[1.4] text-[#344054] sm:text-cuerpo">
            {tone === 'wrong'
              ? <X className="mt-0.5 size-4 shrink-0 text-[#b42318]" strokeWidth={2.4} aria-hidden="true" />
              : <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-[#c4320a]" />}
            <span className="min-w-0 truncate">{prompt}</span>
          </li>
        ))}
        {total > (tone === 'wrong' ? 2 : 3) ? (
          <li className="pl-[26px] text-ui text-[#667085]">y {total - (tone === 'wrong' ? 2 : 3)} más</li>
        ) : null}
      </ul>
    ) : null;

  const primaryClass =
    'mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#3c6cba] px-6 text-cuerpo font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,.20)] transition-colors hover:bg-[#2a5193]';

  return (
    <div data-simulator-result className="min-h-[700px] bg-white px-6 py-6 text-[#0f1623] sm:py-12">
      <div className="mx-auto w-full max-w-[440px]">
        {isReview ? (
          <section>
            <p className="text-ui text-[#667085]">{subject} · Repaso de errores</p>
            <h1 className="mt-3 text-[30px] font-bold leading-[1.15] tracking-[-0.04em]">
              {pendingCount === 0 && aciertos > 0
                ? 'Resolviste todos tus errores'
                : `Resolviste ${aciertos} de tus ${safeTotal} errores`}
            </h1>
            <div
              className="mt-[18px] flex gap-1"
              role="img"
              aria-label={`${aciertos} resueltos, ${Math.max(0, safeTotal - aciertos)} pendientes`}
            >
              {safeTotal <= 20 ? (
                Array.from({ length: safeTotal }, (_, index) => (
                  <span key={index} className={`h-2 flex-1 rounded-full ${index < aciertos ? 'bg-[#067647]' : 'bg-[#e3e8ef]'}`} />
                ))
              ) : (
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e3e8ef]">
                  <span className="block h-full rounded-full bg-[#067647]" style={{ width: `${percentage}%` }} />
                </span>
              )}
            </div>
            <p className="mt-3 text-cuerpo text-[#344054]">
              <strong className="font-semibold text-[#054f31]">{aciertos} {aciertos === 1 ? 'resuelto' : 'resueltos'}</strong>
              {' · '}
              {pendingCount === 0 ? 'no te queda ninguno' : `te ${pendingCount === 1 ? 'queda' : 'quedan'} ${pendingCount}`}
            </p>

            <div className="my-6 h-px bg-[#e8ecf2]" />

            {pendingCount > 0 ? (
              <>
                <p className="text-etiqueta font-semibold tracking-etiqueta text-[#667085]">LOS QUE QUEDAN</p>
                {promptList(prompts, pendingCount, 'pending')}
                <p className="mt-3.5 text-ui leading-[1.45] text-[#4b5565] sm:text-cuerpo">
                  Estos te cuestan más: conviene entender por qué antes de volver a intentarlo.
                </p>
                <Link href={hasReadyOwnMaterial ? misErroresHref : ownMaterialHref} className={primaryClass}>
                  {`Entender ${pendingCount === 1 ? 'el que queda' : `los ${pendingCount}`} con mi apunte`}
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </Link>
                {reviewAvailable ? (
                  <Link href={reviewHref} className="mt-1.5 flex min-h-12 items-center justify-center text-ui font-semibold text-[#3c6cba]">
                    Repasarlos de nuevo
                  </Link>
                ) : nextFreeReview ? (
                  <p className="mt-3 text-center text-ui text-[#4b5565]">Podés volver a repasarlos el {nextFreeReview}.</p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-cuerpo leading-[1.45] text-[#4b5565]">
                  Confirmá que lo sostenés con preguntas nuevas de {subject}.
                </p>
                <button type="button" onClick={onNewExam} className={primaryClass}>
                  Hacer otro simulacro
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </button>
              </>
            )}
          </section>
        ) : (
          <>
            <section>
              <p className="text-ui text-[#667085]">{subject} · {getParcialLabel(parcial)}</p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-[56px] font-bold leading-none tracking-[-0.05em]">{gradeLabel}</span>
                <span className="text-subtitulo font-medium text-[#667085]">/ 10</span>
              </div>
              <p className="mt-2.5 text-cuerpo text-[#344054]">
                <strong className="font-semibold text-[#0f1623]">{aciertos} de {safeTotal}</strong> correctas
                {' · '}
                {!comparisonReady ? '…' : gradeDelta === null ? 'primer intento' : gradeDelta > 0 ? (
                  <span className="font-semibold text-[#067647]">+{gradeDelta.toLocaleString('es-AR')} vs. tu intento anterior</span>
                ) : gradeDelta < 0 ? (
                  `${gradeDelta.toLocaleString('es-AR')} vs. tu intento anterior`
                ) : 'igual que tu intento anterior'}
              </p>
            </section>

            <div className="my-6 h-px bg-[#e8ecf2]" />

            {wrong > 0 ? (
              <section>
                <p className="text-etiqueta font-semibold tracking-etiqueta text-[#667085]">TU SIGUIENTE PASO</p>
                <h1 className="mt-2 text-titulo font-semibold leading-tight tracking-titulo">
                  {`Repasá ${pendingCount === 1 ? 'tu error' : `tus ${pendingCount} errores`} ahora`}
                </h1>
                <p className="mt-2 text-cuerpo leading-[1.45] text-[#4b5565]">
                  Te volvemos a hacer las preguntas que fallaste, mientras las tenés frescas.
                </p>
                {promptList(prompts, wrong, 'wrong')}
                <TrackedLink
                  href={reviewHref}
                  eventName="cta_click"
                  payload={{
                    location: 'simulator_result_review',
                    cta_name: 'review_errors_now',
                    materia_id: materiaId,
                    parcial,
                    pending_errors: pendingCount,
                    review_available: reviewAvailable,
                  }}
                  className={primaryClass}
                >
                  {`Repasar ${pendingCount === 1 ? 'mi error' : `mis ${pendingCount} errores`}`}
                  <span className="font-normal opacity-85">· unos {resultContext?.reviewMinutes ?? 1} min</span>
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </TrackedLink>
                {!reviewAvailable && nextFreeReview ? (
                  <p className="mt-2 text-center text-chico text-[#667085]">
                    Ya usaste tu repaso gratis de esta semana: vuelve el {nextFreeReview}.
                  </p>
                ) : null}
              </section>
            ) : (
              <section>
                <p className="text-etiqueta font-semibold tracking-etiqueta text-[#667085]">TU SIGUIENTE PASO</p>
                <h1 className="mt-2 text-titulo font-semibold leading-tight tracking-titulo">
                  Sin errores. Confirmalo con otro intento
                </h1>
                <p className="mt-2 text-cuerpo leading-[1.45] text-[#4b5565]">
                  Con preguntas distintas sabés si podés sostener esta nota.
                </p>
                <button type="button" onClick={onNewExam} className={primaryClass}>
                  Hacer otro simulacro
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </button>
              </section>
            )}

            {materialContextReady ? materialCard : null}

            {wrong > 0 ? (
              <button
                type="button"
                onClick={onNewExam}
                className="mx-auto mt-6 flex min-h-11 items-center gap-2 text-ui font-medium text-[#4b5565] hover:text-[#0f1623]"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Hacer otro simulacro
              </button>
            ) : null}
          </>
        )}

        {isFinishing ? <p className="mt-4 text-center text-chico text-[#667085]">Guardando resultado...</p> : null}
      </div>
    </div>
  );
}

function formatReviewDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return dateKey;
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}
