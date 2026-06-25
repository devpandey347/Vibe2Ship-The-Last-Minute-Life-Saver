import type { Priority, Task, CoachAdvice, ProgressReview, EndOfDaySummary, BusySlot } from '../types';
import { DEMO_SCHEDULE, DEMO_REFLECTION } from './demoData';

export interface AIAnalysisResult {
  formattedDueDate: string;
  subtasks: { name: string }[];
  estimatedTime: string;
  priority: Priority;
  reasoning: string[];
}

export const isDemoMode = () => true;

export const analyzeTask = async (goal: string, dueDate: string): Promise<AIAnalysisResult> => {
  if (isDemoMode()) {
    return {
      formattedDueDate: "June 26, 2026, 5:00 PM",
      subtasks: [
        { name: `Research core concepts for ${goal}` },
        { name: `Draft outline and list deliverables` },
        { name: `Build the initial system prototype` },
        { name: `Refine details and perform final review of ${goal}` }
      ],
      estimatedTime: "3h 30m",
      priority: "High",
      reasoning: ["Parsed deadline implies a close delivery window.", "Requires multiple distinct creative steps."]
    };
  }

  try {
    const res = await fetch("/api/gemini/analyze-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, dueDate, localTime: new Date().toLocaleString() })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to analyze task on backend");
    }
    return await res.json();
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error(error.message || "Failed to analyze task with Gemini.");
  }
};

export const generateMasterTimeline = async (tasks: any[], busySlots: BusySlot[] = []): Promise<any> => {
  if (tasks.length === 0) {
    return {
      timeline: [],
      focusTaskName: "No tasks!",
      focusReasoning: ["You have no open tasks right now."],
      focusEstimatedTime: "0h",
      summary: "Your schedule is clear. Relax!",
      aiConfidence: 100
    };
  }

  if (isDemoMode()) {
    return { ...DEMO_SCHEDULE };
  }

  try {
    const res = await fetch("/api/gemini/master-timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks, busySlots, localTime: new Date().toLocaleString() })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to generate timeline on backend");
    }
    return await res.json();
  } catch (error: any) {
    console.error("Master Timeline Generation Failed:", error);
    throw new Error(error.message || "Failed to generate master schedule.");
  }
};

export const getCoachAdvice = async (task: Task, question: string): Promise<CoachAdvice> => {
  if (isDemoMode()) {
    return {
      hint: "Break down the first subtask into small 15-minute intervals to reduce visual resistance.",
      suggestedApproach: "Set a timer for 15 minutes. Focus strictly on starting the initial outline. Avoid editing while drafting.",
      commonMistakes: [
        "Trying to make the initial draft pristine on the first try.",
        "Overcomplicating the slide structure early in the process."
      ],
      helpfulResources: [
        "15-Minute Focus Method",
        "Iterative Drafting Techniques"
      ],
      encouragement: "You are doing great! Just taking that first step is 80% of the battle."
    };
  }

  try {
    const res = await fetch("/api/gemini/coach-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, question })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to get coach advice from backend");
    }
    return await res.json();
  } catch (error: any) {
    console.error("Coach Advice Failed:", error);
    throw new Error(error.message || "Failed to get coach advice.");
  }
};

export const evaluateProgress = async (task: Task): Promise<ProgressReview> => {
  if (isDemoMode()) {
    return {
      congratulations: "Outstanding milestone achieved! You've made significant headway.",
      productivitySummary: `You completed multiple crucial steps for "${task.title}".`,
      paceAssessment: "Your current pace is perfect. You are nicely aligned to hit your goal on schedule.",
      nextRecommendedTask: "Take a 5-minute break to clear your head, then review any remaining subtasks.",
      updatedWorkload: "The remaining workload is very manageable."
    };
  }

  try {
    const res = await fetch("/api/gemini/evaluate-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to evaluate progress on backend");
    }
    return await res.json();
  } catch (error: any) {
    console.error("Evaluate Progress Failed:", error);
    throw new Error(error.message || "Failed to evaluate progress.");
  }
};

export const generateEndOfDaySummary = async (tasks: Task[]): Promise<EndOfDaySummary> => {
  if (isDemoMode()) {
    return { ...DEMO_REFLECTION };
  }

  try {
    const res = await fetch("/api/gemini/end-of-day-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to generate summary on backend");
    }
    return await res.json();
  } catch (error: any) {
    console.error("EOD Summary Failed:", error);
    throw new Error(error.message || "Failed to generate end of day summary.");
  }
};

export const evaluateOverallProgress = async (tasks: Task[]): Promise<ProgressReview> => {
  if (isDemoMode()) {
    return {
      congratulations: "Excellent work on completing your primary goals today!",
      productivitySummary: "You successfully cleared major steps across your tasks.",
      paceAssessment: "Outstanding pacing. You managed your schedule beautifully and minimized late-stage friction.",
      nextRecommendedTask: "Rest up and recharge for tomorrow's priorities.",
      updatedWorkload: "The overall backlog is healthy and optimized."
    };
  }

  try {
    const res = await fetch("/api/gemini/evaluate-overall-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to evaluate overall progress on backend");
    }
    return await res.json();
  } catch (error: any) {
    console.error("Overall Evaluation Failed:", error);
    throw new Error(error.message || "Failed to evaluate overall progress.");
  }
};
