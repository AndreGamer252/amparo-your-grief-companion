import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis do Supabase não configuradas. Usando localStorage como fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          created_at: string;
          last_login_at: string | null;
          subscription_active: boolean;
          subscription_expires_at: string | null;
          input_tokens_used: number;
          output_tokens_used: number;
          token_limit: number | null;
          profile_data: Record<string, any>;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          password_hash: string;
          created_at?: string;
          last_login_at?: string | null;
          subscription_active?: boolean;
          subscription_expires_at?: string | null;
          input_tokens_used?: number;
          output_tokens_used?: number;
          token_limit?: number | null;
          profile_data?: Record<string, any>;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password_hash?: string;
          created_at?: string;
          last_login_at?: string | null;
          subscription_active?: boolean;
          subscription_expires_at?: string | null;
          input_tokens_used?: number;
          output_tokens_used?: number;
          token_limit?: number | null;
          profile_data?: Record<string, any>;
        };
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          date: string;
          type: 'carta' | 'lembranca';
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          date: string;
          type: 'carta' | 'lembranca';
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          date?: string;
          type?: 'carta' | 'lembranca';
          image_url?: string | null;
          created_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mood: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mood?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp?: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          timestamp?: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };
      journey_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          completed: boolean;
          completed_at: string | null;
          progress_data: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          completed?: boolean;
          completed_at?: string | null;
          progress_data?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          progress_data?: Record<string, any>;
          created_at?: string;
        };
      };
    };
  };
}
