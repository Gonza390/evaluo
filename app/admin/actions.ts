'use server';

import pdf from 'pdf-parse-fork';
import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { generateTutorExplanation } from '@/lib/ai-tutor';

export interface ProcessResult {
  success: boolean;
  count?: number;
  duplicates?: number;
  invalid?: number;
  message: string;
}

export interface CleanResult {
  success: boolean;
  deletedCount?: number;
  message: string;
}

export interface IARankingRow {
  pregunta_id: string;
  materia_id: string | null;
  enunciado: string;
  veces_fallada: number;
  explicacion: string | null;
  provider: string | null;
  updated_at: string | null;
}

export interface AdminAnalyticsStats {
  dau: number;
  registered: { day: number; week: number; month: number };
  conversion: {
    sessions_total: number;
    reached_explorar: number;
    reached_carrera: number;
    reached_materia: number;
    reached_simulador: number;
    top_abandon_stage: string;
    top_login_source: string;
  };
  interaction: {
    avg_minutes_per_session: number;
    total_hours_last_7d: number;
  };
  top_pages: Array<{ path: string; views: number }>;
  devices: { desktop: number; mobile: number };
  errors: { total: number; top_paths: Array<{ path: string; count: number }> };
}

export interface DuplicateCandidate {
  normalized_name: string;
  materia_id: string | null;
  count: number;
  recursos: Array<{ id: string; nombre: string; url_archivo: string | null; paginas: number | null }>;
}

export interface QuestionEditorRow {
  id: string;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
  parcial: number | null;
  dificultad: string | null;
  tasa_acierto: number | null;
}

export interface FeedbackReviewItem {
  pregunta_id: string;
  enunciado: string;
  voto: number;
  created_at: string;
  explicacion: string | null;
  provider: string | null;
}

export interface AdminUserItem {
  id: string;
  email: string;
  estado: 'activo' | 'inactivo';
  plan: 'free' | 'premium';
  role: 'admin' | 'student';
  last_sign_in_at: string | null;
  created_at: string | null;
}

export interface SystemHealthStats {
  total_errors: number;
  avg_latency_ms: number;
  failures_by_path: Array<{ path: string; count: number }>;
}

export interface FileMaintenanceResult {
  orphan_count: number;
  orphan_sample: string[];
}

export interface MonetizacionStats {
  totalSuscripciones: number;
  activas: number;
  canceladas: number;
  ingresoMensualEstimadoArs: number;
  planes: Array<{
    id: string;
    code: string;
    name: string;
    price_ars: number;
    interval: string;
    is_active: boolean;
  }>;
}

export interface MateriaImportEntryInput {
  materia: string;
  carreras: string[];
}

export interface MateriaImportResult {
  success: boolean;
  message: string;
  carrerasCreated?: number;
  materiasCreated?: number;
  materiasReused?: number;
  relacionesCreated?: number;
  filasProcesadas?: number;
  carrerasNoEncontradas?: string[];
  materiasSinCarrerasValidas?: string[];
}

function normalizeAdminText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\blic\.?\s+en\b/g, 'licenciatura en')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ');
}

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

export interface GlobalQuestionRankingRow {
  pregunta_id: string;
  enunciado: string;
  parcial: number | null;
  respuestas_totales: number;
  respuestas_correctas: number;
  respuestas_incorrectas: number;
  tasa_acierto: number;
}

type UserSubscriptionPlanRow = {
  user_id: string;
  status: string;
  started_at: string;
  plan_id: string;
};

type UserSubscriptionMonetizationRow = {
  status: string;
  amount_ars: number | null;
  plan_id: string;
};

type QuestionRecord = {
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
};

const GENERIC_DISTRACTORS = new Set([
  'ninguna opciÃ³n es correcta',
  'todas son correctas',
  'ninguna de las anteriores',
  'todas las anteriores',
]);

function normalizeQuestion(question: string) {
  return question.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeOptionValue(value: string) {
  return normalizeQuestion(
    value
      .replace(/^[a-dA-D][\).:\-]\s*/, '')
      .replace(/^\d+[\).:\-]\s*/, '')
      .trim()
  );
}

function buildQuestionFingerprint(question: QuestionRecord) {
  const enunciado = normalizeQuestion(question.enunciado);
  const respuestaCorrecta = normalizeOptionValue(question.respuesta_correcta);
  const opciones = dedupeOptions(question.opciones)
    .map((option) => normalizeOptionValue(option))
    .filter(Boolean)
    .sort()
    .join('|');

  return `${enunciado}::${respuestaCorrecta}::${opciones}`;
}

function dedupeOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const option of options) {
    const clean = option.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    const key = normalizeQuestion(clean);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
  }
  return unique;
}

function extractQuestionsFallbackFromText(text: string): QuestionRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results: QuestionRecord[] = [];
  let current: { enunciado: string; opciones: string[] } | null = null;

  const questionRegex = /^(\d+[\).:-]\s+|pregunta\s+\d+[:.-]?\s*)(.+)$/i;
  const optionRegex = /^[a-dA-D][\).:-]\s+(.+)$/;
  const qaBulletRegex = /^[•▪\-]\s*(¿.+?\?)\s*:?\s*(.+)$/;

  for (const line of lines) {
    const questionMatch = line.match(questionRegex);
    const optionMatch = line.match(optionRegex);
    const qaBulletMatch = line.match(qaBulletRegex);

    if (qaBulletMatch) {
      const q = qaBulletMatch[1].trim();
      const answer = qaBulletMatch[2].trim();
      if (q && answer) {
        results.push({
          enunciado: q,
          opciones: [answer],
          respuesta_correcta: answer,
        });
      }
      continue;
    }

    if (questionMatch) {
      if (current && current.opciones.length >= 2) {
        results.push({
          enunciado: current.enunciado,
          opciones: current.opciones.slice(0, 4),
          respuesta_correcta: current.opciones[0],
        });
      }
      current = { enunciado: questionMatch[2].trim(), opciones: [] };
      continue;
    }

    if (optionMatch && current) {
      current.opciones.push(optionMatch[1].trim());
      continue;
    }
  }

  if (current && current.opciones.length >= 2) {
    results.push({
      enunciado: current.enunciado,
      opciones: current.opciones.slice(0, 4),
      respuesta_correcta: current.opciones[0],
    });
  }

  return results;
}

function extractOrderedOptionsQuestionsFromText(text: string): QuestionRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const questions: QuestionRecord[] = [];
  let i = 0;

  const cleanOptionPrefix = (value: string) =>
    value
      .replace(/^[a-dA-D][\).:\-]\s*/, '')
      .replace(/^\d+[\).:\-]\s*/, '')
      .replace(/^[•▪\-]\s*/, '')
      .trim();

  while (i < lines.length) {
    const line = lines[i];
    const isQuestion =
      /^(\d+[\).:\-]\s*)?¿.+\?$/.test(line) ||
      /^(\d+[\).:\-]\s*)?.+\?$/.test(line) ||
      /^pregunta\s+\d+[:.\-]?\s*/i.test(line);

    if (!isQuestion) {
      i += 1;
      continue;
    }

    const enunciado = line
      .replace(/^pregunta\s+\d+[:.\-]?\s*/i, '')
      .replace(/^\d+[\).:\-]\s*/, '')
      .trim();

    const opciones: string[] = [];
    let j = i + 1;

    while (j < lines.length && opciones.length < 4) {
      const candidate = lines[j];
      const normalized = cleanOptionPrefix(candidate);

      if (!normalized) {
        j += 1;
        continue;
      }

      const candidateIsQuestion =
        /^(\d+[\).:\-]\s*)?¿.+\?$/.test(candidate) ||
        /^(\d+[\).:\-]\s*)?.+\?$/.test(candidate) ||
        /^pregunta\s+\d+[:.\-]?\s*/i.test(candidate);
      if (candidateIsQuestion) break;

      opciones.push(normalized);
      j += 1;
    }

    if (enunciado && opciones.length >= 2) {
      const uniqueOptions = dedupeOptions(opciones).slice(0, 4);
      if (uniqueOptions.length < 2) {
        i = j;
        continue;
      }
      questions.push({
        enunciado,
        opciones: uniqueOptions,
        respuesta_correcta: uniqueOptions[0],
      });
      i = j;
      continue;
    }

    i += 1;
  }

  return questions;
}

