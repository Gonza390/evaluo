'use server';

import { revalidatePath } from 'next/cache';
import {
  analizarMaterialConIA,
} from './material-analysis';
import {
  crearMateriaCompartidaAdministrador,
  desasignarMateriaDeCarreraAdministrador,
} from './shared-actions';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

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
        });
      }

      if (resumenRecursos.length > 0) {
        const { error: recursoError } = await admin.from('recursos').insert(resumenRecursos);
        if (recursoError) {
          console.error('Error al insertar recursos resumen:', recursoError);
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
          console.error('Error al insertar en resumenes:', resumenError);
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
      });

      if (recursoError) {
        console.error('Error al insertar en recursos:', recursoError);
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
          console.error('No pudimos borrar el archivo temporal del preguntero:', removeError);
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
    console.error('Error en procesarCargaMaterialBibliotecaAdministrador:', error);
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
