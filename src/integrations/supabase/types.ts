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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          target: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          target?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          target?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          employee_id: string | null
          employee_name: string | null
          id: string
          late_minutes: number
          status: string
          updated_at: string
          work_date: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          late_minutes?: number
          status?: string
          updated_at?: string
          work_date?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          late_minutes?: number
          status?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      deductions: {
        Row: {
          active: boolean
          amount: number
          calc_type: string
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          calc_type?: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          calc_type?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          branch: string
          created_at: string
          id: string
          manager_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          branch?: string
          created_at?: string
          id?: string
          manager_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          branch?: string
          created_at?: string
          id?: string
          manager_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          allowances: number
          bank_name: string | null
          basic_salary: number
          branch: string | null
          contract_end: string | null
          created_at: string
          department: string | null
          email: string | null
          emp_no: string
          full_name: string
          gender: string | null
          hire_date: string | null
          iban: string | null
          id: string
          job_title: string | null
          manager_name: string | null
          national_id: string | null
          nationality: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allowances?: number
          bank_name?: string | null
          basic_salary?: number
          branch?: string | null
          contract_end?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emp_no: string
          full_name: string
          gender?: string | null
          hire_date?: string | null
          iban?: string | null
          id?: string
          job_title?: string | null
          manager_name?: string | null
          national_id?: string | null
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allowances?: number
          bank_name?: string | null
          basic_salary?: number
          branch?: string | null
          contract_end?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emp_no?: string
          full_name?: string
          gender?: string | null
          hire_date?: string | null
          iban?: string | null
          id?: string
          job_title?: string | null
          manager_name?: string | null
          national_id?: string | null
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          active: boolean
          amount: number
          calc_type: string
          created_at: string
          gosi_subject: boolean
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          calc_type?: string
          created_at?: string
          gosi_subject?: boolean
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          calc_type?: string
          created_at?: string
          gosi_subject?: boolean
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          balance_before: number | null
          created_at: string
          days: number
          employee_id: string | null
          employee_name: string | null
          from_date: string
          id: string
          leave_type: string
          notes: string | null
          status: string
          to_date: string
          updated_at: string
        }
        Insert: {
          balance_before?: number | null
          created_at?: string
          days?: number
          employee_id?: string | null
          employee_name?: string | null
          from_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          status?: string
          to_date?: string
          updated_at?: string
        }
        Update: {
          balance_before?: number | null
          created_at?: string
          days?: number
          employee_id?: string | null
          employee_name?: string | null
          from_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          status?: string
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          created_at: string
          employee_id: string | null
          employee_name: string | null
          id: string
          installments: number
          monthly_amount: number
          notes: string | null
          paid_amount: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          installments?: number
          monthly_amount?: number
          notes?: string | null
          paid_amount?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          installments?: number
          monthly_amount?: number
          notes?: string | null
          paid_amount?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          employees_count: number
          id: string
          month: number
          status: string
          title: string
          total_deductions: number
          total_gross: number
          total_net: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          employees_count?: number
          id?: string
          month?: number
          status?: string
          title: string
          total_deductions?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          employees_count?: number
          id?: string
          month?: number
          status?: string
          title?: string
          total_deductions?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      requests: {
        Row: {
          amount: number | null
          created_at: string
          employee_id: string | null
          employee_name: string | null
          id: string
          notes: string | null
          request_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
