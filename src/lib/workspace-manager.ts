export class WorkspaceManager {
  private workspaces: any[] = [];
  private currentWorkspaceId: string | null = null;

  constructor() {
    this.loadWorkspaces();
  }
  
  createWorkspace(name: string, description?: string) {
    const workspace = {
      id: `ws_${Date.now()}`,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
      members: [],
      settings: {
        autoSchedule: true,
        aiAssistance: true,
        theme: 'default'
      }
    };

    this.workspaces.push(workspace);
    this.saveWorkspaces();
    
    console.log(`📁 Created workspace: ${name}`);
    return workspace;
  }

  getWorkspaces() {
    return this.workspaces;
  }

  getCurrentWorkspace() {
    if (!this.currentWorkspaceId) {
      if (this.workspaces.length === 0) {
        const defaultWorkspace = this.createWorkspace('My Teaching Tasks', 'Default workspace for managing daily teaching activities');
        this.setCurrentWorkspace(defaultWorkspace.id);
        return defaultWorkspace;
      }
      this.currentWorkspaceId = this.workspaces[0].id;
    }

    return this.workspaces.find(ws => ws.id === this.currentWorkspaceId) || null;
  }

  setCurrentWorkspace(workspaceId: string) {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      this.currentWorkspaceId = workspaceId;
      localStorage.setItem('teacherscheduler_current_workspace', workspaceId);
      console.log(`🔄 Switched to workspace: ${workspace.name}`);
      return true;
    }
    return false;
  }

  addTaskToWorkspace(workspaceId: string, task: any) {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      const taskWithId = {
        ...task,
        id: task.id || `task_${Date.now()}`,
        workspaceId,
        createdAt: new Date().toISOString()
      };
      
      workspace.tasks.push(taskWithId);
      workspace.updatedAt = new Date().toISOString();
      
      this.saveWorkspaces();
      console.log(`➕ Added task to workspace ${workspace.name}:`, task.title || task.name);
      
      return taskWithId;
    }
    
    console.warn('Workspace not found:', workspaceId);
    return null;
  }

  removeTaskFromWorkspace(workspaceId: string, taskId: string) {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      workspace.tasks = workspace.tasks.filter((task: any) => task.id !== taskId);
      workspace.updatedAt = new Date().toISOString();
      this.saveWorkspaces();
      return true;
    }
    return false;
  }

  updateWorkspace(workspaceId: string, updates: any) {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      Object.assign(workspace, updates, {
        updatedAt: new Date().toISOString()
      });
      this.saveWorkspaces();
      return workspace;
    }
    return null;
  }

  deleteWorkspace(workspaceId: string) {
    const index = this.workspaces.findIndex(ws => ws.id === workspaceId);
    if (index !== -1) {
      const deletedWorkspace = this.workspaces.splice(index, 1)[0];
      
      if (this.currentWorkspaceId === workspaceId) {
        this.currentWorkspaceId = this.workspaces.length > 0 ? this.workspaces[0].id : null;
        localStorage.setItem('teacherscheduler_current_workspace', this.currentWorkspaceId || '');
      }
      
      this.saveWorkspaces();
      console.log(`🗑️ Deleted workspace: ${deletedWorkspace.name}`);
      return true;
    }
    return false;
  }

  getWorkspaceStats(workspaceId: string) {
    const workspace = this.workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) return null;

    const tasks = workspace.tasks || [];
    const completed = tasks.filter((task: any) => task.completed).length;
    const pending = tasks.filter((task: any) => !task.completed).length;
    const overdue = tasks.filter((task: any) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && !task.completed;
    }).length;

    return {
      totalTasks: tasks.length,
      completed,
      pending,
      overdue,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    };
  }

  private loadWorkspaces() {
    try {
      const stored = localStorage.getItem('teacherscheduler_workspaces');
      if (stored) {
        this.workspaces = JSON.parse(stored);
      }

      const currentWorkspaceId = localStorage.getItem('teacherscheduler_current_workspace');
      if (currentWorkspaceId && this.workspaces.find(ws => ws.id === currentWorkspaceId)) {
        this.currentWorkspaceId = currentWorkspaceId;
      }
    } catch (e) {
      console.warn('Failed to load workspaces from storage');
    }
  }

  private saveWorkspaces() {
    try {
      localStorage.setItem('teacherscheduler_workspaces', JSON.stringify(this.workspaces));
    } catch (e) {
      console.warn('Failed to save workspaces to storage');
    }
  }
}