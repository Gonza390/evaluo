import type {
  CanonicalPedagogicalModel,
  CanonicalPedagogicalSourceBinding,
  CanonicalPedagogicalSourceKind,
  CanonicalPedagogicalSourceReference,
  GenerateSummaryInput,
  StudyDocumentConcept,
} from '@/lib/student-materials/types';
import { requestGeminiJson } from '@/lib/ai/providers';
import { recordAiUsage } from '@/lib/student-materials/ai-usage';
import {
  buildCompleteTraceableDocumentChunks,
  type CompleteDocumentChunk,
} from '@/lib/student-materials/document-chunks';
import { logError, logInfo } from '@/lib/observability';

const MAP_GROUP_MAX_CHARS = 5_000;
const MAP_CONCURRENCY = 3;
const REDUCE_GROUP_MAX_CHARS = 24_000;
const REDUCE_GROUP_MAX_ITEMS = 4;
const REDUCE_CONCURRENCY = 2;
const MAP_MAX_OUTPUT_TOKENS = 2_500;
const REDUCE_MAX_OUTPUT_TOKENS = 12_000;
const REDUCE_RETRY_MAX_OUTPUT_TOKENS = 16_000;

type JsonRecord = Record<string, unknown>;
type PedagogicalChunkInput = string | CompleteDocumentChunk;

export type PedagogicalMapGroup = {
  chunkIndexes: number[];
  text: string;
};

const PEDAGOGICAL_MAP_PROMPT = (
  group: PedagogicalMapGroup,
  totalChunks: number
) => `
Analizá TODOS los fragmentos incluidos a continuación como partes del mismo material de estudio.

Reglas de contenido:
- No omitas fragmentos del bloque.
- No inventes información que no aparezca en los fragmentos.
- Conservá definiciones, clasificaciones, relaciones, procesos, fórmulas, autores/teorías,
  ejemplos, afirmaciones estructuralmente evaluables y posibles confusiones.
- "Relevancia alta" significa central para comprender o evaluar el tema; no significa que
  sepamos que aparecerá en un examen.

Reglas de trazabilidad:
- Cada fragmento está marcado como CHUNK N y, cuando existe, con su PÁGINA física.
- Para CADA elemento extraído devolvé "sourceChunkNumbers".
- "sourceChunkNumbers" usa los números de CHUNK mostrados abajo, empezando en 1.
- Sólo podés citar chunks incluidos en este bloque.
- No inventes números de página: la aplicación derivará la página desde el chunk validado.
- Si un elemento se apoya en varios fragmentos, incluí todos sus chunk numbers.

Cobertura de este bloque:
- Chunks incluidos: ${group.chunkIndexes.map((index) => index + 1).join(', ')}
- Total de chunks del documento: ${totalChunks}

Fragmentos:
"""
${group.text}
"""

Respondé SOLO con JSON válido:
{
  "title": "",
  "overview": "",
  "topics": [
    {
      "title": "",
      "description": "",
      "relevance": "alta",
      "sourceChunkNumbers": [1]
    }
  ],
  "concepts": [
    {
      "term": "",
      "detail": "",
      "kind": "definicion",
      "sourceChunkNumbers": [1]
    }
  ],
  "relationships": [
    {
      "source": "",
      "target": "",
      "description": "",
      "sourceChunkNumbers": [1]
    }
  ],
  "classifications": [
    {
      "title": "",
      "items": [],
      "sourceChunkNumbers": [1]
    }
  ],
  "processes": [
    {
      "title": "",
      "steps": [],
      "sourceChunkNumbers": [1]
    }
  ],
  "formulas": [
    {
      "expression": "",
      "description": "",
      "sourceChunkNumbers": [1]
    }
  ],
  "authorsOrTheories": [
    {
      "value": "",
      "sourceChunkNumbers": [1]
    }
  ],
  "examples": [
    {
      "value": "",
      "sourceChunkNumbers": [1]
    }
  ],
  "examRelevantClaims": [
    {
      "value": "",
      "sourceChunkNumbers": [1]
    }
  ],
  "confusions": [
    {
      "value": "",
      "sourceChunkNumbers": [1]
    }
  ]
}
`;

