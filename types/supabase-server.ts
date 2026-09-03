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

export type ServerDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & AdminPerformanceFunctions;
  };
};
