import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { logError } from '@/lib/observability';
import { requestGeminiJson, requestGroqJson, requestNvidiaJson } from '@/lib/ai/providers';
import { isolateUntrustedContent, PROMPT_INJECTION_GUARD } from '@/lib/ai/safety';
import { checkDailyLimit, incrementDailyUsage } from '@/lib/ai/daily-limit';

type AdminClient = SupabaseClient<Database>;
type AttemptTopicEventInsert = Database['public']['Tables']['simulator_attempt_topic_events']['Insert'];
type TopicInsert = Database['public']['Tables']['simulator_topics']['Insert'];
type SubtopicInsert = Database['public']['Tables']['simulator_subtopics']['Insert'];
type TopicLinkInsert = Database['public']['Tables']['simulator_question_topic_links']['Insert'];
type PerformanceInsert = Database['public']['Tables']['student_topic_performance']['Insert'];

type QuestionRow = {
  id: string;
  materia_id: string | null;
  parcial: number | null;
  enunciado: string;
  respuesta_correcta: string;
};

type TopicLink = {
  topicId: string;
  subtopicId: string | null;
  title: string;
  subtopicTitle: string;
  source?: string;
};

type AnsweredQuestion = {
  preguntaId: string;
  wasCorrect: boolean;
};

const STOP_WORDS = new Set([
  'acerca',
  'ademas',
  'ante',
  'aquel',
  'aquella',
  'aquello',
  'cada',
  'como',
  'con',
  'cual',
  'cuando',
  'debe',
  'del',
  'desde',
  'donde',
  'entre',
  'esta',
  'este',
  'estos',
  'forma',
  'indica',
  'las',
  'los',
  'mas',
  'para',
  'pero',
  'por',
  'pregunta',
  'que',
  'segun',
  'sobre',
  'son',
  'una',
  'uno',
  'verdadero',
  'falso',
]);

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 96);
}

function toTitle(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 7)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractKeywords(text: string) {
  const words = normalizeKey(text)
    .split(' ')
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word)
    .slice(0, 6);
}

function inferTopic(question: QuestionRow) {
  const questionText = question.enunciado ?? '';
  const answerText = question.respuesta_correcta ?? '';
  const keywordSource = `${questionText} ${answerText}`;
  const keywords = extractKeywords(keywordSource);
  const topicSeed = keywords.slice(0, 3).join(' ') || 'tema general';
  const subtopicSeed = keywords.slice(3, 6).join(' ') || keywords.slice(0, 2).join(' ') || 'aplicacion';

  const topicKey = normalizeKey(topicSeed) || 'tema-general';
  const subtopicKey = normalizeKey(subtopicSeed) || 'aplicacion';

  return {
    topicKey,
    title: topicKey === 'tema-general' ? 'Tema general' : toTitle(topicKey),
    subtopicKey,
    subtopicTitle: subtopicKey === 'aplicacion' ? 'Aplicacion del concepto' : toTitle(subtopicKey),
    confidenceScore: keywords.length >= 4 ? 0.62 : 0.5,
    evidence: {
      keywords,
      inferred_from: 'question-and-answer',
      question_preview: questionText.slice(0, 240),
    } satisfies Json,
  };
}

