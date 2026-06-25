import React, { useState } from "react";
import { Sparkles, Calendar, Plus, Trash2, ArrowRight, Check } from "lucide-react";
import { Task } from "../types";

interface AiAssistantProps {
  onAddTasks: (newTasks: Omit<Task, "id" | "userId" | "completed" | "createdAt">[], syncToCalendar: boolean) => Promise<void>;
  calendarConnected: boolean;
}

interface ParsedTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDateTime: string;
  selected: boolean;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ onAddTasks, calendarConnected }) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [syncToCalendar, setSyncToCalendar] = useState(calendarConnected);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setParsedTasks([]);

    try {
      const localTime = new Date().toISOString();
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, localTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process prompt");
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        setParsedTasks(
          data.tasks.map((t: any) => ({
            title: t.title || "Untitled Task",
            description: t.description || "",
            priority: t.priority || "medium",
            dueDateTime: t.dueDateTime || new Date().toISOString().substring(0, 16),
            selected: true,
          }))
        );
      } else {
        throw new Error("No tasks returned by AI scheduler. Try being more descriptive!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while communicating with Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAll = async () => {
    const selectedTasks = parsedTasks.filter((t) => t.selected);
    if (selectedTasks.length === 0) return;

    setIsLoading(true);
    try {
      // map to standard creation types
      const tasksToInsert = selectedTasks.map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDateTime: t.dueDateTime,
      }));

      await onAddTasks(tasksToInsert, syncToCalendar);
      setParsedTasks([]);
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "Failed to batch add AI scheduled tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    const updated = [...parsedTasks];
    updated[index].selected = !updated[index].selected;
    setParsedTasks(updated);
  };

  const updateField = (index: number, field: keyof ParsedTask, value: any) => {
    const updated = [...parsedTasks];
    updated[index] = { ...updated[index], [field]: value };
    setParsedTasks(updated);
  };

  const removeParsedTask = (index: number) => {
    setParsedTasks(parsedTasks.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left" id="ai-scheduler-panel">
      
      {/* Panel Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 border border-indigo-100">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            Gemini Scheduler Vibe
          </h2>
          <p className="text-xs text-slate-500">Describe your day naturally, and let Gemini coordinate your timetable</p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Prep for math exam prep tomorrow morning at 10, gym workout in evening at 6, and shopping for food on Saturday at noon.'"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white resize-y min-h-[95px] transition-all"
            disabled={isLoading}
            id="ai-prompt-input"
          />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3.5 rounded-xl flex items-start gap-2 animate-fadeIn">
            <span className="font-bold shrink-0">Error:</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            id="ai-generate-btn"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "Analyzing Vibe..." : "Schedule with Gemini"}
          </button>
        </div>
      </form>

      {/* AI Preview Section */}
      {parsedTasks.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs">
                Parsed Schedule Preview
              </h3>
              <p className="text-xs text-slate-500">Confirm or adjust extracted tasks before scheduling</p>
            </div>

            {/* Sync option */}
            {calendarConnected && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                  className="rounded border-indigo-200 bg-white text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Sync direct to Google Calendar
                </span>
              </label>
            )}
          </div>

          {/* Task Preview Cards */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {parsedTasks.map((task, idx) => (
              <div
                key={idx}
                className={`flex gap-3 bg-slate-50 border rounded-xl p-4 transition-all duration-200 ${
                  task.selected
                    ? "border-indigo-200 shadow-sm bg-indigo-50/30"
                    : "border-slate-100 opacity-60"
                }`}
              >
                {/* Select Toggle */}
                <button
                  onClick={() => toggleSelect(idx)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-1 cursor-pointer transition-all ${
                    task.selected
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "border-slate-300 hover:border-slate-400 text-transparent bg-white"
                  }`}
                  id={`ai-task-toggle-${idx}`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* Edit Fields */}
                <div className="flex-1 space-y-2 text-left">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateField(idx, "title", e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none font-bold text-sm text-slate-800 w-full pb-0.5"
                    placeholder="Task title"
                    disabled={!task.selected}
                  />

                  <textarea
                    value={task.description}
                    onChange={(e) => updateField(idx, "description", e.target.value)}
                    className="bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none text-xs text-slate-600 w-full p-1 rounded placeholder-slate-400 resize-none h-12"
                    placeholder="Task context/notes..."
                    disabled={!task.selected}
                  />

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Priority Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Priority:</span>
                      <select
                        value={task.priority}
                        onChange={(e) => updateField(idx, "priority", e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                        disabled={!task.selected}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Due DateTime Picker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Due:</span>
                      <input
                        type="datetime-local"
                        value={task.dueDateTime}
                        onChange={(e) => updateField(idx, "dueDateTime", e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                        disabled={!task.selected}
                      />
                    </div>
                  </div>
                </div>

                {/* Remove Card */}
                <button
                  onClick={() => removeParsedTask(idx)}
                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0 cursor-pointer align-top self-start mt-1"
                  title="Discard task candidate"
                  id={`ai-task-discard-${idx}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleAddAll}
              disabled={isLoading || parsedTasks.filter((t) => t.selected).length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              id="ai-add-tasks-btn"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                Schedule {parsedTasks.filter((t) => t.selected).length} Tasks
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
