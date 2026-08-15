import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SimulatorLoginGateProps {
  answeredCount: number;
  questionLimit: number;
  loginHref: string;
  signupHref: string;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function SimulatorLoginGate({
  answeredCount,
  questionLimit,
  loginHref,
  signupHref,
  onLoginClick,
  onSignupClick,
}: SimulatorLoginGateProps) {
  return (
    <div className="flex min-h-[680px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] p-4 sm:p-6">
      <Card className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
        <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF0FF] px-4 py-2 text-sm font-semibold text-[#5B5FEF] ring-1 ring-[#D9DBFF]">
              <Trophy className="h-4 w-4" />
              Continúa el simulador
            </div>
            <h2 className="mt-6 text-[2rem] font-bold leading-[1.02] tracking-[-0.05em] text-[#0F1B3D] sm:text-[2.7rem]">
              Ya respondiste las primeras {answeredCount} preguntas
            </h2>
            <p className="mt-4 max-w-[460px] text-lg leading-8 text-slate-600">
              Para seguir con el resto del simulador, guardar tu progreso y recibir la devolución completa, iniciá sesión o creá tu cuenta.
            </p>
            <div className="mt-6 inline-flex items-end gap-3 rounded-[28px] border border-[#D9DBFF] bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(99,102,241,0.12)]">
              <span className="text-[3rem] font-bold leading-none tracking-[-0.07em] text-[#4F46E5]">
                {answeredCount}/{questionLimit}
              </span>
              <span className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                avance
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={loginHref}
                onClick={onLoginClick}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-base font-semibold text-white shadow-[0_16px_35px_rgba(99,102,241,0.30)] hover:opacity-95"
              >
                Iniciar sesión
              </Link>
              <Link
                href={signupHref}
                onClick={onSignupClick}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-base font-semibold text-[#5D65F6] hover:bg-[#EEF0FF]"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Respondidas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {answeredCount}
                <span className="text-sm font-semibold text-slate-500"> / {questionLimit}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Guardado</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Progreso</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Qué desbloqueás al continuar</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Acceso al simulador completo de {questionLimit} preguntas, guardado del intento, resultados finales y correcciones inteligentes de tus errores.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