function parseModelJson(raw: string) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function sanitizeModelLabel(value: unknown, fallback: string) {
  const text = String(value ?? '')
    .replace(/["{}[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 4) return fallback;
  return text.slice(0, 80);
}

function isUsefulAiClassification(value: Record<string, unknown> | null) {
  if (!value) return false;
  const topic = sanitizeModelLabel(value.topic, '');
  const subtopic = sanitizeModelLabel(value.subtopic, '');
  return topic.length >= 4 && subtopic.length >= 4;
}

async function buildClassificationHints(input: {
  admin: AdminClient;
  materiaId: string;
  parcial: number;
}) {
  const [{ data: existingTopics }, { data: summaries }, { data: glossaries }] = await Promise.all([
    input.admin
      .from('simulator_topics')
      .select('title')
      .eq('materia_id', input.materiaId)
      .eq('parcial', input.parcial)
      .order('updated_at', { ascending: false })
      .limit(8),
    input.admin
      .from('student_materials')
      .select('id, title, student_material_summaries(summary_short, key_points, summary_sections)')
      .eq('materia_id', input.materiaId)
      .eq('processing_status', 'ready')
      .order('updated_at', { ascending: false })
      .limit(4),
    input.admin
      .from('student_materials')
      .select('id, title, student_material_glossaries(glossary_items)')
      .eq('materia_id', input.materiaId)
      .eq('processing_status', 'ready')
      .order('updated_at', { ascending: false })
      .limit(4),
  ]);

  const hints: string[] = [];
  const topics = (existingTopics ?? []).map((row) => row.title).filter(Boolean);
  if (topics.length > 0) {
    hints.push(`Temas ya existentes: ${topics.join(' | ')}`);
  }

  const typedSummaries = (summaries ?? []) as Array<{
    id: string | null;
    title: string | null;
    student_material_summaries: Array<Record<string, unknown>> | null;
  }>;
  for (const material of typedSummaries) {
    const summaryRows = Array.isArray(material.student_material_summaries)
      ? material.student_material_summaries
      : [];
    const summary = summaryRows[0];
    if (!summary) continue;

    const keyPoints = Array.isArray(summary.key_points)
      ? summary.key_points.map((point) => String(point ?? '').trim()).filter(Boolean).slice(0, 4)
      : [];
    const shortSummary = String(summary.summary_short ?? '').replace(/\s+/g, ' ').trim();
    const sections = Array.isArray(summary.summary_sections)
      ? summary.summary_sections
          .map((section) => {
            if (!section || typeof section !== 'object' || Array.isArray(section)) return '';
            const title = 'title' in section ? String(section.title ?? '').trim() : '';
            return title;
          })
          .filter(Boolean)
          .slice(0, 5)
      : [];

    hints.push(
      [
        `Material: ${material.title}`,
        shortSummary ? `Resumen: ${shortSummary.slice(0, 360)}` : '',
        keyPoints.length ? `Puntos: ${keyPoints.join(' | ')}` : '',
        sections.length ? `Secciones: ${sections.join(' | ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  const typedGlossaries = (glossaries ?? []) as Array<{
    id: string | null;
    title: string | null;
    student_material_glossaries: Array<Record<string, unknown>> | null;
  }>;
  for (const material of typedGlossaries) {
    const glossaryRows = Array.isArray(material.student_material_glossaries)
      ? material.student_material_glossaries
      : [];
    const glossary = glossaryRows[0];
    const items = Array.isArray(glossary?.glossary_items)
      ? glossary.glossary_items
          .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
            const term = 'term' in item ? String(item.term ?? '').trim() : '';
            const definition = 'definition' in item ? String(item.definition ?? '').trim() : '';
            if (!term || !definition) return '';
            return `${term}: ${definition.slice(0, 120)}`;
          })
          .filter(Boolean)
          .slice(0, 8)
      : [];

    if (items.length > 0) {
      hints.push(`Glosario de ${material.title}: ${items.join(' | ')}`);
    }
  }

  return hints.join('\n\n').slice(0, 2600);
}

async function classifyTopicWithAi(input: {
  admin: AdminClient;
  question: QuestionRow;
  materiaId: string;
  parcial: number;
  hints?: string;
}) {
  const hints = input.hints ?? (await buildClassificationHints(input));
  const prompt = [
    'Clasifica esta pregunta de simulador universitario en un tema y subtema academico.',
    'Usa nombres cortos, claros y reutilizables. No inventes contenido externo.',
    'Si hay temas existentes, reutiliza el mas cercano.',
    'Devuelve solo JSON valido con estas claves: topic, subtopic, confidence, rationale, keywords.',
    PROMPT_INJECTION_GUARD,
    '',
    `Pregunta: ${isolateUntrustedContent(input.question.enunciado)}`,
    `Respuesta correcta: ${isolateUntrustedContent(input.question.respuesta_correcta)}`,
    '',
    hints
      ? `Contexto de materiales de la materia:\n${isolateUntrustedContent(hints)}`
      : 'Contexto de materiales de la materia: no disponible.',
  ].join('\n');

  const system = 'Sos un clasificador academico. Respondés únicamente JSON valido, breve y verificable.';
  const responseSchema = {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      subtopic: { type: 'string' },
      confidence: { type: 'number' },
      rationale: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
    },
    required: ['topic', 'subtopic', 'confidence', 'rationale', 'keywords'],
  };

  const providers = [
    async () => requestGroqJson({ prompt, system, temperature: 0.1, maxTokens: 220 }),
    async () => requestNvidiaJson({ prompt, system, temperature: 0.1, maxTokens: 220 }),
    async () => requestGeminiJson({ prompt, temperature: 0.1, maxOutputTokens: 220, responseSchema }),
  ];

  for (const requestProvider of providers) {
    try {
      const result = await requestProvider();
      if (!result?.content) continue;

      const parsed = parseModelJson(result.content);
      if (!isUsefulAiClassification(parsed)) continue;

      const confidence = Number(parsed?.confidence);
      const topic = sanitizeModelLabel(parsed?.topic, 'Tema general');
      const subtopic = sanitizeModelLabel(parsed?.subtopic, 'Aplicacion del concepto');
      const keywords = Array.isArray(parsed?.keywords)
        ? parsed.keywords.map((keyword) => String(keyword ?? '').trim()).filter(Boolean).slice(0, 8)
        : [];

      return {
        topicKey: normalizeKey(topic) || 'tema-general',
        title: topic,
        subtopicKey: normalizeKey(subtopic) || 'aplicacion',
        subtopicTitle: subtopic,
        confidenceScore: Number.isFinite(confidence) ? Math.max(0.5, Math.min(0.95, confidence)) : 0.78,
        source: `ai-classification:${result.model}`,
        evidence: {
          provider: result.model,
          rationale: sanitizeModelLabel(parsed?.rationale, 'Clasificacion generada desde pregunta y materiales.'),
          keywords,
          used_material_hints: Boolean(hints),
          question_preview: input.question.enunciado.slice(0, 240),
        } satisfies Json,
      };
    } catch (error) {
      logError('simulatorTopicMemory.aiClassification', error, {
        preguntaId: input.question.id,
        materiaId: input.materiaId,
        parcial: input.parcial,
      });
    }
  }

  return null;
}

async function getOrCreateQuestionTopicLinks(input: {
  admin: AdminClient;
  questions: QuestionRow[];
  defaultMateriaId: string;
  defaultParcial: number;
  answerMap: Map<string, AnsweredQuestion>;
  userId: string;
}): Promise<Map<string, TopicLink>> {
  const result = new Map<string, TopicLink>();
  if (input.questions.length === 0) return result;

  const questionIds = input.questions.map((question) => question.id);

  const { data: existingLinks, error: existingLinksError } = await input.admin
    .from('simulator_question_topic_links')
    .select('pregunta_id, topic_id, subtopic_id')
    .in('pregunta_id', questionIds);

  if (existingLinksError) {
    throw existingLinksError;
  }

  const linkByQuestionId = new Map<string, { topic_id: string; subtopic_id: string | null }>();
  const linkedTopicIds = new Set<string>();
  const linkedSubtopicIds = new Set<string>();
  for (const link of existingLinks ?? []) {
    linkByQuestionId.set(link.pregunta_id, {
      topic_id: link.topic_id,
      subtopic_id: link.subtopic_id ?? null,
    });
    linkedTopicIds.add(link.topic_id);
    if (link.subtopic_id) linkedSubtopicIds.add(link.subtopic_id);
  }

  const topicTitles = new Map<string, string>();
  const subtopicTitles = new Map<string, string>();

  if (linkedTopicIds.size > 0) {
    const { data: topics, error: topicsError } = await input.admin
      .from('simulator_topics')
      .select('id, title')
      .in('id', [...linkedTopicIds]);
    if (topicsError) {
      throw topicsError;
    }
    for (const topic of topics ?? []) {
      topicTitles.set(topic.id, topic.title);
    }
  }

  if (linkedSubtopicIds.size > 0) {
    const { data: subtopics, error: subtopicsError } = await input.admin
      .from('simulator_subtopics')
      .select('id, title')
      .in('id', [...linkedSubtopicIds]);
    if (subtopicsError) {
      throw subtopicsError;
    }
    for (const subtopic of subtopics ?? []) {
      subtopicTitles.set(subtopic.id, subtopic.title);
    }
  }

  for (const question of input.questions) {
    const existingLink = linkByQuestionId.get(question.id);
    if (existingLink?.topic_id) {
      result.set(question.id, {
        topicId: existingLink.topic_id,
        subtopicId: existingLink.subtopic_id ?? null,
        title: topicTitles.get(existingLink.topic_id) ?? 'Tema detectado',
        subtopicTitle: existingLink.subtopic_id
          ? subtopicTitles.get(existingLink.subtopic_id) ?? 'Subtema detectado'
          : 'Subtema detectado',
        source: 'cache',
      });
    }
  }

  const unlinkedQuestions = input.questions.filter((question) => !result.has(question.id));
  if (unlinkedQuestions.length === 0) return result;

  const hintCache = new Map<string, string>();

  const classifications: Array<{
    question: QuestionRow;
    materiaId: string;
    parcial: number;
    topicKey: string;
    title: string;
    subtopicKey: string;
    subtopicTitle: string;
    confidenceScore: number;
    source: string;
    evidence: Json;
  }> = [];

  let dailyLimitReached = false;

  for (const question of unlinkedQuestions) {
    const answer = input.answerMap.get(question.id);
    if (!answer) continue;

    const materiaId = question.materia_id ?? input.defaultMateriaId;
    const parcial = question.parcial ?? input.defaultParcial;
    const useAi = !answer.wasCorrect && !dailyLimitReached;
    const hintKey = `${materiaId}:${parcial}`;

    // Check daily AI limit before each classification (skip if already exceeded).
    if (useAi && input.userId) {
      const limit = await checkDailyLimit(input.userId);
      if (!limit.allowed) {
        dailyLimitReached = true;
      }
    }

    if (useAi && !hintCache.has(hintKey)) {
      hintCache.set(
        hintKey,
        await buildClassificationHints({ admin: input.admin, materiaId, parcial })
      );
    }

    const aiResult = useAi
      ? await classifyTopicWithAi({
          admin: input.admin,
          question,
          materiaId,
          parcial,
          hints: hintCache.get(hintKey),
        })
      : null;

    // Increment daily usage after a successful AI classification.
    if (aiResult && input.userId) {
      await incrementDailyUsage(input.userId);
    }

    const inferred = aiResult ?? inferTopic(question);

    classifications.push({
      question,
      materiaId,
      parcial,
      topicKey: inferred.topicKey,
      title: inferred.title,
      subtopicKey: inferred.subtopicKey,
      subtopicTitle: inferred.subtopicTitle,
      confidenceScore: inferred.confidenceScore,
      source: 'source' in inferred ? inferred.source : 'local-inference',
      evidence: inferred.evidence,
    });
  }

  if (classifications.length === 0) return result;

  const now = new Date().toISOString();

  const topicUpserts = new Map<string, TopicInsert>();
  for (const classification of classifications) {
    const key = `${classification.materiaId}:${classification.parcial}:${classification.topicKey}`;
    if (!topicUpserts.has(key)) {
      topicUpserts.set(key, {
        materia_id: classification.materiaId,
        parcial: classification.parcial,
        topic_key: classification.topicKey,
        title: classification.title,
        description: 'Tema inferido automaticamente desde una pregunta del simulador.',
        source: classification.source,
        updated_at: now,
      });
    }
  }

  const topicIdByKey = new Map<string, string>();
  if (topicUpserts.size > 0) {
    const { data: upsertedTopics, error: topicsError } = await input.admin
      .from('simulator_topics')
      .upsert([...topicUpserts.values()], { onConflict: 'materia_id,parcial,topic_key' })
      .select('id, materia_id, parcial, topic_key');
    if (topicsError) {
      throw topicsError;
    }
    for (const topic of upsertedTopics ?? []) {
      topicIdByKey.set(`${topic.materia_id}:${topic.parcial}:${topic.topic_key}`, topic.id);
    }
  }

  const subtopicUpserts = new Map<string, SubtopicInsert>();
  for (const classification of classifications) {
    const topicId = topicIdByKey.get(
      `${classification.materiaId}:${classification.parcial}:${classification.topicKey}`
    );
    if (!topicId) continue;
    const key = `${topicId}:${classification.subtopicKey}`;
    if (!subtopicUpserts.has(key)) {
      subtopicUpserts.set(key, {
        topic_id: topicId,
        subtopic_key: classification.subtopicKey,
        title: classification.subtopicTitle,
        description: 'Subtema inferido automaticamente desde una pregunta del simulador.',
        source: classification.source,
        updated_at: now,
      });
    }
  }

  const subtopicIdByKey = new Map<string, string>();
  if (subtopicUpserts.size > 0) {
    const { data: upsertedSubtopics, error: subtopicsError } = await input.admin
      .from('simulator_subtopics')
      .upsert([...subtopicUpserts.values()], { onConflict: 'topic_id,subtopic_key' })
      .select('id, topic_id, subtopic_key');
    if (subtopicsError) {
      throw subtopicsError;
    }
    for (const subtopic of upsertedSubtopics ?? []) {
      subtopicIdByKey.set(`${subtopic.topic_id}:${subtopic.subtopic_key}`, subtopic.id);
    }
  }

  const linkUpserts: TopicLinkInsert[] = [];
  for (const classification of classifications) {
    const topicId = topicIdByKey.get(
      `${classification.materiaId}:${classification.parcial}:${classification.topicKey}`
    );
    const subtopicId = topicId
      ? subtopicIdByKey.get(`${topicId}:${classification.subtopicKey}`)
      : undefined;
    if (!topicId) continue;

    linkUpserts.push({
      pregunta_id: classification.question.id,
      materia_id: classification.materiaId,
      parcial: classification.parcial,
      topic_id: topicId,
      subtopic_id: subtopicId ?? null,
      confidence_score: classification.confidenceScore,
      source: classification.source,
      evidence: classification.evidence,
      updated_at: now,
    });

    result.set(classification.question.id, {
      topicId,
      subtopicId: subtopicId ?? null,
      title: classification.title,
      subtopicTitle: classification.subtopicTitle,
      source: classification.source,
    });
  }

  if (linkUpserts.length > 0) {
    const { error: linkError } = await input.admin
      .from('simulator_question_topic_links')
      .upsert(linkUpserts, { onConflict: 'pregunta_id' });
    if (linkError) {
      throw linkError;
    }
  }

  return result;
}

async function updateStudentTopicPerformanceBatch(input: {
  admin: AdminClient;
  userId: string;
  entries: Array<{
    materiaId: string;
    parcial: number;
    topicId: string;
    subtopicId: string | null;
    wasCorrect: boolean;
  }>;
}) {
  if (input.entries.length === 0) return;

  const scopeTotals = new Map<
    string,
    { materiaId: string; parcial: number; topicId: string; subtopicId: string | null; correct: number; wrong: number }
  >();
  for (const entry of input.entries) {
    const key = `${entry.materiaId}:${entry.parcial}:${entry.topicId}:${entry.subtopicId ?? 'null'}`;
    const current = scopeTotals.get(key);
    if (current) {
      if (entry.wasCorrect) current.correct += 1;
      else current.wrong += 1;
    } else {
      scopeTotals.set(key, {
        materiaId: entry.materiaId,
        parcial: entry.parcial,
        topicId: entry.topicId,
        subtopicId: entry.subtopicId,
        correct: entry.wasCorrect ? 1 : 0,
        wrong: entry.wasCorrect ? 0 : 1,
      });
    }
  }

  const scopes = [...scopeTotals.values()];
  const topicIds = [...new Set(scopes.map((scope) => scope.topicId))];

  const existingByScope = new Map<string, { id: string; attempts_count: number; correct_count: number; wrong_count: number }>();

  if (topicIds.length > 0) {
    const { data: existingRows, error: existingError } = await input.admin
      .from('student_topic_performance')
      .select('id, user_id, materia_id, parcial, topic_id, subtopic_id, attempts_count, correct_count, wrong_count')
      .eq('user_id', input.userId)
      .in('topic_id', topicIds);
    if (existingError) {
      throw existingError;
    }
    for (const row of existingRows ?? []) {
      const key = `${row.materia_id}:${row.parcial}:${row.topic_id}:${row.subtopic_id ?? 'null'}`;
      existingByScope.set(key, {
        id: row.id,
        attempts_count: row.attempts_count ?? 0,
        correct_count: row.correct_count ?? 0,
        wrong_count: row.wrong_count ?? 0,
      });
    }
  }

  const now = new Date().toISOString();
  const upserts: PerformanceInsert[] = [];

  for (const scope of scopes) {
    const key = `${scope.materiaId}:${scope.parcial}:${scope.topicId}:${scope.subtopicId ?? 'null'}`;
    const current = existingByScope.get(key);
    const attemptsCount = (current?.attempts_count ?? 0) + scope.correct + scope.wrong;
    const correctCount = (current?.correct_count ?? 0) + scope.correct;
    const wrongCount = (current?.wrong_count ?? 0) + scope.wrong;
    const masteryScore = attemptsCount > 0 ? Math.round((correctCount / attemptsCount) * 10000) / 100 : 0;

    const payload: PerformanceInsert = {
      user_id: input.userId,
      materia_id: scope.materiaId,
      parcial: scope.parcial,
      topic_id: scope.topicId,
      subtopic_id: scope.subtopicId,
      attempts_count: attemptsCount,
      correct_count: correctCount,
      wrong_count: wrongCount,
      mastery_score: masteryScore,
      last_answer_at: now,
      last_wrong_at: scope.wrong > 0 ? now : (current ? undefined : null),
      updated_at: now,
    };

    if (current?.id) {
      payload.id = current.id;
    }

    upserts.push(payload);
  }

  if (upserts.length > 0) {
    const { error: upsertError } = await input.admin
      .from('student_topic_performance')
      .upsert(upserts, { onConflict: 'id' });
    if (upsertError) {
      throw upsertError;
    }
  }
}

export async function recordSimulatorTopicMemory(input: {
  admin: AdminClient;
  userId: string;
  materiaId: string;
  parcial: number;
  attemptId: string;
  answeredQuestions: AnsweredQuestion[];
}) {
  const uniqueAnswers = new Map<string, AnsweredQuestion>();
  for (const answer of input.answeredQuestions) {
    if (answer.preguntaId) {
      uniqueAnswers.set(answer.preguntaId, answer);
    }
  }

  const answers = [...uniqueAnswers.values()];
  if (answers.length === 0) {
    return { processed: 0, linked: 0 };
  }

  const { data: questions, error: questionsError } = await input.admin
    .from('preguntas_banco')
    .select('id, materia_id, parcial, enunciado, respuesta_correcta')
    .in(
      'id',
      answers.map((answer) => answer.preguntaId)
    );

  if (questionsError) {
    throw questionsError;
  }

  const questionRows = (questions ?? []) as QuestionRow[];
  if (questionRows.length === 0) {
    return { processed: answers.length, linked: 0 };
  }

  const topicLinks = await getOrCreateQuestionTopicLinks({
    admin: input.admin,
    questions: questionRows,
    defaultMateriaId: input.materiaId,
    defaultParcial: input.parcial,
    answerMap: uniqueAnswers,
    userId: input.userId,
  });

  const performanceEntries: Array<{
    materiaId: string;
    parcial: number;
    topicId: string;
    subtopicId: string | null;
    wasCorrect: boolean;
  }> = [];

  const events: AttemptTopicEventInsert[] = [];

  for (const question of questionRows) {
    const answer = uniqueAnswers.get(question.id);
    if (!answer) continue;

    const topicLink = topicLinks.get(question.id);
    if (!topicLink) continue;

    const materiaId = question.materia_id ?? input.materiaId;
    const parcial = question.parcial ?? input.parcial;

    performanceEntries.push({
      materiaId,
      parcial,
      topicId: topicLink.topicId,
      subtopicId: topicLink.subtopicId,
      wasCorrect: answer.wasCorrect,
    });

    events.push({
      attempt_id: input.attemptId,
      user_id: input.userId,
      materia_id: materiaId,
      parcial,
      pregunta_id: question.id,
      topic_id: topicLink.topicId,
      subtopic_id: topicLink.subtopicId,
      was_correct: answer.wasCorrect,
    });
  }

  await updateStudentTopicPerformanceBatch({
    admin: input.admin,
    userId: input.userId,
    entries: performanceEntries,
  });

  if (events.length > 0) {
    const { error: eventError } = await input.admin.from('simulator_attempt_topic_events').insert(events);
    if (eventError) {
      throw eventError;
    }
  }

  return { processed: answers.length, linked: events.length };
}

export async function safeRecordSimulatorTopicMemory(input: Parameters<typeof recordSimulatorTopicMemory>[0]) {
  try {
    return await recordSimulatorTopicMemory(input);
  } catch (error) {
    logError('simulatorTopicMemory.record', error, {
      userId: input.userId,
      materiaId: input.materiaId,
      parcial: input.parcial,
      attemptId: input.attemptId,
    });
    return { processed: 0, linked: 0 };
  }
}
