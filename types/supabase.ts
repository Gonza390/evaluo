export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'admin' | 'student';

export interface DashboardSubjectState {
  id: string;
  name: string;
}

export interface DashboardAnalytics {
  subjectsCompleted: number;
  lastUpdatedAt: string | null;
}

export type Database = {
  public: {
    Tables: {
      carrera_materias: {
        Row: {
          id: string;
          carrera_id: string | null;
          materia_id: string | null;
          prioridad: number | null;
        };
        Insert: {
          id?: string;
          carrera_id?: string | null;
          materia_id?: string | null;
          prioridad?: number | null;
        };
        Update: {
          id?: string;
          carrera_id?: string;
          materia_id?: string;
          prioridad?: number | null;
        };
        Relationships: [];
      };
      carreras: {
        Row: {
          id: string;
          nombre: string;
          universidad_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          universidad_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          universidad_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          price_ars: number;
          interval: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          price_ars?: number;
          interval?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          price_ars?: number;
          interval?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          started_at: string;
          expires_at: string | null;
          payment_provider: string | null;
          payment_reference: string | null;
          amount_ars: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          payment_provider?: string | null;
          payment_reference?: string | null;
          amount_ars?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          payment_provider?: string | null;
          payment_reference?: string | null;
          amount_ars?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          user_id: string | null;
          session_key: string;
          path: string | null;
          device_type: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          user_id?: string | null;
          session_key: string;
          path?: string | null;
          device_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          user_id?: string | null;
          session_key?: string;
          path?: string | null;
          device_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      configuracion_ia: {
        Row: {
          id: string;
          prompt_sistema: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          prompt_sistema?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          prompt_sistema?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      historial_respuestas: {
        Row: {
          id: string;
          usuario_id: string | null;
          pregunta_id: string | null;
          materia_id: string | null;
          es_correcta: boolean | null;
          peso: number | null;
          fecha_intento: string | null;
          fecha_respuesta: string | null;
        };
        Insert: {
          id?: string;
          usuario_id?: string | null;
          pregunta_id?: string | null;
          materia_id?: string | null;
          es_correcta?: boolean | null;
          peso?: number | null;
          fecha_intento?: string | null;
          fecha_respuesta?: string | null;
        };
        Update: {
          id?: string;
          usuario_id?: string | null;
          pregunta_id?: string | null;
          materia_id?: string | null;
          es_correcta?: boolean | null;
          peso?: number | null;
          fecha_intento?: string | null;
          fecha_respuesta?: string | null;
        };
        Relationships: [];
      };
      materiales: {
        Row: {
          id: string;
          materia_id: string | null;
          titulo: string;
          tipo: string;
          parcial: number | null;
          archivo_url: string;
          creado_at: string | null;
        };
        Insert: {
          id?: string;
          materia_id?: string | null;
          titulo: string;
          tipo: string;
          parcial?: number | null;
          archivo_url: string;
          creado_at?: string | null;
        };
        Update: {
          id?: string;
          materia_id?: string | null;
          titulo?: string;
          tipo?: string;
          parcial?: number | null;
          archivo_url?: string;
          creado_at?: string | null;
        };
        Relationships: [];
      };
      materias: {
        Row: {
          id: string;
          nombre: string;
          carrera_id: string | null;
          slug: string | null;
          es_general: boolean | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          carrera_id?: string | null;
          slug?: string | null;
          es_general?: boolean | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          carrera_id?: string | null;
          slug?: string | null;
          es_general?: boolean | null;
        };
        Relationships: [];
      };
      preguntas_banco: {
        Row: {
          id: string;
          materia_id: string | null;
          enunciado: string;
          opciones: Json;
          respuesta_correcta: string;
          parcial: number | null;
          universidad_id: string | null;
          carrera_id: string | null;
          es_general: boolean | null;
          creado_at: string | null;
          material_id: string | null;
          es_ia_generada: boolean | null;
          dificultad: string | null;
          tasa_acierto: number | null;
        };
        Insert: {
          id?: string;
          materia_id?: string | null;
          enunciado: string;
          opciones: Json;
          respuesta_correcta: string;
          parcial?: number | null;
          universidad_id?: string | null;
          carrera_id?: string | null;
          es_general?: boolean | null;
          creado_at?: string | null;
          material_id?: string | null;
          es_ia_generada?: boolean | null;
          dificultad?: string | null;
          tasa_acierto?: number | null;
        };
        Update: {
          id?: string;
          materia_id?: string | null;
          enunciado?: string;
          opciones?: Json;
          respuesta_correcta?: string;
          parcial?: number | null;
          universidad_id?: string | null;
          carrera_id?: string | null;
          es_general?: boolean | null;
          creado_at?: string | null;
          material_id?: string | null;
          es_ia_generada?: boolean | null;
          dificultad?: string | null;
          tasa_acierto?: number | null;
        };
        Relationships: [];
      };
      question_edit_audit: {
        Row: {
          id: string;
          pregunta_id: string;
          admin_user_id: string | null;
          before_payload: Json | null;
          after_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pregunta_id: string;
          admin_user_id?: string | null;
          before_payload?: Json | null;
          after_payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pregunta_id?: string;
          admin_user_id?: string | null;
          before_payload?: Json | null;
          after_payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rag_explanation_feedback: {
        Row: {
          id: string;
          pregunta_id: string;
          user_id: string | null;
          voto: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          pregunta_id: string;
          user_id?: string | null;
          voto: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pregunta_id?: string;
          user_id?: string | null;
          voto?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_alert_logs: {
        Row: {
          id: string;
          alert_key: string;
          severity: string;
          message: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_key: string;
          severity: string;
          message: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_key?: string;
          severity?: string;
          message?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rag_document_chunks: {
        Row: {
          id: string;
          materia_id: string | null;
          source_table: string;
          source_id: string | null;
          source_title: string | null;
          chunk_index: number;
          chunk_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          materia_id?: string | null;
          source_table: string;
          source_id?: string | null;
          source_title?: string | null;
          chunk_index: number;
          chunk_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          materia_id?: string | null;
          source_table?: string;
          source_id?: string | null;
          source_title?: string | null;
          chunk_index?: number;
          chunk_text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rag_explanations_cache: {
        Row: {
          id: string;
          pregunta_id: string;
          materia_id: string | null;
          parcial: number | null;
          explicacion: string;
          provider: string | null;
          source_used: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pregunta_id: string;
          materia_id?: string | null;
          parcial?: number | null;
          explicacion: string;
          provider?: string | null;
          source_used?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pregunta_id?: string;
          materia_id?: string | null;
          parcial?: number | null;
          explicacion?: string;
          provider?: string | null;
          source_used?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rag_generation_logs: {
        Row: {
          id: string;
          pregunta_id: string | null;
          materia_id: string | null;
          provider: string | null;
          status: string;
          error_message: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pregunta_id?: string | null;
          materia_id?: string | null;
          provider?: string | null;
          status: string;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pregunta_id?: string | null;
          materia_id?: string | null;
          provider?: string | null;
          status?: string;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rag_question_stats: {
        Row: {
          id: string;
          pregunta_id: string;
          materia_id: string | null;
          veces_fallada: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pregunta_id: string;
          materia_id?: string | null;
          veces_fallada?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pregunta_id?: string;
          materia_id?: string | null;
          veces_fallada?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          creado_at: string | null;
          nombre: string | null;
          universidad_id: string | null;
          whatsapp: string | null;
          carrera_id: string | null;
          role: AppRole | null;
          last_subject_id: string | null;
          last_subject_name: string | null;
          active_subjects: DashboardSubjectState[] | null;
          finished_subjects: DashboardSubjectState[] | null;
          dashboard_analytics: DashboardAnalytics | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          creado_at?: string | null;
          nombre?: string | null;
          universidad_id?: string | null;
          whatsapp?: string | null;
          carrera_id?: string | null;
          role?: AppRole | null;
          last_subject_id?: string | null;
          last_subject_name?: string | null;
          active_subjects?: DashboardSubjectState[] | null;
          finished_subjects?: DashboardSubjectState[] | null;
          dashboard_analytics?: DashboardAnalytics | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          creado_at?: string | null;
          nombre?: string | null;
          universidad_id?: string | null;
          whatsapp?: string | null;
          carrera_id?: string | null;
          role?: AppRole | null;
          last_subject_id?: string | null;
          last_subject_name?: string | null;
          active_subjects?: DashboardSubjectState[] | null;
          finished_subjects?: DashboardSubjectState[] | null;
          dashboard_analytics?: DashboardAnalytics | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      recursos: {
        Row: {
          id: string;
          nombre: string;
          tipo: string | null;
          url_archivo: string | null;
          creado_at: string | null;
          materia_id: string | null;
          carrera_id: string | null;
          universidad_id: string | null;
          etiqueta: string | null;
          paginas: number | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          tipo?: string | null;
          url_archivo?: string | null;
          creado_at?: string | null;
          materia_id?: string | null;
          carrera_id?: string | null;
          universidad_id?: string | null;
          etiqueta?: string | null;
          paginas?: number | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          tipo?: string | null;
          url_archivo?: string | null;
          creado_at?: string | null;
          materia_id?: string | null;
          carrera_id?: string | null;
          universidad_id?: string | null;
          etiqueta?: string | null;
          paginas?: number | null;
        };
        Relationships: [];
      };
      resumen_votes: {
        Row: {
          id: string;
          user_id: string | null;
          resumen_id: string | null;
          vote_type: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          resumen_id?: string | null;
          vote_type?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          resumen_id?: string | null;
          vote_type?: number | null;
        };
        Relationships: [];
      };
      resumenes: {
        Row: {
          id: string;
          materia_id: string | null;
          subject_id: string | null;
          module_id: number;
          title: string;
          author_name: string | null;
          file_url: string;
          score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          materia_id?: string | null;
          subject_id?: string | null;
          module_id: number;
          title: string;
          author_name?: string | null;
          file_url: string;
          score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          materia_id?: string | null;
          subject_id?: string | null;
          module_id?: number;
          title?: string;
          author_name?: string | null;
          file_url?: string;
          score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      universidades: {
        Row: {
          id: string;
          nombre: string;
        };
        Insert: {
          id?: string;
          nombre: string;
        };
        Update: {
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          materia_id: string | null;
          carrera_id: string | null;
          subject_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          materia_id?: string | null;
          carrera_id?: string | null;
          subject_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          materia_id?: string | null;
          carrera_id?: string | null;
          subject_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database['public'];

export type Tables<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Row'];

export type TableInsert<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Insert'];

export type TableUpdate<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Update'];
