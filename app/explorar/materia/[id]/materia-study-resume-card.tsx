'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { readRecentResources } from '@/lib/dashboard-client';
import { listPersistedSimulatorStates } from '@/lib/simulator-persistence';
import { getSimulatorRoute } from '@/lib/routes';
import { trackMateriaAnalyticsEvent } from '@/lib/materia-analytics';

type ResumeItem = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  savedAt: string;
  progress?: number;
};

interface MateriaStudyResumeCardProps {
  materiaId: string;
  materiaNombre: string;
  carreraId?: string;
  universidadId?: string;
  uploadHref: string;
}

function toTimestamp(value: string | null | undefined) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function MateriaStudyResumeCard({
  materiaId,
  materiaNombre,
  carreraId,
  universidadId,
}: MateriaStudyResumeCardProps) {
  const { user } = useUser();
  const [resumeItem, setResumeItem] = useState<ResumeItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setResumeItem(null);
      setLoaded(true);
      return;
    }

    const simulatorState = listPersistedSimulatorStates(user.id)
      .filter(
        (state) =>
          state.materiaId === materiaId &&
          state.mode === 'regular' &&
          state.hasStarted &&
          state.preguntas.length > 0
      )
      .sort((a, b) => toTimestamp(b.savedAt) - toTimestamp(a.savedAt))[0];

    const recentResource = readRecentResources()
      .filter((resource) => resource.subjectId === materiaId && Boolean(resource.href))
      .sort((a, b) => toTimestamp(b.openedAt) - toTimestamp(a.openedAt))[0];

    const simulatorTimestamp = toTimestamp(simulatorState?.savedAt);
    const resourceTimestamp = toTimestamp(recentResource?.openedAt);

    if (simulatorState && simulatorTimestamp >= resourceTimestamp) {
      const total = Math.max(1, simulatorState.preguntas.length);
      const answered = Math.min(total, Object.keys(simulatorState.selectedAnswers ?? {}).length);
      const progress = Math.round((answered / total) * 100);
      const parcialLabel =
        simulatorState.parcial === 3 ? 'Integrador' : `Parcial ${simulatorState.parcial}`;

      setResumeItem({
        href: getSimulatorRoute(
          materiaId,
          simulatorState.parcial,
          universidadId,
          carreraId
        ),
        eyebrow: 'Preguntero en curso',
        title: `${parcialLabel} de ${materiaNombre}`,
        description: `Llevás ${answered} de ${total} preguntas respondidas. Podés retomar exactamente desde tu intento guardado.`,
        cta: 'Continuar preguntero',
        savedAt: simulatorState.savedAt,
        progress,
      });
      setLoaded(true);
      return;
    }

    if (recentResource?.href) {
      setResumeItem({
        href: recentResource.href,
        eyebrow: 'Último material abierto',
        title: recentResource.title,
        description: `Volvé al ${recentResource.type.toLowerCase()} que estabas usando para estudiar ${materiaNombre}.`,
        cta: 'Continuar estudiando',
        savedAt: recentResource.openedAt,
      });
      setLoaded(true);
      return;
    }

    setResumeItem(null);
    setLoaded(true);
  }, [carreraId, materiaId, materiaNombre, universidadId, user]);

  const track = (action: string) => {
    void trackMateriaAnalyticsEvent('materia_resume_action_clicked', {
      userId: user?.id ?? null,
      materiaId,
      carreraId,
      universidadId,
      metadata: { action, has_resume_item: Boolean(resumeItem) },
    });
  };

  if (!loaded || !resumeItem) {
    return null;
  }

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-[#D8E5FF] bg-[linear-gradient(145deg,#F8FBFF_0%,#EEF4FF_100%)] p-5 shadow-[0_16px_38px_rgba(37,99,235,0.07)] sm:p-6"
      aria-labelledby="materia-resume-title"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.12em] text-[#2563EB] uppercase">
              Continuá donde lo dejaste
            </p>
            <h2
              id="materia-resume-title"
              className="mt-1 line-clamp-2 text-xl font-bold tracking-[-0.035em] text-slate-950"
            >
              {resumeItem.title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
              {resumeItem.description}
            </p>
            {typeof resumeItem.progress === 'number' ? (
              <div className="mt-3 max-w-md">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>{resumeItem.eyebrow}</span>
                  <span>{resumeItem.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-[width]"
                    style={{ width: `${resumeItem.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[12px] font-semibold text-slate-500">{resumeItem.eyebrow}</p>
            )}
          </div>
        </div>

        <Link
          href={resumeItem.href}
          onClick={() => track('resume')}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
        >
          {resumeItem.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
