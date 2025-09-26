import React, { useMemo } from 'react';
import { Clock, Calendar, Target, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { ScheduledTask, OptimizationResult } from '../../lib/types';

interface ScheduleViewProps {
  optimizationResult: OptimizationResult;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ optimizationResult }) => {
  const { schedule, happinessScore, confidence, recommendations, warnings } = optimizationResult;

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

  const groupedSchedule = useMemo(() => {
    const grouped: { [date: string]: ScheduledTask[] } = {};
    
    schedule.forEach(task => {
      const dateKey = task.scheduledTime.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    // Sort tasks within each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    });

    return grouped;
  }, [schedule]);

  const totalDuration = schedule.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const averageHappiness = Math.round(happinessScore * 100);

  if (schedule.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Scheduled</h3>
          <p className="text-gray-600">
            Add some tasks and I'll automatically create an optimized schedule for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Stats */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Schedule Optimization
          </h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence Score</div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(confidence * 100)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{schedule.length}</div>
            <div className="text-sm text-gray-600">Tasks Scheduled</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatDuration(totalDuration)}</div>
            <div className="text-sm text-gray-600">Total Duration</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{averageHappiness}%</div>
            <div className="text-sm text-gray-600">Happiness Score</div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              Optimization Warnings
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              AI Recommendations
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {recommendations.map((recommendation, index) => (
                <li key={index}>• {recommendation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Optimized Schedule
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Tasks automatically scheduled based on priority, deadlines, and your preferences
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {Object.entries(groupedSchedule).map(([date, dayTasks]) => (
            <div key={date} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <span className="text-sm text-gray-500">
                  {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getPriorityColor(task.priority)}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(task.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-base font-medium text-gray-900 truncate">
                            {task.name}
                          </h5>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(task.scheduledTime)} - {formatTime(task.endTime)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDuration(task.estimatedMinutes)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {task.priority}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.type.replace('_', ' ')}
                        </span>
                        {task.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {task.deadline.toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Math.round((task.happinessContribution || 0) * 100)}% happiness
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;