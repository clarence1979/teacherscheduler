import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import { auth } from '../../lib/auth';
import { isSupabaseAvailable } from '../../lib/supabase';
import { googleAuth } from '../../lib/google-auth';
import { microsoftAuth } from '../../lib/microsoft-auth';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // Apply theme on component mount and when isDark changes
  React.useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Check for stored Microsoft authentication on component mount
  React.useEffect(() => {
    if (microsoftAuth.loadStoredTokens()) {
      console.log('Microsoft authentication restored from storage');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseAvailable()) {
      // Skip database authentication in demo mode
      console.log('Running in demo mode - skipping database authentication');
      onAuthSuccess();
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await auth.signUp(formData.email, formData.password, formData.fullName);
        setError('Check your email for the confirmation link!');
      } else {
        await auth.signIn(formData.email, formData.password);
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      await googleAuth.signInWithGoogle();
      
      // Get user info and calendar credentials
      const userInfo = googleAuth.getCurrentUser();
      const calendarCreds = googleAuth.getCalendarCredentials();
      
      if (userInfo && calendarCreds) {
        // Auto-configure calendar integration
        console.log('Google authentication successful:', userInfo);
        console.log('Calendar credentials ready:', calendarCreds);
        
        // Store calendar credentials for automatic use
        localStorage.setItem('google_calendar_credentials', JSON.stringify(calendarCreds));
        
        onAuthSuccess();
      } else {
        throw new Error('Failed to retrieve user information or calendar access');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setMicrosoftLoading(true);
    setError(null);

    try {
      await microsoftAuth.signInWithMicrosoft();
      
      // Get user info and calendar credentials
      const userInfo = microsoftAuth.getCurrentUser();
      const calendarCreds = microsoftAuth.getCalendarCredentials();
      
      if (userInfo && calendarCreds) {
        // Auto-configure calendar integration
        console.log('Microsoft authentication successful:', userInfo);
        console.log('Outlook Calendar credentials ready:', calendarCreds);
        
        // Store calendar credentials for automatic use
        localStorage.setItem('microsoft_calendar_credentials', JSON.stringify(calendarCreds));
        
        onAuthSuccess();
      } else {
        throw new Error('Failed to retrieve user information or calendar access');
      }
    } catch (err: any) {
      setError(err.message || 'Microsoft authentication failed');
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 transition-colors">
          <div className="auth-header">
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
            <div className="auth-logo">
              <div className="text-4xl mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🧠</div>
              <h1 className="text-2xl font-bold text-white dark:text-white mb-2">Teacher Scheduler AI</h1>
              <p className="text-sm text-gray-200 dark:text-gray-300">Intelligent Teaching Assistant</p>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mt-6 mb-8 text-center">
              {isSignUp ? 'Create your account' : 'Welcome back, Teacher'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                  placeholder="Enter your full name"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`p-4 rounded-lg text-sm ${
                error.includes('Check your email') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {error}
              </div>
            )}

            {/* SSO Buttons */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </button>

            {/* Microsoft SSO Button */}
            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={microsoftLoading}
              className="w-full bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200"
            >
              {microsoftLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path d="M0 0h11v11H0z" fill="#f25022"/>
                  <path d="M12 0h11v11H12z" fill="#7fba00"/>
                  <path d="M0 12h11v11H0z" fill="#00a4ef"/>
                  <path d="M12 12h11v11H12z" fill="#ffb900"/>
                </svg>
              )}
              {microsoftLoading ? 'Signing in with Microsoft...' : 'Continue with Microsoft'}
            </button>

            {googleAuth.isConfigured() && (
              <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                🔒 Automatically connects your calendar and enables AI features
              </div>
            )}

            {(!googleAuth.isConfigured() && !microsoftAuth.isConfigured()) && (
              <div className="text-xs text-center text-yellow-600 dark:text-yellow-400 mt-2">
                ⚠️ SSO not configured. Contact administrator.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setFormData({ email: '', password: '', fullName: '' });
                }}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;