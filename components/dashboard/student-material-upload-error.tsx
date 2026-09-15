'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type StudentMaterialUploadConstraint =
  | {
      kind: 'pages';
      fileName: string;
      pageCount: number;
      maxPages: number;
    }
  | {
      kind: 'size';
      fileName: string;
      fileSizeBytes: number;
      maxSizeBytes: number;
    };

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StudentMaterialUploadErrorScreen({
  constraint,
  onRetry,
  premiumHref = '/premium/mapa-mental?step=3',
}: {
  constraint: StudentMaterialUploadConstraint;
  onRetry?: () => void;
  premiumHref?: string;
}) {
  const isPageLimit = constraint.kind === 'pages';

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-lg">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-[-0.045em] text-slate-950 sm:text-2xl">
          {isPageLimit ? 'Este PDF supera el límite de Free' : 'Este archivo pesa demasiado'}
        </h2>
        <p className="mt-2 text-[13.5px] leading-6 text-slate-600">
          {isPageLimit
            ? `El archivo tiene ${constraint.pageCount} páginas y Free admite hasta ${constraint.maxPages}. Con Premium no hay límite de páginas por PDF.`
            : `El archivo pesa ${formatMegabytes(constraint.fileSizeBytes)} y el máximo permitido es ${formatMegabytes(constraint.maxSizeBytes)} por PDF.`}
        </p>

        <div className="mt-5 border-y border-slate-200 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">{constraint.fileName}</p>
              <p className="mt-1 text-[12.5px] text-slate-500">
                {isPageLimit
                  ? `${constraint.pageCount} páginas · ${constraint.maxPages} máximo en Free`
                  : `${formatMegabytes(constraint.fileSizeBytes)} · ${formatMegabytes(constraint.maxSizeBytes)} máximo`}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12.5px] leading-5 text-slate-500">
          {isPageLimit
            ? 'Premium elimina el límite de páginas. El archivo igualmente debe respetar el máximo técnico de 20 MB.'
            : 'El límite de 20 MB es técnico y aplica tanto a Free como a Premium. Probá con una versión más liviana o con otro archivo.'}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {isPageLimit ? (
            <Button asChild className="sm:flex-1">
              <Link href={premiumHref}>
                Continuar con Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          {onRetry ? (
            <Button
              type="button"
              variant={isPageLimit ? 'outline' : 'default'}
              className="sm:flex-1"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4" />
              Probar otro archivo
            </Button>
          ) : (
            <Button asChild variant={isPageLimit ? 'outline' : 'default'} className="sm:flex-1">
              <Link href="/dashboard/materiales?openUpload=1">
                <RefreshCw className="h-4 w-4" />
                Probar otro archivo
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
