'use client';

import type { TopicPracticeOutcome } from '@/lib/student-materials/topic-practice-feedback';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Activity,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenText,
  BrainCircuit,
  Clock3,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListTree,
  Loader2,
  Map as MapIcon,
  MessageSquare,
  Sparkles,
  SquareLibrary,
} from 'lucide-react';
import { MaterialFeedback } from '@/components/material-feedback';
import { StudyRichText } from '@/components/study-rich-text';
import {
  StudentMaterialDiagnostic,
  emptyDiagnosticSession,
} from '@/components/student-material-diagnostic';
import {
  RecommendedStudyGuide,
  type RecommendedStudyStep,
} from '@/components/study/recommended-study-guide';
import { SUMMARY_FLOW_VERSION, MATERIAL_PRACTICE_FLOW_VERSION } from '@/lib/analytics-events';
import {
  resolvePracticeEntrySource,
  type PracticeEntryPoint,
  type PracticeEntrySource,
} from '@/lib/student-materials/practice-entry';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { FIRST_PDF_GUIDE_VERSION } from '@/lib/onboarding-funnel';
import { completeFirstPdfOnboardingAction } from '@/app/materiales/[id]/onboarding-actions';
import { StudentMaterialExam } from '@/components/student-material-exam';
import { PdfStudyStartGuide } from '@/components/study/pdf-study-start-guide';
import { SummaryChapterFinish } from '@/components/study/summary-chapter-finish';
import { getFirstTopicResourceInfo } from '@/lib/student-materials/first-topic-resources';
import { getTopicStudyResources } from '@/lib/student-materials/topic-study-resources';
import { getTopicQuestionCounts } from '@/lib/student-materials/topic-practice';
import { StudentMaterialFlashcards } from '@/components/student-material-flashcards';
import { ExamDatePlanPrompt } from '@/components/exam-date-plan-prompt';
import { PremiumUpsell } from '@/components/premium/premium-upsell';
import { regenerateStudentMaterialStudyAction } from '@/app/dashboard/materiales/processing-actions';
import { getMaterialPendingStudyErrorTopicCountAction } from '@/lib/actions/study-errors';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { PdfMobileNavigation } from '@/components/study/pdf-mobile-navigation';
import {
  pdfStudyTabClassName,
  pdfStudyControlsClassName,
} from '@/components/study/pdf-study-styles';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';
import {
  buildPedagogicalArtifacts,
  isPedagogicalGlossaryItem,
} from '@/lib/student-materials/pedagogy';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import { buildSummaryCheckPlan } from '@/lib/student-materials/summary-checks';


/** Conserva la navegación del alumno: nunca desplaza la página completa. */
const tourStudySelectors: Record<RecommendedStudyStep, string> = {
  summary: '[data-summary-reading-section="0"]',
  practice: '[data-onboarding-practice-options]',
  progress: '[data-recommended-topics]',
  reinforce: '[data-onboarding-topic-detail]',
};

function getVisibleTourReader(): HTMLElement | null {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-onboarding-study-panel] [role="region"][aria-label="Contenido de estudio"]'
    )
  )
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 &&
        rect.bottom > 0 && rect.top < window.innerHeight &&
        getComputedStyle(node).visibility !== 'hidden';
    })
    .sort((a, b) => {
      const visibleHeight = (node: HTMLElement) => {
        const rect = node.getBoundingClientRect();
        return Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(0, rect.top));
      };
      return visibleHeight(b) - visibleHeight(a);
    })[0] ?? null;
}

function revealTourContent(step: RecommendedStudyStep, focus = false, behavior: ScrollBehavior = 'instant'): boolean {
  const reader = getVisibleTourReader();
  const target = reader?.querySelector<HTMLElement>(tourStudySelectors[step]);
  if (!reader || !target) return false;
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height || !target.getClientRects().length) return false;

  // En Práctica, mostrar el título y las opciones juntos. En las demás vistas
  // mantener el capítulo/los temas en la parte superior del lector.
  const breathingRoom = step === 'practice' ? Math.min(112, reader.clientHeight * 0.2) : 12;
  const scrollBehavior = behavior === 'smooth' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : behavior;

  if (behavior === 'smooth' && reader.scrollHeight <= reader.clientHeight + 4) {
    // La demo muestra el Resumen expandido y utiliza el scroll de la página.
    // Sólo el CTA de lectura usa este fallback; el onboarding no mueve la página.
    target.scrollIntoView({ block: 'start', behavior: scrollBehavior });
  } else {
    // En el producto, Resumen tiene un lector con desplazamiento interno.
    reader.scrollTo({
      top: Math.max(
        0,
        reader.scrollTop + rect.top - reader.getBoundingClientRect().top - breathingRoom
      ),
      behavior: scrollBehavior,
    });
  }
  if (focus) target.focus({ preventScroll: true });
  return true;
}

const SummaryTopicCheckPopup = dynamic(() =>
  import('@/components/study/summary-topic-check-popup').then(
    (module) => module.SummaryTopicCheckPopup
  )
);
const SummaryCompletionPopup = dynamic(() =>
  import('@/components/study/summary-completion-popup').then(
    (module) => module.SummaryCompletionPopup
  )
);
const MaterialProgressContent = dynamic(
  () =>
    import('@/components/study/material-progress-content').then(
      (module) => module.MaterialProgressContent
    ),
  {
    loading: () => (
      <p role="status" className="text-muted-foreground p-4 text-sm">
        Cargando tu progreso…
      </p>
    ),
  }
);

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
  initialPracticeSectionIndex?: number;
  recommendedStudyAvailable?: boolean;
  initialRecommendedStudy?: boolean;
  /** Mostrar la guía de estudio al llegar al Resumen desde un PDF recién procesado. */
  initialStudyStartGuideRequested?: boolean;
  /** Solo para la demo pública: habilita enlaces a una etapa sin forzar onboarding real. */
  initialTab?: StudyTabId;
  initialPdfPage?: number | null;
  initialViewerVisible?: boolean;
  progress?: ReactNode;
  progressConfig?: {
    questionCounts: number[];
    requestedError?: string;
    returnToErrors?: boolean;
  };
  initialProgressOpen?: boolean;
  children?: ReactNode;
  /** Recorrido de muestra: contenido preparado, sin resultados ni acciones de cuenta. */
  demo?: {
    activeTab: StudyTabId;
    onTabChange: (tab: StudyTabId) => void;
    viewerVisible: boolean;
    onViewerChange: (visible: boolean) => void;
    practice: ReactNode;
    onPracticeTopic?: (index: number | null) => void;
    progress?: ReactNode | ((args: {
      showOnboardingExample: boolean;
      showOnboardingTopic: boolean;
    }) => ReactNode);
    progressOpen?: boolean;
    pendingStudyErrorCount?: number;
    onProgressChange?: (open: boolean) => void;
    onReinforce?: (topics: string[]) => void;
  };
};

export type StudyTabId = 'resumen' | 'glosario' | 'tarjetas' | 'ejercicios' | 'mapa';

