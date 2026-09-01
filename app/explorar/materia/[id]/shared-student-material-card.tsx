'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BookOpenText,
  BrainCircuit,
  Check,
  ChevronRight,
  Download,
  Layers3,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { SharedStudentMaterial } from '@/lib/data/student-materials';
import { getStudentMaterialRoute } from '@/lib/routes';
import { pushRecentResource } from '@/lib/dashboard-client';
import { trackMateriaAnalyticsEvent } from '@/lib/materia-analytics';
import { PdfCardThumbnail } from '@/components/materia/pdf-card-thumbnail';

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

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function getPublicMaterialUrl(materialHref: string) {
  return new URL(materialHref, 'https://evaluo.com.ar').toString();
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function SharedStudentMaterialCard({
  material,
  materiaId,
  materiaNombre,
  onOpen,
}: SharedStudentMaterialCardProps) {
  const materialHref = getStudentMaterialRoute(material.id);
  const downloadHref = `/api/student-materials/${material.id}/download`;
  const dateLabel = formatDate(material.created_at);
  const fileSizeLabel = formatBytes(material.file_size_bytes);
  const isEnriched = material.study_artifacts?.count >= 3;
  const isComplete = material.study_artifacts?.complete;
  const [uploaderName, setUploaderName] = useState('Estudiante');
  const [shareCopied, setShareCopied] = useState(false);

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

  const handleShare = async () => {
    const publicUrl = getPublicMaterialUrl(materialHref);
    const shareData = {
      title: material.title,
      text: `Mirá este apunte de ${materiaNombre} en Evaluo.`,
      url: publicUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await copyText(publicUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      window.prompt('Copiá este enlace para compartir el PDF:', publicUrl);
    }
  };

  const handleOpen = () => {
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
  };

  const handleDownload = () => {
    void trackMateriaAnalyticsEvent('student_material_download_clicked', {
      materiaId,
      metadata: {
        material_id: material.id,
        material_title: material.title,
        source: 'materia_shared_material_card',
      },
    });
  };

  return (
    <article
      className={`h-full min-w-0 max-w-full overflow-hidden rounded-[24px] border bg-white p-3.5 transition duration-200 sm:p-4 ${
        isEnriched
          ? 'border-[#BFCBFF] shadow-[0_14px_34px_rgba(37,99,235,0.07)] hover:border-[#91AAFF] hover:shadow-[0_18px_40px_rgba(37,99,235,0.10)]'
          : 'border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.05)] hover:border-slate-300'
      }`}
    >
      <div className="grid h-full w-full min-w-0 max-w-full gap-3.5 md:grid-cols-[minmax(0,1fr)_148px] md:items-stretch">
        <div className="flex h-full min-w-0 max-w-full flex-col">
          <div className="flex min-w-0 items-baseline">
            <span
              className={`min-w-0 text-[9px] font-extrabold uppercase leading-4 tracking-[0.14em] ${
                isEnriched ? 'text-[#2563EB]' : 'text-emerald-700'
              }`}
            >
              {isComplete
                ? 'Material de estudio completo'
                : isEnriched
                  ? 'Apunte enriquecido'
                  : 'Apunte de estudiante'}
            </span>
          </div>

          <h3 className="mt-2.5 min-h-[44px] line-clamp-2 [overflow-wrap:anywhere] text-[18px] font-black leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-[20px]">
            {material.title}
          </h3>

          <p className="mt-3.5 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Incluye para estudiar
          </p>

          <div className="mt-2 grid min-w-0 grid-cols-2 gap-1.5">
            {ARTIFACTS.map(({ key, label, icon: Icon }) => {
              const available = Boolean(material.study_artifacts?.[key]);
              return (
                <div
                  key={key}
                  className={`flex min-h-10 min-w-0 items-center gap-1.5 rounded-[11px] border px-2 py-1.5 text-[10px] font-semibold sm:text-[11px] ${
                    available
                      ? 'border-slate-200 bg-white text-slate-700 shadow-[0_4px_11px_rgba(15,23,42,0.035)]'
                      : 'border-slate-100 bg-slate-50/70 text-slate-400'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${available ? 'text-[#2563EB]' : 'text-slate-300'}`}
                  />
                  <span className="min-w-0 truncate">{label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto border-t border-slate-100 pt-2.5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-400">
              <span className="min-w-0 max-w-full truncate">
                Subido por <span className="font-semibold text-slate-600">{uploaderName}</span>
              </span>
              {dateLabel ? <span className="shrink-0 whitespace-nowrap">{dateLabel}</span> : null}
            </div>
          </div>

          <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_44px_44px] gap-2">
            <Link
              href={materialHref}
              onClick={handleOpen}
              className={`inline-flex min-h-11 min-w-0 w-full items-center justify-between rounded-[13px] px-3.5 py-2.5 text-[12px] font-bold transition ${
                isEnriched
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-[0_8px_18px_rgba(37,99,235,0.16)] hover:from-[#1D4ED8] hover:to-[#4F46E5]'
                  : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="min-w-0 truncate">{isEnriched ? 'Estudiar este apunte' : 'Abrir apunte'}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>

            <a
              href={downloadHref}
              onClick={handleDownload}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-slate-200 bg-white text-slate-600 transition hover:border-[#BFDBFE] hover:bg-[#F8FBFF] hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              aria-label={`Descargar ${material.title} con portada de Evaluo`}
              title="Descargar PDF"
            >
              <Download className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-slate-200 bg-white text-slate-600 transition hover:border-[#BFDBFE] hover:bg-[#F8FBFF] hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              aria-label={`Compartir ${material.title}`}
              title={shareCopied ? 'Enlace copiado' : 'Compartir PDF'}
            >
              {shareCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <aside className="order-last flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[17px] border border-slate-200 bg-[#F7F9FD] p-2">
          <div className="flex min-w-0 items-center justify-between gap-1.5 px-0.5 pb-1.5">
            <span className="min-w-0 truncate text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Vista previa
            </span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-slate-500 shadow-sm">
              1 / {material.page_count || '—'}
            </span>
          </div>

          <div className="flex min-h-[180px] w-full min-w-0 max-w-full flex-1 items-start justify-center overflow-hidden rounded-[12px] bg-[#EEF3FA] p-1.5 md:min-h-[192px]">
            <PdfCardThumbnail
              resourcePath={material.file_path}
              title={`Vista previa de ${material.title}`}
              variant="preview"
            />
          </div>

          <div className="mt-2 flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-[10px] border border-slate-200 bg-white p-2">
            <div className="flex h-7 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-[7px] font-black text-rose-500">
              PDF
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="max-w-full truncate text-[9px] font-semibold text-slate-600">{material.file_name}</p>
              <p className="mt-0.5 truncate text-[8px] text-slate-400">
                {fileSizeLabel || (material.page_count ? `${material.page_count} páginas` : 'Documento PDF')}
              </p>
            </div>
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
              aria-label="Archivo procesado"
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
