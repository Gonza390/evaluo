const ANALYTICS_EVENT_NAMES = [
  'page_view',
  'session_ping',
  'client_error',
  'login_success',
  'simulator_started',
  'simulator_resumed',
  'simulator_finished',
  'simulator_abandoned',
  'simulator_rating',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const ANALYTICS_EVENT_NAME_SET = new Set<string>(ANALYTICS_EVENT_NAMES);

export function isAllowedAnalyticsEventName(value: string): value is AnalyticsEventName {
  return ANALYTICS_EVENT_NAME_SET.has(value);
}
