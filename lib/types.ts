// Core types for Motion AI Teacher Scheduler
export interface User {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  workHours: WorkHours;
  focusRules: FocusRule[];
  preferences: UserPreferences;
  createdAt: Date;
}

export interface WorkHours {
  monday: [number, number];
  tuesday: [number, number];
  wednesday: [number, number];
  thursday: [number, number];
  friday: [number, number];
  saturday?: [number, number];
  sunday?: [number, number];
}

export interface FocusRule {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string;
  days: string[]; // ['monday', 'tuesday', ...]
  protect: boolean;
}

export interface UserPreferences {
  focusTimeBlocks: number; // minutes
  bufferBetweenTasks: number; // minutes
  preferredTaskTimes: {
    'ASAP': 'morning' | 'afternoon' | 'anytime';
    'High': 'morning' | 'afternoon' | 'anytime';
    'Medium': 'morning' | 'afternoon' | 'anytime';
    'Low': 'morning' | 'afternoon' | 'anytime';
  };
  chunkingPreference: 'small' | 'medium' | 'large';
  contextSwitchTolerance: number; // 0-1
  maxTasksPerDay: number;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
  priority: 'ASAP' | 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  deadline?: Date;
  chunkable: boolean;
  minChunkMinutes: number;
  maxChunkMinutes?: number;
  dependencies: string[]; // task IDs
  state: 'To Do' | 'In Progress' | 'Done';
  type: TaskType;
  scheduledTime?: Date;
  endTime?: Date;
  isFlexible: boolean;
  score?: number;
  happinessContribution?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskType = 
  | 'marking' 
  | 'lesson_prep' 
  | 'admin' 
  | 'communication' 
  | 'pastoral' 
  | 'extracurricular' 
  | 'professional_development' 
  | 'conference'
  | 'general';

export interface Event {
  id: string;
  userId: string;
  title: string;
  start: Date;
  end: Date;
  source: 'hard_block' | 'booking' | 'external' | 'task_chunk';
  busy: boolean;
  externalId?: string;
  provider?: 'google' | 'microsoft';
}

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  duration: number; // minutes
  isAvailable: boolean;
  quality: number; // 0-1, based on energy, focus, etc.
  availability: number; // 0-1, how available this slot is
  suitability: number; // 0-1, how suitable for specific task types
  type: 'work' | 'break' | 'meeting' | 'focus';
}

export interface SchedulingWeights {
  deadline: number;
  priority: number;
  duration: number;
  userPreference: number;
  timeOptimality: number;
  workLifeBalance: number;
  contextSwitching: number;
}

export interface OptimizationResult {
  schedule: ScheduledTask[];
  happinessScore: number;
  confidence: number;
  unscheduledTasks: string[];
  recommendations: string[];
  warnings: string[];
}

export interface ScheduledTask extends Task {
  scheduledTime: Date;
  endTime: Date;
  score: number;
  happinessContribution: number;
}

export interface UserSchedule {
  workingHours: {
    monday: [number, number];
    tuesday: [number, number];
    wednesday: [number, number];
    thursday: [number, number];
    friday: [number, number];
    saturday?: [number, number];
    sunday?: [number, number];
  };
  breakTimes: Array<{
    start: string;
    end: string;
    name: string;
  }>;
  preferences: {
    focusTimeBlocks: number;
    bufferBetweenTasks: number;
    preferredTaskTimes: {
      'ASAP': 'morning' | 'afternoon' | 'anytime';
      'High': 'morning' | 'afternoon' | 'anytime';
      'Medium': 'morning' | 'afternoon' | 'anytime';
      'Low': 'morning' | 'afternoon' | 'anytime';
    };
  };
}

export interface CompletionPattern {
  taskType: string;
  averageDuration: number;
  optimalTimeOfDay: number;
  successRate: number;
  userSatisfaction: number;
}

// Workspace and Project Management Types
export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'team';
  color: string;
  members: string[];
  projects: string[];
  settings: {
    defaultSchedule: string;
    autoSchedule: boolean;
    notificationPreferences: {
      taskAssigned: boolean;
      deadlineApproaching: boolean;
      projectCompleted: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'ASAP';
  startDate: Date;
  dueDate: Date | null;
  assignee: string | null;
  tasks: string[];
  dependencies: string[];
  progress: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  workspaces: string[];
  createdAt: Date;
}

// Enhanced Task interface with dependencies
export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  workspaceId?: string;
  name: string;
  description?: string;
  priority: 'ASAP' | 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  deadline?: Date;
  chunkable: boolean;
  minChunkMinutes: number;
  maxChunkMinutes?: number;
  dependencies: string[];
  dependents?: string[];
  state: 'To Do' | 'In Progress' | 'Done';
  type: TaskType;
  scheduledTime?: Date;
  endTime?: Date;
  isFlexible: boolean;
  score?: number;
  happinessContribution?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}