function extractCandidateAnswersFromSource(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const answers: string[] = [];

  for (const line of lines) {
    const match = line.match(/^[•▪\-]\s*¿.+?\?\s*:?\s*(.+)$/);
    if (match?.[1]) {
      answers.push(match[1].trim());
    }
  }

  return answers;
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseQuestionsFromXlsxBuffer(buffer: Buffer): QuestionRecord[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const xlsx = require('xlsx') as {
    read: (data: Buffer, options: { type: 'buffer' }) => {
      SheetNames: string[];
      Sheets: Record<string, unknown>;
    };
    utils: { sheet_to_json: (sheet: unknown, options: { defval: string }) => Array<Record<string, unknown>> };
  };

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  const questions: QuestionRecord[] = [];

  for (const row of rows) {
    const enunciado = normalizeCellValue(row.pregunta);
    const respuestaCorrecta = normalizeCellValue(row.respuesta_correcta);

    const optionKeys = ['opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'opcion_e', 'opcion_f'];
    let opciones = optionKeys.map((key) => normalizeCellValue(row[key])).filter(Boolean);

    if (opciones.length === 0) {
      const incorrectasRaw = normalizeCellValue(row.respuestas_incorrectas);
      const incorrectas = incorrectasRaw
        ? incorrectasRaw.split('|').map((part) => normalizeCellValue(part)).filter(Boolean)
        : [];
      opciones = [respuestaCorrecta, ...incorrectas].filter(Boolean);
    }

    const opcionesUnicas = dedupeOptions(opciones).slice(0, 6);
    if (!enunciado || !respuestaCorrecta || opcionesUnicas.length < 2) continue;

    const tieneCorrecta = opcionesUnicas.some(
      (opt) => normalizeQuestion(opt) === normalizeQuestion(respuestaCorrecta)
    );
    const finalOpciones = tieneCorrecta ? opcionesUnicas : [respuestaCorrecta, ...opcionesUnicas].slice(0, 6);

    questions.push({
      enunciado,
      opciones: finalOpciones,
      respuesta_correcta: respuestaCorrecta,
    });
  }

  return questions;
}

function buildPlausibleDistractors(correct: string, answerPool: string[]): string[] {
  const correctNorm = normalizeQuestion(correct);
  const uniquePool = Array.from(
    new Set(
      answerPool
        .map((value) => value.replace(/\s+/g, ' ').trim())
        .filter((value) => value.length > 0 && normalizeQuestion(value) !== correctNorm)
    )
  );

  const chosen = uniquePool.slice(0, 3);
  if (chosen.length >= 3) return chosen;

  const parts = correct.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    chosen.push(`${parts[0]} y contexto social`);
    chosen.push(`${parts[0]}, ingresos y empleo`);
  } else {
    chosen.push(`Marco teorico relacionado con ${correct}`);
    chosen.push(`Aplicacion parcial de ${correct}`);
  }
  chosen.push(`Interpretacion limitada de ${correct}`);

  return Array.from(
    new Set(
      chosen.filter(
        (value) =>
          value &&
          normalizeQuestion(value) !== correctNorm &&
          !GENERIC_DISTRACTORS.has(value.toLowerCase().trim())
      )
    )
  ).slice(0, 3);
}

function enrichQuestionsWithSource(questions: QuestionRecord[], sourceText: string): QuestionRecord[] {
  const answerPool = extractCandidateAnswersFromSource(sourceText);

  return questions.map((question) => {
    let correct = question.respuesta_correcta.replace(/\s+/g, ' ').trim();
    let options = question.opciones.map((opt) => opt.replace(/\s+/g, ' ').trim()).filter(Boolean);

    if (correct.endsWith(',') || correct.length < 8) {
      const candidate = answerPool.find((answer) =>
        normalizeQuestion(answer).startsWith(normalizeQuestion(correct.replace(/[,:;.]+$/, '')))
      );
      if (candidate) correct = candidate;
    }

    options = options.filter((opt) => !GENERIC_DISTRACTORS.has(opt.toLowerCase().trim()));

    if (!options.some((opt) => normalizeQuestion(opt) === normalizeQuestion(correct))) {
      options.unshift(correct);
    }

    if (options.length < 4) {
      const distractors = buildPlausibleDistractors(correct, answerPool);
      options = [correct, ...options.filter((opt) => normalizeQuestion(opt) !== normalizeQuestion(correct)), ...distractors];
    }

    const finalOptions = dedupeOptions(options).slice(0, 4);

    if (!finalOptions.some((opt) => normalizeQuestion(opt) === normalizeQuestion(correct))) {
      finalOptions[0] = correct;
    }

    return {
      enunciado: question.enunciado,
      opciones: finalOptions,
      respuesta_correcta: correct,
    };
  }).filter((question) => question.opciones.length >= 2);
}

export async function analizarMaterialConIA(
  filePath: string,
  materiaId: string,
  tipo: string,
  parcial: number,
  universidadId: string,
  carreraId: string | null,
  _titulo: string,
  _usarIA = false
): Promise<ProcessResult> {
  try {
    const { supabase } = await requireAdminAccess();

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('biblioteca')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(
        `Error al descargar el archivo: ${downloadError?.message || 'Archivo no encontrado'}`
      );
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    const { data: materiaData } = await supabase
      .from('materias')
      .select('nombre, slug')
      .eq('id', materiaId)
      .single();

    const nombreMateria = materiaData?.nombre || '';
    const slugMateria = materiaData?.slug || '';
    const esGeneral =
      slugMateria.includes('aprender-21') ||
      slugMateria.includes('tecnologia-humanidades') ||
      nombreMateria.toLowerCase().includes('aprender en el siglo 21');
    const finalCarreraId = esGeneral ? null : carreraId;

    let parsedQuestions: QuestionRecord[] = [];
    const isExcelFile = /\.(xlsx|xls)$/i.test(filePath);

    if (isExcelFile) {
      parsedQuestions = parseQuestionsFromXlsxBuffer(buffer);
    } else {
      const pdfData = await pdf(buffer);
      const text = pdfData.text;

      if (!text || text.trim().length < 50) {
        throw new Error('El PDF no contiene suficiente texto para analizar.');
      }

      // Prioridad 1: parser local del formato "primera opcion = correcta"
      parsedQuestions = extractOrderedOptionsQuestionsFromText(text);

      if (parsedQuestions.length === 0) {
        parsedQuestions = extractQuestionsFallbackFromText(text);
      }
      parsedQuestions = enrichQuestionsWithSource(parsedQuestions, text);
    }

    const { data: existingQuestions, error: existingError } = await supabase
      .from('preguntas_banco')
      .select('enunciado, respuesta_correcta, opciones')
      .eq('materia_id', materiaId);

    if (existingError) {
      throw existingError;
    }

    const dedupeAgainstPregunteros = tipo === 'Preguntero';

    const existingNormalized = new Set(
      (existingQuestions ?? []).map((item) => normalizeQuestion(item.enunciado))
    );
    const existingFingerprints = new Set(
      dedupeAgainstPregunteros
        ? (existingQuestions ?? []).map((item) =>
            buildQuestionFingerprint({
              enunciado: item.enunciado,
              respuesta_correcta: item.respuesta_correcta,
              opciones: Array.isArray(item.opciones)
                ? (item.opciones.filter((option): option is string => typeof option === 'string') as string[])
                : [],
            })
          )
        : []
    );

    const parsedEntries = new Map<string, QuestionRecord>();
    for (const question of parsedQuestions) {
      const key = dedupeAgainstPregunteros
        ? buildQuestionFingerprint(question)
        : normalizeQuestion(question.enunciado);
      if (!parsedEntries.has(key)) {
        parsedEntries.set(key, question);
      }
    }

    const uniqueParsedQuestions = Array.from(parsedEntries.values());
    const invalidQuestions = uniqueParsedQuestions.filter((q) => !q.enunciado || q.opciones.length < 2).length;

    const questionsToInsert = uniqueParsedQuestions
      .filter((question) => {
        if (dedupeAgainstPregunteros) {
          return !existingFingerprints.has(buildQuestionFingerprint(question));
        }

        return !existingNormalized.has(normalizeQuestion(question.enunciado));
      })
      .map((question) => ({
        materia_id: materiaId,
        enunciado: question.enunciado,
        opciones: question.opciones,
        respuesta_correcta: question.respuesta_correcta,
        parcial,
        universidad_id: universidadId,
        carrera_id: finalCarreraId,
        es_general: esGeneral,
      }));

    const duplicates = uniqueParsedQuestions.length - questionsToInsert.length;

    if (questionsToInsert.length === 0) {
      return {
        success: true,
        count: 0,
        duplicates,
        invalid: invalidQuestions,
        message:
          'No se detectaron preguntas nuevas para importar. Verifica formato y duplicados.',
      };
    }

    const { error: insertError } = await supabase.from('preguntas_banco').insert(questionsToInsert);
    if (insertError) {
      throw insertError;
    }

    revalidatePath('/admin');

    return {
      success: true,
      count: questionsToInsert.length,
      duplicates,
      invalid: invalidQuestions,
      message: `Importacion completa: ${questionsToInsert.length} nuevas, ${duplicates} duplicadas, ${invalidQuestions} invalidas.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error procesando el material con la IA.';
    console.error('Error al analizar material con IA:', error);
    return {
      success: false,
      message,
    };
  }
}

export async function limpiarPreguntasBanco(): Promise<CleanResult> {
  try {
    const { supabase } = await requireAdminAccess();

    const { count, error } = await supabase
      .from('preguntas_banco')
      .delete({ count: 'exact' })
      .neq('enunciado', '');

    if (error) {
      throw error;
    }

    revalidatePath('/admin');

    return {
      success: true,
      deletedCount: count ?? 0,
      message: `Se eliminaron ${count ?? 0} preguntas del banco.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error limpiando el banco de preguntas.';
    console.error('Error al limpiar preguntas:', error);
    return {
      success: false,
      message,
    };
  }
}

export async function obtenerPromptSistema(): Promise<{
  success: boolean;
  data?: string;
  message?: string;
}> {
  try {
    const { supabase } = await requireAdminAccess();

    const { data, error } = await supabase
      .from('configuracion_ia')
      .select('prompt_sistema')
      .eq('id', 'prompt_extraccion')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: '' };
      }

      throw error;
    }

    return { success: true, data: data.prompt_sistema ?? '' };
  } catch (error) {
    console.error('Error en obtenerPromptSistema:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al obtener el prompt.',
    };
  }
}