const PEDAGOGICAL_REDUCE_PROMPT = (
  models: JsonRecord[],
  level: number
) => `
Consolidá TODOS los modelos pedagógicos parciales siguientes en un único modelo pedagógico.

Esta es una reducción jerárquica de nivel ${level}.

Reglas:
- Ningún modelo parcial puede ser ignorado.
- Eliminá sólo duplicados semánticos reales.
- Unificá conceptos equivalentes sin borrar matices importantes.
- Preservá contenido que aparezca únicamente en uno de los parciales.
- No inventes contenido ausente.
- Para cada elemento consolidado preservá y UNÍ todos sus "sourceChunkNumbers".
- Nunca reemplaces sourceChunkNumbers por páginas.
- Nunca inventes sourceChunkNumbers que no existan en los parciales de entrada.
- "examRelevantClaims" representa contenido estructuralmente evaluable, no predicciones
  sobre qué aparecerá en un examen.
- El resultado debe ser COMPACTO: consolidá redundancias de redacción sin borrar entidades
  o afirmaciones semánticamente distintas.
- No repitas la misma explicación en topic, concept, process y claim salvo que sea necesario.
- Límites de redacción por elemento:
  * overview: máximo 900 caracteres.
  * topic.description: máximo 280 caracteres.
  * concept.detail: máximo 280 caracteres.
  * relationship.description: máximo 220 caracteres.
  * formula.description: máximo 220 caracteres.
  * cada string de authorsOrTheories/examples/examRelevantClaims/confusions: máximo 240 caracteres.
- Priorizá conservar más entidades distintas con descripciones breves antes que pocas entidades
  con explicaciones largas.

Modelos parciales:
"""
${JSON.stringify(models)}
"""

Respondé SOLO con JSON válido conservando esta forma:
{
  "title": "",
  "overview": "",
  "topics": [
    {
      "title": "",
      "description": "",
      "relevance": "alta",
      "sourceChunkNumbers": []
    }
  ],
  "concepts": [
    {
      "term": "",
      "detail": "",
      "kind": "definicion",
      "sourceChunkNumbers": []
    }
  ],
  "relationships": [
    {
      "source": "",
      "target": "",
      "description": "",
      "sourceChunkNumbers": []
    }
  ],
  "classifications": [
    {
      "title": "",
      "items": [],
      "sourceChunkNumbers": []
    }
  ],
  "processes": [
    {
      "title": "",
      "steps": [],
      "sourceChunkNumbers": []
    }
  ],
  "formulas": [
    {
      "expression": "",
      "description": "",
      "sourceChunkNumbers": []
    }
  ],
  "authorsOrTheories": [
    {
      "value": "",
      "sourceChunkNumbers": []
    }
  ],
  "examples": [
    {
      "value": "",
      "sourceChunkNumbers": []
    }
  ],
  "examRelevantClaims": [
    {
      "value": "",
      "sourceChunkNumbers": []
    }
  ],
  "confusions": [
    {
      "value": "",
      "sourceChunkNumbers": []
    }
  ]
}
`;

export function buildPedagogicalMapGroups(
  chunks: PedagogicalChunkInput[],
  maxChars = MAP_GROUP_MAX_CHARS
): PedagogicalMapGroup[] {
  const safeMaxChars = Math.max(1, Math.floor(maxChars));
  const groups: PedagogicalMapGroup[] = [];

  let currentIndexes: number[] = [];
  let currentParts: string[] = [];
  let currentChars = 0;

  const flush = () => {
    if (currentParts.length === 0) return;

    groups.push({
      chunkIndexes: currentIndexes,
      text: currentParts.join('\n\n'),
    });

    currentIndexes = [];
    currentParts = [];
    currentChars = 0;
  };

  chunks.forEach((rawChunk, index) => {
    const chunk = normalizeChunkInput(rawChunk);
    const pageLabel = formatPageLabel(chunk);
    const part = `[CHUNK ${index + 1}${pageLabel}]\n${chunk.text}`;
    const separatorChars = currentParts.length > 0 ? 2 : 0;
    const nextChars = currentChars + separatorChars + part.length;

    if (currentParts.length > 0 && nextChars > safeMaxChars) {
      flush();
    }

    const separatorAfterFlush = currentParts.length > 0 ? 2 : 0;
    currentIndexes.push(index);
    currentParts.push(part);
    currentChars += separatorAfterFlush + part.length;
  });

  flush();
  return groups;
}

