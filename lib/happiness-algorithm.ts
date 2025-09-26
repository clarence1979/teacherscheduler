export interface Task {
  id: string;
  name: string;
  estimatedMinutes: number;
  priority: 'Low' | 'Medium' | 'High' | 'ASAP';
  deadline?: Date;
  happinessContribution: number;
  isFlexible: boolean;
  chunkable: boolean;
  minChunkMinutes?: number;
  maxChunkMinutes?: number;
  dependencies: string[];
  taskType: 'marking' | 'lesson_prep' | 'admin' | 'communication' | 'pastoral' | 'extracurricular' | 'professional_development' | 'conference' | 'general';
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
  preferences: {
    focusTimeBlocks: number;
    bufferBetweenTasks: number;
    preferredTaskTimes: {
      [key in Task['priority']]: 'morning' | 'afternoon' | 'evening' | 'anytime';
    };
  };
}

export interface ScheduledTask extends Task {
  scheduledTime: Date;
  endTime: Date;
  actualMinutes?: number;
}

export interface OptimizationResult {
  scheduledTasks: ScheduledTask[];
  unscheduledTasks: Task[];
  totalHappiness: number;
  efficiency: number;
  warnings: string[];
}

export class HappinessAlgorithm {
  private userSchedule: UserSchedule;
  private existingEvents: Array<{ start: Date; end: Date; title: string }>;

  constructor(userSchedule: UserSchedule, existingEvents: Array<{ start: Date; end: Date; title: string }> = []) {
    this.userSchedule = userSchedule;
    this.existingEvents = existingEvents;
  }

