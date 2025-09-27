// Advanced Analytics and Reporting System for Teacher Scheduler AI
import { Task, Project, Workspace, Event } from './types';

interface ProductivityMetrics {
  tasksCompleted: number;
  totalTimeSpent: number;
  averageTaskDuration: number;
  completionRate: number;
  onTimeDelivery: number;
  focusTimeUtilization: number;
}

interface TimeDistribution {
  category: string;
  minutes: number;
  percentage: number;
  color: string;
}

interface TrendData {
  date: string;
  value: number;
  change: number;
}

interface AnalyticsReport {
  period: string;
  productivity: ProductivityMetrics;
  timeDistribution: TimeDistribution[];
  trends: {
    productivity: TrendData[];
    completion: TrendData[];
    focus: TrendData[];
  };
  insights: string[];
  recommendations: string[];
}

export class AnalyticsManager {
  private tasks: Task[] = [];
  private projects: Project[] = [];
  private workspaces: Workspace[] = [];
  private events: Event[] = [];

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics(): void {
    // Set up periodic analytics updates
    setInterval(() => {
      this.updateAnalytics();
    }, 5 * 60 * 1000); // Update every 5 minutes
  }

  // Update data sources
  updateData(tasks: Task[], projects: Project[], workspaces: Workspace[], events: Event[]): void {
    this.tasks = tasks;
    this.projects = projects;
    this.workspaces = workspaces;
    this.events = events;
    console.log('Analytics data updated:', { 
      tasks: tasks.length, 
      projects: projects.length, 
      workspaces: workspaces.length, 
      events: events.length 
    });
  }

  // Generate comprehensive analytics report
  generateReport(period: 'day' | 'week' | 'month' | 'quarter' = 'week'): AnalyticsReport {
    const dateRange = this.getDateRange(period);
    const filteredTasks = this.filterTasksByDateRange(dateRange);
    const filteredEvents = this.filterEventsByDateRange(dateRange);

    return {
      period,
      productivity: this.calculateProductivityMetrics(filteredTasks),
      timeDistribution: this.calculateTimeDistribution(filteredTasks, filteredEvents),
      trends: this.calculateTrends(period),
      insights: this.generateInsights(filteredTasks, filteredEvents),
      recommendations: this.generateRecommendations(filteredTasks, filteredEvents)
    };
  }

