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
        console.log('Supabase not available - user authentication disabled');
        return null;
      }

      console.log('Getting current user from Supabase...');
      
      // Get the user without timeout - let Supabase handle its own timeouts
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('Auth error (expected if not logged in):', error.message);
        return null;
      }
    
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('User found, fetching profile...');

      // Get profile data
      try {
        const profile = await db.getProfile(user.id);
        
        const userData = {
          id: user.id,
          email: user.email!,
          fullName: profile?.full_name || user.user_metadata?.full_name || undefined,
          avatarUrl: profile?.avatar_url || undefined
        };
        
        console.log('User data prepared:', userData);
        return userData;
      } catch (profileError) {
        console.log('Profile fetch error (using fallback):', profileError);
        // Return user without profile data if profile fetch fails
        return {
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || undefined,
          avatarUrl: undefined
        };
      }
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
    }
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