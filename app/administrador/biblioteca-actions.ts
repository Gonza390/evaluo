'use server';

import { revalidatePath } from 'next/cache';
import pdf from 'pdf-parse-fork';
import {
  analizarMaterialConIA,
} from './material-analysis';
import {
  crearMateriaCompartidaAdministrador,
  desasignarMateriaDeCarreraAdministrador,
} from './shared-actions';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

function normalizePdfPreviewText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
}

async function extractFirstPdfPagesFingerprint(buffer: ArrayBuffer) {
  const parsed = await pdf(Buffer.from(buffer), { max: 2 });
  return normalizePdfPreviewText(parsed.text ?? '');
}

async function extractPdfPageCount(buffer: ArrayBuffer) {
  const parsed = (await pdf(Buffer.from(buffer))) as { numpages?: number; numrender?: number };
  const pageCount = parsed.numpages ?? parsed.numrender ?? null;
  return typeof pageCount === 'number' && Number.isFinite(pageCount) ? pageCount : null;
}

async function getPdfPageCountForStoragePath(
  admin: ReturnType<typeof createAdminClient>,
  filePath: string
) {
  if (!filePath.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  const { data: fileData, error } = await admin.storage.from('biblioteca').download(filePath);
  if (error || !fileData) {
    throw error ?? new Error('No pudimos leer el PDF para calcular la cantidad de páginas.');
  }

  return extractPdfPageCount(await fileData.arrayBuffer());
}

async function findDuplicatePdfForMateria(input: {
  materiaId: string;
  recursoType: 'Preguntero' | 'Resumen' | 'Trabajo Práctico';
  filePath: string;
}) {
  if (!input.filePath.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  const admin = createAdminClient();
  const { data: uploadedFile, error: uploadedFileError } = await admin.storage
    .from('biblioteca')
    .download(input.filePath);

  if (uploadedFileError || !uploadedFile) {
    throw uploadedFileError ?? new Error('No pudimos leer el PDF cargado para verificar duplicados.');
  }

  const uploadedFingerprint = await extractFirstPdfPagesFingerprint(await uploadedFile.arrayBuffer());
  if (!uploadedFingerprint) {
    return null;
  }

  const existingPaths = new Set<string>();

  if (input.recursoType === 'Resumen') {
    const [recursosResult, resumenesResult] = await Promise.all([
      admin
        .from('recursos')
        .select('url_archivo, nombre, etiqueta')
        .eq('materia_id', input.materiaId)
        .in('tipo', ['resumen-modulo', 'primer-parcial', 'segundo-parcial']),
      admin.from('resumenes').select('file_url, title').eq('materia_id', input.materiaId),
    ]);

    if (recursosResult.error) throw recursosResult.error;
    if (resumenesResult.error) throw resumenesResult.error;

    for (const row of recursosResult.data ?? []) {
      if (row.url_archivo && row.url_archivo !== input.filePath) {
        existingPaths.add(row.url_archivo);
      }
    }

    for (const row of resumenesResult.data ?? []) {
      if (row.file_url && row.file_url !== input.filePath) {
        existingPaths.add(row.file_url);
      }
    }
  } else if (input.recursoType === 'Trabajo Práctico') {
    const [recursosResult, materialesResult] = await Promise.all([
      admin
        .from('recursos')
        .select('url_archivo, nombre, etiqueta')
        .eq('materia_id', input.materiaId)
        .in('tipo', ['tp-p1', 'tp-p2']),
      admin
        .from('materiales')
        .select('archivo_url, titulo')
        .eq('materia_id', input.materiaId)
        .eq('tipo', input.recursoType),
    ]);

    if (recursosResult.error) throw recursosResult.error;
    if (materialesResult.error) throw materialesResult.error;

    for (const row of recursosResult.data ?? []) {
      if (row.url_archivo && row.url_archivo !== input.filePath) {
        existingPaths.add(row.url_archivo);
      }
    }

    for (const row of materialesResult.data ?? []) {
      if (row.archivo_url && row.archivo_url !== input.filePath) {
        existingPaths.add(row.archivo_url);
      }
    }
  } else {
    return null;
  }

  for (const existingPath of existingPaths) {
    if (!existingPath.toLowerCase().endsWith('.pdf')) {
      continue;
    }

    const { data: existingFile, error: existingFileError } = await admin.storage
      .from('biblioteca')
      .download(existingPath);

    if (existingFileError || !existingFile) {
      continue;
    }

    const existingFingerprint = await extractFirstPdfPagesFingerprint(await existingFile.arrayBuffer());
    if (!existingFingerprint) {
      continue;
    }

    if (existingFingerprint === uploadedFingerprint) {
      return existingPath;
    }
  }

  return null;
}

function revalidateBibliotecaPanels() {
  revalidatePath('/administrador');
}

export async function procesarCargaMaterialBibliotecaAdministrador(input: {
  universidadId: string;
  materiaId: string;
  carreraId: string | null;
  recursoType: 'Preguntero' | 'Resumen' | 'Trabajo Práctico';
  pregunteroDestino?: 'ambas' | 'solo_simulador' | 'solo_visualizacion';
  eliminarArchivoTrasProcesar?: boolean;
  subTipo: string;
  resumenModules: string[];
  resumenParcial: string;
  filePath: string;
  fileName: string;
  usarIAEnCarga?: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const isResumen = input.recursoType === 'Resumen';
    const isPreguntero = input.recursoType === 'Preguntero';
    const hasResumenSelection = input.resumenModules.length > 0 || Boolean(input.resumenParcial);
    const shouldExtractQuestions = !isPreguntero || input.pregunteroDestino !== 'solo_visualizacion';
    const shouldPublishAsResource = !isPreguntero || input.pregunteroDestino !== 'solo_simulador';
    const shouldDeleteAfterExtract =
      isPreguntero &&
      input.pregunteroDestino === 'solo_simulador' &&
      Boolean(input.eliminarArchivoTrasProcesar);
    const shouldInsertMaterialRecord = !shouldDeleteAfterExtract;

    if (!input.universidadId || !input.materiaId || !input.filePath) {
      return { success: false, message: 'Faltan datos para registrar el material.' };
    }

    if ((!isResumen && !input.subTipo) || (isResumen && !hasResumenSelection)) {
      return { success: false, message: 'Completa la clasificacion del material antes de continuar.' };
    }

    if (isResumen || input.recursoType === 'Trabajo Práctico') {
      const duplicatePath = await findDuplicatePdfForMateria({
        materiaId: input.materiaId,
        recursoType: input.recursoType === 'Trabajo Práctico' ? 'Trabajo Práctico' : 'Resumen',
        filePath: input.filePath,
      });

      if (duplicatePath) {
        await admin.storage.from('biblioteca').remove([input.filePath]).catch(() => undefined);
        return {
          success: false,
          message:
            'Detectamos que este PDF ya estaba cargado para esta materia. Comparamos las primeras 2 páginas y coincide con un archivo existente.',
        };
      }
    }

    const materiaSeleccionada = await admin
      .from('materias')
      .select('slug, nombre')
      .eq('id', input.materiaId)
      .maybeSingle();

    if (materiaSeleccionada.error) {
      throw materiaSeleccionada.error;
    }

    const normalizedName = String(materiaSeleccionada.data?.nombre ?? '').toLowerCase();
    const isGeneral =
      String(materiaSeleccionada.data?.slug ?? '').includes('aprender-21') ||
      String(materiaSeleccionada.data?.slug ?? '').includes('tecnologia-humanidades') ||
      normalizedName.includes('aprender en el siglo 21');
    const finalCarreraId = isGeneral ? null : input.carreraId;
    const paginas = await getPdfPageCountForStoragePath(admin, input.filePath).catch((error) => {
      logError('admin.procesarCargaMaterial.paginasPdf', error, { filePath: input.filePath });
      return null;
    });
    let parcialNum = 1;
    if (input.subTipo.includes('2') || input.subTipo.includes('4') || input.resumenParcial.includes('2')) {
      parcialNum = 2;
    }

    const materialTitle = isResumen
      ? `Resumen - ${[
          ...input.resumenModules.map((module) => `Modulo ${module}`),
          ...(input.resumenParcial ? [input.resumenParcial] : []),
        ].join(', ')}`
      : `${input.recursoType} - ${input.subTipo}`;

    if (shouldInsertMaterialRecord) {
      const { error: insertMaterialError } = await admin.from('materiales').insert({
        materia_id: input.materiaId,
        titulo: materialTitle,
        tipo: input.recursoType,
        parcial: parcialNum,
        archivo_url: input.filePath,
      });

      if (insertMaterialError) {
        throw insertMaterialError;
      }
    }

    if (isResumen) {
      const resumenRecursos = input.resumenModules.map((module) => ({
        nombre: `Resumen - Modulo ${module}`,
        tipo: 'resumen-modulo',
        url_archivo: input.filePath,
        materia_id: input.materiaId,
        carrera_id: finalCarreraId,
        universidad_id: input.universidadId,
        etiqueta: `Modulo ${module}`,
        paginas,
      }));

      if (input.resumenParcial) {
        resumenRecursos.push({
          nombre: `Resumen - ${input.resumenParcial}`,
          tipo: input.resumenParcial.includes('1') ? 'primer-parcial' : 'segundo-parcial',
          url_archivo: input.filePath,
          materia_id: input.materiaId,
          carrera_id: finalCarreraId,
          universidad_id: input.universidadId,
          etiqueta: input.resumenParcial,
          paginas,
        });
      }

      if (resumenRecursos.length > 0) {
        const { error: recursoError } = await admin.from('recursos').insert(resumenRecursos);
        if (recursoError) {
          logError('admin.procesarCargaMaterial.insertRecursosResumen', recursoError);
        }
      }

      if (input.resumenModules.length > 0) {
        const resumenRows = input.resumenModules.map((module) => ({
          materia_id: input.materiaId,
          module_id: Number(module),
          title: `Resumen - Modulo ${module}`,
          file_url: input.filePath,
          created_at: new Date().toISOString(),
        }));

        const { error: resumenError } = await admin.from('resumenes').insert(resumenRows);
        if (resumenError) {
          logError('admin.procesarCargaMaterial.insertResumenes', resumenError);
        }
      }
    } else if (shouldPublishAsResource) {
      let tipoRecurso = 'otro';
      if (input.recursoType === 'Preguntero') {
        tipoRecurso = input.subTipo.includes('1') ? 'preguntero-p1' : 'preguntero-p2';
      } else if (input.recursoType === 'Trabajo Práctico') {
        tipoRecurso = input.subTipo.includes('1') || input.subTipo.includes('2') ? 'tp-p1' : 'tp-p2';
      }

      const { error: recursoError } = await admin.from('recursos').insert({
        nombre: `${input.recursoType} - ${input.subTipo}`,
        tipo: tipoRecurso,
        url_archivo: input.filePath,
        materia_id: input.materiaId,
        carrera_id: finalCarreraId,
        universidad_id: input.universidadId,
        etiqueta: input.subTipo,
        paginas,
      });

      if (recursoError) {
        logError('admin.procesarCargaMaterial.insertRecursos', recursoError);
      }
    }

    if (isPreguntero && shouldExtractQuestions) {
      const isExcelFile = /\.(xlsx|xls)$/i.test(input.fileName);
      const result = await analizarMaterialConIA(
        input.filePath,
        input.materiaId,
        input.recursoType,
        parcialNum,
        input.universidadId,
        finalCarreraId,
        `${input.recursoType} - ${input.subTipo}`,
        !isExcelFile && Boolean(input.usarIAEnCarga)
      );

      if (!result.success) {
        return { success: false, message: result.message };
      }

      if (shouldDeleteAfterExtract) {
        const { error: removeError } = await admin.storage.from('biblioteca').remove([input.filePath]);
        if (removeError) {
          logError('admin.procesarCargaMaterial.removeTemporal', removeError, {
            filePath: input.filePath,
          });
          return {
            success: false,
            message:
              'Las preguntas se extrajeron, pero no pudimos eliminar el archivo temporal del storage.',
          };
        }
      }
    }

    revalidateBibliotecaPanels();

    return {
      success: true,
      message:
        shouldDeleteAfterExtract
          ? 'Preguntas extraidas y archivo temporal eliminado correctamente.'
          : isPreguntero && !shouldPublishAsResource && shouldExtractQuestions
            ? 'Material cargado solo para simulador.'
          : isPreguntero && shouldPublishAsResource && !shouldExtractQuestions
            ? 'Material cargado solo para visualizacion.'
            : isPreguntero
              ? 'Material cargado y procesado correctamente.'
              : 'Material cargado correctamente.',
    };
  } catch (error) {
    logError('admin.procesarCargaMaterial', error, {
      materiaId: input.materiaId,
      universidadId: input.universidadId,
      recursoType: input.recursoType,
      filePath: input.filePath,
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos procesar la carga del material.',
    };
  }
}

export async function crearUniversidadBibliotecaAdministrador(
  nombre: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const cleanName = nombre.trim();

    if (!cleanName) {
      return { success: false, message: 'El nombre de la universidad es obligatorio.' };
    }

    const { error } = await admin.from('universidades').insert({ nombre: cleanName });
    if (error) throw error;

    revalidateBibliotecaPanels();
    return { success: true, message: 'Universidad creada correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos crear la universidad.',
    };
  }
}

export async function eliminarUniversidadBibliotecaAdministrador(
  universidadId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    if (!universidadId) {
      return { success: false, message: 'Falta la universidad a eliminar.' };
    }

    const { error } = await admin.from('universidades').delete().eq('id', universidadId);
    if (error) throw error;

    revalidateBibliotecaPanels();
    return { success: true, message: 'Universidad eliminada correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos eliminar la universidad.',
    };
  }
}

export async function crearCarreraBibliotecaAdministrador(input: {
  nombre: string;
  universidadId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const cleanName = input.nombre.trim();

    if (!cleanName || !input.universidadId) {
      return { success: false, message: 'Completa universidad y nombre de carrera.' };
    }

    const { error } = await admin.from('carreras').insert({
      nombre: cleanName,
      universidad_id: input.universidadId,
    });
    if (error) throw error;

    revalidateBibliotecaPanels();
    return { success: true, message: 'Carrera creada correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos crear la carrera.',
    };
  }
}

export async function eliminarCarreraBibliotecaAdministrador(
  carreraId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    if (!carreraId) {
      return { success: false, message: 'Falta la carrera a eliminar.' };
    }

    const { error } = await admin.from('carreras').delete().eq('id', carreraId);
    if (error) throw error;

    revalidateBibliotecaPanels();
    return { success: true, message: 'Carrera eliminada correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos eliminar la carrera.',
    };
  }
}

export async function crearMateriaBibliotecaAdministrador(input: {
  nombre: string;
  carreraIds: string[];
}): Promise<{ success: boolean; message: string }> {
  const result = await crearMateriaCompartidaAdministrador(input);
  if (result.success) {
    revalidateBibliotecaPanels();
  }
  return { success: result.success, message: result.message };
}

export async function eliminarMateriaBibliotecaAdministrador(input: {
  materiaId: string;
  carreraId: string;
}): Promise<{ success: boolean; message: string }> {
  const result = await desasignarMateriaDeCarreraAdministrador(input);
  if (result.success) {
    revalidateBibliotecaPanels();
  }
  return { success: result.success, message: result.message };
}