export async function actualizarPromptSistema(
  nuevoPrompt: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { supabase } = await requireAdminAccess();

    const { error } = await supabase.from('configuracion_ia').upsert(
      {
        id: 'prompt_extraccion',
        prompt_sistema: nuevoPrompt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw error;
    }

    return { success: true, message: 'Prompt actualizado correctamente.' };
  } catch (error) {
    console.error('Error en actualizarPromptSistema:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar el prompt.',
    };
  }
}

export async function crearMateriaCompartidaAdmin(input: {
  nombre: string;
  carreraIds: string[];
}): Promise<{ success: boolean; materiaId?: string; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const nombre = input.nombre.trim();
    const carreraIds = Array.from(new Set(input.carreraIds.filter(Boolean)));

    if (!nombre) {
      return { success: false, message: 'El nombre de la materia es obligatorio.' };
    }

    if (carreraIds.length === 0) {
      return { success: false, message: 'Selecciona al menos una carrera.' };
    }

    const { data: existingMaterias, error: existingError } = await admin
      .from('materias')
      .select('id, nombre, carrera_id')
      .order('nombre');

    if (existingError) throw existingError;

    const normalizedName = normalizeAdminText(nombre);
    const existingMateria = (existingMaterias ?? []).find(
      (materia) => normalizeAdminText(materia.nombre) === normalizedName
    );

    let materiaId = existingMateria?.id ?? null;

    if (!materiaId) {
      const { data: createdMateria, error: createError } = await admin
        .from('materias')
        .insert({
          nombre,
          carrera_id: carreraIds[0] ?? null,
          es_general: false,
        })
        .select('id')
        .single();

      if (createError || !createdMateria?.id) {
        throw createError ?? new Error('No se pudo crear la materia.');
      }

      materiaId = createdMateria.id;
    }

    const { data: existingRelations, error: relationsError } = await admin
      .from('carrera_materias')
      .select('carrera_id')
      .eq('materia_id', materiaId);

    if (relationsError) throw relationsError;

    const existingCareerIds = new Set(
      (existingRelations ?? []).map((relation) => relation.carrera_id).filter(Boolean)
    );

    const rowsToInsert = carreraIds
      .filter((carreraId) => !existingCareerIds.has(carreraId))
      .map((carreraId) => ({
        carrera_id: carreraId,
        materia_id: materiaId,
      }));

    if (rowsToInsert.length > 0) {
      const { error: insertRelationsError } = await admin
        .from('carrera_materias')
        .insert(rowsToInsert);

      if (insertRelationsError) throw insertRelationsError;
    }

    revalidatePath('/admin');

    return {
      success: true,
      materiaId,
      message:
        rowsToInsert.length > 0
          ? 'Materia creada y asignada a las carreras seleccionadas.'
          : 'La materia ya existia y mantuvimos sus asignaciones actuales.',
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'No se pudo crear la materia compartida.',
    };
  }
}

