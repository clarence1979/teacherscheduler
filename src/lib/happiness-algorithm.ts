export class HappinessAlgorithm {
  constructor() {}

  calculateOptimalSchedule(tasks: any[], preferences: any = {}) {
    console.log('Calculating optimal schedule based on happiness factors...');
    
    // Sort by priority and happiness factors
    return tasks.sort((a, b) => {
      const priorityA = a.priority || 1;
      const priorityB = b.priority || 1;
      const happinessA = a.happinessFactor || 5;
      const happinessB = b.happinessFactor || 5;
      
      return (priorityB + happinessB) - (priorityA + happinessA);
    });
  }

  adjustForWellBeing(schedule: any[]) {
    // Limit consecutive work blocks
    return schedule.map((task, index) => ({
      ...task,
      breakAfter: index > 0 && index % 3 === 0
    }));
  }

  getHappinessScore(schedule: any[]) {
    if (!schedule.length) return 50;
    
    const avgHappiness = schedule.reduce((sum, task) => 
      sum + (task.happinessFactor || 5), 0) / schedule.length;
    
    return Math.round(avgHappiness * 20); // Scale to 0-100
  }
}