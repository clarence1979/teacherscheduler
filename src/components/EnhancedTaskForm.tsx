import React, { useState } from 'react';
import { Plus, Zap, Clock, Calendar, Target, AlertTriangle } from 'lucide-react';
import { Task, TaskType } from '../../lib/types';

interface EnhancedTaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => void;
  onAddUrgent: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => void;
}

const EnhancedTaskForm: React.FC<EnhancedTaskFormProps> = ({ onAddTask, onAddUrgent }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedMinutes: 60,
    priority: 'Medium' as Task['priority'],
    deadline: '',
    type: 'general' as TaskType,
    isFlexible: true,
    chunkable: true
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, isUrgent = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'> = {
      name: formData.name,
      description: formData.description || undefined,
      priority: isUrgent ? 'ASAP' : formData.priority,
      estimatedMinutes: formData.estimatedMinutes,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      type: formData.type,
      chunkable: formData.chunkable,
      minChunkMinutes: 15,
      maxChunkMinutes: formData.chunkable ? Math.floor(formData.estimatedMinutes / 2) : undefined,
      dependencies: [],
      isFlexible: formData.isFlexible,
      projectId: undefined
    };

    try {
      if (isUrgent) {
        await onAddUrgent(task);
      } else {
        await onAddTask(task);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        estimatedMinutes: 60,
        priority: 'Medium',
        deadline: '',
        type: 'general',
        isFlexible: true,
        chunkable: true
      });
      setIsExpanded(false);
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors = {
    'ASAP': 'border-red-500 bg-red-50 text-red-700',
    'High': 'border-orange-500 bg-orange-50 text-orange-700', 
    'Medium': 'border-yellow-500 bg-yellow-50 text-yellow-700',
    'Low': 'border-green-500 bg-green-50 text-green-700'
  };

  const getDurationSuggestion = (name: string): number => {
    const suggestions: Record<string, number> = {
      'email': 15,
      'call': 30,
      'meeting': 60,
      'review': 45,
      'planning': 90,
      'marking': 120,
      'lesson': 60
    };

    const lowerName = name.toLowerCase();
    for (const [keyword, duration] of Object.entries(suggestions)) {
      if (lowerName.includes(keyword)) {
        return duration;
      }
    }
    return 60;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      estimatedMinutes: name ? getDurationSuggestion(name) : 60
    }));
  };

  return (
    <div className="enhanced-task-form">
      <div className="form-header">
        <h3 className="form-title">
          <Plus className="h-5 w-5 text-blue-600" />
          Add New Task
        </h3>
        <p className="form-subtitle">
          AI will automatically find the optimal time to schedule your task
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="form-content">
          {/* Task Name */}
          <div className="form-group">
            <input
              type="text"
              placeholder="What do you need to do?"
              value={formData.name}
              onChange={handleNameChange}
              className="task-name-input"
              required
            />
          </div>

          {/* Quick Settings Row */}
          <div className="quick-settings">
            <div className="setting-group">
              <label className="setting-label">
                <Clock className="h-4 w-4" />
                Duration
              </label>
              <select
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({...formData, estimatedMinutes: parseInt(e.target.value)})}
                className="setting-select"
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

            <div className="setting-group">
              <label className="setting-label">
                <Target className="h-4 w-4" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as Task['priority']})}
                className={`setting-select priority-select ${priorityColors[formData.priority]}`}
              >
                <option value="ASAP">ASAP</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <Calendar className="h-4 w-4" />
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="setting-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="advanced-toggle"
          >
            {isExpanded ? 'Hide' : 'Show'} advanced options
            <svg 
              className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Advanced Options */}
          {isExpanded && (
            <div className="advanced-options">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Add details about this task..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as TaskType})}
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

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.chunkable}
                    onChange={(e) => setFormData({...formData, chunkable: e.target.checked})}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Can be split into chunks</span>
                  <span className="checkbox-help">Allow AI to break this task into smaller time blocks</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isFlexible}
                    onChange={(e) => setFormData({...formData, isFlexible: e.target.checked})}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Flexible timing</span>
                  <span className="checkbox-help">AI can reschedule this task as needed</span>
                </label>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
            
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting || !formData.name}
              className="btn btn-urgent"
            >
              <Zap className="h-4 w-4" />
              Add Urgent
            </button>
          </div>

          {/* AI Suggestions */}
          {formData.name && (
            <div className="ai-suggestions">
              <div className="suggestion-header">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span>AI Suggestions</span>
              </div>
              <div className="suggestions-list">
                <div className="suggestion">
                  Estimated duration: {formData.estimatedMinutes} minutes
                </div>
                {formData.deadline && (
                  <div className="suggestion">
                    {new Date(formData.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000) 
                      ? 'Consider increasing priority - deadline is soon'
                      : 'Good timeline for completion'
                    }
                  </div>
                )}
                {formData.chunkable && formData.estimatedMinutes > 90 && (
                  <div className="suggestion">
                    This task can be split into {Math.ceil(formData.estimatedMinutes / 45)} chunks of ~45 minutes each
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnhancedTaskForm;