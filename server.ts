import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to prevent crash if key is initially missing
let aiClient: GoogleGenAI | null = null;


async function generateContentWithFallback(ai: GoogleGenAI, request: any) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
  let lastError: any;
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      return await ai.models.generateContent({
        ...request,
        model
      });
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
      const message = error?.message || '';
      if (status === 429 || status === 'RESOURCE_EXHAUSTED' || message.includes('429') || message.includes('quota')) {
        console.warn(`Model ${model} rate limit reached, switching...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// REST API routes
app.post("/api/gemini", async (req, res) => {
  const { prompt, localTime } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const ai = getAiClient();
    const systemInstruction = `You are a professional task scheduler assistant for the "Vibe2Ship" PWA app.
The user will give you a list or explanation of things they want to schedule (e.g. "meeting tomorrow at 3pm", "grocery shopping on Saturday morning").
Your task is to parse this input and generate a list of structured task items.
If the input contains relative dates like "tomorrow", "next Monday", "in 2 hours", calculate the correct absolute ISO datetime based on the user's current local time provided.
For each task, return:
1. title: A short, concise title.
2. description: A clear description or context.
3. priority: "high", "medium", or "low" based on the context of the task (e.g. urgent, health, exams are usually high; casual things are low or medium).
4. dueDateTime: A computed ISO-8601 local date-time string (e.g. "2026-06-25T15:00:00"). If a specific time isn't mentioned, default to a sensible time like 09:00:00 or 12:00:00 on that date.

You must reply with a valid JSON matching the specified schema.`;

    const userMessage = `Current user local time: ${localTime || new Date().toISOString()}
User scheduling input: "${prompt}"`;

    const response = await generateContentWithFallback(ai, {
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            tasks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  priority: { type: "STRING", enum: ["high", "medium", "low"] },
                  dueDateTime: { type: "STRING", description: "ISO 8601 formatted datetime" }
                },
                required: ["title", "description", "priority", "dueDateTime"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: error.message || "Failed to process request with Gemini AI"
    });
  }
});

// Endpoint to enhance task (AI generated priority and details)
app.post("/api/gemini/enhance", async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const ai = getAiClient();
    const systemInstruction = `You are a productivity expert assistant for the "Vibe2Ship" app.
Given a task title, your job is to:
1. Determine the logical priority level: "high", "medium", or "low" based on the task type (e.g., urgency, importance, professional vs. casual context).
2. Generate a professional, short, actionable bulleted or paragraph description (details & notes) for this task (maximum 2-3 sentences/bullet points).

You must reply with a valid JSON matching the specified schema.`;

    const response = await generateContentWithFallback(ai, {
      contents: `Task Title: "${title}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            priority: { type: "STRING", enum: ["high", "medium", "low"] },
            description: { type: "STRING", description: "Bullet points or short details for the task" }
          },
          required: ["priority", "description"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Enhance error:", error);
    return res.status(500).json({
      error: error.message || "Failed to enhance task with Gemini AI"
    });
  }
});

// Endpoint: Analyze task (break down into subtasks, priority, etc)
app.post("/api/gemini/analyze-task", async (req, res) => {
  const { goal, dueDate, localTime } = req.body;

  if (!goal) {
    return res.status(400).json({ error: "Goal is required" });
  }

  const prompt = `
You are an expert productivity assistant helping a user achieve a goal.
Current Date & Time: "${localTime || new Date().toLocaleString()}"
Goal: "${goal}"
User's Requested Deadline: "${dueDate}" (This might be natural language like "Tomorrow" or "Next Friday")

Your task is to break this down into a highly actionable plan.
You MUST output a strict JSON string matching this structure exactly (do not wrap it in markdown blocks, just raw JSON). Even if the goal is vague or impossible, you MUST return this JSON structure and make your best guess.

Required Schema:
{
  "formattedDueDate": "A string formatted like 'June 26, 2026, 5:00 PM' representing the parsed due date",
  "subtasks": [
    { "name": "Actionable task name" }
  ],
  "estimatedTime": "Estimated total time like '3h 30m'",
  "priority": "High" | "Medium" | "Low",
  "reasoning": [
    "Brief explanation or reasoning statement 1",
    "Brief explanation or reasoning statement 2"
  ]
}
`;

  try {
    const ai = getAiClient();
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    // Clean up any markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();

    const parsedData = JSON.parse(jsonString);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Analyze Task error:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze task with Gemini AI"
    });
  }
});

// Endpoint: Master Timeline Generation
app.post("/api/gemini/master-timeline", async (req, res) => {
  const { tasks, busySlots, localTime } = req.body;

  const prompt = `
You are a master productivity scheduler and AI coach.
Current Date & Time: "${localTime || new Date().toLocaleString()}"

Here are the user's current incomplete tasks:
${JSON.stringify(tasks || [])}

Here are the user's busy calendar slots (DO NOT SCHEDULE TASKS DURING THESE TIMES):
${JSON.stringify(busySlots || [])}

Your job is to analyze all tasks to create a master schedule. Detect burnout if the workload is excessive today.
You must return a STRICT JSON object matching this EXACT structure:
{
  "focusTaskName": "The title of the most critical task to focus on today",
  "focusReasoning": ["Reason 1", "Reason 2"],
  "focusEstimatedTime": "e.g. 2h",
  "summary": "A 1-sentence encouraging summary",
  "burnoutWarning": "If excessive workload detected, suggest moving a task or taking a 30m break. Otherwise leave empty or null.",
  "aiConfidence": 95,
  "timeline": [
    {
      "id": "1",
      "day": "Today",
      "tasks": [
        { "taskId": "ID", "name": "Subtask name", "completed": false }
      ]
    }
  ]
}

Rules:
1. Group subtasks into logical days (e.g., "Today", "Tomorrow").
2. Only include incomplete subtasks.
3. taskId MUST match exactly.
4. aiConfidence is a number from 0-100 indicating how confident you are they can finish this on time.
`;

  try {
    const ai = getAiClient();
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();

    const parsedData = JSON.parse(jsonString);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Master Timeline error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate timeline with Gemini AI"
    });
  }
});

// Endpoint: Coach Advice
app.post("/api/gemini/coach-advice", async (req, res) => {
  const { task, question } = req.body;

  if (!task || !question) {
    return res.status(400).json({ error: "Task and question are required" });
  }

  const prompt = `
You are an AI Productivity Coach helping a user who is stuck.
Task: "${task.title}"
Due Date: "${task.dueDate}"
Progress: ${task.progress}%
Generated Subtasks: ${JSON.stringify(task.subtasks || [])}

User says: "${question}"

Respond with STRICT JSON exactly matching this structure:
{
  "hint": "A gentle push in the right direction without giving the answer.",
  "suggestedApproach": "How to tackle this.",
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "helpfulResources": ["Resource concept 1", "Resource concept 2"],
  "encouragement": "A motivating sentence."
}
Never give direct answers or write code for them. Act as a coach.
`;

  try {
    const ai = getAiClient();
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();

    const parsedData = JSON.parse(jsonString);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Coach Advice error:", error);
    return res.status(500).json({
      error: error.message || "Failed to get coach advice from Gemini AI"
    });
  }
});

// Endpoint: Evaluate progress
app.post("/api/gemini/evaluate-progress", async (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }

  const prompt = `
You are an AI Productivity Coach. The user just finished this task:
Task: "${task.title}"
Estimated Time was: "${task.estimatedTime}"

Evaluate their progress. Respond with STRICT JSON exactly matching:
{
  "congratulations": "A warm congratulations.",
  "productivitySummary": "Summary of what they achieved.",
  "paceAssessment": "Feedback on their pace.",
  "nextRecommendedTask": "General advice on what type of task to do next.",
  "updatedWorkload": "Advice on remaining workload."
}
`;

  try {
    const ai = getAiClient();
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();

    const parsedData = JSON.parse(jsonString);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Evaluate Progress error:", error);
    return res.status(500).json({
      error: error.message || "Failed to evaluate progress with Gemini AI"
    });
  }
});

// Endpoint: End of Day Summary
app.post("/api/gemini/end-of-day-summary", async (req, res) => {
  const { tasks } = req.body;

  if (!tasks) {
    return res.status(400).json({ error: "Tasks list is required" });
  }

  const completedTasks = tasks.filter((t: any) => t.progress === 100);
  const incompleteTasks = tasks.filter((t: any) => t.progress < 100);
  const prompt = `
You are an AI Productivity Coach. It's the end of the day.
Completed today: ${JSON.stringify(completedTasks.map((t: any)=>t.title))}
Remaining open tasks: ${JSON.stringify(incompleteTasks.map((t: any)=>t.title))}

Respond with STRICT JSON exactly matching:
{
  "tasksCompleted": ${completedTasks.length},
  "remainingWork": ${incompleteTasks.length},
  "estimatedCompletionPercentage": 50,
  "tomorrowPriority": "What they should tackle first tomorrow",
  "aiRecommendation": "End of day advice."
}
`;

  try {
    const ai = getAiClient();
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();

    const parsedData = JSON.parse(jsonString);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini End of Day Summary error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate end of day summary with Gemini AI"
    });
  }
});

// Endpoint: Evaluate overall progress
app.post("/api/gemini/evaluate-overall-progress", async (req, res) => {
  const { tasks } = req.body;

  if (!tasks) {
    return res.status(400).json({ error: "Tasks list is required" });
  }

  const completed = tasks.filter((t: any) => t.progress === 100).length;
  const inProgress = tasks.filter((t: any) => t.progress > 0 && t.progress < 100).length;
  
  const prompt = `
You are an AI Productivity Coach. The user wants an evaluation of their overall progress today.
Total completed tasks: ${completed}
Tasks in progress: ${inProgress}
Total open tasks: ${tasks.length - completed}

Evaluate their overall progress. Respond with STRICT JSON exactly matching:
{
  "congratulations": "A warm greeting or congratulations.",
  "productivitySummary": "Summary of what they achieved across all tasks.",
  "paceAssessment": "Feedback on their overall pace.",
  "nextRecommendedTask": "General advice on what type of task to focus on next.",
  "updatedWorkload": "Advice on their remaining workload."
}
`;

  try {
    const ai = getAiClient();
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();

    const parsedData = JSON.parse(jsonString);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Evaluate Overall Progress error:", error);
    return res.status(500).json({
      error: error.message || "Failed to evaluate overall progress with Gemini AI"
    });
  }
});

