// Database service layer for Teacher Scheduler AI
import { supabase, isSupabaseAvailable } from './supabase';
import type { Database } from './supabase';
import { Task, Project, Workspace, Event } from './types';

type Tables = Database['public']['Tables'];
type TaskRow = Tables['tasks']['Row'];
type WorkspaceRow = Tables['workspaces']['Row'];
type ProjectRow = Tables['projects']['Row'];

export class DatabaseService {
  // Check if database is available
  isAvailable(): boolean {
    return isSupabaseAvailable();
  }

  // User Profile Management
  async createProfile(userId: string, email: string, fullName?: string) {
    if (!this.isAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProfile(userId: string) {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Database profile fetch error:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Tables['profiles']['Update']>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Workspace Management
  async createWorkspace(userId: string, workspaceData: Omit<Tables['workspaces']['Insert'], 'user_id'>) {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        ...workspaceData,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapWorkspaceFromDB(data);
  }

  async getWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapWorkspaceFromDB);
  }

  async updateWorkspace(workspaceId: string, updates: Tables['workspaces']['Update']) {
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    return this.mapWorkspaceFromDB(data);
  }

  async deleteWorkspace(workspaceId: string) {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) throw error;
  }

  // Project Management
  async createProject(userId: string, workspaceId: string, projectData: Omit<Tables['projects']['Insert'], 'user_id' | 'workspace_id'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        user_id: userId,
        workspace_id: workspaceId
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapProjectFromDB(data);
  }

  async getProjects(userId: string, workspaceId?: string): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapProjectFromDB);
  }

  async updateProject(projectId: string, updates: Tables['projects']['Update']) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return this.mapProjectFromDB(data);
  }

  // Task Management
  async createTask(userId: string, taskData: Omit<Tables['tasks']['Insert'], 'user_id'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskFromDB(data);
  }

  async getTasks(userId: string, filters?: {
    projectId?: string;
    workspaceId?: string;
    state?: string;
  }): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.workspaceId) {
      query = query.eq('workspace_id', filters.workspaceId);
    }
    if (filters?.state) {
      query = query.eq('state', filters.state);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapTaskFromDB);
  }

  async updateTask(taskId: string, updates: Tables['tasks']['Update']): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskFromDB(data);
  }

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  // Event Management
  async createEvent(userId: string, eventData: Omit<Tables['events']['Insert'], 'user_id'>) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapEventFromDB(data);
  }

  async getEvents(userId: string, startDate?: Date, endDate?: Date): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('end_time', endDate.toISOString());
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;
    return data.map(this.mapEventFromDB);
  }

  // AI Workflow Management
  async createAIWorkflow(userId: string, workflowData: {
    employee_id: string;
    workflow_type: string;
    parameters: any;
    priority?: string;
  }) {
    const { data, error } = await supabase
      .from('ai_workflows')
      .insert({
        ...workflowData,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAIWorkflow(workflowId: string, updates: {
    status?: string;
    result?: any;
    error_message?: string;
    completed_at?: string;
  }) {
    const { data, error } = await supabase
      .from('ai_workflows')
      .update(updates)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAIWorkflows(userId: string) {
    const { data, error } = await supabase
      .from('ai_workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  subscribeToTasks(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('tasks')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  subscribeToProjects(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('projects')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  subscribeToWorkspaces(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('workspaces')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workspaces',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  // Mapping functions to convert DB rows to application types
  private mapTaskFromDB(dbTask: TaskRow): Task {
    return {
      id: dbTask.id,
      userId: dbTask.user_id,
      projectId: dbTask.project_id || undefined,
      workspaceId: dbTask.workspace_id || undefined,
      name: dbTask.name,
      description: dbTask.description || undefined,
      priority: dbTask.priority as Task['priority'],
      estimatedMinutes: dbTask.estimated_minutes,
      actualMinutes: dbTask.actual_minutes || undefined,
      deadline: dbTask.deadline ? new Date(dbTask.deadline) : undefined,
      scheduledTime: dbTask.scheduled_time ? new Date(dbTask.scheduled_time) : undefined,
      endTime: dbTask.end_time ? new Date(dbTask.end_time) : undefined,
      state: dbTask.state as Task['state'],
      type: dbTask.task_type as Task['type'],
      isFlexible: dbTask.is_flexible,
      chunkable: dbTask.chunkable,
      minChunkMinutes: dbTask.min_chunk_minutes,
      maxChunkMinutes: dbTask.max_chunk_minutes || undefined,
      dependencies: dbTask.dependencies,
      happinessContribution: dbTask.happiness_contribution,
      completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at)
    };
  }

  private mapWorkspaceFromDB(dbWorkspace: WorkspaceRow): Workspace {
    return {
      id: dbWorkspace.id,
      name: dbWorkspace.name,
      description: dbWorkspace.description,
      type: dbWorkspace.type as 'individual' | 'team',
      color: dbWorkspace.color,
      members: [], // TODO: Implement members relationship
      projects: [], // TODO: Load projects separately
      settings: dbWorkspace.settings,
      createdAt: new Date(dbWorkspace.created_at),
      updatedAt: new Date(dbWorkspace.updated_at)
    };
  }

  private mapProjectFromDB(dbProject: ProjectRow): Project {
    return {
      id: dbProject.id,
      workspaceId: dbProject.workspace_id,
      name: dbProject.name,
      description: dbProject.description,
      status: dbProject.status as Project['status'],
      priority: dbProject.priority as Project['priority'],
      startDate: new Date(dbProject.start_date),
      dueDate: dbProject.due_date ? new Date(dbProject.due_date) : null,
      assignee: null, // TODO: Implement assignee relationship
      tasks: [], // TODO: Load tasks separately
      dependencies: [], // TODO: Implement project dependencies
      progress: dbProject.progress,
      tags: dbProject.tags,
      createdAt: new Date(dbProject.created_at),
      updatedAt: new Date(dbProject.updated_at)
    };
  }

  private mapEventFromDB(dbEvent: any): Event {
    return {
      id: dbEvent.id,
      userId: dbEvent.user_id,
      title: dbEvent.title,
      start: new Date(dbEvent.start_time),
      end: new Date(dbEvent.end_time),
      source: dbEvent.source,
      busy: dbEvent.busy,
      externalId: dbEvent.external_id || undefined,
      provider: dbEvent.provider || undefined
    };
  }
}

export const db = new DatabaseService();