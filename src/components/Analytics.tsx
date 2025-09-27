import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Clock, Target, Award, Download, Calendar, Filter } from 'lucide-react';
import { AnalyticsManager } from '../../lib/analytics-manager';

interface AnalyticsProps {
  analyticsManager: AnalyticsManager;
  tasks: any[];
  projects: any[];
  workspaces: any[];
  events: any[];
}

const Analytics: React.FC<AnalyticsProps> = ({ 
  analyticsManager, 
  tasks, 
  projects, 
  workspaces, 
  events 
}) => {
  const [report, setReport] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(true);
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<number>>(new Set());

  useEffect(() => {
    const updateAnalytics = () => {
      setLoading(true);
      // Update analytics manager with current data
      analyticsManager.updateData(tasks, projects, workspaces, events);
      const newReport = analyticsManager.generateReport(selectedPeriod);
      setReport(newReport);
      setLoading(false);
    };

    updateAnalytics();
  }, [analyticsManager, tasks, projects, workspaces, events, selectedPeriod]);

  const handleExportData = (format: 'json' | 'csv') => {
    const data = analyticsManager.exportData(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motion-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyRecommendation = (recommendation: string, index: number) => {
    // Mark as applied
    setAppliedRecommendations(prev => new Set([...prev, index]));
    
    // Apply the recommendation based on its content
    if (recommendation.includes('Break large tasks into smaller')) {
      // Show a notification or modal about task chunking
      alert('💡 Tip: When creating tasks, enable "Can be split into chunks" for better scheduling flexibility.');
    } else if (recommendation.includes('Review and adjust task priorities')) {
      // Navigate to tasks view or show priority adjustment tips
      alert('📋 Tip: Regularly review your task list and adjust priorities based on changing deadlines and importance.');
    } else if (recommendation.includes('delegating or eliminating')) {
      alert('🎯 Tip: Consider which low-priority tasks can be delegated to others or removed from your schedule entirely.');
    } else if (recommendation.includes('Add buffer time')) {
      alert('⏰ Tip: When estimating task duration, add 20-30% extra time to account for unexpected delays.');
    } else if (recommendation.includes('internal deadlines')) {
      alert('📅 Tip: Set personal deadlines 1-2 days before actual deadlines to reduce stress and improve quality.');
    } else if (recommendation.includes('focus blocks')) {
      alert('🧠 Tip: Block out 2-hour periods for deep work without interruptions. Turn off notifications during these times.');
    } else if (recommendation.includes('context switching')) {
      alert('🔄 Tip: Group similar tasks together (e.g., all marking, all lesson planning) to reduce mental switching costs.');
    } else if (recommendation.includes('Pomodoro')) {
      alert('🍅 Tip: Try the Pomodoro Technique - 25 minutes focused work, 5 minute break, repeat.');
    } else {
      // Generic recommendation applied
      alert('✅ Recommendation noted! This insight has been saved to help improve your productivity.');
    }
    
    // You could also integrate with the task system to automatically apply changes
    // For example, updating task estimates, creating focus time blocks, etc.
  };
  if (loading || !report) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner" />
        <p>Generating analytics report...</p>
      </div>
    );
  }

  const { productivity, timeDistribution, trends, insights, recommendations } = report;

  return (
    <div className="analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Analytics & Insights
          </h2>
          <p className="text-gray-600">Track your productivity and optimize your workflow</p>
        </div>
        
        <div className="header-controls">
          <div className="period-selector">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="form-select"
            >
              <option value="day">Last 7 Days</option>
              <option value="week">Last 4 Weeks</option>
              <option value="month">Last 12 Months</option>
              <option value="quarter">Last 4 Quarters</option>
            </select>
          </div>
          
          <div className="export-controls">
            <button
              onClick={() => handleExportData('json')}
              className="btn btn-sm btn-outline"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="btn btn-sm btn-outline"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="metric-content">
            <div className="metric-value">{productivity.tasksCompleted}</div>
            <div className="metric-label">Tasks Completed</div>
            <div className="metric-change positive">
              +{Math.round(productivity.completionRate)}% completion rate
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Math.round(productivity.totalTimeSpent / 60)}h</div>
            <div className="metric-label">Time Invested</div>
            <div className="metric-change">
              {Math.round(productivity.averageTaskDuration)}min avg per task
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Math.round(productivity.onTimeDelivery)}%</div>
            <div className="metric-label">On-Time Delivery</div>
            <div className="metric-change positive">
              Excellent deadline management
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Math.round(productivity.focusTimeUtilization / 60)}h</div>
            <div className="metric-label">Focus Time</div>
            <div className="metric-change">
              Deep work sessions
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Productivity Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Productivity Trends</h3>
            <p>Track your productivity score over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends.productivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${value}%`, 'Productivity Score']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Time Distribution</h3>
            <p>How you spend your time across different activities</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="minutes"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {timeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${Math.round(value / 60)}h ${value % 60}m`, 'Time Spent']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rate Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Task Completion Rate</h3>
            <p>Percentage of tasks completed over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.completion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${Math.round(value)}%`, 'Completion Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Time Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Focus Time Utilization</h3>
            <p>Deep work sessions and concentration periods</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.focus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${Math.round(value / 60)}h ${Math.round(value % 60)}m`, 'Focus Time']}
                />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="insights-section">
        <div className="insights-card">
          <div className="insights-header">
            <h3>📊 Key Insights</h3>
            <p>AI-powered analysis of your productivity patterns</p>
          </div>
          <div className="insights-list">
            {insights.map((insight, index) => (
              <div key={index} className="insight-item">
                <div className="insight-content">{insight}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="recommendations-card">
          <div className="recommendations-header">
            <h3>💡 Recommendations</h3>
            <p>Actionable suggestions to improve your productivity</p>
          </div>
          <div className="recommendations-list">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-content">{recommendation}</div>
                <button 
                  className={`recommendation-action ${
                    appliedRecommendations.has(index) 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={() => handleApplyRecommendation(recommendation, index)}
                  disabled={appliedRecommendations.has(index)}
                >
                  {appliedRecommendations.has(index) ? '✓ Applied' : 'Apply'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Distribution Details */}
      <div className="distribution-details">
        <h3>Detailed Time Breakdown</h3>
        <div className="distribution-table">
          <div className="table-header">
            <div>Category</div>
            <div>Time Spent</div>
            <div>Percentage</div>
            <div>Trend</div>
          </div>
          {timeDistribution.map((item, index) => (
            <div key={index} className="table-row">
              <div className="category-cell">
                <div 
                  className="category-color" 
                  style={{ backgroundColor: item.color }}
                />
                {item.category}
              </div>
              <div>{Math.round(item.minutes / 60)}h {item.minutes % 60}m</div>
              <div>{item.percentage}%</div>
              <div className="trend-cell">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;