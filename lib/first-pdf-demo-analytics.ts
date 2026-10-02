export const FIRST_PDF_DEMO_SOURCE = 'first-pdf-demo';
export const FIRST_PDF_DEMO_VERSION = 'guided-pdf-v1';
const UPLOAD_INTENT_KEY = 'evaluo_first_pdf_demo_upload';
const ERRORS_VIEWED_KEY = 'evaluo_first_pdf_demo_errors_viewed';
const ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type Metadata = Record<string, string | number | boolean | null>;
type DemoEvent =
  | 'demo_material_tour_started'
  | 'demo_material_tour_step_viewed'
  | 'demo_material_tour_skipped'
  | 'demo_material_tour_completed'
  | 'demo_material_tour_upload_clicked'
  | 'demo_checkpoint_reached';
export type DemoCheckpoint =
  | 'practice_started'
  | 'practice_answered'
  | 'practice_completed'
  | 'error_encountered'
  | 'errors_viewed'
  | 'help_used'
  | 'source_opened'
  | 'check_started'
  | 'check_answered';

/** Cada reinicio crea una corrida; las impresiones no se duplican por efectos de React. */
export function createFirstPdfDemoTracker({
  runId,
  environment,
  emit,
}: {
  runId: string;
  environment: string;
  emit: (event: DemoEvent, metadata: Metadata) => void;
}) {
  const sent = new Set<string>();
  function track(event: DemoEvent, metadata: Metadata = {}, onceKey?: string) {
    if (onceKey && sent.has(onceKey)) return;
    if (onceKey) sent.add(onceKey);
    try {
      emit(event, {
        ...metadata,
        source: FIRST_PDF_DEMO_SOURCE,
        demo_version: FIRST_PDF_DEMO_VERSION,
        demo_run_id: runId,
        environment,
      });
    } catch {
      // La medición nunca interrumpe la práctica ni la navegación.
    }
  }
  return {
    runId,
    track,
    checkpoint(stage: DemoCheckpoint, metadata: Metadata = {}, onceKey?: string) {
      track('demo_checkpoint_reached', { ...metadata, stage }, onceKey);
    },
  };
}

type IntentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserStorage(): IntentStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** Se atribuye una carga solo después de elegir Subir mi PDF, no por haber visto el demo. */
export function rememberFirstPdfDemoErrorsViewed(storage = browserStorage()) {
  try {
    storage?.setItem(ERRORS_VIEWED_KEY, '1');
  } catch {
    // El recorrido continúa aunque el navegador bloquee almacenamiento.
  }
}

export function hasSeenFirstPdfDemoErrors(storage = browserStorage()) {
  try {
    return storage?.getItem(ERRORS_VIEWED_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberFirstPdfDemoUpload(
  runId: string,
  storage = browserStorage(),
  now = Date.now()
) {
  try {
    storage?.setItem(
      UPLOAD_INTENT_KEY,
      JSON.stringify({ run_id: runId, version: FIRST_PDF_DEMO_VERSION, created_at: now })
    );
  } catch {
    // La carga sigue funcionando con almacenamiento bloqueado.
  }
}

/** Consumir únicamente cuando el servidor confirmó la primera carga del PDF propio. */
export function consumeFirstPdfDemoUpload(
  source: string,
  storage = browserStorage(),
  now = Date.now()
): Metadata {
  if (source !== FIRST_PDF_DEMO_SOURCE) return {};
  try {
    const raw = storage?.getItem(UPLOAD_INTENT_KEY);
    if (!raw) return {};
    storage?.removeItem(UPLOAD_INTENT_KEY);
    const intent = JSON.parse(raw);
    if (
      !intent ||
      intent.version !== FIRST_PDF_DEMO_VERSION ||
      typeof intent.run_id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent.run_id) ||
      typeof intent.created_at !== 'number' ||
      !Number.isFinite(intent.created_at) ||
      intent.created_at > now ||
      now - intent.created_at > ATTRIBUTION_WINDOW_MS
    )
      return {};
    return { demo_run_id: intent.run_id, demo_version: intent.version };
  } catch {
    return {};
  }
}
