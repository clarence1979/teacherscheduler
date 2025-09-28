// Authentication service for Teacher Scheduler AI
import { supabase, isSupabaseAvailable } from './supabase';
import { db } from './database';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export class AuthService {
  // Check if Supabase is available
  isAvailable(): boolean {
    return isSupabaseAvailable();
  }

  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string) {
    if (!this.isAvailable()) {
      throw new Error('Database connection not available. Please configure Supabase.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Create profile if user was created
    if (data.user) {
      try {
        await db.createProfile(data.user.id, email, fullName);
      } catch (profileError) {
        console.error('Failed to create profile:', profileError);
      }
    }

    return data;
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.isAvailable()) {
        console.log('Supabase not available - returning null user');
        return null;
      }

      console.log('Checking for stored session...');
      
      // Check localStorage for existing session first
      const storedSession = localStorage.getItem('sb-' + this.getProjectRef() + '-auth-token');
      if (!storedSession) {
        console.log('No stored session found');
        return null;
      }
      
      try {
        const sessionData = JSON.parse(storedSession);
        if (sessionData?.user) {
          console.log('Found stored user session');
          return {
            id: sessionData.user.id,
            email: sessionData.user.email,
            fullName: sessionData.user.user_metadata?.full_name || undefined,
            avatarUrl: undefined
          };
        }
      } catch (parseError) {
        console.log('Failed to parse stored session');
      }
      
      console.log('No valid stored session');
      return null;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
    }
  }
  
  private getProjectRef(): string {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : 'unknown';
  }
    

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    try {
      if (!this.isAvailable()) {
        console.info('Supabase not available - using fallback auth');
        // Return a dummy subscription that immediately calls callback with null
        setTimeout(() => callback(null), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }

      return supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            const profile = await db.getProfile(session.user.id);
            callback({
              id: session.user.id,
              email: session.user.email!,
              fullName: profile?.full_name || session.user.user_metadata?.full_name || undefined,
              avatarUrl: profile?.avatar_url || undefined
            });
          } catch (error) {
            console.info('Profile fetch in auth change (using fallback):', error);
            callback({
              id: session.user.id,
              email: session.user.email!,
              fullName: session.user.user_metadata?.full_name || undefined,
              avatarUrl: undefined
            });
          }
        } else {
          callback(null);
        }
      });
    } catch (error) {
      console.info('Auth state change setup error:', error);
      // Return a dummy subscription that does nothing
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  // Update profile
  async updateProfile(updates: { fullName?: string; avatarUrl?: string }) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: updates.fullName
      }
    });

    if (authError) throw authError;

    // Update profile table
    await db.updateProfile(user.id, {
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl
    });
  }
}

export const auth = new AuthService();