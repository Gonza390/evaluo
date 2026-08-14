import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { generateTutorExplanation } from '@/lib/ai-tutor';
import {
  hydrateChunksForMateria,
  selectTopRagContextChunks,
  type RagChunkRow,
} from '@/lib/rag';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type AdminClient = SupabaseClient<Database>;

type QuestionRow = {
  id: string;
  materia_id: string | null;
  enunciado: string;
  opciones: unknown;
  respuesta_correcta: string;
  parcial: number | null;
  creado_at: string | null;
  tasa_acierto: number | null;
};

type ChunkRow = {
  chunk_text: string | null;
  source_title: string | null;
};

type WarmupCandidate = {
  preguntaId: string;
  materiaId: string;
  parcial: number;
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string;
  createdAt: string | null;
  priority: {
    materiaUsage: number;
    parcialUsage: number;
    errorFrequency: number;
    recommendationScore: number;
  };
};

type CandidateGroup = {
  groupKey: string;
  materiaId: string;
  parcial: number;
  candidates: WarmupCandidate[];
};

export type WarmupRunOptions = {
  batchSize?: number;
  dryRun?: boolean;
  candidatePoolSize?: number;
  maxEstimatedTokens?: number;
  lookbackDays?: number;
};

export type WarmupRunResult = {
  success: boolean;
  dryRun: boolean;
  selectedCount: number;
  generatedCount: number;
  skippedCount: number;
  totalEstimatedInputTokens: number;
  totalEstimatedOutputTokens: number;
  totalEstimatedTokens: number;
  candidates: Array<{
    preguntaId: string;
    materiaId: string;
    parcial: number;
    priority: WarmupCandidate['priority'];
    estimatedTokens: {
      input: number;
      output: number;
      total: number;
    };
  }>;
  summary: {
    coveredMaterias: Array<{ materiaId: string; materiaNombre: string; questions: number }>;
    coveredParciales: Array<{ materiaId: string; materiaNombre: string; parcial: number; questions: number }>;
  };
};

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_CANDIDATE_POOL = 4000;
const DEFAULT_LOOKBACK_DAYS = 120;
const DEFAULT_MAX_ESTIMATED_TOKENS = 55_000;
const PAGE_SIZE = 1000;

