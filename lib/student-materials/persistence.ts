import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import {
  buildSummaryChunks,
  cleanLine,
  extractPdfTextAndPageCount,
  parseSections,
} from '@/lib/student-materials/text';
import { generateStudentMaterialGlossary } from '@/lib/student-materials/glossary';
import { generateStudentMaterialSummary } from '@/lib/student-materials/summary';
import type {
  AdminClient,
  PersistSummaryArtifactsInput,
  StoredGlossaryRow,
  StoredSummaryRow,
  StudyGlossaryItem,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

function isMissingSummaryTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';

  return code === '42P01' || /student_material_(summaries|chunks|glossaries)/i.test(message);
}

function parseKeyPoints(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanLine(String(item ?? ''))).filter(Boolean);
}

function mapStoredSummary(row: StoredSummaryRow): StudentMaterialSummary {
  return {
    shortSummary: cleanLine(row.summary_short ?? ''),
    keyPoints: parseKeyPoints(row.key_points),
    sections: parseSections(row.summary_sections),
    hasContent: cleanLine(row.summary_short ?? '').length > 0,
    status:
      row.status === 'pending' || row.status === 'error' || row.status === 'ready'
        ? row.status
        : 'ready',
    provider: row.provider ?? 'persisted',
    errorMessage: row.error_message ?? null,
    sourceChunksCount: row.source_chunks_count ?? 0,
  };
}

function sentenceCase(value: string) {
  const text = cleanLine(value);
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sanitizeGlossaryItems(items: StudyGlossaryItem[]): StudyGlossaryItem[] {
  return items
    .map((item) => ({
      term: sentenceCase(item.term),
      definition: cleanLine(item.definition),
      context: cleanLine(item.context),
      importance: item.importance === 'alta' ? ('alta' as const) : ('media' as const),
    }))
    .filter((item) => item.term.length >= 3 && item.definition.length >= 12);
}

function parseGlossaryItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  const items: StudyGlossaryItem[] = value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

        return {
          term: 'term' in item ? String(item.term ?? '') : '',
          definition: 'definition' in item ? String(item.definition ?? '') : '',
          context: 'context' in item ? String(item.context ?? '') : '',
          importance: 'importance' in item && item.importance === 'alta' ? ('alta' as const) : ('media' as const),
        } satisfies StudyGlossaryItem;
      })
      .filter((item): item is StudyGlossaryItem => Boolean(item));

  return sanitizeGlossaryItems(items);
}

function mapStoredGlossary(row: StoredGlossaryRow): StudyGlossaryItem[] {
  if (row.status === 'error') {
    return [];
  }

  return parseGlossaryItems(row.glossary_items);
}

export async function persistStudentMaterialGlossaryArtifacts(input: {
  admin: AdminClient;
  studentMaterialId: string;
  glossary: StudyGlossaryItem[];
  provider: string;
  errorMessage?: string | null;
}) {
  const { error } = await input.admin
    .from('student_material_glossaries')
    .upsert(
      {
        student_material_id: input.studentMaterialId,
        status: input.glossary.length > 0 ? 'ready' : 'error',
        glossary_items: input.glossary,
        provider: input.provider,
        error_message: input.errorMessage ?? null,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'student_material_id' }
    );

  if (error) {
    throw error;
  }
}

