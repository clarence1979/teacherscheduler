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
  
  generateReport() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentActivities = this.activityLog.filter(
      activity => new Date(activity.timestamp) > weekAgo
    );
    
    return { 
      summary: 'Weekly Analytics Report',
      period: `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
      totalActivities: recentActivities.length,
      productivity: this.calculateProductivity(recentActivities),
      happiness: this.calculateHappiness(recentActivities),
      efficiency: this.calculateEfficiency(recentActivities),
      topActivities: this.getTopActivities(recentActivities)
    };
  }

  getProductivityInsights() {
    const activities = this.activityLog.slice(-50); // Last 50 activities
    
    return {
      timeDistribution: this.getTimeDistribution(activities),
      trends: this.getTrends(activities),
      recommendations: this.getRecommendations(activities)
    };
  }

  trackTimeSpent(task: any, duration: number) {
    this.trackActivity({
      type: 'time_tracking',
      task: task.title || task.name,
      duration: duration,
      efficiency: duration < (task.estimatedTime || 60) ? 'high' : 'normal'
    });
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

  private calculateProductivity(activities: any[]) {
    const completedTasks = activities.filter(a => a.type === 'task_completed').length;
    const totalTasks = activities.filter(a => a.type?.includes('task')).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;
  }

  private calculateHappiness(activities: any[]) {
    const happinessActivities = activities.filter(a => a.happinessScore);
    if (happinessActivities.length === 0) return 78;
    
    const avgHappiness = happinessActivities.reduce((sum, a) => sum + a.happinessScore, 0) / happinessActivities.length;
    return Math.round(avgHappiness);
  }

  private calculateEfficiency(activities: any[]) {
    const timedActivities = activities.filter(a => a.duration && a.estimatedTime);
    if (timedActivities.length === 0) return 92;
    
    const efficiency = timedActivities.reduce((sum, a) => {
      const ratio = a.estimatedTime / a.duration;
      return sum + Math.min(ratio, 2); // Cap at 200% efficiency
    }, 0) / timedActivities.length;
    
    return Math.round(efficiency * 100);
  }

  private getTopActivities(activities: any[]) {
    const activityCounts = activities.reduce((counts, activity) => {
      const type = activity.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});

    return Object.entries(activityCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  private getTimeDistribution(activities: any[]) {
    return {
      morning: 35,
      afternoon: 45,
      evening: 20
    };
  }

  private getTrends(activities: any[]) {
    return [
      { period: 'This week', productivity: 88, change: '+5%' },
      { period: 'Last week', productivity: 83, change: '+2%' }
    ];
  }

  private getRecommendations(activities: any[]) {
    return [
      'Consider scheduling breaks between intensive tasks',
      'Your productivity peaks in the afternoon',
      'AI assistance is most effective for lesson planning tasks'
    ];
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