export function buildPedagogicalReduceGroups(
  items: JsonRecord[],
  maxChars = REDUCE_GROUP_MAX_CHARS,
  maxItems = REDUCE_GROUP_MAX_ITEMS
): JsonRecord[][] {
  if (items.length === 0) return [];

  const safeMaxChars = Math.max(1, Math.floor(maxChars));
  const safeMaxItems = Math.max(2, Math.floor(maxItems));
  const groups: JsonRecord[][] = [];

  let current: JsonRecord[] = [];
  let currentChars = 2;

  const flush = () => {
    if (current.length === 0) return;
    groups.push(current);
    current = [];
    currentChars = 2;
  };

  for (const item of items) {
    const serialized = JSON.stringify(item);
    const separatorChars = current.length > 0 ? 1 : 0;
    const nextChars = currentChars + separatorChars + serialized.length;

    const reachedItemLimit = current.length >= safeMaxItems;
    const reachedCharBudget =
      current.length >= 2 && nextChars > safeMaxChars;

    if (reachedItemLimit || reachedCharBudget) {
      flush();
    }

    const separatorAfterFlush = current.length > 0 ? 1 : 0;
    current.push(item);
    currentChars += separatorAfterFlush + serialized.length;
  }

  flush();

  if (groups.length > 1) {
    const last = groups.at(-1);
    const previous = groups.at(-2);

    if (last?.length === 1 && previous && previous.length < safeMaxItems) {
      previous.push(last[0]);
      groups.pop();
    }
  }

  return groups;
}

export async function generatePedagogicalModel(
  input: GenerateSummaryInput
): Promise<CanonicalPedagogicalModel | null> {
  const chunks = buildCompleteTraceableDocumentChunks(
    input.pages,
    input.text
  );

  if (chunks.length === 0) return null;

  const mapGroups = buildPedagogicalMapGroups(chunks);

  logInfo('pedagogy.generateModel.coverage', {
    materialId: input.materialId,
    chunkCount: chunks.length,
    mapGroupCount: mapGroups.length,
    mappedChunkCount: mapGroups.reduce(
      (total, group) => total + group.chunkIndexes.length,
      0
    ),
    chunksWithPhysicalPage: chunks.filter(
      (chunk) => chunk.pageStart !== null
    ).length,
  });

  const partials: JsonRecord[] = [];

  for (let start = 0; start < mapGroups.length; start += MAP_CONCURRENCY) {
    const batch = mapGroups.slice(start, start + MAP_CONCURRENCY);

    const results = await Promise.all(
      batch.map((group) =>
        mapPedagogicalGroup(group, chunks.length, input)
      )
    );

    if (results.some((result) => result === null)) {
      logError(
        'pedagogy.generateModel.incompleteMapCoverage',
        new Error('No se pudo mapear la totalidad de los chunks del documento.'),
        {
          materialId: input.materialId,
          chunkCount: chunks.length,
          mapGroupCount: mapGroups.length,
        }
      );
      return null;
    }

    for (const result of results) {
      if (result) partials.push(result);
    }
  }

  if (partials.length === 0) return null;

  const reduced = await reducePedagogicalTree(partials, input);
  if (!reduced) return null;

  const model = normalizeCanonicalModel(
    reduced,
    input.title,
    chunks
  );

  logInfo('pedagogy.generateModel.traceability', {
    materialId: input.materialId,
    chunkCount: chunks.length,
    sourceBindingCount: model.sourceBindings?.length ?? 0,
    referencedPageCount: new Set(
      (model.sourceBindings ?? []).flatMap((binding) =>
        binding.references.flatMap((reference) =>
          expandPageRange(reference.pageStart, reference.pageEnd)
        )
      )
    ).size,
  });

  return model;
}

