import type { Database } from '@/types/supabase';

type AdminRetentionFunctions = {
  admin_user_languages_v1: {
    Args: { p_from: string; p_to: string };
    Returns: {
      from: string; to: string; source: 'current_account_ui_locale';
      categories: Array<{
        language: 'es' | 'en' | 'unknown';
        registered: number; new_users: number; active_users: number; studied_users: number;
      }>;
    };
  };
  admin_users_retention_v2: {
    Args: { p_days?: number; p_from?: string | null; p_to?: string | null };
    Returns: import('@/app/(es)/administrador/users-retention-types').UsersRetentionSnapshot;
  };
  admin_users_retention_v4: {
    Args: { p_days?: number; p_from?: string | null; p_to?: string | null };
    Returns: import('@/app/(es)/administrador/users-retention-types').UsersRetentionSnapshot;
  };
  admin_users_segments_v1: {
    Args: { p_days?: number };
    Returns: import('@/app/(es)/administrador/users-retention-types').UsersSegment[];
  };
  admin_users_segments_v2: {
    Args: { p_days?: number };
    Returns: import('@/app/(es)/administrador/users-retention-types').UsersSegment[];
  };
  admin_users_list_v1: {
    Args: { p_page?: number; p_search?: string; p_plan?: string; p_material?: string; p_country?: string; p_university?: string };
    Returns: import('@/app/(es)/administrador/users-retention-types').UserListResult;
  };
  admin_users_list_v3: {
    Args: { p_page?: number; p_search?: string; p_plan?: string; p_material?: string; p_country?: string; p_university?: string };
    Returns: import('@/app/(es)/administrador/users-retention-types').UserListResult;
  };
  admin_user_detail_v1: {
    Args: { p_user_id: string };
    Returns: import('@/app/(es)/administrador/users-retention-types').UserDetail | null;
  };
};

type AdminPerformanceFunctions = {
  admin_system_ai_dashboard_v2:{
    Args:{p_days?:number};
    Returns:import('@/app/(es)/administrador/system-ai-dashboard-types').SystemAiSnapshot;
  };
  admin_acquisition_dashboard_packed_v1:{
    Args:Record<PropertyKey,never>;
    Returns:import('@/app/(es)/administrador/packed-dashboard-transport').PackedDashboardSnapshot;
  };
  admin_activation_cohort_packed_v1:{
    Args:Record<PropertyKey,never>;
    Returns:import('@/app/(es)/administrador/packed-dashboard-transport').PackedDashboardSnapshot;
  };
  admin_system_ai_dashboard_v1:{
    Args:{p_days?:number};
    Returns:import('@/app/(es)/administrador/system-ai-dashboard-types').SystemAiSnapshot;
  };
  admin_management_snapshot_v1:{
    Args:Record<PropertyKey,never>;
    Returns:import('@/app/(es)/administrador/gestion-dashboard-types').GestionSnapshot;
  };
  admin_management_update_feedback_v1:{
    Args:{p_actor:string;p_source:string;p_feedback_id:string;p_expected:string;p_next:string};
    Returns:{status:string};
  };
  admin_management_resolve_catalog_v1:{
    Args:{p_actor:string;p_kind:'university'|'career'|'subject';p_id:string;p_decision:'approve'|'reject'};
    Returns:{status:string;audited:boolean};
  };
  admin_communications_dashboard_v1: {
    Args: {p_days?:number;p_from?:string|null;p_to?:string|null;p_type?:string;p_template?:string;p_status?:string;p_campaign?:string};
    Returns: import('@/app/(es)/administrador/communications-dashboard-types').CommunicationsSnapshot;
  };
  admin_monetization_dashboard_v1: {
    Args: {
      p_days?: number; p_from?: string | null; p_to?: string | null;
      p_university?: string; p_career?: string; p_country?: string;
      p_provider?: string; p_state?: string;
    };
    Returns: import('@/app/(es)/administrador/monetization-dashboard-types').MonetizationSnapshot;
  };
  admin_study_plans_dashboard_v1: {
    Args: { p_days?: number; p_from?: string|null; p_to?: string|null;
      p_university?:string|null; p_career?:string|null; p_subject?:string|null;
      p_duration?:string; p_state?:string };
    Returns: import('@/app/(es)/administrador/study-plans-dashboard-types').StudyPlanAdminSnapshot;
  };
  admin_learning_dashboard_v2: {
    Args: { p_days?:number; p_from?:string|null; p_to?:string|null;
      p_university?:string|null; p_career?:string|null;
      p_subject?:string|null; p_plan?:string };
    Returns: import('@/app/(es)/administrador/learning-dashboard-types').LearningSnapshot;
  };
  admin_activation_cohort_v1: {
    Args: Record<PropertyKey, never>;
    Returns: import('@/app/(es)/administrador/activation-dashboard-types').ActivationCohortSnapshot;
  };
  admin_acquisition_dashboard_v1: {
    Args: Record<PropertyKey, never>;
    Returns: import('@/app/(es)/administrador/acquisition-dashboard-types').AcquisitionSnapshot;
  };
  admin_home_snapshot_v1: {
    Args: { p_day?: string | null };
    Returns: {
      day: string; daily: Array<{ d: string; registrations: number; active_users: number; sessions: number; studied_users: number }>;
      users: { total: number; new_7d: number };
      activity: { active_7d: number };
      study: { studying_7d: number; returning_7d: number };
      cohort: { retained: number; cohort_users: number };
      materials: { uploaded_7d: number; ready_7d: number; failed_7d: number; stuck_7d: number };
      practice: { completed_7d: number };
      plans: { created_7d: number };
      activation: { activated: number };
      premium: { active: number };
      revenue: { ars: number; usd: number };
      payments: { failed: number };
    };
  };
  admin_home_snapshot_v2: {
    Args: { p_day?: string | null };
    Returns: {
      day: string; daily: Array<{ d: string; registrations: number; active_users: number; sessions: number; studied_users: number }>;
      users: { total: number; new_7d: number };
      activity: { active_7d: number };
      study: { studying_7d: number; returning_7d: number };
      cohort: { retained: number; cohort_users: number };
      materials: { uploaded_7d: number; ready_7d: number; failed_7d: number; stuck_7d: number };
      practice: { completed_7d: number };
      plans: { created_7d: number };
      activation: { activated: number };
      premium: { active: number };
      revenue: { ars: number; usd: number };
      payments: { failed: number };
    };
  };
  admin_academic_usage_aggregates_v1: {
    Args: Record<PropertyKey, never>;
    Returns: Array<{
      university_id: string;
      university_name: string;
      users: number;
      active_users_7d: number;
      engagement_users_7d: number;
      engagement_ms_7d: number;
      pdfs: number;
      flashcard_sessions_started: number;
      pdf_simulators_started: number;
      last_activity_at: string | null;
    }>;
  };
  admin_overview_daily_v1: {
    Args: { p_days?: number };
    Returns: Array<{
      day: string;
      registrations: number;
      active_users: number;
      sessions: number;
      pdfs_uploaded: number;
      practices_completed: number;
    }>;
  };
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
    Functions: Database['public']['Functions'] & AdminPerformanceFunctions & AdminRetentionFunctions;
  };
};
