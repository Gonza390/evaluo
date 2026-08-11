import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { logError } from '@/lib/observability';
import { requestGeminiJson, requestGitHubModelsJson, requestGroqJson } from '@/lib/student-materials/providers';

type AdminClient = SupabaseClient<Database>;
type AttemptTopicEventInsert = Database['public']['Tables']['simulator_attempt_topic_events']['Insert'];

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
  question: QuestionRow;
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
}) {
  const hints = await buildClassificationHints(input);
  const prompt = [
    'Clasifica esta pregunta de simulador universitario en un tema y subtema academico.',
    'Usa nombres cortos, claros y reutilizables. No inventes contenido externo.',
    'Si hay temas existentes, reutiliza el mas cercano.',
    'Devuelve solo JSON valido con estas claves: topic, subtopic, confidence, rationale, keywords.',
    '',
    `Pregunta: ${input.question.enunciado}`,
    `Respuesta correcta: ${input.question.respuesta_correcta}`,
    '',
    hints ? `Contexto de materiales de la materia:\n${hints}` : 'Contexto de materiales de la materia: no disponible.',
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
    async () => requestGitHubModelsJson({ prompt, system, temperature: 0.1, maxTokens: 220 }),
    async () => requestGroqJson({ prompt, system, temperature: 0.1, maxTokens: 220 }),
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

async function getOrCreateQuestionTopicLink(input: {
  admin: AdminClient;
  question: QuestionRow;
  materiaId: string;
  parcial: number;
  useAi?: boolean;
}): Promise<TopicLink | null> {
  const { data: existingLink, error: existingError } = await input.admin
    .from('simulator_question_topic_links')
    .select('topic_id, subtopic_id')
    .eq('pregunta_id', input.question.id)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existingLink?.topic_id) {
    const [{ data: topic }, { data: subtopic }] = await Promise.all([
      input.admin.from('simulator_topics').select('title').eq('id', existingLink.topic_id).maybeSingle(),
      existingLink.subtopic_id
        ? input.admin.from('simulator_subtopics').select('title').eq('id', existingLink.subtopic_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      topicId: existingLink.topic_id,
      subtopicId: existingLink.subtopic_id ?? null,
      title: topic?.title ?? 'Tema detectado',
      subtopicTitle: subtopic?.title ?? 'Subtema detectado',
      source: 'cache',
    };
  }

  const inferred =
    input.useAi
      ? (await classifyTopicWithAi(input)) ?? inferTopic(input.question)
      : inferTopic(input.question);
  const source = 'source' in inferred ? inferred.source : 'local-inference';

  const { data: topicRow, error: topicError } = await input.admin
    .from('simulator_topics')
    .upsert(
      {
        materia_id: input.materiaId,
        parcial: input.parcial,
        topic_key: inferred.topicKey,
        title: inferred.title,
        description: 'Tema inferido automaticamente desde una pregunta del simulador.',
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'materia_id,parcial,topic_key' }
    )
    .select('id, title')
    .single();

  if (topicError || !topicRow?.id) {
    throw topicError ?? new Error('No se pudo crear el tema del simulador.');
  }

  const { data: subtopicRow, error: subtopicError } = await input.admin
    .from('simulator_subtopics')
    .upsert(
      {
        topic_id: topicRow.id,
        subtopic_key: inferred.subtopicKey,
        title: inferred.subtopicTitle,
        description: 'Subtema inferido automaticamente desde una pregunta del simulador.',
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'topic_id,subtopic_key' }
    )
    .select('id, title')
    .single();

  if (subtopicError || !subtopicRow?.id) {
    throw subtopicError ?? new Error('No se pudo crear el subtema del simulador.');
  }

  const { error: linkError } = await input.admin.from('simulator_question_topic_links').upsert(
    {
      pregunta_id: input.question.id,
      materia_id: input.materiaId,
      parcial: input.parcial,
      topic_id: topicRow.id,
      subtopic_id: subtopicRow.id,
      confidence_score: inferred.confidenceScore,
      source,
      evidence: inferred.evidence,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'pregunta_id' }
  );

  if (linkError) {
    throw linkError;
  }

  return {
    topicId: topicRow.id,
    subtopicId: subtopicRow.id,
    title: topicRow.title,
    subtopicTitle: subtopicRow.title,
    source,
  };
}

async function updateStudentTopicPerformance(input: {
  admin: AdminClient;
  userId: string;
  materiaId: string;
  parcial: number;
  topicId: string;
  subtopicId: string | null;
  wasCorrect: boolean;
}) {
  const now = new Date().toISOString();
  const query = input.admin
    .from('student_topic_performance')
    .select('id, attempts_count, correct_count, wrong_count')
    .eq('user_id', input.userId)
    .eq('materia_id', input.materiaId)
    .eq('parcial', input.parcial)
    .eq('topic_id', input.topicId);

  const scopedQuery = input.subtopicId
    ? query.eq('subtopic_id', input.subtopicId)
    : query.is('subtopic_id', null);

  const { data: current, error } = await scopedQuery.maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const attemptsCount = (current?.attempts_count ?? 0) + 1;
  const correctCount = (current?.correct_count ?? 0) + (input.wasCorrect ? 1 : 0);
  const wrongCount = (current?.wrong_count ?? 0) + (input.wasCorrect ? 0 : 1);
  const masteryScore = attemptsCount > 0 ? Math.round((correctCount / attemptsCount) * 10000) / 100 : 0;

  if (current?.id) {
    const updatePayload: Database['public']['Tables']['student_topic_performance']['Update'] = {
      attempts_count: attemptsCount,
      correct_count: correctCount,
      wrong_count: wrongCount,
      mastery_score: masteryScore,
      last_answer_at: now,
      updated_at: now,
    };

    if (!input.wasCorrect) {
      updatePayload.last_wrong_at = now;
    }

    const { error: updateError } = await input.admin
      .from('student_topic_performance')
      .update(updatePayload)
      .eq('id', current.id);

    if (updateError) {
      throw updateError;
    }
    return;
  }

  const { error: insertError } = await input.admin.from('student_topic_performance').insert({
    user_id: input.userId,
    materia_id: input.materiaId,
    parcial: input.parcial,
    topic_id: input.topicId,
    subtopic_id: input.subtopicId,
    attempts_count: attemptsCount,
    correct_count: correctCount,
    wrong_count: wrongCount,
    mastery_score: masteryScore,
    last_answer_at: now,
    last_wrong_at: input.wasCorrect ? null : now,
    updated_at: now,
  });

  if (insertError) {
    throw insertError;
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

  const answerMap = new Map(answers.map((answer) => [answer.preguntaId, answer]));
  const events: AttemptTopicEventInsert[] = [];
  let linked = 0;

  for (const question of (questions ?? []) as QuestionRow[]) {
    const answer = answerMap.get(question.id);
    if (!answer) continue;

    const topicLink = await getOrCreateQuestionTopicLink({
      admin: input.admin,
      question,
      materiaId: question.materia_id ?? input.materiaId,
      parcial: question.parcial ?? input.parcial,
      useAi: !answer.wasCorrect,
    });

    if (!topicLink) continue;

    await updateStudentTopicPerformance({
      admin: input.admin,
      userId: input.userId,
      materiaId: question.materia_id ?? input.materiaId,
      parcial: question.parcial ?? input.parcial,
      topicId: topicLink.topicId,
      subtopicId: topicLink.subtopicId,
      wasCorrect: answer.wasCorrect,
    });

    events.push({
      attempt_id: input.attemptId,
      user_id: input.userId,
      materia_id: question.materia_id ?? input.materiaId,
      parcial: question.parcial ?? input.parcial,
      pregunta_id: question.id,
      topic_id: topicLink.topicId,
      subtopic_id: topicLink.subtopicId,
      was_correct: answer.wasCorrect,
    });
    linked += 1;
  }

  if (events.length > 0) {
    const { error: eventError } = await input.admin.from('simulator_attempt_topic_events').insert(events);
    if (eventError) {
      throw eventError;
    }
  }

  return { processed: answers.length, linked };
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