export async function persistStudentMaterialSummaryArtifacts(input: PersistSummaryArtifactsInput) {
  const chunks = buildSummaryChunks(input.text);
  const summary = await generateStudentMaterialSummary({
    title: input.title,
    universidadName: input.universidadName,
    carreraName: input.carreraName,
    materiaName: input.materiaName,
    text: input.text,
  });
  const glossary = await generateStudentMaterialGlossary(
    {
      title: input.title,
      universidadName: input.universidadName,
      carreraName: input.carreraName,
      materiaName: input.materiaName,
      text: input.text,
    },
    summary
  );

  try {
    await input.admin.from('student_material_chunks').delete().eq('student_material_id', input.studentMaterialId);

    if (chunks.length > 0) {
      const rows = chunks.map((chunk, index) => ({
        student_material_id: input.studentMaterialId,
        chunk_index: index,
        chunk_text: chunk,
      }));

      const { error: chunkInsertError } = await input.admin.from('student_material_chunks').insert(rows);

      if (chunkInsertError) {
        throw chunkInsertError;
      }
    }

    const { error: summaryUpsertError } = await input.admin
      .from('student_material_summaries')
      .upsert(
        {
          student_material_id: input.studentMaterialId,
          status: summary.hasContent ? 'ready' : 'error',
          summary_short: summary.shortSummary,
          key_points: summary.keyPoints,
          summary_sections: summary.sections,
          source_chunks_count: summary.sourceChunksCount,
          provider: summary.provider,
          error_message: summary.errorMessage,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'student_material_id' }
      );

    if (summaryUpsertError) {
      throw summaryUpsertError;
    }

    await persistStudentMaterialGlossaryArtifacts({
      admin: input.admin,
      studentMaterialId: input.studentMaterialId,
      glossary,
      provider: summary.provider,
      errorMessage: summary.errorMessage,
    });
  } catch (error) {
    if (!isMissingSummaryTableError(error)) {
      throw error;
    }
  }

  return summary;
}

