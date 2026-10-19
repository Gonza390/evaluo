import 'server-only';

import { cache } from 'react';
import { createClientServer } from '@/lib/supabase-server';

export type RequestProfileRow = {
  universidad_id: string | null;
  carrera_id: string | null;
  last_subject_id: string | null;
  last_subject_name: string | null;
  active_subjects: import('@/types/supabase').Json;
  finished_subjects: import('@/types/supabase').Json;
  dashboard_analytics: import('@/types/supabase').Json;
};

export const getRequestProfile = cache(
  async (userId: string): Promise<{ data: RequestProfileRow | null; error: unknown }> => {
    const supabase = await createClientServer();
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'universidad_id, carrera_id, last_subject_id, last_subject_name, active_subjects, finished_subjects, dashboard_analytics'
      )
      .eq('id', userId)
      .maybeSingle();

    return { data: data as RequestProfileRow | null, error };
  }
);

export const getRequestAcademicLabels = cache(
  async (carreraId: string | null, universidadId: string | null) => {
    const supabase = await createClientServer();
    const [carreraResponse, universidadResponse] = await Promise.all([
      carreraId
        ? supabase.from('carreras').select('nombre').eq('id', carreraId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      universidadId
        ? supabase.from('universidades').select('nombre').eq('id', universidadId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      carreraNombre: carreraResponse.data?.nombre ?? null,
      universidadNombre: universidadResponse.data?.nombre ?? null,
      error: carreraResponse.error ?? universidadResponse.error ?? null,
    };
  }
);