export async function desasignarMateriaDeCarreraAdmin(input: {
  materiaId: string;
  carreraId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    if (!input.materiaId || !input.carreraId) {
      return { success: false, message: 'Faltan datos para desasignar la materia.' };
    }

    const { error: relationError } = await admin
      .from('carrera_materias')
      .delete()
      .eq('materia_id', input.materiaId)
      .eq('carrera_id', input.carreraId);

    if (relationError) throw relationError;

    const { data: remainingRelations, error: remainingError } = await admin
      .from('carrera_materias')
      .select('id', { count: 'exact' })
      .eq('materia_id', input.materiaId);

    if (remainingError) throw remainingError;

    if ((remainingRelations ?? []).length === 0) {
      await admin
        .from('materias')
        .update({ carrera_id: null })
        .eq('id', input.materiaId);
    }

    revalidatePath('/admin');

    return {
      success: true,
      message: 'La materia ya no aparece en esa carrera.',
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'No se pudo desasignar la materia de la carrera.',
    };
  }
}

export async function importarMateriasDesdeExcelAdmin(
  input: {
    universidadId: string;
    entries: MateriaImportEntryInput[];
  }
): Promise<MateriaImportResult> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const universidadId = input.universidadId?.trim();
    const entries = input.entries;

    if (!universidadId) {
      return {
        success: false,
        message: 'Selecciona una universidad antes de importar la malla.',
      };
    }

    const normalizedEntriesMap = new Map<string, { materia: string; carreras: Set<string> }>();

    for (const rawEntry of entries) {
      const materia = rawEntry.materia.trim();
      if (!materia) continue;

      const normalizedMateria = normalizeAdminText(materia);
      const current =
        normalizedEntriesMap.get(normalizedMateria) ??
        { materia, carreras: new Set<string>() };

      for (const carrera of rawEntry.carreras) {
        const cleanCarrera = carrera.trim();
        if (cleanCarrera) current.carreras.add(cleanCarrera);
      }

      normalizedEntriesMap.set(normalizedMateria, current);
    }

    const normalizedEntries = Array.from(normalizedEntriesMap.values()).map((entry) => ({
      materia: entry.materia,
      carreras: Array.from(entry.carreras),
    }));

    if (normalizedEntries.length === 0) {
      return {
        success: false,
        message: 'El archivo no trajo materias validas para importar.',
      };
    }

    const [{ data: carrerasRows, error: carrerasError }, { data: materiasRows, error: materiasError }] =
      await Promise.all([
        admin.from('carreras').select('id, nombre').order('nombre'),
        admin.from('materias').select('id, nombre, carrera_id').order('nombre'),
      ]);

    if (carrerasError) throw carrerasError;
    if (materiasError) throw materiasError;

    const careerByNormalizedName = new Map(
      (carrerasRows ?? []).map((carrera) => [normalizeAdminText(carrera.nombre), carrera])
    );
    const materiaByNormalizedName = new Map(
      (materiasRows ?? []).map((materia) => [normalizeAdminText(materia.nombre), materia])
    );

    const missingCareerNames = Array.from(
      new Set(
        normalizedEntries.flatMap((entry) =>
          entry.carreras.filter((carreraName) => !careerByNormalizedName.has(normalizeAdminText(carreraName)))
        )
      )
    );

    let carrerasCreated = 0;
    if (missingCareerNames.length > 0) {
      const rowsToCreate = missingCareerNames.map((nombre) => ({
        nombre,
        universidad_id: universidadId,
      }));

      const { data: createdCarreras, error: createCarrerasError } = await admin
        .from('carreras')
        .insert(rowsToCreate)
        .select('id, nombre, universidad_id');

      if (createCarrerasError) throw createCarrerasError;

      carrerasCreated = createdCarreras?.length ?? 0;
      for (const carrera of createdCarreras ?? []) {
        careerByNormalizedName.set(normalizeAdminText(carrera.nombre), carrera);
      }
    }

    const carreraIdsByMateria = new Map<string, Set<string>>();
    const materiasSinCarrerasValidas: string[] = [];

    for (const entry of normalizedEntries) {
      const normalizedMateria = normalizeAdminText(entry.materia);
      const validCareerIds = new Set<string>();

      for (const carreraName of entry.carreras) {
        const carreraRow = careerByNormalizedName.get(normalizeAdminText(carreraName));
        if (!carreraRow?.id) {
          continue;
        }
        validCareerIds.add(carreraRow.id);
      }

      if (validCareerIds.size === 0) {
        materiasSinCarrerasValidas.push(entry.materia);
        continue;
      }

      carreraIdsByMateria.set(normalizedMateria, validCareerIds);
    }

    const materiasValidas = carreraIdsByMateria.size;

    if (materiasValidas === 0) {
      return {
        success: false,
        message: 'No encontramos carreras validas para asociar en este archivo.',
        carrerasCreated,
        materiasCreated: 0,
        materiasReused: 0,
        relacionesCreated: 0,
        filasProcesadas: normalizedEntries.length,
        carrerasNoEncontradas: [],
        materiasSinCarrerasValidas,
      };
    }

    const materiasToCreate = Array.from(carreraIdsByMateria.entries())
      .filter(([normalizedMateria]) => !materiaByNormalizedName.has(normalizedMateria))
      .map(([normalizedMateria, carreraIds]) => {
        const sourceEntry = normalizedEntries.find(
          (entry) => normalizeAdminText(entry.materia) === normalizedMateria
        );

        return {
          nombre: sourceEntry?.materia ?? normalizedMateria,
          carrera_id: Array.from(carreraIds)[0] ?? null,
          es_general: false,
        };
      });

    let materiasCreated = 0;
    if (materiasToCreate.length > 0) {
      const { data: createdMaterias, error: createError } = await admin
        .from('materias')
        .insert(materiasToCreate)
        .select('id, nombre, carrera_id');

      if (createError) throw createError;

      materiasCreated = createdMaterias?.length ?? 0;
      for (const materia of createdMaterias ?? []) {
        materiaByNormalizedName.set(normalizeAdminText(materia.nombre), materia);
      }
    }

    const materiaIds = Array.from(new Set(Array.from(carreraIdsByMateria.keys())
      .map((normalizedMateria) => materiaByNormalizedName.get(normalizedMateria)?.id)
      .filter((id): id is string => Boolean(id))));

    const existingRelations =
      materiaIds.length > 0
        ? await admin
            .from('carrera_materias')
            .select('materia_id, carrera_id')
            .in('materia_id', materiaIds)
        : { data: [], error: null };

    if (existingRelations.error) throw existingRelations.error;

    const existingRelationKeys = new Set(
      (existingRelations.data ?? [])
        .filter((relation) => relation.materia_id && relation.carrera_id)
        .map((relation) => `${relation.materia_id}::${relation.carrera_id}`)
    );

    const rowsToInsert: Array<{ materia_id: string; carrera_id: string }> = [];

    for (const [normalizedMateria, carreraIds] of carreraIdsByMateria.entries()) {
      const materiaRow = materiaByNormalizedName.get(normalizedMateria);
      if (!materiaRow?.id) continue;

      for (const carreraId of carreraIds) {
        const relationKey = `${materiaRow.id}::${carreraId}`;
        if (existingRelationKeys.has(relationKey)) continue;

        existingRelationKeys.add(relationKey);
        rowsToInsert.push({
          materia_id: materiaRow.id,
          carrera_id: carreraId,
        });
      }
    }

    if (rowsToInsert.length > 0) {
      const { error: insertRelationsError } = await admin
        .from('carrera_materias')
        .insert(rowsToInsert);

      if (insertRelationsError) throw insertRelationsError;
    }

    revalidatePath('/admin');

    return {
      success: true,
      message: `Importacion completa: ${carrerasCreated} carreras nuevas, ${materiasCreated} materias nuevas y ${rowsToInsert.length} asignaciones creadas.`,
      carrerasCreated,
      materiasCreated,
      materiasReused: materiasValidas - materiasCreated,
      relacionesCreated: rowsToInsert.length,
      filasProcesadas: materiasValidas,
      carrerasNoEncontradas: [],
      materiasSinCarrerasValidas,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'No se pudo importar la malla de materias.',
    };
  }
}

