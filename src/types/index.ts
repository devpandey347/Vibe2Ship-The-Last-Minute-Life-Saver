export type Priority = 'High' | 'Medium' | 'Low';

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
}

export interface Task {
  id?: string;
  title: string;
  dueDate: string;
  priority: Priority;
  estimatedTime: string;
  progress: number;
  subtasks: Subtask[];
  reasoning?: string[];
  createdAt: number;
}

export interface DaySchedule {
  id: string;
  day: string;
  tasks: {
    taskId: string;
    name: string;
    completed: boolean;
  }[];
}

export interface CoachAdvice {
  hint: string;
  suggestedApproach: string;
  commonMistakes: string[];
  helpfulResources: string[];
  encouragement: string;
}

export interface ProgressReview {
  congratulations: string;
  productivitySummary: string;
  paceAssessment: string;
  nextRecommendedTask: string;
  updatedWorkload: string;
}

export interface EndOfDaySummary {
  tasksCompleted: number;
  remainingWork: number;
  estimatedCompletionPercentage: number;
  tomorrowPriority: string;
  aiRecommendation: string;
}

export interface MasterSchedule {
  generatedAt: number;
  timeline: DaySchedule[];
  focusTaskName: string;
  focusReasoning: string[];
  focusEstimatedTime: string;
  summary: string;
  burnoutWarning?: string;
  aiConfidence: number;
  isOutdated?: boolean;
}

export interface BusySlot {
  start: string;
  end: string;
  summary: string;
}
