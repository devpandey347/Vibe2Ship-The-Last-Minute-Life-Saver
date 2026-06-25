import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BrainCircuit, Loader2, Clock } from 'lucide-react';
import { taskService } from '../services/taskService';
import { analyzeTask } from '../services/gemini';
import TimeKeeper from 'react-timekeeper';

export function CreateTask() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !dueDate) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Let Gemini analyze the task
      const deadlineStr = `${dueDate} at ${dueTime || '11:59 PM'}`;
      const aiPlan = await analyzeTask(goal, deadlineStr);
      
      // 2. Map AI subtasks to our format
      const formattedSubtasks = aiPlan.subtasks.map(st => ({
        id: Math.random().toString(36).substring(2, 11),
        name: st.name,
        completed: false
      }));

      // 3. Save directly to Firestore
      await taskService.createTask({
        title: goal,
        dueDate: aiPlan.formattedDueDate,
        priority: aiPlan.priority,
        estimatedTime: aiPlan.estimatedTime,
        progress: 0,
        subtasks: formattedSubtasks,
        reasoning: aiPlan.reasoning,
        createdAt: Date.now()
      });
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      setIsLoading(false);
    }
  };

  const TimeKeeperComponent = (TimeKeeper as any).default || TimeKeeper;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">New Goal</h1>
        <p className="text-on-surface-variant font-body">Tell Gemini what you want to achieve, and it will break it down for you.</p>
      </div>

      <Card className="bg-surface p-8 shadow-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-error bg-error/10 p-3 rounded-xl font-body text-sm">{error}</div>}
          
          <div>
            <input 
              type="text" 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Add title"
              className="w-full bg-transparent border-b border-outline-variant text-xl md:text-2xl font-headline focus:outline-none focus:border-primary pb-2 mb-2 placeholder:text-on-surface-variant/50"
            />
          </div>
          
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-on-surface-variant mt-1.5" />
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-surface-variant text-on-surface-variant rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-body text-sm cursor-pointer"
                />
                
                <div className="relative">
                  <div 
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="bg-surface-variant text-on-surface-variant rounded px-4 py-2 font-body text-sm cursor-pointer min-w-[100px] text-center hover:opacity-80"
                  >
                    {dueTime || 'Set Time'}
                  </div>
                  
                  {showTimePicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowTimePicker(false)} />
                      <div className="absolute z-50 top-full mt-2 left-0 shadow-2xl rounded-xl overflow-hidden border border-outline-variant/30">
                        <TimeKeeperComponent
                          time={dueTime || '12:00'}
                          onChange={(newTime: any) => setDueTime(newTime.formatted24)}
                          onDoneClick={() => setShowTimePicker(false)}
                          switchToMinuteOnHourSelect
                          config={isDark ? {
                            TIME_BACKGROUND: '#1e201e',
                            CLOCK_BACKGROUND: '#282b29',
                            CLOCK_WRAPPER_BACKGROUND: '#1e201e',
                            MERIDIEM_BACKGROUND: '#1e201e',
                            MERIDIEM_TEXT_COLOR_SELECTED: '#8cc39f',
                            MERIDIEM_TEXT_COLOR_UNSELECTED: '#e4e4e4',
                            DONE_BUTTON_COLOR: '#8cc39f',
                            TIME_SELECTED_COLOR: '#8cc39f',
                            CLOCK_HAND_ARM: '#8cc39f',
                            CLOCK_HAND_CIRCLE_BACKGROUND: '#8cc39f',
                            NUMBERS_BACKGROUND: '#282b29',
                            NUMBERS_TEXT_COLOR: '#e4e4e4'
                          } : undefined}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>


            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/30">
            <Button type="submit" disabled={isLoading} className="w-full py-4 text-lg">
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing your calendar and generating an optimized schedule...</>
              ) : (
                <><BrainCircuit className="w-5 h-5 mr-2" /> Let Gemini Analyze & Plan</>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
