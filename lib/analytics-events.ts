const ANALYTICS_EVENT_NAMES = [
  'page_view',
  'session_ping',
  'client_error',
  'cta_click',
  'pricing_view',
  'pricing_cta_click',
  'login_started',
  'login_success',
  'login_error',
  'signup_started',
  'signup_completed',
  'signup_error',
  'auth_mode_switch',
  'pdf_gate_viewed',
  'pdf_gate_cta_clicked',
  'materia_tab_viewed',
  'materia_resumen_opened',
  'materia_resource_opened',
  'materia_simulator_cta_clicked',
  'simulator_started',
  'simulator_resumed',
  'simulator_finished',
  'simulator_abandoned',
  'simulator_login_gate_viewed',
  'simulator_login_gate_cta_clicked',
  'simulator_result_shared',
  'simulator_rating',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const ANALYTICS_EVENT_NAME_SET = new Set<string>(ANALYTICS_EVENT_NAMES);

export function isAllowedAnalyticsEventName(value: string): value is AnalyticsEventName {
  return ANALYTICS_EVENT_NAME_SET.has(value);
}
