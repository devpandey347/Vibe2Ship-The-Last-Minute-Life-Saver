
interface TimelineItem {
  id: string;
  day: string;
  tasks: { name: string; completed: boolean }[];
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.id} className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-outline-variant last:hidden" />
          
          <div className="flex items-center gap-4 mb-3">
            <div className="absolute left-0 w-6 h-6 rounded-full bg-primary-container border-4 border-background flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <h3 className="font-headline font-semibold text-lg">{item.day}</h3>
          </div>
          
          <div className="space-y-2">
            {item.tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  readOnly
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                />
                <span className={`font-body ${task.completed ? 'line-through text-on-surface-variant' : 'text-on-background'}`}>
                  {task.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
