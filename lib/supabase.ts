import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create Supabase client if we have valid environment variables
export const supabase = (supabaseUrl !== 'https://placeholder.supabase.co' && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseAnonKey !== 'placeholder-key') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null && 
         import.meta.env.VITE_SUPABASE_URL && 
         import.meta.env.VITE_SUPABASE_ANON_KEY &&
         import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_url_here' &&
         import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
}

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          working_hours: any
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          working_hours?: any
          preferences?: any
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          working_hours?: any
          preferences?: any
        }
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          type: string
          color: string
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          description?: string
          type?: string
          color?: string
          settings?: any
        }
        Update: {
          name?: string
          description?: string
          type?: string
          color?: string
          settings?: any
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          workspace_id: string | null
          name: string
          description: string
          priority: string
          estimated_minutes: number
          actual_minutes: number | null
          deadline: string | null
          scheduled_time: string | null
          end_time: string | null
          state: string
          task_type: string
          is_flexible: boolean
          chunkable: boolean
          min_chunk_minutes: number
          max_chunk_minutes: number | null
          dependencies: string[]
          happiness_contribution: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          project_id?: string | null
          workspace_id?: string | null
          name: string
          description?: string
          priority?: string
          estimated_minutes?: number
          deadline?: string | null
          task_type?: string
          is_flexible?: boolean
          chunkable?: boolean
          min_chunk_minutes?: number
          max_chunk_minutes?: number | null
          dependencies?: string[]
        }
        Update: {
          name?: string
          description?: string
          priority?: string
          estimated_minutes?: number
          actual_minutes?: number | null
          deadline?: string | null
          scheduled_time?: string | null
          end_time?: string | null
          state?: string
          task_type?: string
          is_flexible?: boolean
          chunkable?: boolean
          dependencies?: string[]
          happiness_contribution?: number
          completed_at?: string | null
        }
      }
    }
  }
}