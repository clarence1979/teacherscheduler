// Microsoft OAuth2 authentication service for Teacher Scheduler AI
// Automatically handles SSO login and retrieves API tokens for Outlook Calendar integration

interface MicrosoftAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  tenantId: string;
}

interface MicrosoftTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiryDate: number;
  scope: string;
}

interface MicrosoftUserInfo {
  id: string;
  email: string;
  displayName: string;
  givenName: string;
  surname: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
}

export class MicrosoftAuthService {
  private config: MicrosoftAuthConfig;
  private tokens: MicrosoftTokens | null = null;
  private userInfo: MicrosoftUserInfo | null = null;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/auth/microsoft/callback`,
      tenantId: import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common',
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/User.Read'
      ]
    };
  }

  // Check if Microsoft OAuth is configured
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  // Initiate Microsoft OAuth flow
  async signInWithMicrosoft(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Microsoft OAuth not configured. Please set VITE_MICROSOFT_CLIENT_ID and VITE_MICROSOFT_CLIENT_SECRET environment variables.');
    }

    const authUrl = this.buildAuthUrl();
    
    // Open popup window for OAuth
    const popup = window.open(
      authUrl,
      'microsoft-auth',
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
        
        if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          
          try {
            await this.handleAuthCallback(event.data.code);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
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
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
      state: this.generateState(),
      prompt: 'consent'
    });

    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  // Handle OAuth callback and exchange code for tokens
  private async handleAuthCallback(code: string): Promise<void> {
    try {
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
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
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to exchange code for tokens: ${errorData.error_description || errorData.error}`);
      }

      const tokenData = await tokenResponse.json();
      
      this.tokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        idToken: tokenData.id_token,
        expiryDate: Date.now() + (tokenData.expires_in * 1000),
        scope: tokenData.scope
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

  // Fetch user information from Microsoft Graph
  private async fetchUserInfo(): Promise<void> {
    if (!this.tokens) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
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
  getCurrentUser(): MicrosoftUserInfo | null {
    return this.userInfo;
  }

  // Get access token for API calls
  getAccessToken(): string | null {
    if (!this.tokens || this.isTokenExpired()) {
      return null;
    }
    return this.tokens.accessToken;
  }

  // Get calendar API credentials for Outlook
  getCalendarCredentials(): { accessToken: string } | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    return {
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

    const response = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token',
        scope: this.config.scopes.join(' ')
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
      localStorage.setItem('microsoft_tokens', JSON.stringify(this.tokens));
    }
    if (this.userInfo) {
      localStorage.setItem('microsoft_user', JSON.stringify(this.userInfo));
    }
  }

  // Load tokens from localStorage
  loadStoredTokens(): boolean {
    try {
      const storedTokens = localStorage.getItem('microsoft_tokens');
      const storedUser = localStorage.getItem('microsoft_user');
      
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
    localStorage.removeItem('microsoft_tokens');
    localStorage.removeItem('microsoft_user');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.tokens && this.userInfo && !this.isTokenExpired());
  }

  // Generate secure state parameter
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Get user's organization info for automatic tenant detection
  async getOrganizationInfo(): Promise<any> {
    if (!this.tokens) return null;

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/organization', {
        headers: {
          'Authorization': `Bearer ${this.tokens.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.value?.[0] || null;
      }
    } catch (error) {
      console.error('Failed to get organization info:', error);
    }
    
    return null;
  }

  // Get user's mailbox settings for timezone and locale
  async getMailboxSettings(): Promise<any> {
    if (!this.tokens) return null;

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/mailboxSettings', {
        headers: {
          'Authorization': `Bearer ${this.tokens.accessToken}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get mailbox settings:', error);
    }
    
    return null;
  }
}

export const microsoftAuth = new MicrosoftAuthService();