const STUDY_TABS: Array<{
  id: StudyTabId;
  label: string;
  icon: typeof BookOpenText;
  premium?: boolean;
}> = [
  { id: 'resumen', label: 'Resumen', icon: BookOpenText },
  { id: 'ejercicios', label: 'Práctica', icon: BrainCircuit },
  { id: 'tarjetas', label: 'Flashcards', icon: Sparkles },
  { id: 'glosario', label: 'Glosario', icon: SquareLibrary },
  { id: 'mapa', label: 'Mapa mental', icon: MapIcon, premium: true },
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
        'surface-card border-border/80 bg-card rounded-2xl border p-4 shadow-none sm:p-[1.05rem]',
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
  compact = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="surface-card border-border bg-card rounded-2xl border shadow-none">
      <div className={compact ? 'space-y-3 px-3 py-3' : 'space-y-5 px-4 py-4 sm:px-5 sm:py-5'}>
        <section className="space-y-1.5">
          <h2 className="text-foreground text-[1.12rem] font-bold tracking-[-0.04em]">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-[13px] leading-6">{description}</p>
          ) : null}
        </section>
        {!compact && <div className="bg-card h-px" />}
        {children}
      </div>
    </div>
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
  const items = [carreraName, universidadName, materiaName].filter((value): value is string =>
    Boolean(value)
  );
  if (items.length === 0) return null;

  return (
    <div className="hidden min-w-0 items-center justify-end gap-2 overflow-hidden lg:flex">
      {items.map((item, index) => (
        <div key={item} className="flex min-w-0 items-center gap-2">
          {index > 0 ? <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" /> : null}
          <span
            title={item}
            className="text-muted-foreground max-w-[220px] truncate text-[11.5px] font-medium xl:max-w-[260px]"
          >
            {item}
          </span>
        </div>
      ))}
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
  isOwner,
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
  initialPracticeSectionIndex,
  recommendedStudyAvailable = false,
  initialRecommendedStudy = false,
  initialStudyStartGuideRequested = false,
  initialTab,
  initialPdfPage = null,
  initialViewerVisible: _initialViewerVisible = false,
  progress,
  progressConfig,
  initialProgressOpen = false,
  children,
  demo,
}: MaterialStudyWorkspaceProps) {
  const { toast } = useToast();
  const router = useRouter();
  const guideRunIdRef = useRef<string | null>(null);
  const guideStartedTrackedRef = useRef(false);
  const guideCompletedRef = useRef(false);
  const firstPostGuideActionTrackedRef = useRef(false);
  const getGuideMetadata = () => {
    if (!guideRunIdRef.current) {
      guideRunIdRef.current = window.crypto?.randomUUID?.() ?? `guide-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return { material_id: materialId, guide_version: FIRST_PDF_GUIDE_VERSION,
      guide_run_id: guideRunIdRef.current };
  };
  const trackPostGuideAction = (action: string) => {
    if (!guideCompletedRef.current || firstPostGuideActionTrackedRef.current ||
        !isOwner || demo || !recommendedStudyAvailable) return;
    firstPostGuideActionTrackedRef.current = true;
    trackMarketingEvent('first_pdf_guide_post_action', {
      ...getGuideMetadata(), action,
    });
  };
  const [localProgressOpen, setLocalProgressOpen] = useState(initialProgressOpen);
  const progressContent = demo?.progress ?? progress;
  const hasProgress = Boolean(progressContent || (progressConfig && isOwner && !demo));
  const progressOpen = demo?.progressOpen ?? localProgressOpen;
  const setProgressOpen = (open: boolean) => {
    if (open && !progressOpen && isOwner && !demo) {
      trackMarketingEvent('cta_click', {
        location: 'material_study_workspace',
        cta_name: 'progress_this_pdf',
        material_id: materialId,
      });
      trackPostGuideAction('progreso');
    }
    setLocalProgressOpen(open);
    demo?.onProgressChange?.(open);
    if (open) setIsViewerVisible(false);
  };
  const [localActiveTab, setActiveTab] = useState<StudyTabId>(
    initialDiagnostic ? 'ejercicios' : (initialTab ?? 'resumen')
  );
  const [diagnosticMode, setDiagnosticMode] = useState(initialDiagnostic);
  const [practiceSectionIndex, setPracticeSectionIndex] = useState<number | undefined>(
    initialPracticeSectionIndex
  );
  // Atribución explícita del acceso a la pestaña Ejercicios; no implica que
  // el alumno haya iniciado la tanda de preguntas.
  const [practiceEntry, setPracticeEntry] = useState<{
    source: PracticeEntrySource;
    id: string | null;
  }>({
    source: initialPracticeSectionIndex === undefined ? 'direct_tab' : 'topic_practice',
    id: null,
  });
  const [topicReturn, setTopicReturn] = useState<{
    index: number;
    reinforce: boolean;
    outcome?: TopicPracticeOutcome;
  } | null>(null);
  const [diagnosticReviewTopics, setDiagnosticReviewTopics] = useState<string[]>([]);
  const [recommendedActive, setRecommendedActive] = useState(initialRecommendedStudy);
  const [guideCompletionPending, setGuideCompletionPending] = useState(false);
  const [onboardingFading, setOnboardingFading] = useState(false);
  const [focusFirstChapterOnExit, setFocusFirstChapterOnExit] = useState(false);
  const [activeSummaryChapterIndex, setActiveSummaryChapterIndex] = useState(0);
  const scrollFirstChapterSmoothlyRef = useRef(false);
  const [studyStartGuideOpen, setStudyStartGuideOpen] = useState(false);
  const studyGuideArrivalHandledRef = useRef<string | null>(null);
  const onboardingTransitionRef = useRef<number | null>(null);

  // Las transiciones solo son visuales: sin movimiento para usuarios con reduced motion.
  useEffect(() => () => {
    if (onboardingTransitionRef.current !== null) {
      window.clearTimeout(onboardingTransitionRef.current);
    }
  }, []);

  // Una sesión compartida por las vistas móvil y escritorio evita perder respuestas al redimensionar.
  const [recommendedSession, setRecommendedSession] = useState(emptyDiagnosticSession);
  const [recommendedTourStep, setRecommendedTourStep] = useState<RecommendedStudyStep | null>(
    initialRecommendedStudy && !initialDiagnostic ? 'summary' : null
  );
  // Track real progress exposure, including deep links and the guided tour.
  const progressOpenTrackedRef = useRef(false);
  const progressFirstOpeningTrackedRef = useRef(false);
  useEffect(() => {
    if (!progressOpen || !hasProgress || !isOwner || demo) {
      if (!progressOpen) progressOpenTrackedRef.current = false;
      return;
    }
    if (progressOpenTrackedRef.current) return;
    progressOpenTrackedRef.current = true;
    const firstOpening = !progressFirstOpeningTrackedRef.current;
    progressFirstOpeningTrackedRef.current = true;
    trackMarketingEvent('pdf_progress_panel_opened', {
      material_id: materialId,
      entry: firstOpening && initialProgressOpen
        ? 'direct_link'
        : recommendedActive ? 'guided' : 'navigation',
    });
  }, [progressOpen, hasProgress, isOwner, demo, materialId, initialProgressOpen, recommendedActive]);
  const showOnboardingTopic = recommendedActive && recommendedTourStep === 'reinforce';
  const showOnboardingExample = recommendedActive && recommendedTourStep === 'progress';
  const displayedProgressContent = typeof progressContent === 'function'
    ? progressContent({ showOnboardingExample, showOnboardingTopic })
    : progressContent;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [summaryCheckChapterIndex, setSummaryCheckChapterIndex] = useState<number | null>(null);
  const [summaryEndPendingCount, setSummaryEndPendingCount] = useState<number | null>(null);
  const [pendingStudyErrorCount, setPendingStudyErrorCount] = useState(0);
  const [summaryCompletionOpen, setSummaryCompletionOpen] = useState(false);
  const summaryEndRef = useRef<HTMLDivElement | null>(null);
  const summaryCompletionPromptedRef = useRef(false);
  const summaryCompletionTimerRef = useRef<number | null>(null);
  const summaryReadingStartedTrackedRef = useRef(false);
  const promptedSummaryChecksRef = useRef(new Set<number>());
  const summaryReadTimeRef = useRef(new Map<number, number>());
  const summaryReadVisibleSinceRef = useRef(new Map<number, number>());
  const summaryReadingVisibilityRef = useRef(new Map<number, { ratio: number; top: number }>());
  const summaryActiveReadingSectionRef = useRef<number | null>(null);
  const summaryCheckTriggerVisibleRef = useRef(new Set<number>());
  const summaryCheckTimerRef = useRef(new Map<number, number>());
  const lastSummaryCheckPromptRef = useRef<{ chapterIndex: number; promptedAt: number } | null>(
    null
  );
  const summaryCheckConsecutiveSkipsRef = useRef(0);
  const summaryCheckSuppressedRef = useRef(false);
  const [localViewerVisible, setLocalViewerVisible] = useState(false);
  const activeTab = demo?.activeTab ?? localActiveTab;
  const isViewerVisible = demo?.viewerVisible ?? localViewerVisible;
  const isDemo = Boolean(demo);
  const hasPendingStudyErrors = (demo?.pendingStudyErrorCount ?? pendingStudyErrorCount) > 0;

  // Cada PDF recién cargado presenta una sola vez la guía, sin pregunta previa.
  // El tour inicial de cuatro pasos tiene prioridad y muestra la guía al finalizar.
  useEffect(() => {
    if (
      !initialStudyStartGuideRequested ||
      !isOwner ||
      isDemo ||
      recommendedActive ||
      activeTab !== 'resumen' ||
      progressOpen ||
      studyGuideArrivalHandledRef.current === materialId
    ) {
      return;
    }
    studyGuideArrivalHandledRef.current = materialId;
    setStudyStartGuideOpen(true);
  }, [initialStudyStartGuideRequested, isOwner, isDemo, recommendedActive, activeTab, progressOpen, materialId]);

  useEffect(() => {
    if (!isOwner || isDemo) return;
    let cancelled = false;
    const refreshPending = () => {
      void getMaterialPendingStudyErrorTopicCountAction(materialId)
        .then(({ count }) => {
          if (!cancelled) setPendingStudyErrorCount(count);
        })
        .catch(() => {
          // Conservamos el último valor si la conexión falla.
        });
    };
    refreshPending();
    window.addEventListener('focus', refreshPending);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshPending);
    };
  }, [isOwner, isDemo, materialId]);

  useEffect(() => {
    if (
      activeTab !== 'resumen' ||
      !isOwner ||
      demo ||
      recommendedActive ||
      summaryReadingStartedTrackedRef.current
    ) {
      return;
    }

    summaryReadingStartedTrackedRef.current = true;
    trackMarketingEvent('summary_reading_started', {
      material_id: materialId,
      flow_version: SUMMARY_FLOW_VERSION,
    });
  }, [activeTab, demo, isOwner, materialId, recommendedActive]);

  useEffect(() => {
    if (
      activeTab !== 'resumen' ||
      demo ||
      !summaryEndRef.current ||
      summaryCompletionPromptedRef.current ||
      summaryCheckChapterIndex !== null ||
      recommendedActive
    ) {
      return;
    }

    let cancelled = false;
    let endVisible = false;
    const node = summaryEndRef.current;

    const clearCompletionTimer = () => {
      if (summaryCompletionTimerRef.current !== null) {
        window.clearTimeout(summaryCompletionTimerRef.current);
        summaryCompletionTimerRef.current = null;
      }
    };

    const scheduleCompletion = () => {
      clearCompletionTimer();
      summaryCompletionTimerRef.current = window.setTimeout(() => {
        if (cancelled || !endVisible || summaryCompletionPromptedRef.current) return;

        const loadPendingCount = isOwner
          ? getMaterialPendingStudyErrorTopicCountAction(materialId)
          : Promise.resolve({ count: 0 });

        void loadPendingCount.then(({ count }) => {
          if (cancelled || !endVisible || summaryCompletionPromptedRef.current) return;
          summaryCompletionPromptedRef.current = true;
          setPendingStudyErrorCount(count);
          setSummaryEndPendingCount(count);
          if (isOwner) {
            trackMarketingEvent('summary_completed', {
              material_id: materialId,
              pending_count: count,
              flow_version: SUMMARY_FLOW_VERSION,
            });
          }
          // También medir lecturas legítimas de PDFs compartidos: el popup se
          // muestra a visitantes autenticados, no únicamente al propietario.
          trackMarketingEvent('summary_completion_popup_viewed', {
            material_id: materialId,
            pending_count: count,
            flow_version: SUMMARY_FLOW_VERSION,
          });
          setSummaryCompletionOpen(true);
        });
      }, 4000);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        endVisible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5
        );
        if (endVisible) scheduleCompletion();
        else clearCompletionTimer();
      },
      { threshold: [0, 0.5, 1], rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      clearCompletionTimer();
      observer.disconnect();
    };
  }, [activeTab, demo, isOwner, materialId, recommendedActive, summaryCheckChapterIndex]);
  const setIsViewerVisible = (value: SetStateAction<boolean>) => {
    const next = typeof value === 'function' ? value(isViewerVisible) : value;
    setLocalViewerVisible(next);
    demo?.onViewerChange(next);
  };
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStageIndex, setRegenerationStageIndex] = useState(0);
  const [regenerationProgress, setRegenerationProgress] = useState(8);
  const [examDatePromptTrigger, setExamDatePromptTrigger] = useState(0);
  const trackedGuideStepsRef = useRef(new Set<RecommendedStudyStep>());
  const practiceOpenedTrackedRef = useRef(false);

  const requestExamDatePrompt = () => {
    setExamDatePromptTrigger((value) => value + 1);
  };

  const clearRecommendedStudyQuery = useCallback(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('recorrido')) return;
    url.searchParams.delete('recorrido');
    const nextUrl = `${url.pathname}${url.searchParams.size > 0 ? `?${url.searchParams.toString()}` : ''}${url.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, []);

  useEffect(() => {
    if (initialRecommendedStudy) return;
    clearRecommendedStudyQuery();
  }, [clearRecommendedStudyQuery, initialRecommendedStudy]);

  useEffect(() => {
    if (!isOwner || !recommendedStudyAvailable || demo) return;
    trackMarketingEvent('first_pdf_study_session_opened', {
      material_id: materialId,
      entry: initialRecommendedStudy ? 'guided' : 'direct',
    });
  }, [demo, initialRecommendedStudy, isOwner, materialId, recommendedStudyAvailable]);

  useEffect(() => {
    if (!recommendedActive || !recommendedTourStep ||
        !isOwner || !recommendedStudyAvailable || demo ||
        guideStartedTrackedRef.current) return;
    guideStartedTrackedRef.current = true;
    trackMarketingEvent('first_pdf_guide_started', getGuideMetadata());
  }, [demo, isOwner, materialId, recommendedActive, recommendedStudyAvailable, recommendedTourStep]);

  useEffect(() => {
    if (
      !recommendedActive ||
      !recommendedTourStep ||
      !isOwner ||
      !recommendedStudyAvailable ||
      demo ||
      trackedGuideStepsRef.current.has(recommendedTourStep)
    ) {
      return;
    }
    trackedGuideStepsRef.current.add(recommendedTourStep);
    trackMarketingEvent('first_pdf_guide_step_viewed', {
      ...getGuideMetadata(),
      step: recommendedTourStep,
    });
  }, [
    demo,
    isOwner,
    materialId,
    recommendedActive,
    recommendedStudyAvailable,
    recommendedTourStep,
  ]);

  const studyArtifacts = useMemo(
    () =>
      pedagogicalArtifacts ??
      buildPedagogicalArtifacts({ summary: studySummary, glossary: studyGlossary }),
    [pedagogicalArtifacts, studyGlossary, studySummary]
  );
  const changeRecommendedTab = (tab: StudyTabId) => {
    setActiveTab(tab);
    demo?.onTabChange(tab);
    setIsViewerVisible(false);
    setCommentsOpen(false);
  };
  const closeRecommendedTour = useCallback(
    (outcome: 'completed' | 'skipped' = 'skipped') => {
      if (!demo && isOwner && recommendedStudyAvailable) {
        trackMarketingEvent(
          outcome === 'completed' ? 'first_pdf_guide_completed' : 'first_pdf_guide_skipped',
          {
            ...getGuideMetadata(),
            ...(outcome === 'skipped' && recommendedTourStep ? { step: recommendedTourStep } : {}),
          }
        );
        if (outcome === 'completed') guideCompletedRef.current = true;
      }
      clearRecommendedStudyQuery();
      if (onboardingTransitionRef.current !== null) {
        window.clearTimeout(onboardingTransitionRef.current);
        onboardingTransitionRef.current = null;
      }
      setOnboardingFading(false);
      setRecommendedTourStep(null);
      setRecommendedActive(false);
      // Una sola guía práctica sobre Resumen, sin selección "ya estudié".
      // La demo permite comprobar el flujo sin escribir datos del usuario.
      if (demo || isOwner) {
        studyGuideArrivalHandledRef.current = materialId;
        setStudyStartGuideOpen(true);
      }
      // El capítulo 1 se enfoca sólo al pulsar "Leer el tema 1".
      setFocusFirstChapterOnExit(false);
      setLocalProgressOpen(false);
      demo?.onProgressChange?.(false);
      setActiveTab('resumen');
      demo?.onTabChange('resumen');
      // El desplazamiento se ejecuta luego del render del Resumen (ver efecto inferior).
    },
    [
      clearRecommendedStudyQuery,
      demo,
      isOwner,
      materialId,
      recommendedStudyAvailable,
      recommendedTourStep,
    ]
  );
  const finishRecommendedTour = async () => {
    if (guideCompletionPending) return;
    if (!demo && isOwner && recommendedStudyAvailable) {
      setGuideCompletionPending(true);
      try {
        const result = await completeFirstPdfOnboardingAction();
        if (!result.success) {
          toast({
            title: 'No pudimos guardar el recorrido',
            description: result.message ?? 'Intentá nuevamente para finalizar.',
            variant: 'destructive',
          });
          return;
        }
      } catch {
        toast({
          title: 'No pudimos guardar el recorrido',
          description: 'Revisá tu conexión e intentá nuevamente.',
          variant: 'destructive',
        });
        return;
      } finally {
        setGuideCompletionPending(false);
      }
    }
    closeRecommendedTour('completed');
  };

  const transitionRecommendedTour = (navigate: () => void) => {
    if (onboardingTransitionRef.current !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate();
      return;
    }
    // Fade corto al salir, cambio real de pestaña y entrada suave.
    // El recorte y la tarjeta interpolan su posición en paralelo.
    setOnboardingFading(true);
    onboardingTransitionRef.current = window.setTimeout(() => {
      onboardingTransitionRef.current = null;
      navigate();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setOnboardingFading(false));
      });
    }, recommendedTourStep === 'progress' ? 220 : 150);
  };

  useEffect(() => {
    if (!recommendedActive || !recommendedTourStep) return;

    // El panel de Progreso puede montarse de forma diferida. Esperar al contenido real
    // sin volver al inicio del lector ni mover la página completa.
    let frame = 0;
    let observer: MutationObserver | null = null;
    const step = recommendedTourStep;
    const reveal = () => {
      if (revealTourContent(step)) observer?.disconnect();
    };
    const reader = getVisibleTourReader();
    if (reader) {
      observer = new MutationObserver(() => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(reveal);
      });
      observer.observe(reader, { childList: true, subtree: true });
    }
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(reveal);
    });
    const limit = window.setTimeout(() => observer?.disconnect(), 2500);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.clearTimeout(limit);
    };
  }, [recommendedActive, recommendedTourStep]);

  useEffect(() => {
    if (!focusFirstChapterOnExit || recommendedActive || progressOpen || studyStartGuideOpen || activeTab !== 'resumen') {
      return;
    }

    // React ya cambió a Resumen: ubicar la lectura en el capítulo 1.
    let nextFrame = 0;
    const frame = window.requestAnimationFrame(() => {
      nextFrame = window.requestAnimationFrame(() => {
        revealTourContent('summary', true, scrollFirstChapterSmoothlyRef.current ? 'smooth' : 'instant');
        scrollFirstChapterSmoothlyRef.current = false;
        setFocusFirstChapterOnExit(false);
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nextFrame);
    };
  }, [focusFirstChapterOnExit, recommendedActive, progressOpen, studyStartGuideOpen, activeTab]);

  const openRecommendedErrors = () => {
    setRecommendedTourStep(null);
    if (demo) {
      demo.onReinforce?.(diagnosticReviewTopics);
      return;
    }
    const params = new URLSearchParams({ material: materialId });
    router.push(`/dashboard/explicaciones?${params}`);
  };

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

  const firstTopicResources = useMemo(
    () => getFirstTopicResourceInfo(studySummary.sections, studyArtifacts.flashcards, usefulGlossary),
    [studySummary.sections, studyArtifacts.flashcards, usefulGlossary]
  );

  const topicQuestionCounts = useMemo(
    () => getTopicQuestionCounts(studySummary.sections, studyArtifacts.questions),
    [studySummary.sections, studyArtifacts.questions]
  );
  const topicStudyResources = useMemo(
    () => summaryChapters.map((_, index) =>
      getTopicStudyResources(studySummary.sections, usefulGlossary, studyArtifacts.flashcards, index)),
    [summaryChapters, studySummary.sections, usefulGlossary, studyArtifacts.flashcards]
  );

  // Mantener sincronizado el índice «Contenido» con el capítulo realmente visible.
  // Funciona con scroll interno del lector y con scroll de página (demo).
  useEffect(() => {
    if (activeTab !== 'resumen' || progressOpen || summaryChapters.length === 0) return;

    let frame = 0;
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('[role="region"][aria-label="Contenido de estudio"]')
    );
    const region = candidates
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 &&
          rect.top < window.innerHeight && rect.bottom > 0 &&
          getComputedStyle(node).visibility !== 'hidden';
      })
      .sort((a, b) => {
        const visibleArea = (node: HTMLElement) => {
          const r = node.getBoundingClientRect();
          return Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)) * r.width;
        };
        return visibleArea(b) - visibleArea(a);
      })[0];
    if (!region) return;
    const sections = Array.from(
      region.querySelectorAll<HTMLElement>('[data-summary-reading-section]')
    ).filter((section) => section.getBoundingClientRect().height > 0);
    if (sections.length === 0) return;

    const updateActiveChapter = () => {
      const readerRect = region.getBoundingClientRect();
      const visibleTop = Math.max(0, readerRect.top);
      const visibleBottom = Math.min(window.innerHeight, readerRect.bottom);
      if (visibleBottom <= visibleTop) return;

      // Un punto de lectura estable bajo el borde superior del área visible.
      const readingLine = visibleTop + Math.min(100, Math.max(35, (visibleBottom - visibleTop) * 0.23));
      let nextIndex = 0;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= readingLine) {
          nextIndex = Number(section.dataset.summaryReadingSection);
        } else {
          break;
        }
      }
      if (Number.isInteger(nextIndex)) {
        setActiveSummaryChapterIndex((current) => current === nextIndex ? current : nextIndex);
      }
    };
    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveChapter();
      });
    };

    region.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);
    scheduleSync();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      region.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
    };
  }, [activeTab, progressOpen, summaryChapters.length, materialId, recommendedActive, studyStartGuideOpen]);

  const summaryCheckPlan = useMemo(
    () => buildSummaryCheckPlan(fullSummarySections, studyArtifacts),
    [fullSummarySections, studyArtifacts]
  );

  const summaryCheckPolicy = useMemo(() => {
    const wordCounts = fullSummarySections.map(
      (section) => section.body.trim().split(/\s+/).filter(Boolean).length
    );
    const groups = new Map<number, { startIndex: number; endIndex: number; wordCount: number }>();

    if (fullSummarySections.length === 0) return groups;

    const totalWords = wordCounts.reduce((total, count) => total + count, 0);

    // En resúmenes cortos evitamos interrumpir entre temas: una sola comprobación al final.
    if (fullSummarySections.length <= 3) {
      if (totalWords >= 130) {
        const endIndex = fullSummarySections.length - 1;
        groups.set(endIndex, { startIndex: 0, endIndex, wordCount: totalWords });
      }
      return groups;
    }

    // En resúmenes largos, temas muy breves se agrupan con los siguientes hasta sumar contenido útil.
    let startIndex = 0;
    let groupedWords = 0;
    for (let index = 0; index < wordCounts.length; index += 1) {
      groupedWords += wordCounts[index] ?? 0;
      if (groupedWords < 130) continue;

      groups.set(index, {
        startIndex,
        endIndex: index,
        wordCount: groupedWords,
      });
      startIndex = index + 1;
      groupedWords = 0;
    }

    return groups;
  }, [fullSummarySections]);

  const activeSummaryCheck =
    summaryCheckChapterIndex !== null ? (summaryCheckPlan[summaryCheckChapterIndex] ?? null) : null;

  const handleSummaryCheckContinue = useCallback((outcome: 'skipped' | 'completed') => {
    if (outcome === 'skipped') {
      summaryCheckConsecutiveSkipsRef.current += 1;
      if (summaryCheckConsecutiveSkipsRef.current >= 2) {
        summaryCheckSuppressedRef.current = true;
      }
    } else {
      summaryCheckConsecutiveSkipsRef.current = 0;
    }

    setSummaryCheckChapterIndex(null);
  }, []);

  useEffect(() => {
    if (
      activeTab !== 'resumen' ||
      !isOwner ||
      recommendedActive ||
      recommendedTourStep ||
      studyStartGuideOpen ||
      summaryCheckChapterIndex !== null ||
      summaryCheckSuppressedRef.current
    ) {
      return;
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-summary-reading-section]')
    );
    const triggers = Array.from(
      document.querySelectorAll<HTMLElement>('[data-summary-check-trigger]')
    );
    if (sections.length === 0 || triggers.length === 0) return;

    const getAccumulatedReadTime = (chapterIndex: number) => {
      const stored = summaryReadTimeRef.current.get(chapterIndex) ?? 0;
      const visibleSince = summaryReadVisibleSinceRef.current.get(chapterIndex);
      if (visibleSince === undefined || document.visibilityState !== 'visible') return stored;
      return stored + Math.max(0, performance.now() - visibleSince);
    };

    const getAccumulatedGroupReadTime = (chapterIndex: number) => {
      const group = summaryCheckPolicy.get(chapterIndex);
      if (!group) return 0;

      let total = 0;
      for (let index = group.startIndex; index <= group.endIndex; index += 1) {
        total += getAccumulatedReadTime(index);
      }
      return total;
    };

    const clearPromptTimer = (chapterIndex: number) => {
      const timer = summaryCheckTimerRef.current.get(chapterIndex);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        summaryCheckTimerRef.current.delete(chapterIndex);
      }
    };

    const maybePrompt = (chapterIndex: number) => {
      const group = summaryCheckPolicy.get(chapterIndex);
      if (
        summaryCheckSuppressedRef.current ||
        promptedSummaryChecksRef.current.has(chapterIndex) ||
        !group ||
        !summaryCheckPlan[chapterIndex] ||
        !summaryCheckTriggerVisibleRef.current.has(chapterIndex)
      ) {
        return;
      }

      const now = performance.now();
      const previousPrompt = lastSummaryCheckPromptRef.current;
      if (previousPrompt && chapterIndex <= previousPrompt.chapterIndex) return;

      const threshold = Math.min(
        15_000,
        Math.max(6_000, 6_000 + Math.max(0, group.wordCount - 25) * 120)
      );
      const readTime = getAccumulatedGroupReadTime(chapterIndex);
      const remainingReadTime = Math.max(0, threshold - readTime);

      let remainingSpacingTime = 0;
      if (previousPrompt && chapterIndex - previousPrompt.chapterIndex < 2) {
        remainingSpacingTime = Math.max(0, 120_000 - (now - previousPrompt.promptedAt));
      }

      if (remainingReadTime <= 0 && remainingSpacingTime <= 0) {
        clearPromptTimer(chapterIndex);
        promptedSummaryChecksRef.current.add(chapterIndex);
        lastSummaryCheckPromptRef.current = { chapterIndex, promptedAt: now };
        setSummaryCheckChapterIndex(chapterIndex);
        return;
      }

      clearPromptTimer(chapterIndex);
      const remaining = Math.max(250, remainingReadTime, remainingSpacingTime);
      const timer = window.setTimeout(() => {
        summaryCheckTimerRef.current.delete(chapterIndex);
        if (!summaryCheckTriggerVisibleRef.current.has(chapterIndex)) return;
        maybePrompt(chapterIndex);
      }, remaining);
      summaryCheckTimerRef.current.set(chapterIndex, timer);
    };

    const stopActiveReading = (now: number) => {
      const activeChapterIndex = summaryActiveReadingSectionRef.current;
      if (activeChapterIndex === null) return;

      const visibleSince = summaryReadVisibleSinceRef.current.get(activeChapterIndex);
      if (visibleSince !== undefined) {
        const accumulated = summaryReadTimeRef.current.get(activeChapterIndex) ?? 0;
        summaryReadTimeRef.current.set(
          activeChapterIndex,
          accumulated + Math.max(0, now - visibleSince)
        );
      }

      summaryReadVisibleSinceRef.current.clear();
      summaryActiveReadingSectionRef.current = null;
    };

    const syncActiveReadingSection = (now: number) => {
      if (document.visibilityState !== 'visible') {
        stopActiveReading(now);
        return;
      }

      const dominantSection =
        [...summaryReadingVisibilityRef.current.entries()]
          .filter(([, visibility]) => visibility.ratio > 0)
          .sort((left, right) => {
            const ratioDifference = right[1].ratio - left[1].ratio;
            if (Math.abs(ratioDifference) > 0.01) return ratioDifference;
            return Math.abs(left[1].top) - Math.abs(right[1].top);
          })[0]?.[0] ?? null;

      if (summaryActiveReadingSectionRef.current === dominantSection) {
        if (dominantSection !== null && !summaryReadVisibleSinceRef.current.has(dominantSection)) {
          summaryReadVisibleSinceRef.current.set(dominantSection, now);
        }
        return;
      }

      stopActiveReading(now);
      summaryActiveReadingSectionRef.current = dominantSection;
      if (dominantSection !== null) {
        summaryReadVisibleSinceRef.current.set(dominantSection, now);
      }
    };

    const readingObserver = new IntersectionObserver(
      (entries) => {
        const now = performance.now();

        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const chapterIndex = Number(element.dataset.summaryReadingSection);
          if (!Number.isInteger(chapterIndex)) continue;

          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            summaryReadingVisibilityRef.current.set(chapterIndex, {
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top,
            });
          } else {
            summaryReadingVisibilityRef.current.delete(chapterIndex);
          }
        }

        // Solo el tema predominante en pantalla acumula tiempo. Así, si dos
        // secciones se superponen en el viewport, nunca contamos lectura doble.
        syncActiveReadingSection(now);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    const triggerObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const chapterIndex = Number(element.dataset.summaryCheckTrigger);
          if (!Number.isInteger(chapterIndex)) continue;

          if (entry.isIntersecting) {
            summaryCheckTriggerVisibleRef.current.add(chapterIndex);
          } else {
            summaryCheckTriggerVisibleRef.current.delete(chapterIndex);
            clearPromptTimer(chapterIndex);
          }
        }

        for (const entry of visible) {
          const element = entry.target as HTMLElement;
          const chapterIndex = Number(element.dataset.summaryCheckTrigger);
          if (!Number.isInteger(chapterIndex)) continue;
          maybePrompt(chapterIndex);
          if (promptedSummaryChecksRef.current.has(chapterIndex)) break;
        }
      },
      {
        threshold: 1,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    const handleVisibilityChange = () => {
      const now = performance.now();

      if (document.visibilityState === 'hidden') {
        stopActiveReading(now);
        summaryReadingVisibilityRef.current.clear();
        summaryCheckTimerRef.current.forEach((timer) => window.clearTimeout(timer));
        summaryCheckTimerRef.current.clear();
        return;
      }

      // Recalcular también el recorte del scroll interno al volver a esta pestaña.
      summaryReadingVisibilityRef.current.clear();
      readingObserver.disconnect();
      sections.forEach((section) => readingObserver.observe(section));

      summaryCheckTriggerVisibleRef.current.forEach((chapterIndex) => maybePrompt(chapterIndex));
    };

    sections.forEach((section) => readingObserver.observe(section));
    triggers.forEach((trigger) => triggerObserver.observe(trigger));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      readingObserver.disconnect();
      triggerObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      summaryCheckTimerRef.current.forEach((timer) => window.clearTimeout(timer));
      summaryCheckTimerRef.current.clear();

      stopActiveReading(performance.now());
      summaryReadingVisibilityRef.current.clear();
      summaryCheckTriggerVisibleRef.current.clear();
    };
  }, [
    activeTab,
    isOwner,
    recommendedActive,
    recommendedTourStep,
    studyStartGuideOpen,
    summaryCheckChapterIndex,
    summaryCheckPlan,
    summaryCheckPolicy,
  ]);

  const handleComments = () => {
    setCommentsOpen((current) => !current);
  };

  const startFirstTopic = () => {
    setStudyStartGuideOpen(false);
    setProgressOpen(false);
    setActiveTab('resumen');
    demo?.onTabChange('resumen');
    setIsViewerVisible(false);
    scrollFirstChapterSmoothlyRef.current = true;
    setFocusFirstChapterOnExit(true);
    if (isOwner && !demo) {
      trackMarketingEvent('cta_click', {
        location: 'pdf_study_start_guide',
        cta_name: 'start_first_topic',
        material_id: materialId,
      });
    }
  };

  function handleSummaryChapterNavigation(event: MouseEvent<HTMLAnchorElement>, anchor: string, index: number) {
    // Las vistas responsive comparten contenido: buscar dentro del panel que recibió el clic.
    const chapter = event.currentTarget
      .closest('[role="tabpanel"]')
      ?.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`);
    if (!chapter) return;
    event.preventDefault();
    setActiveSummaryChapterIndex(index);
    chapter.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  const startChapterEvaluation = (index: number) => {
    if (index < 0 || index >= studySummary.sections.length || !topicQuestionCounts[index]) return;
    setPracticeSectionIndex(index);
    setDiagnosticMode(false);
    demo?.onPracticeTopic?.(index);
    if (isOwner && !demo) {
      trackMarketingEvent('cta_click', {
        location: 'summary_chapter_finish',
        cta_name: 'evaluate_topic',
        material_id: materialId,
        section_index: index,
      });
    }
    handleStudyTabChange('ejercicios', 'summary_chapter');
  };

  const continueAfterChapter = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    const nextChapter = summaryChapters[index + 1];
    if (!nextChapter) return;
    const target = event.currentTarget
      .closest('[role="tabpanel"]')
      ?.querySelector<HTMLElement>(`#${CSS.escape(nextChapter.anchor)}`);
    if (!target) return;
    setActiveSummaryChapterIndex(index + 1);
    target.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  const handleStudyTabChange = (value: string, entry: PracticeEntryPoint = 'tab') => {
    setProgressOpen(false);
    const nextTab = value as StudyTabId;
    trackPostGuideAction(nextTab === 'ejercicios' ? 'practica' :
      entry === 'summary_chapter' ? 'tema' : nextTab);
    if (nextTab === 'ejercicios') {
      // El popup y la pestaña directa abren la práctica GENERAL del PDF.
      // Solo el acceso desde un tema conserva la selección de ese tema.
      if (entry !== 'summary_chapter') {
        setPracticeSectionIndex(undefined);
        demo?.onPracticeTopic?.(null);
      }
      const source = resolvePracticeEntrySource(entry);
      const entryId = crypto.randomUUID();
      setPracticeEntry({ source, id: entryId });
      if (!demo) {
        trackMarketingEvent('student_material_practice_entry_opened', {
          material_id: materialId,
          flow_version: MATERIAL_PRACTICE_FLOW_VERSION,
          entry_source: source,
          entry_id: entryId,
          practice_scope: entry === 'summary_chapter' ? 'topic' : 'general',
        });
      }
    }
    if (
      nextTab === 'ejercicios' &&
      isOwner &&
      recommendedStudyAvailable &&
      !demo &&
      !practiceOpenedTrackedRef.current
    ) {
      practiceOpenedTrackedRef.current = true;
      trackMarketingEvent('first_pdf_practice_opened', {
        material_id: materialId,
        entry,
      });
    }
    setActiveTab(nextTab);
    demo?.onTabChange(nextTab);

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

  const materialErrorsHref = `/dashboard/progreso?material=${encodeURIComponent(materialId)}`;

  const tabHeader = (
    <div
      className={cn(
        'border-border shrink-0 flex-col gap-1.5 border-b px-2.5 py-2 sm:px-3 sm:py-2.5',
        'hidden md:flex'
      )}
    >
      <TabsList className="hidden h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-2xl bg-transparent p-0 [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
        {STUDY_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              data-recommended-tab={tab.id}
              data-pdf-study-tab
              className={pdfStudyTabClassName}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {tab.label}
              {tab.premium ? (
                <span className="bg-primary/10 text-primary ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.08em] uppercase sm:text-[10px]">
                  Premium
                </span>
              ) : null}
            </TabsTrigger>
          );
        })}
        {hasProgress ? (
          <TabsTrigger
            value="progreso"
            data-pdf-study-tab
            data-recommended-errors
            data-has-pending={hasPendingStudyErrors || undefined}
            className={pdfStudyTabClassName}
          >
            <CircleAlert className="h-4 w-4" />
            Progreso
            {hasPendingStudyErrors && (
              <span className="bg-destructive size-1.5 shrink-0 rounded-full" aria-hidden="true" />
            )}
            {hasPendingStudyErrors && <span className="sr-only">: errores por resolver</span>}
          </TabsTrigger>
        ) : null}
        {isOwner && !demo && !hasProgress ? (
          <Link
            href={materialErrorsHref}
            data-recommended-errors
            data-pdf-study-tab
            data-has-pending={hasPendingStudyErrors || undefined}
            aria-label={
              hasPendingStudyErrors
                ? 'Progreso: errores por resolver en este PDF'
                : 'Progreso de este PDF'
            }
            onClick={() => {
              trackMarketingEvent('cta_click', {
                location: 'material_study_tabs',
                cta_name: 'progress_this_pdf',
                destination: materialErrorsHref,
              });
            }}
            className={cn(
              pdfStudyTabClassName,
              'inline-flex items-center justify-center gap-1.5 transition'
            )}
          >
            <CircleAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Progreso
            {hasPendingStudyErrors && (
              <span className="bg-destructive size-1.5 shrink-0 rounded-full" aria-hidden="true" />
            )}
          </Link>
        ) : null}
      </TabsList>

      {activeTab === 'resumen' && !progressOpen ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsViewerVisible((current) => !current)}
            className="border-border bg-card text-foreground hover:bg-muted h-8 rounded-lg px-2.5 text-[12px] shadow-none sm:h-9 sm:rounded-lg sm:px-3 sm:text-[13px]"
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
            className="border-border bg-card text-foreground hover:bg-muted h-8 rounded-lg px-2.5 text-[12px] shadow-none sm:h-9 sm:rounded-lg sm:px-3 sm:text-[13px]"
          >
            <a href={viewerUrl} target="_blank" rel="noreferrer">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              PDF
            </a>
          </Button>

          {!demo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleComments}
              className="border-border bg-card text-foreground hover:bg-muted h-8 rounded-lg px-2.5 text-[12px] shadow-none sm:h-9 sm:rounded-lg sm:px-3 sm:text-[13px]"
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Calificar
            </Button>
          )}

          {canRegenerate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="border-border bg-card text-foreground hover:bg-muted h-8 rounded-lg px-2.5 text-[12px] shadow-none sm:h-9 sm:rounded-lg sm:px-3 sm:text-[13px]"
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
      <div className="border-border bg-card w-full max-w-xl overflow-hidden rounded-[1.75rem] border shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
        <div className="bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_40%,#EEF4FF_100%)] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#F59E0B] text-white shadow-none">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="min-w-0">
              <h3 className="text-foreground text-[1.2rem] font-bold tracking-[-0.05em]">
                Estamos regenerando tu material
              </h3>
              <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center justify-between text-[12px] font-semibold tracking-[0.16em] uppercase">
              <span>Progreso</span>
              <span>{Math.min(100, regenerationProgress)}%</span>
            </div>
            <div className="bg-card h-3 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)] transition-[width] duration-500"
                style={{ width: `${Math.min(100, regenerationProgress)}%` }}
              />
            </div>
          </div>

          <div className="border-border bg-card grid gap-2 rounded-[1.25rem] border px-4 py-3">
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
                    <span
                      className={
                        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      }
                    >
                      {label}
                    </span>
                  </div>
                  {isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F59E0B]" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[13px]">
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              Tiempo estimado restante: {estimatedTimeLabel}
            </span>
          </div>

          <div className="border-border bg-card rounded-[1.25rem] border px-4 py-3">
            <p className="text-foreground text-[13px] font-semibold">
              {
                regenerationStages[
                  Math.min(regenerationStageIndex, regenerationStages.length - 1)
                ]?.[1]
              }
            </p>
            <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-5">
              Podés dejar esta ventana abierta mientras armamos nuevamente el resumen y el glosario
              del PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const tabPanels = (
    <div
      key={materialId}
      role="region"
      aria-label="Contenido de estudio"
      data-onboarding-panel={recommendedActive || undefined}
      data-onboarding-transitioning={(recommendedActive && onboardingFading) || undefined}
      tabIndex={0}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset sm:px-4 sm:pb-4',
        demo && 'h-full min-h-0 overflow-y-auto',
        recommendedActive && 'transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        recommendedActive && onboardingFading && 'pointer-events-none translate-y-1 opacity-40'
      )}
    >
      {commentsOpen && activeTab === 'resumen' ? (
        <WorkspaceCard className="border-primary/20 bg-card mb-3">
          <MaterialFeedback materialId={materialId} />
        </WorkspaceCard>
      ) : null}

      <TabsContent
        data-demo-focus="study-section"
        data-recommended-summary
        value="resumen"
        className="animate-tab-panel outline-none"
      >
        <div className="mx-auto w-full max-w-[1180px] py-1 sm:py-2">
          <header className="border-border border-b pb-7 sm:pb-8">
            <h2 className="text-foreground max-w-[820px] text-[22px] leading-tight font-bold tracking-[-0.05em] sm:text-[24px]">
              {title}
            </h2>

            <p className="text-muted-foreground mt-3 max-w-[780px] text-[14px] leading-6">
              {studySummary.shortSummary}
            </p>

            {diagnosticReviewTopics.length > 0 ? (
              <div className="border-primary mt-6 border-l-2 pl-3.5">
                <p className="text-primary text-[10.5px] font-bold tracking-[0.14em] uppercase">
                  Según tu diagnóstico
                </p>
                <p className="text-foreground mt-1 text-[13.5px] font-semibold">
                  Empezá por {diagnosticReviewTopics[0]}
                </p>
              </div>
            ) : null}
          </header>

          {summaryChapters.length > 0 ? (
            <details className="group border-border bg-muted/55 mt-5 rounded-[16px] border px-4 py-3 xl:hidden">
              <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold">
                <span className="inline-flex items-center gap-2">
                  <ListTree className="text-primary h-4 w-4" />
                  Índice del resumen
                </span>
                <span className="text-muted-foreground text-[11px] font-medium">
                  {summaryChapters.length} capítulos
                </span>
              </summary>
              <nav
                className="border-border mt-3 max-h-[min(42vh,360px)] overflow-y-auto overscroll-contain border-t pt-3 pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin]"
                aria-label="Índice del resumen"
              >
                <ol className="space-y-1">
                  {summaryChapters.map((chapter, index) => (
                    <li key={chapter.anchor}>
                      <a
                        href={`#${chapter.anchor}`}
                        onClick={(event) => handleSummaryChapterNavigation(event, chapter.anchor, index)}
                        data-active-chapter={activeSummaryChapterIndex === index || undefined}
                        aria-current={activeSummaryChapterIndex === index ? 'location' : undefined}
                        className={cn(
                          'flex items-start gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2 text-[12.5px] leading-5 transition-colors',
                          activeSummaryChapterIndex === index
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-primary border-transparent'
                        )}
                      >
                        <span className={cn(
                          'mt-0.5 min-w-5 font-bold tabular-nums',
                          activeSummaryChapterIndex === index ? 'text-primary' : 'text-muted-foreground'
                        )}>
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

          <div className="mt-5 xl:grid xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start xl:gap-6 2xl:grid-cols-[240px_minmax(0,1fr)] 2xl:gap-8">
            {summaryChapters.length > 0 ? (
              <aside className="sticky top-4 hidden max-h-[calc(100vh-14rem)] self-start xl:block">
                <div className="border-border flex max-h-[calc(100vh-14rem)] min-h-0 flex-col border-l pl-4">
                  <p className="text-muted-foreground mb-3 shrink-0 text-[10.5px] font-extrabold tracking-[0.16em] uppercase">
                    Contenido
                  </p>
                  <nav
                    className="min-h-0 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable] [scrollbar-width:thin]"
                    aria-label="Índice del resumen"
                  >
                    <ol className="space-y-1.5">
                      {summaryChapters.map((chapter, index) => (
                        <li key={chapter.anchor}>
                          <a
                            href={`#${chapter.anchor}`}
                            onClick={(event) =>
                              handleSummaryChapterNavigation(event, chapter.anchor, index)
                            }
                            data-active-chapter={activeSummaryChapterIndex === index || undefined}
                            aria-current={activeSummaryChapterIndex === index ? 'location' : undefined}
                            className={cn(
                              'group flex items-start gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2 text-[12.5px] leading-5 transition-colors',
                              activeSummaryChapterIndex === index
                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-primary border-transparent'
                            )}
                          >
                            <span className={cn(
                              'min-w-5 font-bold tabular-nums transition',
                              activeSummaryChapterIndex === index ? 'text-primary' : 'text-slate-300 group-hover:text-primary'
                            )}>
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

            <main className="max-w-[800px] min-w-0">
              {summaryChapters.length > 0 ? (
                <div>
                  {summaryChapters.map((section, index) => (
                    <section
                      id={section.anchor}
                      key={`${section.title}:${section.body}`}
                      data-summary-reading-section={index}
                      tabIndex={index === 0 ? -1 : undefined}
                      className="border-border scroll-mt-6 border-b py-6 first:pt-0 last:border-b-0 last:pb-2 sm:py-7"
                    >
                      <header className="mb-3 sm:mb-4">
                        <p className="text-primary text-[10px] font-extrabold tracking-[0.18em] uppercase">
                          Capítulo {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="text-foreground mt-1.5 text-[18px] leading-6 font-bold tracking-[-0.04em]">
                          {section.displayTitle}
                        </h3>
                      </header>

                      <StudyRichText body={section.body} compact />

                      {summaryCheckPlan[index] && summaryCheckPolicy.has(index) ? (
                        <div
                          data-summary-check-trigger={index}
                          aria-hidden="true"
                          className="mt-7 h-px w-full"
                        />
                      ) : null}

                      <SummaryChapterFinish
                        chapterIndex={index}
                        chapterTitle={section.displayTitle}
                        concepts={topicStudyResources[index]?.concepts ?? []}
                        flashcards={topicStudyResources[index]?.flashcards ?? []}
                        canEvaluate={Boolean(topicQuestionCounts[index])}
                        hasNextChapter={index < summaryChapters.length - 1}
                        onEvaluate={() => startChapterEvaluation(index)}
                        onContinue={(event) => continueAfterChapter(event, index)}
                      />
                    </section>
                  ))}

                  <div ref={summaryEndRef} aria-hidden="true" className="h-8 w-full" />
                </div>
              ) : (
                <p className="text-muted-foreground text-[14px] leading-6">
                  Todavía no pudimos organizar el contenido por temas claros dentro del texto
                  extraído del PDF.
                </p>
              )}
            </main>
          </div>
        </div>
      </TabsContent>

      <TabsContent data-demo-focus="study-section" value="glosario" className="animate-tab-panel">
        <div className="px-1 py-1 sm:px-2 sm:py-2">
          {usefulGlossary.length > 0 ? (
            <div>
              <div className="border-border hidden grid-cols-[minmax(160px,0.42fr)_minmax(0,1fr)] gap-5 border-b px-2 py-3 md:grid">
                <p className="text-muted-foreground text-[11px] font-bold tracking-[0.13em] uppercase">
                  Término
                </p>
                <p className="text-muted-foreground text-[11px] font-bold tracking-[0.13em] uppercase">
                  Definición
                </p>
              </div>
              <div className="space-y-2 md:space-y-0 md:divide-y md:divide-slate-200/80">
                {usefulGlossary.map((item) => {
                  const englishTerm =
                    item.englishTerm && item.englishTerm.trim().toLowerCase() !== 'svg'
                      ? item.englishTerm
                      : null;

                  return (
                    <article
                      key={item.term}
                      className="border-border bg-card grid gap-2 rounded-xl border p-3 md:grid-cols-[minmax(160px,0.42fr)_minmax(0,1fr)] md:gap-5 md:rounded-none md:border-0 md:bg-transparent md:px-2 md:py-3"
                    >
                      <div className="space-y-1.5">
                        <h3 className="text-foreground text-[13px] font-semibold tracking-[-0.025em] md:text-[14px]">
                          {item.term}
                        </h3>
                        {englishTerm ? (
                          <p className="text-muted-foreground text-[12px] font-medium italic">
                            {englishTerm}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-foreground text-[13px] leading-5 md:text-[14px] md:leading-6">
                          {item.definition}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground px-2 py-4 text-[14px] leading-6">
              Todavía no pudimos detectar un glosario claro a partir de este PDF.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent
        data-demo-focus="study-section"
        value="tarjetas"
        forceMount
        className="animate-tab-panel data-[state=inactive]:hidden"
      >
        {/* Conservar la tanda y pausar efectos/atajos mientras se consulta otra herramienta. */}
        <Activity mode={activeTab === 'tarjetas' && !progressOpen ? 'visible' : 'hidden'}>
          <div className="px-1 py-1 sm:px-2 sm:py-2">
            <StudentMaterialFlashcards
              cards={studyArtifacts.flashcards}
              materialId={materialId}
              onComplete={demo ? undefined : requestExamDatePrompt}
              demoMode={Boolean(demo)}
            />
          </div>
        </Activity>
      </TabsContent>

      <TabsContent
        value="ejercicios"
        forceMount
        className="animate-tab-panel data-[state=inactive]:hidden"
      >
        <Activity mode={activeTab === 'ejercicios' && !progressOpen ? 'visible' : 'hidden'}>
          <div data-recommended-practice className="px-1 py-1 sm:px-2 sm:py-2">
            {demo ? (
              demo.practice
            ) : diagnosticMode ? (
              <StudentMaterialDiagnostic
                artifacts={studyArtifacts}
                sections={studySummary.sections}
                materialId={materialId}
                guided={recommendedActive}
                demo={Boolean(demo)}
                session={recommendedActive ? recommendedSession : undefined}
                onSessionChange={recommendedActive ? setRecommendedSession : undefined}
                onExit={() => {
                  setDiagnosticMode(false);
                  if (recommendedActive) {
                    setRecommendedTourStep(null);
                    changeRecommendedTab('resumen');
                  }
                }}
                onResult={(result) => {
                  if (recommendedActive) {
                    setDiagnosticReviewTopics(result.reviewTopics);
                  }
                }}
                onRestart={() => {
                  setRecommendedTourStep(null);
                }}
                onReinforce={openRecommendedErrors}
                onComplete={demo || recommendedActive ? undefined : requestExamDatePrompt}
                onReviewTopics={(topics) => {
                  setDiagnosticReviewTopics(topics);
                  if (!recommendedActive) setDiagnosticMode(false);
                  changeRecommendedTab('resumen');
                }}
              />
            ) : (
              <StudentMaterialExam
                key={practiceSectionIndex ?? 'all'}
                topicSectionIndex={practiceSectionIndex}
                entrySource={practiceEntry.source}
                entryId={practiceEntry.id}
                onContinueToTopic={(index) => {
                  if (!Number.isInteger(index) || index < 0 || index >= studySummary.sections.length) return;
                  setTopicReturn(null);
                  setPracticeSectionIndex(index);
                  setDiagnosticMode(false);
                  handleStudyTabChange('ejercicios', 'summary_chapter');
                }}
                onReturnToTopic={
                  hasProgress
                    ? (reinforce, outcome) => {
                        if (practiceSectionIndex === undefined) return;
                        setTopicReturn((previous) => ({
                          index: practiceSectionIndex,
                          reinforce,
                          outcome:
                            outcome ??
                            (previous?.index === practiceSectionIndex
                              ? previous.outcome
                              : undefined),
                        }));
                        setProgressOpen(true);
                      }
                    : undefined
                }
                artifacts={studyArtifacts}
                sections={studySummary.sections}
                materialId={materialId}
                onComplete={practiceSectionIndex === undefined ? requestExamDatePrompt : undefined}
              />
            )}
          </div>
        </Activity>
      </TabsContent>

      <TabsContent data-demo-focus="study-section" value="mapa" className="animate-tab-panel">
        {isPremium ? (
          <StudyDocumentShell
            compact
            title="Mapa mental"
            description={
              demo
                ? undefined
                : 'Vista de los temas y conceptos principales detectados en este PDF.'
            }
          >
            <div
              className={cn(
                'grid',
                demo
                  ? 'grid-cols-2 items-start gap-3'
                  : 'gap-3 xl:grid-cols-[1fr_200px_1fr] xl:items-center'
              )}
            >
              <div
                className={cn('border-border bg-card min-w-0 rounded-2xl border', 'space-y-2 p-3')}
              >
                <p
                  className={cn(
                    'text-muted-foreground font-semibold uppercase',
                    demo ? 'text-xs! leading-4! tracking-normal' : 'text-xs tracking-[0.16em]'
                  )}
                >
                  {demo ? 'Temas' : 'Temas principales'}
                </p>
                {fullSummarySections.slice(0, 4).map((section, index) => (
                  <div key={section.title} className={'space-y-2'}>
                    <p
                      className={cn(
                        'text-foreground text-[13px] font-medium break-words',
                        demo && 'text-[13px]! leading-5!'
                      )}
                    >
                      {section.title}
                    </p>
                    {index < Math.min(3, fullSummarySections.length - 1) ? (
                      <div className="h-px bg-slate-100" />
                    ) : null}
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  'border-primary/20 bg-primary/5 rounded-2xl border px-3 py-3 text-center shadow-none',
                  demo && 'order-first col-span-2 py-2'
                )}
              >
                <p
                  className={cn(
                    'text-primary/80 text-xs font-semibold tracking-[0.18em] uppercase',
                    demo && 'text-xs! leading-4!'
                  )}
                >
                  Nodo central
                </p>
                <p
                  className={cn(
                    'text-foreground mt-2.5 text-base font-semibold tracking-[-0.03em]',
                    demo && 'mt-2 text-sm! leading-5!'
                  )}
                >
                  {title}
                </p>
                {materiaName && (
                  <p className="text-muted-foreground mt-1.5 text-[13px] leading-[1.45]">
                    {materiaName}
                  </p>
                )}
              </div>

              <div
                className={cn('border-border bg-card min-w-0 rounded-2xl border', 'space-y-2 p-3')}
              >
                <p
                  className={cn(
                    'text-muted-foreground font-semibold uppercase',
                    demo ? 'text-xs! leading-4! tracking-normal' : 'text-xs tracking-[0.16em]'
                  )}
                >
                  {demo ? 'Conceptos' : 'Conceptos clave'}
                </p>
                {usefulGlossary.slice(0, 4).map((item, index) => (
                  <div key={item.term} className={'space-y-2'}>
                    <p
                      className={cn(
                        'text-foreground text-[13px] font-medium break-words',
                        demo && 'text-[13px]! leading-5!'
                      )}
                    >
                      {item.term}
                    </p>
                    {index < Math.min(3, usefulGlossary.length - 1) ? (
                      <div className="h-px bg-slate-100" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </StudyDocumentShell>
        ) : (
          <div className="border-border bg-card rounded-2xl border p-4 sm:p-5">
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
      {hasProgress ? (
        <TabsContent
          value="progreso"
          forceMount
          className="animate-tab-panel data-[state=inactive]:hidden"
        >
          {progressOpen
            ? (displayedProgressContent ??
              (progressConfig ? (
                <MaterialProgressContent
                  glossary={studyGlossary}
                  flashcards={studyArtifacts.flashcards}
                  sourcePdfHref={viewerUrl}
                  showOnboardingExample={showOnboardingExample}
                  showOnboardingTopic={showOnboardingTopic}
                  material={{ id: materialId, title }}
                  sections={studySummary.sections}
                  questionCounts={progressConfig.questionCounts}
                  initialTopicSectionIndex={topicReturn?.index}
                  initialReinforce={topicReturn?.reinforce}
                  lastPracticeOutcome={topicReturn?.outcome}
                  onPracticeTopic={(index) => {
                    if (isOwner && !demo) {
                      trackMarketingEvent('pdf_progress_practice_clicked', {
                        material_id: materialId,
                        section_index: index,
                      });
                    }
                    setTopicReturn((previous) => ({
                      index,
                      reinforce: false,
                      outcome: previous?.index === index ? previous.outcome : undefined,
                    }));
                    setPracticeSectionIndex(index);
                    setDiagnosticMode(false);
                    handleStudyTabChange('ejercicios', 'summary_chapter');
                  }}
                  requestedError={topicReturn ? undefined : progressConfig.requestedError}
                  
                  returnToErrors={progressConfig.returnToErrors}
                />
              ) : null))
            : null}
        </TabsContent>
      ) : null}
      {children}
    </div>
  );

  const content = (
    <Tabs
      data-demo-focus="study"
      value={progressOpen ? 'progreso' : activeTab}
      onValueChange={(value) => {
        setProgressOpen(value === 'progreso');
        if (value === 'progreso') {
          setIsViewerVisible(false);
          return;
        }
        handleStudyTabChange(value);
      }}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-hidden"
    >
      {tabHeader}
      {regenerationOverlay}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            (!demo || demo.progress) &&
              !progressOpen &&
              activeTab === 'resumen' &&
              isViewerVisible &&
              'hidden'
          )}
        >
          {tabPanels}
        </div>
        {(!demo || demo.progress) && !progressOpen && activeTab === 'resumen' && isViewerVisible ? (
          <div data-demo-focus="pdf" className="bg-card absolute inset-0 z-10 min-h-0 p-2">
            <PdfViewer
              url={viewerUrl}
              title={title}
              subtitle={null}
              className="border-border bg-card h-full min-h-0 rounded-2xl border"
              heightClassName="h-full min-h-0"
              pageMaxWidthClassName="max-w-[760px]"
              showSidebarThumbnails={false}
              theme="default"
              initialPage={initialPdfPage}
              persistView
              sourceMode="blob"
            />
          </div>
        ) : null}
      </div>
    </Tabs>
  );

  return (
    <div
      data-progress-open={progressOpen ? 'true' : undefined}
      className={cn(
        'bg-card text-foreground flex flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0',
        pdfStudyControlsClassName,
        demo
          ? demo.progress
            ? 'h-full min-h-0'
            : 'min-h-screen xl:h-full xl:min-h-0'
          : 'h-[var(--material-study-height,100dvh)] min-h-0 flex-1'
      )}
    >
      <PdfMobileNavigation
        hasPendingErrors={hasPendingStudyErrors}
        active={progressOpen ? 'progreso' : activeTab}
        showProgress={Boolean(hasProgress || (isOwner && !demo))}
        onSelect={(section) => {
          if (section === 'progreso') {
            if (hasProgress) {
              setProgressOpen(true);
              setIsViewerVisible(false);
            } else {
              trackMarketingEvent('cta_click', {
                location: 'material_study_tabs',
                cta_name: 'progress_this_pdf',
                destination: materialErrorsHref,
              });
              router.push(materialErrorsHref);
            }
            return;
          }
          demo?.onProgressChange?.(false);
          handleStudyTabChange(section);
        }}
      />
      {activeSummaryCheck ? (
        <SummaryTopicCheckPopup
          open
          materialId={materialId}
          chapterIndex={activeSummaryCheck.chapterIndex}
          topicTitle={cleanSummaryChapterTitle(activeSummaryCheck.chapterTitle)}
          questions={activeSummaryCheck.questions}
          recordResults={materialId !== 'demo-material'}
          onContinue={handleSummaryCheckContinue}
        />
      ) : null}
      {summaryCompletionOpen && (
        <SummaryCompletionPopup
          open={summaryCompletionOpen}
          pendingCount={summaryEndPendingCount ?? 0}
          isPremium={isPremium}
          onClose={() => setSummaryCompletionOpen(false)}
          onErrors={() => {
            trackMarketingEvent('summary_next_step_clicked', {
              material_id: materialId,
              action: 'errors',
              pending_count: summaryEndPendingCount ?? 0,
              flow_version: SUMMARY_FLOW_VERSION,
            });
            setSummaryCompletionOpen(false);
            router.push(`/dashboard/explicaciones?material=${encodeURIComponent(materialId)}`);
          }}
          onPractice={() => {
            trackMarketingEvent('summary_next_step_clicked', {
              material_id: materialId,
              action: 'practice',
              entry_source: 'summary_popup',
              pending_count: summaryEndPendingCount ?? 0,
              flow_version: SUMMARY_FLOW_VERSION,
            });
            setSummaryCompletionOpen(false);
            handleStudyTabChange('ejercicios', 'summary_popup');
          }}
          onReview={(tab) => {
            trackMarketingEvent('summary_next_step_clicked', {
              material_id: materialId,
              action: tab,
              pending_count: summaryEndPendingCount ?? 0,
              flow_version: SUMMARY_FLOW_VERSION,
            });
            setSummaryCompletionOpen(false);
            handleStudyTabChange(tab);
          }}
        />
      )}
      <PdfStudyStartGuide
        open={studyStartGuideOpen && !recommendedActive}
        firstTopicTitle={studySummary.sections.length > 0 ? summaryChapters[0]?.displayTitle ?? null : null}
        resources={firstTopicResources}
        onStart={startFirstTopic}
        onDismiss={() => setStudyStartGuideOpen(false)}
      />
      {isOwner && materialId !== 'demo-material' ? (
        <ExamDatePlanPrompt
          materialId={materialId}
          fileName={fileName}
          triggerNonce={examDatePromptTrigger}
        />
      ) : null}
      <section className="bg-card shrink-0 border-b border-[#E8EDF5]">
        <div className={`mx-auto flex w-full items-center gap-4 px-4 py-2 sm:px-6 ${progressOpen && !recommendedActive ? 'max-w-none lg:px-5' : 'max-w-[1600px] lg:px-4'}`}>
          <div className="min-w-0 flex-1">
            <Link
              href={backHref}
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-[11.5px] font-semibold transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver
            </Link>

            <div className="mt-0.5 flex min-w-0 items-baseline gap-3">
              <h1 className="text-foreground min-w-0 truncate text-[1.05rem] font-bold tracking-[-0.035em] sm:text-[1.12rem]">
                {title}
              </h1>
            </div>
          </div>

          <MaterialMetadata
            carreraName={carreraName}
            universidadName={universidadName}
            materiaName={materiaName}
          />
        </div>
      </section>

      {recommendedActive && recommendedTourStep && (
        <RecommendedStudyGuide
            step={recommendedTourStep}
            transitioning={onboardingFading || guideCompletionPending}
            onExit={() => { if (!guideCompletionPending) closeRecommendedTour('skipped'); }}
            onBack={
              recommendedTourStep === 'practice'
                ? () => transitionRecommendedTour(() => {
                    setProgressOpen(false);
                    changeRecommendedTab('resumen');
                    setRecommendedTourStep('summary');
                  })
                : recommendedTourStep === 'progress'
                  ? () => transitionRecommendedTour(() => {
                      setProgressOpen(false);
                      changeRecommendedTab('ejercicios');
                      setRecommendedTourStep('practice');
                    })
                  : recommendedTourStep === 'reinforce'
                    ? () => transitionRecommendedTour(() => {
                        setProgressOpen(true);
                        setRecommendedTourStep('progress');
                      })
                    : undefined
            }
            onNext={() => transitionRecommendedTour(() => {
              if (recommendedTourStep === 'summary') {
                // La transición muestra la pantalla de práctica, no solo su botón.
                setPracticeSectionIndex(undefined);
                setDiagnosticMode(false);
                setProgressOpen(false);
                changeRecommendedTab('ejercicios');
                setRecommendedTourStep('practice');
              } else if (recommendedTourStep === 'practice') {
                setProgressOpen(true);
                setRecommendedTourStep('progress');
              } else if (recommendedTourStep === 'progress') {
                setProgressOpen(true);
                setRecommendedTourStep('reinforce');
              } else {
                void finishRecommendedTour();
              }
            })}
          />
      )}

      {/* El tutorial mantiene la tarjeta fuera del lector sin reducir tanto su altura visible. */}
      {recommendedActive && recommendedTourStep ? (
        <div aria-hidden="true" data-onboarding-guide-space className="h-28 shrink-0 md:h-2" />
      ) : null}

      <section className={`mx-auto flex min-h-0 w-full flex-1 flex-col px-2 py-2 sm:px-4 xl:pb-3 ${progressOpen && !recommendedActive ? 'max-w-none xl:px-5' : 'max-w-[1600px] xl:px-4'}`}>
        <div className="hidden min-h-0 flex-1 xl:flex">
          <div data-onboarding-study-panel data-onboarding-step={recommendedActive ? recommendedTourStep : undefined} className="border-border bg-card relative h-full min-h-0 w-full overflow-hidden rounded-2xl border shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
            <Tabs
              data-demo-focus="study"
              value={progressOpen ? 'progreso' : activeTab}
              onValueChange={(value) => {
                setProgressOpen(value === 'progreso');
                if (value === 'progreso') {
                  setIsViewerVisible(false);
                  return;
                }
                handleStudyTabChange(value);
              }}
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {tabHeader}
              {regenerationOverlay}
              <div className="flex min-h-0 flex-1">
                <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0 flex-1">
                  <ResizablePanel
                    id="study-content-panel"
                    order={1}
                    defaultSize={isViewerVisible ? 60 : 100}
                    minSize={42}
                  >
                    <div className="bg-card flex h-full min-w-0 flex-col">{tabPanels}</div>
                  </ResizablePanel>

                  {isViewerVisible ? <ResizableHandle withHandle className="bg-card" /> : null}

                  {isViewerVisible ? (
                    <ResizablePanel id="study-viewer-panel" order={2} defaultSize={40} minSize={26}>
                      <div data-demo-focus="pdf" className="bg-card relative h-full min-w-0 p-2">
                        <button
                          type="button"
                          onClick={() => setIsViewerVisible(false)}
                          className="border-border bg-card text-muted-foreground hover:bg-muted absolute top-1/2 left-0 z-20 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-none transition"
                          aria-label="Ocultar PDF"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <PdfViewer
                          url={viewerUrl}
                          title={demo ? 'PDF de muestra' : title}
                          subtitle={null}
                          className="border-border bg-card h-full rounded-2xl border shadow-none"
                          heightClassName="h-full min-h-0"
                          pageMaxWidthClassName="max-w-[720px]"
                          showSidebarThumbnails={false}
                          theme="default"
                          initialPage={initialPdfPage}
                          persistView={!demo}
                          sourceMode={demo ? 'url' : 'blob'}
                        />
                      </div>
                    </ResizablePanel>
                  ) : null}
                </ResizablePanelGroup>
              </div>
            </Tabs>

            {activeTab === 'resumen' && !progressOpen && !isViewerVisible ? (
              <button
                type="button"
                onClick={() => setIsViewerVisible(true)}
                className="border-border bg-card text-muted-foreground hover:bg-muted absolute top-1/2 right-4 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-none transition"
                aria-label="Mostrar PDF"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            'xl:hidden',
            demo && !demo.progress ? 'space-y-4' : 'flex min-h-0 flex-1 flex-col'
          )}
        >
          <div data-onboarding-study-panel data-onboarding-step={recommendedActive ? recommendedTourStep : undefined} className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-none">
            {content}
          </div>

          {demo && !demo.progress && activeTab === 'resumen' ? (
            isViewerVisible ? (
              <div
                data-demo-focus="pdf"
                className="border-border bg-card relative hidden overflow-hidden rounded-2xl border p-2 shadow-none md:block"
              >
                <button
                  type="button"
                  onClick={() => setIsViewerVisible(false)}
                  className="border-border bg-card text-muted-foreground hover:bg-muted absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-none transition"
                  aria-label="Ocultar PDF"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <PdfViewer
                  url={viewerUrl}
                  title={demo ? 'PDF de muestra' : title}
                  subtitle={null}
                  className={cn(
                    'border-border bg-card rounded-2xl border shadow-none',
                    demo &&
                      'h-[var(--demo-visible-height,58vh)] sm:h-[var(--demo-visible-height,62vh)] [&>div:first-child]:px-1 [&>div:first-child>div>div:last-child]:gap-1'
                  )}
                  heightClassName={demo ? 'h-full min-h-0' : 'h-[58vh] sm:h-[62vh]'}
                  pageMaxWidthClassName="max-w-[760px]"
                  showSidebarThumbnails={false}
                  theme="default"
                  initialPage={initialPdfPage}
                  persistView={!demo}
                  sourceMode={demo ? 'url' : 'blob'}
                />
              </div>
            ) : (
              <div className="bg-card/80 hidden rounded-2xl border border-dashed border-slate-300 px-4 py-3 shadow-none md:block">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-[12px] font-semibold tracking-[0.16em] uppercase">
                      PDF oculto
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] leading-5">
                      Mostrá el documento cuando quieras contrastar el resumen con el archivo
                      original.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsViewerVisible(true)}
                    className="border-border bg-card text-muted-foreground hover:bg-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-none transition"
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
