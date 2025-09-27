// Google OAuth2 authentication service for Teacher Scheduler AI
// Automatically handles SSO login and retrieves API tokens for calendar integration

interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiryDate: number;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;
  private tokens: GoogleTokens | null = null;
  private userInfo: GoogleUserInfo | null = null;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/auth/google/callback.html`,
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    };
  }

  // Check if Google OAuth is configured
  isConfigured(): boolean {
    const hasClientId = this.config.clientId && this.config.clientId !== 'your_google_client_id_here';
    const hasClientSecret = this.config.clientSecret && this.config.clientSecret !== 'your_google_client_secret_here';
    return !!(hasClientId && hasClientSecret);
  }

  // Initiate Google OAuth flow
  async signInWithGoogle(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET environment variables.');
    }

    const authUrl = this.buildAuthUrl();
    
    // Open popup window for OAuth
    const popup = window.open(
      authUrl,
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Listen for the callback
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);

      // Listen for message from popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          
          try {
            await this.handleAuthCallback(event.data.code);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);
    });
  }

  // Build OAuth authorization URL
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Handle OAuth callback and exchange code for tokens
  private async handleAuthCallback(code: string): Promise<void> {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokenData = await tokenResponse.json();
      
      this.tokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        idToken: tokenData.id_token,
        expiryDate: Date.now() + (tokenData.expires_in * 1000)
      };

      // Get user info
      await this.fetchUserInfo();
      
      // Store tokens securely
      this.storeTokens();
      
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Authentication failed. Please try again.');
    }
  }

  // Fetch user information from Google
  private async fetchUserInfo(): Promise<void> {
    if (!this.tokens) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.tokens.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    this.userInfo = await response.json();
  }

  // Get current user info
  getCurrentUser(): GoogleUserInfo | null {
    return this.userInfo;
  }

  // Get access token for API calls
  getAccessToken(): string | null {
    if (!this.tokens || this.isTokenExpired()) {
      return null;
    }
    return this.tokens.accessToken;
  }

  // Get calendar API credentials
  getCalendarCredentials(): { apiKey: string; accessToken: string } | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    return {
      apiKey: this.config.clientId, // Use client ID as API key for Google Calendar
      accessToken
    };
  }

  // Check if token is expired
  private isTokenExpired(): boolean {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiryDate - (5 * 60 * 1000); // 5 minutes buffer
  }

  // Refresh access token
  async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokenData = await response.json();
    
    this.tokens = {
      ...this.tokens,
      accessToken: tokenData.access_token,
      expiryDate: Date.now() + (tokenData.expires_in * 1000)
    };

    this.storeTokens();
  }

  // Store tokens in localStorage
  private storeTokens(): void {
    if (this.tokens) {
      localStorage.setItem('google_tokens', JSON.stringify(this.tokens));
    }
    if (this.userInfo) {
      localStorage.setItem('google_user', JSON.stringify(this.userInfo));
    }
  }

  // Load tokens from localStorage
  loadStoredTokens(): boolean {
    try {
      const storedTokens = localStorage.getItem('google_tokens');
      const storedUser = localStorage.getItem('google_user');
      
      if (storedTokens && storedUser) {
        this.tokens = JSON.parse(storedTokens);
        this.userInfo = JSON.parse(storedUser);
        
        // Check if tokens are still valid
        if (!this.isTokenExpired()) {
          return true;
        } else if (this.tokens?.refreshToken) {
          // Try to refresh tokens
          this.refreshAccessToken().catch(() => {
            this.signOut();
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    }
    
    return false;
  }

  // Sign out and clear tokens
  signOut(): void {
    this.tokens = null;
    this.userInfo = null;
    localStorage.removeItem('google_tokens');
    localStorage.removeItem('google_user');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.tokens && this.userInfo && !this.isTokenExpired());
  }
}

export const googleAuth = new GoogleAuthService();