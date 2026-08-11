'use server';

import { revalidatePath } from 'next/cache';
import { generateTutorExplanation } from '@/lib/ai-tutor';
import { requireAdminAccess } from '@/lib/auth';
import { runSimulatorExplanationWarmup } from '@/lib/simulator-explanation-warmup';
import { createAdminClient } from '@/lib/supabase-admin';
import type { MateriaImportEntryInput } from './import-helpers';

export interface IARankingRow {
  pregunta_id: string;
  materia_id: string | null;
  materia_nombre: string | null;
  parcial: number | null;
  enunciado: string;
  veces_fallada: number;
  explicacion: string | null;
  provider: string | null;
  updated_at: string | null;
}

export interface FeedbackReviewItem {
  pregunta_id: string;
  enunciado: string;
  voto: number;
  created_at: string;
  explicacion: string | null;
  provider: string | null;
}

export interface IAWarmupAdminResult {
  success: boolean;
  message: string;
  result?: Awaited<ReturnType<typeof runSimulatorExplanationWarmup>>;
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

function revalidateAdministrador() {
  revalidatePath('/administrador');
}

async function contarFilasTabla(
  tableName: 'rag_explanations_cache',
  pageSize = 1000
): Promise<number> {
  const admin = createAdminClient();
  let total = 0;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await admin.from(tableName).select('id').range(from, to);
    if (error) throw error;

    const rows = data ?? [];
    total += rows.length;
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return total;
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

    if (error) throw error;
    revalidateAdministrador();
    return { success: true, message: 'Prompt actualizado correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar el prompt.',
    };
  }
}

export async function crearMateriaCompartidaAdministrador(input: {
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
      const { error: insertRelationsError } = await admin.from('carrera_materias').insert(rowsToInsert);
      if (insertRelationsError) throw insertRelationsError;
    }

    revalidateAdministrador();
    return {
      success: true,
      materiaId,
      message:
        rowsToInsert.length > 0
          ? 'Materia creada y asignada a las carreras seleccionadas.'
          : 'La materia ya existía y mantuvimos sus asignaciones actuales.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo crear la materia compartida.',
    };
  }
}

export async function desasignarMateriaDeCarreraAdministrador(input: {
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
      await admin.from('materias').update({ carrera_id: null }).eq('id', input.materiaId);
    }

    revalidateAdministrador();
    return { success: true, message: 'La materia ya no aparece en esa carrera.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo desasignar la materia de la carrera.',
    };
  }
}

