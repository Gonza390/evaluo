'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import {
    type StudentMaterialProcessingState,
} from '@/app/dashboard/materiales/actions';
import { processStudentMaterialAction } from '@/app/dashboard/materiales/processing-actions';
import { FreeUploadLimitScreen } from '@/components/dashboard/free-upload-limit-screen';
import { nextFreeUploadAt } from '@/lib/free-study-v2';
import type { PremiumUpgrade } from '@/lib/premium-flow';
import { saveStudentMaterialExamContextAction } from '@/app/dashboard/materiales/context-actions';
import { savePdfFirstAcademicContextAction } from '@/app/dashboard/materiales/pdf-first-context-actions';
import { loadDashboardAcademicOptionsAction } from '@/app/dashboard/materiales/academic-options-actions';
import {
  cancelPdfFirstUploadAction,
  finalizePdfFirstUploadAction,
  preparePdfClientVisionUploadsAction,
  preparePdfFirstUploadAction,
} from '@/app/dashboard/materiales/pdf-first-upload-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { studentEntryText } from '@/lib/i18n/student-entry-copy';
import { firstUploadErrorMessage } from '@/lib/i18n/first-upload-error';
import { getStudentMaterialRoute } from '@/lib/routes';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { consumeFirstPdfDemoUpload } from '@/lib/first-pdf-demo-analytics';
import { clearPdfFirstDraft, loadPdfFirstDraft } from '@/lib/pdf-first-draft';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { CLIENT_VISION_MAX_PAGES } from '@/lib/student-materials/client-vision-cache';
import { countPdfPagesInBrowser } from '@/lib/student-materials/pdf-page-count-client';
import { trackUploadFailure, type UploadFailureStage } from '@/lib/student-materials/upload-failure';
import {
  inspectPdfForClientVision,
  renderPdfPagesForClientVision,
} from '@/lib/student-materials/client-pdf-vision-render';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES, isSupportedStudentMaterialFile, studentMaterialFileKind, STUDENT_MATERIAL_DOCX_MIME } from '@/lib/student-materials/file-rules';
import { createSingleFlightPolling } from '@/lib/student-materials/processing-polling';
import { fetchStudentMaterialProcessingState } from '@/lib/student-materials/processing-state-client';
import { PdfProcessingPanel } from '@/components/pdf-processing/pdf-processing-panel';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

type UniversidadOption = { id: string; nombre: string };
type CarreraOption = { id: string; nombre: string; universidad_id: string | null };
const MISSING_UNIVERSITY_VALUE = '__missing_university__';
const CLIENT_VISION_FAST_MAX_PAGES = 8;
const CLIENT_VISION_BUDGET_MS = 3000;

function canPreRenderPdfOnDevice() {
  if (!navigator.hardwareConcurrency || navigator.hardwareConcurrency < 4) return false;
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return !(device.deviceMemory && device.deviceMemory < 4) && !device.connection?.saveData;
}

type Props = {
  children: ReactNode;
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
  initialExamDate?: string;
  initialSource?: string;
  trackingMateriaId?: string;
  initialOpen?: boolean;
};

function titleFromFile(name: string) {
  return (
    name
      .replace(/\.(pdf|docx)$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180) || 'Material de estudio'
  );
}

function isTransientProcessingFailure(message: string | null | undefined) {
  if (!message) return false;
  return /timeout|timed out|429|500|502|503|504|unavailable|temporar|fetch failed|econn|socket|representaci[oó]n acad[eé]mica|ocr autom[aá]tico no pudo/i.test(
    message
  );
}

/**
 * Explicit upload command shared by dashboard CTAs. Copy changes never alter
 * the behavior of another button, and nested buttons retain their own onClick.
 */
const PdfUploadTriggerContext = createContext<((location?: string) => void) | null>(null);
const PdfDropUploadContext = createContext<((file: File) => void) | null>(null);

export function usePdfUploadTrigger() {
  const trigger = useContext(PdfUploadTriggerContext);
  if (!trigger) throw new Error('usePdfUploadTrigger requires PdfFirstUploadShell');
  return trigger;
}

export function usePdfDropUpload() {
  const upload = useContext(PdfDropUploadContext);
  if (!upload) throw new Error('usePdfDropUpload requires PdfFirstUploadShell');
  return upload;
}

