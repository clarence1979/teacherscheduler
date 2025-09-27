import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { googleAuth } from '../../lib/google-auth';
import { microsoftAuth } from '../../lib/microsoft-auth';

interface CalendarConnectionProps {
  onConnect: (provider: string, credentials: any) => Promise<{ success: boolean; error?: string }>;
  isConnected: boolean;
  connectedProvider?: string;
}

const CalendarConnection: React.FC<CalendarConnectionProps> = ({ 
  onConnect, 
  isConnected, 
  connectedProvider 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if Google OAuth is configured
      if (!googleAuth.isConfigured()) {
        throw new Error('Google OAuth not configured. Please contact your administrator to set up Google integration.');
      }

      // Check if already authenticated with Google
      if (!googleAuth.isAuthenticated()) {
        await googleAuth.signInWithGoogle();
      }
      
      const credentials = googleAuth.getCalendarCredentials();
      if (!credentials) {
        throw new Error('Failed to get Google Calendar credentials');
      }

      const result = await onConnect('google', credentials);
      if (result.success) {
        setShowModal(false);
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError((err as Error).message || 'Google Calendar connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMicrosoftConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if already authenticated with Microsoft
      if (!microsoftAuth.isAuthenticated()) {
        await microsoftAuth.signInWithMicrosoft();
      }
      
      const credentials = microsoftAuth.getCalendarCredentials();
      if (!credentials) {
        throw new Error('Failed to get Microsoft Calendar credentials');
      }

      const result = await onConnect('outlook', credentials);
      if (result.success) {
        setShowModal(false);
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError('Microsoft Calendar connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualConnect = async (provider: string, credentials: any) => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await onConnect(provider, credentials);
      if (result.success) {
        setShowModal(false);
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError('Connection failed. Please check your credentials.');
    } finally {
      setIsConnecting(false);
    }
  };
  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google Calendar',
      outlook: 'Outlook Calendar',
      icloud: 'iCloud Calendar'
    };
    return names[provider] || provider;
  };

  return (
    <>
      <button 
        className={`calendar-connection-btn ${isConnected ? 'connected' : 'disconnected'}`}
        onClick={() => setShowModal(true)}
        title={isConnected ? `Connected to ${getProviderName(connectedProvider || '')}` : 'Connect Calendar'}
      >
        <Calendar className="h-4 w-4" />
        {isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Connected</span>
          </>
        ) : (
          <span>Connect Calendar</span>
        )}
      </button>

      {showModal && (
        <CalendarConnectionModal
          onClose={() => setShowModal(false)}
          onGoogleConnect={handleGoogleConnect}
          onMicrosoftConnect={handleMicrosoftConnect}
          onManualConnect={handleManualConnect}
          isConnecting={isConnecting}
          error={error}
        />
      )}
    </>
  );
};

// Calendar Connection Modal Component
const CalendarConnectionModal: React.FC<{
  onClose: () => void;
  onGoogleConnect: () => void;
  onMicrosoftConnect: () => void;
  onManualConnect: (provider: string, credentials: any) => void;
  isConnecting: boolean;
  error: string | null;
}> = ({ onClose, onGoogleConnect, onMicrosoftConnect, onManualConnect, isConnecting, error }) => {
  const [connectionMethod, setConnectionMethod] = useState<'google' | 'microsoft' | 'manual'>('google');
  const [provider, setProvider] = useState('google');
  const [credentials, setCredentials] = useState({
    apiKey: '',
    accessToken: ''
  });

  const handleManualSubmit = () => {
    if (!credentials.apiKey || !credentials.accessToken) {
      return;
    }
    onManualConnect(provider, credentials);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Connect Calendar</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Connection Method Selector */}
          <div className="form-group">
            <label>Connection Method</label>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setConnectionMethod('google')}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  connectionMethod === 'google'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">Google SSO</span>
                </div>
                <div className="text-xs mt-1">Google Calendar</div>
              </button>
              
              <button
                type="button"
                onClick={() => setConnectionMethod('microsoft')}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  connectionMethod === 'microsoft'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path d="M0 0h11v11H0z" fill="#f25022"/>
                    <path d="M12 0h11v11H12z" fill="#7fba00"/>
                    <path d="M0 12h11v11H0z" fill="#00a4ef"/>
                    <path d="M12 12h11v11H12z" fill="#ffb900"/>
                  </svg>
                  <span className="font-medium">Microsoft SSO</span>
                </div>
                <div className="text-xs mt-1">Outlook Calendar</div>
              </button>
              
              <button
                type="button"
                onClick={() => setConnectionMethod('manual')}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  connectionMethod === 'manual'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Manual</span>
                </div>
                <div className="text-xs mt-1">Custom credentials</div>
              </button>
            </div>
          </div>

          {connectionMethod === 'google' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">✨ Google Calendar Integration</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Automatic calendar access</li>
                  <li>• Secure OAuth2 authentication</li>
                  <li>• No manual credential management</li>
                  <li>• Automatic token refresh</li>
                </ul>
              </div>
              
              {!googleAuth.isConfigured() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Configuration Required</h4>
                  <p className="text-sm text-yellow-700">
                    Google OAuth is not configured. Please contact your administrator to set up:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• VITE_GOOGLE_CLIENT_ID environment variable</li>
                    <li>• VITE_GOOGLE_CLIENT_SECRET environment variable</li>
                  </ul>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : connectionMethod === 'microsoft' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">🏢 Microsoft Outlook Integration</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Automatic Outlook Calendar access</li>
                  <li>• Enterprise-grade security</li>
                  <li>• Azure AD integration</li>
                  <li>• Automatic token management</li>
                </ul>
              </div>
              
              {error && (
                <div className="error-message">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="provider">Calendar Provider</label>
                <select 
                  id="provider"
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                  className="form-select"
                >
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook Calendar</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="apiKey">API Key</label>
                <input
                  id="apiKey"
                  type="text"
                  placeholder="Enter your API key"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({
                    ...credentials, 
                    apiKey: e.target.value
                  })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accessToken">Access Token</label>
                <input
                  id="accessToken"
                  type="text"
                  placeholder="Enter your access token"
                  value={credentials.accessToken}
                  onChange={(e) => setCredentials({
                    ...credentials, 
                    accessToken: e.target.value
                  })}
                  className="form-input"
                />
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="help-text">
                <Settings className="h-4 w-4" />
                <div>
                  <p><strong>How to get credentials:</strong></p>
                  <ul>
                    <li><strong>Google:</strong> Go to Google Cloud Console → APIs & Services → Credentials</li>
                    <li><strong>Outlook:</strong> Go to Azure Portal → App registrations → Your app</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          
          {connectionMethod === 'google' ? (
            <button 
              className="btn btn-primary"
              onClick={onGoogleConnect}
              disabled={isConnecting || !googleAuth.isConfigured()}
            >
              {isConnecting ? 'Connecting...' : 'Connect with Google'}
            </button>
          ) : connectionMethod === 'microsoft' ? (
            <button 
              className="btn btn-primary"
              onClick={onMicrosoftConnect}
              disabled={isConnecting || !microsoftAuth.isConfigured()}
            >
              {isConnecting ? 'Connecting...' : 'Connect with Microsoft'}
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handleManualSubmit}
              disabled={isConnecting || !credentials.apiKey || !credentials.accessToken}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default CalendarConnection;