export async function importarMateriasDesdeExcelAdministrador(input: {
  universidadId: string;
  entries: MateriaImportEntryInput[];
}): Promise<MateriaImportResult> {
  try {
    const { supabase: admin } = await requireAdminAccess();
    const universidadId = input.universidadId?.trim();
    const entries = input.entries;

    if (!universidadId) {
      return { success: false, message: 'Selecciona una universidad antes de importar la malla.' };
    }

    const normalizedEntriesMap = new Map<string, { materia: string; carreras: Set<string> }>();
    for (const rawEntry of entries) {
      const materia = rawEntry.materia.trim();
      if (!materia) continue;
      const normalizedMateria = normalizeAdminText(materia);
      const current = normalizedEntriesMap.get(normalizedMateria) ?? { materia, carreras: new Set<string>() };

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
      return { success: false, message: 'El archivo no trajo materias válidas para importar.' };
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
      const rowsToCreate = missingCareerNames.map((nombre) => ({ nombre, universidad_id: universidadId }));
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
        if (!carreraRow?.id) continue;
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
        message: 'No encontramos carreras válidas para asociar en este archivo.',
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

    const materiaIds = Array.from(
      new Set(
        Array.from(carreraIdsByMateria.keys())
          .map((normalizedMateria) => materiaByNormalizedName.get(normalizedMateria)?.id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const existingRelations =
      materiaIds.length > 0
        ? await admin.from('carrera_materias').select('materia_id, carrera_id').in('materia_id', materiaIds)
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
        rowsToInsert.push({ materia_id: materiaRow.id, carrera_id: carreraId });
      }
    }

    if (rowsToInsert.length > 0) {
      const { error: insertRelationsError } = await admin.from('carrera_materias').insert(rowsToInsert);
      if (insertRelationsError) throw insertRelationsError;
    }

    revalidateAdministrador();
    return {
      success: true,
      message: `Importación completa: ${carrerasCreated} carreras nuevas, ${materiasCreated} materias nuevas y ${rowsToInsert.length} asignaciones creadas.`,
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
      message: error instanceof Error ? error.message : 'No se pudo importar la malla de materias.',
    };
  }
}

export async function obtenerRankingErroresIA(
  limit = 30
): Promise<{ success: boolean; rows?: IARankingRow[]; message?: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const [statsRes, cacheRes] = await Promise.all([
      admin
        .from('rag_question_stats')
        .select('pregunta_id, materia_id, veces_fallada, updated_at')
        .order('veces_fallada', { ascending: false })
        .limit(limit * 3),
      admin
        .from('rag_explanations_cache')
        .select('pregunta_id, materia_id, parcial, explicacion, provider, updated_at')
        .order('updated_at', { ascending: false })
        .limit(limit * 3),
    ]);

    if (statsRes.error) throw statsRes.error;
    if (cacheRes.error) throw cacheRes.error;

    const stats = statsRes.data ?? [];
    const cache = cacheRes.data ?? [];
    if (stats.length === 0 && cache.length === 0) return { success: true, rows: [] };

    const statMap = new Map(stats.map((item) => [item.pregunta_id, item]));
    const cacheMap = new Map(cache.map((item) => [item.pregunta_id, item]));
    const questionIds = Array.from(new Set([...statMap.keys(), ...cacheMap.keys()]));

    const [{ data: questions }, { data: materias }] = await Promise.all([
      admin.from('preguntas_banco').select('id, enunciado, parcial, materia_id').in('id', questionIds),
      admin.from('materias').select('id, nombre'),
    ]);

    const qMap = new Map((questions ?? []).map((q) => [q.id, q]));
    const materiaMap = new Map((materias ?? []).map((m) => [m.id, m.nombre]));

    const rows: IARankingRow[] = questionIds
      .map((preguntaId) => {
        const stat = statMap.get(preguntaId);
        const cached = cacheMap.get(preguntaId);
        const q = qMap.get(preguntaId);
        const materiaId = stat?.materia_id ?? cached?.materia_id ?? q?.materia_id ?? null;

        return {
          pregunta_id: preguntaId,
          materia_id: materiaId,
          materia_nombre: materiaId ? materiaMap.get(materiaId) ?? null : null,
          parcial: q?.parcial ?? cached?.parcial ?? null,
          enunciado: q?.enunciado ?? '(Pregunta no encontrada)',
          veces_fallada: stat?.veces_fallada ?? 0,
          explicacion: cached?.explicacion ?? null,
          provider: cached?.provider ?? null,
          updated_at: cached?.updated_at ?? stat?.updated_at ?? null,
        };
      })
      .sort((a, b) => {
        if (b.veces_fallada !== a.veces_fallada) return b.veces_fallada - a.veces_fallada;
        return (b.updated_at ?? '').localeCompare(a.updated_at ?? '');
      })
      .slice(0, limit);

    return { success: true, rows };
  } catch (error) {
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
      throw new Error('No encontramos la pregunta para regenerar la explicación.');
    }

    const { data: chunkRows } = await admin
      .from('rag_document_chunks')
      .select('chunk_text, source_title')
      .eq('materia_id', question.materia_id)
      .limit(120);

    const queryTokens = question.enunciado.toLowerCase().split(/\s+/).filter((token) => token.length >= 4);
    const context = (chunkRows ?? [])
      .map((row) => {
        const text = row.chunk_text ?? '';
        const lowered = text.toLowerCase();
        const score = queryTokens.reduce((acc, token) => acc + (lowered.includes(token) ? 1 : 0), 0);
        return { score, text: `${row.source_title ? `[${row.source_title}] ` : ''}${text}` };
      })
      .sort((a, b) => b.score - a.score)
      .filter((row) => row.score > 0)
      .slice(0, 4)
      .map((row) => row.text);

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

    if (cacheError) throw cacheError;

    await admin.from('rag_generation_logs').insert({
      pregunta_id: question.id,
      materia_id: question.materia_id,
      provider: generated.provider,
      status: 'ok',
      metadata: { regenerated_from_admin: true, context_chunks: context.length },
    });

    revalidateAdministrador();
    return {
      success: true,
      message: `Explicación regenerada con ${generated.provider}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo regenerar la explicación.',
    };
  }
}

export async function obtenerFeedbackExplicacionesAdmin() {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const [{ data, error }, cacheCountRes] = await Promise.all([
      admin
        .from('rag_explanation_feedback')
        .select('voto, pregunta_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10000),
      admin.from('rag_explanations_cache').select('id', { count: 'exact', head: true }),
    ]);
    if (error) throw error;
    if (cacheCountRes.error) throw cacheCountRes.error;

    const generatedCount =
      typeof cacheCountRes.count === 'number' ? cacheCountRes.count : await contarFilasTabla('rag_explanations_cache');

    const positive = (data ?? []).filter((row) => row.voto === 1).length;
    const negative = (data ?? []).filter((row) => row.voto === -1).length;
    return {
      success: true,
      stats: {
        total: (data ?? []).length,
        positive,
        negative,
        generatedCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo obtener feedback.',
    };
  }
}

export async function ejecutarWarmupExplicacionesIA(input?: {
  dryRun?: boolean;
  batchSize?: number;
  candidatePoolSize?: number;
  maxEstimatedTokens?: number;
  lookbackDays?: number;
}): Promise<IAWarmupAdminResult> {
  try {
    await requireAdminAccess();

    const result = await runSimulatorExplanationWarmup({
      dryRun: input?.dryRun,
      batchSize: input?.batchSize,
      candidatePoolSize: input?.candidatePoolSize,
      maxEstimatedTokens: input?.maxEstimatedTokens,
      lookbackDays: input?.lookbackDays,
    });

    revalidateAdministrador();

    return {
      success: true,
      message: result.dryRun
        ? `Simulacion lista: ${result.selectedCount} preguntas candidatas y ${result.totalEstimatedTokens.toLocaleString('es-AR')} tokens estimados.`
        : `Warmup ejecutado: ${result.generatedCount} explicaciones generadas y ${result.skippedCount} omitidas.`,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo ejecutar el warmup de explicaciones.',
    };
  }
}

export async function obtenerFeedbackRevisionAdmin(
  limit = 30
): Promise<{ success: boolean; rows?: FeedbackReviewItem[]; message?: string }> {
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
      admin.from('rag_explanations_cache').select('pregunta_id, explicacion, provider').in('pregunta_id', questionIds),
    ]);

    const questionMap = new Map((questions ?? []).map((question) => [question.id, question.enunciado]));
    const explanationMap = new Map(
      (explanations ?? []).map((item) => [
        item.pregunta_id,
        { explicacion: item.explicacion, provider: item.provider },
      ])
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
      message: error instanceof Error ? error.message : 'No se pudo cargar el feedback para revisión.',
    };
  }
}
