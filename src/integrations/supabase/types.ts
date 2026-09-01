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
      council_claims: {
        Row: {
          council_id: string
          created_at: string
          id: string
          status: string
          tx_hash: string | null
          updated_at: string
          wallet: string
        }
        Insert: {
          council_id: string
          created_at?: string
          id?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          wallet: string
        }
        Update: {
          council_id?: string
          created_at?: string
          id?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_claims_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
        ]
      }
      councils: {
        Row: {
          chain_family: string
          chain_id: number
          community_name: string
          created_at: string
          id: string
          message_tag: string | null
          min_balance: number
          policy_id: string | null
          token_address: string | null
          token_symbol: string | null
        }
        Insert: {
          chain_family?: string
          chain_id: number
          community_name: string
          created_at?: string
          id?: string
          message_tag?: string | null
          min_balance?: number
          policy_id?: string | null
          token_address?: string | null
          token_symbol?: string | null
        }
        Update: {
          chain_family?: string
          chain_id?: number
          community_name?: string
          created_at?: string
          id?: string
          message_tag?: string | null
          min_balance?: number
          policy_id?: string | null
          token_address?: string | null
          token_symbol?: string | null
        }
        Relationships: []
      }
      docket_comments: {
        Row: {
          author_wallet: string
          body: string
          created_at: string
          docket_item_id: string
          flagged: boolean
          id: string
        }
        Insert: {
          author_wallet: string
          body: string
          created_at?: string
          docket_item_id: string
          flagged?: boolean
          id?: string
        }
        Update: {
          author_wallet?: string
          body?: string
          created_at?: string
          docket_item_id?: string
          flagged?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "docket_comments_docket_item_id_fkey"
            columns: ["docket_item_id"]
            isOneToOne: false
            referencedRelation: "docket_items"
            referencedColumns: ["id"]
          },
        ]
      }
      docket_items: {
        Row: {
          body: string
          council_id: string
          created_at: string
          created_by_wallet: string
          id: string
          resolution: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          body?: string
          council_id: string
          created_at?: string
          created_by_wallet: string
          id?: string
          resolution?: string | null
          status?: string
          title: string
          type: string
        }
        Update: {
          body?: string
          council_id?: string
          created_at?: string
          created_by_wallet?: string
          id?: string
          resolution?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "docket_items_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
        ]
      }
      petitions: {
        Row: {
          created_at: string
          docket_item_id: string
          id: string
          resolution_status: string
          resolved_at: string | null
        }
        Insert: {
          created_at?: string
          docket_item_id: string
          id?: string
          resolution_status?: string
          resolved_at?: string | null
        }
        Update: {
          created_at?: string
          docket_item_id?: string
          id?: string
          resolution_status?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "petitions_docket_item_id_fkey"
            columns: ["docket_item_id"]
            isOneToOne: false
            referencedRelation: "docket_items"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          author_wallet: string
          content: string
          council_id: string
          created_at: string
          flagged: boolean
          id: string
        }
        Insert: {
          author_wallet: string
          content: string
          council_id: string
          created_at?: string
          flagged?: boolean
          id?: string
        }
        Update: {
          author_wallet?: string
          content?: string
          council_id?: string
          created_at?: string
          flagged?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "councils"
            referencedColumns: ["id"]
          },
        ]
      }
      social_replies: {
        Row: {
          author_wallet: string
          content: string
          created_at: string
          flagged: boolean
          id: string
          post_id: string
        }
        Insert: {
          author_wallet: string
          content: string
          created_at?: string
          flagged?: boolean
          id?: string
          post_id: string
        }
        Update: {
          author_wallet?: string
          content?: string
          created_at?: string
          flagged?: boolean
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          chain_id: number | null
          choice: string
          created_at: string
          docket_item_id: string
          id: string
          signature: string | null
          voter_wallet: string
        }
        Insert: {
          chain_id?: number | null
          choice: string
          created_at?: string
          docket_item_id: string
          id?: string
          signature?: string | null
          voter_wallet: string
        }
        Update: {
          chain_id?: number | null
          choice?: string
          created_at?: string
          docket_item_id?: string
          id?: string
          signature?: string | null
          voter_wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_docket_item_id_fkey"
            columns: ["docket_item_id"]
            isOneToOne: false
            referencedRelation: "docket_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_wallet_address: { Args: { _addr: string }; Returns: boolean }
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
