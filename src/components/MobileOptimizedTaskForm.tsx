import React, { useState, useEffect } from 'react';
import { Plus, Zap, Clock, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, TaskType } from '../../lib/types';
import { mobileDetection } from '../utils/mobile-detection';

interface MobileOptimizedTaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => void;
}

const MobileOptimizedTaskForm: React.FC<MobileOptimizedTaskFormProps> = ({ onAddTask }) => {
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
  const [isMobile, setIsMobile] = useState(mobileDetection.isMobile());
  const [isCompact, setIsCompact] = useState(mobileDetection.shouldUseCompactMode());

  useEffect(() => {
    const unsubscribe = mobileDetection.onChange((deviceInfo) => {
      setIsMobile(deviceInfo.isMobile);
      setIsCompact(mobileDetection.shouldUseCompactMode());
    });

    return unsubscribe;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'> = {
      name: formData.name,
      description: formData.description || undefined,
      priority: formData.priority,
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

    onAddTask(task);
    
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
  };

  const priorityColors = {
    'ASAP': 'border-red-500 bg-red-50 text-red-700',
    'High': 'border-orange-500 bg-orange-50 text-orange-700', 
    'Medium': 'border-yellow-500 bg-yellow-50 text-yellow-700',
    'Low': 'border-green-500 bg-green-50 text-green-700'
  };

  return (
    <div className={`card ${isMobile ? 'mobile-optimized' : ''}`}>
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          Add New Task
        </h3>
        {!isCompact && (
          <p className="card-subtitle">
            The AI will automatically find the optimal time to schedule your task
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card-content">
        <div className="space-y-4">
          {/* Task Name - Always visible */}
          <div>
            <input
              type="text"
              placeholder={isMobile ? "What do you need to do?" : "What do you need to do?"}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full text-lg border-0 border-b-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 py-3 px-0 bg-transparent text-gray-900 dark:text-white"
              style={{ fontSize: isMobile ? '16px' : '18px' }} // Prevent zoom on iOS
              required
            />
          </div>

          {/* Quick Settings - Stacked on mobile */}
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            <div>
              <label className="form-label flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Duration
              </label>
              <select
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({...formData, estimatedMinutes: parseInt(e.target.value)})}
                className="form-select"
                style={{ fontSize: isMobile ? '16px' : '14px' }}
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

            <div>
              <label className="form-label flex items-center gap-1">
                <Target className="h-4 w-4" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as Task['priority']})}
                className={`form-select ${priorityColors[formData.priority]}`}
                style={{ fontSize: isMobile ? '16px' : '14px' }}
              >
                <option value="ASAP">🔥 ASAP</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="form-label flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="form-input"
                style={{ fontSize: isMobile ? '16px' : '14px' }}
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
          >
            <span className="font-medium">
              {isExpanded ? 'Hide' : 'Show'} advanced options
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Advanced Options */}
          {isExpanded && (
            <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4 slide-up">
              <div>
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Add details about this task..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-textarea"
                  rows={isMobile ? 2 : 3}
                  style={{ fontSize: isMobile ? '16px' : '14px' }}
                />
              </div>

              <div>
                <label className="form-label">Task Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as TaskType})}
                  className="form-select"
                  style={{ fontSize: isMobile ? '16px' : '14px' }}
                >
                  <option value="general">📝 General</option>
                  <option value="marking">📋 Marking</option>
                  <option value="lesson_prep">📚 Lesson Preparation</option>
                  <option value="admin">📊 Administrative</option>
                  <option value="communication">💬 Communication</option>
                  <option value="pastoral">🤗 Pastoral Care</option>
                  <option value="extracurricular">🎭 Extracurricular</option>
                  <option value="professional_development">🎓 Professional Development</option>
                  <option value="conference">🤝 Conference/Meeting</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.chunkable}
                    onChange={(e) => setFormData({...formData, chunkable: e.target.checked})}
                    className="mt-1 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Can be split into chunks
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Allow AI to break this task into smaller time blocks
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFlexible}
                    onChange={(e) => setFormData({...formData, isFlexible: e.target.checked})}
                    className="mt-1 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Flexible timing
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      AI can reschedule this task as needed
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Submit Button - Full width on mobile */}
          <button
            type="submit"
            className={`${isMobile ? 'w-full' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 min-h-[44px]`}
            disabled={!formData.name.trim()}
          >
            <Plus className="h-5 w-5" />
            {isMobile ? 'Add Task' : 'Add Task & Optimize Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MobileOptimizedTaskForm;