export function PdfFirstUploadShell({
  children,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId = '',
  initialExamDate = '',
  initialSource = '',
  trackingMateriaId = '',
  initialOpen = false,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale } = useAppLocale();
  const t = (value: string) => studentEntryText(locale, value);
  const pageLimitMessage = (pageCount: number | null | undefined, maxPages: number) => {
    const pages = typeof pageCount === 'number' && pageCount > 0 ? pageCount : null;
    return locale === 'en'
      ? `${pages ? `This PDF has ${pages} pages. ` : ''}The free plan accepts up to ${maxPages} pages per document. Upload only the chapters for your exam, or try a sample material first.`
      : `${pages ? `Tu PDF tiene ${pages} páginas. ` : ''}En el plan gratis se pueden subir hasta ${maxPages} páginas por documento. Subí solo los capítulos de tu examen o probá primero con un apunte de ejemplo.`;
  };
  const isPreAuthPdfResume =
    initialSource.startsWith('pdf-first-landing') || initialSource.startsWith('home-pdf-first-');
  // El catálogo y el perfil académico se solicitan sólo si el estudiante
  // abre la opción de universidad/carrera. Nunca se cargan con Mi espacio.
  const [universidades, setUniversidades] = useState<UniversidadOption[]>([]);
  const [carreras, setCarreras] = useState<CarreraOption[]>([]);
  const [academicChoicesStatus, setAcademicChoicesStatus] =
    useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle');
  const [academicChoicesError, setAcademicChoicesError] = useState('');
  const academicFetchInFlightRef = useRef(false);
  const academicFetchVersionRef = useRef(0);
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const resumeHandledRef = useRef(false);
  const readyTrackedRef = useRef(false);
  const firstPdfReadyTrackedRef = useRef(false);
  const autoRetryCountsRef = useRef<Record<string, number>>({});
  const autoRetryingMaterialRef = useRef<string | null>(null);
  const processingPollRef = useRef(createSingleFlightPolling<StudentMaterialProcessingState | null>());
  const [open, setOpen] = useState(initialOpen && initialSource !== 'signup-direct');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState(initialExamDate);
  const [uploading, setUploading] = useState(false);
  // Límite Free verificado por el servidor: se muestra tras elegir el archivo.
  const [uploadLimit, setUploadLimit] = useState<{ fileName: string; fileSize: number; href: string } | null>(null);
  const [processing, setProcessing] = useState<StudentMaterialProcessingState | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [universityId, setUniversityId] = useState(initialUniversidadId);
  const [requestingUniversity, setRequestingUniversity] = useState(false);
  const [newUniversity, setNewUniversity] = useState('');
  const [careerId, setCareerId] = useState(initialCarreraId);
  const [addingCareer, setAddingCareer] = useState(false);
  const [newCareer, setNewCareer] = useState('');
  const [savingContext, setSavingContext] = useState(false);
  const [profileUniversitySaved, setProfileUniversitySaved] = useState(false);
  const [profileUniversityName, setProfileUniversityName] = useState('');
  const [contextSaved, setContextSaved] = useState(false);
  const [savedContextLabel, setSavedContextLabel] = useState('');
  const [showReadyContext, setShowReadyContext] = useState(false);
  const [restoringDraft, setRestoringDraft] = useState(initialOpen && isPreAuthPdfResume);
  // Error de la última subida, visible dentro del diálogo (antes solo era un aviso que se iba).
  // blocking: reintentar con el mismo archivo va a fallar igual (por ejemplo, límite de páginas).
  const [uploadError, setUploadError] = useState<{ message: string; blocking: boolean } | null>(null);

  useEffect(() => {
    if (!showReadyContext || academicChoicesStatus !== 'idle' || academicFetchInFlightRef.current) return;
    academicFetchInFlightRef.current = true;
    const requestVersion = ++academicFetchVersionRef.current;
    setAcademicChoicesStatus('loading');

    void loadDashboardAcademicOptionsAction()
      .then((result) => {
        if (requestVersion !== academicFetchVersionRef.current) return;
        if (!result.success) {
          setAcademicChoicesError(result.message);
          setAcademicChoicesStatus('failed');
          return;
        }

        const profileUniversityId = result.profile.universidadId ?? '';
        const profileCareerId = result.profile.carreraId ?? '';
        // Un enlace a una materia tiene prioridad sobre el perfil para
        // el contexto de carga. Si no existe, retomamos los datos guardados.
        const initialUniversityId =
          result.universidades.some((option) => option.id === initialUniversidadId)
            ? initialUniversidadId
            : profileUniversityId;
        const resolvedUniversityId =
          result.universidades.some((option) => option.id === initialUniversityId)
            ? initialUniversityId
            : '';
        const preferredCareerId =
          initialCarreraId && initialUniversidadId === resolvedUniversityId
            ? initialCarreraId
            : profileCareerId;
        const resolvedCareerId =
          result.carreras.some(
            (option) =>
              option.id === preferredCareerId &&
              option.universidad_id === resolvedUniversityId
          )
            ? preferredCareerId
            : '';

        const savedUniversity = result.universidades.find(
          (option) => option.id === profileUniversityId
        );
        const savedCareer = result.carreras.find(
          (option) => option.id === profileCareerId &&
            option.universidad_id === profileUniversityId
        );
        setUniversidades(result.universidades);
        setCarreras(result.carreras);
        setUniversityId(resolvedUniversityId);
        setCareerId(resolvedCareerId);
        const savedUniversityMatchesSelection =
          Boolean(savedUniversity) && profileUniversityId === resolvedUniversityId;
        setProfileUniversitySaved(savedUniversityMatchesSelection);
        setProfileUniversityName(savedUniversityMatchesSelection ? savedUniversity?.nombre ?? '' : '');
        const profileMatchesSelection =
          Boolean(savedUniversity && savedCareer) &&
          profileUniversityId === resolvedUniversityId &&
          profileCareerId === resolvedCareerId;
        setContextSaved(profileMatchesSelection);
        setSavedContextLabel(
          [savedUniversity?.nombre, savedCareer?.nombre].filter(Boolean).join(' · ')
        );
        setAcademicChoicesError('');
        setAcademicChoicesStatus('loaded');
      })
      .catch(() => {
        if (requestVersion !== academicFetchVersionRef.current) return;
        setAcademicChoicesError(t("No pudimos cargar universidades y carreras. Intentá nuevamente."));
        setAcademicChoicesStatus('failed');
      })
      .finally(() => {
        if (requestVersion === academicFetchVersionRef.current) {
          academicFetchInFlightRef.current = false;
        }
      });
  }, [showReadyContext, academicChoicesStatus, initialUniversidadId, initialCarreraId]);

  const selectedUniversity = universidades.find((item) => item.id === universityId) ?? null;
  const availableCareers = useMemo(
    () => (universityId ? carreras.filter((item) => item.universidad_id === universityId) : []),
    [carreras, universityId]
  );
  const selectedCareer = availableCareers.find((item) => item.id === careerId) ?? null;

  const hasValidTitle = title.trim().length >= 3;
  const universityName = requestingUniversity
    ? newUniversity.trim()
    : (selectedUniversity?.nombre ?? '');
  const careerName = addingCareer ? newCareer.trim() : (selectedCareer?.nombre ?? '');
  const hasUniversity = requestingUniversity ? universityName.length >= 3 : Boolean(universityId);
  const hasCareer = addingCareer ? careerName.length >= 3 : Boolean(careerId);
  const canSaveContext = Boolean(
    hasUniversity && !contextSaved && (!profileUniversitySaved || hasCareer)
  );
  const ready = processing?.status === 'ready';
  const failed = processing?.status === 'failed';
  const progress = processing
    ? ready
      ? 100
      : Math.min(96, Math.max(displayProgress, processing.progress))
    : 0;

  useEffect(() => {
    if (initialOpen && initialSource !== 'signup-direct') setOpen(true);
  }, [initialOpen, initialSource]);

  useEffect(() => {
    if (!processing || processing.status === 'ready' || processing.status === 'failed') return;
    let active = true;
    const materialId = processing.materialId;

    const poll = async () => {
      if (document.visibilityState === 'hidden') return;
      const outcome = await processingPollRef.current.run(
        () => fetchStudentMaterialProcessingState(materialId)
      );
      if (!active || outcome.kind === 'busy') return;
      if (outcome.kind === 'error') {
        // Un error transitorio de transporte no indica que la IA haya fallado.
        // Después de varios intentos avisamos sin bloquear la recuperación.
        if (outcome.consecutiveFailures === 3) {
          setProcessing((current) =>
            current?.materialId === materialId
              ? { ...current, message: t("Seguimos procesando tu PDF. Estamos restableciendo la conexión…") }
              : current
          );
        }
        return;
      }
      const state = outcome.value;
      if (!state) return;
      if (
        state.status === 'failed' &&
        isTransientProcessingFailure(state.error) &&
        (autoRetryCountsRef.current[state.materialId] ?? 0) < 2
      ) {
        if (autoRetryingMaterialRef.current === state.materialId) return;
        autoRetryCountsRef.current[state.materialId] =
          (autoRetryCountsRef.current[state.materialId] ?? 0) + 1;
        autoRetryingMaterialRef.current = state.materialId;
        setProcessing({
          ...state,
          status: 'processing',
          stage: 'extracting',
          progress: Math.max(12, state.progress),
          message: t("Tuvimos una interrupción temporal. Reintentando automáticamente…"),
          error: null,
        });
        window.setTimeout(() => {
          // La sesión visual puede cambiar de estado; el retry pertenece al job.
          void processStudentMaterialAction(state.materialId)
            .catch(() => {
              // El resultado definitivo se consulta por polling y es recuperable.
            })
            .finally(() => {
              if (autoRetryingMaterialRef.current === state.materialId) {
                autoRetryingMaterialRef.current = null;
              }
            });
        }, 1800);
        return;
      }

      if (state.status === 'failed' && autoRetryingMaterialRef.current === state.materialId) {
        return;
      }
      setProcessing(state);
      setDisplayProgress((current) => Math.max(current, state.progress));
      if (state.status === 'ready') router.refresh();
    };

    // Una sola solicitud a la vez, en vez de generar peticiones concurrentes
    // cada 1,4 segundos cuando el servidor tarda en responder.
    void poll();
    const interval = window.setInterval(() => { void poll(); }, 3_500);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [processing?.materialId, processing?.status, router]);

  const reset = useCallback(() => {
    setFile(null);
    setUploadError(null);
    setTitle('');
    setExamDate(initialExamDate);
    setUploading(false);
    setProcessing(null);
    setDisplayProgress(0);
    setUniversityId(initialUniversidadId);
    setRequestingUniversity(false);
    setNewUniversity('');
    setCareerId(initialCarreraId);
    setAddingCareer(false);
    setNewCareer('');
    setSavingContext(false);
    setProfileUniversitySaved(false);
    setProfileUniversityName('');
    setContextSaved(false);
    setSavedContextLabel('');
    setUniversidades([]);
    setCarreras([]);
    academicFetchVersionRef.current += 1;
    academicFetchInFlightRef.current = false;
    setAcademicChoicesStatus('idle');
    setAcademicChoicesError('');
    setShowReadyContext(false);
    readyTrackedRef.current = false;
    firstPdfReadyTrackedRef.current = false;
  }, [initialCarreraId, initialExamDate, initialUniversidadId]);

  const close = useCallback(() => {
    if (uploading) return;
    const shouldRefresh = Boolean(processing);
    setOpen(false);
    reset();
    if (shouldRefresh) router.refresh();
  }, [processing, reset, router, uploading]);

  const openUploadPicker = useCallback((location?: string) => {
    if (uploading) return;
    if (location === 'dashboard_empty' || location === 'dashboard_empty_materials') {
      trackMarketingEvent('first_pdf_cta_clicked', {
        location,
        source: initialSource || 'dashboard',
      });
    }
    trackMarketingEvent('pdf_picker_opened', {
      location: location || 'dashboard_upload',
      source: initialSource || 'dashboard',
    });

    // No abrir un segundo dropzone vacío sobre la pantalla de bienvenida.
    // El diálogo se abre cuando ya existe un PDF elegido.
    if (location !== 'dashboard_empty') setOpen(true);
    pickerRef.current?.click();
  }, [initialSource, uploading]);

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    if (
      !isSupportedStudentMaterialFile(selected.name, selected.type)
    ) {
      toast({ description: t("Aceptamos archivos PDF y Word (.docx)."), variant: 'destructive' });
      return;
    }
    if (selected.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      trackUploadFailure({
        stage: 'too_large',
        source: initialSource || 'dashboard',
        flow: 'manual',
        fileSizeBytes: selected.size,
      });
      toast({
        description: t("El PDF supera el tamaño máximo permitido de 20 MB."),
        variant: 'destructive',
      });
      return;
    }
    trackMarketingEvent('pdf_selected', {
      location: 'pdf_first_upload',
      source: initialSource || 'dashboard',
      file_size_bytes: selected.size,
    });
    setUploadError(null);
    setFile(selected);
    setTitle(titleFromFile(selected.name));
    setExamDate(initialExamDate);
    return true;
  };

  const uploadDroppedFile = (selected: File) => {
    if (uploading) return;
    if (selectFile(selected)) {
      setOpen(true);
      void startProcessing(selected, titleFromFile(selected.name));
    }
  };

  const showUploadLimit = (upgrade: PremiumUpgrade | undefined, activeFile: File) => {
    if (upgrade?.reason !== 'material_upload') return false;
    setUploadLimit({ fileName: activeFile.name, fileSize: activeFile.size, href: upgrade.href });
    setOpen(false);
    return true;
  };

  const startProcessing = async (selectedFile?: File | null, selectedTitle?: string) => {
    const activeFile = selectedFile ?? file;
    const activeTitle =
      (selectedTitle ?? title).trim() || (activeFile ? titleFromFile(activeFile.name) : '');
    if (!activeFile || activeTitle.length < 3 || uploading) return;

    setUploading(true);
    setUploadError(null);
    let preparedPath: string | null = null;
    let stage: UploadFailureStage = 'prepare';
    const uploadSource = initialSource || 'dashboard';
    const flow = isPreAuthPdfResume ? 'draft_resume' as const : 'manual' as const;
    // Contar páginas antes de transferir: un PDF de 15 MB no debería subirse entero
    // para enterarse al final de que supera el límite del plan.
    const declaredPageCount = await countPdfPagesInBrowser(activeFile);
    const failWith = (
      failedStage: UploadFailureStage,
      message: string | null | undefined,
      extra: { maxPages?: number | null; pageCount?: number | null } = {}
    ) => {
      trackUploadFailure({
        stage: failedStage,
        source: uploadSource,
        flow,
        fileSizeBytes: activeFile.size,
        pageCount: extra.pageCount ?? declaredPageCount,
        maxPages: extra.maxPages ?? null,
        message,
      });
    };

    trackMarketingEvent('pdf_upload_started', {
      source: uploadSource,
      file_size_bytes: activeFile.size,
      flow,
      page_count: declaredPageCount,
    });

    try {
      const metadata = {
        title: activeTitle,
        universidadId: initialMateriaId ? initialUniversidadId || null : null,
        carreraId: initialMateriaId ? initialCarreraId || null : null,
        materiaId: initialMateriaId || null,
      };
      const fileMetadata = {
        name: activeFile.name,
        mimeType: studentMaterialFileKind(activeFile.name) === 'docx' ? STUDENT_MATERIAL_DOCX_MIME : 'application/pdf',
        size: activeFile.size,
      };
      const prepared = await preparePdfFirstUploadAction({ metadata, file: fileMetadata, declaredPageCount });
      if (!prepared.success && showUploadLimit(prepared.upgrade, activeFile)) {
        failWith('plan_limit', prepared.message);
        return;
      }
      if (!prepared.success && prepared.errorCode === 'page_limit' && prepared.maxPages) {
        failWith('page_limit', prepared.message, { maxPages: prepared.maxPages, pageCount: prepared.pageCount });
        setUploadError({ message: pageLimitMessage(prepared.pageCount ?? declaredPageCount, prepared.maxPages), blocking: true });
        return;
      }
      if (!prepared.success || !prepared.filePath || !prepared.token) {
        throw new Error(prepared.message);
      }
      stage = 'transfer';
      const preparedFilePath = prepared.filePath;
      const preparedToken = prepared.token;
      preparedPath = preparedFilePath;

      const supabase = getSupabaseBrowserClient();
      const pdfUploadPromise = supabase.storage
        .from('biblioteca')
        .uploadToSignedUrl(preparedFilePath, preparedToken, activeFile, {
          contentType: fileMetadata.mimeType,
        });

      const visionController = new AbortController();

      // Sólo escaneos cortos en dispositivos capaces usan el render del navegador.
      // Si no termina dentro del presupuesto, el servidor renderiza lo pendiente.
      const clientVisionPromise = (async () => {
        try {
          if (studentMaterialFileKind(activeFile.name) !== 'pdf' || !canPreRenderPdfOnDevice()) return;
          const plan = await inspectPdfForClientVision(
            activeFile,
            Math.min(CLIENT_VISION_FAST_MAX_PAGES, CLIENT_VISION_MAX_PAGES)
          );
          if (visionController.signal.aborted || !plan.shouldPreRender || plan.pageNumbers.length === 0) return;

          const preparedVision = await preparePdfClientVisionUploadsAction({
            filePath: preparedFilePath,
            pageNumbers: plan.pageNumbers,
          });
          if (visionController.signal.aborted || !preparedVision.success || !preparedVision.uploads?.length) return;

          const uploadsByPage = new Map(
            preparedVision.uploads.map((upload) => [upload.pageNumber, upload])
          );

          await renderPdfPagesForClientVision({
            file: activeFile,
            pageNumbers: plan.pageNumbers,
            signal: visionController.signal,
            onPage: async (pageNumber, blob) => {
              if (visionController.signal.aborted) return;
              const target = uploadsByPage.get(pageNumber);
              if (!target) return;

              const { error } = await supabase.storage
                .from('biblioteca')
                .uploadToSignedUrl(target.filePath, target.token, blob, {
                  contentType: 'image/png',
                });
              if (error) {
                throw new Error('No pudimos subir una página prerenderizada.');
              }
            },
          });
        } catch {
          // Nunca bloquear la carga principal por esta optimización. El worker
          // vuelve automáticamente al render del servidor si falta una página.
        }
      })();

      let visionTimeout: ReturnType<typeof setTimeout>;
      const visionBudget = new Promise<void>((resolve) => {
        visionTimeout = setTimeout(() => {
          visionController.abort();
          resolve();
        }, CLIENT_VISION_BUDGET_MS);
      });
      let pdfUploadResult: Awaited<typeof pdfUploadPromise>;
      try {
        pdfUploadResult = await pdfUploadPromise;
        if (pdfUploadResult.error) visionController.abort();
        else await Promise.race([clientVisionPromise, visionBudget]);
      } catch (error) {
        visionController.abort();
        throw error;
      } finally {
        clearTimeout(visionTimeout!);
      }
      if (pdfUploadResult.error) {
        throw new Error('No pudimos transferir tu material. Intentá nuevamente.');
      }
      stage = 'finalize';

      const result = await finalizePdfFirstUploadAction({
        metadata,
        file: fileMetadata,
        filePath: preparedFilePath,
      });
      if (!result.success || !result.materialId) {
        if (!result.success && showUploadLimit(result.upgrade, activeFile)) {
          failWith('plan_limit', result.message);
          await cancelPdfFirstUploadAction(preparedFilePath).catch(() => undefined);
          return;
        }
        if (result.errorCode === 'page_limit' && result.maxPages) {
          // El servidor ya borró el archivo subido.
          preparedPath = null;
          failWith('page_limit', result.message, { maxPages: result.maxPages, pageCount: result.pageCount });
          setUploadError({ message: pageLimitMessage(result.pageCount ?? declaredPageCount, result.maxPages), blocking: true });
          return;
        }
        throw new Error(result.message);
      }

      // El clic no es una conversión: contamos la carga cuando el servidor la confirmó.
      try {
        trackMarketingEvent('pdf_uploaded', {
          source: initialSource || 'dashboard',
          material_id: result.materialId,
          intended_materia_id: trackingMateriaId || initialMateriaId || null,
          file_size_bytes: activeFile.size,
          environment: process.env.NODE_ENV,
          ...consumeFirstPdfDemoUpload(initialSource),
        });
      } catch {
        // Analytics nunca debe convertir una carga exitosa en un error de interfaz.
      }

      const activeExamDate = examDate || initialExamDate;
      if (activeExamDate) {
        const examResult = await saveStudentMaterialExamContextAction({
          materialId: result.materialId,
          examInstance: null,
          examDate: activeExamDate,
        });
        if (!examResult.success) {
          toast({ description: firstUploadErrorMessage(examResult.message, locale), variant: 'destructive' });
        }
      }

      if (initialSource === 'preguntero-exam-intent') {
        trackMarketingEvent('preguntero_exam_pdf_uploaded', {
          source: initialSource,
          materia_id: trackingMateriaId || initialMateriaId || null,
          exam_date: activeExamDate || null,
          material_id: result.materialId,
        });
      }

      if (isPreAuthPdfResume) {
        await clearPdfFirstDraft().catch(() => undefined);
        trackMarketingEvent('material_processing_started', {
          source: initialSource,
          material_id: result.materialId,
        });
      }

      const initialState: StudentMaterialProcessingState = {
        materialId: result.materialId,
        title: metadata.title,
        fileName: activeFile.name,
        status: 'uploaded',
        stage: 'uploaded',
        progress: 10,
        message: t("PDF subido. Empezamos a procesarlo."),
        error: null,
      };
      processingPollRef.current.reset();
      autoRetryCountsRef.current[result.materialId] = 0;
      autoRetryingMaterialRef.current = null;
      setProcessing(initialState);
      setDisplayProgress(10);
      // El procesamiento se inicia y se observa desde la pantalla completa.
      // El job ya está persistido; no depende de mantener abierto este diálogo.
      preparedPath = null;
      setOpen(false);
      router.push(`/dashboard/procesando/${result.materialId}`);
    } catch (error) {
      if (preparedPath) {
        await cancelPdfFirstUploadAction(preparedPath).catch(() => undefined);
      }
      const rawMessage = error instanceof Error ? error.message : null;
      failWith(stage, rawMessage);
      setUploadError({ message: firstUploadErrorMessage(rawMessage, locale), blocking: false });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!initialOpen || !isPreAuthPdfResume || resumeHandledRef.current) return;

    resumeHandledRef.current = true;
    setOpen(true);
    setRestoringDraft(true);

    void loadPdfFirstDraft()
      .then(async (draft) => {
        if (!draft || draft.source !== initialSource) return;
        const restoredTitle = titleFromFile(draft.file.name);
        setFile(draft.file);
        setTitle(restoredTitle);
        setExamDate(initialExamDate);
        trackMarketingEvent('pdf_draft_restored', {
          source: initialSource,
          file_size_bytes: draft.file.size,
        });
        await startProcessing(draft.file, restoredTitle);
      })
      .catch((error: unknown) => {
        trackUploadFailure({
          stage: 'draft_restore',
          source: initialSource,
          flow: 'draft_resume',
          message: error instanceof Error ? error.message : null,
        });
        setUploadError({
          message: t("No pudimos recuperar el PDF seleccionado. Elegilo nuevamente."),
          blocking: true,
        });
      })
      .finally(() => setRestoringDraft(false));
  }, [initialExamDate, initialOpen, initialSource, isPreAuthPdfResume, startProcessing, toast]);

  useEffect(() => {
    if (
      !isPreAuthPdfResume ||
      !processing ||
      processing.status !== 'ready' ||
      readyTrackedRef.current
    ) {
      return;
    }

    readyTrackedRef.current = true;
    trackMarketingEvent('material_ready', {
      source: initialSource,
      material_id: processing.materialId,
    });
  }, [initialSource, isPreAuthPdfResume, processing]);

  useEffect(() => {
    if (
      !processing ||
      processing.status !== 'ready' ||
      !processing.isFirstReadyMaterial ||
      firstPdfReadyTrackedRef.current
    ) {
      return;
    }

    firstPdfReadyTrackedRef.current = true;
    trackMarketingEvent('first_pdf_ready_viewed', {
      source: initialSource || 'dashboard',
      material_id: processing.materialId,
    });
  }, [initialSource, processing]);

  const retryFailedProcessing = async () => {
    if (!processing || processing.status !== 'failed') return;

    autoRetryingMaterialRef.current = processing.materialId;
    setProcessing({
      ...processing,
      status: 'processing',
      stage: 'extracting',
      progress: Math.max(12, processing.progress),
      message: t("Reintentando el procesamiento…"),
      error: null,
    });

    try {
      await processStudentMaterialAction(processing.materialId);
    } catch {
      setProcessing((current) => current ? {
        ...current,
        status: 'failed',
        stage: 'failed',
        message: t("No pudimos iniciar el reintento. Podés volver a intentarlo."),
        error: t("Se interrumpió la conexión al iniciar el procesamiento."),
      } : null);
    } finally {
      if (autoRetryingMaterialRef.current === processing.materialId) {
        autoRetryingMaterialRef.current = null;
      }
    }
  };

  const saveContext = async () => {
    if (!processing || !canSaveContext || savingContext) return;
    setSavingContext(true);
    const result = await savePdfFirstAcademicContextAction({
      materialId: processing.materialId,
      universidadId: requestingUniversity ? null : universityId || null,
      universidadNombre: requestingUniversity
        ? universityName
        : (selectedUniversity?.nombre ?? null),
      carreraId: addingCareer ? null : (selectedCareer?.id ?? null),
      carreraNombre: careerName,
      materiaId: null,
      materiaNombre: null,
    });

    if (!result.success) {
      toast({ description: firstUploadErrorMessage(result.message, locale), variant: 'destructive' });
      setSavingContext(false);
      return;
    }

    const universityWasSaved = Boolean(result.context.universidadId);
    const careerWasSaved = Boolean(result.context.carreraId);

    if (result.context.universidadId) {
      setUniversityId(result.context.universidadId);
    }
    setRequestingUniversity(false);
    setProfileUniversitySaved(universityWasSaved);
    setProfileUniversityName(result.context.universidadNombre ?? universityName);
    setContextSaved(universityWasSaved && careerWasSaved);
    setSavedContextLabel(
      [result.context.universidadNombre, result.context.carreraNombre].filter(Boolean).join(' · ')
    );
    setSavingContext(false);
    if (ready && universityWasSaved && careerWasSaved) setShowReadyContext(false);
    router.refresh();
  };

  const openMaterial = () => {
    if (!processing || !ready) return;
    setOpen(false);
    router.push(
      `${getStudentMaterialRoute(processing.materialId)}?inicio=1${processing.isFirstReadyMaterial ? '&recorrido=1' : ''}`
    );
    router.refresh();
  };

  const openDiagnostic = () => {
    if (!processing || !ready) return;
    setOpen(false);
    router.push(`${getStudentMaterialRoute(processing.materialId)}?diagnostico=1`);
    router.refresh();
  };

  const openSummary = () => {
    if (!processing || !ready) return;
    if (processing.isFirstReadyMaterial) {
      trackMarketingEvent('first_pdf_start_study_clicked', {
        source: initialSource || 'dashboard',
        material_id: processing.materialId,
      });
    }
    setOpen(false);
    router.push(
      `${getStudentMaterialRoute(processing.materialId)}?inicio=1${processing.isFirstReadyMaterial ? '&recorrido=1' : '&tab=resumen'}`
    );
    router.refresh();
  };

  /** El contexto académico es opcional y vuelve al mismo proceso de carga. */
  const skipContext = () => {
    if (!processing) return;
    setShowReadyContext(false);
  };

  const universitySelectValue = requestingUniversity ? MISSING_UNIVERSITY_VALUE : universityId;

  return (
    <PdfUploadTriggerContext.Provider value={openUploadPicker}>
    <PdfDropUploadContext.Provider value={uploadDroppedFile}>
    <div className="relative has-[[data-empty-study-space]]:h-full has-[[data-empty-study-space]]:min-h-0 has-[[data-empty-study-space]]:flex-1">
      <input
        ref={pickerRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(event) => {
          const selected = event.currentTarget.files?.[0] ?? null;
          event.currentTarget.value = '';
          // Subida en un paso (onboarding etapa 2): elegir el archivo ya lo sube.
          // El nombre sale del archivo y la fecha del examen se pide mientras se procesa.
          if (selected && selectFile(selected)) {
            setOpen(true);
            void startProcessing(selected, titleFromFile(selected.name));
          }
        }}
      />
      <div
        className={`transition duration-200 has-[[data-empty-study-space]]:h-full has-[[data-empty-study-space]]:min-h-0 ${open ? 'pointer-events-none blur-[5px] select-none' : ''}`}
        aria-hidden={open}
      >
        {children}
      </div>

      {uploadLimit ? (
        <FreeUploadLimitScreen
          fileName={uploadLimit.fileName}
          fileSizeBytes={uploadLimit.fileSize}
          premiumHref={uploadLimit.href}
          nextAvailableAt={nextFreeUploadAt()}
          onBack={() => { setUploadLimit(null); reset(); }}
        />
      ) : null}

      {open ? (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) close();
          }}
        >
          <DialogContent
            className="journey-modal"
            overlayClassName="journey-modal-overlay"
            showCloseButton={!uploading}
            onInteractOutside={(event) => {
              if (uploading) event.preventDefault();
            }}
            onEscapeKeyDown={(event) => {
              if (uploading) event.preventDefault();
            }}
          >
            <DialogTitle className="sr-only">
              {processing
                ? failed
                  ? t("No pudimos procesar tu PDF")
                  : ready
                    ? t("Tu PDF está listo")
                    : t("Preparación de tu PDF")
                : t("Subir material")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("Subí tu material y elegí cómo empezar a estudiarlo cuando esté listo.")}
            </DialogDescription>
            {(!processing || failed || showReadyContext) && (
              <div className="flex items-start justify-between gap-4 pr-10">
                <div>
                  <h2
                    id="pdf-first-modal-title"
                    className="text-titulo-sm font-semibold tracking-titulo text-slate-950"
                  >
                    {processing
                      ? failed
                        ? t("No pudimos procesar tu PDF")
                        : ready
                          ? t("Tu PDF está listo")
                          : t("Estamos procesando tu PDF")
                      : file
                        ? t("Subiendo tu apunte")
                        : t("Subir material")}
                  </h2>
                  <p className="mt-1 text-cuerpo leading-6 text-slate-500">
                    {processing
                      ? ready
                        ? t("Terminamos de preparar tu material.")
                        : isPreAuthPdfResume
                          ? t("Ya tenemos tu archivo. Lo estamos convirtiendo en material de estudio.")
                          : t("Mientras lo preparamos, podés indicar universidad y carrera. También podés saltar.")
                      : restoringDraft
                        ? t("Recuperando el PDF que elegiste antes del registro.")
                        : uploadError
                          ? t("No pudimos subir tu apunte.")
                          : t("En unos segundos empezamos a prepararlo.")}
                  </p>
                </div>
              </div>
            )}
            {!processing ? (
              <>
                {!file && restoringDraft ? (
                  <div className="mt-6 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
                    <span className="mt-3 text-cuerpo font-semibold text-slate-950">
                      {t("Recuperando tu PDF…")}
                    </span>
                    <span className="mt-1 text-chico text-slate-400">
                      {t("No hace falta elegirlo de nuevo.")}
                    </span>
                  </div>
                ) : !file ? (
                  <button
                    type="button"
                    onClick={() => pickerRef.current?.click()}
                    className="mt-6 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="mt-3 text-cuerpo font-semibold text-slate-950">
                      {t("Elegir archivo")}
                    </span>
                    <span className="mt-1 text-chico text-slate-400">{t("Máximo 20 MB")}</span>
                  </button>
                ) : (
                  <div className="mt-6" data-upload-status>
                    <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-cuerpo font-semibold text-slate-900">
                          {file.name}
                        </span>
                        <span className="mt-0.5 block text-chico text-slate-500" role="status">
                          {uploading ? t("Subiendo…") : uploadError ? t("No se subió") : t("Listo para subir")}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {uploadError ? (
                  <div
                    role="alert"
                    data-upload-error
                    className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-ui leading-5 text-rose-900"
                  >
                    <p>{uploadError.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <button
                        type="button"
                        onClick={() => pickerRef.current?.click()}
                        className="font-semibold text-rose-900 underline underline-offset-2"
                      >
                        {t("Elegir otro archivo")}
                      </button>
                      {uploadError.blocking ? (
                        <a
                          href="/demo/material-estudio"
                          className="font-semibold text-rose-900 underline underline-offset-2"
                        >
                          {t("Probar con un apunte de ejemplo")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {!uploading && (uploadError || !file) ? (
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={close}>
                      {t("Cancelar")}
                    </Button>
                    {file && uploadError && !uploadError.blocking ? (
                      <Button type="button" disabled={!hasValidTitle} onClick={() => void startProcessing()}>
                        {t("Reintentar")}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : !failed && !showReadyContext ? (
              <>
                <PdfProcessingPanel
                  file={file}
                  fileName={processing.fileName}
                  complete={ready}
                  firstPdf={processing.isFirstReadyMaterial}
                  progress={progress}
                  processingMessage={processing.message}
                  onStartDiagnostic={openDiagnostic}
                  onStartSummary={openSummary}
                  onViewTools={openMaterial}
                />
                {!ready && !contextSaved && !isPreAuthPdfResume && (
                  <button
                    type="button"
                    className="journey-tools-button"
                    onClick={() => setShowReadyContext(true)}
                  >
                    {t("Agregar universidad y carrera")}
                  </button>
                )}
              </>
            ) : (
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center text-blue-600">
                    {ready ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : failed ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-cuerpo font-semibold text-slate-900">
                      {processing.title}
                    </p>
                    <p className="mt-0.5 text-chico text-slate-500">
                      {failed
                        ? firstUploadErrorMessage(processing.error ?? t("El procesamiento se interrumpió."), locale)
                        : ready
                          ? t("Procesamiento completado")
                          : processing.message}
                    </p>
                  </div>
                  <span className="text-chico font-semibold text-slate-500 tabular-nums">
                    {progress}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {!failed && showReadyContext ? (
                  <>
                    {academicChoicesStatus !== 'loaded' ? (
                      <div className="mt-5 space-y-3" role="status">
                        {academicChoicesStatus === 'failed' ? (
                          <>
                            <p className="text-cuerpo text-red-700">{academicChoicesError}</p>
                            <Button type="button" variant="outline" onClick={() => setAcademicChoicesStatus('idle')}>
                              {t("Reintentar carga de universidades")}
                            </Button>
                          </>
                        ) : (
                          <p className="flex items-center gap-2 text-cuerpo text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("Cargando universidades y carreras...")}
                          </p>
                        )}
                      </div>
                    ) : !contextSaved ? (
                      <div className="mt-5 space-y-4">
                        <p className="text-chico leading-5 text-slate-500">
                          {t("Universidad y carrera se guardan en tu perfil una sola vez. No te las volvemos a pedir en cada PDF.")}
                        </p>

                        <div>
                          <label
                            htmlFor="pdf-first-university"
                            className="mb-1.5 block text-chico font-semibold text-slate-700"
                          >
                            {t("Universidad")}
                          </label>
                          {profileUniversitySaved ? (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-cuerpo font-semibold text-emerald-700">
                              Guardada en tu perfil · {profileUniversityName}
                            </div>
                          ) : !requestingUniversity ? (
                            <>
                              <select
                                id="pdf-first-university"
                                value={universitySelectValue}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  if (value === MISSING_UNIVERSITY_VALUE) {
                                    setRequestingUniversity(true);
                                    setUniversityId('');
                                    setCareerId('');
                                    setAddingCareer(false);
                                    setNewCareer('');
                                    return;
                                  }
                                  setRequestingUniversity(false);
                                  setNewUniversity('');
                                  setUniversityId(value);
                                  setCareerId('');
                                  setAddingCareer(false);
                                  setNewCareer('');
                                }}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-cuerpo text-slate-900 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">{t("Seleccionar universidad")}</option>
                                {universidades.map((uni) => (
                                  <option key={uni.id} value={uni.id}>
                                    {uni.nombre}
                                  </option>
                                ))}
                                <option value={MISSING_UNIVERSITY_VALUE}>
                                  {t("Mi universidad no aparece")}
                                </option>
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  setRequestingUniversity(true);
                                  setUniversityId('');
                                  setCareerId('');
                                  setAddingCareer(false);
                                  setNewCareer('');
                                }}
                                className="mt-2 text-chico font-semibold text-blue-600 hover:text-blue-700"
                              >
                                {t("Mi universidad no aparece")}
                              </button>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                value={newUniversity}
                                onChange={(event) => setNewUniversity(event.target.value)}
                                placeholder={t("Nombre de tu universidad")}
                                autoFocus
                              />
                              <p className="text-etiqueta leading-4 text-slate-400">
                                {t("La universidad se habilita automáticamente y queda guardada en tu perfil.")}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRequestingUniversity(false);
                                  setNewUniversity('');
                                  setUniversityId(initialUniversidadId);
                                }}
                              >
                                {t("Volver al listado")}
                              </Button>
                            </div>
                          )}
                        </div>

                        {hasUniversity ? (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label
                              htmlFor="pdf-first-career"
                              className="mb-1.5 block text-chico font-semibold text-slate-700"
                            >
                              {t("Carrera")}
                            </label>
                            {!addingCareer ? (
                              <>
                                <select
                                  id="pdf-first-career"
                                  value={careerId}
                                  onChange={(event) => setCareerId(event.target.value)}
                                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-cuerpo text-slate-900 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                  disabled={requestingUniversity}
                                >
                                  <option value="">{t("Seleccionar carrera")}</option>
                                  {availableCareers.map((career) => (
                                    <option key={career.id} value={career.id}>
                                      {career.nombre}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingCareer(true);
                                    setCareerId('');
                                  }}
                                  className="mt-2 text-chico font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  {requestingUniversity || availableCareers.length === 0
                                    ? t("Solicitar carrera")
                                    : t("+ Añadir carrera")}                                </button>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={newCareer}
                                    onChange={(event) => setNewCareer(event.target.value)}
                                    placeholder={t("Nombre de la carrera")}
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setAddingCareer(false);
                                      setNewCareer('');
                                    }}
                                  >
                                    {t("Cancelar")}
                                  </Button>
                                </div>
                                <p className="text-etiqueta leading-4 text-slate-400">
                                  {t("Si no está en el listado, la pedimos para tu uso privado.")}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-4 text-cuerpo font-medium text-emerald-700">
                        {t("Guardado ·")} {savedContextLabel}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                      {!contextSaved ? (
                        <Button type="button" variant="ghost" onClick={skipContext}>
                          {t("Saltar")}
                        </Button>
                      ) : null}
                      {!contextSaved && academicChoicesStatus === 'loaded' ? (
                        <Button
                          type="button"
                          disabled={!canSaveContext || savingContext}
                          onClick={saveContext}
                        >
                          {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {!profileUniversitySaved
                            ? hasCareer
                              ? t("Guardar universidad y carrera")
                              : t("Guardar universidad")
                            : t("Guardar carrera")}
                        </Button>
                      ) : null}
                      {contextSaved && ready ? (
                        <Button type="button" onClick={() => setShowReadyContext(false)}>
                          {t("Continuar")}
                        </Button>
                      ) : null}
                      {contextSaved && !ready ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowReadyContext(false)}
                        >
                          {t("Continuar")}
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : failed ? (
                  <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={close}>
                      {t("Cerrar")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void retryFailedProcessing()}>
                      {t("Reintentar")}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
    </PdfDropUploadContext.Provider>
    </PdfUploadTriggerContext.Provider>
  );
}
