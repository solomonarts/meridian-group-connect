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
      allocation_approvals: {
        Row: {
          allocation_id: string
          approved_at: string
          id: string
          leader_id: string
        }
        Insert: {
          allocation_id: string
          approved_at?: string
          id?: string
          leader_id: string
        }
        Update: {
          allocation_id?: string
          approved_at?: string
          id?: string
          leader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_approvals_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "slot_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          group_id: string
          id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          group_id: string
          id?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          group_id?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          country: string | null
          created_at: string
          email: string
          full_name: string
          group_id: string
          id: string
          motivation: string | null
          notes: string | null
          reviewer_id: string | null
          slots_requested: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          group_id: string
          id?: string
          motivation?: string | null
          notes?: string | null
          reviewer_id?: string | null
          slots_requested?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          group_id?: string
          id?: string
          motivation?: string | null
          notes?: string | null
          reviewer_id?: string | null
          slots_requested?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          group_id: string | null
          id: string
          payload: Json | null
          title: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          group_id?: string | null
          id?: string
          payload?: Json | null
          title: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          group_id?: string | null
          id?: string
          payload?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_votes: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          user_id: string
          vote: Database["public"]["Enums"]["deal_vote"]
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          user_id: string
          vote: Database["public"]["Enums"]["deal_vote"]
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["deal_vote"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_votes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          asset_type: string | null
          closes_at: string | null
          created_at: string
          created_by: string | null
          group_id: string
          id: string
          location: string | null
          opens_at: string | null
          slot_count: number
          slot_price: number | null
          status: Database["public"]["Enums"]["deal_status"]
          summary: string | null
          target_amount: number | null
          title: string
          updated_at: string
        }
        Insert: {
          asset_type?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          group_id: string
          id?: string
          location?: string | null
          opens_at?: string | null
          slot_count?: number
          slot_price?: number | null
          status?: Database["public"]["Enums"]["deal_status"]
          summary?: string | null
          target_amount?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          asset_type?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          group_id?: string
          id?: string
          location?: string | null
          opens_at?: string | null
          slot_count?: number
          slot_price?: number | null
          status?: Database["public"]["Enums"]["deal_status"]
          summary?: string | null
          target_amount?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      document_events: {
        Row: {
          created_at: string
          document_id: string
          event_type: Database["public"]["Enums"]["doc_event_type"]
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          event_type: Database["public"]["Enums"]["doc_event_type"]
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          event_type?: Database["public"]["Enums"]["doc_event_type"]
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          document_id: string
          id: string
          signed_at: string
          user_id: string
        }
        Insert: {
          document_id: string
          id?: string
          signed_at?: string
          user_id: string
        }
        Update: {
          document_id?: string
          id?: string
          signed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          mime_type: string | null
          requires_signature: boolean
          size_bytes: number | null
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          mime_type?: string | null
          requires_signature?: boolean
          size_bytes?: number | null
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          mime_type?: string | null
          requires_signature?: boolean
          size_bytes?: number | null
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slot_capacity: number
          slot_price: number | null
          slug: string
          subscription_terms: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slot_capacity?: number
          slot_price?: number | null
          slug: string
          subscription_terms?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slot_capacity?: number
          slot_price?: number | null
          slug?: string
          subscription_terms?: string | null
        }
        Relationships: []
      }
      leadership_positions: {
        Row: {
          appointed_at: string
          appointed_by: string | null
          group_id: string
          id: string
          position: Database["public"]["Enums"]["leadership_role"]
          user_id: string
        }
        Insert: {
          appointed_at?: string
          appointed_by?: string | null
          group_id: string
          id?: string
          position?: Database["public"]["Enums"]["leadership_role"]
          user_id: string
        }
        Update: {
          appointed_at?: string
          appointed_by?: string | null
          group_id?: string
          id?: string
          position?: Database["public"]["Enums"]["leadership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_positions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["payment_status"] | null
          id: string
          note: string | null
          payment_id: string
          to_status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["payment_status"] | null
          id?: string
          note?: string | null
          payment_id: string
          to_status: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["payment_status"] | null
          id?: string
          note?: string | null
          payment_id?: string
          to_status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deal_id: string | null
          description: string | null
          due_at: string | null
          group_id: string
          id: string
          proof_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          group_id: string
          id?: string
          proof_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          group_id?: string
          id?: string
          proof_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          id: string
          label: string
          poll_id: string
          position: number
        }
        Insert: {
          id?: string
          label: string
          poll_id: string
          position?: number
        }
        Update: {
          id?: string
          label?: string
          poll_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          group_id: string
          id: string
          question: string
          status: Database["public"]["Enums"]["poll_status"]
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_id: string
          id?: string
          question: string
          status?: Database["public"]["Enums"]["poll_status"]
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_id?: string
          id?: string
          question?: string
          status?: Database["public"]["Enums"]["poll_status"]
        }
        Relationships: [
          {
            foreignKeyName: "polls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_assets: {
        Row: {
          acquisition_value: number | null
          allocation_pct: number | null
          asset_type: string
          created_at: string
          current_value: number | null
          description: string | null
          group_id: string
          id: string
          income_type: string | null
          location: string | null
          name: string
          status: Database["public"]["Enums"]["asset_status"]
        }
        Insert: {
          acquisition_value?: number | null
          allocation_pct?: number | null
          asset_type: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          group_id: string
          id?: string
          income_type?: string | null
          location?: string | null
          name: string
          status?: Database["public"]["Enums"]["asset_status"]
        }
        Update: {
          acquisition_value?: number | null
          allocation_pct?: number | null
          asset_type?: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          group_id?: string
          id?: string
          income_type?: string | null
          location?: string | null
          name?: string
          status?: Database["public"]["Enums"]["asset_status"]
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_assets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          contributions: number
          created_at: string
          distributions: number
          group_id: string
          id: string
          irr: number | null
          nav: number
          period: string
        }
        Insert: {
          contributions?: number
          created_at?: string
          distributions?: number
          group_id: string
          id?: string
          irr?: number | null
          nav?: number
          period: string
        }
        Update: {
          contributions?: number
          created_at?: string
          distributions?: number
          group_id?: string
          id?: string
          irr?: number | null
          nav?: number
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_allocations: {
        Row: {
          created_at: string
          deal_id: string | null
          group_id: string
          id: string
          notes: string | null
          slots_requested: number
          status: Database["public"]["Enums"]["allocation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          group_id: string
          id?: string
          notes?: string | null
          slots_requested: number
          status?: Database["public"]["Enums"]["allocation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          group_id?: string
          id?: string
          notes?: string | null
          slots_requested?: number
          status?: Database["public"]["Enums"]["allocation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_allocations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_allocations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deal_slot_availability: {
        Args: { _deal_id: string }
        Returns: {
          allocated: number
          available: number
          total: number
        }[]
      }
      deal_vote_tally: {
        Args: { _deal_id: string }
        Returns: {
          abstain: number
          no: number
          yes: number
        }[]
      }
      group_slot_availability: {
        Args: { _group_id: string }
        Returns: {
          allocated: number
          available: number
          total: number
        }[]
      }
      has_group_role: {
        Args: {
          _group_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _uid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_leader: {
        Args: { _group_id: string; _uid: string }
        Returns: boolean
      }
      is_group_manager: {
        Args: { _group_id: string; _uid: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _uid: string }
        Returns: boolean
      }
      is_system_admin: { Args: { _uid: string }; Returns: boolean }
      poll_vote_tally: {
        Args: { _poll_id: string }
        Returns: {
          label: string
          option_id: string
          votes: number
        }[]
      }
    }
    Enums: {
      allocation_status: "requested" | "approved" | "committed" | "cancelled"
      app_role: "admin" | "manager" | "member" | "applicant"
      application_status:
        | "submitted"
        | "review"
        | "kyc"
        | "approved"
        | "rejected"
      asset_status: "owned" | "under_review" | "target" | "partner"
      audit_event_type:
        | "governance"
        | "treasury"
        | "membership"
        | "portfolio"
        | "kyc"
      deal_status: "draft" | "open" | "closed" | "cancelled"
      deal_vote: "yes" | "no" | "abstain"
      doc_event_type:
        | "uploaded"
        | "viewed"
        | "downloaded"
        | "signed"
        | "revoked"
      leadership_role: "chair" | "secretary" | "treasurer" | "leader"
      payment_status:
        | "pending"
        | "submitted"
        | "verified"
        | "paid"
        | "overdue"
        | "cancelled"
      poll_status: "open" | "closed"
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
    Enums: {
      allocation_status: ["requested", "approved", "committed", "cancelled"],
      app_role: ["admin", "manager", "member", "applicant"],
      application_status: [
        "submitted",
        "review",
        "kyc",
        "approved",
        "rejected",
      ],
      asset_status: ["owned", "under_review", "target", "partner"],
      audit_event_type: [
        "governance",
        "treasury",
        "membership",
        "portfolio",
        "kyc",
      ],
      deal_status: ["draft", "open", "closed", "cancelled"],
      deal_vote: ["yes", "no", "abstain"],
      doc_event_type: ["uploaded", "viewed", "downloaded", "signed", "revoked"],
      leadership_role: ["chair", "secretary", "treasurer", "leader"],
      payment_status: [
        "pending",
        "submitted",
        "verified",
        "paid",
        "overdue",
        "cancelled",
      ],
      poll_status: ["open", "closed"],
    },
  },
} as const
