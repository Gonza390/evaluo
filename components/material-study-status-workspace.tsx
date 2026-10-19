import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpenText,
  BrainCircuit,
  ChevronLeft,
  FileText,
  Layers3,
  Loader2,
  Map,
  SquareLibrary,
} from 'lucide-react';

type MaterialStudyStatusWorkspaceProps = {
  backHref: string;
  carreraName?: string;
  universidadName?: string;
  materiaName?: string;
  title: string;
  fileName: string;
  viewerUrl?: string;
  status: 'processing' | 'syncing' | 'failed';
  message: string;
  progress?: number | null;
  actions?: ReactNode;
};

const TABS = [
  { label: 'Resumen', icon: BookOpenText },
  { label: 'Glosario', icon: SquareLibrary },
  { label: 'Tarjetas', icon: Layers3 },
  { label: 'Examen', icon: BrainCircuit },
  { label: 'Mapa mental', icon: Map },
];

function MaterialMetadata({
  carreraName,
  universidadName,
  materiaName,
}: Pick<
  MaterialStudyStatusWorkspaceProps,
  'carreraName' | 'universidadName' | 'materiaName'
>) {
  return (
    <div className="grid min-w-0 gap-x-7 gap-y-3 sm:grid-cols-2 lg:min-w-[560px]">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Carrera</p>
        <p className="mt-1 text-[13.5px] font-semibold leading-5 text-slate-800 sm:text-sm">
          {carreraName || 'Carrera'}
        </p>
      </div>
      <div className="min-w-0 sm:border-l sm:border-slate-200 sm:pl-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Universidad</p>
        <p className="mt-1 text-[13.5px] font-semibold leading-5 text-slate-800 sm:text-sm">
          {universidadName || 'Universidad'}
        </p>
      </div>
      <div className="min-w-0 border-t border-slate-100 pt-3 sm:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Materia</p>
        <p className="mt-1 text-[13.5px] font-semibold leading-5 text-slate-800 sm:text-sm">
          {materiaName || 'Materia'}
        </p>
      </div>
    </div>
  );
}

export function MaterialStudyStatusWorkspace({
  backHref,
  carreraName,
  universidadName,
  materiaName,
  title,
  fileName,
  viewerUrl,
  status,
  message,
  progress,
  actions,
}: MaterialStudyStatusWorkspaceProps) {
  const failed = status === 'failed';
  const syncing = status === 'syncing';
  const safeProgress = syncing ? 100 : Math.min(100, Math.max(0, progress ?? 0));
  const statusTitle = failed
    ? 'El procesamiento se interrumpió'
    : syncing
      ? 'Estamos sincronizando el material'
      : 'Estamos preparando este material';

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-[#2563EB]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Link>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)] lg:items-end lg:gap-12">
            <div className="min-w-0">
              <h1 className="max-w-[720px] text-[1.9rem] font-bold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-[2.2rem] lg:text-[2.35rem]">
                {title}
              </h1>
            </div>
            <MaterialMetadata
              carreraName={carreraName}
              universidadName={universidadName}
              materiaName={materiaName}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.10)] xl:min-h-[660px] xl:rounded-[28px]">
          <div className="flex flex-col gap-2.5 border-b border-slate-200 px-2.5 py-3 sm:px-4 sm:py-4">
            <div className="flex w-full gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ label, icon: Icon }, index) => (
                <div
                  key={label}
                  className={`inline-flex h-8 flex-none items-center gap-1.5 rounded-[13px] border px-2.5 text-[12px] sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px] ${
                    index === 0
                      ? 'border-[#BFDBFE] bg-[#EEF4FF] text-[#2563EB]'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {viewerUrl ? (
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-[13px] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  PDF
                </a>
              ) : null}
            </div>
          </div>

          <div className="p-3 sm:p-4 xl:flex xl:min-h-[560px] xl:items-center xl:justify-center">
            <div className="mx-auto w-full max-w-2xl rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:p-6">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ${
                    failed ? 'bg-red-50 text-red-500' : 'bg-[#EEF4FF] text-[#2563EB]'
                  }`}
                >
                  {failed ? <FileText className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {fileName}
                  </p>
                  <h2 className="mt-1.5 text-[1.15rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.3rem]">
                    {statusTitle}
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">{message}</p>
                </div>
              </div>

              {!failed ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Preparando tu espacio de estudio</span>
                    <span>{safeProgress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)] transition-[width] duration-500"
                      style={{ width: `${safeProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