export async function obtenerRankingErroresIA(
  limit = 30
): Promise<{ success: boolean; rows?: IARankingRow[]; message?: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const { data: stats, error: statsError } = await admin
      .from('rag_question_stats')
      .select('pregunta_id, materia_id, veces_fallada, updated_at')
      .order('veces_fallada', { ascending: false })
      .limit(limit);

    if (statsError) {
      throw statsError;
    }

    if (!stats || stats.length === 0) {
      return { success: true, rows: [] };
    }

    const questionIds = (stats as Array<{ pregunta_id: string }>).map((item) => item.pregunta_id);
    const [{ data: questions }, { data: cache }] = await Promise.all([
      admin.from('preguntas_banco').select('id, enunciado').in('id', questionIds),
      admin
        .from('rag_explanations_cache')
        .select('pregunta_id, explicacion, provider, updated_at')
        .in('pregunta_id', questionIds),
    ]);

    const qMap = new Map(((questions ?? []) as Array<{ id: string; enunciado: string }>).map((q) => [q.id, q]));
    const cMap = new Map(((cache ?? []) as Array<{ pregunta_id: string; explicacion: string | null; provider: string | null; updated_at: string | null }>).map((c) => [c.pregunta_id, c]));

    const rows: IARankingRow[] = (stats as Array<{ pregunta_id: string; materia_id: string | null; veces_fallada: number; updated_at: string | null }>).map((stat) => {
      const q = qMap.get(stat.pregunta_id);
      const c = cMap.get(stat.pregunta_id);
      return {
        pregunta_id: stat.pregunta_id,
        materia_id: stat.materia_id,
        enunciado: q?.enunciado ?? '(Pregunta no encontrada)',
        veces_fallada: stat.veces_fallada ?? 0,
        explicacion: c?.explicacion ?? null,
        provider: c?.provider ?? null,
        updated_at: c?.updated_at ?? stat.updated_at ?? null,
      };
    });

    return { success: true, rows };
  } catch (error) {
    console.error('Error en obtenerRankingErroresIA:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo obtener el ranking de errores.',
    };
  }
}

export async function regenerarExplicacionIA(
  preguntaId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const { data: question, error: questionError } = await admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
      .eq('id', preguntaId)
      .maybeSingle();

    if (questionError || !question || !question.materia_id) {
      throw new Error('No encontramos la pregunta para regenerar la explicacion.');
    }

    const { data: chunkRows } = await admin
      .from('rag_document_chunks')
      .select('chunk_text, source_title')
      .eq('materia_id', question.materia_id)
      .limit(120);

    const queryTokens = question.enunciado.toLowerCase().split(/\s+/).filter((t: string) => t.length >= 4);
    const context = (chunkRows ?? [])
      .map((row: { chunk_text?: string | null; source_title?: string | null }) => {
        const text = row.chunk_text ?? '';
        const lowered = text.toLowerCase();
        const score = queryTokens.reduce((acc: number, token: string) => acc + (lowered.includes(token) ? 1 : 0), 0);
        return { score, text: `${row.source_title ? `[${row.source_title}] ` : ''}${text}` };
      })
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .filter((row: { score: number }) => row.score > 0)
      .slice(0, 4)
      .map((row: { text: string }) => row.text);

    const options = Array.isArray(question.opciones)
      ? (question.opciones.filter((item: unknown) => typeof item === 'string') as string[])
      : [];

    const generated = await generateTutorExplanation({
      question: question.enunciado,
      options,
      correctAnswer: question.respuesta_correcta,
      context,
    });

    const { error: cacheError } = await admin.from('rag_explanations_cache').upsert(
      {
        pregunta_id: question.id,
        materia_id: question.materia_id,
        parcial: question.parcial,
        explicacion: generated.text,
        provider: generated.provider,
        source_used: context.length > 0 ? 'supabase-rag' : 'general-academic-fallback',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pregunta_id' }
    );

    if (cacheError) {
      throw cacheError;
    }

    await admin.from('rag_generation_logs').insert({
      pregunta_id: question.id,
      materia_id: question.materia_id,
      provider: generated.provider,
      status: 'ok',
      metadata: { regenerated_from_admin: true, context_chunks: context.length },
    });

    revalidatePath('/admin');

    return {
      success: true,
      message: `Explicacion regenerada con ${generated.provider}.`,
    };
  } catch (error) {
    console.error('Error en regenerarExplicacionIA:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo regenerar la explicacion.',
    };
  }
}

