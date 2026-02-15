import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, Bell, Settings as SettingsIcon, User, ChevronDown, LogOut, Loader2 } from 'lucide-react';
import { auth } from '../lib/auth';
import { isSupabaseAvailable } from '../lib/supabase';
import { db } from '../lib/database';
import { googleAuth } from '../lib/google-auth';
import { microsoftAuth } from '../lib/microsoft-auth';
import { HappinessAlgorithm } from '../lib/happiness-algorithm';
import { RealTimeOptimizer } from '../lib/real-time-optimizer';
import { CalendarIntegration } from '../lib/calendar-integration';
import { WorkspaceManager } from '../lib/workspace-manager';
import { MeetingScheduler } from '../lib/meeting-scheduler';
import { AnalyticsManager } from '../lib/analytics-manager';
import { AIEmployeeManager } from '../lib/ai-employee-manager';
import { appAuth } from '../lib/app-auth';
import TaskForm from './components/TaskForm';
import ScheduleView from './components/ScheduleView';
import TaskList from './components/TaskList';
import RealTimeScheduleView from './components/RealTimeScheduleView';
import WorkspaceManagerComponent from './components/WorkspaceManager';
import MeetingSchedulerComponent from './components/MeetingScheduler';
import Analytics from './components/Analytics';
import AIEmployees from './components/AIEmployees';
import Settings from './components/Settings';
import CalendarConnection from './components/CalendarConnection';
import StudentRoster from './components/StudentRoster';
import AttendanceTracker from './components/AttendanceTracker';
import InlineAuth from './components/InlineAuth';
import AppLogin from './components/AppLogin';
import { Task, Event, UserSchedule, OptimizationResult } from '../lib/types';
import { User as AuthUser } from '../lib/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthError, setInitialAuthError] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'schedule' | 'tasks' | 'workspaces' | 'meetings' | 'analytics' | 'ai-employees' | 'students' | 'attendance'>('schedule');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [appAuthenticated, setAppAuthenticated] = useState(false);
  const [appAuthLoading, setAppAuthLoading] = useState(true);
  const [appUsername, setAppUsername] = useState<string | null>(null);

  // Initialize managers
  const [userSchedule] = useState<UserSchedule>({
    workingHours: {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17]
    },
    breakTimes: [
      { start: '12:00', end: '13:00', name: 'Lunch Break' }
    ],
    preferences: {
      focusTimeBlocks: 120,
      bufferBetweenTasks: 15,
      preferredTaskTimes: {
        'ASAP': 'morning',
        'High': 'morning',
        'Medium': 'afternoon',
        'Low': 'anytime'
      }
    }
  });

  const [happinessAlgorithm] = useState(() => new HappinessAlgorithm(userSchedule));
  const [realTimeOptimizer] = useState(() => new RealTimeOptimizer(happinessAlgorithm));
  const [calendarIntegration] = useState(() => new CalendarIntegration());
  const [workspaceManager] = useState(() => new WorkspaceManager());
  const [meetingScheduler] = useState(() => new MeetingScheduler(userSchedule));
  const [analyticsManager] = useState(() => new AnalyticsManager());
  const [aiEmployeeManager] = useState(() => new AIEmployeeManager());

  useEffect(() => {
    initializeApp();

    // Set up auth state listener
    const { data: { subscription } } = auth.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        await loadUserTasks(user.id);
      } else {
        setTasks([]);
      }
    });

    // Check for stored Google authentication
    if (googleAuth.loadStoredTokens()) {
      console.log('Google authentication restored from storage');
    }

    // Check for stored Microsoft authentication
    if (microsoftAuth.loadStoredTokens()) {
      console.log('Microsoft authentication restored from storage');
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Listen for postMessage events from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        if (event.data.type === 'UPDATE_API_KEY') {
          const newApiKey = event.data.apiKey;
          handleApiKeyUpdate(newApiKey);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const initializeApp = async () => {
    setAppAuthLoading(true);

    if (appAuth.isRunningInIframe()) {
      console.log('Running in iframe, attempting auto-login...');
      const authUser = await appAuth.attemptIframeAutoLogin();

      if (authUser) {
        console.log('Auto-login successful:', authUser.username);
        setAppAuthenticated(true);
        setAppUsername(authUser.username);

        const apiKey = appAuth.getApiKey('OPENAI_API_KEY');
        if (apiKey) {
          setOpenaiApiKey(apiKey);
          aiEmployeeManager.setApiKey(apiKey);
        }
      } else {
        console.log('Auto-login failed, requiring manual login');
        setAppAuthenticated(false);
      }
    } else {
      console.log('Not running in iframe, checking cached auth...');
      const cachedUser = appAuth.getCurrentUser();

      if (cachedUser && cachedUser.authenticated) {
        console.log('Cached auth found:', cachedUser.username);
        setAppAuthenticated(true);
        setAppUsername(cachedUser.username);

        const apiKey = appAuth.getApiKey('OPENAI_API_KEY');
        if (apiKey) {
          setOpenaiApiKey(apiKey);
          aiEmployeeManager.setApiKey(apiKey);
        }
      } else {
        console.log('No cached auth, requiring login');
        setAppAuthenticated(false);
      }
    }

    setAppAuthLoading(false);
    checkAuth();
  };

  const handleApiKeyUpdate = (newApiKey: string | null) => {
    if (newApiKey === null || newApiKey === '' || newApiKey === 'clear') {
      localStorage.removeItem('openai_api_key');
      setOpenaiApiKey('');
      aiEmployeeManager.setApiKey('');
      console.log('API key cleared via postMessage');
    } else {
      localStorage.setItem('openai_api_key', newApiKey);
      setOpenaiApiKey(newApiKey);
      aiEmployeeManager.setApiKey(newApiKey);
      console.log('API key updated via postMessage');
    }
  };

  const handleBeforeUnload = () => {
    if (appAuth.isRunningInIframe()) {
      console.log('Window closing, clearing cache...');
      appAuth.clearCache();
    }
  };

  const handleAppLogin = (username: string) => {
    setAppAuthenticated(true);
    setAppUsername(username);

    const apiKey = appAuth.getApiKey('OPENAI_API_KEY');
    if (apiKey) {
      setOpenaiApiKey(apiKey);
      aiEmployeeManager.setApiKey(apiKey);
    }

    checkAuth();
  };

  const handleLogout = () => {
    appAuth.logout();
    setAppAuthenticated(false);
    setAppUsername(null);
    setOpenaiApiKey('');
    aiEmployeeManager.setApiKey('');

    auth.signOut();
    setUser(null);
    setTasks([]);
    setEvents([]);
    setOptimizationResult(null);

    console.log('User logged out, cache cleared');
  };

  const loadUserTasks = async (userId: string) => {
    setTasksLoading(true);
    console.log('Loading tasks for user:', userId);
    
    try {
      console.log('Attempting to load tasks from database...');
      const userTasks = await db.getTasks(userId);
      console.log('Successfully loaded tasks:', userTasks.length);
      setTasks(userTasks);
      
      // Optimize schedule with loaded tasks
      if (userTasks.length > 0) {
        console.log('Optimizing schedule with loaded tasks...');
        await optimizeSchedule(userTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Fall back to empty tasks if loading fails but don't crash
      setTasks([]);
    } finally {
      console.log('Task loading completed');
      setTasksLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      console.log('Starting auth check...');
      
      // Check if Supabase is available first
      if (!isSupabaseAvailable()) {
        console.warn('Supabase not configured - running in demo mode');
        setInitialAuthError('Database not configured. Please set up Supabase to enable authentication and data persistence.');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Supabase is available, checking current user...');
      const currentUser = await auth.getCurrentUser();
      console.log('Auth check result:', currentUser);
      setUser(currentUser);
      
      // If user is found, load their tasks
      if (currentUser) {
        console.log('User authenticated, loading tasks...');
        await loadUserTasks(currentUser.id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      const errorMessage = (error as Error).message || 'Authentication failed';
      
      setInitialAuthError(errorMessage);
      setUser(null);
    } finally {
      console.log('Auth check completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    checkAuth();
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => {
    if (!user) {
      console.error('No authenticated user');
      throw new Error('Please sign in to add tasks');
    }

    console.log('Adding task:', taskData);

    try {
      if (db.isAvailable()) {
        console.log('Creating task in database...');
        try {
          // Create task in database with timeout
          const dbTaskData = {
            name: taskData.name,
            description: taskData.description || '',
            priority: taskData.priority,
            estimated_minutes: taskData.estimatedMinutes,
            deadline: taskData.deadline?.toISOString(),
            task_type: taskData.type,
            is_flexible: taskData.isFlexible,
            chunkable: taskData.chunkable,
            min_chunk_minutes: taskData.minChunkMinutes || 15,
            max_chunk_minutes: taskData.maxChunkMinutes,
            dependencies: taskData.dependencies || [],
            project_id: taskData.projectId || null,
            workspace_id: null
          };
          
          console.log('Database task data:', dbTaskData);
          const newTask = await db.createTask(user.id, dbTaskData);
          console.log('Task created in database:', newTask);
          
          const updatedTasks = [...tasks, newTask];
          setTasks(updatedTasks);
          console.log('Updated tasks list, optimizing schedule...');
          await optimizeSchedule(updatedTasks);
          console.log('Task added and schedule optimized successfully');
          return; // Successfully created in database, exit early
        } catch (dbError) {
          console.warn('Database task creation failed, falling back to local storage:', dbError);
          // Continue to fallback logic below
        }
      } else {
        console.log('Database not available, creating task locally only');
      }
      
      // Fallback to local task creation
      console.log('Creating task locally...');
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        state: 'To Do',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await optimizeSchedule(updatedTasks);
      console.log('Task added locally and schedule optimized');
    } catch (error) {
      console.error('Failed to add task:', error);
      // Re-throw the error so the form can handle it
      throw new Error(`Failed to save task: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      if (db.isAvailable()) {
        console.log('Updating task in database:', updatedTask.id);
        const dbUpdates = {
          name: updatedTask.name,
          description: updatedTask.description || '',
          priority: updatedTask.priority,
          estimated_minutes: updatedTask.estimatedMinutes,
          actual_minutes: updatedTask.actualMinutes,
          deadline: updatedTask.deadline?.toISOString(),
          scheduled_time: updatedTask.scheduledTime?.toISOString(),
          end_time: updatedTask.endTime?.toISOString(),
          state: updatedTask.state,
          task_type: updatedTask.type,
          is_flexible: updatedTask.isFlexible,
          chunkable: updatedTask.chunkable,
          dependencies: updatedTask.dependencies,
          happiness_contribution: updatedTask.happinessContribution,
          completed_at: updatedTask.completedAt?.toISOString()
        };
        
        await db.updateTask(updatedTask.id, dbUpdates);
        console.log('Task updated in database successfully');
      }

      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : task
      );
      setTasks(updatedTasks);
      await optimizeSchedule(updatedTasks);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (db.isAvailable()) {
        console.log('Deleting task from database:', taskId);
        await db.deleteTask(taskId);
        console.log('Task deleted from database successfully');
      }

      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await optimizeSchedule(updatedTasks);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const optimizeSchedule = async (taskList: Task[]) => {
    setIsOptimizing(true);
    try {
      const result = happinessAlgorithm.optimizeSchedule(taskList, events);
      setOptimizationResult(result);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    await realTimeOptimizer.handleDisruption('task_completed', { taskId }, 'medium');
  };

  const handleTaskReschedule = async (taskId: string) => {
    await realTimeOptimizer.handleDisruption('task_missed', { taskId }, 'high');
  };

  const handleCalendarConnect = async (provider: string, credentials: any) => {
    try {
      // If using Google and we have stored credentials, use those
      if (provider === 'google') {
        const storedCreds = googleAuth.getCalendarCredentials();
        if (storedCreds) {
          credentials = storedCreds;
        }
      }
      
      // If using Microsoft and we have stored credentials, use those
      if (provider === 'outlook' || provider === 'microsoft') {
        const storedCreds = microsoftAuth.getCalendarCredentials();
        if (storedCreds) {
          credentials = storedCreds;
        }
      }
      
      const result = await calendarIntegration.connectCalendar(provider, credentials);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading || appAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4 animate-pulse">🧠</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Teacher Scheduler AI</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {appAuthLoading ? 'Authenticating...' : 'Loading your intelligent scheduler...'}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="loading-spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!appAuthenticated) {
    return <AppLogin onLoginSuccess={handleAppLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors relative">
      {/* Background Image Overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1370298/pexels-photo-1370298.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Header */}
      <header className="app-header sticky top-0 z-50 relative">
        <div className="header-content">
          <div className="brand-section">
            <a href="#" className="brand-logo">
              <div className="brand-icon">🧠</div>
              <div>
                <div className="brand-text">Teacher Scheduler AI</div>
                <div className="brand-subtitle">Intelligent Teaching Assistant</div>
              </div>
            </a>
            
            <nav className="main-navigation hidden lg:flex">
              <button
                onClick={() => setCurrentView('schedule')}
                className={`nav-button ${currentView === 'schedule' ? 'active' : ''}`}
              >
                📅 Schedule
              </button>
              <button
                onClick={() => setCurrentView('tasks')}
                className={`nav-button ${currentView === 'tasks' ? 'active' : ''}`}
              >
                ✅ Tasks
              </button>
              <button
                onClick={() => setCurrentView('students')}
                className={`nav-button ${currentView === 'students' ? 'active' : ''}`}
              >
                👨‍🎓 Students
              </button>
              <button
                onClick={() => setCurrentView('attendance')}
                className={`nav-button ${currentView === 'attendance' ? 'active' : ''}`}
              >
                📋 Attendance
              </button>
              <button
                onClick={() => setCurrentView('meetings')}
                className={`nav-button ${currentView === 'meetings' ? 'active' : ''}`}
              >
                🤝 Meetings
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`nav-button ${currentView === 'analytics' ? 'active' : ''}`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setCurrentView('ai-employees')}
                className={`nav-button ${currentView === 'ai-employees' ? 'active' : ''}`}
              >
                🤖 AI Employees
              </button>
            </nav>
          </div>

          <div className="user-section">
            {user ? (
              <>
                <CalendarConnection
                  onConnect={handleCalendarConnect}
                  isConnected={false}
                />

                <button
                  onClick={toggleTheme}
                  className="theme-toggle tooltip"
                  data-tooltip={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>

                <div className="flex items-center">
                  <Settings isAuthenticated={appAuthenticated} />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="user-menu"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <div className="user-avatar">
                      {getUserInitials(appUsername || user.fullName, user.email)}
                    </div>
                    <div className="user-info hidden sm:block">
                      <div className="user-name">{appUsername || user.fullName || user.email}</div>
                      <div className="user-role">Teacher</div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                        <div className="font-medium text-gray-900 dark:text-white">{appUsername || user.fullName || 'User'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        {appAuthenticated && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Authenticated
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Navigation Toggle */}
                <button
                  onClick={() => setShowMobileNav(!showMobileNav)}
                  className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  aria-label="Toggle mobile navigation"
                >
                  {showMobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <button
                onClick={toggleTheme}
                className="theme-toggle tooltip"
                data-tooltip={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileNav && user && (
          <div className="lg:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <nav className="px-4 py-2 space-y-1">
              <button
                onClick={() => { setCurrentView('schedule'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'schedule'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                📅 Schedule
              </button>
              <button
                onClick={() => { setCurrentView('tasks'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'tasks'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                ✅ Tasks
              </button>
              <button
                onClick={() => { setCurrentView('students'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'students'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                👨‍🎓 Students
              </button>
              <button
                onClick={() => { setCurrentView('attendance'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'attendance'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                📋 Attendance
              </button>
              <button
                onClick={() => { setCurrentView('meetings'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'meetings'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                🤝 Meetings
              </button>
              <button
                onClick={() => { setCurrentView('analytics'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'analytics'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => { setCurrentView('ai-employees'); setShowMobileNav(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'ai-employees'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                🤖 AI Employees
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!user ? (
          <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
              {/* Welcome Section */}
              <div className="space-y-6">
                <div className="text-6xl mb-6">🧠</div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Teacher Scheduler AI
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Your intelligent teaching assistant that helps automate scheduling, track students, manage attendance, and optimize your teaching workflow.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Scheduling</h3>
                      <p className="text-gray-600 dark:text-gray-400">Automatically optimize your tasks and lesson plans</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👨‍🎓</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Student Management</h3>
                      <p className="text-gray-600 dark:text-gray-400">Track student information and parent contacts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📋</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Attendance Tracking</h3>
                      <p className="text-gray-600 dark:text-gray-400">Quick and easy daily attendance recording</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🤖</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">AI Teaching Assistants</h3>
                      <p className="text-gray-600 dark:text-gray-400">Specialized AI helpers for lesson planning, grading, and more</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Form Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
                <InlineAuth onAuthSuccess={handleAuthSuccess} initialError={initialAuthError} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'schedule' && (
              <div className="space-y-6 fade-in">
                <TaskForm onAddTask={handleAddTask} />
                {optimizationResult ? (
                  <RealTimeScheduleView
                    optimizationResult={optimizationResult}
                    events={events}
                    onTaskComplete={handleTaskComplete}
                    onTaskReschedule={handleTaskReschedule}
                    onTaskUpdate={handleUpdateTask}
                    onTaskDelete={handleDeleteTask}
                    isOptimizing={isOptimizing}
                  />
                ) : (
                  <ScheduleView optimizationResult={{ schedule: [], happinessScore: 0, confidence: 0, unscheduledTasks: [], recommendations: [], warnings: [] }} />
                )}
              </div>
            )}

        {currentView === 'tasks' && (
          <div className="space-y-6 fade-in">
            {tasksLoading ? (
              <div className="card p-8 text-center">
                <div className="loading-spinner mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
              </div>
            ) : (
              <TaskList
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </div>
        )}

        {currentView === 'students' && user && (
          <StudentRoster userId={user.id} />
        )}

        {currentView === 'attendance' && user && (
          <AttendanceTracker userId={user.id} />
        )}

        {currentView === 'workspaces' && (
          <WorkspaceManagerComponent
            workspaceManager={workspaceManager}
            onWorkspaceChange={(workspaceId) => console.log('Workspace changed:', workspaceId)}
            onTasksUpdate={setTasks}
          />
        )}

        {currentView === 'meetings' && (
          <MeetingSchedulerComponent
            userSchedule={userSchedule}
            onMeetingBooked={(meeting) => console.log('Meeting booked:', meeting)}
          />
        )}

        {currentView === 'analytics' && (
          <Analytics
            analyticsManager={analyticsManager}
            tasks={tasks}
            projects={workspaceManager.getAllWorkspaces().flatMap(w => workspaceManager.getProjectsInWorkspace(w.id))}
            workspaces={workspaceManager.getAllWorkspaces()}
            events={events}
          />
        )}

        {currentView === 'ai-employees' && (
          <AIEmployees 
            aiManager={aiEmployeeManager} 
            onTaskCreated={(taskData) => {
              console.log('AI workflow approved, creating task:', taskData);
              handleAddTask(taskData).catch(error => {
                console.error('Failed to create task from AI workflow:', error);
                alert('Failed to add AI-generated task to your schedule. Please try again.');
              });
            }}
          />
            )}
          </>
        )}
      </main>
    </div>
  );
};


export default App