function estimateTokensFromText(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function estimateExplanationTokens(question: {
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string;
  context: string[];
}) {
  const promptScaffold =
    'Sos un tutor universitario claro, preciso y amable. Explica por que la respuesta correcta es correcta y por que suelen confundirse las opciones incorrectas.';
  const inputText = [
    promptScaffold,
    question.enunciado,
    question.opciones.join(' | '),
    question.respuestaCorrecta,
    ...question.context,
  ].join('\n');
  const input = estimateTokensFromText(inputText);
  const output = 260;

  return { input, output, total: input + output };
}

async function fetchPagedRows<T>(
  fetchPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
) {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function parseOptions(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toPartialKey(materiaId: string, parcial: number) {
  return `${materiaId}:${parcial}`;
}

function buildAlternatingCandidateGroups(candidates: WarmupCandidate[]) {
  const groups = new Map<string, CandidateGroup>();

  for (const candidate of candidates) {
    const groupKey = toPartialKey(candidate.materiaId, candidate.parcial);
    const existing = groups.get(groupKey);
    if (existing) {
      existing.candidates.push(candidate);
      continue;
    }

    groups.set(groupKey, {
      groupKey,
      materiaId: candidate.materiaId,
      parcial: candidate.parcial,
      candidates: [candidate],
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    const aTop = a.candidates[0];
    const bTop = b.candidates[0];

    if (bTop.priority.materiaUsage !== aTop.priority.materiaUsage) {
      return bTop.priority.materiaUsage - aTop.priority.materiaUsage;
    }
    if (bTop.priority.parcialUsage !== aTop.priority.parcialUsage) {
      return bTop.priority.parcialUsage - aTop.priority.parcialUsage;
    }
    if (bTop.priority.errorFrequency !== aTop.priority.errorFrequency) {
      return bTop.priority.errorFrequency - aTop.priority.errorFrequency;
    }
    if (bTop.priority.recommendationScore !== aTop.priority.recommendationScore) {
      return bTop.priority.recommendationScore - aTop.priority.recommendationScore;
    }

    return (bTop.createdAt ?? '').localeCompare(aTop.createdAt ?? '');
  });
}

type WarmupCandidateRow = {
  pregunta_id: string;
  materia_id: string | null;
  parcial: number | null;
  enunciado: string;
  opciones: unknown;
  respuesta_correcta: string;
  creado_at: string | null;
  tasa_acierto: number | null;
  materia_usage: number | null;
  parcial_usage: number | null;
  error_frequency: number | null;
  recommendation_score: number | null;
};

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ data: WarmupCandidateRow[] | null; error: { message: string } | null }>;
};

function mapRpcCandidate(row: WarmupCandidateRow): WarmupCandidate | null {
  const materiaId = row.materia_id;
  if (!materiaId) return null;

  const parcial = Number(row.parcial) || 1;
  return {
    preguntaId: row.pregunta_id,
    materiaId,
    parcial,
    enunciado: row.enunciado,
    opciones: parseOptions(row.opciones),
    respuestaCorrecta: row.respuesta_correcta,
    createdAt: row.creado_at,
    priority: {
      materiaUsage: Number(row.materia_usage) || 0,
      parcialUsage: Number(row.parcial_usage) || 0,
      errorFrequency: Number(row.error_frequency) || 0,
      recommendationScore: Number(row.recommendation_score) || 0,
    },
  };
}

async function fetchWarmupCandidatesFromRpc(
  admin: AdminClient,
  lookbackDays: number,
  candidatePoolSize: number
) {
  const { data, error } = await (admin as unknown as RpcClient).rpc('get_warmup_candidates', {
    p_lookback_days: lookbackDays,
    p_pool_size: candidatePoolSize,
  });

  if (error) {
    logError('simulatorWarmup.rpc', new Error(error.message));
    return null;
  }

  const candidates = (data ?? [])
    .map(mapRpcCandidate)
    .filter((candidate): candidate is WarmupCandidate => Boolean(candidate));

  return candidates.length > 0 ? candidates : null;
}

async function fetchWarmupCandidatesLocally(
  admin: AdminClient,
  lookbackDays: number
): Promise<WarmupCandidate[]> {
  const lookbackStart = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const [cachedRows, questions, attempts, wrongStats, materiaPageViews] = await Promise.all([
    fetchPagedRows<{ pregunta_id: string }>((from, to) =>
      admin.from('rag_explanations_cache').select('pregunta_id').range(from, to)
    ),
    fetchPagedRows<QuestionRow>((from, to) =>
      admin
        .from('preguntas_banco')
        .select('id, materia_id, enunciado, opciones, respuesta_correcta, parcial, creado_at, tasa_acierto')
        .not('materia_id', 'is', null)
        .order('creado_at', { ascending: false })
        .range(from, to)
    ),
    fetchPagedRows<{ materia_id: string; parcial: number }>((from, to) =>
      admin
        .from('simulator_attempts')
        .select('materia_id, parcial')
        .gte('created_at', lookbackStart)
        .order('created_at', { ascending: false })
        .range(from, to)
    ),
    fetchPagedRows<{ pregunta_id: string; veces_fallada: number | null }>((from, to) =>
      admin.from('rag_question_stats').select('pregunta_id, veces_fallada').range(from, to)
    ),
    fetchPagedRows<{ path: string | null }>((from, to) =>
      admin
        .from('analytics_events')
        .select('path')
        .eq('event_name', 'page_view')
        .gte('created_at', lookbackStart)
        .like('path', '/explorar/materia/%')
        .order('created_at', { ascending: false })
        .range(from, to)
    ),
  ]);

  const cachedQuestionIds = new Set(cachedRows.map((row) => row.pregunta_id));
  const materiaUsage = new Map<string, number>();
  const parcialUsage = new Map<string, number>();
  const errorFrequency = new Map<string, number>();
  const recommendationByMateria = new Map<string, number>();

  for (const row of attempts) {
    materiaUsage.set(row.materia_id, (materiaUsage.get(row.materia_id) ?? 0) + 1);
    const partialKey = toPartialKey(row.materia_id, Number(row.parcial) || 0);
    parcialUsage.set(partialKey, (parcialUsage.get(partialKey) ?? 0) + 1);
  }

  for (const row of wrongStats) {
    errorFrequency.set(row.pregunta_id, row.veces_fallada ?? 0);
  }

  for (const row of materiaPageViews) {
    const match = row.path?.match(/^\/explorar\/materia\/([^/?#]+)/);
    if (!match) continue;
    const materiaId = match[1];
    recommendationByMateria.set(materiaId, (recommendationByMateria.get(materiaId) ?? 0) + 1);
  }

  const candidates: WarmupCandidate[] = [];

  for (const question of questions) {
    if (!question.materia_id || cachedQuestionIds.has(question.id)) continue;
    const materiaId = question.materia_id;
    const parcial = Number(question.parcial) || 1;
    const recommendationScore =
      (recommendationByMateria.get(materiaId) ?? 0) +
      Math.max(0, 100 - Math.round((question.tasa_acierto ?? 50) * 100)) +
      (question.creado_at ? 10 : 0);

    candidates.push({
      preguntaId: question.id,
      materiaId,
      parcial,
      enunciado: question.enunciado,
      opciones: parseOptions(question.opciones),
      respuestaCorrecta: question.respuesta_correcta,
      createdAt: question.creado_at,
      priority: {
        materiaUsage: materiaUsage.get(materiaId) ?? 0,
        parcialUsage: parcialUsage.get(toPartialKey(materiaId, parcial)) ?? 0,
        errorFrequency: errorFrequency.get(question.id) ?? 0,
        recommendationScore,
      },
    });
  }

  return candidates;
}

async function fetchWarmupCandidates(
  admin: AdminClient,
  lookbackDays: number,
  candidatePoolSize: number
) {
  const rpcCandidates = await fetchWarmupCandidatesFromRpc(admin, lookbackDays, candidatePoolSize);
  if (rpcCandidates) {
    return rpcCandidates;
  }

  const localCandidates = await fetchWarmupCandidatesLocally(admin, lookbackDays);
  logError(
    'simulatorWarmup.rpcFallback',
    new Error('get_warmup_candidates no disponible, usando escaneo local.'),
    { poolSize: localCandidates.length }
  );
  return localCandidates;
}

export async function runSimulatorExplanationWarmup(options: WarmupRunOptions = {}): Promise<WarmupRunResult> {
  const admin = createAdminClient();
  const batchSize = Math.max(1, Math.min(options.batchSize ?? DEFAULT_BATCH_SIZE, 150));
  const dryRun = Boolean(options.dryRun);
  const candidatePoolSize = Math.max(200, Math.min(options.candidatePoolSize ?? DEFAULT_CANDIDATE_POOL, 12_000));
  const lookbackDays = Math.max(30, Math.min(options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS, 365));
  const maxEstimatedTokens = Math.max(5_000, options.maxEstimatedTokens ?? DEFAULT_MAX_ESTIMATED_TOKENS);

  const candidates = await fetchWarmupCandidates(admin, lookbackDays, candidatePoolSize);

  candidates.sort((a, b) => {
    if (b.priority.materiaUsage !== a.priority.materiaUsage) {
      return b.priority.materiaUsage - a.priority.materiaUsage;
    }
    if (b.priority.parcialUsage !== a.priority.parcialUsage) {
      return b.priority.parcialUsage - a.priority.parcialUsage;
    }
    if (b.priority.errorFrequency !== a.priority.errorFrequency) {
      return b.priority.errorFrequency - a.priority.errorFrequency;
    }
    if (b.priority.recommendationScore !== a.priority.recommendationScore) {
      return b.priority.recommendationScore - a.priority.recommendationScore;
    }
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });

  const selected: WarmupCandidate[] = [];
  let estimatedTokenBudget = 0;
  const groupedCandidates = buildAlternatingCandidateGroups(candidates.slice(0, candidatePoolSize));
  let groupCursor = 0;

  while (selected.length < batchSize && groupedCandidates.length > 0) {
    const currentGroup = groupedCandidates[groupCursor];
    const candidate = currentGroup.candidates.shift();

    if (!candidate) {
      groupedCandidates.splice(groupCursor, 1);
      if (groupedCandidates.length === 0) break;
      if (groupCursor >= groupedCandidates.length) groupCursor = 0;
      continue;
    }

    const estimated = estimateExplanationTokens({
      enunciado: candidate.enunciado,
      opciones: candidate.opciones,
      respuestaCorrecta: candidate.respuestaCorrecta,
      context: [],
    });

    if (selected.length > 0 && estimatedTokenBudget + estimated.total > maxEstimatedTokens) {
      break;
    }

    selected.push(candidate);
    estimatedTokenBudget += estimated.total;

    if (currentGroup.candidates.length === 0) {
      groupedCandidates.splice(groupCursor, 1);
      if (groupedCandidates.length === 0) break;
      if (groupCursor >= groupedCandidates.length) groupCursor = 0;
      continue;
    }

    groupCursor = (groupCursor + 1) % groupedCandidates.length;
  }

  const chunkCache = new Map<string, ChunkRow[]>();
  const touchedMaterias = new Set<string>();
  const coveredMaterias = new Map<string, number>();
  const coveredParciales = new Map<string, number>();
  const responseCandidates: WarmupRunResult['candidates'] = [];
  let generatedCount = 0;
  let skippedCount = 0;
  let totalEstimatedInputTokens = 0;
  let totalEstimatedOutputTokens = 0;

  for (const candidate of selected) {
    if (!touchedMaterias.has(candidate.materiaId)) {
      await hydrateChunksForMateria(candidate.materiaId);
      touchedMaterias.add(candidate.materiaId);
    }

    let materiaChunks = chunkCache.get(candidate.materiaId);
    if (!materiaChunks) {
      const { data } = await admin
        .from('rag_document_chunks')
        .select('chunk_text, source_title')
        .eq('materia_id', candidate.materiaId)
        .limit(250);
      materiaChunks = data ?? [];
      chunkCache.set(candidate.materiaId, materiaChunks);
    }

    const joinedQuery = `${candidate.enunciado} ${candidate.respuestaCorrecta}`;
    const topChunks = selectTopRagContextChunks(
      (materiaChunks ?? []) as RagChunkRow[],
      joinedQuery
    );

    const estimatedTokens = estimateExplanationTokens({
      enunciado: candidate.enunciado,
      opciones: candidate.opciones,
      respuestaCorrecta: candidate.respuestaCorrecta,
      context: topChunks,
    });

    totalEstimatedInputTokens += estimatedTokens.input;
    totalEstimatedOutputTokens += estimatedTokens.output;
    coveredMaterias.set(candidate.materiaId, (coveredMaterias.get(candidate.materiaId) ?? 0) + 1);
    const parcialKey = toPartialKey(candidate.materiaId, candidate.parcial);
    coveredParciales.set(parcialKey, (coveredParciales.get(parcialKey) ?? 0) + 1);

    responseCandidates.push({
      preguntaId: candidate.preguntaId,
      materiaId: candidate.materiaId,
      parcial: candidate.parcial,
      priority: candidate.priority,
      estimatedTokens,
    });

    if (dryRun) continue;

    try {
      const generated = await generateTutorExplanation({
        question: candidate.enunciado,
        options: candidate.opciones,
        correctAnswer: candidate.respuestaCorrecta,
        context: topChunks,
      });

      await admin.from('rag_explanations_cache').upsert(
        {
          pregunta_id: candidate.preguntaId,
          materia_id: candidate.materiaId,
          parcial: candidate.parcial,
          explicacion: generated.text,
          provider: generated.provider,
          source_used: topChunks.length > 0 ? 'supabase-rag' : 'general-academic-fallback',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'pregunta_id' }
      );

      await admin.from('rag_generation_logs').insert({
        pregunta_id: candidate.preguntaId,
        materia_id: candidate.materiaId,
        provider: generated.provider,
        status: 'ok',
        metadata: {
          warmup: true,
          partial: candidate.parcial,
          context_chunks: topChunks.length,
          priority: candidate.priority,
          estimated_tokens: estimatedTokens.total,
        },
      });

      generatedCount += 1;
    } catch (error) {
      skippedCount += 1;
      await admin.from('rag_generation_logs').insert({
        pregunta_id: candidate.preguntaId,
        materia_id: candidate.materiaId,
        provider: 'warmup-job',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown warmup error',
        metadata: {
          warmup: true,
          partial: candidate.parcial,
          priority: candidate.priority,
        },
      });
    }
  }

  const materiaIds = Array.from(coveredMaterias.keys());
  const materiaNameMap = new Map<string, string>();
  if (materiaIds.length > 0) {
    const { data: materiaRows } = await admin.from('materias').select('id, nombre').in('id', materiaIds);
    for (const row of materiaRows ?? []) {
      materiaNameMap.set(row.id, row.nombre ?? 'Materia sin nombre');
    }
  }

  return {
    success: true,
    dryRun,
    selectedCount: selected.length,
    generatedCount,
    skippedCount,
    totalEstimatedInputTokens,
    totalEstimatedOutputTokens,
    totalEstimatedTokens: totalEstimatedInputTokens + totalEstimatedOutputTokens,
    candidates: responseCandidates,
    summary: {
      coveredMaterias: Array.from(coveredMaterias.entries())
        .map(([materiaId, questionsCount]) => ({
          materiaId,
          materiaNombre: materiaNameMap.get(materiaId) ?? 'Materia sin nombre',
          questions: questionsCount,
        }))
        .sort((a, b) => b.questions - a.questions),
      coveredParciales: Array.from(coveredParciales.entries())
        .map(([key, questionsCount]) => {
          const [materiaId, parcialValue] = key.split(':');
          return {
            materiaId,
            materiaNombre: materiaNameMap.get(materiaId) ?? 'Materia sin nombre',
            parcial: Number(parcialValue) || 1,
            questions: questionsCount,
          };
        })
        .sort((a, b) => b.questions - a.questions),
    },
  };
}
