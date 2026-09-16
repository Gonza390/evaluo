'use server';

import { z } from 'zod';
import {
  createPrivatePendingCareerAction,
  createPrivatePendingSubjectAction,
  createPrivatePendingUniversityAction,
} from '@/app/completar-perfil/pending-academic-actions';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';

const optionalId = z.string().uuid().nullable().optional();
const optionalName = z.string().trim().max(160).nullable().optional();

const academicContextSchema = z.object({
  materialId: z.string().uuid(),
  universidadId: optionalId,
  universidadNombre: optionalName,
  carreraId: optionalId,
  carreraNombre: optionalName,
  materiaId: optionalId,
  materiaNombre: optionalName,
});

export type PdfFirstAcademicContextResult =
  | {
      success: true;
      message: string;
      context: {
        universidadId: string | null;
        universidadNombre: string | null;
        carreraId: string | null;
        carreraNombre: string | null;
        materiaId: string | null;
        materiaNombre: string | null;
      };
    }
  | { success: false; message: string };

async function requireUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Iniciá sesión para guardar dónde estudiás.');
  return user;
}

export async function savePdfFirstAcademicContextAction(
  input: z.input<typeof academicContextSchema>
): Promise<PdfFirstAcademicContextResult> {
  try {
    const parsed = academicContextSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: 'Revisá los datos académicos e intentá nuevamente.' };
    }

    const user = await requireUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CI unblock for PDF-first merge
    const admin = createAdminClient() as any;
    const { data: ownedMaterial, error: materialError } = await admin
      .from('student_materials')
      .select('id')
      .eq('id', parsed.data.materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (materialError) throw materialError;
    if (!ownedMaterial) {
      return { success: false, message: 'No encontramos tu PDF para guardar estos datos.' };
    }

    let universidadId = parsed.data.universidadId ?? null;
    let universidadNombre = parsed.data.universidadNombre?.trim() || null;
    let carreraId = parsed.data.carreraId ?? null;
    let carreraNombre = parsed.data.carreraNombre?.trim() || null;
    let materiaId = parsed.data.materiaId ?? null;
    let materiaNombre = parsed.data.materiaNombre?.trim() || null;

    if (!universidadId && universidadNombre) {
      const result = await createPrivatePendingUniversityAction({ universidadNombre });
      if (!result.success) return result;
      universidadId = result.universidad.id;
      universidadNombre = result.universidad.nombre;
    }

    if ((carreraId || carreraNombre) && !universidadId) {
      return { success: false, message: 'Elegí o escribí primero tu universidad.' };
    }

    if (!carreraId && carreraNombre && universidadId) {
      const result = await createPrivatePendingCareerAction({
        universidadId,
        carreraNombre,
      });
      if (!result.success) return result;
      carreraId = result.carrera.id;
      carreraNombre = result.carrera.nombre;
    }

    if ((materiaId || materiaNombre) && !carreraId) {
      return { success: false, message: 'Elegí o escribí primero tu carrera.' };
    }

    if (!materiaId && materiaNombre && carreraId) {
      const result = await createPrivatePendingSubjectAction({ carreraId, materiaNombre });
      if (!result.success) return result;
      materiaId = result.materia.id;
      materiaNombre = result.materia.nombre;
    }

    if (!universidadId && !carreraId && !materiaId) {
      return { success: false, message: 'Completá al menos la universidad o tocá “Saltar por ahora”.' };
    }

    if (universidadId) {
      const { data: university, error } = await admin
        .from('universidades')
        .select('id, nombre, approval_status, owner_user_id')
        .eq('id', universidadId)
        .maybeSingle();
      if (error) throw error;
      if (!university || (university.approval_status !== 'approved' && university.owner_user_id !== user.id)) {
        return { success: false, message: 'No encontramos esa universidad.' };
      }
      universidadNombre = university.nombre;
    }

    if (carreraId) {
      const { data: career, error } = await admin
        .from('carreras')
        .select('id, nombre, universidad_id, approval_status, owner_user_id')
        .eq('id', carreraId)
        .maybeSingle();
      if (error) throw error;
      if (
        !career ||
        career.universidad_id !== universidadId ||
        (career.approval_status !== 'approved' && career.owner_user_id !== user.id)
      ) {
        return { success: false, message: 'La carrera no corresponde a esa universidad.' };
      }
      carreraNombre = career.nombre;
    }

    if (materiaId) {
      const [{ data: subject, error: subjectError }, { data: relation, error: relationError }] =
        await Promise.all([
          admin
            .from('materias')
            .select('id, nombre, approval_status, owner_user_id')
            .eq('id', materiaId)
            .maybeSingle(),
          admin
            .from('carrera_materias')
            .select('id, approval_status, owner_user_id')
            .eq('carrera_id', carreraId)
            .eq('materia_id', materiaId)
            .order('approval_status', { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);
      if (subjectError) throw subjectError;
      if (relationError) throw relationError;
      if (
        !subject ||
        !relation ||
        (subject.approval_status !== 'approved' && subject.owner_user_id !== user.id) ||
        (relation.approval_status !== 'approved' && relation.owner_user_id !== user.id)
      ) {
        return { success: false, message: 'La materia no corresponde a esa carrera.' };
      }
      materiaNombre = subject.nombre;
    }

    const { data: updated, error: updateError } = await admin
      .from('student_materials')
      .update({
        universidad_id: universidadId,
        carrera_id: carreraId,
        materia_id: materiaId,
        visibility: 'private',
      })
      .eq('id', parsed.data.materialId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) return { success: false, message: 'No pudimos asociar los datos a tu PDF.' };

    return {
      success: true,
      message: 'Datos académicos guardados.',
      context: {
        universidadId,
        universidadNombre,
        carreraId,
        carreraNombre,
        materiaId,
        materiaNombre,
      },
    };
  } catch (error) {
    logError('studentMaterials.pdfFirst.saveAcademicContext', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar dónde estudiás.',
    };
  }
}
