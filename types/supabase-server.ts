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
  admin_product_user_journeys: {
    Args: {
      p_period_days?: number;
      p_excluded_user_ids?: string[];
    };
    Returns: Array<{
      user_id: string;
      email: string;
      registered_at: string;
      source: string;
      materia_id: string | null;
      materia_name: string | null;
      reached_materia: boolean;
      content_available: boolean;
      content_opened: boolean;
      meaningful_study: boolean;
      returned_48h: boolean;
      active_days: number;
      simulator_attempts: number;
      pdf_selected: number;
      pdf_uploads: number;
      excluded_admin_sessions: number;
    }>;
  };
  refresh_seo_funnel_daily: {
    Args: {
      p_days_back?: number;
    };
    Returns: Array<{
      refreshed_days: number;
      first_day: string;
      last_day: string;
    }>;
  };
  admin_seo_funnel_history: {
    Args: {
      p_days?: number;
    };
    Returns: Array<{
      snapshot_date: string;
      source: string;
      sessions: number;
      anonymous_sessions: number;
      authenticated_sessions: number;
      signup_started_sessions: number;
      signup_completed_sessions: number;
      useful_action_sessions: number;
      simulator_started_sessions: number;
      meaningful_study_sessions: number;
      pdf_uploaded_sessions: number;
      returned_sessions: number;
      generated_at: string;
    }>;
  };
};

export type ServerDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & AdminPerformanceFunctions;
  };
};