export async function obtenerEstadisticasAdmin(): Promise<{
  success: boolean;
  stats?: AdminAnalyticsStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    const [eventsRes, profilesDay, profilesWeek, profilesMonth] = await Promise.all([
      admin
        .from('analytics_events')
        .select('event_name, user_id, session_key, path, device_type, metadata, created_at')
        .gte('created_at', monthStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(20000),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('creado_at', dayStart.toISOString()),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('creado_at', weekStart.toISOString()),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('creado_at', monthStart.toISOString()),
    ]);

    if (eventsRes.error) {
      throw eventsRes.error;
    }

    const events = eventsRes.data ?? [];
    const todayIso = dayStart.toISOString();
    const dauSet = new Set<string>();
    const sessions = new Map<string, Set<string>>();
    const topPages = new Map<string, number>();
    const loginSources = new Map<string, number>();
    const errorsByPath = new Map<string, number>();
    const deviceCounters = { desktop: 0, mobile: 0 };
    let totalEngagementMs = 0;

    for (const event of events) {
      const createdAt = event.created_at ?? '';
      const sessionKey = event.session_key ?? 'unknown';
      const path = event.path ?? '/';
      const stageSet = sessions.get(sessionKey) ?? new Set<string>();

      if (createdAt >= todayIso) {
        dauSet.add(event.user_id ?? `session:${sessionKey}`);
      }

      if (event.event_name === 'page_view') {
        topPages.set(path, (topPages.get(path) ?? 0) + 1);
        if (event.device_type === 'mobile') deviceCounters.mobile += 1;
        else deviceCounters.desktop += 1;

        stageSet.add('landing');
        if (path.startsWith('/explorar')) stageSet.add('explorar');
        if (path.startsWith('/universidad/')) stageSet.add('carrera');
        if (path.includes('/materia/')) stageSet.add('materia');
        if (path.startsWith('/simulador')) stageSet.add('simulador');
      }

      if (event.event_name === 'login_success') {
        const sourcePath =
          typeof event.metadata === 'object' && event.metadata
            ? String((event.metadata as Record<string, unknown>).source_path ?? path)
            : path;
        loginSources.set(sourcePath, (loginSources.get(sourcePath) ?? 0) + 1);
      }

      if (event.event_name === 'client_error') {
        errorsByPath.set(path, (errorsByPath.get(path) ?? 0) + 1);
      }

      if (event.event_name === 'session_ping') {
        const engagement =
          typeof event.metadata === 'object' && event.metadata
            ? Number((event.metadata as Record<string, unknown>).engagement_ms ?? 0)
            : 0;
        totalEngagementMs += Number.isFinite(engagement) ? engagement : 0;
      }

      sessions.set(sessionKey, stageSet);
    }

    const sessionStages = Array.from(sessions.values());
    const sessionsTotal = sessionStages.length;
    const reachedExplorar = sessionStages.filter((s) => s.has('explorar')).length;
    const reachedCarrera = sessionStages.filter((s) => s.has('carrera')).length;
    const reachedMateria = sessionStages.filter((s) => s.has('materia')).length;
    const reachedSimulador = sessionStages.filter((s) => s.has('simulador')).length;

    const drops = [
      { stage: 'explorar', drop: Math.max(0, sessionsTotal - reachedExplorar) },
      { stage: 'carrera', drop: Math.max(0, reachedExplorar - reachedCarrera) },
      { stage: 'materia', drop: Math.max(0, reachedCarrera - reachedMateria) },
      { stage: 'simulador', drop: Math.max(0, reachedMateria - reachedSimulador) },
    ].sort((a, b) => b.drop - a.drop);

    const topPagesArr = Array.from(topPages.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const topErrorPaths = Array.from(errorsByPath.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topLoginSource =
      Array.from(loginSources.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'sin datos';

    const avgMinutesPerSession =
      sessionsTotal > 0 ? Number(((totalEngagementMs / sessionsTotal) / 1000 / 60).toFixed(2)) : 0;

    return {
      success: true,
      stats: {
        dau: dauSet.size,
        registered: {
          day: profilesDay.count ?? 0,
          week: profilesWeek.count ?? 0,
          month: profilesMonth.count ?? 0,
        },
        conversion: {
          sessions_total: sessionsTotal,
          reached_explorar: reachedExplorar,
          reached_carrera: reachedCarrera,
          reached_materia: reachedMateria,
          reached_simulador: reachedSimulador,
          top_abandon_stage: drops[0]?.stage ?? 'sin datos',
          top_login_source: topLoginSource,
        },
        interaction: {
          avg_minutes_per_session: avgMinutesPerSession,
          total_hours_last_7d: Number((totalEngagementMs / 1000 / 60 / 60).toFixed(2)),
        },
        top_pages: topPagesArr,
        devices: deviceCounters,
        errors: {
          total: Array.from(errorsByPath.values()).reduce((acc, val) => acc + val, 0),
          top_paths: topErrorPaths,
        },
      },
    };
  } catch (error) {
    console.error('Error en obtenerEstadisticasAdmin:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudieron obtener estadisticas.',
    };
  }
}

export async function obtenerDuplicadosPdfAdmin(): Promise<{
  success: boolean;
  rows?: DuplicateCandidate[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('recursos')
      .select('id, nombre, url_archivo, materia_id, paginas')
      .order('creado_at', { ascending: false })
      .limit(6000);

    if (error) throw error;

    const groups = new Map<string, DuplicateCandidate>();
    for (const row of data ?? []) {
      const normalized = row.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      const key = `${row.materia_id ?? 'sin_materia'}:${normalized}:${row.paginas ?? 'np'}`;
      const current = groups.get(key) ?? {
        normalized_name: normalized,
        materia_id: row.materia_id,
        count: 0,
        recursos: [],
      };
      current.count += 1;
      current.recursos.push({
        id: row.id,
        nombre: row.nombre,
        url_archivo: row.url_archivo,
        paginas: row.paginas,
      });
      groups.set(key, current);
    }

    const rows = Array.from(groups.values())
      .filter((g) => g.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    return { success: true, rows };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudieron analizar duplicados.',
    };
  }
}

export async function obtenerPreguntasEditorAdmin(): Promise<{
  success: boolean;
  rows?: QuestionEditorRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, respuesta_correcta, parcial, dificultad, tasa_acierto')
      .eq('es_ia_generada', true)
      .order('creado_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    const rows = (data ?? []).map((row) => ({
      id: row.id,
      enunciado: row.enunciado,
      opciones: Array.isArray(row.opciones) ? (row.opciones.filter((o) => typeof o === 'string') as string[]) : [],
      respuesta_correcta: row.respuesta_correcta,
      parcial: row.parcial,
      dificultad: row.dificultad,
      tasa_acierto: row.tasa_acierto,
    }));
    return { success: true, rows };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar el editor de preguntas.',
    };
  }
}

export async function actualizarPreguntaEditorAdmin(payload: {
  id: string;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
}) {
  try {
    const { user } = await requireAdminAccess();
    const admin = createAdminClient();
    const { data: before } = await admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, respuesta_correcta')
      .eq('id', payload.id)
      .maybeSingle();

    const { error } = await admin
      .from('preguntas_banco')
      .update({
        enunciado: payload.enunciado.trim(),
        opciones: payload.opciones,
        respuesta_correcta: payload.respuesta_correcta.trim(),
      })
      .eq('id', payload.id);
    if (error) throw error;

    await admin.from('question_edit_audit').insert({
      pregunta_id: payload.id,
      admin_user_id: user.id,
      before_payload: before,
      after_payload: payload,
    });
    revalidatePath('/admin');
    return { success: true, message: 'Pregunta actualizada.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo actualizar la pregunta.',
    };
  }
}

export async function recalcularDificultadPreguntasAdmin() {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const { data: questions } = await admin
      .from('preguntas_banco')
      .select('id')
      .limit(4000);

    for (const question of questions ?? []) {
      const { data: answers } = await admin
        .from('historial_respuestas')
        .select('es_correcta')
        .eq('pregunta_id', question.id)
        .limit(1000);

      const total = (answers ?? []).length;
      if (total === 0) continue;
      const correct = (answers ?? []).filter((a) => a.es_correcta === true).length;
      const rate = Number(((correct / total) * 100).toFixed(2));
      const dificultad = rate >= 70 ? 'facil' : rate >= 40 ? 'media' : 'dificil';

      await admin
        .from('preguntas_banco')
        .update({ tasa_acierto: rate, dificultad })
        .eq('id', question.id);
    }

    revalidatePath('/admin');
    return { success: true, message: 'Dificultad y tasa de acierto recalculadas.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo recalcular la dificultad.',
    };
  }
}

export async function obtenerSaludSistemaAdmin() {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from('analytics_events')
      .select('event_name, path, metadata, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(12000);
    if (error) throw error;

    const errors = (data ?? []).filter((e) => e.event_name === 'client_error');
    const pings = (data ?? []).filter((e) => e.event_name === 'session_ping');
    const endpointFail = new Map<string, number>();
    for (const errorRow of errors) {
      const p = errorRow.path ?? 'unknown';
      endpointFail.set(p, (endpointFail.get(p) ?? 0) + 1);
    }
    const avgLatencyMs =
      pings.length > 0
        ? Math.round(
            pings.reduce((acc, e) => {
              const metadata = (e.metadata ?? {}) as Record<string, unknown>;
              return acc + Number(metadata.engagement_ms ?? 0);
            }, 0) / pings.length
          )
        : 0;

    return {
      success: true,
      stats: {
        total_errors: errors.length,
        avg_latency_ms: avgLatencyMs,
        failures_by_path: Array.from(endpointFail.entries())
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
      },
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'No se pudo obtener salud del sistema.' };
  }
}

export async function obtenerFeedbackExplicacionesAdmin() {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('rag_explanation_feedback')
      .select('voto, pregunta_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10000);
    if (error) throw error;

    const positive = (data ?? []).filter((r) => r.voto === 1).length;
    const negative = (data ?? []).filter((r) => r.voto === -1).length;
    return { success: true, stats: { total: (data ?? []).length, positive, negative } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'No se pudo obtener feedback.' };
  }
}

