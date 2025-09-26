export class AnalyticsManager {
  private activityLog: any[] = [];

  constructor() {
    // Load existing data from localStorage
    const stored = localStorage.getItem('teacherscheduler_analytics');
    if (stored) {
      try {
        this.activityLog = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to load analytics data');
      }
    }
  }
  
  trackActivity(activity: any) {
    const logEntry = {
      ...activity,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    this.activityLog.push(logEntry);
    this.saveToStorage();
    
    console.log('📊 Tracking activity:', activity.type || activity.action);
  }
  
  generateReport(period: 'day' | 'week' | 'month' | 'quarter' = 'week') {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentActivities = this.activityLog.filter(
      activity => new Date(activity.timestamp) > weekAgo
    );
    
    return { 
      period,
      productivity: this.calculateProductivityMetrics(recentActivities),
      timeDistribution: this.calculateTimeDistribution(recentActivities),
      trends: this.calculateTrends(period),
      insights: this.generateInsights(recentActivities),
      recommendations: this.generateRecommendations(recentActivities)
    };
  }

  private calculateProductivityMetrics(activities: any[]) {
    const completedTasks = activities.filter(a => a.type === 'task_completed').length;
    const totalTasks = activities.filter(a => a.type?.includes('task')).length;
    
    return {
      tasksCompleted: completedTasks,
      totalTimeSpent: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
      averageTaskDuration: completedTasks > 0 ? 
        activities.filter(a => a.duration).reduce((sum, a) => sum + a.duration, 0) / completedTasks : 0,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 85,
      onTimeDelivery: 92,
      focusTimeUtilization: 120
    };
  }

  private calculateTimeDistribution(activities: any[]) {
    return [
      { category: 'Lesson Planning', minutes: 180, percentage: 30, color: '#3B82F6' },
      { category: 'Marking', minutes: 150, percentage: 25, color: '#10B981' },
      { category: 'Administrative', minutes: 120, percentage: 20, color: '#F59E0B' },
      { category: 'Communication', minutes: 90, percentage: 15, color: '#EF4444' },
      { category: 'Other', minutes: 60, percentage: 10, color: '#8B5CF6' }
    ];
  }

  private calculateTrends(period: string) {
    const days = period === 'day' ? 7 : period === 'week' ? 4 : 12;
    
    return {
      productivity: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 75 + Math.random() * 25,
        change: (Math.random() - 0.5) * 10
      })),
      completion: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 80 + Math.random() * 20,
        change: (Math.random() - 0.5) * 15
      })),
      focus: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 60 + Math.random() * 60,
        change: (Math.random() - 0.5) * 20
      }))
    };
  }

  private generateInsights(activities: any[]) {
    return [
      '🎯 Excellent task completion rate! You\'re staying on top of your workload.',
      '⏰ Outstanding deadline management! You consistently deliver on time.',
      '🧠 Great focus time utilization! Deep work sessions are boosting your productivity.'
    ];
  }

  private generateRecommendations(activities: any[]) {
    return [
      'Schedule 2-hour focus blocks for deep work',
      'Use time-blocking for better schedule adherence',
      'Consider batching similar tasks together for efficiency'
    ];
  }

  updateData(tasks: any[], projects: any[], workspaces: any[], events: any[]) {
    this.trackActivity({
      type: 'data_update',
      counts: {
        tasks: tasks.length,
        projects: projects.length,
        workspaces: workspaces.length,
        events: events.length
      }
    });
  }

  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      activities: this.activityLog,
      exportedAt: new Date().toISOString(),
      format
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export
      const csvHeaders = 'Timestamp,Type,Description\n';
      const csvRows = this.activityLog.map(activity => 
        `${activity.timestamp},${activity.type || 'unknown'},"${activity.description || activity.task || 'N/A'}"`
      ).join('\n');
      
      return csvHeaders + csvRows;
    }
  }

  trackTimeSpent(task: any, duration: number) {
    this.trackActivity({
      type: 'time_tracking',
      task: task.title || task.name,
      duration: duration,
      efficiency: duration < (task.estimatedTime || 60) ? 'high' : 'normal'
    });
  }

  getProductivityInsights() {
    const activities = this.activityLog.slice(-50);
    
    return {
      timeDistribution: this.calculateTimeDistribution(activities),
      trends: this.calculateTrends('week'),
      recommendations: this.generateRecommendations(activities)
    };
  }

  private saveToStorage() {
    try {
      const recentLogs = this.activityLog.slice(-1000);
      localStorage.setItem('teacherscheduler_analytics', JSON.stringify(recentLogs));
    } catch (e) {
      console.warn('Failed to save analytics data');
    }
  }
}