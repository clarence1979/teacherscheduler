import { Task, OptimizationResult } from '../../lib/types';

export class HappinessAlgorithm {
  constructor() {}

  optimizeSchedule(tasks: Task[], events: any[] = [], startDate: Date = new Date(), daysAhead: number = 7): OptimizationResult {
    console.log('🧠 Calculating optimal schedule based on happiness factors...');
    
    // Sort tasks by priority and happiness factors
    const sortedTasks = tasks
      .filter(task => task.state !== 'Done')
      .sort((a, b) => {
        const priorityOrder = { 'ASAP': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const priorityA = priorityOrder[a.priority] || 1;
        const priorityB = priorityOrder[b.priority] || 1;
        const happinessA = a.happinessContribution || 0.5;
        const happinessB = b.happinessContribution || 0.5;
        
        return (priorityB + happinessB) - (priorityA + happinessA);
      });

    // Schedule tasks with time slots
    const scheduledTasks = this.scheduleTasksInTimeSlots(sortedTasks, startDate, daysAhead);
    const unscheduledTasks = sortedTasks.filter(task => 
      !scheduledTasks.find(scheduled => scheduled.id === task.id)
    );

    const happinessScore = this.calculateHappinessScore(scheduledTasks);
    const confidence = this.calculateConfidence(scheduledTasks, sortedTasks);

    return {
      schedule: scheduledTasks,
      happinessScore,
      confidence,
      unscheduledTasks: unscheduledTasks.map(task => task.id),
      recommendations: this.generateRecommendations(scheduledTasks, unscheduledTasks),
      warnings: this.generateWarnings(unscheduledTasks)
    };
  }

  private scheduleTasksInTimeSlots(tasks: Task[], startDate: Date, daysAhead: number): Task[] {
    const scheduledTasks: Task[] = [];
    const currentDate = new Date(startDate);

    for (const task of tasks) {
      // Find next available time slot
      const scheduledTime = this.findNextAvailableSlot(currentDate, task.estimatedMinutes);
      if (scheduledTime) {
        const endTime = new Date(scheduledTime.getTime() + task.estimatedMinutes * 60000);
        
        scheduledTasks.push({
          ...task,
          scheduledTime,
          endTime,
          happinessContribution: task.happinessContribution || 0.5
        });

        // Move current date forward
        currentDate.setTime(endTime.getTime() + 15 * 60000); // 15 min buffer
      }
    }

    return scheduledTasks;
  }

  private findNextAvailableSlot(fromDate: Date, durationMinutes: number): Date | null {
    const slot = new Date(fromDate);
    
    // Ensure we're in working hours (9 AM - 5 PM)
    if (slot.getHours() < 9) {
      slot.setHours(9, 0, 0, 0);
    } else if (slot.getHours() >= 17) {
      slot.setDate(slot.getDate() + 1);
      slot.setHours(9, 0, 0, 0);
    }

    // Skip weekends
    while (slot.getDay() === 0 || slot.getDay() === 6) {
      slot.setDate(slot.getDate() + 1);
      slot.setHours(9, 0, 0, 0);
    }

    return slot;
  }

  private calculateHappinessScore(scheduledTasks: Task[]): number {
    if (scheduledTasks.length === 0) return 0.5;
    
    const avgHappiness = scheduledTasks.reduce((sum, task) => 
      sum + (task.happinessContribution || 0.5), 0) / scheduledTasks.length;
    
    return Math.min(1, Math.max(0, avgHappiness));
  }

  private calculateConfidence(scheduledTasks: Task[], allTasks: Task[]): number {
    if (allTasks.length === 0) return 1;
    
    const schedulingRate = scheduledTasks.length / allTasks.length;
    const priorityBonus = scheduledTasks.filter(task => 
      task.priority === 'ASAP' || task.priority === 'High'
    ).length / Math.max(scheduledTasks.length, 1);

    return Math.min(1, schedulingRate * 0.7 + priorityBonus * 0.3);
  }

  private generateRecommendations(scheduledTasks: Task[], unscheduledTasks: Task[]): string[] {
    const recommendations: string[] = [];

    if (unscheduledTasks.length > 0) {
      recommendations.push(`${unscheduledTasks.length} tasks couldn't be scheduled. Consider extending work hours or reducing task load.`);
    }

    if (scheduledTasks.length > 8) {
      recommendations.push('Heavy schedule detected. Consider delegating or postponing lower priority tasks.');
    }

    const highPriorityTasks = scheduledTasks.filter(task => task.priority === 'ASAP' || task.priority === 'High');
    if (highPriorityTasks.length > 5) {
      recommendations.push('Many high-priority tasks scheduled. Ensure adequate focus time for each.');
    }

    return recommendations;
  }

  private generateWarnings(unscheduledTasks: Task[]): string[] {
    const warnings: string[] = [];

    const urgentTasks = unscheduledTasks.filter(task => task.priority === 'ASAP');
    if (urgentTasks.length > 0) {
      warnings.push(`${urgentTasks.length} urgent tasks couldn't be scheduled!`);
    }

    const overdueTasks = unscheduledTasks.filter(task => 
      task.deadline && task.deadline < new Date()
    );
    if (overdueTasks.length > 0) {
      warnings.push(`${overdueTasks.length} tasks are past their deadline.`);
    }

    return warnings;
  }

  adjustForWellBeing(schedule: Task[]) {
    return schedule.map((task, index) => ({
      ...task,
      breakAfter: index > 0 && index % 3 === 0
    }));
  }

  getHappinessScore(schedule: Task[]) {
    return this.calculateHappinessScore(schedule);
  }
}