export async function obtenerFeedbackRevisionAdmin(limit = 30): Promise<{
  success: boolean;
  rows?: FeedbackReviewItem[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const { data: feedbackRows, error } = await admin
      .from('rag_explanation_feedback')
      .select('pregunta_id, voto, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!feedbackRows || feedbackRows.length === 0) return { success: true, rows: [] };

    const questionIds = Array.from(new Set(feedbackRows.map((row) => row.pregunta_id)));
    const [{ data: questions }, { data: explanations }] = await Promise.all([
      admin.from('preguntas_banco').select('id, enunciado').in('id', questionIds),
      admin
        .from('rag_explanations_cache')
        .select('pregunta_id, explicacion, provider')
        .in('pregunta_id', questionIds),
    ]);

    const questionMap = new Map((questions ?? []).map((q) => [q.id, q.enunciado]));
    const explanationMap = new Map(
      (explanations ?? []).map((e) => [e.pregunta_id, { explicacion: e.explicacion, provider: e.provider }])
    );

    const rows: FeedbackReviewItem[] = feedbackRows.map((row) => ({
      pregunta_id: row.pregunta_id,
      voto: row.voto,
      created_at: row.created_at,
      enunciado: questionMap.get(row.pregunta_id) ?? '(Pregunta no encontrada)',
      explicacion: explanationMap.get(row.pregunta_id)?.explicacion ?? null,
      provider: explanationMap.get(row.pregunta_id)?.provider ?? null,
    }));

    return { success: true, rows };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar el feedback para revision.',
    };
  }
}

export async function ejecutarMantenimientoArchivosAdmin() {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const { data: dbResources } = await admin
      .from('recursos')
      .select('url_archivo')
      .not('url_archivo', 'is', null)
      .limit(10000);

    const dbSet = new Set((dbResources ?? []).map((r) => String(r.url_archivo)));
    const orphans: string[] = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      const { data: list, error } = await admin.storage.from('biblioteca').list('', {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error || !list || list.length === 0) break;
      for (const item of list) {
        if (!item.name) continue;
        if (!dbSet.has(item.name)) orphans.push(item.name);
      }
      offset += limit;
      if (list.length < limit) break;
    }

    return {
      success: true,
      result: { orphan_count: orphans.length, orphan_sample: orphans.slice(0, 20) },
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'No se pudo ejecutar mantenimiento.' };
  }
}

export async function verificarAlertasMetricasAdmin() {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from('analytics_events')
      .select('event_name, session_key, path')
      .gte('created_at', since)
      .limit(20000);
    if (error) throw error;

    const sessions = new Map<string, Set<string>>();
    let errorCount = 0;
    for (const e of data ?? []) {
      if (e.event_name === 'client_error') errorCount += 1;
      if (e.event_name === 'page_view') {
        const set = sessions.get(e.session_key) ?? new Set<string>();
        const p = e.path ?? '/';
        if (p.startsWith('/explorar')) set.add('explorar');
        if (p.includes('/materia/')) set.add('materia');
        sessions.set(e.session_key, set);
      }
    }
    const totalSessions = sessions.size;
    const reachedMateria = Array.from(sessions.values()).filter((s) => s.has('materia')).length;
    const abandonoRate = totalSessions > 0 ? Number((((totalSessions - reachedMateria) / totalSessions) * 100).toFixed(2)) : 0;

    const alerts: Array<{ key: string; severity: string; message: string }> = [];
    if (abandonoRate > 70) {
      alerts.push({
        key: 'abandono_alto',
        severity: 'high',
        message: `Abandono alto detectado (${abandonoRate}%) en el embudo explorar -> materia.`,
      });
    }
    if (errorCount > 50) {
      alerts.push({
        key: 'errores_altos',
        severity: 'high',
        message: `Se detectaron ${errorCount} errores de cliente en las ultimas 24h.`,
      });
    }

    for (const alert of alerts) {
      await admin.from('admin_alert_logs').insert({
        alert_key: alert.key,
        severity: alert.severity,
        message: alert.message,
      });
    }

    return { success: true, alerts, abandonoRate, errorCount };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'No se pudieron verificar alertas.' };
  }
}

export async function obtenerUsuariosAdmin(limit = 200): Promise<{
  success: boolean;
  rows?: AdminUserItem[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const [
      { data: authUsersData, error: authError },
      { data: subscriptionsDataRaw, error: subsError },
      { data: plansRaw, error: plansError },
      { data: profileRows, error: profilesError },
    ] =
      await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: limit }),
        admin
          .from('user_subscriptions')
          .select('user_id, status, started_at, plan_id')
          .order('started_at', { ascending: false })
          .limit(5000),
        admin.from('subscription_plans').select('id, code'),
        admin.from('profiles').select('id, role').limit(limit),
      ]);

    if (authError) throw authError;
    if (subsError) throw subsError;
    if (plansError) throw plansError;
    if (profilesError) throw profilesError;

    const subscriptionsData = (subscriptionsDataRaw ?? []) as unknown as UserSubscriptionPlanRow[];
    const planCodeById = new Map(
      ((plansRaw ?? []) as Array<{ id: string; code: string }>).map((plan) => [plan.id, plan.code])
    );

    const latestPlanByUser = new Map<string, 'free' | 'premium'>();
    const profileRoleByUser = new Map(
      ((profileRows ?? []) as Array<{ id: string; role: string | null }>).map((row) => [
        row.id,
        row.role === 'admin' ? 'admin' : 'student',
      ])
    );

    for (const row of subscriptionsData ?? []) {
      const uid = row.user_id;
      if (!uid || latestPlanByUser.has(uid)) continue;
      const code = planCodeById.get(row.plan_id);
      latestPlanByUser.set(uid, code === 'premium' ? 'premium' : 'free');
    }

    const rows: AdminUserItem[] = (authUsersData?.users ?? []).map((user) => {
      const lastSignIn = user.last_sign_in_at ?? null;
      const isActive =
        !!lastSignIn &&
        Date.now() - new Date(lastSignIn).getTime() < 30 * 24 * 60 * 60 * 1000;
      const resolvedRole: 'admin' | 'student' =
        ((user.app_metadata?.role === 'admin' ? 'admin' : null) ??
          profileRoleByUser.get(user.id) ??
          'student') as 'admin' | 'student';

      return {
        id: user.id,
        email: user.email ?? '(sin email)',
        estado: isActive ? 'activo' : 'inactivo',
        plan: latestPlanByUser.get(user.id) ?? 'free',
        role: resolvedRole,
        last_sign_in_at: lastSignIn,
        created_at: user.created_at ?? null,
      };
    });

    return { success: true, rows };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar la lista de usuarios.',
    };
  }
}

export async function actualizarRolUsuarioAdmin(
  userId: string,
  nextRole: 'admin' | 'student'
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: nextRole },
    });

    if (authError) {
      throw authError;
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    revalidatePath('/admin');

    return {
      success: true,
      message:
        nextRole === 'admin'
          ? 'El usuario ahora tiene permisos de administrador.'
          : 'El usuario volvio a permisos de estudiante.',
    };
  } catch (error) {
    console.error('Error en actualizarRolUsuarioAdmin:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo actualizar el rol del usuario.',
    };
  }
}