async function mapPedagogicalGroup(
  group: PedagogicalMapGroup,
  totalChunks: number,
  input: GenerateSummaryInput
): Promise<JsonRecord | null> {
  try {
    const result = await requestGeminiJson({
      prompt: PEDAGOGICAL_MAP_PROMPT(group, totalChunks),
      temperature: 0.1,
      maxOutputTokens: MAP_MAX_OUTPUT_TOKENS,
    });

    if (!result) return null;

    await recordAiUsage({
      materialId: input.materialId,
      userId: input.userId,
      provider: 'gemini',
      model: result.model,
      operation: 'summary_map',
      usage: result.usage,
    });

    const parsed = parseJsonRecord(result.content);
    if (!parsed) return null;

    const allowedChunkNumbers = new Set(
      group.chunkIndexes.map((index) => index + 1)
    );

    return sanitizeProvenance(parsed, allowedChunkNumbers);
  } catch (error) {
    logError('pedagogy.generateModel.map', error, {
      materialId: input.materialId,
      chunkIndexes: group.chunkIndexes,
    });
    return null;
  }
}

async function reducePedagogicalTree(
  partials: JsonRecord[],
  input: GenerateSummaryInput
): Promise<JsonRecord | null> {
  let current = partials;
  let level = 1;

  while (current.length > 1) {
    const groups = buildPedagogicalReduceGroups(current);

    logInfo('pedagogy.generateModel.reduceLevel', {
      materialId: input.materialId,
      level,
      inputNodeCount: current.length,
      groupCount: groups.length,
    });

    const next: JsonRecord[] = [];

    for (let start = 0; start < groups.length; start += REDUCE_CONCURRENCY) {
      const batch = groups.slice(start, start + REDUCE_CONCURRENCY);

      const results = await Promise.all(
        batch.map(async (group) => {
          if (group.length === 1) {
            return group[0] ?? null;
          }

          return reducePedagogicalGroup(group, level, input);
        })
      );

      if (results.some((result) => result === null)) {
        logError(
          'pedagogy.generateModel.incompleteReduceCoverage',
          new Error('Falló una reducción jerárquica del modelo pedagógico.'),
          {
            materialId: input.materialId,
            level,
            inputNodeCount: current.length,
          }
        );
        return null;
      }

      for (const result of results) {
        if (result) next.push(result);
      }
    }

    if (next.length === 0 || next.length >= current.length) {
      logError(
        'pedagogy.generateModel.reduceDidNotConverge',
        new Error('La reducción pedagógica no logró disminuir la cantidad de nodos.'),
        {
          materialId: input.materialId,
          level,
          inputNodeCount: current.length,
          outputNodeCount: next.length,
        }
      );
      return null;
    }

    current = next;
    level += 1;
  }

  return current[0] ?? null;
}

async function reducePedagogicalGroup(
  group: JsonRecord[],
  level: number,
  input: GenerateSummaryInput
): Promise<JsonRecord | null> {
  const allowedChunkNumbers = collectSourceChunkNumbers(group);
  const basePrompt = PEDAGOGICAL_REDUCE_PROMPT(group, level);

  try {
    const first = await requestGeminiJson({
      prompt: basePrompt,
      temperature: 0.1,
      maxOutputTokens: REDUCE_MAX_OUTPUT_TOKENS,
    });

    if (!first) return null;

    await recordAiUsage({
      materialId: input.materialId,
      userId: input.userId,
      provider: 'gemini',
      model: first.model,
      operation: 'summary_reduce',
      usage: first.usage,
    });

    const firstParsed = tryParseJsonRecord(first.content);

    if (firstParsed) {
      return sanitizeProvenance(firstParsed, allowedChunkNumbers);
    }

    logError(
      'pedagogy.generateModel.reduceInvalidJson',
      new Error('Gemini devolvió JSON inválido o incompleto en reduce; se reintenta una vez.'),
      {
        materialId: input.materialId,
        level,
        groupSize: group.length,
        responseChars: first.content.length,
      }
    );

    const retry = await requestGeminiJson({
      prompt: `${basePrompt}

REINTENTO DE FORMATO:
- La respuesta anterior no pudo parsearse como JSON completo.
- Respondé con un JSON MÁS COMPACTO.
- No agregues markdown, comentarios ni texto fuera del objeto JSON.
- Conservá todas las entidades semánticamente distintas y todos sus sourceChunkNumbers válidos.
- Reducí principalmente redundancia de redacción, no cobertura.`,
      temperature: 0,
      maxOutputTokens: REDUCE_RETRY_MAX_OUTPUT_TOKENS,
    });

    if (!retry) return null;

    await recordAiUsage({
      materialId: input.materialId,
      userId: input.userId,
      provider: 'gemini',
      model: retry.model,
      operation: 'summary_reduce',
      usage: retry.usage,
    });

    const retryParsed = tryParseJsonRecord(retry.content);

    if (!retryParsed) {
      logError(
        'pedagogy.generateModel.reduceRetryInvalidJson',
        new Error('Gemini volvió a devolver JSON inválido o incompleto en reduce.'),
        {
          materialId: input.materialId,
          level,
          groupSize: group.length,
          responseChars: retry.content.length,
        }
      );
      return null;
    }

    return sanitizeProvenance(retryParsed, allowedChunkNumbers);
  } catch (error) {
    logError('pedagogy.generateModel.reduce', error, {
      materialId: input.materialId,
      level,
      groupSize: group.length,
    });
    return null;
  }
}

