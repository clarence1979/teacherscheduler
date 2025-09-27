import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Target, AlertTriangle, TrendingUp, CheckCircle, Zap, RotateCcw } from 'lucide-react';
import { ScheduledTask, OptimizationResult, Event } from '../../lib/types';

interface RealTimeScheduleViewProps {
  optimizationResult: OptimizationResult;
  events: Event[];
  onTaskComplete: (taskId: string) => void;
  onTaskReschedule: (taskId: string) => void;
  isOptimizing: boolean;
}

const RealTimeScheduleView: React.FC<RealTimeScheduleViewProps> = ({ 
  optimizationResult, 
  events,
  onTaskComplete,
  onTaskReschedule,
  isOptimizing
}) => {
  const { schedule, happinessScore, confidence, recommendations, warnings } = optimizationResult;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
      case 'ASAP': return <Zap className="h-4 w-4" />;
      case 'High': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTaskStatus = (task: ScheduledTask) => {
    if (completedTasks.has(task.id)) return 'completed';
    if (!task.scheduledTime) return 'unscheduled';
    
    const now = currentTime.getTime();
    const taskStart = task.scheduledTime.getTime();
    const taskEnd = task.endTime?.getTime() || taskStart + (task.estimatedMinutes * 60000);
    
    if (now >= taskStart && now <= taskEnd) return 'current';
    if (now > taskEnd) return 'overdue';
    if (taskStart - now <= 15 * 60000) return 'upcoming'; // 15 minutes
    return 'scheduled';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'current': 'bg-blue-100 text-blue-800 border-blue-200',
      'upcoming': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'scheduled': 'bg-gray-100 text-gray-800 border-gray-200',
      'unscheduled': 'bg-gray-50 text-gray-600 border-gray-200'
    };
    return colors[status] || colors.scheduled;
  };

  const handleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => new Set([...prev, taskId]));
    onTaskComplete(taskId);
  };

  const mergedItems = [...schedule, ...events].sort((a, b) => {
    const aTime = a.scheduledTime || a.start || new Date(0);
    const bTime = b.scheduledTime || b.start || new Date(0);
    return aTime.getTime() - bTime.getTime();
  });

  const totalDuration = schedule.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const averageHappiness = Math.round(happinessScore * 100);
  const confidenceScore = Math.round(confidence * 100);

  if (schedule.length === 0 && events.length === 0) {
    return (
      <div className="real-time-schedule-view">
        <div className="empty-state">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Yet</h3>
          <p className="text-gray-600">
            Add some tasks and I'll automatically create an optimized schedule for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="real-time-schedule-view">
      {/* Optimization Status */}
      {isOptimizing && (
        <div className="optimization-banner">
          <div className="optimization-content">
            <RotateCcw className="h-4 w-4 animate-spin" />
            <span>AI is optimizing your schedule...</span>
          </div>
        </div>
      )}

      {/* Schedule Stats */}
      <div className="schedule-stats">
        <div className="stats-header">
          <h3 className="stats-title">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Schedule Optimization
          </h3>
          <div className="current-time">
            <Clock className="h-4 w-4" />
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{schedule.length}</div>
            <div className="stat-label">Tasks Scheduled</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{formatDuration(totalDuration)}</div>
            <div className="stat-label">Total Duration</div>
          </div>
          <div className="stat-card info">
            <div className="stat-value">{averageHappiness}%</div>
            <div className="stat-label">Happiness Score</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{confidenceScore}%</div>
            <div className="stat-label">Confidence</div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h4 className="alert-title">Schedule Warnings</h4>
              <ul className="alert-list">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="alert alert-info">
            <TrendingUp className="h-4 w-4" />
            <div>
              <h4 className="alert-title">AI Recommendations</h4>
              <ul className="alert-list">
                {recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Timeline */}
      <div className="schedule-timeline">
        <div className="timeline-header">
          <h3 className="timeline-title">
            <Calendar className="h-5 w-5 text-blue-600" />
            Today's Schedule
          </h3>
          <div className="timeline-stats">
            <span>{schedule.length} tasks</span>
            <span>{events.length} events</span>
          </div>
        </div>

        <div className="timeline-content">
          {mergedItems.map((item) => {
            const isTask = 'estimatedMinutes' in item;
            const status = isTask ? getTaskStatus(item as ScheduledTask) : 'event';
            const startTime = item.scheduledTime || item.start;
            const endTime = isTask 
              ? item.endTime || new Date(startTime!.getTime() + item.estimatedMinutes * 60000)
              : item.end;

            return (
              <div 
                key={item.id} 
                className={`timeline-item ${isTask ? 'task-item' : 'event-item'} ${
                  isTask ? getPriorityColor((item as ScheduledTask).priority) : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="item-status">
                  <div className={`status-badge ${getStatusColor(status)}`}>
                    {status === 'current' && <Clock className="h-3 w-3" />}
                    {status === 'completed' && <CheckCircle className="h-3 w-3" />}
                    {status === 'overdue' && <AlertTriangle className="h-3 w-3" />}
                    {status === 'upcoming' && <Zap className="h-3 w-3" />}
                    <span className="status-text">{status}</span>
                  </div>
                </div>
                
                <div className="item-time">
                  <div className="time-range">
                    {startTime && formatTime(startTime)} - {endTime && formatTime(endTime)}
                  </div>
                  <div className="time-duration">
                    {isTask ? formatDuration(item.estimatedMinutes) : 'Event'}
                  </div>
                </div>
                
                <div className="item-content">
                  <div className="item-header">
                    <div className="item-title">
                      {isTask && getPriorityIcon((item as ScheduledTask).priority)}
                      <span>{item.name || item.title}</span>
                    </div>
                    {isTask && (
                      <div className="item-actions">
                        {status !== 'completed' && status !== 'overdue' && (
                          <button
                            onClick={() => handleTaskComplete(item.id)}
                            className="action-btn complete-btn"
                            title="Mark as complete"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(status === 'overdue' || status === 'current') && (
                          <button
                            onClick={() => onTaskReschedule(item.id)}
                            className="action-btn reschedule-btn"
                            title="Reschedule task"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {item.description && (
                    <div className="item-description">
                      {item.description}
                    </div>
                  )}
                  
                  <div className="item-meta">
                    {isTask ? (
                      <>
                        <span className="meta-item">
                          <Target className="h-3 w-3" />
                          {(item as ScheduledTask).priority}
                        </span>
                        <span className="meta-item">
                          <Clock className="h-3 w-3" />
                          {item.type?.replace('_', ' ')}
                        </span>
                        {(item as ScheduledTask).deadline && (
                          <span className="meta-item deadline">
                            <Calendar className="h-3 w-3" />
                            Due {(item as ScheduledTask).deadline!.toLocaleDateString()}
                          </span>
                        )}
                        {(item as ScheduledTask).happinessContribution && (
                          <span className="meta-item happiness">
                            <TrendingUp className="h-3 w-3" />
                            {Math.round((item as ScheduledTask).happinessContribution! * 100)}% happiness
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="meta-item">
                        <Calendar className="h-3 w-3" />
                        {item.source} event
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RealTimeScheduleView;