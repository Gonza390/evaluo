import type { CanonicalPedagogicalModel } from '@/lib/student-materials/types';
import type { CanonicalSummarySource } from '@/lib/student-materials/canonical-summary-source';
import type { CompleteDocumentChunk } from '@/lib/student-materials/document-chunks';

// Muestras acotadas y trazables: la IA ya analizó todo el documento para el
// modelo canónico. Esta etapa sólo recupera detalles de la fuente sin otra llamada.
const TOTAL_EVIDENCE_CHAR_BUDGET = 24_000;
const MAX_EXCERPTS_PER_TOPIC = 2;
const MAX_EXCERPT_CHARS = 1_050;
const MIN_EXCERPT_CHARS = 110;

type EvidenceItem = {
  source_topic_number: number;
  topic: string;
  page: number | null;
  source_text: string;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function overlap(left: string, right: string) {
  const terms = normalize(left)
    .split(/\s+/)
    .filter((term) => term.length >= 5);
  const candidate = normalize(right);
  return new Set(terms.filter((term) => candidate.includes(term))).size;
}

function relevantStructure(text: string) {
  const numeric = /\b\d+(?:[.,]\d+)?\s*(?:mg\/dL|mEq\/L|mmHg|g\/dL|UI\/L|%|mmol\/L|mL\/min|fL)\b/iu.test(text);
  const tabular = /(?:\|[^\n]+\|)|(?:\S[ \t]{3,}\S)/u.test(text);
  const process = /(?:etapas?|pasos?|mecanismo|reabsorci[oó]n|compensaci[oó]n|clasificaci[oó]n|caso cl[ií]nico|paciente)/iu.test(text);
  return Number(numeric) * 4 + Number(tabular) * 3 + Number(process) * 2;
}

function prepareExcerpt(text: string, budget: number) {
  const cleaned = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:pregunta t[ií]pica de examen|respuesta correcta:|opci[oó]n correcta:)/iu.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length <= budget) return cleaned;
  const cut = cleaned.slice(0, budget);
  const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '));
  return (lastBreak > budget * 0.65 ? cut.slice(0, lastBreak + 1) : cut.slice(0, cut.lastIndexOf(' ') > budget * 0.65 ? cut.lastIndexOf(' ') : budget)).trim();
}

/**
 * Devuelve evidencia distribuida por topic, sin serializar sourceBindings,
 * índices internos ni el PDF completo al prompt. Los chunkIndexes son 0-based
 * y pertenecen a buildCompleteTraceableDocumentChunks (no a buildSummaryChunks).
 */
export function buildCanonicalSummaryEvidence(
  source: CanonicalSummarySource,
  model: CanonicalPedagogicalModel,
  chunks: CompleteDocumentChunk[]
): EvidenceItem[] {
  if (!source.topics.length || !chunks.length) return [];

  const budgetPerExcerpt = Math.min(
    MAX_EXCERPT_CHARS,
    Math.max(MIN_EXCERPT_CHARS, Math.floor(TOTAL_EVIDENCE_CHAR_BUDGET / source.topics.length) - 100)
  );

  const ranked = source.topics.map((topic, topicIndex) => {
    const bindingIndexes = new Set(
      (model.sourceBindings ?? [])
        .filter((binding) =>
          binding.kind === 'topic' &&
          normalize(binding.key) === normalize(topic.title)
        )
        .flatMap((binding) => binding.references.flatMap((reference) => reference.chunkIndexes))
    );
    const topicPages = new Set(topic.pageReferences);
    const referenceText = `${topic.title} ${topic.description.slice(0, 260)}`;
    const candidates = chunks
      .map((chunk, index) => {
        const direct = bindingIndexes.has(index);
        const samePage =
          chunk.pageStart !== null &&
          topicPages.has(chunk.pageStart);
        const relevant = overlap(topic.title, chunk.text);
        // El anclaje por chunk es más fiable que palabras compartidas.
        // Si no hay páginas ni binding, requerimos coincidencia del título.
        if (!direct && !samePage && relevant === 0) return null;
        const score =
          (direct ? 100 : 0) +
          (samePage ? 30 : 0) +
          Math.min(20, relevant * 4) +
          Math.min(12, overlap(referenceText, chunk.text)) +
          relevantStructure(chunk.text);
        return { index, chunk, score };
      })
      .filter((candidate): candidate is {
        index: number;
        chunk: CompleteDocumentChunk;
        score: number;
      } => candidate !== null)
      .sort((a, b) => b.score - a.score || a.index - b.index);
    return { topic, topicIndex, candidates };
  });

  const used = new Set<number>();
  const result: EvidenceItem[] = [];
  let remaining = TOTAL_EVIDENCE_CHAR_BUDGET;

  // Primera pasada: todos los temas con fuente antes de sumar un segundo ejemplo.
  for (let pass = 0; pass < MAX_EXCERPTS_PER_TOPIC; pass += 1) {
    for (const { topic, topicIndex, candidates } of ranked) {
      if (remaining < 170) break;
      const candidate = candidates.find((item) => !used.has(item.index));
      if (!candidate) continue;

      const available = Math.min(budgetPerExcerpt, remaining - 100);
      if (available < MIN_EXCERPT_CHARS) continue;
      const text = prepareExcerpt(candidate.chunk.text, available);
      if (text.length < 70) continue;

      const evidence: EvidenceItem = {
        source_topic_number: topicIndex + 1,
        topic: topic.title,
        page: candidate.chunk.pageStart,
        source_text: text,
      };
      const cost = JSON.stringify(evidence).length + 1;
      if (cost > remaining) continue;
      result.push(evidence);
      remaining -= cost;
      used.add(candidate.index);
    }
  }

  return result.sort(
    (a, b) => a.source_topic_number - b.source_topic_number ||
      (a.page ?? 0) - (b.page ?? 0)
  );
}
