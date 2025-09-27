import React, { useState, useMemo } from 'react';
import { Clock, Calendar, Target, AlertTriangle, TrendingUp, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScheduledTask, OptimizationResult } from '../../lib/types';

interface ScheduleViewProps {
  optimizationResult: OptimizationResult;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ optimizationResult }) => {
  const { schedule, happinessScore, confidence, recommendations, warnings } = optimizationResult;
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: ScheduledTask['priority']) => {
    const colors = {
      'ASAP': 'border-red-500 bg-red-50 text-red-700',
      'High': 'border-orange-500 bg-orange-50 text-orange-700',
      'Medium': 'border-yellow-500 bg-yellow-50 text-yellow-700',
      'Low': 'border-green-500 bg-green-50 text-green-700'
    };
    return colors[priority];
  };

  const getPriorityIcon = (priority: ScheduledTask['priority']) => {
    switch (priority) {
      case 'ASAP': return <AlertTriangle className="h-4 w-4" />;
      case 'High': return <Target className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'daily':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get date range for current view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    return { start, end };
  };

  // Filter tasks for current view
  const filteredTasks = useMemo(() => {
    const { start, end } = getDateRange();
    return schedule.filter(task => 
      task.scheduledTime >= start && task.scheduledTime <= end
    );
  }, [schedule, currentDate, viewMode]);

  // Generate time slots for timetable view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Get days for current view
  const getDaysInView = () => {
    const { start, end } = getDateRange();
    const days = [];
    const current = new Date(start);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Get tasks for specific day and time slot
  const getTasksForSlot = (day: Date, timeSlot: string) => {
    const [hour] = timeSlot.split(':').map(Number);
    
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.scheduledTime);
      const taskHour = taskDate.getHours();
      
      return (
        taskDate.toDateString() === day.toDateString() &&
        taskHour === hour
      );
    });
  };

  const totalDuration = schedule.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const averageHappiness = Math.round(happinessScore * 100);

  if (schedule.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tasks Scheduled</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add some tasks and I'll automatically create an optimized schedule for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Stats */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Schedule Optimization
            </h3>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(confidence * 100)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{schedule.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Scheduled</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatDuration(totalDuration)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Duration</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageHappiness}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Happiness Score</div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Optimization Warnings
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                AI Recommendations
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                {recommendations.map((recommendation, index) => (
                  <li key={index}>• {recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Timetable View */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Schedule Timetable
            </h3>
            
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewMode === 'daily' && currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {viewMode === 'weekly' && (() => {
                  const { start, end } = getDateRange();
                  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                })()}
                {viewMode === 'monthly' && currentDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </h4>
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
              >
                Today
              </button>
            </div>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="card-content">
          {viewMode === 'daily' && <DailyView currentDate={currentDate} tasks={filteredTasks} />}
          {viewMode === 'weekly' && <WeeklyView currentDate={currentDate} tasks={filteredTasks} />}
          {viewMode === 'monthly' && <MonthlyView currentDate={currentDate} tasks={filteredTasks} />}
        </div>
      </div>
    </div>
  );
};

// Daily View Component
const DailyView: React.FC<{ currentDate: Date; tasks: ScheduledTask[] }> = ({ currentDate, tasks }) => {
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  const getTasksForHour = (hour: string) => {
    const [hourNum] = hour.split(':').map(Number);
    return tasks.filter(task => {
      const taskHour = task.scheduledTime.getHours();
      return (
        task.scheduledTime.toDateString() === currentDate.toDateString() &&
        taskHour === hourNum
      );
    });
  };

  return (
    <div className="daily-view">
      <div className="grid grid-cols-1 gap-2">
        {timeSlots.map(timeSlot => {
          const hourTasks = getTasksForHour(timeSlot);
          
          return (
            <div key={timeSlot} className="flex border-b border-gray-100 dark:border-slate-700 min-h-[60px]">
              <div className="w-20 flex-shrink-0 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-slate-700">
                {timeSlot}
              </div>
              <div className="flex-1 p-3">
                {hourTasks.length > 0 ? (
                  <div className="space-y-2">
                    {hourTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border-l-4 ${getPriorityColor(task.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                              {task.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatTime(task.scheduledTime)} - {formatTime(task.endTime)}</span>
                              <span>•</span>
                              <span>{formatDuration(task.estimatedMinutes)}</span>
                              <span>•</span>
                              <span>{task.type.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                    No tasks scheduled
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Weekly View Component
const WeeklyView: React.FC<{ currentDate: Date; tasks: ScheduledTask[] }> = ({ currentDate, tasks }) => {
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  const getDaysInWeek = () => {
    const start = new Date(currentDate);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTasksForDayAndHour = (day: Date, hour: string) => {
    const [hourNum] = hour.split(':').map(Number);
    return tasks.filter(task => {
      const taskHour = task.scheduledTime.getHours();
      return (
        task.scheduledTime.toDateString() === day.toDateString() &&
        taskHour === hourNum
      );
    });
  };

  const daysInWeek = getDaysInWeek();

  return (
    <div className="weekly-view overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="grid grid-cols-8 gap-0 border-b border-gray-200 dark:border-slate-700">
          <div className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-slate-700">
            Time
          </div>
          {daysInWeek.map(day => (
            <div key={day.toDateString()} className="p-3 text-center border-r border-gray-100 dark:border-slate-700 last:border-r-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        {timeSlots.map(timeSlot => (
          <div key={timeSlot} className="grid grid-cols-8 gap-0 border-b border-gray-100 dark:border-slate-700 min-h-[60px]">
            <div className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-slate-700">
              {timeSlot}
            </div>
            {daysInWeek.map(day => {
              const dayTasks = getTasksForDayAndHour(day, timeSlot);
              
              return (
                <div key={`${day.toDateString()}-${timeSlot}`} className="p-2 border-r border-gray-100 dark:border-slate-700 last:border-r-0">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-2 rounded text-xs border-l-2 ${getPriorityColor(task.priority)} mb-1 last:mb-0`}
                    >
                      <div className="font-medium truncate" title={task.name}>
                        {task.name}
                      </div>
                      <div className="text-xs opacity-75">
                        {formatDuration(task.estimatedMinutes)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Monthly View Component
const MonthlyView: React.FC<{ currentDate: Date; tasks: ScheduledTask[] }> = ({ currentDate, tasks }) => {
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and adjust to start from Sunday
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks) to fill the calendar grid
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => 
      task.scheduledTime.toDateString() === day.toDateString()
    );
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentDate.getMonth();
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  };

  const daysInMonth = getDaysInMonth();

  return (
    <div className="monthly-view">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200 dark:border-slate-700 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(day => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);
          
          return (
            <div
              key={day.toDateString()}
              className={`min-h-[120px] p-2 border border-gray-100 dark:border-slate-700 rounded-lg ${
                isCurrentMonthDay 
                  ? 'bg-white dark:bg-slate-800' 
                  : 'bg-gray-50 dark:bg-slate-900'
              } ${
                isTodayDay 
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                  : ''
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isCurrentMonthDay 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-500'
              } ${
                isTodayDay 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : ''
              }`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className={`p-1 rounded text-xs border-l-2 ${getPriorityColor(task.priority)}`}
                    title={`${task.name} - ${formatTime(task.scheduledTime)}`}
                  >
                    <div className="font-medium truncate">
                      {task.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatTime(task.scheduledTime)}
                    </div>
                  </div>
                ))}
                
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;