  private calculateProductivityMetrics(tasks: Task[]): ProductivityMetrics {
    console.log('Calculating productivity metrics for', tasks.length, 'tasks');
    const completedTasks = tasks.filter(task => task.state === 'Done');
    const totalTasks = tasks.length;
    
    const totalTimeSpent = completedTasks.reduce((sum, task) => {
      return sum + (task.actualMinutes || task.estimatedMinutes);
    }, 0);

    const onTimeTasks = completedTasks.filter(task => {
      if (!task.deadline || !task.completedAt) return true;
      return task.completedAt <= task.deadline;
    });

    const focusEvents = this.events.filter(event => 
      event.source === 'focus_time' || event.title.toLowerCase().includes('focus')
    );
    const totalFocusTime = focusEvents.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60);
    }, 0);

    return {
      tasksCompleted: completedTasks.length,
      totalTimeSpent,
      averageTaskDuration: completedTasks.length > 0 ? totalTimeSpent / completedTasks.length : 0,
      completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
      onTimeDelivery: completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 0,
      focusTimeUtilization: totalFocusTime
    };
  }

  private calculateTimeDistribution(tasks: Task[], events: Event[]): TimeDistribution[] {
    const categories = new Map<string, number>();
    
    console.log('Calculating time distribution for', tasks.length, 'tasks and', events.length, 'events');
    
    // Categorize completed tasks
    tasks.filter(task => task.state === 'Done').forEach(task => {
      const category = this.categorizeTask(task);
      const time = task.actualMinutes || task.estimatedMinutes || 0;
      categories.set(category, (categories.get(category) || 0) + time);
    });

    // Also include in-progress and to-do tasks for better visibility
    tasks.filter(task => task.state !== 'Done').forEach(task => {
      const category = this.categorizeTask(task);
      const time = task.estimatedMinutes || 0;
      categories.set(category + ' (Planned)', (categories.get(category + ' (Planned)') || 0) + time);
    });

    // Add events
    events.forEach(event => {
      const category = this.categorizeEvent(event);
      const time = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
      categories.set(category, (categories.get(category) || 0) + time);
    });

    const totalTime = Array.from(categories.values()).reduce((sum, time) => sum + time, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

    return Array.from(categories.entries()).map(([category, minutes], index) => ({
      category,
      minutes: Math.round(minutes),
      percentage: totalTime > 0 ? Math.round((minutes / totalTime) * 100) : 0,
      color: colors[index % colors.length]
    }));
  }

  private categorizeTask(task: Task): string {
    const typeMap: Record<string, string> = {
      'marking': 'Assessment & Grading',
      'lesson_prep': 'Lesson Planning',
      'admin': 'Administrative',
      'communication': 'Communication',
      'pastoral': 'Student Support',
      'extracurricular': 'Extracurricular',
      'professional_development': 'Professional Development',
      'conference': 'Meetings & Conferences',
      'general': 'General Tasks'
    };

    return typeMap[task.type] || 'Other';
  }

  private categorizeEvent(event: Event): string {
    if (event.source === 'booking') return 'Meetings';
    if (event.source === 'external') return 'External Events';
    if (event.title.toLowerCase().includes('focus')) return 'Focus Time';
    if (event.title.toLowerCase().includes('break')) return 'Breaks';
    return 'Other Events';
  }

  private calculateTrends(period: string): AnalyticsReport['trends'] {
    const days = period === 'day' ? 7 : period === 'week' ? 4 : 12;
    const interval = period === 'day' ? 1 : period === 'week' ? 7 : 30;

    const trends = {
      productivity: [] as TrendData[],
      completion: [] as TrendData[],
      focus: [] as TrendData[]
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * interval));
      const dateStr = date.toISOString().split('T')[0];

      // Calculate metrics for this period
      const periodTasks = this.tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= date && taskDate < new Date(date.getTime() + interval * 24 * 60 * 60 * 1000);
      });

      const completedTasks = periodTasks.filter(task => task.state === 'Done');
      const productivityScore = this.calculateProductivityScore(periodTasks);
      const completionRate = periodTasks.length > 0 ? (completedTasks.length / periodTasks.length) * 100 : 0;
      const focusTime = this.calculateFocusTime(date, interval);

      trends.productivity.push({
        date: dateStr,
        value: productivityScore,
        change: i === days - 1 ? 0 : productivityScore - (trends.productivity[i - 1]?.value || 0)
      });

      trends.completion.push({
        date: dateStr,
        value: completionRate,
        change: i === days - 1 ? 0 : completionRate - (trends.completion[i - 1]?.value || 0)
      });

      trends.focus.push({
        date: dateStr,
        value: focusTime,
        change: i === days - 1 ? 0 : focusTime - (trends.focus[i - 1]?.value || 0)
      });
    }

    return trends;
  }

  private calculateProductivityScore(tasks: Task[]): number {
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(task => task.state === 'Done');
    const highPriorityCompleted = completedTasks.filter(task => 
      task.priority === 'ASAP' || task.priority === 'High'
    ).length;
    const onTimeCompleted = completedTasks.filter(task => {
      if (!task.deadline || !task.completedAt) return true;
      return task.completedAt <= task.deadline;
    }).length;

    const completionRate = completedTasks.length / tasks.length;
    const priorityBonus = highPriorityCompleted / Math.max(completedTasks.length, 1);
    const timelinessBonus = onTimeCompleted / Math.max(completedTasks.length, 1);

    return Math.round((completionRate * 0.5 + priorityBonus * 0.3 + timelinessBonus * 0.2) * 100);
  }

  private calculateFocusTime(date: Date, intervalDays: number): number {
    const endDate = new Date(date.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const focusEvents = this.events.filter(event => 
      event.start >= date && 
      event.start < endDate && 
      (event.source === 'focus_time' || event.title.toLowerCase().includes('focus'))
    );

    return focusEvents.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60);
    }, 0);
  }

  private generateInsights(tasks: Task[], events: Event[]): string[] {
    const insights: string[] = [];
    const completedTasks = tasks.filter(task => task.state === 'Done');
    const metrics = this.calculateProductivityMetrics(tasks);

    // Productivity insights
    if (metrics.completionRate > 80) {
      insights.push('🎯 Excellent task completion rate! You\'re staying on top of your workload.');
    } else if (metrics.completionRate < 50) {
      insights.push('⚠️ Task completion rate is below average. Consider reviewing your task load and priorities.');
    }

    // Time management insights
    if (metrics.onTimeDelivery > 90) {
      insights.push('⏰ Outstanding deadline management! You consistently deliver on time.');
    } else if (metrics.onTimeDelivery < 70) {
      insights.push('📅 Consider building more buffer time into your schedule to improve deadline adherence.');
    }

    // Focus time insights
    if (metrics.focusTimeUtilization > 120) {
      insights.push('🧠 Great focus time utilization! Deep work sessions are boosting your productivity.');
    } else if (metrics.focusTimeUtilization < 60) {
      insights.push('💡 Try scheduling more dedicated focus time blocks for complex tasks.');
    }

    // Task type insights
    const taskTypes = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantType = Object.entries(taskTypes).sort(([,a], [,b]) => b - a)[0];
    if (dominantType && dominantType[1] > tasks.length * 0.4) {
      insights.push(`📊 ${this.categorizeTask({ type: dominantType[0] } as Task)} tasks dominate your schedule. Consider balancing with other activities.`);
    }

    return insights;
  }

  private generateRecommendations(tasks: Task[], events: Event[]): string[] {
    const recommendations: string[] = [];
    const metrics = this.calculateProductivityMetrics(tasks);

    // Completion rate recommendations
    if (metrics.completionRate < 70) {
      recommendations.push('Break large tasks into smaller, manageable chunks');
      recommendations.push('Review and adjust task priorities regularly');
      recommendations.push('Consider delegating or eliminating low-priority tasks');
    }

    // Time management recommendations
    if (metrics.onTimeDelivery < 80) {
      recommendations.push('Add buffer time to task estimates');
      recommendations.push('Set internal deadlines before actual deadlines');
      recommendations.push('Use time-blocking for better schedule adherence');
    }

    // Focus time recommendations
    if (metrics.focusTimeUtilization < 90) {
      recommendations.push('Schedule 2-hour focus blocks for deep work');
      recommendations.push('Minimize context switching between different task types');
      recommendations.push('Use the Pomodoro technique for sustained concentration');
    }

    // Workload recommendations
    const avgTaskDuration = metrics.averageTaskDuration;
    if (avgTaskDuration > 120) {
      recommendations.push('Consider breaking tasks longer than 2 hours into smaller parts');
    } else if (avgTaskDuration < 30) {
      recommendations.push('Batch similar small tasks together for efficiency');
    }

    return recommendations;
  }

  // Utility methods
  private getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
    }

    return { start, end };
  }

  private filterTasksByDateRange(dateRange: { start: Date; end: Date }): Task[] {
    const filtered = this.tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const isInRange = taskDate >= dateRange.start && taskDate <= dateRange.end;
      return isInRange;
    });
    console.log(`Filtered ${filtered.length} tasks from ${this.tasks.length} total for period ${dateRange.start.toDateString()} to ${dateRange.end.toDateString()}`);
    return filtered;
  }

  private filterEventsByDateRange(dateRange: { start: Date; end: Date }): Event[] {
    return this.events.filter(event => {
      return event.start >= dateRange.start && event.start <= dateRange.end;
    });
  }

  private updateAnalytics(): void {
    // Periodic analytics updates would go here
    // This could include data aggregation, trend calculation, etc.
  }

  // Export data for external analysis
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      tasks: this.tasks,
      projects: this.projects,
      workspaces: this.workspaces,
      events: this.events,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for tasks
      const csvHeaders = 'ID,Name,Type,Priority,Status,Created,Completed,Duration\n';
      const csvRows = this.tasks.map(task => 
        `${task.id},"${task.name}",${task.type},${task.priority},${task.state},${task.createdAt.toISOString()},${task.completedAt?.toISOString() || ''},${task.estimatedMinutes}`
      ).join('\n');
      
      return csvHeaders + csvRows;
    }
  }
}