function parseJsonRecord(content: string): JsonRecord | null {
  const parsed = JSON.parse(content) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  return parsed as JsonRecord;
}

function tryParseJsonRecord(content: string): JsonRecord | null {
  try {
    return parseJsonRecord(content);
  } catch {
    return null;
  }
}

function sanitizeProvenance(
  raw: JsonRecord,
  allowedChunkNumbers: Set<number>
): JsonRecord {
  return sanitizeValue(raw, allowedChunkNumbers) as JsonRecord;
}

function sanitizeValue(
  value: unknown,
  allowedChunkNumbers: Set<number>
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeValue(item, allowedChunkNumbers)
    );
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const record = value as JsonRecord;
  const sanitized: JsonRecord = {};

  for (const [key, child] of Object.entries(record)) {
    if (key === 'sourceChunkNumbers') {
      sanitized[key] = readSourceChunkNumbers(
        child,
        allowedChunkNumbers
      );
      continue;
    }

    sanitized[key] = sanitizeValue(
      child,
      allowedChunkNumbers
    );
  }

  return sanitized;
}

function collectSourceChunkNumbers(value: unknown) {
  const result = new Set<number>();

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    if (!node || typeof node !== 'object') return;

    const record = node as JsonRecord;

    for (const [key, child] of Object.entries(record)) {
      if (key === 'sourceChunkNumbers') {
        for (const chunkNumber of readSourceChunkNumbers(child)) {
          result.add(chunkNumber);
        }
      } else {
        visit(child);
      }
    }
  };

  visit(value);
  return result;
}

export function resolvePedagogicalSourceReferences(
  sourceChunkNumbers: number[],
  chunks: CompleteDocumentChunk[]
): CanonicalPedagogicalSourceReference[] {
  const byPage = new Map<
    string,
    CanonicalPedagogicalSourceReference
  >();

  const uniqueNumbers = [
    ...new Set(
      sourceChunkNumbers.filter(
        (chunkNumber) =>
          Number.isInteger(chunkNumber) &&
          chunkNumber >= 1 &&
          chunkNumber <= chunks.length
      )
    ),
  ].sort((a, b) => a - b);

  for (const chunkNumber of uniqueNumbers) {
    const chunkIndex = chunkNumber - 1;
    const chunk = chunks[chunkIndex];
    if (!chunk) continue;

    const key =
      chunk.pageStart === null
        ? `chunk:${chunkIndex}`
        : `${chunk.pageStart}:${chunk.pageEnd}`;

    const existing = byPage.get(key);

    if (existing) {
      existing.chunkIndexes = [
        ...new Set([...existing.chunkIndexes, chunkIndex]),
      ].sort((a, b) => a - b);

      if (existing.excerpt.length < 220) {
        existing.excerpt = truncateAtWord(
          `${existing.excerpt} ${chunk.text}`,
          220
        );
      }
      continue;
    }

    byPage.set(key, {
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chunkIndexes: [chunkIndex],
      excerpt: truncateAtWord(chunk.text, 220),
    });
  }

  return [...byPage.values()];
}

