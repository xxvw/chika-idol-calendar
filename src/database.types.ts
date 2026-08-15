export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  app: {
    Tables: {
      data_sources: {
        Row: {
          base_url: string | null
          created_at: string
          id: number
          name: string
          source_type: string
          trust_level: number
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: never
          name: string
          source_type: string
          trust_level?: number
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: never
          name?: string
          source_type?: string
          trust_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_aliases: {
        Row: {
          created_at: string
          event_id: number
          id: number
          normalized_title: string | null
          title: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: never
          normalized_title?: string | null
          title: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: never
          normalized_title?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_aliases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_appearances: {
        Row: {
          appearance_status: string
          billing_order: number | null
          created_at: string
          ends_at: string | null
          event_id: number
          event_stage_id: number | null
          group_id: number | null
          id: number
          member_id: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          appearance_status?: string
          billing_order?: number | null
          created_at?: string
          ends_at?: string | null
          event_id: number
          event_stage_id?: number | null
          group_id?: number | null
          id?: never
          member_id?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          appearance_status?: string
          billing_order?: number | null
          created_at?: string
          ends_at?: string | null
          event_id?: number
          event_stage_id?: number | null
          group_id?: number | null
          id?: never
          member_id?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_appearances_event_id_event_stage_id_fkey"
            columns: ["event_id", "event_stage_id"]
            isOneToOne: false
            referencedRelation: "event_stages"
            referencedColumns: ["event_id", "id"]
          },
          {
            foreignKeyName: "event_appearances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_appearances_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_appearances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_external_links: {
        Row: {
          created_at: string
          event_id: number
          external_link_id: number
          is_primary: boolean
          relation_type: string
        }
        Insert: {
          created_at?: string
          event_id: number
          external_link_id: number
          is_primary?: boolean
          relation_type: string
        }
        Update: {
          created_at?: string
          event_id?: number
          external_link_id?: number
          is_primary?: boolean
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_external_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_external_links_external_link_id_fkey"
            columns: ["external_link_id"]
            isOneToOne: false
            referencedRelation: "external_links"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          normalized_name: string | null
          publication_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          name: string
          normalized_name?: string | null
          publication_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          name?: string
          normalized_name?: string | null
          publication_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_source_records: {
        Row: {
          event_id: number
          external_key: string | null
          observed_at: string
          source_id: number
          source_url: string | null
          verified_at: string | null
        }
        Insert: {
          event_id: number
          external_key?: string | null
          observed_at?: string
          source_id: number
          source_url?: string | null
          verified_at?: string | null
        }
        Update: {
          event_id?: number
          external_key?: string | null
          observed_at?: string
          source_id?: number
          source_url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_source_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stages: {
        Row: {
          created_at: string
          event_id: number
          event_venue_id: number
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          event_id: number
          event_venue_id: number
          id?: never
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          event_id?: number
          event_venue_id?: number
          id?: never
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_stages_event_id_event_venue_id_fkey"
            columns: ["event_id", "event_venue_id"]
            isOneToOne: false
            referencedRelation: "event_venues"
            referencedColumns: ["event_id", "id"]
          },
          {
            foreignKeyName: "event_stages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          created_at: string
          event_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string
          event_id: number
          tag_id: number
        }
        Update: {
          created_at?: string
          event_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_venues: {
        Row: {
          created_at: string
          event_id: number
          id: number
          sort_order: number
          venue_id: number
          venue_role: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: never
          sort_order?: number
          venue_id: number
          venue_role?: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: never
          sort_order?: number
          venue_id?: number
          venue_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_venues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          doors_at: string | null
          end_date: string
          ends_at: string | null
          id: number
          is_online: boolean
          max_price_jpy: number | null
          merged_into_id: number | null
          min_price_jpy: number | null
          normalized_title: string | null
          publication_status: string
          schedule_status: string
          series_id: number | null
          start_date: string
          starts_at: string | null
          ticket_status: string
          time_zone: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doors_at?: string | null
          end_date: string
          ends_at?: string | null
          id?: never
          is_online?: boolean
          max_price_jpy?: number | null
          merged_into_id?: number | null
          min_price_jpy?: number | null
          normalized_title?: string | null
          publication_status?: string
          schedule_status?: string
          series_id?: number | null
          start_date: string
          starts_at?: string | null
          ticket_status?: string
          time_zone?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doors_at?: string | null
          end_date?: string
          ends_at?: string | null
          id?: never
          is_online?: boolean
          max_price_jpy?: number | null
          merged_into_id?: number | null
          min_price_jpy?: number | null
          normalized_title?: string | null
          publication_status?: string
          schedule_status?: string
          series_id?: number | null
          start_date?: string
          starts_at?: string | null
          ticket_status?: string
          time_zone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      external_links: {
        Row: {
          canonical_url: string
          created_at: string
          external_id: string | null
          id: number
          label: string | null
          link_type: string
          platform: string
          published_at: string | null
          url: string
          verified_at: string | null
          x_author_handle: string | null
        }
        Insert: {
          canonical_url: string
          created_at?: string
          external_id?: string | null
          id?: never
          label?: string | null
          link_type: string
          platform: string
          published_at?: string | null
          url: string
          verified_at?: string | null
          x_author_handle?: string | null
        }
        Update: {
          canonical_url?: string
          created_at?: string
          external_id?: string | null
          id?: never
          label?: string | null
          link_type?: string
          platform?: string
          published_at?: string | null
          url?: string
          verified_at?: string | null
          x_author_handle?: string | null
        }
        Relationships: []
      }
      group_aliases: {
        Row: {
          created_at: string
          group_id: number
          id: number
          name: string
          normalized_name: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          group_id: number
          id?: never
          name: string
          normalized_name?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          group_id?: number
          id?: never
          name?: string
          normalized_name?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_aliases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_external_links: {
        Row: {
          created_at: string
          external_link_id: number
          group_id: number
          is_primary: boolean
          relation_type: string
        }
        Insert: {
          created_at?: string
          external_link_id: number
          group_id: number
          is_primary?: boolean
          relation_type: string
        }
        Update: {
          created_at?: string
          external_link_id?: number
          group_id?: number
          is_primary?: boolean
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_external_links_external_link_id_fkey"
            columns: ["external_link_id"]
            isOneToOne: false
            referencedRelation: "external_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_external_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string
          group_id: number
          id: number
          member_id: number
          role_name: string | null
          updated_at: string
        }
        Insert: {
          active_from: string
          active_until?: string | null
          created_at?: string
          group_id: number
          id?: never
          member_id: number
          role_name?: string | null
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          group_id?: number
          id?: never
          member_id?: number
          role_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_source_records: {
        Row: {
          external_key: string | null
          group_id: number
          observed_at: string
          source_id: number
          source_url: string | null
          verified_at: string | null
        }
        Insert: {
          external_key?: string | null
          group_id: number
          observed_at?: string
          source_id: number
          source_url?: string | null
          verified_at?: string | null
        }
        Update: {
          external_key?: string | null
          group_id?: number
          observed_at?: string
          source_id?: number
          source_url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_source_records_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      group_tags: {
        Row: {
          created_at: string
          group_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string
          group_id: number
          tag_id: number
        }
        Update: {
          created_at?: string
          group_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_tags_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      idol_groups: {
        Row: {
          created_at: string
          description: string | null
          disbanded_on: string | null
          formed_on: string | null
          id: number
          lifecycle_status: string
          merged_into_id: number | null
          name: string
          normalized_name: string | null
          publication_status: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          disbanded_on?: string | null
          formed_on?: string | null
          id?: never
          lifecycle_status?: string
          merged_into_id?: number | null
          name: string
          normalized_name?: string | null
          publication_status?: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          disbanded_on?: string | null
          formed_on?: string | null
          id?: never
          lifecycle_status?: string
          merged_into_id?: number | null
          name?: string
          normalized_name?: string | null
          publication_status?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idol_groups_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "idol_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      member_aliases: {
        Row: {
          created_at: string
          id: number
          member_id: number
          name: string
          normalized_name: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          member_id: number
          name: string
          normalized_name?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          member_id?: number
          name?: string
          normalized_name?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_aliases_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_external_links: {
        Row: {
          created_at: string
          external_link_id: number
          is_primary: boolean
          member_id: number
          relation_type: string
        }
        Insert: {
          created_at?: string
          external_link_id: number
          is_primary?: boolean
          member_id: number
          relation_type: string
        }
        Update: {
          created_at?: string
          external_link_id?: number
          is_primary?: boolean
          member_id?: number
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_external_links_external_link_id_fkey"
            columns: ["external_link_id"]
            isOneToOne: false
            referencedRelation: "external_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_external_links_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_source_records: {
        Row: {
          external_key: string | null
          member_id: number
          observed_at: string
          source_id: number
          source_url: string | null
          verified_at: string | null
        }
        Insert: {
          external_key?: string | null
          member_id: number
          observed_at?: string
          source_id: number
          source_url?: string | null
          verified_at?: string | null
        }
        Update: {
          external_key?: string | null
          member_id?: number
          observed_at?: string
          source_id?: number
          source_url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_source_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          id: number
          lifecycle_status: string
          merged_into_id: number | null
          normalized_stage_name: string | null
          publication_status: string
          stage_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          lifecycle_status?: string
          merged_into_id?: number | null
          normalized_stage_name?: string | null
          publication_status?: string
          stage_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          lifecycle_status?: string
          merged_into_id?: number | null
          normalized_stage_name?: string | null
          publication_status?: string
          stage_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          city: string | null
          created_at: string
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          normalized_name: string | null
          prefecture_code: string | null
          publication_status: string
          street_address: string | null
          time_zone: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: never
          latitude?: number | null
          longitude?: number | null
          name: string
          normalized_name?: string | null
          prefecture_code?: string | null
          publication_status?: string
          street_address?: string | null
          time_zone?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: never
          latitude?: number | null
          longitude?: number | null
          name?: string
          normalized_name?: string | null
          prefecture_code?: string | null
          publication_status?: string
          street_address?: string | null
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      normalize_search_query: { Args: { value: string }; Returns: string }
      normalize_search_text: { Args: { value: string }; Returns: string }
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
  app: {
    Enums: {},
  },
} as const
