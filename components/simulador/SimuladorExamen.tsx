'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LegacySimuladorExamen from '@/components/simulador/SimuladorExamenLegacy';
import type { SimuladorExamenProps as LegacySimuladorExamenProps } from '@/components/simulador/SimuladorExamenLegacy';
import { SimulatorFinishedResult } from '@/components/simulador/SimulatorFinishedResult';
import { supabase } from '@/lib/supabase-client';
import { logError } from '@/lib/observability';

export type SimuladorExamenProps = LegacySimuladorExamenProps;

type AttemptRow = {
  id: string;
  user_id: string;
  materia_id: string;
  parcial: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  answered_questions: number;
  mode: string;
  created_at: string;
};

const RESULT_MARKER_SELECTOR =
  'img[alt="Resultado final del simulador"], img[alt="Resultado motivacional del simulador"]';
const ATTEMPT_WAIT_RETRIES = 24;
const ATTEMPT_WAIT_MS = 500;

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function SimuladorExamen(props: SimuladorExamenProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const baselineAttemptIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const bridgeDisabledRef = useRef(false);
  const resolvingAttemptRef = useRef(false);

  const [baselineReady, setBaselineReady] = useState(false);
  const [finishDetected, setFinishDetected] = useState(false);
  const [finishedAttempt, setFinishedAttempt] = useState<AttemptRow | null>(null);
  const [materiaNombre, setMateriaNombre] = useState('');

  const mode = props.mode ?? 'regular';

  const fetchLatestAttempt = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('simulator_attempts')
      .select(
        'id, user_id, materia_id, parcial, total_questions, correct_answers, wrong_answers, answered_questions, mode, created_at'
      )
      .eq('user_id', userId)
      .eq('materia_id', props.materiaId)
      .eq('parcial', props.parcial)
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data as AttemptRow | null) ?? null;
  }, [mode, props.materiaId, props.parcial]);

  useEffect(() => {
    let active = true;

    async function prepareBridge() {
      try {
        const [authResult, materiaResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('materias').select('nombre').eq('id', props.materiaId).maybeSingle(),
        ]);

        if (!active) return;

        if (materiaResult.data?.nombre) {
          setMateriaNombre(materiaResult.data.nombre);
        }

        const userId = authResult.data.user?.id ?? null;
        userIdRef.current = userId;

        if (!userId) {
          setBaselineReady(true);
          return;
        }

        const latestAttempt = await fetchLatestAttempt(userId);
        if (!active) return;
        baselineAttemptIdRef.current = latestAttempt?.id ?? null;
      } catch (error) {
        logError('simulador.resultBridge.prepare', error, {
          materiaId: props.materiaId,
          parcial: props.parcial,
          mode,
        });
        bridgeDisabledRef.current = true;
      } finally {
        if (active) setBaselineReady(true);
      }
    }

    void prepareBridge();
    return () => {
      active = false;
    };
  }, [fetchLatestAttempt, mode, props.materiaId, props.parcial]);

  const resolveFinishedAttempt = useCallback(async () => {
    if (resolvingAttemptRef.current || bridgeDisabledRef.current) return;
    const userId = userIdRef.current;
    if (!userId) return;

    resolvingAttemptRef.current = true;
    setFinishDetected(true);

    try {
      for (let attempt = 0; attempt < ATTEMPT_WAIT_RETRIES; attempt += 1) {
        const latestAttempt = await fetchLatestAttempt(userId);
        if (
          latestAttempt &&
          latestAttempt.id !== baselineAttemptIdRef.current
        ) {
          setFinishedAttempt(latestAttempt);
          baselineAttemptIdRef.current = latestAttempt.id;
          return;
        }
        await wait(ATTEMPT_WAIT_MS);
      }

      bridgeDisabledRef.current = true;
      setFinishDetected(false);
      logError('simulador.resultBridge.timeout', new Error('No se encontró el intento recién finalizado.'), {
        materiaId: props.materiaId,
        parcial: props.parcial,
        mode,
      });
    } catch (error) {
      bridgeDisabledRef.current = true;
      setFinishDetected(false);
      logError('simulador.resultBridge.resolveAttempt', error, {
        materiaId: props.materiaId,
        parcial: props.parcial,
        mode,
      });
    } finally {
      resolvingAttemptRef.current = false;
    }
  }, [fetchLatestAttempt, mode, props.materiaId, props.parcial]);

  useEffect(() => {
    if (!baselineReady || bridgeDisabledRef.current || !userIdRef.current || finishedAttempt) return;

    const root = rootRef.current;
    if (!root) return;

    const checkForFinishedScreen = () => {
      if (root.querySelector(RESULT_MARKER_SELECTOR)) {
        void resolveFinishedAttempt();
      }
    };

    checkForFinishedScreen();
    const observer = new MutationObserver(checkForFinishedScreen);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [baselineReady, finishedAttempt, resolveFinishedAttempt]);

  if (finishedAttempt) {
    return (
      <SimulatorFinishedResult
        materiaId={props.materiaId}
        materiaNombre={materiaNombre}
        parcial={finishedAttempt.parcial}
        carreraId={props.carreraId}
        universidadId={props.universidadId}
        userId={finishedAttempt.user_id}
        attemptId={finishedAttempt.id}
        mode={mode}
        aciertos={finishedAttempt.correct_answers}
        respondidas={finishedAttempt.answered_questions}
        totalPreguntas={finishedAttempt.total_questions}
        isFinishing={false}
        onNewExam={() => window.location.reload()}
      />
    );
  }

  if (finishDetected) {
    return (
      <div className="flex min-h-[700px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] px-6">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-semibold text-slate-700">Guardando tu resultado...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <LegacySimuladorExamen {...props} />
    </div>
  );
}
