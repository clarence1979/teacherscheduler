export class AIEmployeeManager {
  private employees = {
    'Ms. Planner': { specialty: 'lesson-planning', available: true },
    'Dr. Gradebook': { specialty: 'assessment', available: true },
    'Mrs. Connect': { specialty: 'parent-communication', available: true },
    'Coach Wilson': { specialty: 'classroom-management', available: true },
    'Ms. Inclusion': { specialty: 'special-education', available: true },
    'Dr. Growth': { specialty: 'professional-development', available: true },
    'Tech Wizard': { specialty: 'technology', available: true },
    'Mr. Ready': { specialty: 'substitute-planning', available: true }
  };

  private workflows: Map<string, any> = new Map();
  private listeners: Set<(workflow: any) => void> = new Set();

  constructor() {}
  
  assignTask(task: any, employeeType: string = 'Ms. Planner') {
    console.log(`🤖 Assigning task to ${employeeType}:`, task.title || task.name);
    
    return {
      ...task,
      assignedTo: employeeType,
      status: 'assigned',
      aiProcessing: true,
      estimatedCompletion: new Date(Date.now() + 30 * 60000) // 30 minutes
    };
  }

  getAllEmployees() {
    return Object.entries(this.employees).map(([name, data]) => ({
      id: name.toLowerCase().replace(/[^a-z]/g, '-'),
      name,
      role: data.specialty.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      avatar: this.getEmployeeAvatar(name),
      capabilities: [data.specialty],
      prompts: this.getEmployeePrompts(name),
      settings: {
        autoExecute: false,
        requireApproval: true,
        notifyOnCompletion: true
      },
      performance: {
        tasksCompleted: Math.floor(Math.random() * 50),
        averageRating: 4.2 + Math.random() * 0.8,
        successRate: 0.85 + Math.random() * 0.15
      },
      createdAt: new Date()
    }));
  }

  private getEmployeeAvatar(name: string): string {
    const avatars: Record<string, string> = {
      'Ms. Planner': '👩‍🏫',
      'Dr. Gradebook': '📊',
      'Mrs. Connect': '💬',
      'Coach Wilson': '🏆',
      'Ms. Inclusion': '🌟',
      'Dr. Growth': '🎓',
      'Tech Wizard': '🧙‍♂️',
      'Mr. Ready': '🎒'
    };
    return avatars[name] || '🤖';
  }

  private getEmployeePrompts(name: string): Record<string, string> {
    const prompts: Record<string, Record<string, string>> = {
      'Ms. Planner': {
        'detailed-lesson-plan': 'Create a comprehensive lesson plan for {subject} Grade {grade_level} on {topic}.',
        'unit-plan': 'Design a {duration}-week unit plan for {subject} Grade {grade_level}.',
        'differentiated-activities': 'Create differentiated activities for {topic} in {subject}.'
      },
      'Dr. Gradebook': {
        'assessment-rubric': 'Create a detailed rubric for {assignment_type} in {subject}.',
        'quiz-questions': 'Generate {number} {question_type} questions for {subject}.',
        'student-feedback': 'Write constructive feedback for a student\'s {assignment_type}.'
      },
      'Mrs. Connect': {
        'parent-email': 'Draft a professional email to parents regarding {topic}.',
        'conference-notes': 'Prepare talking points for a parent-teacher conference.',
        'behavior-report': 'Write a behavior report describing {incident}.'
      }
    };
    return prompts[name] || {};
  }

  async executeWorkflow(workflowType: string, parameters: any, employeeId: string) {
    const workflow = {
      id: `workflow_${Date.now()}`,
      employeeId,
      workflowType,
      parameters,
      status: 'queued',
      createdAt: new Date(),
      priority: parameters.priority || 'medium'
    };

    this.workflows.set(workflow.id, workflow);

    // Simulate processing
    setTimeout(() => {
      workflow.status = 'processing';
      this.notifyListeners(workflow);

      setTimeout(() => {
        workflow.status = 'completed';
        workflow.result = this.generateMockResult(workflowType, parameters);
        workflow.completedAt = new Date();
        this.notifyListeners(workflow);
      }, 2000 + Math.random() * 3000);
    }, 500);

    this.notifyListeners(workflow);
    return workflow;
  }

  private generateMockResult(workflowType: string, parameters: any) {
    return {
      source: 'simulation',
      title: `AI-Generated ${workflowType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      content: `This is a simulated response for ${workflowType} with parameters: ${JSON.stringify(parameters)}`,
      confidence: 0.85 + Math.random() * 0.15
    };
  }

  onWorkflowUpdate(callback: (workflow: any) => void) {
    this.listeners.add(callback);
  }

  offWorkflowUpdate(callback: (workflow: any) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners(workflow: any) {
    this.listeners.forEach(callback => callback(workflow));
  }

  getAvailableEmployees() {
    return Object.keys(this.employees);
  }

  processWorkflow(workflow: any) {
    console.log('🔄 Processing AI workflow:', workflow.name || workflow.type);
    
    return {
      ...workflow,
      status: 'processing',
      steps: workflow.steps?.map((step: any, index: number) => ({
        ...step,
        completed: false,
        order: index + 1
      })) || []
    };
  }

  getBestEmployeeForTask(taskType: string) {
    const mapping: { [key: string]: string } = {
      'lesson': 'Ms. Planner',
      'grade': 'Dr. Gradebook',
      'parent': 'Mrs. Connect',
      'behavior': 'Coach Wilson',
      'special': 'Ms. Inclusion',
      'development': 'Dr. Growth',
      'tech': 'Tech Wizard',
      'substitute': 'Mr. Ready'
    };
    
    return mapping[taskType] || 'Ms. Planner';
  }

  setApiKey(apiKey: string) {
    console.log('Setting API key for AI Employee Manager');
    localStorage.setItem('openai_api_key', apiKey);
  }

  hasValidApiKey(): boolean {
    const apiKey = localStorage.getItem('openai_api_key');
    return !!(apiKey && apiKey.startsWith('sk-'));
  }
}