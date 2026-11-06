import { requestGeminiJson } from '@/lib/ai/providers';
import { extractJsonObject } from '@/lib/ai/json';
import { isolateUntrustedContent, PROMPT_INJECTION_GUARD } from '@/lib/ai/safety';
import { recordAiUsage } from '@/lib/student-materials/ai-usage';
import { logError } from '@/lib/observability';
import type { StudyGlossaryItem, GenerateSummaryInput } from '@/lib/student-materials/types';

type Translation = { index: number; englishTerm: string; definition: string; context: string };
const BATCH_SIZE = 60;
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      index: { type: 'INTEGER' }, englishTerm: { type: 'STRING' },
      definition: { type: 'STRING' }, context: { type: 'STRING' },
    }, required: ['index', 'englishTerm', 'definition', 'context'] } },
  },
  required: ['items'],
};

function parseTranslations(raw: string, count: number): Translation[] | null {
  try {
    const parsed = extractJsonObject(raw);
    if (!parsed || typeof parsed !== 'object' || !('items' in parsed) ||
      !Array.isArray((parsed as { items: unknown }).items)) return null;
    const list = (parsed as { items: unknown[] }).items;
    if (list.length !== count) return null;
    const result = new Map<number, Translation>();
    for (const value of list) {
      if (!value || typeof value !== 'object') return null;
      const row = value as Record<string, unknown>;
      if (!Number.isInteger(row.index) || (row.index as number) < 0 ||
        (row.index as number) >= count || result.has(row.index as number) ||
        typeof row.englishTerm !== 'string' || !row.englishTerm.trim() ||
        typeof row.definition !== 'string' || !row.definition.trim() ||
        typeof row.context !== 'string') return null;
      result.set(row.index as number, {
        index: row.index as number, englishTerm: row.englishTerm.trim(),
        definition: row.definition.trim(), context: row.context.trim(),
      });
    }
    if (result.size !== count) return null;
    return Array.from({ length: count }, (_, index) => result.get(index)!);
  } catch {
    return null;
  }
}

/** The original canonical term, topic matching and source citations never change.
 * Only English equivalents, definitions and context are derived.
 * A provider failure does not block a student's material from becoming ready.
 */
export async function localizeCanonicalGlossary(
  source: StudyGlossaryItem[],
  input: Pick<GenerateSummaryInput, 'materialId' | 'userId' | 'geminiPdfKeySlot'>
): Promise<StudyGlossaryItem[]> {
  if (!source.length) return source;
  const output: StudyGlossaryItem[] = [];
  for (let start = 0; start < source.length; start += BATCH_SIZE) {
    const items = source.slice(start, start + BATCH_SIZE);
    try {
      const evidence = items.map((item, index) => ({
        index, term: item.term, definition: item.definition, context: item.context,
      }));
      const prompt = [
        'Translate this source-grounded university glossary into clear academic English.',
        'Use only the meanings supplied with the original terms. Do not invent extra facts.',
        'Write definition and context in English; write englishTerm as a standard English equivalent when known.',
        'If a name, formula or acronym has no English equivalent, copy its original form.',
        'Any quotations of original source evidence must be preserved verbatim in the original language.',
        'Return one item for EACH original index, from 0 through ' + (items.length - 1) + ', and do not alter the indices.',
        'Return JSON ONLY: {"items":[{"index":0,"englishTerm":"...","definition":"...","context":"..."}]}',
        PROMPT_INJECTION_GUARD,
        'UNTRUSTED GLOSSARY DATA:',
        isolateUntrustedContent(JSON.stringify(evidence)),
      ].join('\n');
      const response = await requestGeminiJson({
        prompt, temperature: 0.1, maxOutputTokens: 6500,
        responseSchema: RESPONSE_SCHEMA, geminiKeySlot: input.geminiPdfKeySlot,
      });
      if (!response) { output.push(...items); continue; }
      await recordAiUsage({
        materialId: input.materialId, userId: input.userId,
        provider: 'gemini', model: response.model, operation: 'glossary', usage: response.usage,
      });
      const translations = parseTranslations(response.content, items.length);
      if (!translations) { output.push(...items); continue; }
      output.push(...items.map((item, index) => {
        const translated = translations[index]!;
        const sourceQuotes = [...item.definition.matchAll(/["“]([^"”]{4,})["”]/g)].map(match => match[1]);
        if (sourceQuotes.some(quote => !translated.definition.includes(quote))) return item;
        return {
          ...item, term: item.term,
          englishTerm: translated.englishTerm.slice(0, 200),
          definition: translated.definition.slice(0, 1500),
          context: translated.context.slice(0, 500),
        };
      }));
    } catch (error) {
      logError('studentMaterialGlossary.localizeEnglish', error, { materialId: input.materialId, batchStart: start });
      output.push(...items);
    }
  }
  return output;
}
