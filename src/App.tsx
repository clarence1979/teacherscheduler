import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Bot, Users, Settings as Settings, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { auth, isSupabaseAvailable } from './lib/auth';
import { googleAuth } from './lib/google-auth';
import { microsoftAuth } from './lib/microsoft-auth';
import { mobileDetection } from './utils/mobile-detection';

// Import components
import Auth from './src/components/Auth';
import TaskForm from './src/components/TaskForm';
import TaskList from './src/components/TaskList';
import ScheduleView from './src/components/ScheduleView';
import Analytics from './src/components/Analytics';
import AIEmployees from './src/components/AIEmployees';
import SettingsComponent from './src/components/Settings';
import MobileOptimizedTaskForm from './src/components/MobileOptimizedTaskForm';

// Import lib classes
import { HappinessAlgorithm } from './lib/happiness-algorithm';
import { AIEmployeeManager } from './lib/ai-employee-manager';
import { AnalyticsManager } from './lib/analytics-manager';
import { WorkspaceManager } from './lib/workspace-manager';
import { RealTimeOptimizer } from './lib/real-time-optimizer';
import { CalendarIntegration } from './lib/calendar-integration';

// Import types
import { Task, OptimizationResult, UserSchedule } from './lib/types';

interface AppState {
  isAuthenticated: boolean;
  user: any;
  tasks: Task[];
  optimizationResult: OptimizationResult | null;
  activeView: 'schedule' | 'tasks' | 'analytics' | 'ai-employees' | 'meetings';
  isDark: boolean;
  isMobile: boolean;
  showMobileMenu: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    tasks: [],
    optimizationResult: null,
    activeView: 'schedule',
    isDark: false,
    isMobile: mobileDetection.isMobile(),
    showMobileMenu: false
  });

  // Initialize managers
  const [userSchedule] = useState<UserSchedule>({
    workingHours: {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17]
    },
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
  const [aiManager] = useState(() => new AIEmployeeManager());
  const [analyticsManager] = useState(() => new AnalyticsManager());
  const [workspaceManager] = useState(() => new WorkspaceManager());
  const [realTimeOptimizer] = useState(() => new RealTimeOptimizer(happinessAlgorithm));
  const [calendarIntegration] = useState(() => new CalendarIntegration());

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isSupabaseAvailable()) {
          const user = await auth.getCurrentUser();
          if (user) {
            setState(prev => ({ ...prev, isAuthenticated: true, user }));
          }
        } else {
          // Demo mode - allow access without authentication
          setState(prev => ({ ...prev, isAuthenticated: true, user: { email: 'demo@example.com' } }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Continue in demo mode
        setState(prev => ({ ...prev, isAuthenticated: true, user: { email: 'demo@example.com' } }));
      }
    };

    checkAuth();
  }, []);

  // Handle device changes
  useEffect(() => {
    const unsubscribe = mobileDetection.onChange((deviceInfo) => {
      setState(prev => ({ ...prev, isMobile: deviceInfo.isMobile }));
    });

    return unsubscribe;
  }, []);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setState(prev => ({ ...prev, isDark }));
    
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !state.isDark;
    setState(prev => ({ ...prev, isDark: newIsDark }));
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    
    const html = document.documentElement;
    if (newIsDark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
  };

  const handleAuthSuccess = () => {
    setState(prev => ({ ...prev, isAuthenticated: true }));
  };

  const handleSignOut = async () => {
    try {
      if (isSupabaseAvailable()) {
        await auth.signOut();
      }
      googleAuth.signOut();
      microsoftAuth.signOut();
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        user: null,
        tasks: [],
        optimizationResult: null
      }));
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      userId: state.user?.id || 'demo-user',
      state: 'To Do',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTasks = [...state.tasks, newTask];
    setState(prev => ({ ...prev, tasks: updatedTasks }));

    // Optimize schedule
    const result = happinessAlgorithm.optimizeSchedule(updatedTasks);
    setState(prev => ({ ...prev, optimizationResult: result }));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = state.tasks.map(task => 
      task.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : task
    );
    setState(prev => ({ ...prev, tasks: updatedTasks }));

    // Re-optimize schedule
    const result = happinessAlgorithm.optimizeSchedule(updatedTasks);
    setState(prev => ({ ...prev, optimizationResult: result }));
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = state.tasks.filter(task => task.id !== taskId);
    setState(prev => ({ ...prev, tasks: updatedTasks }));

    // Re-optimize schedule
    const result = happinessAlgorithm.optimizeSchedule(updatedTasks);
    setState(prev => ({ ...prev, optimizationResult: result }));
  };

  const handleApiKeyUpdate = (apiKey: string) => {
    aiManager.setApiKey(apiKey);
  };

  if (!state.isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const navigationItems = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-employees', label: 'AI Team', icon: Bot },
    { id: 'meetings', label: 'Meetings', icon: Users }
  ];

  const renderActiveView = () => {
    switch (state.activeView) {
      case 'schedule':
        return state.optimizationResult ? (
          <ScheduleView optimizationResult={state.optimizationResult} />
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Schedule Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add some tasks to generate your optimized schedule
            </p>
          </div>
        );
      
      case 'tasks':
        return (
          <div className="space-y-6">
            {state.isMobile ? (
              <MobileOptimizedTaskForm onAddTask={handleAddTask} />
            ) : (
              <TaskForm onAddTask={handleAddTask} />
            )}
            <TaskList 
              tasks={state.tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        );
      
      case 'analytics':
        return (
          <Analytics
            analyticsManager={analyticsManager}
            tasks={state.tasks}
            projects={[]}
            workspaces={[]}
            events={[]}
          />
        );
      
      case 'ai-employees':
        return <AIEmployees aiManager={aiManager} />;
      
      case 'meetings':
        return (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Meeting Scheduler
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Coming soon - intelligent meeting scheduling
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {state.isMobile && (
                <button
                  onClick={() => setState(prev => ({ ...prev, showMobileMenu: !prev.showMobileMenu }))}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {state.showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
              <div className="text-2xl">🧠</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Teacher Scheduler AI
                </h1>
                {!state.isMobile && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Intelligent Teaching Assistant
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            {!state.isMobile && (
              <nav className="flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setState(prev => ({ ...prev, activeView: item.id as any }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        state.activeView === item.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={`Switch to ${state.isDark ? 'light' : 'dark'} mode`}
              >
                {state.isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <SettingsComponent 
                onApiKeyUpdate={handleApiKeyUpdate}
                currentApiKey={localStorage.getItem('openai_api_key') || undefined}
              />

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

        {/* Mobile Navigation */}
        {state.isMobile && state.showMobileMenu && (
          <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setState(prev => ({ 
                        ...prev, 
                        activeView: item.id as any,
                        showMobileMenu: false
                      }));
                    }}
                    className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                      state.activeView === item.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Navigation */}
      {state.isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-2">
          <div className="flex justify-around">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setState(prev => ({ ...prev, activeView: item.id as any }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    state.activeView === item.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;