  /**
   * Main optimization function that schedules tasks to maximize happiness
   */
  optimizeSchedule(tasks: Task[], startDate: Date = new Date(), daysAhead: number = 7): OptimizationResult {
    try {
      const availableSlots = this.generateAvailableTimeSlots(startDate, daysAhead);
      const sortedTasks = this.prioritizeTasks(tasks);
      const scheduledTasks: ScheduledTask[] = [];
      const unscheduledTasks: Task[] = [];
      const warnings: string[] = [];

      for (const task of sortedTasks) {
        const scheduledTask = this.scheduleTask(task, availableSlots, scheduledTasks);
        
        if (scheduledTask) {
          scheduledTasks.push(scheduledTask);
          this.removeUsedTimeSlots(availableSlots, scheduledTask);
        } else {
          unscheduledTasks.push(task);
          warnings.push(`Could not schedule task: ${task.name}`);
        }
      }

      const totalHappiness = this.calculateTotalHappiness(scheduledTasks);
      const efficiency = this.calculateEfficiency(scheduledTasks, tasks);

      return {
        scheduledTasks,
        unscheduledTasks,
        totalHappiness,
        efficiency,
        warnings
      };
    } catch (error) {
      console.error('Optimization failed:', error);
      return {
        scheduledTasks: [],
        unscheduledTasks: tasks,
        totalHappiness: 0,
        efficiency: 0,
        warnings: [`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Generate available time slots based on working hours and existing events
   */
  private generateAvailableTimeSlots(startDate: Date, daysAhead: number): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const currentDate = new Date(startDate);

    for (let day = 0; day < daysAhead; day++) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof UserSchedule['workingHours'];
      const workingHours = this.userSchedule.workingHours[dayName];

      if (workingHours) {
        const [startHour, endHour] = workingHours;
        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, 0, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, 0, 0, 0);

        // Split day into available slots, avoiding existing events
        const daySlots = this.splitDayIntoSlots(dayStart, dayEnd);
        slots.push(...daySlots);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Split a day into available time slots, avoiding existing events
   */
  private splitDayIntoSlots(dayStart: Date, dayEnd: Date): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const dayEvents = this.existingEvents.filter(event => 
      event.start.toDateString() === dayStart.toDateString()
    ).sort((a, b) => a.start.getTime() - b.start.getTime());

    let currentTime = new Date(dayStart);

    for (const event of dayEvents) {
      if (currentTime < event.start) {
        slots.push({ start: new Date(currentTime), end: new Date(event.start) });
      }
      currentTime = new Date(Math.max(currentTime.getTime(), event.end.getTime()));
    }

    if (currentTime < dayEnd) {
      slots.push({ start: new Date(currentTime), end: new Date(dayEnd) });
    }

    return slots.filter(slot => 
      (slot.end.getTime() - slot.start.getTime()) >= 15 * 60 * 1000 // At least 15 minutes
    );
  }

  /**
   * Prioritize tasks based on deadline, priority, and happiness contribution
   */
  private prioritizeTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // First, sort by deadline urgency
      if (a.deadline && b.deadline) {
        const deadlineDiff = a.deadline.getTime() - b.deadline.getTime();
        if (Math.abs(deadlineDiff) > 24 * 60 * 60 * 1000) { // More than 1 day difference
          return deadlineDiff;
        }
      } else if (a.deadline && !b.deadline) {
        return -1;
      } else if (!a.deadline && b.deadline) {
        return 1;
      }

      // Then by priority
      const priorityOrder = { 'ASAP': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by happiness contribution
      return b.happinessContribution - a.happinessContribution;
    });
  }

  /**
   * Schedule a single task in the best available time slot
   */
  private scheduleTask(
    task: Task, 
    availableSlots: Array<{ start: Date; end: Date }>, 
    scheduledTasks: ScheduledTask[]
  ): ScheduledTask | null {
    const preferredTime = this.userSchedule.preferences.preferredTaskTimes[task.priority];
    const buffer = this.userSchedule.preferences.bufferBetweenTasks;

    // Find the best slot for this task
    for (const slot of availableSlots) {
      const slotDuration = slot.end.getTime() - slot.start.getTime();
      const requiredDuration = (task.estimatedMinutes + buffer) * 60 * 1000;

      if (slotDuration >= requiredDuration) {
        const scheduledTime = new Date(slot.start);
        const endTime = new Date(scheduledTime.getTime() + task.estimatedMinutes * 60 * 1000);

        // Check if this time matches preferred time
        if (this.isPreferredTime(scheduledTime, preferredTime)) {
          return {
            ...task,
            scheduledTime,
            endTime
          };
        }
      }
    }

    // If no preferred time found, use any available slot
    for (const slot of availableSlots) {
      const slotDuration = slot.end.getTime() - slot.start.getTime();
      const requiredDuration = (task.estimatedMinutes + buffer) * 60 * 1000;

      if (slotDuration >= requiredDuration) {
        const scheduledTime = new Date(slot.start);
        const endTime = new Date(scheduledTime.getTime() + task.estimatedMinutes * 60 * 1000);

        return {
          ...task,
          scheduledTime,
          endTime
        };
      }
    }

    return null;
  }

  /**
   * Check if a time matches the preferred time of day
   */
  private isPreferredTime(time: Date, preference: 'morning' | 'afternoon' | 'evening' | 'anytime'): boolean {
    if (preference === 'anytime') return true;

    const hour = time.getHours();
    switch (preference) {
      case 'morning': return hour >= 6 && hour < 12;
      case 'afternoon': return hour >= 12 && hour < 18;
      case 'evening': return hour >= 18 && hour < 22;
      default: return true;
    }
  }

  /**
   * Remove used time slots after scheduling a task
   */
  private removeUsedTimeSlots(
    availableSlots: Array<{ start: Date; end: Date }>, 
    scheduledTask: ScheduledTask
  ): void {
    const buffer = this.userSchedule.preferences.bufferBetweenTasks * 60 * 1000;
    const taskStart = scheduledTask.scheduledTime.getTime();
    const taskEnd = scheduledTask.endTime.getTime() + buffer;

    for (let i = availableSlots.length - 1; i >= 0; i--) {
      const slot = availableSlots[i];
      const slotStart = slot.start.getTime();
      const slotEnd = slot.end.getTime();

      // If task overlaps with this slot
      if (taskStart < slotEnd && taskEnd > slotStart) {
        availableSlots.splice(i, 1);

        // Add back any remaining parts of the slot
        if (slotStart < taskStart) {
          availableSlots.push({ start: slot.start, end: new Date(taskStart) });
        }
        if (slotEnd > taskEnd) {
          availableSlots.push({ start: new Date(taskEnd), end: slot.end });
        }
      }
    }
  }

  /**
   * Calculate total happiness score for scheduled tasks
   */
  private calculateTotalHappiness(scheduledTasks: ScheduledTask[]): number {
    return scheduledTasks.reduce((total, task) => {
      let happiness = task.happinessContribution;

      // Bonus for completing high-priority tasks
      if (task.priority === 'ASAP') happiness *= 1.5;
      else if (task.priority === 'High') happiness *= 1.2;

      // Penalty for tasks scheduled far from deadline
      if (task.deadline) {
        const daysUntilDeadline = (task.deadline.getTime() - task.scheduledTime.getTime()) / (24 * 60 * 60 * 1000);
        if (daysUntilDeadline < 1) happiness *= 1.3; // Bonus for meeting tight deadlines
        else if (daysUntilDeadline > 7) happiness *= 0.8; // Penalty for early scheduling
      }

      return total + happiness;
    }, 0);
  }

  /**
   * Calculate scheduling efficiency
   */
  private calculateEfficiency(scheduledTasks: ScheduledTask[], allTasks: Task[]): number {
    if (allTasks.length === 0) return 100;
    
    const scheduledCount = scheduledTasks.length;
    const totalCount = allTasks.length;
    const schedulingRate = (scheduledCount / totalCount) * 100;

    // Factor in time utilization
    const totalScheduledTime = scheduledTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
    const totalAvailableTime = this.calculateTotalAvailableTime();
    const utilizationRate = totalAvailableTime > 0 ? (totalScheduledTime / totalAvailableTime) * 100 : 0;

    return Math.min(100, (schedulingRate * 0.7) + (utilizationRate * 0.3));
  }

  /**
   * Calculate total available time in minutes
   */
  private calculateTotalAvailableTime(): number {
    const workingDays = Object.values(this.userSchedule.workingHours);
    return workingDays.reduce((total, [start, end]) => total + (end - start) * 60, 0);
  }

  /**
   * Update user schedule preferences
   */
  updateUserSchedule(newSchedule: Partial<UserSchedule>): void {
    this.userSchedule = { ...this.userSchedule, ...newSchedule };
  }

  /**
   * Add existing events to avoid scheduling conflicts
   */
  addExistingEvents(events: Array<{ start: Date; end: Date; title: string }>): void {
    this.existingEvents.push(...events);
  }
}