function normalizeCanonicalModel(
  raw: JsonRecord,
  fallbackTitle: string,
  chunks: CompleteDocumentChunk[]
): CanonicalPedagogicalModel {
  const bindingMap = new Map<
    string,
    CanonicalPedagogicalSourceBinding
  >();

  const allowedChunkNumbers = new Set(
    Array.from({ length: chunks.length }, (_, index) => index + 1)
  );

  const registerSources = (
    kind: CanonicalPedagogicalSourceKind,
    key: string,
    sourceChunkNumbersValue: unknown
  ) => {
    const sourceChunkNumbers = readSourceChunkNumbers(
      sourceChunkNumbersValue,
      allowedChunkNumbers
    );

    const references = resolvePedagogicalSourceReferences(
      sourceChunkNumbers,
      chunks
    );

    if (references.length === 0 || !key.trim()) {
      return [] as number[];
    }

    const internalKey = `${kind}:${normalizeBindingKey(key)}`;
    const existing = bindingMap.get(internalKey);

    if (existing) {
      existing.references = mergeReferences(
        existing.references,
        references
      );
    } else {
      bindingMap.set(internalKey, {
        kind,
        key: key.trim(),
        references,
      });
    }

    return referencesToPages(references);
  };

  const topics = readRecordArray(raw.topics)
    .map((topic) => {
      const title = readString(topic.title);
      if (!title) return null;

      return {
        title,
        description: readString(topic.description),
        relevance: readRelevance(topic.relevance),
        pageReferences: registerSources(
          'topic',
          title,
          topic.sourceChunkNumbers
        ),
      };
    })
    .filter(
      (
        topic
      ): topic is {
        title: string;
        description: string;
        relevance: 'alta' | 'media';
        pageReferences: number[];
      } => topic !== null
    );

  const concepts = readRecordArray(raw.concepts)
    .map((concept) => {
      const normalized = normalizeConcept(concept);
      if (!normalized) return null;

      normalized.pageReferences = registerSources(
        'concept',
        normalized.term,
        concept.sourceChunkNumbers
      );

      return normalized;
    })
    .filter(
      (concept): concept is StudyDocumentConcept =>
        concept !== null
    );

  const relationships = readRecordArray(raw.relationships)
    .map((relationship) => {
      const source = readString(relationship.source);
      const target = readString(relationship.target);
      if (!source || !target) return null;

      const key = `${source} → ${target}`;

      return {
        source,
        target,
        description: readString(relationship.description),
        pageReferences: registerSources(
          'relationship',
          key,
          relationship.sourceChunkNumbers
        ),
      };
    })
    .filter((relationship) => relationship !== null);

  const classifications = readRecordArray(raw.classifications)
    .map((classification) => {
      const title = readString(classification.title);
      if (!title) return null;

      return {
        title,
        items: readStringArray(classification.items),
        pageReferences: registerSources(
          'classification',
          title,
          classification.sourceChunkNumbers
        ),
      };
    })
    .filter((classification) => classification !== null);

  const processes = readRecordArray(raw.processes)
    .map((process) => {
      const title = readString(process.title);
      if (!title) return null;

      return {
        title,
        steps: readStringArray(process.steps),
        pageReferences: registerSources(
          'process',
          title,
          process.sourceChunkNumbers
        ),
      };
    })
    .filter((process) => process !== null);

  const formulas = readRecordArray(raw.formulas)
    .map((formula) => {
      const expression = readString(formula.expression);
      if (!expression) return null;

      return {
        expression,
        description: readString(formula.description),
        pageReferences: registerSources(
          'formula',
          expression,
          formula.sourceChunkNumbers
        ),
      };
    })
    .filter((formula) => formula !== null);

  const authorsOrTheories = normalizeSourcedStrings(
    raw.authorsOrTheories,
    'author_or_theory',
    registerSources
  );
  const examples = normalizeSourcedStrings(
    raw.examples,
    'example',
    registerSources
  );
  const examRelevantClaims = normalizeSourcedStrings(
    raw.examRelevantClaims,
    'exam_relevant_claim',
    registerSources
  );
  const confusions = normalizeSourcedStrings(
    raw.confusions,
    'confusion',
    registerSources
  );

  return {
    title: readString(raw.title) || fallbackTitle,
    overview: readString(raw.overview),
    topics,
    concepts,
    relationships,
    classifications,
    processes,
    formulas,
    authorsOrTheories,
    examples,
    examRelevantClaims,
    confusions,
    chunkCount: chunks.length,
    sourceBindings: [...bindingMap.values()],
  };
}

