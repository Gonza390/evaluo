export type AIKeyHealthStatus =
  | 'ok'
  | 'missing'
  | 'unauthorized'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'bad_request'
  | 'timeout'
  | 'network_error';

export function classifyAIKeyHttpStatus(status: number): AIKeyHealthStatus {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 404 || status === 422) return 'bad_request';
  return 'provider_unavailable';
}
