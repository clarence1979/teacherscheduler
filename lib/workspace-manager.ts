// Advanced Workspace and Project Management System for Teacher Scheduler AI
import { Task, Project, Workspace, Member } from './types';

interface WorkspaceSettings {
  defaultSchedule: string;
  autoSchedule: boolean;
  notificationPreferences: {
    taskAssigned: boolean;
    deadlineApproaching: boolean;
    projectCompleted: boolean;
  };
}

interface ProjectData {
  name: string;
  description?: string;
  status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  priority?: 'Low' | 'Medium' | 'High' | 'ASAP';
  startDate?: Date;
  dueDate?: Date;
  assignee?: string;
  dependencies?: string[];
  tags?: string[];
}

export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
  private projects: Map<string, Project> = new Map();
  private members: Map<string, Member> = new Map();
  private allTasks: Map<string, Task> = new Map();

  // Create a new workspace
  createWorkspace(workspaceData: {
    name: string;
    description?: string;
    type?: 'individual' | 'team';
    color?: string;
    members?: string[];
    defaultSchedule?: string;
    autoSchedule?: boolean;
  }): Workspace {
    const workspace: Workspace = {
      id: this.generateId(),
      name: workspaceData.name,
      description: workspaceData.description || '',
      type: workspaceData.type || 'individual',
      color: workspaceData.color || '#007bff',
      members: workspaceData.members || [],
      projects: [],
      settings: {
        defaultSchedule: workspaceData.defaultSchedule || 'Work Hours',
        autoSchedule: workspaceData.autoSchedule !== false,
        notificationPreferences: {
          taskAssigned: true,
          deadlineApproaching: true,
          projectCompleted: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  // Create a project within a workspace
  createProject(projectData: ProjectData, workspaceId: string): Project {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const project: Project = {
      id: this.generateId(),
      workspaceId,
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'Planning',
      priority: projectData.priority || 'Medium',
      startDate: projectData.startDate || new Date(),
      dueDate: projectData.dueDate || null,
      assignee: projectData.assignee || null,
      tasks: [],
      dependencies: projectData.dependencies || [],
      progress: 0,
      tags: projectData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(project.id, project);
    workspace.projects.push(project.id);
    workspace.updatedAt = new Date();

    return project;
  }

  // Add task to project with dependency handling
  addTaskToProject(taskData: Partial<Task>, projectId: string): Task {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const task: Task = {
      id: this.generateId(),
      userId: 'current-user', // This would come from auth context
      projectId,
      workspaceId: project.workspaceId,
      name: taskData.name || '',
      description: taskData.description || '',
      priority: taskData.priority || 'Medium',
      estimatedMinutes: taskData.estimatedMinutes || 60,
      deadline: taskData.deadline || null,
      chunkable: taskData.chunkable !== false,
      minChunkMinutes: taskData.minChunkMinutes || 15,
      maxChunkMinutes: taskData.maxChunkMinutes || undefined,
      dependencies: taskData.dependencies || [],
      state: 'To Do',
      type: taskData.type || 'general',
      scheduledTime: null,
      endTime: null,
      isFlexible: taskData.isFlexible !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update dependency relationships
    this.updateDependencies(task);

    this.allTasks.set(task.id, task);
    project.tasks.push(task.id);
    project.updatedAt = new Date();

    return task;
  }

  private updateDependencies(task: Task): void {
    // Update dependent tasks to reference this task
    task.dependencies.forEach(depId => {
      const dependentTask = this.allTasks.get(depId);
      if (dependentTask) {
        // Add this task as a dependent of the dependency
        if (!dependentTask.dependents) {
          dependentTask.dependents = [];
        }
        if (!dependentTask.dependents.includes(task.id)) {
          dependentTask.dependents.push(task.id);
        }
      }
    });
  }

  // Calculate project progress
  calculateProjectProgress(projectId: string): number {
    const project = this.projects.get(projectId);
    if (!project || project.tasks.length === 0) return 0;

    const tasks = project.tasks.map(taskId => this.allTasks.get(taskId)).filter(Boolean);
    const completedTasks = tasks.filter(task => task!.state === 'Done');
    
    const progress = (completedTasks.length / tasks.length) * 100;
    project.progress = Math.round(progress);
    
    return project.progress;
  }

  // Get tasks that are ready to be scheduled (no incomplete dependencies)
  getSchedulableTasks(projectId: string): Task[] {
    const project = this.projects.get(projectId);
    if (!project) return [];

    return project.tasks
      .map(taskId => this.allTasks.get(taskId))
      .filter(task => task && this.canScheduleTask(task)) as Task[];
  }

  canScheduleTask(task: Task): boolean {
    if (task.state === 'Done') return false;
    
    // Check if all dependencies are completed
    return task.dependencies.every(depId => {
      const depTask = this.allTasks.get(depId);
      return depTask && depTask.state === 'Done';
    });
  }

  // Get dependency chain for visualization
  getDependencyChain(taskId: string): { task: Task; level: number }[] {
    const visited = new Set<string>();
    const chain: { task: Task; level: number }[] = [];

    const traverse = (id: string, level: number) => {
      if (visited.has(id)) return;
      visited.add(id);

      const task = this.allTasks.get(id);
      if (!task) return;

      chain.push({ task, level });

      // Traverse dependencies
      task.dependencies.forEach(depId => traverse(depId, level + 1));
    };

    traverse(taskId, 0);
    return chain.sort((a, b) => b.level - a.level); // Sort by dependency level
  }

  // Get all workspaces
  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  // Get projects in workspace
  getProjectsInWorkspace(workspaceId: string): Project[] {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return [];

    return workspace.projects
      .map(projectId => this.projects.get(projectId))
      .filter(Boolean) as Project[];
  }

  // Get tasks in project
  getTasksInProject(projectId: string): Task[] {
    const project = this.projects.get(projectId);
    if (!project) return [];

    return project.tasks
      .map(taskId => this.allTasks.get(taskId))
      .filter(Boolean) as Task[];
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Update task status and recalculate project progress
  updateTaskStatus(taskId: string, status: Task['state']): void {
    const task = this.allTasks.get(taskId);
    if (!task) return;

    task.state = status;
    task.updatedAt = new Date();

    if (status === 'Done') {
      task.completedAt = new Date();
    }

    // Recalculate project progress
    if (task.projectId) {
      this.calculateProjectProgress(task.projectId);
    }
  }

  // Get all tasks across all workspaces
  getAllTasks(): Task[] {
    return Array.from(this.allTasks.values());
  }
}