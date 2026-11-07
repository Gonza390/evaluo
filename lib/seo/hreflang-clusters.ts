import { toAbsoluteUrl } from '@/lib/site';

/**
 * Registro único de clusters hreflang (ES ↔ EN y variantes regionales).
 *
 * Cada cluster agrupa URLs equivalentes en distintos idiomas. Desde aquí se generan
 * los `alternates.languages` del <head> y los `xhtml:link` del sitemap, de modo que
 * ambos nunca se contradigan y la reciprocidad (A→B implica B→A) quede garantizada.
 *
 * Reglas:
 * - Si un cluster tiene una sola versión en español, se etiqueta `es` (no `es-AR`)
 *   para que pueda posicionar en todo el mundo hispanohablante.
 * - `x-default` apunta a la versión `es` genérica.
 * - Solo se agregan URLs indexables (200, sin noindex ni redirect).
 * - Los artículos del blog y los landings de práctica tienen sus propios helpers
 *   recíprocos; acá solo se registran sus parejas para el sitemap.
 */
export type HreflangLocale = 'es' | 'es-AR' | 'es-MX' | 'es-CO' | 'es-ES' | 'en';

type ClusterPaths = Partial<Record<HreflangLocale, string>> & { es: string };

export const HREFLANG_CLUSTERS = {
  home: { es: '/', en: '/en' },
  pricing: { es: '/pricing', en: '/en/pricing' },
  blog: { es: '/blog', en: '/en/blog' },
  'study-pdf': {
    es: '/es/estudiar-pdf-con-ia',
    'es-AR': '/estudiar-pdf-con-ia',
    'es-MX': '/es-mx/estudiar-pdf-con-ia',
    'es-CO': '/es-co/estudiar-pdf-con-ia',
    'es-ES': '/es-es/estudiar-pdf-con-ia',
    en: '/en/study-pdf-with-ai',
  },
  'pdf-to-quiz': { es: '/convertir-pdf-en-preguntas', en: '/en/pdf-to-quiz' },
  'pdf-to-flashcards': { es: '/funciones/crear-flashcards-desde-pdf', en: '/en/pdf-to-flashcards' },
  'true-false': { es: '/funciones/verdadero-falso-con-ia', en: '/en/ai-true-false-questions' },
  'match-concepts': { es: '/funciones/unir-conceptos-con-ia', en: '/en/match-concepts-with-ai' },
  'mock-exam': {
    es: '/es/generador-de-examenes-con-ia',
    'es-AR': '/funciones/simulacro-examen-con-ia',
    en: '/en/ai-test-prep',
  },
  'compare-notebooklm': { es: '/comparar/evaluo-vs-notebooklm', en: '/en/compare/evaluo-vs-notebooklm' },
  'compare-chatgpt': { es: '/comparar/evaluo-vs-chatgpt', en: '/en/compare/evaluo-vs-chatgpt' },
  'compare-quizlet': { es: '/comparar/evaluo-vs-quizlet', en: '/en/compare/evaluo-vs-quizlet' },
  'ai-for-students': {
    es: '/es/guias/como-estudiar-con-ia',
    'es-AR': '/ia-para-estudiantes',
    en: '/en/ai-for-students',
  },
  'pdf-summary': { es: '/funciones/resumir-pdf-con-ia', en: '/en/ai-pdf-summarizer' },
  'mind-map': { es: '/funciones/crear-mapa-mental-desde-pdf', en: '/en/pdf-to-mind-map' },
  'practice-by-topic': { es: '/funciones/practicar-por-tema', en: '/en/practice-by-topic' },
  'how-it-works': { es: '/es/como-funciona', en: '/en/how-it-works' },
  'features-hub': { es: '/funciones', en: '/en/features' },
  'compare-hub': { es: '/comparar', en: '/en/compare' },
} as const satisfies Record<string, ClusterPaths>;

export type HreflangClusterId = keyof typeof HREFLANG_CLUSTERS;

/** Mapa hreflang → URL absoluta, incluida la propia URL y `x-default`. */
export function hreflangLanguages(id: HreflangClusterId): Record<string, string> {
  const cluster: ClusterPaths = HREFLANG_CLUSTERS[id];
  const languages: Record<string, string> = {};
  for (const [locale, path] of Object.entries(cluster)) {
    if (path) languages[locale] = toAbsoluteUrl(path);
  }
  languages['x-default'] = toAbsoluteUrl(cluster.es);
  return languages;
}

/** `alternates` listo para `Metadata`: canonical propio + hreflang del cluster. */
export function hreflangAlternates(id: HreflangClusterId, self: HreflangLocale) {
  const cluster: ClusterPaths = HREFLANG_CLUSTERS[id];
  const path = cluster[self];
  if (!path) throw new Error(`El cluster hreflang "${id}" no tiene versión "${self}"`);
  return { canonical: toAbsoluteUrl(path), languages: hreflangLanguages(id) };
}

/** Entradas de sitemap con `alternates.languages` para todas las URLs de cada cluster. */
export function hreflangSitemapEntries(): Array<{
  url: string;
  alternates: { languages: Record<string, string> };
}> {
  const entries: Array<{ url: string; alternates: { languages: Record<string, string> } }> = [];
  for (const id of Object.keys(HREFLANG_CLUSTERS) as HreflangClusterId[]) {
    const languages = hreflangLanguages(id);
    const paths = new Set(Object.values(HREFLANG_CLUSTERS[id] as ClusterPaths));
    for (const path of paths) {
      if (path) entries.push({ url: toAbsoluteUrl(path), alternates: { languages } });
    }
  }
  return entries;
}

/** Cluster al que pertenece una ruta (p. ej. `/en/pdf-to-quiz` → `pdf-to-quiz`). */
export function hreflangClusterForPath(path: string): HreflangClusterId | undefined {
  for (const id of Object.keys(HREFLANG_CLUSTERS) as HreflangClusterId[]) {
    if (Object.values(HREFLANG_CLUSTERS[id] as ClusterPaths).includes(path)) return id;
  }
  return undefined;
}

/** Ruta equivalente en otro idioma, para el selector de idioma (relativa, no absoluta). */
export function hreflangAlternatePath(path: string, locale: HreflangLocale): string | undefined {
  const id = hreflangClusterForPath(path);
  return id ? (HREFLANG_CLUSTERS[id] as ClusterPaths)[locale] : undefined;
}
