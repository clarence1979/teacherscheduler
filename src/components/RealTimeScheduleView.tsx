import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Target, AlertTriangle, TrendingUp, CheckCircle, Zap, RotateCcw, Edit, Trash2, Eye, Plus, Minus } from 'lucide-react';
import { ScheduledTask, OptimizationResult, Event } from '../../lib/types';

interface RealTimeScheduleViewProps {
  optimizationResult: OptimizationResult;
  events: Event[];
  onTaskComplete: (taskId: string) => void;
  onTaskReschedule: (taskId: string) => void;
  onTaskUpdate?: (task: ScheduledTask) => void;
  onTaskDelete?: (taskId: string) => void;
  isOptimizing: boolean;
}

interface AIWorkflowDetails {
  id: string;
  title: string;
  content: string;
  employee: string;
  workflowType: string;
  confidence?: number;
  source: string;
  generatedAt: Date;
}

const RealTimeScheduleView: React.FC<RealTimeScheduleViewProps> = ({ 
  optimizationResult, 
  events,
  onTaskComplete,
  onTaskReschedule,
  onTaskUpdate,
  onTaskDelete,
  isOptimizing
}) => {
  const { schedule, happinessScore, confidence, recommendations, warnings } = optimizationResult;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [selectedAIContent, setSelectedAIContent] = useState<AIWorkflowDetails | null>(null);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [bufferSettings, setBufferSettings] = useState({
    defaultBuffer: 15, // minutes
    showBuffers: true
  });

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

  const isAIGeneratedTask = (task: ScheduledTask): boolean => {
    return task.name.includes('AI-Generated') || 
           task.name.includes('Ms. Planner') || 
           task.name.includes('Dr. Gradebook') ||
           task.name.includes('Mrs. Connect') ||
           task.name.includes('Coach Wilson') ||
           task.name.includes('Ms. Inclusion') ||
           task.name.includes('Dr. Growth') ||
           task.name.includes('Tech Wizard') ||
           task.name.includes('Mr. Ready');
  };

  const extractAIDetails = (task: ScheduledTask): AIWorkflowDetails | null => {
    if (!isAIGeneratedTask(task)) return null;

    // Extract employee name and workflow type from task name
    const employeeMatch = task.name.match(/(Ms\. Planner|Dr\. Gradebook|Mrs\. Connect|Coach Wilson|Ms\. Inclusion|Dr\. Growth|Tech Wizard|Mr\. Ready)/);
    const employee = employeeMatch ? employeeMatch[1] : 'AI Employee';
    
    const workflowMatch = task.name.match(/AI-Generated (.+?) -/);
    const workflowType = workflowMatch ? workflowMatch[1] : 'Unknown Workflow';

    return {
      id: task.id,
      title: task.name,
      content: task.description || 'AI-generated content available for review.',
      employee,
      workflowType,
      confidence: 0.85,
      source: 'simulation',
      generatedAt: task.createdAt
    };
  };

  const handleViewAIContent = (task: ScheduledTask) => {
    const aiDetails = extractAIDetails(task);
    if (aiDetails) {
      setSelectedAIContent(aiDetails);
    }
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onTaskDelete?.(taskId);
    }
  };

  const handleSaveEdit = (updatedTask: ScheduledTask) => {
    onTaskUpdate?.(updatedTask);
    setEditingTask(null);
  };

  const addBufferTime = (task: ScheduledTask, minutes: number) => {
    if (!task.endTime) return;
    
    const bufferTask: ScheduledTask = {
      ...task,
      id: `buffer-${task.id}-${Date.now()}`,
      name: `Buffer Time (${minutes}m)`,
      description: `Buffer time after ${task.name}`,
      estimatedMinutes: minutes,
      scheduledTime: new Date(task.endTime),
      endTime: new Date(task.endTime.getTime() + minutes * 60000),
      priority: 'Low',
      type: 'general',
      state: 'To Do'
    };

    // Add buffer task to schedule
    onTaskUpdate?.(bufferTask);
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Schedule Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
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

        {/* Buffer Settings */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={bufferSettings.showBuffers}
                onChange={(e) => setBufferSettings(prev => ({ ...prev, showBuffers: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show buffer times
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Default buffer:</label>
            <select
              value={bufferSettings.defaultBuffer}
              onChange={(e) => setBufferSettings(prev => ({ ...prev, defaultBuffer: parseInt(e.target.value) }))}
              className="px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm"
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
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
          {mergedItems.map((item, index) => {
            const isTask = 'estimatedMinutes' in item;
            const status = isTask ? getTaskStatus(item as ScheduledTask) : 'event';
            const startTime = item.scheduledTime || item.start;
            const endTime = isTask 
              ? item.endTime || new Date(startTime!.getTime() + item.estimatedMinutes * 60000)
              : item.end;
            const isAITask = isTask && isAIGeneratedTask(item as ScheduledTask);

            return (
              <React.Fragment key={item.id}>
                <div 
                  className={`timeline-item ${isTask ? 'task-item' : 'event-item'} ${
                    isTask ? getPriorityColor((item as ScheduledTask).priority) : 'border-blue-500 bg-blue-50'
                  } ${isAITask ? 'cursor-pointer hover:shadow-md' : ''}`}
                  onClick={isAITask ? () => handleViewAIContent(item as ScheduledTask) : undefined}
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
                        <span className={isAITask ? 'text-blue-600 font-medium' : ''}>
                          {item.name || item.title}
                        </span>
                        {isAITask && <Eye className="h-4 w-4 text-blue-500 ml-2" />}
                      </div>
                      {isTask && (
                        <div className="item-actions">
                          {status !== 'completed' && status !== 'overdue' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskComplete(item.id);
                              }}
                              className="action-btn complete-btn"
                              title="Mark as complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTask(item as ScheduledTask);
                            }}
                            className="action-btn edit-btn"
                            title="Edit task"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {(status === 'overdue' || status === 'current') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskReschedule(item.id);
                              }}
                              className="action-btn reschedule-btn"
                              title="Reschedule task"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(item.id);
                            }}
                            className="action-btn delete-btn"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {bufferSettings.showBuffers && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addBufferTime(item as ScheduledTask, bufferSettings.defaultBuffer);
                              }}
                              className="action-btn buffer-btn"
                              title={`Add ${bufferSettings.defaultBuffer}m buffer`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {item.description && (
                      <div className="item-description">
                        {isAITask ? 
                          `${item.description.substring(0, 100)}...` : 
                          item.description
                        }
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

                {/* Buffer Time Display */}
                {bufferSettings.showBuffers && isTask && index < mergedItems.length - 1 && (
                  (() => {
                    const nextItem = mergedItems[index + 1];
                    const currentEnd = endTime;
                    const nextStart = nextItem.scheduledTime || nextItem.start;
                    
                    if (currentEnd && nextStart) {
                      const bufferMinutes = Math.round((nextStart.getTime() - currentEnd.getTime()) / 60000);
                      
                      if (bufferMinutes > 0 && bufferMinutes <= 60) {
                        return (
                          <div className="buffer-time-display">
                            <div className="buffer-line" />
                            <div className="buffer-info">
                              <Clock className="h-3 w-3" />
                              <span>{bufferMinutes}m buffer</span>
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* AI Content Detail Modal */}
      {selectedAIContent && (
        <AIContentModal
          content={selectedAIContent}
          onClose={() => setSelectedAIContent(null)}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEdit}
          onDelete={() => {
            handleDeleteTask(editingTask.id);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

// AI Content Detail Modal
const AIContentModal: React.FC<{
  content: AIWorkflowDetails;
  onClose: () => void;
}> = ({ content, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              AI-Generated Content
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Created by {content.employee} • {content.workflowType}
            </p>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{content.title}</h4>
              <div className="flex items-center gap-2">
                {content.confidence && (
                  <div className="text-sm text-gray-600">
                    Confidence: {Math.round(content.confidence * 100)}%
                  </div>
                )}
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {content.source === 'openai' ? 'OpenAI' : 'Demo'}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-4">
              Generated on {content.generatedAt.toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-white">Generated Content:</h5>
              <button
                onClick={handleCopyContent}
                className="btn btn-sm btn-outline"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {content.content}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Task Modal
const EditTaskModal: React.FC<{
  task: ScheduledTask;
  onClose: () => void;
  onSave: (task: ScheduledTask) => void;
  onDelete: () => void;
}> = ({ task, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: task.name,
    description: task.description || '',
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes,
    deadline: task.deadline ? task.deadline.toISOString().split('T')[0] : '',
    type: task.type,
    isFlexible: task.isFlexible,
    chunkable: task.chunkable,
    scheduledTime: task.scheduledTime ? task.scheduledTime.toISOString().slice(0, 16) : ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTask: ScheduledTask = {
      ...task,
      name: formData.name,
      description: formData.description || undefined,
      priority: formData.priority,
      estimatedMinutes: formData.estimatedMinutes,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      type: formData.type,
      isFlexible: formData.isFlexible,
      chunkable: formData.chunkable,
      scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime) : task.scheduledTime,
      endTime: formData.scheduledTime ? 
        new Date(new Date(formData.scheduledTime).getTime() + formData.estimatedMinutes * 60000) : 
        task.endTime,
      updatedAt: new Date()
    };

    onSave(updatedTask);
  };

  const priorityColors = {
    'ASAP': 'border-red-500 bg-red-50',
    'High': 'border-orange-500 bg-orange-50', 
    'Medium': 'border-yellow-500 bg-yellow-50',
    'Low': 'border-green-500 bg-green-50'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Task</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-textarea"
              rows={4}
              placeholder="Add details about this task..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <select
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({...formData, estimatedMinutes: parseInt(e.target.value)})}
                className="form-select"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as ScheduledTask['priority']})}
                className={`form-select ${priorityColors[formData.priority]}`}
              >
                <option value="ASAP">ASAP</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Scheduled Time</label>
              <input
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Task Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as ScheduledTask['type']})}
              className="form-select"
            >
              <option value="general">General</option>
              <option value="marking">Marking</option>
              <option value="lesson_prep">Lesson Preparation</option>
              <option value="admin">Administrative</option>
              <option value="communication">Communication</option>
              <option value="pastoral">Pastoral Care</option>
              <option value="extracurricular">Extracurricular</option>
              <option value="professional_development">Professional Development</option>
              <option value="conference">Conference/Meeting</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.chunkable}
                onChange={(e) => setFormData({...formData, chunkable: e.target.checked})}
                className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Can be split into chunks</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFlexible}
                onChange={(e) => setFormData({...formData, isFlexible: e.target.checked})}
                className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Flexible timing</span>
            </label>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onDelete}
              className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Edit className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RealTimeScheduleView;