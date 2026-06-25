import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { taskService } from '../services/taskService';
import type { Task, CoachAdvice, ProgressReview } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Trash2, LifeBuoy, Loader2, Sparkles } from 'lucide-react';
import { Modal } from '../components/Modal';
import { getCoachAdvice, evaluateProgress } from '../services/gemini';

export function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stuck Modal State
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);
  const [stuckQuestion, setStuckQuestion] = useState('');
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [advice, setAdvice] = useState<CoachAdvice | null>(null);

  // Progress Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isGettingReview, setIsGettingReview] = useState(false);
  const [review, setReview] = useState<ProgressReview | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      if (!id) return;
      try {
        const fetchedTask = await taskService.getTask(id);
        setTask(fetchedTask);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTask();
  }, [id]);

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task || !task.id) return;
    
    const currentSubtasks = task.subtasks || [];
    const newSubtasks = currentSubtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    const completedCount = newSubtasks.filter(st => st.completed).length;
    const newProgress = newSubtasks.length > 0 
      ? Math.round((completedCount / newSubtasks.length) * 100) 
      : 0;
    
    const updatedTask = { ...task, subtasks: newSubtasks, progress: newProgress };
    setTask(updatedTask); // Optimistic update
    
    await taskService.updateTask(task.id, {
      subtasks: newSubtasks,
      progress: newProgress
    });

    // Feature 2 Trigger: 100% Completion
    if (newProgress === 100 && task.progress !== 100) {
      triggerProgressReview(updatedTask);
    }
  };

  const triggerProgressReview = async (completedTask: Task) => {
    setIsReviewModalOpen(true);
    setIsGettingReview(true);
    try {
      const rev = await evaluateProgress(completedTask);
      setReview(rev);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGettingReview(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!task?.id) return;
    setIsDeleteModalOpen(false);
    await taskService.deleteTask(task.id);
    navigate('/');
  };

  const handleGetAdvice = async () => {
    if (!task || !stuckQuestion) return;
    setIsGettingAdvice(true);
    try {
      const adv = await getCoachAdvice(task, stuckQuestion);
      setAdvice(adv);
    } catch(e) {
      console.error(e);
    } finally {
      setIsGettingAdvice(false);
    }
  };

  if (isLoading) return <LoadingSkeleton className="h-64" />;
  if (!task) return <div className="text-center p-8">Task not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-headline font-bold">{task.title}</h1>
            <Badge variant={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'secondary'}>
              {task.priority} Priority
            </Badge>
          </div>
          <p className="text-on-surface-variant font-body">Due: {task.dueDate}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="px-3 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" onClick={() => setIsStuckModalOpen(true)}>
            <LifeBuoy className="w-5 h-5 mr-2" /> I'm Stuck
          </Button>
          <Button variant="secondary" className="px-3 py-2 text-error border-error/50 hover:bg-error/10 hover:shadow-md transition-all active:scale-95" onClick={handleDelete} aria-label="Delete Task">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label font-semibold">Progress</span>
            <span className="font-label">{task.progress}%</span>
          </div>
          <ProgressBar progress={task.progress} />
        </div>

        <h3 className="font-headline font-semibold text-lg mb-4">Subtasks</h3>
        <ul className="space-y-3 font-body">
          {(task.subtasks || []).map(st => (
            <li key={st.id} className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={st.completed} 
                onChange={() => handleToggleSubtask(st.id)}
                className="w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer" 
              />
              <span className={st.completed ? "line-through text-on-surface-variant" : "text-on-background"}>
                {st.name}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Stuck Modal */}
      <Modal isOpen={isStuckModalOpen} onClose={() => { setIsStuckModalOpen(false); setAdvice(null); setStuckQuestion(''); }} title="AI Coach: Get Unstuck">
        {!advice ? (
          <div className="space-y-4">
            <p className="font-body text-sm text-on-surface-variant">Explain what you're struggling with. Gemini will provide hints and guidance without giving away the answer.</p>
            <textarea 
              value={stuckQuestion}
              onChange={(e) => setStuckQuestion(e.target.value)}
              className="w-full bg-surface-variant text-on-surface-variant border border-outline-variant rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary font-body text-sm h-32"
              placeholder="e.g. I don't know how to start the database schema..."
            />
            <Button onClick={handleGetAdvice} disabled={isGettingAdvice || !stuckQuestion} className="w-full">
              {isGettingAdvice ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Ask Coach
            </Button>
          </div>
        ) : (
          <div className="space-y-4 font-body">
            <div className="bg-primary/10 p-4 rounded-xl text-primary font-medium italic">
              "{advice.encouragement}"
            </div>
            <div>
              <h4 className="font-semibold mb-1">Hint</h4>
              <p className="text-sm text-on-surface-variant">{advice.hint}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Suggested Approach</h4>
              <p className="text-sm text-on-surface-variant">{advice.suggestedApproach}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1 text-error">Common Mistakes</h4>
                <ul className="list-disc list-inside text-sm text-on-surface-variant">
                  {advice.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-primary">Resources</h4>
                <ul className="list-disc list-inside text-sm text-on-surface-variant">
                  {advice.helpfulResources.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
            <Button onClick={() => setAdvice(null)} variant="secondary" className="w-full mt-2">Ask Another Question</Button>
          </div>
        )}
      </Modal>

      {/* Progress Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Task Completed!">
        {isGettingReview ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-body text-on-surface-variant">Gemini is analyzing your progress...</p>
          </div>
        ) : review ? (
          <div className="space-y-4 font-body">
            <h3 className="text-xl md:text-2xl font-headline font-bold text-primary">{review.congratulations}</h3>
            <p className="text-on-background">{review.productivitySummary}</p>
            <div className="bg-surface-variant p-4 rounded-xl">
              <h4 className="font-semibold mb-1">Pace Assessment</h4>
              <p className="text-sm text-on-surface-variant">{review.paceAssessment}</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
              <h4 className="font-semibold text-primary mb-1">Next Up</h4>
              <p className="text-sm text-on-background">{review.nextRecommendedTask}</p>
              <p className="text-sm text-on-surface-variant mt-2 italic">{review.updatedWorkload}</p>
            </div>
            <Button onClick={() => setIsReviewModalOpen(false)} className="w-full">Continue</Button>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Task">
        <div className="space-y-4 font-body text-center p-4">
          <p className="text-on-background text-lg font-semibold">Are you sure you want to delete this task?</p>
          <p className="text-sm text-on-surface-variant">This action is permanent and cannot be undone.</p>
          <div className="flex gap-3 justify-center pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2">
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-error text-white hover:bg-error/90 hover:opacity-90 px-6 py-2">
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
