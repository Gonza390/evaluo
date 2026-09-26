'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenText,
  BrainCircuit,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileText,
  ListTree,
  Loader2,
  Map,
  MessageSquare,
  Sparkles,
  SquareLibrary,
} from 'lucide-react';
import { MaterialFeedback } from '@/components/material-feedback';
import { StudyRichText } from '@/components/study-rich-text';
import { StudentMaterialDiagnostic } from '@/components/student-material-diagnostic';
import { StudentMaterialExam } from '@/components/student-material-exam';
import { StudentMaterialFlashcards } from '@/components/student-material-flashcards';
import { PremiumUpsell } from '@/components/premium/premium-upsell';
import { regenerateStudentMaterialStudyAction } from '@/app/dashboard/materiales/actions';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';
import {
  buildPedagogicalArtifacts,
  isPedagogicalGlossaryItem,
} from '@/lib/student-materials/pedagogy';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';

type MaterialStudyWorkspaceProps = {
  backHref: string;
  carreraName?: string;
  fileName: string;
  canRegenerate: boolean;
  isPremium: boolean;
  materialId: string;
  materiaId?: string;
  isOwner: boolean;
  materiaName?: string;
  pageCount: number | null;
  title: string;
  universidadName?: string;
  viewerUrl: string;
  visibility: 'private' | 'shared';
  studyGlossary: StudyGlossaryItem[];
  studySummary: StudentMaterialSummary;
  pedagogicalArtifacts?: PedagogicalArtifacts;
  initialDiagnostic?: boolean;
  initialTab?: StudyTabId;
  initialPdfPage?: number | null;
  initialViewerVisible?: boolean;
};

type StudyTabId = 'resumen' | 'glosario' | 'tarjetas' | 'ejercicios' | 'mapa';

const STUDY_TABS: Array<{
  id: StudyTabId;
  label: string;
  icon: typeof BookOpenText;
  premium?: boolean;
  featured?: boolean;
}> = [
  { id: 'resumen', label: 'Resumen', icon: BookOpenText },
  { id: 'ejercicios', label: 'Práctica', icon: BrainCircuit, featured: true },
  { id: 'tarjetas', label: 'Tarjetas', icon: Sparkles },
  { id: 'glosario', label: 'Glosario', icon: SquareLibrary },
  { id: 'mapa', label: 'Mapa mental', icon: Map, premium: true },
];

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center px-4 py-16 text-sm font-medium">
      Cargando visor del PDF...
    </div>
  ),
});

function WorkspaceCard({ children, className }: { children: React.ReactNode; className?: string }) {
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
          {description ? (
            <p className="text-[13px] leading-6 text-slate-500">{description}</p>
          ) : null}
        </section>
        <div className="h-px bg-white" />
        {children}
      </div>
    </div>
  );
}

function StudyDocumentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[1.02rem] font-bold tracking-[-0.03em] text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function cleanSummaryChapterTitle(value: string) {
  return value
    .replace(/^\s*\d+(?:\.\d+)*[.)]?\s*/u, '')
    .replace(/^presentaci[oó]n\s+de\s+(?:la\s+)?asignatura\s+/iu, '')
    .trim();
}

function buildSummaryChapterAnchor(index: number, value: string) {
  const slug = cleanSummaryChapterTitle(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 60);

  return `capitulo-${index + 1}${slug ? `-${slug}` : ''}`;
}