// Helper to recursively fetch files in Google Drive folder
async function fetchAllFilesFromFolder(accessToken: string, folderId: string, currentRelativePath: string = ""): Promise<any[]> {
  const q = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=1000`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list files under folder ${folderId}: ${errText}`);
  }
  
  const data = await res.json();
  const files = data.files || [];
  
  const results: any[] = [];
  
  for (const file of files) {
    const relativeFilePath = currentRelativePath ? `${currentRelativePath}/${file.name}` : file.name;
    
    // Ignore heavy or temporary build/git folders
    if (
      relativeFilePath.includes("node_modules") ||
      relativeFilePath.includes(".git") ||
      relativeFilePath.includes("dist") ||
      relativeFilePath.includes(".next") ||
      relativeFilePath.includes(".aistudio")
    ) {
      continue;
    }
    
    if (file.mimeType === "application/vnd.google-apps.folder") {
      const subFiles = await fetchAllFilesFromFolder(accessToken, file.id, relativeFilePath);
      results.push(...subFiles);
    } else {
      results.push({
        id: file.id,
        name: file.name,
        path: relativeFilePath,
        mimeType: file.mimeType
      });
    }
  }
  
  return results;
}

// Endpoint to scan user's Google Drive for a Vibe2ship folder and list its files
app.post("/api/drive/scan", async (req, res) => {
  const { accessToken, customFolderId } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Google OAuth Access Token is required." });
  }

  try {
    let targetFolder;

    if (customFolderId) {
      // Fetch metadata for the specified folder
      const getFolderUrl = `https://www.googleapis.com/drive/v3/files/${customFolderId}?fields=id,name,mimeType`;
      const folderRes = await fetch(getFolderUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!folderRes.ok) {
        const errText = await folderRes.text();
        throw new Error(`Failed to locate the Google Drive folder with ID "${customFolderId}". Please make sure the folder is shared with your account or is public, and that you have granted full Drive access. Details: ${errText}`);
      }

      targetFolder = await folderRes.json();
      if (targetFolder.mimeType !== "application/vnd.google-apps.folder") {
        throw new Error(`The provided ID "${customFolderId}" is a file, not a folder. Please provide a Google Drive folder link or ID.`);
      }
    } else {
      // Search for folders named "Vibe2ship" or "Vibe2Ship" or "vibe2ship"
      const q = `(name = 'Vibe2ship' or name = 'Vibe2Ship' or name = 'vibe2ship') and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!searchRes.ok) {
        const errText = await searchRes.text();
        throw new Error(`Failed to query Google Drive API: ${errText}`);
      }

      const searchData = await searchRes.json();
      const folders = searchData.files || [];

      if (folders.length === 0) {
        return res.json({ folders: [], files: [], message: "No folder named 'Vibe2ship' was found in your Google Drive." });
      }

      targetFolder = folders[0];
    }

    const files = await fetchAllFilesFromFolder(accessToken, targetFolder.id);

    return res.json({
      folders: [targetFolder],
      selectedFolder: targetFolder,
      files
    });
  } catch (error: any) {
    console.error("Google Drive Scan error:", error);
    return res.status(500).json({ error: error.message || "Failed to scan Google Drive" });
  }
});

// Endpoint to recursively download and save files from Google Drive
app.post("/api/drive/import", async (req, res) => {
  const { accessToken, folderId } = req.body;
  if (!accessToken || !folderId) {
    return res.status(400).json({ error: "Access token and folder ID are required." });
  }

  try {
    // Get all files recursively
    const files = await fetchAllFilesFromFolder(accessToken, folderId);
    
    const importedPaths: string[] = [];
    
    for (const file of files) {
      const localPath = path.join(process.cwd(), file.path);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      
      // Fetch contents
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const downloadRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!downloadRes.ok) {
        throw new Error(`Failed to download file "${file.path}" (ID: ${file.id})`);
      }
      
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      fs.writeFileSync(localPath, buffer);
      importedPaths.push(file.path);
    }

    return res.json({
      success: true,
      message: `Successfully imported ${importedPaths.length} files from Google Drive!`,
      files: importedPaths
    });
  } catch (error: any) {
    console.error("Google Drive Import error:", error);
    return res.status(500).json({ error: error.message || "Failed to import files from Google Drive" });
  }
});

// Setup Vite or static files middleware
async function setupMiddlewares() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupMiddlewares().catch((err) => {
  console.error("Error setting up server middlewares:", err);
});
