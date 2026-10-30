'use server';

import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';

type UniversidadOption = { id: string; nombre: string };
type CarreraOption = { id: string; nombre: string; universidad_id: string | null };

export type DashboardAcademicOptionsResult =
  | {
      success: true;
      universidades: UniversidadOption[];
      carreras: CarreraOption[];
      profile: { universidadId: string | null; carreraId: string | null };
    }
  | { success: false; message: string };

/**
 * Catálogo académico opcional: sólo se lee si el estudiante abre
 * "Agregar universidad y carrera". No forma parte del render de Mi espacio.
 * Usa el cliente autenticado/RLS (nunca un service role en este endpoint).
 */
export async function loadDashboardAcademicOptionsAction(): Promise<DashboardAcademicOptionsResult> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'Iniciá sesión para indicar dónde estudiás.' };
    }

    const [universidadesResult, carrerasResult, profileResult] = await Promise.all([
      supabase.from('universidades').select('id, nombre').order('nombre'),
      supabase.from('carreras').select('id, nombre, universidad_id').order('nombre'),
      supabase.from('profiles').select('universidad_id, carrera_id').eq('id', user.id).maybeSingle(),
    ]);
    if (universidadesResult.error) throw universidadesResult.error;
    if (carrerasResult.error) throw carrerasResult.error;
    if (profileResult.error) throw profileResult.error;

    return {
      success: true,
      universidades: universidadesResult.data ?? [],
      carreras: carrerasResult.data ?? [],
      profile: {
        universidadId: profileResult.data?.universidad_id ?? null,
        carreraId: profileResult.data?.carrera_id ?? null,
      },
    };
  } catch (error) {
    logError('dashboard.academicOptions', error);
    return { success: false, message: 'No pudimos cargar las universidades. Intentá nuevamente.' };
  }
}