export async function obtenerMonetizacionAdmin(): Promise<{
  success: boolean;
  data?: MonetizacionStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const [{ data: plans, error: plansError }, { data: subsRaw, error: subsError }] = await Promise.all([
      admin
        .from('subscription_plans')
        .select('id, code, name, price_ars, interval, is_active')
        .order('price_ars', { ascending: true }),
      admin
        .from('user_subscriptions')
        .select('status, amount_ars, plan_id')
        .order('created_at', { ascending: false })
        .limit(5000),
    ]);

    if (plansError) throw plansError;
    if (subsError) throw subsError;

    const subs = (subsRaw ?? []) as unknown as UserSubscriptionMonetizationRow[];
    const planPriceById = new Map((plans ?? []).map((plan) => [plan.id, Number(plan.price_ars ?? 0)]));

    const total = (subs ?? []).length;
    const activas = (subs ?? []).filter((s) => s.status === 'active').length;
    const canceladas = (subs ?? []).filter((s) => s.status === 'canceled').length;
    const ingresoMensualEstimadoArs = Math.round(
      (subs ?? [])
        .filter((s) => s.status === 'active')
        .reduce((acc, s) => {
          const explicit = Number(s.amount_ars ?? 0);
          if (explicit > 0) return acc + explicit;
          const fromPlan = Number(planPriceById.get(s.plan_id) ?? 0);
          return acc + fromPlan;
        }, 0)
    );

    return {
      success: true,
      data: {
        totalSuscripciones: total,
        activas,
        canceladas,
        ingresoMensualEstimadoArs,
        planes:
          (plans ?? []).map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            price_ars: p.price_ars,
            interval: p.interval,
            is_active: p.is_active,
          })) ?? [],
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar la monetizacion.',
    };
  }
}

export async function obtenerRankingGlobalPreguntasAdmin(input: {
  materiaId?: string | null;
  parcial?: number | null;
  limit?: number;
}): Promise<{
  success: boolean;
  mostFailed?: GlobalQuestionRankingRow[];
  mostCorrect?: GlobalQuestionRankingRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const limit = Math.max(5, Math.min(input.limit ?? 15, 50));

    let preguntasQuery = admin
      .from('preguntas_banco')
      .select('id, enunciado, parcial, materia_id');

    if (input.materiaId) preguntasQuery = preguntasQuery.eq('materia_id', input.materiaId);
    if (input.parcial) preguntasQuery = preguntasQuery.eq('parcial', input.parcial);

    const { data: preguntas, error: preguntasError } = await preguntasQuery.limit(4000);
    if (preguntasError) throw preguntasError;

    const preguntaIds = (preguntas ?? []).map((p) => p.id);
    if (preguntaIds.length === 0) {
      return { success: true, mostFailed: [], mostCorrect: [] };
    }

    const { data: historial, error: historialError } = await admin
      .from('historial_respuestas')
      .select('pregunta_id, es_correcta')
      .in('pregunta_id', preguntaIds);
    if (historialError) throw historialError;

    const mapPregunta = new Map(
      (preguntas ?? []).map((p) => [p.id, { enunciado: p.enunciado, parcial: p.parcial }])
    );
    const stats = new Map<
      string,
      { respuestas_totales: number; respuestas_correctas: number; respuestas_incorrectas: number }
    >();

    for (const row of historial ?? []) {
      const pid = row.pregunta_id ?? '';
      if (!pid || !mapPregunta.has(pid)) continue;
      const current = stats.get(pid) ?? {
        respuestas_totales: 0,
        respuestas_correctas: 0,
        respuestas_incorrectas: 0,
      };
      current.respuestas_totales += 1;
      if (row.es_correcta) current.respuestas_correctas += 1;
      else current.respuestas_incorrectas += 1;
      stats.set(pid, current);
    }

    const rows: GlobalQuestionRankingRow[] = Array.from(stats.entries()).map(([pregunta_id, value]) => {
      const base = mapPregunta.get(pregunta_id);
      const tasa = value.respuestas_totales
        ? Number(((value.respuestas_correctas / value.respuestas_totales) * 100).toFixed(2))
        : 0;
      return {
        pregunta_id,
        enunciado: base?.enunciado ?? '(Pregunta sin enunciado)',
        parcial: base?.parcial ?? null,
        respuestas_totales: value.respuestas_totales,
        respuestas_correctas: value.respuestas_correctas,
        respuestas_incorrectas: value.respuestas_incorrectas,
        tasa_acierto: tasa,
      };
    });

    const mostFailed = [...rows]
      .sort((a, b) => b.respuestas_incorrectas - a.respuestas_incorrectas)
      .slice(0, limit);
    const mostCorrect = [...rows]
      .sort((a, b) => b.respuestas_correctas - a.respuestas_correctas)
      .slice(0, limit);

    return { success: true, mostFailed, mostCorrect };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo obtener el ranking global.',
    };
  }
}

export async function importarSimuladorPremiumDesdeArchivo(input: {
  filePath: string;
  materiaId: string;
  parcial: number;
  titulo: string;
  sourceExamDate?: string | null;
}): Promise<ProcessResult> {
  try {
    const { user, supabase } = await requireAdminAccess();

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('biblioteca')
      .download(input.filePath);

    if (downloadError || !fileData) {
      throw new Error(`No se pudo descargar el archivo: ${downloadError?.message ?? 'sin data'}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    let parsedQuestions: QuestionRecord[] = [];

    if (/\.(xlsx|xls)$/i.test(input.filePath)) {
      parsedQuestions = parseQuestionsFromXlsxBuffer(buffer);
    } else {
      const pdfData = await pdf(buffer);
      const text = pdfData.text ?? '';
      parsedQuestions = extractOrderedOptionsQuestionsFromText(text);
      if (parsedQuestions.length === 0) parsedQuestions = extractQuestionsFallbackFromText(text);
      parsedQuestions = enrichQuestionsWithSource(parsedQuestions, text);
    }

    const clean = Array.from(
      new Map(
        parsedQuestions
          .filter((q) => q.enunciado && q.respuesta_correcta && q.opciones.length >= 2)
          .map((q) => [normalizeQuestion(q.enunciado), q])
      ).values()
    ).slice(0, 50);

    if (clean.length === 0) {
      return { success: false, message: 'No se encontraron preguntas validas para el simulador premium.' };
    }

    const admin: AdminSupabaseClient = createAdminClient();
    const { data: setRow, error: setError } = await admin
      .from('premium_question_sets')
      .insert({
        materia_id: input.materiaId,
        parcial: input.parcial,
        titulo: input.titulo,
        source_exam_date: input.sourceExamDate ?? null,
        created_by: user.id,
        is_active: true,
      })
      .select('id')
      .single();

    const setId = (setRow as { id?: string } | null)?.id;
    if (setError || !setId) throw setError ?? new Error('No se pudo crear el set premium.');

    const rows = clean.map((q, index) => ({
      set_id: setId,
      enunciado: q.enunciado,
      opciones: q.opciones,
      respuesta_correcta: q.respuesta_correcta,
      orden: index + 1,
    }));

    const { error: insertError } = await admin.from('premium_questions').insert(rows);
    if (insertError) throw insertError;

    revalidatePath('/admin');
    return {
      success: true,
      count: rows.length,
      message: `Simulador premium importado con ${rows.length} preguntas.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo importar el simulador premium.',
    };
  }
}


