'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { SimulatorNeedsSurvey, type SimulatorNeedsReason } from './SimulatorNeedsSurvey';

interface SimulatorLoginGateProps {
  answeredCount: number;
  correctCount: number;
  questionLimit: number;
  loginHref: string;
  signupHref: string;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onNeedsFeedback?: (reason: SimulatorNeedsReason) => void;
  acquisitionVariant?: 'preguntero_google_v1';
}

export function SimulatorLoginGate({
  answeredCount,
  correctCount,
  questionLimit,
  loginHref,
  signupHref,
  onLoginClick,
  onSignupClick,
  onNeedsFeedback,
  acquisitionVariant,
}: SimulatorLoginGateProps) {
  const preliminaryScore = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const isPregunteroAcquisition = acquisitionVariant === 'preguntero_google_v1';

  return (
    <div className="flex min-h-[680px] items-center justify-center bg-white p-4 sm:p-6">
      <section className="w-full max-w-4xl border-y border-slate-200 py-8 sm:py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Trophy className="h-4 w-4" />
              {isPregunteroAcquisition ? 'Tu diagnóstico inicial' : 'Continúa el simulador'}
            </div>
            <h2 className="mt-4 text-[2rem] leading-[1.02] font-bold tracking-[-0.05em] text-slate-950 sm:text-[2.7rem]">
              {isPregunteroAcquisition
                ? 'Ya viste cómo venís. Guardá el resultado y seguí.'
                : 'Tu primer diagnóstico ya está listo'}
            </h2>
            <p className="mt-4 max-w-[500px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Acertaste {correctCount} de {answeredCount} preguntas ({preliminaryScore}%).
              {isPregunteroAcquisition
                ? ' Creá tu cuenta gratis para conservar estas respuestas, ver tus errores y continuar desde donde quedaste.'
                : ' Iniciá sesión o creá tu cuenta para guardar este resultado, continuar y ver la devolución completa.'}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {isPregunteroAcquisition ? (
                <>
                  <Link
                    href={signupHref}
                    onClick={onSignupClick}
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-base font-semibold text-white transition hover:bg-blue-700"
                  >
                    Ver mis errores y seguir practicando
                  </Link>
                  <Link
                    href={loginHref}
                    onClick={onLoginClick}
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Ya tengo cuenta
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={loginHref}
                    onClick={onLoginClick}
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-base font-semibold text-white transition hover:bg-blue-700"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href={signupHref}
                    onClick={onSignupClick}
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>

            {onNeedsFeedback ? <SimulatorNeedsSurvey compact onSelect={onNeedsFeedback} /> : null}
          </div>

          <div className="border-t border-slate-200 lg:border-t-0 lg:border-l lg:pl-8">
            <dl className="divide-y divide-slate-200">
              <div className="flex items-end justify-between gap-4 py-4 lg:pt-0">
                <dt className="text-sm font-medium text-slate-500">Avance</dt>
                <dd className="text-3xl font-bold tracking-[-0.05em] text-slate-950">
                  {answeredCount}/{questionLimit}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4 py-4">
                <dt className="text-sm font-medium text-slate-500">Resultado preliminar</dt>
                <dd className="text-3xl font-bold tracking-[-0.05em] text-slate-950">{preliminaryScore}%</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
                  Qué desbloqueás al continuar
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  {isPregunteroAcquisition
                    ? `Tus ${answeredCount} respuestas quedan guardadas. Seguís con el simulador completo de ${questionLimit} preguntas y después podés llevar tus errores a tus propios apuntes.`
                    : `Acceso al simulador completo de ${questionLimit} preguntas, guardado del intento, resultados finales y correcciones inteligentes de tus errores.`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
