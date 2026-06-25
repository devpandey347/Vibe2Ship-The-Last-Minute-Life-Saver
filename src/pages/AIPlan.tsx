import { useEffect, useState } from 'react';
import { Timeline } from '../components/Timeline';
import { Card } from '../components/Card';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { taskService } from '../services/taskService';
import { Button } from '../components/Button';
import type { MasterSchedule, Task } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { BrainCircuit } from 'lucide-react';

export function AIPlan() {
  const [schedule, setSchedule] = useState<MasterSchedule | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplanning, setIsReplanning] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedTasks = await taskService.getTasks();
        setTasks(fetchedTasks);
        const fetched = await scheduleService.getSchedule();
        setSchedule(fetched);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReplan = async () => {
    setIsReplanning(true);
    try {
      const newSchedule = await scheduleService.triggerReplan();
      if (newSchedule) {
        setSchedule(newSchedule);
      }
    } finally {
      setIsReplanning(false);
    }
  };

  const validTimeline = schedule?.timeline.map(day => ({
    ...day,
    tasks: day.tasks.filter(t => tasks.some(existing => existing.id === t.taskId))
  })).filter(day => day.tasks.length > 0) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-container text-primary rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Your AI Plan</h1>
            <p className="text-on-surface-variant font-body">Gemini has optimized your schedule to ensure you hit all deadlines.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleReplan} disabled={isReplanning || isLoading}>
          {isReplanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Planning schedule...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Replan
            </>
          )}
        </Button>
      </header>

      {schedule && (
        <Card className="bg-primary/5 border-primary/20 mb-6">
          <p className="font-body text-primary font-medium italic">"{schedule.summary}"</p>
        </Card>
      )}

      <Card className="pt-8 pb-8">
        {isLoading ? (
          <LoadingSkeleton className="h-64" />
        ) : validTimeline.length === 0 ? (
          <EmptyState 
            title="No schedule found"
            description="Create some tasks and then click Replan to generate your master timeline."
            icon={<BrainCircuit className="w-12 h-12 opacity-50" />}
            action={<Button onClick={handleReplan} disabled={isReplanning}>Generate Schedule</Button>}
          />
        ) : (
          <Timeline items={validTimeline} />
        )}
      </Card>
    </div>
  );
}
