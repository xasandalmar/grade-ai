export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          id: string
          metadata: Json
          school_id: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          id?: string
          metadata?: Json
          school_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          id?: string
          metadata?: Json
          school_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          provider_message_id: string | null
          recipient: string
          school_id: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          recipient: string
          school_id?: string | null
          status: string
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          recipient?: string
          school_id?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          components: Json | null
          exam_id: string
          id: string
          mark: number
          school_id: string
          student_id: string
          subject_id: string
        }
        Insert: {
          components?: Json | null
          exam_id: string
          id?: string
          mark: number
          school_id: string
          student_id: string
          subject_id: string
        }
        Update: {
          components?: Json | null
          exam_id?: string
          id?: string
          mark?: number
          school_id?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_results_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "exam_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_exam_subject_stats"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      exam_students: {
        Row: {
          created_at: string
          exam_id: string
          full_name: string
          id: string
          school_id: string
          student_code: string | null
        }
        Insert: {
          created_at?: string
          exam_id: string
          full_name: string
          id?: string
          school_id: string
          student_code?: string | null
        }
        Update: {
          created_at?: string
          exam_id?: string
          full_name?: string
          id?: string
          school_id?: string
          student_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_students_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_students_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          exam_id: string
          id: string
          max_mark: number
          name: string
          pass_mark: number
          school_id: string
        }
        Insert: {
          exam_id: string
          id?: string
          max_mark?: number
          name: string
          pass_mark?: number
          school_id: string
        }
        Update: {
          exam_id?: string
          id?: string
          max_mark?: number
          name?: string
          pass_mark?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_name: string
          created_at: string
          exam_date: string | null
          file_name: string | null
          id: string
          row_count: number
          school_id: string
          status: Database["public"]["Enums"]["exam_status"]
          title: string
        }
        Insert: {
          class_name: string
          created_at?: string
          exam_date?: string | null
          file_name?: string | null
          id?: string
          row_count?: number
          school_id: string
          status?: Database["public"]["Enums"]["exam_status"]
          title: string
        }
        Update: {
          class_name?: string
          created_at?: string
          exam_date?: string | null
          file_name?: string | null
          id?: string
          row_count?: number
          school_id?: string
          status?: Database["public"]["Enums"]["exam_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_active_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          last_active_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_active_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_summary: Json | null
          created_at: string
          data: Json
          exam_id: string
          id: string
          language: string
          pdf_url: string | null
          school_id: string
          status: Database["public"]["Enums"]["report_status"]
          student_id: string | null
          type: Database["public"]["Enums"]["report_type"]
        }
        Insert: {
          ai_summary?: Json | null
          created_at?: string
          data: Json
          exam_id: string
          id?: string
          language?: string
          pdf_url?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["report_status"]
          student_id?: string | null
          type: Database["public"]["Enums"]["report_type"]
        }
        Update: {
          ai_summary?: Json | null
          created_at?: string
          data?: Json
          exam_id?: string
          id?: string
          language?: string
          pdf_url?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          student_id?: string | null
          type?: Database["public"]["Enums"]["report_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "exam_students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_exam_student_stats: {
        Row: {
          average: number | null
          exam_id: string | null
          failed_count: number | null
          full_name: string | null
          grade: string | null
          max_total: number | null
          passed_count: number | null
          percentage: number | null
          rank: number | null
          school_id: string | null
          strongest_subject_id: string | null
          student_code: string | null
          student_id: string | null
          subject_count: number | null
          total: number | null
          weakest_subject_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "exam_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["strongest_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["weakest_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["strongest_subject_id"]
            isOneToOne: false
            referencedRelation: "v_exam_subject_stats"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["weakest_subject_id"]
            isOneToOne: false
            referencedRelation: "v_exam_subject_stats"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "exam_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_exam_subject_stats: {
        Row: {
          average: number | null
          exam_id: string | null
          failed_count: number | null
          highest: number | null
          lowest: number | null
          max_mark: number | null
          name: string | null
          pass_mark: number | null
          pass_rate: number | null
          passed_count: number | null
          school_id: string | null
          subject_id: string | null
          total_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_exam_subject_term_stats: {
        Row: {
          average: number | null
          exam_id: string | null
          school_id: string | null
          subject_id: string | null
          subject_name: string | null
          term_key: string | null
          total_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "v_exam_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_exam_subject_stats"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "exam_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_exam_summary: {
        Row: {
          class_average: number | null
          exam_id: string | null
          fail_rate: number | null
          pass_rate: number | null
          school_id: string | null
          student_count: number | null
          subject_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_my_school: {
        Args: { p_address?: string; p_name: string; p_phone?: string }
        Returns: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
        }
        SetofOptions: {
          from: "*"
          to: "schools"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      exam_status: "uploaded" | "analyzed" | "failed"
      report_status: "generated" | "failed"
      report_type: "exam" | "student"
      user_role: "user" | "super_admin"
      user_status: "active" | "suspended" | "deactivated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exam_status: ["uploaded", "analyzed", "failed"],
      report_status: ["generated", "failed"],
      report_type: ["exam", "student"],
      user_role: ["user", "super_admin"],
      user_status: ["active", "suspended", "deactivated"],
    },
  },
} as const
