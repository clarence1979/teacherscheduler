import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsProps {
  onApiKeyUpdate: (apiKey: string) => void;
  currentApiKey?: string;
}

const Settings: React.FC<SettingsProps> = ({ onApiKeyUpdate, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey || '');
  }, [currentApiKey]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key || !key.startsWith('sk-')) {
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationStatus('invalid');
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    const isValid = await validateApiKey(apiKey.trim());
    
    if (isValid) {
      setValidationStatus('valid');
      onApiKeyUpdate(apiKey.trim());
      localStorage.setItem('openai_api_key', apiKey.trim());
      setTimeout(() => setShowSettings(false), 1500);
    } else {
      setValidationStatus('invalid');
    }
    
    setIsValidating(false);
  };

  const handleRemoveApiKey = () => {
    setApiKey('');
    setValidationStatus(null);
    onApiKeyUpdate('');
    localStorage.removeItem('openai_api_key');
  };

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title="Settings"
      >
        <SettingsIcon className="h-5 w-5" />
      </button>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2 text-gray-900 dark:text-white">
                <SettingsIcon className="h-5 w-5" />
                Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <div className="settings-section">
                <h4 className="settings-section-title">
                  <Key className="h-4 w-4" />
                  OpenAI API Configuration
                </h4>
                <p className="settings-description">
                  Configure your OpenAI API key to enable real AI-powered responses from your AI employees. 
                  Without an API key, the system will use simulated responses for demonstration purposes.
                </p>

                <div className="api-key-section">
                  <div className="form-group">
                    <label className="form-label">OpenAI API Key</label>
                    <div className="api-key-input-group">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your OpenAI API key (sk-...)"
                        className="w-full pr-12 font-mono text-sm px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white bg-white text-gray-900"
                        disabled={isValidating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {validationStatus === 'valid' && (
                      <div className="validation-message success">
                        <CheckCircle className="h-4 w-4" />
                        API key is valid and ready to use
                      </div>
                    )}
                    
                    {validationStatus === 'invalid' && (
                      <div className="validation-message error">
                        <AlertCircle className="h-4 w-4" />
                        Invalid API key. Please check your key and try again.
                      </div>
                    )}
                  </div>

                  <div className="api-key-actions">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isValidating || !apiKey.trim()}
                      className="btn btn-primary"
                    >
                      {isValidating ? (
                        <>
                          <div className="loading-spinner-sm" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save & Validate
                        </>
                      )}
                    </button>
                    
                    {currentApiKey && (
                      <button
                        onClick={handleRemoveApiKey}
                        className="btn btn-secondary"
                      >
                        Remove Key
                      </button>
                    )}
                  </div>
                </div>

                <div className="api-key-help">
                  <h5>How to get your OpenAI API Key:</h5>
                  <ol>
                    <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a></li>
                    <li>Sign in to your OpenAI account</li>
                    <li>Click "Create new secret key"</li>
                    <li>Copy the key and paste it above</li>
                  </ol>
                  <p className="security-note">
                    <AlertCircle className="h-4 w-4" />
                    Your API key is stored locally in your browser and never sent to our servers.
                  </p>
                </div>
              </div>

              <div className="settings-section">
                <h4 className="settings-section-title">AI Employee Behavior</h4>
                <div className="settings-grid">
                  <label className="setting-item">
                    <input type="checkbox" defaultChecked />
                    <span>Require approval for AI-generated content</span>
                  </label>
                  <label className="setting-item">
                    <input type="checkbox" defaultChecked />
                    <span>Send notifications when AI tasks complete</span>
                  </label>
                  <label className="setting-item">
                    <input type="checkbox" />
                    <span>Auto-execute low-risk workflows</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;