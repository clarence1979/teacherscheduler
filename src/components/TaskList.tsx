import React, { useState } from 'react';
import { Clockimport { Clock, Calendar, Target, CreditCard as Edit2, Trash2, PlayCircle } from 'lucide-react'k } from '../../lib/types';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask, onDeleteTask }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      'ASAP': 'border-red-500 bg-red-50 text-red-700',
      'High': 'border-orange-500 bg-orange-50 text-orange-700',
      'Medium': 'border-yellow-500 bg-yellow-50 text-yellow-700',
      'Low': 'border-green-500 bg-green-50 text-green-700'
    };
    return colors[priority];
  };

  const getStatusColor = (state: Task['state']) => {
    const colors = {
      'To Do': 'bg-gray-100 text-gray-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'Done': 'bg-green-100 text-green-700'
    };
    return colors[state];
  };

  const handleStatusChange = (task: Task, newState: Task['state']) => {
    onUpdateTask({ ...task, state: newState });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveEdit = (updatedTask: Task) => {
    onUpdateTask(updatedTask);
    setEditingTask(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tasks Yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first task above to get started with AI-powered scheduling.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Task List</h3>
          <p className="card-subtitle">
            Manage your tasks - they'll be automatically optimized in your schedule
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {tasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.state)}`}>
                      {task.state}
                    </div>
                  </div>
                  
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mt-2 mb-1">
                    {task.name}
                  </h4>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(task.estimatedMinutes)}
                    </span>
                    {task.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {task.deadline.toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {task.type.replace('_', ' ')}
                    </span>
                    {task.chunkable && (
                      <span className="text-blue-600 dark:text-blue-400">Chunkable</span>
                    )}
                  </div>

                  {task.scheduledTime && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-400">
                      Scheduled: {task.scheduledTime.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-4">
                  {/* Status Change Buttons */}
                  {task.state === 'To Do' && (
                    <button
                      onClick={() => handleStatusChange(task, 'In Progress')}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tooltip"
                      data-tooltip="Start Task"
                      title="Start Task"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </button>
                  )}
                  
                  {task.state === 'In Progress' && (
                    <button
                      onClick={() => handleStatusChange(task, 'Done')}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors tooltip"
                      data-tooltip="Complete Task"
                      title="Complete Task"
                    >
                      <Target className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors tooltip"
                    data-tooltip="Edit Task"
                    title="Edit Task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tooltip"
                    data-tooltip="Delete Task"
                    title="Delete Task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

// Edit Task Modal Component
const EditTaskModal: React.FC<{
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
}> = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: task.name,
    description: task.description || '',
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes,
    deadline: task.deadline ? task.deadline.toISOString().split('T')[0] : '',
    type: task.type,
    isFlexible: task.isFlexible,
    chunkable: task.chunkable
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTask: Task = {
      ...task,
      name: formData.name,
      description: formData.description || undefined,
      priority: formData.priority,
      estimatedMinutes: formData.estimatedMinutes,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      type: formData.type,
      isFlexible: formData.isFlexible,
      chunkable: formData.chunkable,
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
              rows={3}
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
                onChange={(e) => setFormData({...formData, priority: e.target.value as Task['priority']})}
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
              <label className="form-label">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as Task['type']})}
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
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Edit2 className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskList;