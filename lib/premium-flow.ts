/**
 * Contrato único de navegación de Premium: se puede abrir desde cualquier
 * límite Free sin perder el material/tema/modo que el estudiante estaba usando.
 * No contiene JSX ni depende del navegador; lo comparten rutas y componentes.
 */
export type PremiumGateReason =
  | 'material_upload' | 'multiple_choice' | 'true_false'
  | 'matching_round' | 'case' | 'flashcard'
  | 'simulator' | 'study_plan' | 'mind_map';

export type PremiumUpgrade = {
  reason: PremiumGateReason;
  source: string;
  returnTo: string;
  href: string;
};

const DESTINATIONS = /^\/(?:dashboard|materiales|simulador|explorar|configuracion|calendario)(?:\/|$)/;

/** No redirigir a URLs externas, al login, al checkout ni a un bucle Premium. */
export function safePremiumReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim();
  if (!candidate || candidate.length > 600 || !candidate.startsWith('/') ||
      candidate.startsWith('//') || candidate.includes('\\') ||
      /[\u0000-\u001f\u007f]/u.test(candidate)) return undefined;
  try {
    const url = new URL(candidate, 'https://evaluo.internal');
    if (url.origin !== 'https://evaluo.internal' || !DESTINATIONS.test(url.pathname)) {
      return undefined;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return undefined;
  }
}

export function premiumPricingHref(context: {
  source?: string;
  materiaId?: string | null;
  parcial?: number;
  returnTo?: string;
}): string {
  const params = new URLSearchParams();
  if (context.source && /^[a-zA-Z0-9_:-]{1,80}$/.test(context.source))
    params.set('source', context.source);
  if (context.materiaId && /^[0-9a-f-]{36}$/i.test(context.materiaId))
    params.set('materia', context.materiaId);
  if (Number.isInteger(context.parcial) && context.parcial! >= 1 && context.parcial! <= 99)
    params.set('parcial', String(context.parcial));
  const returnTo = safePremiumReturnTo(context.returnTo);
  if (returnTo) params.set('returnTo', returnTo);
  const query = params.toString();
  return '/pricing' + (query ? '?' + query : '') + '#elegir-plan';
}

const GATE_MODES: Record<PremiumGateReason, string | null> = {
  material_upload: null,
  multiple_choice: null,
  true_false: 'opciones',
  matching_round: 'unir',
  case: 'casos',
  flashcard: 'flashcards',
  simulator: 'simulacro',
  study_plan: null,
  mind_map: null,
};

/** Respuesta de API lista para conectar a las pantallas que diseñe el equipo. */
export function premiumUpgradeForLimit(
  reason: PremiumGateReason,
  options: { materialId?: string; returnTo?: string } = {},
): PremiumUpgrade {
  const materialId = options.materialId && /^[0-9a-f-]{36}$/i.test(options.materialId)
    ? options.materialId : undefined;
  const mode = GATE_MODES[reason];
  const destination = reason === 'material_upload' ? '/dashboard/materiales'
    : reason === 'study_plan' ? '/dashboard/plan-de-estudio'
    : reason === 'mind_map' && materialId ? '/materiales/' + materialId + '?tab=mapa'
    : mode && materialId ? '/dashboard/practicar/' + materialId + '/' + mode
    : reason === 'multiple_choice' && materialId ? '/materiales/' + materialId
    : '/dashboard/practicar';
  const returnTo = safePremiumReturnTo(options.returnTo) ?? destination;
  const source = 'free_v2_' + reason + '_limit';
  return { reason, source, returnTo, href: premiumPricingHref({source, materiaId:materialId, returnTo}) };
}

/** Error distinguible de red/validación: sólo una cuota Free real habilita upgrade. */
export class FreeStudyV2UploadLimitError extends Error {
  readonly code = 'free_v2_material_limit';
}
