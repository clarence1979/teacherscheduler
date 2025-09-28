import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fvawqvpnvabieadgqreo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YXdxdnBudmFiaWVhZGdxcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNDU4NzQsImV4cCI6MjA0MjgyMTg3NH0.cWBRck36Bi7XPUO9g7TJA_DCRA3sXc'

console.log('Supabase environment check:', {
  url: supabaseUrl ? 'present' : 'missing',
  key: supabaseAnonKey ? 'present' : 'missing'
})

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'teacher-scheduler-ai'
      }
    }
  }
)

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  const hasValidUrl = supabaseUrl && 
    supabaseUrl.trim() !== '' && 
    supabaseUrl !== 'your_supabase_url_here' &&
    supabaseUrl.includes('supabase.co')
  
  const hasValidKey = supabaseAnonKey && 
    supabaseAnonKey.trim() !== '' && 
    supabaseAnonKey !== 'your_supabase_anon_key_here' &&
    supabaseAnonKey.startsWith('eyJ')
  
  console.log('Supabase availability:', {
    hasValidUrl,
    hasValidKey,
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'missing'
  })
  
  // Clear invalid session data if Supabase is not properly configured
  if (!hasValidUrl || !hasValidKey) {
    try {
      // Clear any stored session data that might be causing refresh token errors
      const projectRef = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : 'unknown';
      const sessionKey = `sb-${projectRef}-auth-token`;
      if (localStorage.getItem(sessionKey)) {
        console.log('Clearing invalid session data for unconfigured Supabase project');
        localStorage.removeItem(sessionKey);
      }
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }
  
  return hasValidUrl && hasValidKey
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