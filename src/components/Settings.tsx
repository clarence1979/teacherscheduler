import React, { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  isAuthenticated: boolean;
}

const Settings: React.FC<SettingsProps> = ({ isAuthenticated }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className={`p-2 rounded-lg transition-colors ${
          isAuthenticated
            ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
        title={isAuthenticated ? "Settings (Authenticated)" : "Settings"}
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

              <div className="settings-section">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {isAuthenticated
                      ? '✓ API key configured and authenticated'
                      : 'API key will be provided after authentication'}
                  </p>
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