import { createClient } from '@supabase/supabase-js';
import { isSupabaseAvailable } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

if (isSupabaseAvailable()) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export class AuthService {
  async signUp(email: string, password: string, fullName: string) {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    if (!supabase) {
      return null;
    }

    try {
      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 15000)
        )
      ]);

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      throw error;
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  }

  async getSession() {
    if (!supabase) {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
}

export const auth = new AuthService();