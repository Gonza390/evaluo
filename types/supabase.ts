export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_alert_logs: {
        Row: {
          alert_key: string;
          created_at: string;
          id: string;
          message: string;
          metadata: Json | null;
          severity: string;
        };
        Insert: {
          alert_key: string;
          created_at?: string;
          id?: string;
          message: string;
          metadata?: Json | null;
          severity: string;
        };
        Update: {
          alert_key?: string;
          created_at?: string;
          id?: string;
          message?: string;
          metadata?: Json | null;
          severity?: string;
        };
        Relationships: [];
      };
      ai_daily_usage: {
        Row: {
          query_count: number | null;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          query_count?: number | null;
          usage_date?: string;
          user_id: string;
        };
        Update: {
          query_count?: number | null;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          created_at: string;
          device_type: string | null;
          event_name: string;
          id: string;
          metadata: Json | null;
          path: string | null;
          session_key: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          device_type?: string | null;
          event_name: string;
          id?: string;
          metadata?: Json | null;
          path?: string | null;
          session_key: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          device_type?: string | null;
          event_name?: string;
          id?: string;
          metadata?: Json | null;
          path?: string | null;
          session_key?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      analytics_events_archive: {
        Row: {
          archived_at: string;
          created_at: string;
          device_type: string | null;
          event_name: string;
          id: string;
          metadata: Json | null;
          path: string | null;
          session_key: string;
          user_id: string | null;
        };
        Insert: {
          archived_at?: string;
          created_at: string;
          device_type?: string | null;
          event_name: string;
          id: string;
          metadata?: Json | null;
          path?: string | null;
          session_key: string;
          user_id?: string | null;
        };
        Update: {
          archived_at?: string;
          created_at?: string;
          device_type?: string | null;
          event_name?: string;
          id?: string;
          metadata?: Json | null;
          path?: string | null;
          session_key?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      carrera_materias: {
        Row: {
          carrera_id: string | null;
          id: string;
          materia_id: string | null;
          prioridad: number | null;
        };
        Insert: {
          carrera_id?: string | null;
          id?: string;
          materia_id?: string | null;
          prioridad?: number | null;
        };
        Update: {
          carrera_id?: string | null;
          id?: string;
          materia_id?: string | null;
          prioridad?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'carrera_materias_carrera_id_fkey';
            columns: ['carrera_id'];
            isOneToOne: false;
            referencedRelation: 'carreras';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'carrera_materias_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      carreras: {
        Row: {
          created_at: string | null;
          id: string;
          nombre: string;
          universidad_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          nombre: string;
          universidad_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          nombre?: string;
          universidad_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'carreras_universidad_id_fkey';
            columns: ['universidad_id'];
            isOneToOne: false;
            referencedRelation: 'universidades';
            referencedColumns: ['id'];
          },
        ];
      };
      chunk_quality_log: {
        Row: {
          chunk_index: number;
          evaluated_at: string;
          id: string;
          issues: Json;
          material_id: string;
          score: number;
          suggested_action: string;
        };
        Insert: {
          chunk_index: number;
          evaluated_at?: string;
          id?: string;
          issues?: Json;
          material_id: string;
          score?: number;
          suggested_action?: string;
        };
        Update: {
          chunk_index?: number;
          evaluated_at?: string;
          id?: string;
          issues?: Json;
          material_id?: string;
          score?: number;
          suggested_action?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chunk_quality_log_material_id_fkey';
            columns: ['material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      configuracion_ia: {
        Row: {
          id: string;
          prompt_sistema: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          prompt_sistema: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          prompt_sistema?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      explanations_history: {
        Row: {
          created_at: string;
          enunciado: string;
          explicacion: string;
          id: string;
          materia_id: string | null;
          materia_nombre: string | null;
          opcion_elegida: number | null;
          opciones: Json | null;
          parcial: number | null;
          pregunta_id: string | null;
          provider: string | null;
          respuesta_correcta: string | null;
          user_id: string;
          veces_fallada: number;
        };
        Insert: {
          created_at?: string;
          enunciado: string;
          explicacion: string;
          id?: string;
          materia_id?: string | null;
          materia_nombre?: string | null;
          opcion_elegida?: number | null;
          opciones?: Json | null;
          parcial?: number | null;
          pregunta_id?: string | null;
          provider?: string | null;
          respuesta_correcta?: string | null;
          user_id: string;
          veces_fallada?: number;
        };
        Update: {
          created_at?: string;
          enunciado?: string;
          explicacion?: string;
          id?: string;
          materia_id?: string | null;
          materia_nombre?: string | null;
          opcion_elegida?: number | null;
          opciones?: Json | null;
          parcial?: number | null;
          pregunta_id?: string | null;
          provider?: string | null;
          respuesta_correcta?: string | null;
          user_id?: string;
          veces_fallada?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'explanations_history_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      historial_respuestas: {
        Row: {
          es_correcta: boolean | null;
          fecha_intento: string | null;
          fecha_respuesta: string | null;
          id: string;
          materia_id: string | null;
          peso: number | null;
          pregunta_id: string | null;
          usuario_id: string | null;
        };
        Insert: {
          es_correcta?: boolean | null;
          fecha_intento?: string | null;
          fecha_respuesta?: string | null;
          id?: string;
          materia_id?: string | null;
          peso?: number | null;
          pregunta_id?: string | null;
          usuario_id?: string | null;
        };
        Update: {
          es_correcta?: boolean | null;
          fecha_intento?: string | null;
          fecha_respuesta?: string | null;
          id?: string;
          materia_id?: string | null;
          peso?: number | null;
          pregunta_id?: string | null;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'historial_respuestas_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'historial_respuestas_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'historial_respuestas_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      materiales: {
        Row: {
          archivo_url: string;
          creado_at: string | null;
          id: string;
          materia_id: string | null;
          parcial: number | null;
          tipo: string;
          titulo: string;
        };
        Insert: {
          archivo_url: string;
          creado_at?: string | null;
          id?: string;
          materia_id?: string | null;
          parcial?: number | null;
          tipo: string;
          titulo: string;
        };
        Update: {
          archivo_url?: string;
          creado_at?: string | null;
          id?: string;
          materia_id?: string | null;
          parcial?: number | null;
          tipo?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'materiales_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      materias: {
        Row: {
          carrera_id: string | null;
          es_general: boolean | null;
          id: string;
          nombre: string;
          slug: string | null;
        };
        Insert: {
          carrera_id?: string | null;
          es_general?: boolean | null;
          id?: string;
          nombre: string;
          slug?: string | null;
        };
        Update: {
          carrera_id?: string | null;
          es_general?: boolean | null;
          id?: string;
          nombre?: string;
          slug?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'materias_carrera_id_fkey';
            columns: ['carrera_id'];
            isOneToOne: false;
            referencedRelation: 'carreras';
            referencedColumns: ['id'];
          },
        ];
      };
      preguntas_banco: {
        Row: {
          carrera_id: string | null;
          creado_at: string | null;
          dificultad: string | null;
          enunciado: string;
          es_demo: boolean;
          es_general: boolean | null;
          es_ia_generada: boolean | null;
          id: string;
          materia_id: string | null;
          material_id: string | null;
          opciones: Json;
          parcial: number | null;
          respuesta_correcta: string;
          tasa_acierto: number | null;
          universidad_id: string | null;
        };
        Insert: {
          carrera_id?: string | null;
          creado_at?: string | null;
          dificultad?: string | null;
          enunciado: string;
          es_demo?: boolean;
          es_general?: boolean | null;
          es_ia_generada?: boolean | null;
          id?: string;
          materia_id?: string | null;
          material_id?: string | null;
          opciones: Json;
          parcial?: number | null;
          respuesta_correcta: string;
          tasa_acierto?: number | null;
          universidad_id?: string | null;
        };
        Update: {
          carrera_id?: string | null;
          creado_at?: string | null;
          dificultad?: string | null;
          enunciado?: string;
          es_demo?: boolean;
          es_general?: boolean | null;
          es_ia_generada?: boolean | null;
          id?: string;
          materia_id?: string | null;
          material_id?: string | null;
          opciones?: Json;
          parcial?: number | null;
          respuesta_correcta?: string;
          tasa_acierto?: number | null;
          universidad_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'preguntas_banco_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'preguntas_banco_material_id_fkey';
            columns: ['material_id'];
            isOneToOne: false;
            referencedRelation: 'materiales';
            referencedColumns: ['id'];
          },
        ];
      };
      premium_question_sets: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          materia_id: string;
          notes: string | null;
          parcial: number;
          source_exam_date: string | null;
          titulo: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          materia_id: string;
          notes?: string | null;
          parcial?: number;
          source_exam_date?: string | null;
          titulo: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          materia_id?: string;
          notes?: string | null;
          parcial?: number;
          source_exam_date?: string | null;
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'premium_question_sets_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      premium_questions: {
        Row: {
          created_at: string;
          enunciado: string;
          id: string;
          opciones: string[];
          orden: number;
          respuesta_correcta: string;
          set_id: string;
        };
        Insert: {
          created_at?: string;
          enunciado: string;
          id?: string;
          opciones: string[];
          orden?: number;
          respuesta_correcta: string;
          set_id: string;
        };
        Update: {
          created_at?: string;
          enunciado?: string;
          id?: string;
          opciones?: string[];
          orden?: number;
          respuesta_correcta?: string;
          set_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'premium_questions_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'premium_question_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          active_subjects: Json;
          anio_carrera: string | null;
          carrera_id: string | null;
          creado_at: string | null;
          dashboard_analytics: Json;
          finished_subjects: Json;
          id: string;
          last_subject_id: string | null;
          last_subject_name: string | null;
          nombre: string | null;
          pais: string | null;
          role: string | null;
          telefono: string | null;
          universidad_id: string | null;
          updated_at: string | null;
          whatsapp: string | null;
        };
        Insert: {
          active_subjects?: Json;
          anio_carrera?: string | null;
          carrera_id?: string | null;
          creado_at?: string | null;
          dashboard_analytics?: Json;
          finished_subjects?: Json;
          id: string;
          last_subject_id?: string | null;
          last_subject_name?: string | null;
          nombre?: string | null;
          pais?: string | null;
          role?: string | null;
          telefono?: string | null;
          universidad_id?: string | null;
          updated_at?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          active_subjects?: Json;
          anio_carrera?: string | null;
          carrera_id?: string | null;
          creado_at?: string | null;
          dashboard_analytics?: Json;
          finished_subjects?: Json;
          id?: string;
          last_subject_id?: string | null;
          last_subject_name?: string | null;
          nombre?: string | null;
          pais?: string | null;
          role?: string | null;
          telefono?: string | null;
          universidad_id?: string | null;
          updated_at?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_last_subject_id_fkey';
            columns: ['last_subject_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      question_edit_audit: {
        Row: {
          admin_user_id: string | null;
          after_payload: Json | null;
          before_payload: Json | null;
          created_at: string;
          id: string;
          pregunta_id: string;
        };
        Insert: {
          admin_user_id?: string | null;
          after_payload?: Json | null;
          before_payload?: Json | null;
          created_at?: string;
          id?: string;
          pregunta_id: string;
        };
        Update: {
          admin_user_id?: string | null;
          after_payload?: Json | null;
          before_payload?: Json | null;
          created_at?: string;
          id?: string;
          pregunta_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'question_edit_audit_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_edit_audit_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_edit_audit_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      question_ratings: {
        Row: {
          created_at: string | null;
          id: string;
          pregunta_id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          pregunta_id: string;
          rating: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          pregunta_id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'question_ratings_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_ratings_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_ratings_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      rag_document_chunks: {
        Row: {
          chunk_index: number;
          chunk_text: string;
          created_at: string;
          id: string;
          materia_id: string | null;
          source_id: string | null;
          source_table: string;
          source_title: string | null;
        };
        Insert: {
          chunk_index: number;
          chunk_text: string;
          created_at?: string;
          id?: string;
          materia_id?: string | null;
          source_id?: string | null;
          source_table: string;
          source_title?: string | null;
        };
        Update: {
          chunk_index?: number;
          chunk_text?: string;
          created_at?: string;
          id?: string;
          materia_id?: string | null;
          source_id?: string | null;
          source_table?: string;
          source_title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rag_document_chunks_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      rag_explanation_feedback: {
        Row: {
          created_at: string;
          id: string;
          pregunta_id: string;
          user_id: string | null;
          voto: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          pregunta_id: string;
          user_id?: string | null;
          voto: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          pregunta_id?: string;
          user_id?: string | null;
          voto?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'rag_explanation_feedback_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_explanation_feedback_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_explanation_feedback_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      rag_explanations_cache: {
        Row: {
          explicacion: string;
          id: string;
          materia_id: string | null;
          parcial: number | null;
          pregunta_id: string;
          provider: string | null;
          source_used: string | null;
          updated_at: string;
        };
        Insert: {
          explicacion: string;
          id?: string;
          materia_id?: string | null;
          parcial?: number | null;
          pregunta_id: string;
          provider?: string | null;
          source_used?: string | null;
          updated_at?: string;
        };
        Update: {
          explicacion?: string;
          id?: string;
          materia_id?: string | null;
          parcial?: number | null;
          pregunta_id?: string;
          provider?: string | null;
          source_used?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rag_explanations_cache_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_explanations_cache_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_explanations_cache_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_explanations_cache_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      rag_generation_logs: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          materia_id: string | null;
          metadata: Json | null;
          pregunta_id: string | null;
          provider: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          materia_id?: string | null;
          metadata?: Json | null;
          pregunta_id?: string | null;
          provider?: string | null;
          status: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          materia_id?: string | null;
          metadata?: Json | null;
          pregunta_id?: string | null;
          provider?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rag_generation_logs_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_generation_logs_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_generation_logs_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_generation_logs_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      rag_question_stats: {
        Row: {
          id: string;
          materia_id: string | null;
          pregunta_id: string;
          updated_at: string;
          veces_fallada: number;
        };
        Insert: {
          id?: string;
          materia_id?: string | null;
          pregunta_id: string;
          updated_at?: string;
          veces_fallada?: number;
        };
        Update: {
          id?: string;
          materia_id?: string | null;
          pregunta_id?: string;
          updated_at?: string;
          veces_fallada?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'rag_question_stats_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_question_stats_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_question_stats_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rag_question_stats_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
        ];
      };
      rate_limits: {
        Row: {
          count: number;
          created_at: string;
          id: number;
          key: string;
          reset_at: string;
        };
        Insert: {
          count?: number;
          created_at?: string;
          id?: never;
          key: string;
          reset_at: string;
        };
        Update: {
          count?: number;
          created_at?: string;
          id?: never;
          key?: string;
          reset_at?: string;
        };
        Relationships: [];
      };
      recursos: {
        Row: {
          carrera_id: string | null;
          creado_at: string | null;
          etiqueta: string | null;
          id: string;
          materia_id: string | null;
          nombre: string;
          paginas: number | null;
          tipo: string | null;
          universidad_id: string | null;
          url_archivo: string | null;
        };
        Insert: {
          carrera_id?: string | null;
          creado_at?: string | null;
          etiqueta?: string | null;
          id?: string;
          materia_id?: string | null;
          nombre: string;
          paginas?: number | null;
          tipo?: string | null;
          universidad_id?: string | null;
          url_archivo?: string | null;
        };
        Update: {
          carrera_id?: string | null;
          creado_at?: string | null;
          etiqueta?: string | null;
          id?: string;
          materia_id?: string | null;
          nombre?: string;
          paginas?: number | null;
          tipo?: string | null;
          universidad_id?: string | null;
          url_archivo?: string | null;
        };
        Relationships: [];
      };
      resource_views: {
        Row: {
          created_at: string;
          id: string;
          resource_id: string;
          session_key: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          resource_id: string;
          session_key?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          resource_id?: string;
          session_key?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_views_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'recursos';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_votes: {
        Row: {
          created_at: string;
          id: string;
          resource_id: string;
          updated_at: string;
          user_id: string;
          vote_type: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          resource_id: string;
          updated_at?: string;
          user_id: string;
          vote_type: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          resource_id?: string;
          updated_at?: string;
          user_id?: string;
          vote_type?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_votes_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'recursos';
            referencedColumns: ['id'];
          },
        ];
      };
      resumen_votes: {
        Row: {
          id: string;
          resumen_id: string | null;
          user_id: string | null;
          vote_type: number | null;
        };
        Insert: {
          id?: string;
          resumen_id?: string | null;
          user_id?: string | null;
          vote_type?: number | null;
        };
        Update: {
          id?: string;
          resumen_id?: string | null;
          user_id?: string | null;
          vote_type?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resumen_votes_resumen_id_fkey';
            columns: ['resumen_id'];
            isOneToOne: false;
            referencedRelation: 'resumenes';
            referencedColumns: ['id'];
          },
        ];
      };
      resumenes: {
        Row: {
          author_name: string | null;
          created_at: string;
          file_url: string;
          id: string;
          materia_id: string | null;
          module_id: number;
          score: number | null;
          title: string;
        };
        Insert: {
          author_name?: string | null;
          created_at?: string;
          file_url: string;
          id?: string;
          materia_id?: string | null;
          module_id: number;
          score?: number | null;
          title: string;
        };
        Update: {
          author_name?: string | null;
          created_at?: string;
          file_url?: string;
          id?: string;
          materia_id?: string | null;
          module_id?: number;
          score?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resumenes_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      simulator_attempt_topic_events: {
        Row: {
          attempt_id: string;
          created_at: string;
          id: string;
          materia_id: string;
          parcial: number;
          pregunta_id: string;
          subtopic_id: string | null;
          topic_id: string;
          user_id: string;
          was_correct: boolean;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          id?: string;
          materia_id: string;
          parcial: number;
          pregunta_id: string;
          subtopic_id?: string | null;
          topic_id: string;
          user_id: string;
          was_correct?: boolean;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          id?: string;
          materia_id?: string;
          parcial?: number;
          pregunta_id?: string;
          subtopic_id?: string | null;
          topic_id?: string;
          user_id?: string;
          was_correct?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'simulator_attempt_topic_events_attempt_id_fkey';
            columns: ['attempt_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_attempts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_topic_events_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_topic_events_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_topic_events_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_topic_events_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_topic_events_subtopic_id_fkey';
            columns: ['subtopic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_subtopics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_topic_events_topic_id_fkey';
            columns: ['topic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_topics';
            referencedColumns: ['id'];
          },
        ];
      };
      simulator_attempt_wrong_questions: {
        Row: {
          attempt_id: string;
          created_at: string;
          id: string;
          materia_id: string;
          parcial: number;
          pregunta_id: string | null;
          premium_pregunta_id: string | null;
          user_id: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          id?: string;
          materia_id: string;
          parcial: number;
          pregunta_id?: string | null;
          premium_pregunta_id?: string | null;
          user_id: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          id?: string;
          materia_id?: string;
          parcial?: number;
          pregunta_id?: string | null;
          premium_pregunta_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulator_attempt_wrong_questions_attempt_id_fkey';
            columns: ['attempt_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_attempts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_wrong_questions_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_wrong_questions_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_wrong_questions_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_wrong_questions_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_attempt_wrong_questions_premium_pregunta_id_fkey';
            columns: ['premium_pregunta_id'];
            isOneToOne: false;
            referencedRelation: 'premium_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      simulator_attempts: {
        Row: {
          answered_questions: number;
          correct_answers: number;
          created_at: string;
          id: string;
          materia_id: string;
          mode: string;
          parcial: number;
          premium_only: boolean;
          total_questions: number;
          user_id: string;
          wrong_answers: number;
        };
        Insert: {
          answered_questions?: number;
          correct_answers?: number;
          created_at?: string;
          id?: string;
          materia_id: string;
          mode?: string;
          parcial: number;
          premium_only?: boolean;
          total_questions?: number;
          user_id: string;
          wrong_answers?: number;
        };
        Update: {
          answered_questions?: number;
          correct_answers?: number;
          created_at?: string;
          id?: string;
          materia_id?: string;
          mode?: string;
          parcial?: number;
          premium_only?: boolean;
          total_questions?: number;
          user_id?: string;
          wrong_answers?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'simulator_attempts_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      simulator_question_topic_links: {
        Row: {
          confidence_score: number;
          created_at: string;
          evidence: Json;
          id: string;
          materia_id: string;
          parcial: number | null;
          pregunta_id: string;
          source: string;
          subtopic_id: string | null;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          confidence_score?: number;
          created_at?: string;
          evidence?: Json;
          id?: string;
          materia_id: string;
          parcial?: number | null;
          pregunta_id: string;
          source?: string;
          subtopic_id?: string | null;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          confidence_score?: number;
          created_at?: string;
          evidence?: Json;
          id?: string;
          materia_id?: string;
          parcial?: number | null;
          pregunta_id?: string;
          source?: string;
          subtopic_id?: string | null;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulator_question_topic_links_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_question_topic_links_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'demo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_question_topic_links_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'preguntas_banco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_question_topic_links_pregunta_id_fkey';
            columns: ['pregunta_id'];
            isOneToOne: true;
            referencedRelation: 'preguntas_banco_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_question_topic_links_subtopic_id_fkey';
            columns: ['subtopic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_subtopics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'simulator_question_topic_links_topic_id_fkey';
            columns: ['topic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_topics';
            referencedColumns: ['id'];
          },
        ];
      };
      simulator_subtopics: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          source: string;
          subtopic_key: string;
          title: string;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          source?: string;
          subtopic_key: string;
          title: string;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          source?: string;
          subtopic_key?: string;
          title?: string;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulator_subtopics_topic_id_fkey';
            columns: ['topic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_topics';
            referencedColumns: ['id'];
          },
        ];
      };
      simulator_topics: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          materia_id: string;
          parcial: number | null;
          source: string;
          title: string;
          topic_key: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          materia_id: string;
          parcial?: number | null;
          source?: string;
          title: string;
          topic_key: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          materia_id?: string;
          parcial?: number | null;
          source?: string;
          title?: string;
          topic_key?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulator_topics_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_chunks: {
        Row: {
          chunk_index: number;
          chunk_text: string;
          content_hash: string | null;
          created_at: string;
          id: string;
          page_end: number | null;
          page_start: number | null;
          section_title: string | null;
          student_material_id: string;
        };
        Insert: {
          chunk_index: number;
          chunk_text: string;
          content_hash?: string | null;
          created_at?: string;
          id?: string;
          page_end?: number | null;
          page_start?: number | null;
          section_title?: string | null;
          student_material_id: string;
        };
        Update: {
          chunk_index?: number;
          chunk_text?: string;
          content_hash?: string | null;
          created_at?: string;
          id?: string;
          page_end?: number | null;
          page_start?: number | null;
          section_title?: string | null;
          student_material_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_chunks_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_feedback: {
        Row: {
          created_at: string;
          id: string;
          rating: string;
          report_note: string | null;
          report_reason: string | null;
          student_material_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          rating: string;
          report_note?: string | null;
          report_reason?: string | null;
          student_material_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          rating?: string;
          report_note?: string | null;
          report_reason?: string | null;
          student_material_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_feedback_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_ai_usage: {
        Row: {
          completion_tokens: number | null;
          created_at: string;
          id: string;
          model: string;
          operation: string;
          prompt_tokens: number | null;
          provider: string;
          student_material_id: string;
          total_tokens: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          completion_tokens?: number | null;
          created_at?: string;
          id?: string;
          model: string;
          operation: string;
          prompt_tokens?: number | null;
          provider: string;
          student_material_id: string;
          total_tokens?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          completion_tokens?: number | null;
          created_at?: string;
          id?: string;
          model?: string;
          operation?: string;
          prompt_tokens?: number | null;
          provider?: string;
          student_material_id?: string;
          total_tokens?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_ai_usage_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_flashcard_progress: {
        Row: {
          card_index: number;
          created_at: string;
          id: string;
          recall: string | null;
          student_material_id: string;
          updated_at: string;
          user_id: string;
          vote: string | null;
        };
        Insert: {
          card_index: number;
          created_at?: string;
          id?: string;
          recall?: string | null;
          student_material_id: string;
          updated_at?: string;
          user_id: string;
          vote?: string | null;
        };
        Update: {
          card_index?: number;
          created_at?: string;
          id?: string;
          recall?: string | null;
          student_material_id?: string;
          updated_at?: string;
          user_id?: string;
          vote?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_flashcard_progress_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_glossaries: {
        Row: {
          created_at: string;
          error_message: string | null;
          generated_at: string | null;
          glossary_items: Json;
          id: string;
          provider: string | null;
          status: string;
          student_material_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          generated_at?: string | null;
          glossary_items?: Json;
          id?: string;
          provider?: string | null;
          status?: string;
          student_material_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          generated_at?: string | null;
          glossary_items?: Json;
          id?: string;
          provider?: string | null;
          status?: string;
          student_material_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_glossaries_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: true;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_jobs: {
        Row: {
          attempts: number;
          completed_at: string | null;
          created_at: string;
          id: string;
          last_error: string | null;
          started_at: string | null;
          status: string;
          student_material_id: string;
        };
        Insert: {
          attempts?: number;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          started_at?: string | null;
          status?: string;
          student_material_id: string;
        };
        Update: {
          attempts?: number;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          started_at?: string | null;
          status?: string;
          student_material_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_jobs_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_material_summaries: {
        Row: {
          created_at: string;
          error_message: string | null;
          generated_at: string | null;
          id: string;
          key_points: Json;
          provider: string | null;
          source_chunks_count: number;
          status: string;
          student_material_id: string;
          summary_sections: Json;
          summary_short: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          generated_at?: string | null;
          id?: string;
          key_points?: Json;
          provider?: string | null;
          source_chunks_count?: number;
          status?: string;
          student_material_id: string;
          summary_sections?: Json;
          summary_short?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          generated_at?: string | null;
          id?: string;
          key_points?: Json;
          provider?: string | null;
          source_chunks_count?: number;
          status?: string;
          student_material_id?: string;
          summary_sections?: Json;
          summary_short?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_material_summaries_student_material_id_fkey';
            columns: ['student_material_id'];
            isOneToOne: true;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
        ];
      };
      student_materials: {
        Row: {
          carrera_id: string;
          created_at: string;
          document_analysis: Json | null;
          file_name: string;
          file_path: string;
          file_size_bytes: number | null;
          id: string;
          materia_id: string;
          mime_type: string | null;
          page_count: number | null;
          pages_processed: number | null;
          coverage_ratio: number | null;
          processing_error: string | null;
          processing_message: string | null;
          processing_progress: number;
          processing_stage: string;
          processing_status: string;
          processing_strategy: string | null;
          title: string;
          universidad_id: string;
          updated_at: string;
          user_id: string;
          visibility: string;
        };
        Insert: {
          carrera_id: string;
          created_at?: string;
          document_analysis?: Json | null;
          file_name: string;
          file_path: string;
          file_size_bytes?: number | null;
          id?: string;
          materia_id: string;
          mime_type?: string | null;
          page_count?: number | null;
          pages_processed?: number | null;
          coverage_ratio?: number | null;
          processing_error?: string | null;
          processing_message?: string | null;
          processing_progress?: number;
          processing_stage?: string;
          processing_status?: string;
          processing_strategy?: string | null;
          title: string;
          universidad_id: string;
          updated_at?: string;
          user_id: string;
          visibility?: string;
        };
        Update: {
          carrera_id?: string;
          created_at?: string;
          document_analysis?: Json | null;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number | null;
          id?: string;
          materia_id?: string;
          mime_type?: string | null;
          page_count?: number | null;
          pages_processed?: number | null;
          coverage_ratio?: number | null;
          processing_error?: string | null;
          processing_message?: string | null;
          processing_progress?: number;
          processing_stage?: string;
          processing_status?: string;
          processing_strategy?: string | null;
          title?: string;
          universidad_id?: string;
          updated_at?: string;
          user_id?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_materials_carrera_id_fkey';
            columns: ['carrera_id'];
            isOneToOne: false;
            referencedRelation: 'carreras';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_materials_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_materials_universidad_id_fkey';
            columns: ['universidad_id'];
            isOneToOne: false;
            referencedRelation: 'universidades';
            referencedColumns: ['id'];
          },
        ];
      };
      student_topic_performance: {
        Row: {
          attempts_count: number;
          correct_count: number;
          created_at: string;
          id: string;
          last_answer_at: string | null;
          last_wrong_at: string | null;
          mastery_score: number;
          materia_id: string;
          parcial: number;
          subtopic_id: string | null;
          topic_id: string;
          updated_at: string;
          user_id: string;
          wrong_count: number;
        };
        Insert: {
          attempts_count?: number;
          correct_count?: number;
          created_at?: string;
          id?: string;
          last_answer_at?: string | null;
          last_wrong_at?: string | null;
          mastery_score?: number;
          materia_id: string;
          parcial: number;
          subtopic_id?: string | null;
          topic_id: string;
          updated_at?: string;
          user_id: string;
          wrong_count?: number;
        };
        Update: {
          attempts_count?: number;
          correct_count?: number;
          created_at?: string;
          id?: string;
          last_answer_at?: string | null;
          last_wrong_at?: string | null;
          mastery_score?: number;
          materia_id?: string;
          parcial?: number;
          subtopic_id?: string | null;
          topic_id?: string;
          updated_at?: string;
          user_id?: string;
          wrong_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'student_topic_performance_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_topic_performance_subtopic_id_fkey';
            columns: ['subtopic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_subtopics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_topic_performance_topic_id_fkey';
            columns: ['topic_id'];
            isOneToOne: false;
            referencedRelation: 'simulator_topics';
            referencedColumns: ['id'];
          },
        ];
      };
      study_calendar_events: {
        Row: {
          carrera_id: string | null;
          carrera_nombre: string | null;
          created_at: string;
          event_date: string;
          event_type: string;
          exam_instance: string | null;
          id: string;
          material_id: string | null;
          materia_id: string | null;
          materia_nombre: string | null;
          notes: string | null;
          reminder_days_before: Json | null;
          source_payload: Json | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          carrera_id?: string | null;
          carrera_nombre?: string | null;
          created_at?: string;
          event_date: string;
          event_type: string;
          exam_instance?: string | null;
          id?: string;
          material_id?: string | null;
          materia_id?: string | null;
          materia_nombre?: string | null;
          notes?: string | null;
          reminder_days_before?: Json | null;
          source_payload?: Json | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          carrera_id?: string | null;
          carrera_nombre?: string | null;
          created_at?: string;
          event_date?: string;
          event_type?: string;
          exam_instance?: string | null;
          id?: string;
          material_id?: string | null;
          materia_id?: string | null;
          materia_nombre?: string | null;
          notes?: string | null;
          reminder_days_before?: Json | null;
          source_payload?: Json | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'study_calendar_events_carrera_id_fkey';
            columns: ['carrera_id'];
            isOneToOne: false;
            referencedRelation: 'carreras';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'study_calendar_events_material_id_fkey';
            columns: ['material_id'];
            isOneToOne: false;
            referencedRelation: 'student_materials';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'study_calendar_events_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_plans: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          interval: string;
          is_active: boolean;
          name: string;
          price_ars: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          interval?: string;
          is_active?: boolean;
          name: string;
          price_ars?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          interval?: string;
          is_active?: boolean;
          name?: string;
          price_ars?: number;
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
          carrera_id: string | null;
          created_at: string;
          id: string;
          materia_id: string | null;
          user_id: string;
        };
        Insert: {
          carrera_id?: string | null;
          created_at?: string;
          id?: string;
          materia_id?: string | null;
          user_id: string;
        };
        Update: {
          carrera_id?: string | null;
          created_at?: string;
          id?: string;
          materia_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_favorites_carrera_id_fkey';
            columns: ['carrera_id'];
            isOneToOne: false;
            referencedRelation: 'carreras';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_favorites_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      user_notifications: {
        Row: {
          body: string;
          created_at: string;
          days_before: number | null;
          event_date: string | null;
          event_id: string | null;
          id: string;
          materia_nombre: string | null;
          seen_at: string | null;
          status: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          days_before?: number | null;
          event_date?: string | null;
          event_id?: string | null;
          id?: string;
          materia_nombre?: string | null;
          seen_at?: string | null;
          status?: string;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          days_before?: number | null;
          event_date?: string | null;
          event_id?: string | null;
          id?: string;
          materia_nombre?: string | null;
          seen_at?: string | null;
          status?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_notifications_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'study_calendar_events';
            referencedColumns: ['id'];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          amount_ars: number | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          payment_provider: string | null;
          payment_reference: string | null;
          plan_id: string;
          started_at: string;
          status: string;
          user_id: string;
        };
        Insert: {
          amount_ars?: number | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          plan_id: string;
          started_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          amount_ars?: number | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          plan_id?: string;
          started_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      demo_questions: {
        Row: {
          correct_count: number | null;
          enunciado: string | null;
          id: string | null;
          materia_id: string | null;
          opciones: Json | null;
          parcial: number | null;
        };
        Insert: {
          correct_count?: never;
          enunciado?: string | null;
          id?: string | null;
          materia_id?: string | null;
          opciones?: Json | null;
          parcial?: number | null;
        };
        Update: {
          correct_count?: never;
          enunciado?: string | null;
          id?: string | null;
          materia_id?: string | null;
          opciones?: Json | null;
          parcial?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'preguntas_banco_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      preguntas_banco_public: {
        Row: {
          creado_at: string | null;
          enunciado: string | null;
          id: string | null;
          materia_id: string | null;
          opciones: Json | null;
          parcial: number | null;
        };
        Insert: {
          creado_at?: string | null;
          enunciado?: string | null;
          id?: string | null;
          materia_id?: string | null;
          opciones?: Json | null;
          parcial?: number | null;
        };
        Update: {
          creado_at?: string | null;
          enunciado?: string | null;
          id?: string | null;
          materia_id?: string | null;
          opciones?: Json | null;
          parcial?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'preguntas_banco_materia_id_fkey';
            columns: ['materia_id'];
            isOneToOne: false;
            referencedRelation: 'materias';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_view_counts: {
        Row: {
          resource_id: string | null;
          views: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_views_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'recursos';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      archive_analytics_events: {
        Args: {
          p_batch_size?: number;
          p_max_batches?: number;
          p_retention_days?: number;
        };
        Returns: {
          archived_rows: number;
          remaining_in_main: number;
        }[];
      };
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
      current_user_is_admin: { Args: never; Returns: boolean };
      get_question_rating_summary: {
        Args: { p_pregunta_id: string };
        Returns: {
          dislikes: number;
          likes: number;
          user_rating: number;
        }[];
      };
      get_resource_vote_summaries: {
        Args: { p_resource_ids: string[]; p_user_id?: string };
        Returns: {
          dislikes: number;
          likes: number;
          resource_id: string;
          score: number;
          user_vote: number;
        }[];
      };
      get_simulator_ratings_summary: {
        Args: { p_materia_id: string };
        Returns: {
          dislikes: number;
          likes: number;
          parcial: number;
        }[];
      };
      get_user_partial_stats: {
        Args: { p_materia_id: string; p_parcial: number; p_user_id: string };
        Returns: {
          correctas: number;
          distintas_preguntas: number;
          total_preguntas: number;
          total_respuestas: number;
        }[];
      };
      get_warmup_candidates: {
        Args: { p_lookback_days?: number; p_pool_size?: number };
        Returns: {
          creado_at: string;
          enunciado: string;
          error_frequency: number;
          materia_id: string;
          materia_usage: number;
          opciones: Json;
          parcial: number;
          parcial_usage: number;
          pregunta_id: string;
          recommendation_score: number;
          respuesta_correcta: string;
          tasa_acierto: number;
        }[];
      };
      increment_ai_daily_usage: { Args: { p_user_id: string }; Returns: number };
      reset_test_user_data: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
