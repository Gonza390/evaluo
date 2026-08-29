'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BookOpenText,
  BrainCircuit,
  ChevronRight,
  FileText,
  Layers3,
  Sparkles,
} from 'lucide-react';
import type { SharedStudentMaterial } from '@/lib/data/student-materials';
import { getStudentMaterialRoute } from '@/lib/routes';
import { pushRecentResource } from '@/lib/dashboard-client';

type SharedStudentMaterialCardProps = {
  material: SharedStudentMaterial;
  materiaId: string;
  materiaNombre: string;
  onOpen: (materialId: string, artifactCount: number) => void;
};

const ARTIFACTS = [
  { key: 'summary' as const, label: 'Resumen', icon: BookOpenText },
  { key: 'glossary' as const, label: 'Glosario', icon: BookOpen },
  { key: 'flashcards' as const, label: 'Flashcards', icon: Layers3 },
  { key: 'exercises' as const, label: 'Ejercicios', icon: BrainCircuit },
];

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function SharedStudentMaterialCard({
  material,
  materiaId,
  materiaNombre,
  onOpen,
}: SharedStudentMaterialCardProps) {
  const materialHref = getStudentMaterialRoute(material.id);
  const dateLabel = formatDate(material.created_at);
  const availableArtifacts = ARTIFACTS.filter(({ key }) => material.study_artifacts?.[key]);
  const isEnriched = material.study_artifacts?.count >= 3;
  const isComplete = material.study_artifacts?.complete;
  const [uploaderName, setUploaderName] = useState('Estudiante');

  useEffect(() => {
    let active = true;

    void fetch(`/api/student-materials/${material.id}/author`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { name?: string | null };
      })
      .then((payload) => {
        if (!active) return;
        const name = payload?.name?.trim();
        if (name) setUploaderName(name);
      })
      .catch(() => {
        // La atribución es complementaria: el material sigue siendo usable si falla.
      });

    return () => {
      active = false;
    };
  }, [material.id]);

  return (
    <article
      className={`group relative flex min-h-[272px] flex-col overflow-hidden rounded-[22px] border p-4 transition duration-200 sm:p-5 ${
        isEnriched
          ? 'border-[#BDD0FF] bg-[linear-gradient(145deg,#F8FBFF_0%,#EEF4FF_58%,#F5F3FF_100%)] shadow-[0_16px_38px_rgba(37,99,235,0.09)] hover:-translate-y-0.5 hover:border-[#8FB0FF] hover:shadow-[0_20px_46px_rgba(37,99,235,0.13)]'
          : 'border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.055)] hover:border-slate-300'
      }`}
    >
      {isEnriched ? (
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent_70%)]" />
      ) : null}

      <div className="relative flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
            isEnriched
              ? 'bg-white text-[#4F5DFF] shadow-[0_8px_20px_rgba(79,93,255,0.10)]'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isEnriched ? <Sparkles className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase ${
                isEnriched
                  ? 'border border-[#C7D2FE] bg-white/90 text-[#4F5DFF]'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isComplete
                ? 'Material de estudio completo'
                : isEnriched
                  ? 'Apunte enriquecido'
                  : 'Apunte de estudiante'}
            </span>
            {material.page_count ? (
              <span className="text-[11px] font-medium text-slate-400">
                {material.page_count} páginas
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 line-clamp-2 text-[17px] font-bold tracking-[-0.025em] text-slate-950">
            {material.title}
          </h3>
        </div>
      </div>

      {availableArtifacts.length > 0 ? (
        <div className="relative mt-4">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
            Incluye para estudiar
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {availableArtifacts.map(({ key, label, icon: Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm"
              >
                <Icon className="h-3.5 w-3.5 text-[#4F5DFF]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="relative mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
          Material compartido para estudiar esta materia.
        </p>
      )}

      <div className="relative mt-auto pt-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            Subido por <span className="font-semibold text-slate-600">{uploaderName}</span>
          </span>
          {dateLabel ? <span>{dateLabel}</span> : null}
        </div>

        <Link
          href={materialHref}
          onClick={() => {
            pushRecentResource({
              id: material.id,
              title: material.title,
              subjectId: materiaId,
              subjectName: materiaNombre,
              type: 'Recurso',
              href: materialHref,
              openedAt: new Date().toISOString(),
            });
            onOpen(material.id, material.study_artifacts?.count ?? 0);
          }}
          className={`inline-flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-semibold transition ${
            isEnriched
              ? 'bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8]'
              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {isEnriched ? 'Estudiar este apunte' : 'Abrir apunte'}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
