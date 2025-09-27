import React, { useState } from 'react';
import { Plus, Calendar, Clock, AlertTriangle, Target } from 'lucide-react';
import { Task, TaskType } from '../../lib/types';

interface TaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'state'>) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
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
    'ASAP': 'border-red-500 bg-red-50',
    'High': 'border-orange-500 bg-orange-50', 
    'Medium': 'border-yellow-500 bg-yellow-50',
    'Low': 'border-green-500 bg-green-50'
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          Add New Task
        </h3>
        <p className="card-subtitle">
          The AI will automatically find the optimal time to schedule your task
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-content">
        <div className="space-y-4">
          {/* Task Name */}
          <div>
            <input
              type="text"
              placeholder="What do you need to do?"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="task-name-input w-full text-lg border-0 border-b-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 py-3 px-0"
              required
            />
          </div>

          {/* Quick Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Duration
              </label>
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

            <div>
              <label className="form-label flex items-center gap-1">
                <Target className="h-4 w-4" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as Task['priority']})}
                className={`form-select ${priorityColors[formData.priority]}`}
              >
                <option value="ASAP">ASAP</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
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
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            {isExpanded ? 'Hide' : 'Show'} advanced options
            <svg 
              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Advanced Options */}
          {isExpanded && (
            <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4 slide-up">
              <div>
                <label className="form-label">
                  Description
                </label>
                <textarea
                  placeholder="Add details about this task..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div>
                <label className="form-label">
                  Task Type
                </label>
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
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Task & Optimize Schedule
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;