function MaterialMetadata({
  carreraName,
  universidadName,
  materiaName,
}: {
  carreraName?: string;
  universidadName?: string;
  materiaName?: string;
}) {
  if (!carreraName && !universidadName && !materiaName) return null;

  return (
    <div className="grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-2 lg:min-w-[620px] lg:grid-cols-3">
      {carreraName ? (
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Carrera</p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-5 text-slate-800 sm:text-[13px]">
            {carreraName}
          </p>
        </div>
      ) : null}

      {universidadName ? (
        <div className="min-w-0 sm:border-l sm:border-slate-200 sm:pl-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Universidad
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-5 text-slate-800 sm:text-[13px]">
            {universidadName}
          </p>
        </div>
      ) : null}

      {materiaName ? (
        <div className="min-w-0 border-t border-slate-100 pt-2 sm:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l lg:border-slate-200 lg:pt-0 lg:pl-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Materia</p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-5 text-slate-800 sm:text-[13px]">
            {materiaName}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function MaterialStudyWorkspace({
  backHref,
  canRegenerate,
  carreraName,
  fileName,
  isPremium,
  materialId,
  materiaId,
  isOwner: _isOwner,
  materiaName,
  pageCount: _pageCount,
  title,
  universidadName,
  viewerUrl,
  visibility: _visibility,
  studyGlossary,
  studySummary,
  pedagogicalArtifacts,
  initialDiagnostic = false,
  initialTab,
  initialPdfPage = null,
  initialViewerVisible: _initialViewerVisible = false,
}: MaterialStudyWorkspaceProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StudyTabId>(
    initialDiagnostic ? 'ejercicios' : (initialTab ?? 'resumen')
  );
  const [diagnosticMode, setDiagnosticMode] = useState(initialDiagnostic);
  const [diagnosticReviewTopics, setDiagnosticReviewTopics] = useState<string[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStageIndex, setRegenerationStageIndex] = useState(0);
  const [regenerationProgress, setRegenerationProgress] = useState(8);

  const studyArtifacts = useMemo(
    () =>
      pedagogicalArtifacts ??
      buildPedagogicalArtifacts({ summary: studySummary, glossary: studyGlossary }),
    [pedagogicalArtifacts, studyGlossary, studySummary]
  );

  const usefulGlossary = useMemo(
    () => studyGlossary.filter(isPedagogicalGlossaryItem),
    [studyGlossary]
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

  const summaryChapters = useMemo(
    () =>
      fullSummarySections.map((section, index) => ({
        ...section,
        displayTitle: cleanSummaryChapterTitle(section.title) || `Capítulo ${index + 1}`,
        anchor: buildSummaryChapterAnchor(index, section.title),
      })),
    [fullSummarySections]
  );

  const handleComments = () => {
    setCommentsOpen((current) => !current);
  };

  const handleStudyTabChange = (value: string) => {
    const nextTab = value as StudyTabId;
    setActiveTab(nextTab);

    if (nextTab !== 'resumen') {
      setIsViewerVisible(false);
      setCommentsOpen(false);
    }
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

      if (elapsed > 3_500) setRegenerationStageIndex(1);
      if (elapsed > 8_000) setRegenerationStageIndex(2);
      if (elapsed > 14_000) setRegenerationStageIndex(3);
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
      if (result.success) setRegenerationStageIndex(4);

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
    regenerationStageIndex >= 3
      ? 'menos de 1 minuto'
      : regenerationStageIndex >= 1
        ? '1 a 2 minutos'
        : '2 minutos';

  const tabHeader = (
    <div className="flex flex-col gap-2.5 border-b border-slate-200 px-2.5 py-3 sm:px-4 sm:py-4">
      <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-[18px] bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STUDY_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'h-8 flex-none shrink-0 rounded-[13px] border bg-white px-2.5 text-[12px] shadow-none data-[state=active]:border-[#BFDBFE] data-[state=active]:bg-[#EEF4FF] data-[state=active]:text-[#2563EB] data-[state=active]:shadow-none sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]',
                tab.featured
                  ? 'border-indigo-200 bg-indigo-50/55 font-semibold text-indigo-700'
                  : 'border-slate-200 text-slate-500'
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {tab.label}
              {tab.premium ? (
                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-[#EEF4FF] px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.08em] text-[#2563EB] uppercase sm:text-[10px]">
                  <Crown className="h-2.5 w-2.5" />
                  Premium
                </span>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {activeTab === 'resumen' ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsViewerVisible((current) => !current)}
            className="h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-slate-50 sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-[13px]"
          >
            {isViewerVisible ? (
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
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
      ) : null}
    </div>
  );

  const regenerationOverlay = isRegenerating ? (
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
            <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
              <span>Progreso</span>
              <span>{Math.min(100, regenerationProgress)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)] transition-[width] duration-500"
                style={{ width: `${Math.min(100, regenerationProgress)}%` }}
              />
            </div>
          </div>

          <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
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
                    <span className={isActive ? 'font-semibold text-slate-950' : 'text-slate-600'}>
                      {label}
                    </span>
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
  ) : null;

  const tabPanels = (
    <div
      role="region"
      aria-label="Contenido de estudio"
      tabIndex={0}
      className="px-2.5 pb-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset sm:px-4 sm:pb-4 xl:h-full xl:overflow-y-auto"
    >
      {commentsOpen && activeTab === 'resumen' ? (
        <WorkspaceCard className="mb-3 border-[#BFDBFE] bg-white">
          <MaterialFeedback materialId={materialId} />
        </WorkspaceCard>
      ) : null}

      <TabsContent value="resumen" className="animate-tab-panel">
        <div className="mx-auto w-full max-w-[1180px] py-1 sm:py-2">
          <header className="border-b border-slate-200 pb-7 sm:pb-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[10.5px] font-extrabold tracking-[0.18em] text-[#2563EB] uppercase">
                Guía de estudio
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-[11.5px] font-medium text-slate-400">{fileName}</span>
            </div>

            <h2 className="mt-3 max-w-[820px] text-[1.75rem] font-bold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:text-[2.15rem]">
              {title}
            </h2>

            <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-slate-600 sm:text-[15px] sm:leading-7">
              {studySummary.shortSummary}
            </p>

            {diagnosticReviewTopics.length > 0 ? (
              <div className="mt-6 border-l-2 border-[#2563EB] pl-3.5">
                <p className="text-[10.5px] font-bold tracking-[0.14em] text-[#2563EB] uppercase">
                  Según tu diagnóstico
                </p>
                <p className="mt-1 text-[13.5px] font-semibold text-slate-900">
                  Empezá por {diagnosticReviewTopics[0]}
                </p>
              </div>
            ) : null}
          </header>

          {summaryChapters.length > 0 ? (
            <details className="group mt-5 rounded-[16px] border border-slate-200 bg-slate-50/55 px-4 py-3 xl:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-slate-800">
                <span className="inline-flex items-center gap-2">
                  <ListTree className="h-4 w-4 text-[#2563EB]" />
                  Índice del resumen
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {summaryChapters.length} capítulos
                </span>
              </summary>
              <nav className="mt-3 border-t border-slate-200 pt-3" aria-label="Índice del resumen">
                <ol className="space-y-1">
                  {summaryChapters.map((chapter, index) => (
                    <li key={chapter.anchor}>
                      <a
                        href={`#${chapter.anchor}`}
                        className="flex items-start gap-2.5 rounded-lg px-1 py-1.5 text-[12.5px] leading-5 text-slate-600 transition hover:text-[#2563EB]"
                      >
                        <span className="mt-0.5 min-w-5 font-bold tabular-nums text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{chapter.displayTitle}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>
          ) : null}

          <div className="mt-7 xl:grid xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start xl:gap-10 2xl:grid-cols-[300px_minmax(0,1fr)] 2xl:gap-12">
            {summaryChapters.length > 0 ? (
              <aside className="sticky top-4 hidden self-start xl:block">
                <div className="border-l border-slate-200 pl-4">
                  <p className="mb-3 text-[10.5px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                    Contenido
                  </p>
                  <nav aria-label="Índice del resumen">
                    <ol className="space-y-1.5">
                      {summaryChapters.map((chapter, index) => (
                        <li key={chapter.anchor}>
                          <a
                            href={`#${chapter.anchor}`}
                            className="group flex items-start gap-2.5 text-[12.5px] leading-5 text-slate-500 transition hover:text-[#2563EB]"
                          >
                            <span className="min-w-5 font-bold tabular-nums text-slate-300 transition group-hover:text-[#2563EB]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span>{chapter.displayTitle}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </aside>
            ) : null}

            <main className="min-w-0 max-w-[800px]">
              {summaryChapters.length > 0 ? (
                <div>
                  {summaryChapters.map((section, index) => (
                    <section
                      id={section.anchor}
                      key={`${section.title}:${section.body}`}
                      className="scroll-mt-6 border-b border-slate-200 py-9 first:pt-0 last:border-b-0 last:pb-2 sm:py-11"
                    >
                      <header className="mb-5 sm:mb-6">
                        <p className="text-[10px] font-extrabold tracking-[0.18em] text-[#2563EB] uppercase">
                          Capítulo {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-1.5 text-[1.35rem] font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[1.55rem]">
                          {section.displayTitle}
                        </h3>
                      </header>

                      <StudyRichText body={section.body} />

                      <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="text-[11px] font-medium text-slate-400">
                          Capítulo {index + 1} de {summaryChapters.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('ejercicios');
                            setIsViewerVisible(false);
                            setCommentsOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2563EB] transition hover:text-[#1D4ED8]"
                        >
                          <BrainCircuit className="h-3.5 w-3.5" />
                          Ir a práctica
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] leading-6 text-slate-500">
                  Todavía no pudimos organizar el contenido por temas claros dentro del texto extraído del PDF.
                </p>
              )}
            </main>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="glosario" className="animate-tab-panel">
        <div className="px-1 py-1 sm:px-2 sm:py-2">
          {usefulGlossary.length > 0 ? (
            <div>
              <div className="hidden grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)] gap-8 border-b border-slate-200 px-2 py-3 md:grid">
                <p className="text-[11px] font-bold tracking-[0.13em] text-slate-400 uppercase">Término</p>
                <p className="text-[11px] font-bold tracking-[0.13em] text-slate-400 uppercase">Definición</p>
              </div>
              <div className="divide-y divide-slate-200/80">
                {usefulGlossary.map((item) => {
                  const englishTerm =
                    item.englishTerm && item.englishTerm.trim().toLowerCase() !== 'svg'
                      ? item.englishTerm
                      : null;

                  return (
                    <article
                      key={item.term}
                      className="grid gap-2.5 px-2 py-5 md:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)] md:gap-8 md:px-2 md:py-5"
                    >
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold tracking-[0.13em] text-slate-400 uppercase md:hidden">
                          Término
                        </p>
                        <h3 className="text-[0.94rem] font-semibold tracking-[-0.025em] text-slate-950 md:text-[0.98rem]">
                          {item.term}
                        </h3>
                        {englishTerm ? (
                          <p className="text-[12px] font-medium text-slate-400 italic">{englishTerm}</p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold tracking-[0.13em] text-slate-400 uppercase md:hidden">
                          Definición
                        </p>
                        <p className="text-[13px] leading-5 text-slate-700 md:text-[13.5px] md:leading-6">
                          {item.definition}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="px-2 py-4 text-[14px] leading-6 text-slate-500">
              Todavía no pudimos detectar un glosario claro a partir de este PDF.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="tarjetas" className="animate-tab-panel">
        <div className="px-1 py-1 sm:px-2 sm:py-2">
          <StudentMaterialFlashcards cards={studyArtifacts.flashcards} materialId={materialId} />
        </div>
      </TabsContent>

      <TabsContent value="ejercicios" className="animate-tab-panel">
        <div className="px-1 py-1 sm:px-2 sm:py-2">
          {diagnosticMode ? (
            <StudentMaterialDiagnostic
              artifacts={studyArtifacts}
              materialId={materialId}
              onExit={() => setDiagnosticMode(false)}
              onReviewTopics={(topics) => {
                setDiagnosticReviewTopics(topics);
                setDiagnosticMode(false);
                setActiveTab('resumen');
                setIsViewerVisible(false);
                setCommentsOpen(false);
              }}
            />
          ) : (
            <StudentMaterialExam artifacts={studyArtifacts} materialId={materialId} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="mapa" className="animate-tab-panel">
        {isPremium ? (
          <StudyDocumentShell
            title="Mapa mental"
            description="Vista de los temas y conceptos principales detectados en este PDF."
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_220px_1fr] xl:items-center">
              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Temas principales
                </p>
                {fullSummarySections.slice(0, 4).map((section, index) => (
                  <div key={section.title} className="space-y-3">
                    <p className="text-[13px] font-medium text-slate-700">{section.title}</p>
                    {index < Math.min(3, fullSummarySections.length - 1) ? (
                      <div className="h-px bg-slate-100" />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-[#BFDBFE] bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.55),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] px-4 py-5 text-center shadow-[0_14px_32px_rgba(37,99,235,0.10)]">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#2563EB]/80 uppercase">
                  Nodo central
                </p>
                <p className="mt-2.5 text-base font-semibold tracking-[-0.03em] text-slate-950">
                  {title}
                </p>
                <p className="mt-1.5 text-[13px] leading-[1.45] text-slate-500">{materiaName}</p>
              </div>

              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Conceptos clave
                </p>
                {usefulGlossary.slice(0, 4).map((item, index) => (
                  <div key={item.term} className="space-y-3">
                    <p className="text-[13px] font-medium text-slate-700">{item.term}</p>
                    {index < Math.min(3, usefulGlossary.length - 1) ? <div className="h-px bg-slate-100" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </StudyDocumentShell>
        ) : (
          <div className="rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5">
            <PremiumUpsell
              title="El mapa mental es exclusivo Premium"
              description="Visualizá los temas y conceptos clave de tu PDF en un solo vistazo para estudiar más rápido y conectar las ideas."
              source="material_mapa_mental"
              materiaId={materiaId}
              features={[
                'Mapa mental de cada PDF que subas',
                'Temas y conceptos clave conectados',
                'Todo tu espacio de estudio en un solo lugar',
              ]}
              ctaLabel="Desbloquear mapa mental con Premium"
            />
          </div>
        )}
      </TabsContent>
    </div>
  );

  const content = (
    <Tabs
      value={activeTab}
      onValueChange={handleStudyTabChange}
      className="flex min-w-0 flex-col gap-2.5 overflow-x-hidden"
    >
      {tabHeader}
      {regenerationOverlay}
      <div>{tabPanels}</div>
    </Tabs>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition hover:text-[#2563EB]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Volver
          </Link>

          <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(620px,1.1fr)] lg:items-center lg:gap-7">
            <div className="min-w-0">
              <h1 className="max-w-[640px] text-[1.55rem] font-bold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[1.75rem] lg:text-[1.9rem]">
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

      <section className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8">
        <div className="hidden xl:block">
          <div className="relative h-[calc(100vh-12rem)] min-h-[660px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
            <Tabs
              value={activeTab}
              onValueChange={handleStudyTabChange}
              className="flex h-full min-w-0 flex-col overflow-x-hidden"
            >
              {tabHeader}
              {regenerationOverlay}
              <div className="flex min-h-0 flex-1">
                <ResizablePanelGroup direction="horizontal" className="min-w-0 flex-1">
                  <ResizablePanel
                    id="study-content-panel"
                    order={1}
                    defaultSize={isViewerVisible ? 60 : 100}
                    minSize={42}
                  >
                    <div className="flex h-full min-w-0 flex-col bg-white">{tabPanels}</div>
                  </ResizablePanel>

                  {isViewerVisible ? <ResizableHandle withHandle className="bg-white" /> : null}

                  {isViewerVisible ? (
                    <ResizablePanel id="study-viewer-panel" order={2} defaultSize={40} minSize={26}>
                      <div className="relative h-full min-w-0 bg-white p-2">
                        <button
                          type="button"
                          onClick={() => setIsViewerVisible(false)}
                          className="absolute top-1/2 left-0 z-20 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
                          aria-label="Ocultar PDF"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <PdfViewer
                          url={viewerUrl}
                          title={title}
                          subtitle={null}
                          className="h-full rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                          heightClassName="h-full min-h-0"
                          pageMaxWidthClassName="max-w-[720px]"
                          showSidebarThumbnails={false}
                          theme="default"
                          initialPage={initialPdfPage}
                        />
                      </div>
                    </ResizablePanel>
                  ) : null}
                </ResizablePanelGroup>
              </div>
            </Tabs>

            {activeTab === 'resumen' && !isViewerVisible ? (
              <button
                type="button"
                onClick={() => setIsViewerVisible(true)}
                className="absolute top-1/2 right-4 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
                aria-label="Mostrar PDF"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 xl:hidden">
          <div className="flex flex-col rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
            {content}
          </div>

          {activeTab === 'resumen' ? (
            isViewerVisible ? (
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_22px_54px_rgba(15,23,42,0.10)]">
                <button
                  type="button"
                  onClick={() => setIsViewerVisible(false)}
                  className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
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
                  initialPage={initialPdfPage}
                />
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/80 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      PDF oculto
                    </p>
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
            )
          ) : null}
        </div>
      </section>
    </div>
  );
}