export async function fetchStudentMaterialSummary(
  admin: AdminClient,
  studentMaterialId: string
): Promise<StudentMaterialSummary | null> {
  try {
    const { data, error } = await admin
      .from('student_material_summaries')
      .select(
        'status, summary_short, key_points, summary_sections, provider, source_chunks_count, error_message'
      )
      .eq('student_material_id', studentMaterialId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;
    return mapStoredSummary(data as StoredSummaryRow);
  } catch (error) {
    if (!isMissingSummaryTableError(error)) {
      logError('studentMaterialSummary.fetch', error, { studentMaterialId });
    }
    return null;
  }
}

export async function fetchStudentMaterialGlossary(
  admin: AdminClient,
  studentMaterialId: string
): Promise<StudyGlossaryItem[] | null> {
  try {
    const { data, error } = await admin
      .from('student_material_glossaries')
      .select('status, glossary_items, provider, error_message')
      .eq('student_material_id', studentMaterialId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;
    return mapStoredGlossary(data as StoredGlossaryRow);
  } catch (error) {
    if (!isMissingSummaryTableError(error)) {
      logError('studentMaterialGlossary.fetch', error, { studentMaterialId });
    }
    return null;
  }
}

export async function persistStudentMaterialSummaryFromComputed(input: {
  admin: AdminClient;
  studentMaterialId: string;
  text: string;
  summary: StudentMaterialSummary;
  persistChunks: boolean;
}) {
  try {
    if (input.persistChunks) {
      const chunks = buildSummaryChunks(input.text);
      await input.admin.from('student_material_chunks').delete().eq('student_material_id', input.studentMaterialId);

      if (chunks.length > 0) {
        const rows = chunks.map((chunk, index) => ({
          student_material_id: input.studentMaterialId,
          chunk_index: index,
          chunk_text: chunk,
        }));

        const { error: chunkInsertError } = await input.admin.from('student_material_chunks').insert(rows);
        if (chunkInsertError) {
          throw chunkInsertError;
        }
      }
    }

    const { error: summaryUpsertError } = await input.admin
      .from('student_material_summaries')
      .upsert(
        {
          student_material_id: input.studentMaterialId,
          status: input.summary.hasContent ? 'ready' : 'error',
          summary_short: input.summary.shortSummary,
          key_points: input.summary.keyPoints,
          summary_sections: input.summary.sections,
          source_chunks_count: input.summary.sourceChunksCount,
          provider: input.summary.provider,
          error_message: input.summary.errorMessage,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'student_material_id' }
      );

    if (summaryUpsertError) {
      throw summaryUpsertError;
    }
  } catch (error) {
    if (!isMissingSummaryTableError(error)) {
      throw error;
    }
  }
}

export async function ensureStudentMaterialStudyArtifacts(input: {
  admin: AdminClient;
  studentMaterialId: string;
  filePath: string;
  title: string;
  universidadName?: string;
  carreraName?: string;
  materiaName?: string;
  allowOnDemandRegeneration?: boolean;
}) {
  const [persistedSummary, persistedGlossary] = await Promise.all([
    fetchStudentMaterialSummary(input.admin, input.studentMaterialId),
    fetchStudentMaterialGlossary(input.admin, input.studentMaterialId),
  ]);

  if (persistedSummary && persistedGlossary) {
    return {
      studySummary: persistedSummary,
      studyGlossary: persistedGlossary,
    };
  }

  if (!input.allowOnDemandRegeneration) {
    return {
      studySummary:
        persistedSummary ??
        ({
          shortSummary: 'Todavia no encontramos un resumen persistido para este material.',
          keyPoints: [],
          sections: [],
          hasContent: false,
          status: 'pending',
          provider: 'persisted-missing',
          errorMessage: 'Resumen pendiente de persistencia',
          sourceChunksCount: 0,
        } satisfies StudentMaterialSummary),
      studyGlossary: persistedGlossary ?? [],
    };
  }

  const { data: fileData, error } = await input.admin.storage.from('biblioteca').download(input.filePath);

  if (error || !fileData) {
    return {
      studySummary:
        persistedSummary ??
        ({
          shortSummary: 'No pudimos leer el PDF para generar un resumen.',
          keyPoints: [],
          sections: [],
          hasContent: false,
          status: 'error',
          provider: 'fallback-local',
          errorMessage: 'No pudimos leer el archivo',
          sourceChunksCount: 0,
        } satisfies StudentMaterialSummary),
      studyGlossary: persistedGlossary ?? [],
    };
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const { text } = await extractPdfTextAndPageCount(buffer);

  const resolvedSummary =
    persistedSummary ??
    (await generateStudentMaterialSummary({
      title: input.title,
      universidadName: input.universidadName,
      carreraName: input.carreraName,
      materiaName: input.materiaName,
      text,
    }));

  if (!persistedSummary) {
    await persistStudentMaterialSummaryFromComputed({
      admin: input.admin,
      studentMaterialId: input.studentMaterialId,
      text,
      summary: resolvedSummary,
      persistChunks: true,
    });
  }

  const resolvedGlossary =
    persistedGlossary ??
    (await generateStudentMaterialGlossary(
      {
        title: input.title,
        universidadName: input.universidadName,
        carreraName: input.carreraName,
        materiaName: input.materiaName,
        text,
      },
      resolvedSummary
    ));

  if (!persistedGlossary) {
    try {
      await persistStudentMaterialGlossaryArtifacts({
        admin: input.admin,
        studentMaterialId: input.studentMaterialId,
        glossary: resolvedGlossary,
        provider: resolvedSummary.provider,
        errorMessage: resolvedSummary.errorMessage,
      });
    } catch (persistError) {
      if (!isMissingSummaryTableError(persistError)) {
        logError('studentMaterialGlossary.persist', persistError, {
          studentMaterialId: input.studentMaterialId,
          filePath: input.filePath,
        });
      }
    }
  }

  return {
    studySummary: resolvedSummary,
    studyGlossary: resolvedGlossary,
  };
}

export async function buildStudentMaterialSummaryFromFile(
  filePath: string,
  title: string
): Promise<StudentMaterialSummary> {
  const admin = createAdminClient();
  const { data: fileData, error } = await admin.storage.from('biblioteca').download(filePath);

  if (error || !fileData) {
    return {
      shortSummary: 'No pudimos leer el PDF para generar un resumen.',
      keyPoints: [],
      sections: [],
      hasContent: false,
      status: 'error',
      provider: 'fallback-local',
      errorMessage: 'No pudimos leer el archivo',
      sourceChunksCount: 0,
    };
  }

  try {
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { text } = await extractPdfTextAndPageCount(buffer);
    return await generateStudentMaterialSummary({ title, text });
  } catch (summaryError) {
    logError('studentMaterialSummary.build', summaryError, { filePath, title });
    return {
      shortSummary: 'No pudimos procesar el contenido del PDF para generar el resumen.',
      keyPoints: [],
      sections: [],
      hasContent: false,
      status: 'error',
      provider: 'fallback-local',
      errorMessage: 'No pudimos procesar el contenido',
      sourceChunksCount: 0,
    };
  }
}
