import type { Json } from '@/types/supabase';
import type { AnalyticsEventName } from '@/lib/analytics-events';

type JsonRecord = Record<string, Json | undefined>;

const ATTRIBUTION_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref_user',
  'landing_path',
  'captured_at',
  'latest_utm_source',
  'latest_utm_medium',
  'latest_utm_campaign',
  'latest_utm_content',
  'latest_utm_term',
  'latest_ref_user',
]);

const EVENT_METADATA_WHITELIST: Record<AnalyticsEventName, string[]> = {
  page_view: ['attribution', 'anonymous_id', 'page_type', 'carrera_id', 'universidad_id', 'tab'],
  session_ping: ['engagement_ms', 'attribution', 'anonymous_id', 'page_type'],
  client_error: ['message', 'source', 'line', 'attribution', 'anonymous_id', 'page_type'],
  cta_click: [
    'attribution',
    'anonymous_id',
    'page_type',
    'location',
    'cta_name',
    'destination',
    'experiment_variant',
  ],
  pricing_view: ['attribution', 'anonymous_id', 'page_type', 'location', 'plan_context'],
  pricing_cta_click: [
    'attribution',
    'anonymous_id',
    'page_type',
    'location',
    'cta_name',
    'destination',
    'plan_context',
  ],
  login_started: ['attribution', 'anonymous_id', 'page_type', 'location', 'provider'],
  login_success: ['source_path', 'attribution', 'anonymous_id', 'page_type'],
  login_error: ['attribution', 'anonymous_id', 'page_type', 'location', 'provider', 'error_code'],
  signup_started: ['attribution', 'anonymous_id', 'page_type', 'location', 'provider'],
  signup_completed: ['attribution', 'anonymous_id', 'page_type', 'location', 'provider'],
  signup_error: ['attribution', 'anonymous_id', 'page_type', 'location', 'provider', 'error_code'],
  auth_mode_switch: ['attribution', 'anonymous_id', 'page_type', 'location', 'current_mode', 'next_mode'],
  pdf_gate_viewed: ['attribution', 'anonymous_id', 'page_type', 'location', 'resource_title', 'preview_pages'],
  pdf_gate_cta_clicked: [
    'attribution',
    'anonymous_id',
    'page_type',
    'location',
    'resource_title',
    'preview_pages',
    'cta_name',
    'destination',
  ],
  materia_tab_viewed: ['attribution', 'materia_id', 'carrera_id', 'universidad_id', 'tab', 'source'],
  materia_resumen_opened: [
    'attribution',
    'materia_id',
    'carrera_id',
    'universidad_id',
    'tab',
    'resumen_id',
    'resumen_title',
    'modulo',
    'action',
  ],
  materia_resource_opened: [
    'attribution',
    'materia_id',
    'carrera_id',
    'universidad_id',
    'tab',
    'resource_id',
    'resource_name',
    'resource_tipo',
    'action',
  ],
  materia_simulator_cta_clicked: [
    'attribution',
    'materia_id',
    'carrera_id',
    'universidad_id',
    'tab',
    'parcial',
    'label',
  ],
  simulator_started: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'question_index',
    'answered_count',
    'progress_pct',
    'time_left_sec',
  ],
  simulator_resumed: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'question_index',
    'answered_count',
    'progress_pct',
    'time_left_sec',
  ],
  simulator_finished: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'question_index',
    'answered_count',
    'progress_pct',
    'time_left_sec',
  ],
  simulator_abandoned: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'question_index',
    'answered_count',
    'progress_pct',
    'time_left_sec',
  ],
  simulator_login_gate_viewed: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'answered_count',
    'progress_pct',
    'time_left_sec',
  ],
  simulator_login_gate_cta_clicked: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'answered_count',
    'progress_pct',
    'time_left_sec',
    'cta',
  ],
  simulator_result_shared: [
    'attribution',
    'materia_id',
    'parcial',
    'carrera_id',
    'universidad_id',
    'mode',
    'premium_only',
    'result_pct',
  ],
  simulator_rating: ['materia_id', 'parcial', 'vote_type', 'rating', 'liked', 'source'],
};

function sanitizeAttribution(value: Json): Json | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const sanitizedEntries = Object.entries(value as JsonRecord).filter(
    ([key, nestedValue]) =>
      ATTRIBUTION_KEYS.has(key) &&
      (typeof nestedValue === 'string' || typeof nestedValue === 'number' || typeof nestedValue === 'boolean')
  );

  if (sanitizedEntries.length === 0) return undefined;
  return Object.fromEntries(sanitizedEntries);
}

function sanitizeScalar(value: Json): Json | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  }

  return undefined;
}

export function sanitizeAnalyticsMetadata(
  eventName: AnalyticsEventName,
  metadata: Json | undefined
): Json {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const whitelist = EVENT_METADATA_WHITELIST[eventName] ?? [];
  const source = metadata as JsonRecord;
  const sanitized: JsonRecord = {};

  for (const key of whitelist) {
    const rawValue = source[key];
    if (rawValue === undefined) continue;

    if (key === 'attribution') {
      const attribution = sanitizeAttribution(rawValue);
      if (attribution) {
        sanitized[key] = attribution;
      }
      continue;
    }

    const scalar = sanitizeScalar(rawValue);
    if (scalar !== undefined) {
      sanitized[key] = scalar;
    }
  }

  return sanitized;
}

export function isLikelyBotUserAgent(userAgent: string) {
  const normalized = userAgent.toLowerCase();
  return /bot|crawler|spider|headless|preview|monitor|fetcher|slurp|curl|wget/.test(normalized);
}
