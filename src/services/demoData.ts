import type { Task, MasterSchedule, EndOfDaySummary } from '../types';

export const DEMO_TASKS: Task[] = [
  {
    id: "demo_1",
    title: "Finish Hackathon Pitch Deck",
    dueDate: "2026-06-25T18:00",
    priority: "High",
    estimatedTime: "2h 30m",
    progress: 75,
    createdAt: Date.now() - 86400000,
    subtasks: [
      { id: "sub_1", name: "Outline problem and solution", completed: true },
      { id: "sub_2", name: "Design slides 1-5", completed: true },
      { id: "sub_3", name: "Design slides 6-10", completed: true },
      { id: "sub_4", name: "Record demo video", completed: false }
    ],
    reasoning: [
      "Deadline is today at 6:00 PM.",
      "Crucial for final submission."
    ]
  },
  {
    id: "demo_2",
    title: "Review Backend Code for Vulnerabilities",
    dueDate: "2026-06-26T12:00",
    priority: "High",
    estimatedTime: "1h 45m",
    progress: 0,
    createdAt: Date.now() - 40000000,
    subtasks: [
      { id: "sub_5", name: "Run static analysis", completed: false },
      { id: "sub_6", name: "Fix Firestore security rules", completed: false },
      { id: "sub_7", name: "Check environment variables", completed: false }
    ],
    reasoning: [
      "High priority system task.",
      "Must complete before deployment."
    ]
  },
  {
    id: "demo_3",
    title: "Write README Documentation",
    dueDate: "2026-06-27T10:00",
    priority: "Medium",
    estimatedTime: "1h 0m",
    progress: 50,
    createdAt: Date.now() - 10000000,
    subtasks: [
      { id: "sub_8", name: "Add installation steps", completed: true },
      { id: "sub_9", name: "Add feature list", completed: false }
    ]
  }
];

export const DEMO_SCHEDULE: MasterSchedule = {
  generatedAt: Date.now(),
  focusTaskName: "Finish Hackathon Pitch Deck",
  focusReasoning: [
    "This task is due in just a few hours.",
    "It has the highest impact on your final score."
  ],
  focusEstimatedTime: "2h 30m",
  summary: "You are in the final stretch! Knock out this pitch deck and you're golden.",
  aiConfidence: 92,
  burnoutWarning: "You've been working hard. Don't forget to take a 15-minute breather before recording your video.",
  timeline: [
    {
      id: "day_1",
      day: "Today",
      tasks: [
        { taskId: "demo_1", name: "Record demo video", completed: false },
        { taskId: "demo_2", name: "Run static analysis", completed: false }
      ]
    },
    {
      id: "day_2",
      day: "Tomorrow",
      tasks: [
        { taskId: "demo_2", name: "Fix Firestore security rules", completed: false },
        { taskId: "demo_2", name: "Check environment variables", completed: false }
      ]
    },
    {
      id: "day_3",
      day: "Saturday",
      tasks: [
        { taskId: "demo_3", name: "Add feature list", completed: false }
      ]
    }
  ]
};

export const DEMO_REFLECTION: EndOfDaySummary = {
  tasksCompleted: 4,
  remainingWork: 3,
  estimatedCompletionPercentage: 85,
  tomorrowPriority: "Review Backend Code for Vulnerabilities",
  aiRecommendation: "Incredible work today! You crushed the hardest parts of the pitch deck. Get some rest tonight so you can tackle the backend review with a fresh mind."
};
