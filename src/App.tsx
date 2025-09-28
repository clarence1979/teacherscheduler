import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, Bell, Settings as SettingsIcon, User, ChevronDown } from 'lucide-react';
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
import Auth from './components/Auth';
import { Task, Event, UserSchedule, OptimizationResult } from '../lib/types';
import { User as AuthUser } from '../lib/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthError, setInitialAuthError] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'schedule' | 'tasks' | 'workspaces' | 'meetings' | 'analytics' | 'ai-employees'>('schedule');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

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
    checkAuth();
    
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
    
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setOpenaiApiKey(savedApiKey);
      aiEmployeeManager.setApiKey(savedApiKey);
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

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadUserTasks = async (userId: string) => {
    if (!db.isAvailable()) return;
    
    setTasksLoading(true);
    try {
      const userTasks = await db.getTasks(userId);
      setTasks(userTasks);
      if (userTasks.length > 0) {
        await optimizeSchedule(userTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
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
      
      // Don't load tasks during initial auth check to avoid hanging
      // Tasks will be loaded after auth state is established
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
      return;
    }

    try {
      // Convert Task data to database format
      const dbTaskData = {
        name: taskData.name,
        description: taskData.description || '',
        priority: taskData.priority,
        estimated_minutes: taskData.estimatedMinutes,
        deadline: taskData.deadline?.toISOString(),
        task_type: taskData.type,
        is_flexible: taskData.isFlexible,
        chunkable: taskData.chunkable,
        min_chunk_minutes: taskData.minChunkMinutes,
        max_chunk_minutes: taskData.maxChunkMinutes,
        dependencies: taskData.dependencies || [],
        project_id: taskData.projectId,
        workspace_id: undefined
      };

      let newTask: Task;
      
      if (db.isAvailable()) {
        // Save to database
        newTask = await db.createTask(user.id, dbTaskData);
      } else {
        // Fallback to local state
        newTask = {
          ...taskData,
          id: Date.now().toString(),
          userId: user.id,
          state: 'To Do',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await optimizeSchedule(updatedTasks);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      if (db.isAvailable()) {
        // Update in database
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
      }

      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : task
      );
      setTasks(updatedTasks);
      await optimizeSchedule(updatedTasks);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (db.isAvailable()) {
        await db.deleteTask(taskId);
      }

      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await optimizeSchedule(updatedTasks);
    } catch (error) {
      console.error('Failed to delete task:', error);
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

  const handleApiKeyUpdate = (apiKey: string) => {
    setOpenaiApiKey(apiKey);
    aiEmployeeManager.setApiKey(apiKey);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4 animate-pulse">🧠</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Teacher Scheduler AI</h1>
            <p className="text-gray-600 dark:text-gray-300">Loading your intelligent scheduler...</p>
          </div>
          <div className="flex justify-center">
            <div className="loading-spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} initialError={initialAuthError} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="app-header sticky top-0 z-50">
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
                onClick={() => setCurrentView('workspaces')}
                className={`nav-button ${currentView === 'workspaces' ? 'active' : ''}`}
              >
                📁 Workspaces
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
              <Settings
                onApiKeyUpdate={handleApiKeyUpdate}
                currentApiKey={openaiApiKey}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="user-menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {getUserInitials(user.fullName, user.email)}
                </div>
                <div className="user-info hidden sm:block">
                  <div className="user-name">{user.fullName || user.email}</div>
                  <div className="user-role">Teacher</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                    <div className="font-medium text-gray-900 dark:text-white">{user.fullName || 'User'}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Add profile settings logic here
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      auth.signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    Sign Out
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
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileNav && (
          <div className="lg:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <nav className="px-4 py-2 space-y-1">
              <button
                onClick={() => setCurrentView('schedule')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'schedule' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                📅 Schedule
              </button>
              <button
                onClick={() => setCurrentView('tasks')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'tasks' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                ✅ Tasks
              </button>
              <button
                onClick={() => setCurrentView('workspaces')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'workspaces' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                📁 Workspaces
              </button>
              <button
                onClick={() => setCurrentView('meetings')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'meetings' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                🤝 Meetings
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'analytics' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setCurrentView('ai-employees')}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'schedule' && (
          <div className="space-y-6 fade-in">
            <TaskForm onAddTask={handleAddTask} />
            {optimizationResult ? (
              <RealTimeScheduleView
                optimizationResult={optimizationResult}
                events={events}
                onTaskComplete={handleTaskComplete}
                onTaskReschedule={handleTaskReschedule}
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
            onTaskCreated={handleAddTask}
          />
        )}
      </main>
    </div>
  );
};


export default App