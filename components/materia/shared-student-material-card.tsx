'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Layers3,
  List,
  Share2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  SharedStudentMaterialStudyArtifacts,
  StudentMaterial,
} from '@/lib/data/student-materials';
import { PdfCardThumbnail } from '@/components/materia/pdf-card-thumbnail';

interface SharedStudentMaterialCardProps {
  material: StudentMaterial;
  href: string;
  materiaNombre: string;
}

const EMPTY_ARTIFACTS: SharedStudentMaterialStudyArtifacts = {
  summary: false,
  glossary: false,
  flashcards: false,
  exercises: false,
  count: 0,
  complete: false,
};

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function SharedStudentMaterialCard({
  material,
  href,
  materiaNombre,
}: SharedStudentMaterialCardProps) {
  const [copied, setCopied] = useState(false);
  const enrichedMaterial = material as StudentMaterial & {
    study_artifacts?: SharedStudentMaterialStudyArtifacts;
  };
  const artifacts = enrichedMaterial.study_artifacts ?? EMPTY_ARTIFACTS;
  const fileSize = formatBytes(material.file_size_bytes);
  const pagesLabel = material.page_count ? `${material.page_count} páginas` : 'PDF';
  const isComplete = artifacts.complete;

  const featureItems = [
    { label: 'Resumen', icon: BookOpen, available: artifacts.summary },
    { label: 'Glosario', icon: List, available: artifacts.glossary },
    { label: 'Flashcards', icon: Layers3, available: artifacts.flashcards },
    { label: 'Ejercicios', icon: Zap, available: artifacts.exercises },
  ];

  const shareMaterial = async () => {
    const url = new URL(href, window.location.origin).toString();
    const text = `Te comparto ${material.title} de ${materiaNombre} en Evaluo.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: material.title, text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Share student material error:', error);
    }
  };

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#C7D2FE] bg-white p-4 shadow-[0_16px_42px_rgba(37,99,235,0.07)] sm:p-5">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_178px] md:items-stretch">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-slate-100 bg-white shadow-[0_8px_22px_rgba(37,99,235,0.08)]">
              <Sparkles className="h-7 w-7 text-[#2563EB]" />
            </div>
            <div className="min-w-0 pt-0.5">
              <span className="inline-flex rounded-full border border-[#AFC1FF] bg-white px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2563EB] sm:text-[10px]">
                {isComplete ? 'Material de estudio completo' : 'Material de estudio'}
              </span>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {pagesLabel} · PDF
              </p>
            </div>
          </div>

          <h3 className="mt-4 line-clamp-2 text-[20px] font-black leading-[1.08] tracking-[-0.035em] text-slate-900 sm:text-[22px]">
            {material.title}
          </h3>

          <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.17em] text-slate-400">
            Incluye para estudiar
          </p>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {featureItems.map(({ label, icon: Icon, available }) => (
              <div
                key={label}
                className={`flex min-h-12 items-center gap-2 rounded-[13px] border px-2.5 py-2 text-[11px] font-semibold sm:text-xs ${
                  available
                    ? 'border-slate-200 bg-white text-slate-700 shadow-[0_5px_14px_rgba(15,23,42,0.04)]'
                    : 'border-slate-100 bg-slate-50/70 text-slate-400'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${available ? 'text-[#2563EB]' : 'text-slate-300'}`}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-[9px] font-black text-[#4F5DFF]">
                  EV
                </div>
                <span>Compartido por un estudiante</span>
              </div>
              <span>{formatDate(material.created_at)}</span>
            </div>
          </div>

          <Link
            href={href}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-between rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 py-3 text-sm font-bold text-white shadow-[0_9px_22px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
          >
            <span>Estudiar este apunte</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => void shareMaterial()}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[13px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copied ? 'Link copiado' : 'Compartir'}
          </button>
        </div>

        <aside className="order-last flex min-w-0 flex-col rounded-[19px] border border-slate-200 bg-[#F7F9FD] p-2.5">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Vista previa del PDF
            </span>
            <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-slate-500 shadow-sm">
              1 / {material.page_count || '—'}
            </span>
          </div>

          <div className="flex min-h-[238px] flex-1 items-start justify-center overflow-hidden rounded-[14px] bg-[#EEF3FA] p-2">
            <PdfCardThumbnail
              resourcePath={material.file_path}
              title={`Vista previa de ${material.title}`}
              variant="preview"
            />
          </div>

          <div className="mt-2.5 flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white p-2.5">
            <div className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-[8px] font-black text-rose-500">
              PDF
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-slate-600">{material.file_name}</p>
              <p className="mt-0.5 text-[9px] text-slate-400">{fileSize || pagesLabel}</p>
            </div>
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-emerald-500"
              aria-label="Archivo procesado"
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
