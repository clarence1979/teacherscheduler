// Real-time optimization engine for Teacher Scheduler AI
// Handles dynamic rescheduling when tasks are completed, missed, or interrupted

import { Task, Event, OptimizationResult } from './types';
import { HappinessAlgorithm } from './happiness-algorithm';

interface Disruption {
  type: 'task_completed' | 'task_missed' | 'urgent_task' | 'meeting_added' | 'task_overrun';
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface OptimizationListener {
  (newSchedule: OptimizationResult): void;
}

export class RealTimeOptimizer {
  private algorithm: HappinessAlgorithm;
  private optimizationQueue: Disruption[] = [];
  private isOptimizing: boolean = false;
  private listeners: Set<OptimizationListener> = new Set();
  private currentTasks: Task[] = [];
  private currentEvents: Event[] = [];

  constructor(happinessAlgorithm: HappinessAlgorithm) {
    this.algorithm = happinessAlgorithm;
  }

  // Subscribe to schedule changes
  onScheduleChange(callback: OptimizationListener): void {
    this.listeners.add(callback);
  }

  // Unsubscribe from schedule changes
  offScheduleChange(callback: OptimizationListener): void {
    this.listeners.delete(callback);
  }

  // Notify all listeners of schedule updates
  private notifyListeners(newSchedule: OptimizationResult): void {
    this.listeners.forEach(callback => callback(newSchedule));
  }

  // Update current state
  updateState(tasks: Task[], events: Event[]): void {
    this.currentTasks = tasks;
    this.currentEvents = events;
  }

  // Handle various types of disruptions
  async handleDisruption(type: Disruption['type'], data: any, priority: Disruption['priority'] = 'medium'): Promise<void> {
    const disruption: Disruption = {
      type,
      data,
      timestamp: new Date(),
      priority
    };

    // Insert based on priority
    this.insertByPriority(disruption);
    
    if (!this.isOptimizing) {
      await this.processOptimizations();
    }
  }

  private insertByPriority(disruption: Disruption): void {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const insertIndex = this.optimizationQueue.findIndex(
      item => priorityOrder[item.priority] > priorityOrder[disruption.priority]
    );
    
    if (insertIndex === -1) {
      this.optimizationQueue.push(disruption);
    } else {
      this.optimizationQueue.splice(insertIndex, 0, disruption);
    }
  }

  private async processOptimizations(): Promise<void> {
    this.isOptimizing = true;

    while (this.optimizationQueue.length > 0) {
      const disruption = this.optimizationQueue.shift()!;
      
      try {
        const newSchedule = await this.handleSpecificDisruption(disruption);
        
        if (newSchedule) {
          this.notifyListeners(newSchedule);
          
          // Small delay to prevent overwhelming the UI
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Optimization error:', error);
      }
    }

    this.isOptimizing = false;
  }

  private async handleSpecificDisruption(disruption: Disruption): Promise<OptimizationResult | null> {
    switch (disruption.type) {
      case 'task_completed':
        return this.handleTaskCompletion(disruption.data);
      case 'task_missed':
        return this.handleMissedTask(disruption.data);
      case 'urgent_task':
        return this.handleUrgentTask(disruption.data);
      case 'meeting_added':
        return this.handleNewMeeting(disruption.data);
      case 'task_overrun':
        return this.handleTaskOverrun(disruption.data);
      default:
        return null;
    }
  }

  private handleTaskCompletion(completedTask: Task): OptimizationResult {
    // Remove completed task and re-optimize remaining schedule
    const remainingTasks = this.currentTasks.filter(
      task => task.id !== completedTask.id && task.state !== 'Done'
    );
    
    // Update current state
    this.currentTasks = remainingTasks;
    
    return this.algorithm.optimizeSchedule(remainingTasks, this.currentEvents);
  }

  private handleMissedTask(missedTask: Task): OptimizationResult {
    // Escalate priority and reschedule
    const updatedTask: Task = {
      ...missedTask,
      priority: this.escalatePriority(missedTask.priority),
      scheduledTime: undefined, // Clear previous scheduling
      updatedAt: new Date()
    };

    const allTasks = this.currentTasks.map(task => 
      task.id === missedTask.id ? updatedTask : task
    );

    this.currentTasks = allTasks;
    return this.algorithm.optimizeSchedule(allTasks, this.currentEvents);
  }

  private handleUrgentTask(newTask: Task): OptimizationResult {
    // Insert urgent task with highest priority
    const urgentTask: Task = {
      ...newTask,
      priority: 'ASAP',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const allTasks = [...this.currentTasks, urgentTask];
    this.currentTasks = allTasks;
    
    return this.algorithm.optimizeSchedule(allTasks, this.currentEvents);
  }

  private handleNewMeeting(newEvent: Event): OptimizationResult {
    // Add new event and reschedule around it
    const allEvents = [...this.currentEvents, newEvent];
    this.currentEvents = allEvents;
    
    return this.algorithm.optimizeSchedule(this.currentTasks, allEvents);
  }

  private handleTaskOverrun(overrunData: { taskId: string; additionalMinutes: number }): OptimizationResult {
    // Extend task duration and reschedule
    const updatedTasks = this.currentTasks.map(task => {
      if (task.id === overrunData.taskId) {
        return {
          ...task,
          estimatedMinutes: task.estimatedMinutes + overrunData.additionalMinutes,
          updatedAt: new Date()
        };
      }
      return task;
    });

    this.currentTasks = updatedTasks;
    return this.algorithm.optimizeSchedule(updatedTasks, this.currentEvents);
  }

  private escalatePriority(currentPriority: Task['priority']): Task['priority'] {
    const escalation: Record<Task['priority'], Task['priority']> = {
      'Low': 'Medium',
      'Medium': 'High',
      'High': 'ASAP',
      'ASAP': 'ASAP'
    };
    return escalation[currentPriority] || 'High';
  }

  // Get current optimization status
  getOptimizationStatus(): { isOptimizing: boolean; queueLength: number } {
    return {
      isOptimizing: this.isOptimizing,
      queueLength: this.optimizationQueue.length
    };
  }

  // Clear optimization queue (emergency stop)
  clearQueue(): void {
    this.optimizationQueue = [];
    this.isOptimizing = false;
  }
}