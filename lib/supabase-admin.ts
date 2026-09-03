import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type AdminPerformanceFunctions = {
  admin_biblioteca_question_counts: {
    Args: Record<PropertyKey, never>;
    Returns: Array<{
      materia_id: string | null;
      parcial: number | null;
      total: number;
    }>;
  };
  admin_premium_question_counts: {
    Args: Record<PropertyKey, never>;
    Returns: Array<{
      set_id: string | null;
      total: number;
    }>;
  };
  admin_active_user_count_since: {
    Args: {
      since_at: string;
      excluded_user_ids?: string[];
    };
    Returns: number;
  };
  admin_user_simulator_aggregates: {
    Args: {
      target_user_ids?: string[] | null;
    };
    Returns: Array<{
      user_id: string;
      intentos: number;
      preguntas: number;
      correctas: number;
    }>;
  };
};

type AdminDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & AdminPerformanceFunctions;
  };
};

export function isAdminClientConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan variables de entorno de Supabase admin.');
  }

  const client = createClient<AdminDatabase>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // SupabaseClient.rpc usa estado interno del cliente. Algunos consumidores
  // conservan una referencia tipada al método; dejarlo pre-bindeado evita que
  // una llamada indirecta pierda `this` y falle intentando leer `this.rest`.
  client.rpc = client.rpc.bind(client) as typeof client.rpc;

  return client;
}
