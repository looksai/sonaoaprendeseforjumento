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
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          language: string
          name: string
          topic: string | null
          vibe: string
        }
        Insert: {
          created_at?: string
          id: string
          language?: string
          name: string
          topic?: string | null
          vibe?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          name?: string
          topic?: string | null
          vibe?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          target_type?: Database["public"]["Enums"]["reaction_target"]
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      phrase_reviews: {
        Row: {
          correct_count: number
          created_at: string
          difficulty: number
          en: string
          hesitation_count: number
          id: string
          incorrect_count: number
          interval_days: number
          last_seen: string | null
          lesson_id: string | null
          next_review: string | null
          phrase_key: string
          pronunciation_score: number | null
          pt: string | null
          source: string | null
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          difficulty?: number
          en: string
          hesitation_count?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_seen?: string | null
          lesson_id?: string | null
          next_review?: string | null
          phrase_key: string
          pronunciation_score?: number | null
          pt?: string | null
          source?: string | null
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          difficulty?: number
          en?: string
          hesitation_count?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_seen?: string | null
          lesson_id?: string | null
          next_review?: string | null
          phrase_key?: string
          pronunciation_score?: number | null
          pt?: string | null
          source?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          handle: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          handle: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          room_id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          room_id?: string
          sender_id: string
          sender_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          room_id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_lessons: Json | null
          created_at: string
          current_level: string | null
          dopamine_profile: Json | null
          id: string
          last_study_date: string | null
          streak: number
          total_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_lessons?: Json | null
          created_at?: string
          current_level?: string | null
          dopamine_profile?: Json | null
          id?: string
          last_study_date?: string | null
          streak?: number
          total_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_lessons?: Json | null
          created_at?: string
          current_level?: string | null
          dopamine_profile?: Json | null
          id?: string
          last_study_date?: string | null
          streak?: number
          total_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sticker_packs: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_public?: boolean
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      stickers: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          pack_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          pack_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          pack_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          last_seen: string
          status: Database["public"]["Enums"]["presence_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen?: string
          status?: Database["public"]["Enums"]["presence_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen?: string
          status?: Database["public"]["Enums"]["presence_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      reaction_target: "room" | "dm",
      presence_status: "online" | "invisible" | "offline"
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
      reaction_target: ["room", "dm"],
      presence_status: ["online", "invisible", "offline"],
    },
  },
} as const
