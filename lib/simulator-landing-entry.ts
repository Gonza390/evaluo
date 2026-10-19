import { isUuid } from '@/lib/uuid';
import { normalizeForCompare } from '@/lib/simulator-core';

export function getLandingOptionIndex(options: string[], option: string | undefined) {
  if (!option) return -1;
  return options.findIndex(
    (candidate) => normalizeForCompare(candidate) === normalizeForCompare(option)
  );
}

export function parseSimulatorLandingEntry(params: Pick<URLSearchParams, 'get'>) {
  const questionId = params.get('entry_question');
  const option = params.get('entry_option');
  if (!questionId || !isUuid(questionId) || !option || option.length > 2000) return null;
  return { questionId, option };
}

export function buildSimulatorLandingHref(href: string, questionId: string, option: string) {
  const url = new URL(href, 'https://evaluo.com.ar');
  url.searchParams.set('entry_question', questionId);
  url.searchParams.set('entry_option', option);
  return `${url.pathname}${url.search}${url.hash}`;
}

// La pregunta preferida debe pertenecer al pool ya autorizado de la materia/parcial.
export function preferSimulatorQuestion<T extends { id: string }>(
  selected: T[],
  eligible: T[],
  preferredId: string | undefined,
  limit: number
): T[] {
  if (typeof preferredId !== 'string' || !isUuid(preferredId)) return selected.slice(0, limit);
  const preferred = eligible.find((question) => question.id === preferredId);
  return preferred
    ? [preferred, ...selected.filter((question) => question.id !== preferredId)].slice(0, limit)
    : selected.slice(0, limit);
}