function normalizeSourcedStrings(
  value: unknown,
  kind: CanonicalPedagogicalSourceKind,
  registerSources: (
    kind: CanonicalPedagogicalSourceKind,
    key: string,
    sourceChunkNumbersValue: unknown
  ) => number[]
) {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];

  for (const item of value) {
    if (typeof item === 'string') {
      const clean = item.trim();
      if (clean) result.push(clean);
      continue;
    }

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }

    const record = item as JsonRecord;
    const clean = readString(record.value);

    if (!clean) continue;

    result.push(clean);
    registerSources(kind, clean, record.sourceChunkNumbers);
  }

  return [...new Set(result)];
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readRecordArray(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is JsonRecord =>
      Boolean(item) &&
      typeof item === 'object' &&
      !Array.isArray(item)
  );
}

function readRelevance(value: unknown): 'alta' | 'media' {
  return value === 'alta' ? 'alta' : 'media';
}

function readSourceChunkNumbers(
  value: unknown,
  allowed?: Set<number>
) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.filter(
        (chunkNumber): chunkNumber is number =>
          typeof chunkNumber === 'number' &&
          Number.isInteger(chunkNumber) &&
          chunkNumber >= 1 &&
          (!allowed || allowed.has(chunkNumber))
      )
    ),
  ].sort((a, b) => a - b);
}

function normalizeConcept(
  raw: JsonRecord
): StudyDocumentConcept | null {
  const term = readString(raw.term);
  const detail = readString(raw.detail);

  if (!term || !detail) return null;

  const validKinds: StudyDocumentConcept['kind'][] = [
    'definicion',
    'clasificacion',
    'autor',
    'ejemplo',
    'idea_clave',
  ];

  const kind =
    typeof raw.kind === 'string' &&
    validKinds.includes(raw.kind as StudyDocumentConcept['kind'])
      ? (raw.kind as StudyDocumentConcept['kind'])
      : 'idea_clave';

  return { term, detail, kind };
}

function normalizeChunkInput(
  chunk: PedagogicalChunkInput
): CompleteDocumentChunk {
  if (typeof chunk === 'string') {
    return {
      text: chunk,
      pageStart: null,
      pageEnd: null,
    };
  }

  return chunk;
}

function formatPageLabel(chunk: CompleteDocumentChunk) {
  if (chunk.pageStart === null) return '';

  if (
    chunk.pageEnd !== null &&
    chunk.pageEnd !== chunk.pageStart
  ) {
    return ` | PAGINAS ${chunk.pageStart}-${chunk.pageEnd}`;
  }

  return ` | PAGINA ${chunk.pageStart}`;
}

function referencesToPages(
  references: CanonicalPedagogicalSourceReference[]
) {
  return [
    ...new Set(
      references.flatMap((reference) =>
        expandPageRange(reference.pageStart, reference.pageEnd)
      )
    ),
  ].sort((a, b) => a - b);
}

function expandPageRange(
  pageStart: number | null,
  pageEnd: number | null
) {
  if (pageStart === null) return [];

  const end =
    pageEnd !== null && pageEnd >= pageStart
      ? pageEnd
      : pageStart;

  return Array.from(
    { length: end - pageStart + 1 },
    (_, index) => pageStart + index
  );
}

function mergeReferences(
  left: CanonicalPedagogicalSourceReference[],
  right: CanonicalPedagogicalSourceReference[]
) {
  const merged = new Map<
    string,
    CanonicalPedagogicalSourceReference
  >();

  for (const reference of [...left, ...right]) {
    const key =
      reference.pageStart === null
        ? `chunks:${reference.chunkIndexes.join(',')}`
        : `${reference.pageStart}:${reference.pageEnd}`;

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...reference,
        chunkIndexes: [...reference.chunkIndexes],
      });
      continue;
    }

    existing.chunkIndexes = [
      ...new Set([
        ...existing.chunkIndexes,
        ...reference.chunkIndexes,
      ]),
    ].sort((a, b) => a - b);

    if (existing.excerpt.length < reference.excerpt.length) {
      existing.excerpt = reference.excerpt;
    }
  }

  return [...merged.values()];
}

function normalizeBindingKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(text: string, limit: number) {
  const clean = text.replace(/\s+/g, ' ').trim();

  if (clean.length <= limit) return clean;

  const partial = clean.slice(0, limit);
  const lastSpace = partial.lastIndexOf(' ');

  return `${partial
    .slice(0, lastSpace > 0 ? lastSpace : limit)
    .trim()}...`;
}
