'use server';

import pdf from 'pdf-parse-fork';
import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

export interface ProcessResult {
  success: boolean;
  count?: number;
  duplicates?: number;
  invalid?: number;
  message: string;
}

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

type QuestionRecord = {
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
};

const GENERIC_DISTRACTORS = new Set([
  'ninguna opcion es correcta',
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

function buildQuestionFingerprint(question: QuestionRecord) {
  const enunciado = normalizeQuestion(question.enunciado);
  const respuestaCorrecta = question.respuesta_correcta
    .split('|')
    .map((part) => normalizeOptionValue(part))
    .filter(Boolean)
    .sort()
    .join('|');
  const opciones = dedupeOptions(question.opciones)
    .map((option) => normalizeOptionValue(option))
    .filter(Boolean)
    .sort()
    .join('|');

  return `${enunciado}::${respuestaCorrecta}::${opciones}`;
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSpreadsheetKey(value: unknown): string {
  return normalizeCellValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getSpreadsheetValue(row: Record<string, unknown>, aliases: string[]): unknown {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeSpreadsheetKey(key),
    value,
  ] as const);

  for (const alias of aliases) {
    const normalizedAlias = normalizeSpreadsheetKey(alias);
    const match = normalizedEntries.find(([key]) => key === normalizedAlias);
    if (match) return match[1];
  }

  return undefined;
}

function parseCorrectAnswerParts(rawValue: unknown): string[] {
  const normalized = normalizeCellValue(rawValue);
  if (!normalized) return [];

  return normalized
    .split(/\s*(?:\||;|\/{2}|\/|\n)\s*/g)
    .map((part) => normalizeCellValue(part))
    .filter(Boolean);
}

async function getExistingQuestionDedupIndex(
  admin: AdminSupabaseClient
): Promise<{
  normalizedQuestions: Set<string>;
  fingerprints: Set<string>;
}> {
  const [bankRows, premiumRows] = await Promise.all([
    admin.from('preguntas_banco').select('enunciado, respuesta_correcta, opciones').limit(50000),
    admin.from('premium_questions').select('enunciado, respuesta_correcta, opciones').limit(50000),
  ]);

  if (bankRows.error) throw bankRows.error;
  if (premiumRows.error) throw premiumRows.error;

  const normalizedQuestions = new Set<string>();
  const fingerprints = new Set<string>();
  const sourceRows = [...(bankRows.data ?? []), ...(premiumRows.data ?? [])];

  for (const row of sourceRows) {
    const enunciado = normalizeCellValue(row.enunciado);
    if (!enunciado) continue;

    normalizedQuestions.add(normalizeQuestion(enunciado));
    fingerprints.add(
      buildQuestionFingerprint({
        enunciado,
        respuesta_correcta: normalizeCellValue(row.respuesta_correcta),
        opciones: Array.isArray(row.opciones)
          ? row.opciones.filter((option): option is string => typeof option === 'string')
          : [],
      })
    );
  }

  return { normalizedQuestions, fingerprints };
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

function parseQuestionsFromXlsxBuffer(buffer: Buffer): QuestionRecord[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const xlsx = require('xlsx') as {
    read: (data: Buffer, options: { type: 'buffer' }) => {
      SheetNames: string[];
      Sheets: Record<string, unknown>;
    };
    utils: {
      sheet_to_json: (
        sheet: unknown,
        options: { defval: string }
      ) => Array<Record<string, unknown>>;
    };
  };

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  const questions: QuestionRecord[] = [];

  for (const row of rows) {
    const enunciado = normalizeCellValue(
      getSpreadsheetValue(row, ['pregunta', 'enunciado', 'question', 'pregunta_enunciado'])
    );
    const respuestasCorrectas = parseCorrectAnswerParts(
      getSpreadsheetValue(row, ['respuesta_correcta', 'correcta', 'correct_answer', 'respuesta'])
    );
    const respuestaCorrecta = respuestasCorrectas.join('|');

    const optionKeys = [
      ['opcion_a', 'respuesta_a', 'a'],
      ['opcion_b', 'respuesta_b', 'b'],
      ['opcion_c', 'respuesta_c', 'c'],
      ['opcion_d', 'respuesta_d', 'd'],
      ['opcion_e', 'respuesta_e', 'e'],
      ['opcion_f', 'respuesta_f', 'f'],
    ];
    let opciones = optionKeys
      .map((aliases) => normalizeCellValue(getSpreadsheetValue(row, aliases)))
      .filter(Boolean);

    if (opciones.length === 0) {
      const incorrectasRaw = normalizeCellValue(
        getSpreadsheetValue(row, [
          'respuestas_incorrectas',
          'incorrectas',
          'wrong_answers',
          'distractores',
        ])
      );
      const incorrectas = incorrectasRaw
        ? incorrectasRaw
            .split(/\s*(?:\||;|,{2,}|\/{2}|\/|\n)\s*/g)
            .map((part) => normalizeCellValue(part))
            .filter(Boolean)
        : [];
      opciones = [...respuestasCorrectas, ...incorrectas].filter(Boolean);
    }

    const opcionesUnicas = dedupeOptions(opciones).slice(0, 6);
    if (!enunciado || !respuestaCorrecta || opcionesUnicas.length < 2) continue;

    const correctAnswersNormalized = respuestasCorrectas.map((answer) => normalizeQuestion(answer));
    const faltantesCorrectas = respuestasCorrectas.filter(
      (answer) =>
        !opcionesUnicas.some((opt) => normalizeQuestion(opt) === normalizeQuestion(answer))
    );
    const finalOpciones = dedupeOptions([...opcionesUnicas, ...faltantesCorrectas]).slice(0, 6);

    const tieneAlgunaCorrecta = finalOpciones.some((opt) =>
      correctAnswersNormalized.includes(normalizeQuestion(opt))
    );
    if (!tieneAlgunaCorrecta) continue;

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

  return questions
    .map((question) => {
      let correct = question.respuesta_correcta.replace(/\s+/g, ' ').trim();
      let options = question.opciones
        .map((opt) => opt.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

      if (correct.endsWith(',') || correct.length < 8) {
        const candidate = answerPool.find((answer) =>
          normalizeQuestion(answer).startsWith(normalizeQuestion(correct.replace(/[,:;.]+$/, '')))
        );
        if (candidate) correct = candidate;
      }

      options = options.filter(
        (opt) => !GENERIC_DISTRACTORS.has(opt.toLowerCase().trim())
      );

      if (!options.some((opt) => normalizeQuestion(opt) === normalizeQuestion(correct))) {
        options.unshift(correct);
      }

      if (options.length < 4) {
        const distractors = buildPlausibleDistractors(correct, answerPool);
        options = [
          correct,
          ...options.filter((opt) => normalizeQuestion(opt) !== normalizeQuestion(correct)),
          ...distractors,
        ];
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
    })
    .filter((question) => question.opciones.length >= 2);
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

      parsedQuestions = extractOrderedOptionsQuestionsFromText(text);
      if (parsedQuestions.length === 0) {
        parsedQuestions = extractQuestionsFallbackFromText(text);
      }
      parsedQuestions = enrichQuestionsWithSource(parsedQuestions, text);
    }

    const { normalizedQuestions: existingNormalized, fingerprints: existingFingerprints } =
      await getExistingQuestionDedupIndex(supabase);
    const dedupeAgainstPregunteros = tipo === 'Preguntero';

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
    const duplicatesInsideFile = Math.max(
      0,
      parsedQuestions.length - uniqueParsedQuestions.length
    );
    const invalidQuestions = uniqueParsedQuestions.filter(
      (question) => !question.enunciado || question.opciones.length < 2
    ).length;

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

    const duplicatesAgainstDatabase = uniqueParsedQuestions.length - questionsToInsert.length;
    const duplicates = duplicatesInsideFile + duplicatesAgainstDatabase;

    if (questionsToInsert.length === 0) {
      return {
        success: true,
        count: 0,
        duplicates,
        invalid: invalidQuestions,
        message: 'No se detectaron preguntas nuevas para importar. Verifica formato y duplicados.',
      };
    }

    const { error: insertError } = await supabase.from('preguntas_banco').insert(questionsToInsert);
    if (insertError) {
      throw insertError;
    }

    revalidatePath('/administrador');

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
    logError('admin.analizarMaterialIA', error);
    return {
      success: false,
      message,
    };
  }
}
