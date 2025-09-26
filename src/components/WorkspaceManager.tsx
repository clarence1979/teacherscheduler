import React, { useState, useEffect } from 'react';
import { Plus, Folder, Users, Settings, MoreVertical, Calendar, Target, Clock } from 'lucide-react';
import { Workspace, Project, Task } from '../../lib/types';
import { WorkspaceManager as WorkspaceManagerClass } from '../../lib/workspace-manager';

interface WorkspaceManagerProps {
  workspaceManager: WorkspaceManagerClass;
  onWorkspaceChange: (workspaceId: string) => void;
  onTasksUpdate: (tasks: Task[]) => void;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  workspaceManager,
  onWorkspaceChange,
  onTasksUpdate
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    const allWorkspaces = workspaceManager.getAllWorkspaces();
    setWorkspaces(allWorkspaces);
    
    if (allWorkspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(allWorkspaces[0].id);
      onWorkspaceChange(allWorkspaces[0].id);
    }
  }, [workspaceManager, selectedWorkspace, onWorkspaceChange]);

  useEffect(() => {
    if (selectedWorkspace) {
      const workspaceProjects = workspaceManager.getProjectsInWorkspace(selectedWorkspace);
      setProjects(workspaceProjects);
      
      // Update tasks for the selected workspace
      const allTasks = workspaceProjects.flatMap(project => 
        workspaceManager.getTasksInProject(project.id)
      );
      onTasksUpdate(allTasks);
    }
  }, [selectedWorkspace, workspaceManager, onTasksUpdate]);

  const handleCreateWorkspace = (workspaceData: {
    name: string;
    description: string;
    type: 'individual' | 'team';
    color: string;
  }) => {
    const newWorkspace = workspaceManager.createWorkspace(workspaceData);
    setWorkspaces(prev => [...prev, newWorkspace]);
    setSelectedWorkspace(newWorkspace.id);
    setShowCreateWorkspace(false);
  };

  const handleCreateProject = (projectData: {
    name: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'ASAP';
    dueDate?: Date;
  }) => {
    if (!selectedWorkspace) return;
    
    const newProject = workspaceManager.createProject(projectData, selectedWorkspace);
    setProjects(prev => [...prev, newProject]);
    setShowCreateProject(false);
  };

  const getProjectProgress = (project: Project): number => {
    return workspaceManager.calculateProjectProgress(project.id);
  };

  const getProjectTaskCount = (project: Project): { total: number; completed: number } => {
    const tasks = workspaceManager.getTasksInProject(project.id);
    const completed = tasks.filter(task => task.state === 'Done').length;
    return { total: tasks.length, completed };
  };

  const selectedWorkspaceData = workspaces.find(w => w.id === selectedWorkspace);

  return (
    <div className="workspace-manager">
      {/* Workspace Selector */}
      <div className="workspace-header">
        <div className="workspace-selector">
          <select
            value={selectedWorkspace || ''}
            onChange={(e) => {
              setSelectedWorkspace(e.target.value);
              onWorkspaceChange(e.target.value);
            }}
            className="workspace-select"
          >
            {workspaces.map(workspace => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.type === 'team' ? '👥' : '👤'} {workspace.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateWorkspace(true)}
            className="btn btn-sm btn-outline"
            title="Create Workspace"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {selectedWorkspaceData && (
          <div className="workspace-info">
            <div className="workspace-stats">
              <span className="stat">
                <Folder className="h-4 w-4" />
                {projects.length} projects
              </span>
              <span className="stat">
                <Target className="h-4 w-4" />
                {projects.reduce((sum, p) => sum + workspaceManager.getTasksInProject(p.id).length, 0)} tasks
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      <div className="projects-section">
        <div className="section-header">
          <h3>Projects</h3>
          <button
            onClick={() => setShowCreateProject(true)}
            className="btn btn-sm btn-primary"
            disabled={!selectedWorkspace}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        <div className="projects-grid">
          {projects.map(project => {
            const progress = getProjectProgress(project);
            const taskCount = getProjectTaskCount(project);
            
            return (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <div className="project-title">
                    <h4>{project.name}</h4>
                    <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                      {project.priority}
                    </span>
                  </div>
                  <button className="project-menu">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}

                <div className="project-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="project-stats">
                  <div className="stat">
                    <Target className="h-4 w-4" />
                    <span>{taskCount.completed}/{taskCount.total} tasks</span>
                  </div>
                  <div className="stat">
                    <Calendar className="h-4 w-4" />
                    <span className={`status-${project.status.toLowerCase().replace(' ', '-')}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.dueDate && (
                    <div className="stat">
                      <Clock className="h-4 w-4" />
                      <span>Due {project.dueDate.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {projects.length === 0 && selectedWorkspace && (
            <div className="empty-projects">
              <Folder className="h-12 w-12 text-gray-400" />
              <h4>No projects yet</h4>
              <p>Create your first project to get started</p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onCreate={handleCreateWorkspace}
        />
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
};

// Create Workspace Modal
const CreateWorkspaceModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'individual' as 'individual' | 'team',
    color: '#007bff'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Workspace</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Workspace Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Teaching, Personal, Client Work"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What is this workspace for?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'individual' | 'team'})}
            >
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({...formData, color})}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Project Modal
const CreateProjectModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'ASAP',
    dueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Project</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Year 10 Science Unit, Parent Interviews"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="ASAP">ASAP</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceManager;