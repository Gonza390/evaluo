import type { StudyDocumentAnalysis } from '@/lib/student-materials/types';

export type CachedPage = {
  pageNumber: number;
  content: string;
  confidence: 'alta' | 'media' | 'baja';
  hasMath: boolean;
  origin: 'vision' | 'blank';
};

export type CachedSource = {
  text: string;
  pages: string[] | null;
  pageCount: number | null;
  documentAnalysis: StudyDocumentAnalysis;
  visionUsed: boolean;
  visionPageNumbers: number[];
};

export function selectMissingOcrPages(selected: number[], cached: readonly CachedPage[]) {
  const found = new Set(cached.map((page) => page.pageNumber));
  return selected.filter((page) => !found.has(page));
}

export function isValidOcrPage(page: CachedPage) {
  return Number.isInteger(page.pageNumber) && page.pageNumber > 0 &&
    (page.origin === 'blank' && page.content === '' ||
      page.origin === 'vision' &&
      page.confidence !== 'baja' &&
      page.content.trim().length >= 40);
}

export function isReusableSource(input: {
  cachedHash: string;
  currentHash: string;
  cachedVersion: string;
  currentVersion: string;
  source: CachedSource;
}) {
  return input.cachedHash === input.currentHash &&
    input.cachedVersion === input.currentVersion &&
    typeof input.source.text === 'string' &&
    (input.source.pages === null ||
      Array.isArray(input.source.pages) &&
      input.source.pages.every((page) => typeof page === 'string')) &&
    (input.source.pageCount === null ||
      Number.isInteger(input.source.pageCount) && input.source.pageCount >= 0) &&
    typeof input.source.documentAnalysis === 'object' &&
    input.source.documentAnalysis !== null &&
    Array.isArray(input.source.visionPageNumbers) &&
    typeof input.source.visionUsed === 'boolean' &&
    // Nunca aceptar fuente vacía como checkpoint: provocaría resúmenes parciales.
    input.source.text.trim().length > 0 &&
    (input.source.pageCount === null ||
      input.source.pages === null ||
      input.source.pages.length === input.source.pageCount);
}
