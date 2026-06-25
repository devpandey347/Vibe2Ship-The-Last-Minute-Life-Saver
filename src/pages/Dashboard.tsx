import { useEffect, useState } from 'react';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { Plus, Flame, BrainCircuit, Loader2, Award, AlertTriangle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { scheduleService } from '../services/scheduleService';
import type { Task, MasterSchedule, ProgressReview, EndOfDaySummary } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { evaluateOverallProgress, generateEndOfDaySummary } from '../services/gemini';
import { Card } from '../components/Card';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<MasterSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanError, setReplanError] = useState<string | null>(null);

  // Progress Evaluation State
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<ProgressReview | null>(null);

  // End of Day Reflection State
  const [showReflection, setShowReflection] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [reflection, setReflection] = useState<EndOfDaySummary | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedTasks = await taskService.getTasks();
        setTasks(fetchedTasks);
        
        let fetchedSchedule = await scheduleService.getSchedule();
        
        if (!fetchedSchedule && fetchedTasks.length > 0) {
          fetchedSchedule = await scheduleService.triggerReplan();
        }
        
        setSchedule(fetchedSchedule);

        // Check for End of Day Reflection
        const currentHour = new Date().getHours();
        if (currentHour >= 18 && fetchedTasks.length > 0) {
          const lastDismissed = localStorage.getItem('reflectionDismissedDate');
          const today = new Date().toLocaleDateString();
          if (lastDismissed !== today) {
            setShowReflection(true);
            triggerReflection(fetchedTasks);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const triggerEvaluation = async () => {
    setIsEvalModalOpen(true);
    setIsEvaluating(true);
    try {
      const rev = await evaluateOverallProgress(tasks);
      setEvaluation(rev);
    } catch(e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const triggerReflection = async (tasksList: Task[]) => {
    setIsGeneratingReflection(true);
    try {
      const summary = await generateEndOfDaySummary(tasksList);
      setReflection(summary);
    } catch(e) {
      console.error(e);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const dismissReflection = () => {
    localStorage.setItem('reflectionDismissedDate', new Date().toLocaleDateString());
    setShowReflection(false);
  };

  const handleManualReplan = async () => {
    setIsReplanning(true);
    setReplanError(null);
    try {
      const newSchedule = await scheduleService.triggerReplan();
      if (newSchedule) {
        setSchedule(newSchedule);
      }
    } catch (err: any) {
      setReplanError(err.message || 'Failed to replan schedule.');
    } finally {
      setIsReplanning(false);
    }
  };

  const isFocusTaskValid = schedule && tasks.some(t => t.title === schedule.focusTaskName);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2 text-primary">Good Morning Dev</h1>
          <div className="flex items-center gap-3 text-sm">
            <p className="text-on-surface-variant font-body">Here's your Daily AI Brief.</p>
            {schedule && (
              <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${schedule.isOutdated ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                {schedule.isOutdated ? <><AlertTriangle className="w-3 h-3" /> Needs replanning</> : <><Award className="w-3 h-3" /> Up to date</>}
              </span>
            )}
          </div>
        </div>
        <Button onClick={triggerEvaluation} variant="secondary" className="px-4 py-2">
          <BrainCircuit className="w-4 h-4 mr-2" /> Evaluate My Progress
        </Button>
      </header>

      {/* Outdated Banner */}
      {schedule?.isOutdated && (
        <Card className="bg-warning/10 border border-warning/30 text-on-background flex flex-col sm:flex-row justify-between items-center p-4">
          <div className="mb-4 sm:mb-0">
            <h3 className="font-bold flex items-center gap-2 text-warning"><AlertTriangle className="w-5 h-5" /> Schedule Out of Date</h3>
            <p className="text-sm font-body mt-1">Your schedule needs to be updated based on your recent task changes.</p>
            {replanError && <p className="text-sm font-bold text-error mt-2">{replanError}</p>}
          </div>
          <Button onClick={handleManualReplan} disabled={isReplanning} className="w-full sm:w-auto whitespace-nowrap">
            {isReplanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Replanning...</> : "Replan Schedule"}
          </Button>
        </Card>
      )}

      {/* Daily Brief */}
      {schedule && isFocusTaskValid && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary-container to-primary/80 text-on-primary-container shadow-lg hover:-translate-y-1 transition-transform duration-300">
            <h2 className="font-headline font-bold text-lg md:text-xl mb-2 flex items-center gap-2">
              <Flame className="w-5 h-5 text-white animate-pulse" /> Today's Focus
            </h2>
            <p className="font-headline text-2xl md:text-3xl font-bold mb-3">{schedule.focusTaskName}</p>
            <p className="font-body text-base mb-4 italic opacity-90">"{schedule.summary}"</p>
            
            <details className="bg-background/20 p-4 rounded-xl font-body text-sm cursor-pointer group">
              <summary className="font-semibold flex items-center gap-2 outline-none select-none">
                <BrainCircuit className="w-4 h-4" /> Why this task?
              </summary>
              <ul className="list-disc list-inside space-y-1 mt-3 pt-3 border-t border-white/20">
                {schedule.focusReasoning.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </details>

            <div className="mt-6 flex gap-6 font-body text-sm font-semibold">
              <span className="flex items-center gap-1 bg-background/20 px-3 py-1 rounded-full">
                <Loader2 className="w-4 h-4" /> Est. Time: {schedule.focusEstimatedTime}
              </span>
              <span className="flex items-center gap-1 bg-background/20 px-3 py-1 rounded-full">
                <Award className="w-4 h-4" /> Confidence: {schedule.aiConfidence}%
              </span>
            </div>
          </Card>
          
          <div className="space-y-4">
            <Link to={`/task/${tasks.find(t => t.title === schedule.focusTaskName)?.id || tasks[0]?.id || ''}`} className="block">
              <Button className="w-full h-full py-4 text-lg">Start Focus Task</Button>
            </Link>
            {schedule.burnoutWarning && (
              <Card className="bg-error/10 border-error/20 text-error">
                <h3 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Burnout Warning</h3>
                <p className="text-sm font-body">{schedule.burnoutWarning}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {(!schedule || !isFocusTaskValid) && tasks.length > 0 && tasks[0].id && (
        <AIRecommendationCard 
          taskId={tasks[0].id}
          taskName={tasks[0].title}
          reasoning={tasks[0].reasoning || ["Highest priority item in your list"]}
          estimatedTimeLeft={tasks[0].estimatedTime}
        />
      )}

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-headline font-semibold">Upcoming Tasks</h2>
          <Link to="/create">
            <Button variant="secondary" className="px-4 py-2 text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
             <LoadingSkeleton className="h-32" />
             <LoadingSkeleton className="h-32" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState 
            title="No tasks yet"
            description="Create your first task and let Gemini organize it for you."
            icon={<Target className="w-12 h-12 opacity-50" />}
            action={<Link to="/create"><Button>Create Task</Button></Link>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map(task => (
              <Link key={task.id} to={`/task/${task.id}`} className="block transition-all hover:scale-[1.01] active:scale-[0.99]">
                <TaskCard 
                  title={task.title}
                  dueDate={task.dueDate}
                  priority={task.priority}
                  estimatedTime={task.estimatedTime}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Progress Evaluation Modal */}
      <Modal isOpen={isEvalModalOpen} onClose={() => setIsEvalModalOpen(false)} title="AI Progress Review">
        {isEvaluating ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-body text-on-surface-variant">Gemini is evaluating your pace...</p>
          </div>
        ) : evaluation ? (
          <div className="space-y-4 font-body">
            <h3 className="text-xl md:text-2xl font-headline font-bold text-primary">{evaluation.congratulations}</h3>
            <p className="text-on-background">{evaluation.productivitySummary}</p>
            <div className="bg-surface-variant p-4 rounded-xl">
              <h4 className="font-semibold mb-1">Pace Assessment</h4>
              <p className="text-sm text-on-surface-variant">{evaluation.paceAssessment}</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
              <h4 className="font-semibold text-primary mb-1">Next Up</h4>
              <p className="text-sm text-on-background">{evaluation.nextRecommendedTask}</p>
              <p className="text-sm text-on-surface-variant mt-2 italic">{evaluation.updatedWorkload}</p>
            </div>
            <Button onClick={() => setIsEvalModalOpen(false)} className="w-full">Continue</Button>
          </div>
        ) : null}
      </Modal>

      {/* End of Day Reflection Modal */}
      <Modal isOpen={showReflection} onClose={dismissReflection} title="End of Day Reflection">
        {isGeneratingReflection ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-body text-on-surface-variant">Gemini is summarizing your day...</p>
          </div>
        ) : reflection ? (
          <div className="space-y-6 font-body">
            <div className="flex justify-around text-center mb-6">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary">{reflection.tasksCompleted}</p>
                <p className="text-sm text-on-surface-variant">Completed</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-error">{reflection.remainingWork}</p>
                <p className="text-sm text-on-surface-variant">Remaining</p>
              </div>
            </div>
            
            <div className="bg-surface-variant p-4 rounded-xl">
              <h4 className="font-semibold mb-1">Estimated Daily Completion</h4>
              <p className="text-lg font-bold">{reflection.estimatedCompletionPercentage}%</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1 text-primary flex items-center gap-2"><Award className="w-4 h-4"/> Tomorrow's Priority</h4>
              <p className="text-sm text-on-surface-variant">{reflection.tomorrowPriority}</p>
            </div>

            <div className="bg-primary/10 p-4 rounded-xl text-primary font-medium italic text-sm">
              "{reflection.aiRecommendation}"
            </div>

            <Button onClick={dismissReflection} className="w-full">Close & Rest</Button>
          </div>
        ) : null}
      </Modal>

    </div>
  );
}
