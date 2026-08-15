'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenText,
  BrainCircuit,
  Clock3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Map,
  MessageSquare,
  Sparkles,
  SquareLibrary,
} from 'lucide-react';
import PdfViewer from '@/components/PdfViewer';
import { MaterialFeedback } from '@/components/material-feedback';
import { regenerateStudentMaterialStudyAction } from '@/app/dashboard/materiales/actions';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';

type MaterialStudyWorkspaceProps = {
  backHref: string;
  carreraName: string;
  fileName: string;
  canRegenerate: boolean;
  materialId: string;
  isOwner: boolean;
  materiaName: string;
  pageCount: number | null;
  title: string;
  universidadName: string;
  viewerUrl: string;
  visibility: 'private' | 'shared';
  studyGlossary: StudyGlossaryItem[];
  studySummary: StudentMaterialSummary;
};

type StudyTabId = 'resumen' | 'glosario' | 'tarjetas' | 'ejercicios' | 'mapa';

const STUDY_TABS: Array<{
  id: StudyTabId;
  label: string;
  icon: typeof BookOpenText;
}> = [
  { id: 'resumen', label: 'Resumen', icon: BookOpenText },
  { id: 'glosario', label: 'Glosario', icon: SquareLibrary },
  { id: 'tarjetas', label: 'Tarjetas', icon: Sparkles },
  { id: 'ejercicios', label: 'Ejercicios', icon: BrainCircuit },
  { id: 'mapa', label: 'Mapa mental', icon: Map },
];

function WorkspaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'surface-card rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:p-[1.05rem]',
        className
      )}
    >
      {children}
    </div>
  );
}

function StudyDocumentShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card rounded-[20px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        <section className="space-y-1.5">
          <h2 className="text-[1.12rem] font-bold tracking-[-0.04em] text-slate-950">{title}</h2>
          {description ? <p className="text-[13px] leading-6 text-slate-500">{description}</p> : null}
        </section>
        <div className="h-px bg-slate-200" />
        {children}
      </div>
    </div>
  );
}

function StudyDocumentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[1.02rem] font-bold tracking-[-0.03em] text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StructuredSectionBody({ body }: { body: string }) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: Array<{ columns: string[] }> = [];
  let isCollectingTable = false;
  const content: React.ReactNode[] = [];

  const flushTable = (key: string) => {
    if (rows.length < 2) {
      rows.length = 0;
      return;
    }

    const header = rows[0]?.columns ?? [];
    const bodyRows = rows.slice(1).filter((row) =>
      row.columns.some((column) => !/^:?-+:?$/i.test(column))
    );

    if (header.length === 0 || bodyRows.length === 0) {
      rows.length = 0;
      return;
    }

    content.push(
      <div key={key} className="overflow-x-auto rounded-[16px] border border-slate-200">
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {header.map((column, index) => (
                <th key={`${column}-${index}`} className="border-b border-slate-200 px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={`${row.columns.join('|')}-${rowIndex}`} className="bg-white">
                {row.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="border-t border-slate-200 px-3 py-2 align-top text-slate-600"
                  >
                    {column}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    rows.length = 0;
  };

  lines.forEach((line, index) => {
    if (line.includes('|')) {
      isCollectingTable = true;
      rows.push({
        columns: line
          .split('|')
          .map((column) => column.trim())
          .filter(Boolean),
      });
      return;
    }

    if (isCollectingTable) {
      flushTable(`table-${index}`);
      isCollectingTable = false;
    }

    if (/^\d+\.\d+\s+/.test(line)) {
      content.push(
        <h5 key={`subheading-${index}`} className="pt-1 text-[0.95rem] font-semibold text-slate-950">
          {line}
        </h5>
      );
      return;
    }

    if (/^[•\-]\s+/.test(line)) {
      content.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 text-[13.5px] leading-6 text-slate-700">
          <span className="mt-[0.42rem] text-[10px] text-[#2563EB]">•</span>
          <p>{line.replace(/^[•\-]\s+/, '')}</p>
        </div>
      );
      return;
    }

    if (/^Importante:/i.test(line)) {
      content.push(
        <div
          key={`important-${index}`}
          className="rounded-[16px] border border-[#DBEAFE] bg-[#F8FBFF] px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-[#2563EB]">Importante:</span>{' '}
          {line.replace(/^Importante:\s*/i, '')}
        </div>
      );
      return;
    }

    content.push(
      <p key={`paragraph-${index}`} className="text-[13.5px] leading-6 text-slate-700">
        {line}
      </p>
    );
  });

  if (isCollectingTable) {
    flushTable('table-final');
  }

  return <div className="space-y-3">{content}</div>;
}

function StructuredSectionBodyEnhanced({ body }: { body: string }) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: Array<{ columns: string[] }> = [];
  let isCollectingTable = false;
  const content: React.ReactNode[] = [];

  const flushTable = (key: string) => {
    if (rows.length < 2) {
      rows.length = 0;
      return;
    }

    const header = rows[0]?.columns ?? [];
    const bodyRows = rows.slice(1).filter((row) =>
      row.columns.some((column) => !/^:?-+:?$/i.test(column))
    );

    if (header.length === 0 || bodyRows.length === 0) {
      rows.length = 0;
      return;
    }

    content.push(
      <div key={key} className="overflow-x-auto rounded-[16px] border border-slate-200">
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {header.map((column, index) => (
                <th key={`${column}-${index}`} className="border-b border-slate-200 px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={`${row.columns.join('|')}-${rowIndex}`} className="bg-white">
                {row.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="border-t border-slate-200 px-3 py-2 align-top text-slate-600"
                  >
                    {column}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    rows.length = 0;
  };

  lines.forEach((line, index) => {
    if (line.includes('|')) {
      isCollectingTable = true;
      rows.push({
        columns: line
          .split('|')
          .map((column) => column.trim())
          .filter(Boolean),
      });
      return;
    }

    if (isCollectingTable) {
      flushTable(`table-${index}`);
      isCollectingTable = false;
    }

    if (/^\d+\.\d+\s+/.test(line)) {
      content.push(
        <h5 key={`subheading-${index}`} className="pt-1 text-[0.95rem] font-semibold text-slate-950">
          {line}
        </h5>
      );
      return;
    }

    if (/^(?:[\u2022\-])\s+/.test(line)) {
      content.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 text-[13.5px] leading-6 text-slate-700">
          <span className="mt-[0.42rem] text-[10px] text-[#2563EB]">•</span>
          <p>{line.replace(/^(?:[\u2022\-])\s+/, '')}</p>
        </div>
      );
      return;
    }

    if (/^Importante:/i.test(line)) {
      content.push(
        <div
          key={`important-${index}`}
          className="rounded-[16px] border border-[#DBEAFE] bg-[#F8FBFF] px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-[#2563EB]">Importante:</span>{' '}
          {line.replace(/^Importante:\s*/i, '')}
        </div>
      );
      return;
    }

    if (/^Clave de estudio:/i.test(line)) {
      content.push(
        <div
          key={`study-tip-${index}`}
          className="rounded-[16px] border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-amber-700">Clave de estudio:</span>{' '}
          {line.replace(/^Clave de estudio:\s*/i, '')}
        </div>
      );
      return;
    }

    if (/^Ejemplo aplicado:/i.test(line)) {
      content.push(
        <div
          key={`example-${index}`}
          className="rounded-[16px] border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-emerald-700">Ejemplo aplicado:</span>{' '}
          {line.replace(/^Ejemplo aplicado:\s*/i, '')}
        </div>
      );
      return;
    }

    content.push(
      <p key={`paragraph-${index}`} className="text-[13.5px] leading-6 text-slate-700">
        {line}
      </p>
    );
  });

  if (isCollectingTable) {
    flushTable('table-final');
  }

  return <div className="space-y-3">{content}</div>;
}

export function MaterialStudyWorkspace({
  backHref,
  canRegenerate,
  carreraName,
  fileName,
  materialId,
  isOwner: _isOwner,
  materiaName,
  pageCount: _pageCount,
  title,
  universidadName,
  viewerUrl,
  visibility: _visibility,
  studyGlossary,
  studySummary,
}: MaterialStudyWorkspaceProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStageIndex, setRegenerationStageIndex] = useState(0);
  const [regenerationProgress, setRegenerationProgress] = useState(8);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1280) {
      setIsViewerVisible(false);
    }
  }, []);

  const flashcardsPreview = useMemo(
    () => [
      {
        front: 'Pregunta o concepto',
        back: 'Respuesta corta basada en un chunk del PDF.',
      },
      {
        front: 'Definición importante',
        back: 'Explicación breve más referencia a la sección original.',
      },
      {
        front: 'Repaso rápido',
        back: 'Formato ideal para memoria activa y estudio espaciado.',
      },
    ],
    []
  );

  const exercisesPreview = useMemo(
    () => [
      {
        title: 'Multiple choice',
        description: 'Podemos generar preguntas con opciones y explicación de la correcta.',
      },
      {
        title: 'Respuesta abierta',
        description: 'Sirve para practicar desarrollo, oral o recuperacion libre del tema.',
      },
      {
        title: 'Mini parcial',
        description: 'Agrupa preguntas por unidad o por dificultad a partir del mismo PDF.',
      },
    ],
    []
  );

  const fullSummarySections = useMemo(() => {
    if (studySummary.sections.length > 0) {
      return studySummary.sections;
    }

    return studySummary.keyPoints.slice(0, 4).map((point, index) => ({
      title: `Tema ${index + 1}`,
      body: point,
    }));
  }, [studySummary.keyPoints, studySummary.sections]);

  const handleComments = () => {
    setCommentsOpen((current) => !current);
  };

  useEffect(() => {
    if (!isRegenerating) {
      setRegenerationStageIndex(0);
      setRegenerationProgress(8);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(92, 8 + Math.floor(elapsed / 1800) * 7);
      setRegenerationProgress(nextProgress);

      if (elapsed > 3_500) {
        setRegenerationStageIndex(1);
      }
      if (elapsed > 8_000) {
        setRegenerationStageIndex(2);
      }
      if (elapsed > 14_000) {
        setRegenerationStageIndex(3);
      }
    }, 700);

    return () => window.clearInterval(timer);
  }, [isRegenerating]);

  const handleRegenerate = () => {
    setIsRegenerating(true);

    void (async () => {
      const result = await regenerateStudentMaterialStudyAction(materialId);

      toast({
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

      setRegenerationProgress(result.success ? 100 : regenerationProgress);
      if (result.success) {
        setRegenerationStageIndex(4);
      }

      setIsRegenerating(false);
      router.refresh();
    })();
  };

  const regenerationStages = [
    ['uploaded', 'Preparando material'],
    ['extracting', 'Extrayendo texto y estructura'],
    ['summarizing', 'Generando resumen'],
    ['glossary', 'Generando glosario'],
    ['ready', 'Material listo'],
  ] as const;

  const estimatedTimeLabel =
    regenerationStageIndex >= 3 ? 'menos de 1 minuto' : regenerationStageIndex >= 1 ? '1 a 2 minutos' : '2 minutos';

  const content = (
    <Tabs defaultValue="resumen" className="flex h-full min-w-0 flex-col gap-2.5 overflow-x-hidden">
      <div className="flex flex-col gap-2.5 border-b border-slate-200 px-2.5 py-3 sm:px-4 sm:py-4">
        <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-[18px] bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STUDY_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-8 shrink-0 flex-none rounded-[13px] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-500 shadow-none data-[state=active]:border-[#BFDBFE] data-[state=active]:bg-[#EEF4FF] data-[state=active]:text-[#2563EB] data-[state=active]:shadow-none sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsViewerVisible((current) => !current)}
              className="h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-slate-50 sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
            >
              {isViewerVisible ? <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              {isViewerVisible ? 'Ocultar PDF' : 'Mostrar PDF'}
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-slate-50 sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
            >
              <a href={viewerUrl} target="_blank" rel="noreferrer">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                PDF
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleComments}
              className="h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-slate-50 sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Calificar
            </Button>
            {canRegenerate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-slate-50 sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isRegenerating ? 'Regenerando...' : 'Regenerar'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {isRegenerating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
            <div className="bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_40%,#EEF4FF_100%)] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#F59E0B] text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[1.2rem] font-bold tracking-[-0.05em] text-slate-950">
                    Estamos regenerando tu material
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{fileName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span>Progreso</span>
                  <span>{Math.min(100, regenerationProgress)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)] transition-[width] duration-500"
                    style={{ width: `${Math.min(100, regenerationProgress)}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                {regenerationStages.map(([stageId, label], index) => {
                  const isActive = regenerationStageIndex === index;
                  const isDone = regenerationStageIndex > index;

                  return (
                    <div key={stageId} className="flex items-center justify-between gap-3 text-[13px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isDone ? 'bg-emerald-500' : isActive ? 'bg-[#F59E0B]' : 'bg-slate-300'
                          }`}
                        />
                        <span className={isActive ? 'font-semibold text-slate-950' : 'text-slate-600'}>{label}</span>
                      </div>
                      {isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F59E0B]" /> : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] px-3 py-1 text-[#2563EB]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Tiempo estimado restante: {estimatedTimeLabel}
                </span>
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <p className="text-[13px] font-semibold text-slate-950">
                  {regenerationStages[Math.min(regenerationStageIndex, regenerationStages.length - 1)]?.[1]}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-5 text-slate-500">
                  Podés dejar esta ventana abierta mientras armamos nuevamente el resumen y el glosario del PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 sm:px-4 sm:pb-4">
        {commentsOpen ? (
          <WorkspaceCard className="mb-3 border-[#BFDBFE] bg-[#F8FBFF]">
            <MaterialFeedback materialId={materialId} />
          </WorkspaceCard>
        ) : null}

        <TabsContent value="resumen" className="animate-tab-panel">
          <StudyDocumentShell title={fileName}>
            <StudyDocumentSection title="Resumen breve">
              <p className="text-[14px] leading-6 text-slate-700">{studySummary.shortSummary}</p>
            </StudyDocumentSection>

            <div className="h-px bg-slate-200" />

            <StudyDocumentSection title="Puntos clave">
              <ul className="space-y-2.5 pl-5 text-[14px] leading-6 text-slate-700">
                {studySummary.keyPoints.slice(0, 5).map((point) => (
                  <li key={point} className="list-disc marker:text-[#2563EB]">
                    {point}
                  </li>
                ))}
              </ul>
            </StudyDocumentSection>

            <div className="h-px bg-slate-200" />

            <section className="space-y-4">
              {fullSummarySections.length > 0 ? (
                fullSummarySections.map((section, index) => (
                  <div key={`${section.title}:${section.body}`} className="space-y-3">
                    <h3 className="text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950">{section.title}</h3>
                    <StructuredSectionBodyEnhanced body={section.body} />
                    {index < fullSummarySections.length - 1 ? <div className="h-px bg-slate-200" /> : null}
                  </div>
                ))
              ) : (
                <p className="text-[14px] leading-6 text-slate-500">
                  Todavía no pudimos organizar el contenido por temas claros dentro del texto extraído del PDF.
                </p>
              )}
            </section>
          </StudyDocumentShell>
        </TabsContent>

        <TabsContent value="glosario" className="animate-tab-panel">
          <StudyDocumentShell
            title="Glosario del documento"
            description="Términos y conceptos detectados desde el contenido del PDF para estudiar con más precisión."
          >
            {studyGlossary.length > 0 ? (
              <div className="overflow-hidden rounded-[18px] border border-slate-200">
                <div className="hidden grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)] gap-6 border-b border-slate-200 bg-slate-50 px-4 py-3 md:grid">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Término</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Definición</p>
                </div>
                <div className="divide-y divide-slate-200 bg-white">
                {studyGlossary.map((item) => (
                  <article
                    key={item.term}
                    className="grid gap-2.5 px-3.5 py-3.5 md:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)] md:gap-6 md:px-4 md:py-4"
                  >
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:hidden">
                        Término
                      </p>
                      <h3 className="text-[0.92rem] font-semibold tracking-[-0.03em] text-slate-950 md:text-[0.98rem]">
                        {item.term}
                      </h3>
                      {item.englishTerm ? (
                        <p className="text-[12px] font-medium italic text-slate-500">
                          {item.englishTerm}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:hidden">
                        Definición
                      </p>
                      <p className="text-[13px] leading-5 text-slate-700 md:text-[13.5px] md:leading-6">{item.definition}</p>
                      <p className="text-[11.5px] leading-5 text-slate-500 md:text-[12px]">
                        <span className="font-semibold text-slate-500">Contexto:</span> {item.context}
                      </p>
                    </div>
                  </article>
                ))}
                </div>
              </div>
            ) : (
              <p className="text-[14px] leading-6 text-slate-500">
                Todavía no pudimos detectar un glosario claro a partir de este PDF.
              </p>
            )}
          </StudyDocumentShell>
        </TabsContent>

        <TabsContent value="tarjetas" className="animate-tab-panel">
          <StudyDocumentShell
            title="Tarjetas de estudio"
            description="La idea es guardar tarjetas por PDF, con dificultad, tema y referencia al chunk que las origino."
          >
            <div className="space-y-4">
              {flashcardsPreview.map((card, index) => (
                <article key={card.front} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF4FF] text-xs font-bold text-[#2563EB]">
                      {index + 1}
                    </div>
                    <h3 className="text-[0.98rem] font-semibold text-slate-950">{card.front}</h3>
                  </div>
                  <p className="text-[13.5px] leading-6 text-slate-700">{card.back}</p>
                  {index < flashcardsPreview.length - 1 ? <div className="h-px bg-slate-200" /> : null}
                </article>
              ))}
            </div>
          </StudyDocumentShell>
        </TabsContent>

        <TabsContent value="ejercicios" className="animate-tab-panel">
          <StudyDocumentShell
            title="Ejercicios y práctica"
            description="Este panel queda listo para multiple choice, preguntas abiertas y mini parciales generados desde el mismo PDF."
          >
            <div className="space-y-4">
              {exercisesPreview.map((exercise, index) => (
                <article key={exercise.title} className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF4FF] text-xs font-bold text-[#2563EB]">
                      {index + 1}
                    </div>
                    <h3 className="text-[0.98rem] font-semibold text-slate-950">{exercise.title}</h3>
                  </div>
                  <p className="text-[13.5px] leading-6 text-slate-700">{exercise.description}</p>
                  {index < exercisesPreview.length - 1 ? <div className="h-px bg-slate-200" /> : null}
                </article>
              ))}
            </div>
          </StudyDocumentShell>
        </TabsContent>

        <TabsContent value="mapa" className="animate-tab-panel">
          <StudyDocumentShell
            title="Mapa mental"
            description="Podemos traducir conceptos y relaciones del PDF a una vista visual navegable para repasar jerarquias y conexiones."
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_220px_1fr] xl:items-center">
              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rama 1</p>
                {['Conceptos base', 'Definiciones', 'Contexto de lectura'].map((item, index) => (
                  <div key={item} className="space-y-3">
                    <p className="text-[13px] font-medium text-slate-700">{item}</p>
                    {index < 2 ? <div className="h-px bg-slate-200" /> : null}
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-[#BFDBFE] bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.55),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] px-4 py-5 text-center shadow-[0_14px_32px_rgba(37,99,235,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]/80">Nodo central</p>
                <p className="mt-2.5 text-base font-semibold tracking-[-0.03em] text-slate-950">{title}</p>
                <p className="mt-1.5 text-[13px] leading-[1.45] text-slate-500">{materiaName}</p>
              </div>

              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rama 2</p>
                {['Preguntas posibles', 'Glosario derivado', 'Tarjetas relacionadas'].map((item, index) => (
                  <div key={item} className="space-y-3">
                    <p className="text-[13px] font-medium text-slate-700">{item}</p>
                    {index < 2 ? <div className="h-px bg-slate-200" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </StudyDocumentShell>
        </TabsContent>
      </div>
    </Tabs>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F7FB] text-slate-950">
      <section className="border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="text-2xl font-bold tracking-[-0.06em] text-slate-950 sm:text-[2rem]">{title}</h1>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 text-[12px] sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:text-[13px]">
              <p className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-slate-500 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0">
                <span className="block font-semibold uppercase tracking-[0.14em] text-slate-500 sm:inline">Carrera</span>
                <span className="mt-0.5 block font-semibold text-slate-900 sm:ml-2 sm:mt-0 sm:inline">{carreraName}</span>
              </p>
              <p className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-slate-500 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0">
                <span className="block font-semibold uppercase tracking-[0.14em] text-slate-500 sm:inline">Universidad</span>
                <span className="mt-0.5 block font-semibold text-slate-900 sm:ml-2 sm:mt-0 sm:inline">{universidadName}</span>
              </p>
              <p className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-slate-500 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0">
                <span className="block font-semibold uppercase tracking-[0.14em] text-slate-500 sm:inline">Materia</span>
                <span className="mt-0.5 block font-semibold text-slate-900 sm:ml-2 sm:mt-0 sm:inline">{materiaName}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="hidden xl:block">
          <div className="relative h-[calc(100vh-12rem)] min-h-[660px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel id="study-content-panel" order={1} defaultSize={isViewerVisible ? 60 : 100} minSize={42}>
                <div className="h-full min-w-0 bg-white">{content}</div>
              </ResizablePanel>
              {isViewerVisible ? <ResizableHandle withHandle className="bg-slate-200" /> : null}
              {isViewerVisible ? (
                <ResizablePanel id="study-viewer-panel" order={2} defaultSize={40} minSize={26}>
                  <div className="relative h-full min-w-0 bg-[#F8FAFC] p-2">
                    <button
                      type="button"
                      onClick={() => setIsViewerVisible(false)}
                      className="absolute left-0 top-1/2 z-20 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
                      aria-label="Ocultar PDF"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <PdfViewer
                      url={viewerUrl}
                      title={title}
                      subtitle={null}
                      className="h-full rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                      heightClassName="h-[calc(100vh-14.8rem)] min-h-[620px]"
                      pageMaxWidthClassName="max-w-[720px]"
                      showSidebarThumbnails={false}
                      theme="default"
                    />
                  </div>
                </ResizablePanel>
              ) : null}
            </ResizablePanelGroup>
            {!isViewerVisible ? (
              <button
                type="button"
                onClick={() => setIsViewerVisible(true)}
                className="absolute right-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
                aria-label="Mostrar PDF"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 xl:hidden">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
            {content}
          </div>
          {isViewerVisible ? (
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#F8FAFC] p-2 shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
              <button
                type="button"
                onClick={() => setIsViewerVisible(false)}
                className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
                aria-label="Ocultar PDF"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <PdfViewer
                url={viewerUrl}
                title={title}
                subtitle={null}
                className="rounded-[20px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                heightClassName="h-[58vh] sm:h-[62vh]"
                pageMaxWidthClassName="max-w-[760px]"
                showSidebarThumbnails={false}
                theme="default"
              />
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/80 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">PDF oculto</p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600">
                    Mostrá el documento cuando quieras contrastar el resumen con el archivo original.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewerVisible(true)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.10)] transition hover:bg-slate-50"
                  aria-label="Mostrar PDF"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
