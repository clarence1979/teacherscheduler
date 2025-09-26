import React, { useState, useEffect } from 'react';
import { Brain, Calendar, CheckCircle, BarChart3, Users, Settings as SettingsIcon, LogOut, Sun, Moon } from 'lucide-react';
import Auth from './components/Auth';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ScheduleView from './components/ScheduleView';
import Analytics from './components/Analytics';
import AIEmployees from './components/AIEmployees';
import MeetingScheduler from './components/MeetingScheduler';
import WorkspaceManager from './components/WorkspaceManager';
import CalendarConnection from './components/CalendarConnection';
import Settings from './components/Settings';
import { HappinessAlgorithm } from './lib/happiness-algorithm';
import { AIEmployeeManager } from './lib/ai-employee-manager';
import { AnalyticsManager } from './lib/analytics-manager';
import { WorkspaceManager as WorkspaceManagerClass } from './lib/workspace-manager';
import { CalendarIntegration } from '../lib/calendar-integration';
import { RealTimeOptimizer } from '../lib/real-time-optimizer';
import { auth } from './lib/auth';
import { isSupabaseAvailable } from './lib/supabase';
import { googleAuth } from './lib/google-auth';
import { microsoftAuth } from './lib/microsoft-auth';
import { mobileDetection } from './utils/mobile-detection';
import { Task, OptimizationResult, UserSchedule } from '../lib/types';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('schedule');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isMobile] = useState(mobileDetection.isMobile());

  // Core system state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult>({
    schedule: [],
    happinessScore: 0.8,
    confidence: 0.9,
    unscheduledTasks: [],
    recommendations: [],
    warnings: []
  });

  // System managers
  const [happinessAlgorithm] = useState(() => new HappinessAlgorithm());
  const [aiManager] = useState(() => new AIEmployeeManager());
  const [analyticsManager] = useState(() => new AnalyticsManager());
  const [workspaceManager] = useState(() => new WorkspaceManagerClass());
  const [calendarIntegration] = useState(() => new CalendarIntegration());
  const [realTimeOptimizer] = useState(() => new RealTimeOptimizer(happinessAlgorithm));

  // Calendar state
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<string | undefined>();

  // User schedule configuration
  const [userSchedule] = useState<UserSchedule>({
    workingHours: {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17]
    },
    breakTimes: [
      { start: '12:00', end: '13:00', name: 'Lunch Break' },
      { start: '15:00', end: '15:15', name: 'Afternoon Break' }
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

  // Apply theme
  useEffect(() => {
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

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for stored demo user
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          const userData = JSON.parse(demoUser);
          if (userData.loggedIn) {
            setUser(userData);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }

        // Check Google auth
        if (googleAuth.loadStoredTokens && googleAuth.loadStoredTokens()) {
          const googleUser = googleAuth.getCurrentUser();
          if (googleUser) {
            setUser(googleUser);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }

        // Check Microsoft auth
        if (microsoftAuth.loadStoredTokens && microsoftAuth.loadStoredTokens()) {
          const microsoftUser = microsoftAuth.getCurrentUser();
          if (microsoftUser) {
            setUser(microsoftUser);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }

        // Check Supabase auth if available
        if (isSupabaseAvailable()) {
          const currentUser = await auth.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Set up real-time optimization
  useEffect(() => {
    if (isAuthenticated) {
      realTimeOptimizer.onScheduleChange((newSchedule) => {
        setOptimizationResult(newSchedule);
      });

      return () => {
        realTimeOptimizer.offScheduleChange(() => {});
      };
    }
  }, [isAuthenticated, realTimeOptimizer]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      googleAuth.signOut && googleAuth.signOut();
      microsoftAuth.signOut && microsoftAuth.signOut();
      localStorage.removeItem('demo_user');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user?.id || 'demo-user',
      state: 'To Do',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    // Trigger optimization
    const result = happinessAlgorithm.optimizeSchedule(updatedTasks, [], new Date(), 7);
    setOptimizationResult(result);

    // Track analytics
    analyticsManager.trackActivity({
      type: 'task_created',
      task: newTask.name,
      priority: newTask.priority,
      estimatedMinutes: newTask.estimatedMinutes
    });
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);

    // Handle real-time optimization for task state changes
    if (updatedTask.state === 'Done') {
      await realTimeOptimizer.handleDisruption('task_completed', updatedTask, 'medium');
    } else if (updatedTask.state === 'In Progress') {
      analyticsManager.trackActivity({
        type: 'task_started',
        task: updatedTask.name,
        startTime: new Date()
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);

    // Re-optimize schedule
    const result = happinessAlgorithm.optimizeSchedule(updatedTasks, [], new Date(), 7);
    setOptimizationResult(result);
  };

  const handleCalendarConnect = async (provider: string, credentials: any) => {
    try {
      const result = await calendarIntegration.connectCalendar(provider, credentials);
      if (result.success) {
        setIsCalendarConnected(true);
        setConnectedProvider(provider);
        
        // Start syncing events
        await calendarIntegration.syncEvents(provider);
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const handleApiKeyUpdate = (apiKey: string) => {
    aiManager.setApiKey(apiKey);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Teacher Scheduler AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'ai-employees', label: 'AI Team', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'meetings', label: 'Meetings', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Teacher Scheduler AI</h1>
                {!isMobile && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">Intelligent Teaching Assistant</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CalendarConnection
                onConnect={handleCalendarConnect}
                isConnected={isCalendarConnected}
                connectedProvider={connectedProvider}
              />
              
              <Settings
                onApiKeyUpdate={handleApiKeyUpdate}
                currentApiKey={localStorage.getItem('openai_api_key') || undefined}
              />

              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {!isMobile && tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <TaskForm onAddTask={handleAddTask} />
            <ScheduleView optimizationResult={optimizationResult} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <WorkspaceManager
              workspaceManager={workspaceManager}
              onWorkspaceChange={(workspaceId) => console.log('Workspace changed:', workspaceId)}
              onTasksUpdate={setTasks}
            />
            <TaskList
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === 'ai-employees' && (
          <AIEmployees aiManager={aiManager} />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            analyticsManager={analyticsManager}
            tasks={tasks}
            projects={[]}
            workspaces={[]}
            events={[]}
          />
        )}

        {activeTab === 'meetings' && (
          <MeetingScheduler
            userSchedule={userSchedule}
            onMeetingBooked={(meeting) => console.log('Meeting booked:', meeting)}
          />
        )}
      </main>
    </div>
  );
}

export default App;