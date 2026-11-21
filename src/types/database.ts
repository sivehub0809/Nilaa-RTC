export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          code: string;
          host_id: string | null;
          title: string | null;
          is_active: boolean;
          created_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          host_id?: string | null;
          title?: string | null;
          is_active?: boolean;
          created_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          host_id?: string | null;
          title?: string | null;
          is_active?: boolean;
          created_at?: string;
          ended_at?: string | null;
        };
      };
      meeting_participants: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string | null;
          display_name: string;
          is_guest: boolean;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          user_id?: string | null;
          display_name: string;
          is_guest?: boolean;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          user_id?: string | null;
          display_name?: string;
          is_guest?: boolean;
          joined_at?: string;
          left_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          meeting_id: string;
          sender_name: string;
          sender_id: string | null;
          is_guest: boolean;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          sender_name: string;
          sender_id?: string | null;
          is_guest?: boolean;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          sender_name?: string;
          sender_id?: string | null;
          is_guest?: boolean;
          message?: string;
          created_at?: string;
        };
      };
    };
  };
}
