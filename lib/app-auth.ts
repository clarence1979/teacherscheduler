export interface AuthUser {
  username: string;
  isAdmin: boolean;
  authenticated: boolean;
}

export interface IframeAuthData {
  username: string;
  isAdmin: boolean;
  authToken: string;
  OPENAI_API_KEY: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const FALLBACK_SUPABASE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

class AppAuthentication {
  private isInIframe: boolean;
  private currentUser: AuthUser | null = null;
  private supabaseUrl: string = FALLBACK_SUPABASE_URL;
  private supabaseAnonKey: string = FALLBACK_ANON_KEY;
  private apiKeys: Record<string, string> = {};

  constructor() {
    this.isInIframe = window.self !== window.top;
    this.loadFromCache();
  }

  private loadFromCache() {
    try {
      const cachedUser = localStorage.getItem('app_auth_user');
      const cachedApiKeys = localStorage.getItem('app_api_keys');
      const cachedSupabase = localStorage.getItem('app_supabase_config');

      if (cachedUser) {
        this.currentUser = JSON.parse(cachedUser);
      }

      if (cachedApiKeys) {
        this.apiKeys = JSON.parse(cachedApiKeys);
      }

      if (cachedSupabase) {
        const config = JSON.parse(cachedSupabase);
        this.supabaseUrl = config.url;
        this.supabaseAnonKey = config.key;
      }
    } catch (error) {
      console.error('Error loading auth cache:', error);
    }
  }

  private saveToCache() {
    try {
      if (this.currentUser) {
        localStorage.setItem('app_auth_user', JSON.stringify(this.currentUser));
      }
      if (Object.keys(this.apiKeys).length > 0) {
        localStorage.setItem('app_api_keys', JSON.stringify(this.apiKeys));
      }
      localStorage.setItem('app_supabase_config', JSON.stringify({
        url: this.supabaseUrl,
        key: this.supabaseAnonKey
      }));
    } catch (error) {
      console.error('Error saving auth cache:', error);
    }
  }

  clearCache() {
    localStorage.removeItem('app_auth_user');
    localStorage.removeItem('app_api_keys');
    localStorage.removeItem('app_supabase_config');
    localStorage.removeItem('openai_api_key');
    this.currentUser = null;
    this.apiKeys = {};
    this.supabaseUrl = FALLBACK_SUPABASE_URL;
    this.supabaseAnonKey = FALLBACK_ANON_KEY;
  }

  isRunningInIframe(): boolean {
    return this.isInIframe;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getApiKey(keyName: string = 'OPENAI_API_KEY'): string | null {
    return this.apiKeys[keyName] || null;
  }

  getSupabaseConfig() {
    return {
      url: this.supabaseUrl,
      key: this.supabaseAnonKey
    };
  }

  async validateAuthToken(token: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/auth_tokens?token=eq.${token}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin,expires_at`,
        {
          headers: {
            'apikey': this.supabaseAnonKey,
            'Content-Type': 'application/json',
          }
        }
      );

      const tokens = await response.json();

      if (tokens && tokens.length > 0) {
        return {
          username: tokens[0].username,
          isAdmin: tokens[0].is_admin,
          authenticated: true,
        };
      }

      return null;
    } catch (error) {
      console.error('Error validating auth token:', error);
      return null;
    }
  }

  async attemptIframeAutoLogin(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'API_VALUES_RESPONSE') {
          window.removeEventListener('message', handleMessage);

          const data: IframeAuthData = event.data.data;

          if (data.authToken && data.SUPABASE_URL && data.SUPABASE_ANON_KEY) {
            this.supabaseUrl = data.SUPABASE_URL;
            this.supabaseAnonKey = data.SUPABASE_ANON_KEY;

            const validatedUser = await this.validateAuthToken(data.authToken);

            if (validatedUser) {
              this.currentUser = validatedUser;
              this.apiKeys = {
                OPENAI_API_KEY: data.OPENAI_API_KEY || '',
                CLAUDE_API_KEY: data.CLAUDE_API_KEY || '',
                GEMINI_API_KEY: data.GEMINI_API_KEY || '',
                REPLICATE_API_KEY: data.REPLICATE_API_KEY || ''
              };

              if (this.apiKeys.OPENAI_API_KEY) {
                localStorage.setItem('openai_api_key', this.apiKeys.OPENAI_API_KEY);
              }

              this.saveToCache();
              resolve(validatedUser);
              return;
            }
          }

          resolve(null);
        }
      };

      window.addEventListener('message', handleMessage);

      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(null);
      }, 2000);
    });
  }

  async loginWithCredentials(username: string, password: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/users_login?username=eq.${username}&select=username,password`,
        {
          headers: {
            'apikey': this.supabaseAnonKey,
            'Content-Type': 'application/json',
          }
        }
      );

      const users = await response.json();

      if (users && users.length > 0 && users[0].password === password) {
        const secretsResponse = await fetch(
          `${this.supabaseUrl}/rest/v1/secrets?key_name=eq.OPENAI_API_KEY&select=key_value`,
          {
            headers: {
              'apikey': this.supabaseAnonKey,
              'Content-Type': 'application/json',
            }
          }
        );

        const secrets = await secretsResponse.json();
        const openaiKey = secrets && secrets.length > 0 ? secrets[0].key_value : '';

        this.currentUser = {
          username: users[0].username,
          isAdmin: false,
          authenticated: true
        };

        this.apiKeys = {
          OPENAI_API_KEY: openaiKey
        };

        if (openaiKey) {
          localStorage.setItem('openai_api_key', openaiKey);
        }

        this.saveToCache();
        return this.currentUser;
      }

      return null;
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  }

  logout() {
    this.clearCache();
  }
}

export const appAuth = new AppAuthentication();
