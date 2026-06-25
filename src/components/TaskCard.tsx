import { Card } from './Card';
import { Badge } from './Badge';

interface TaskCardProps {
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTime: string;
}

export function TaskCard({ title, dueDate, priority, estimatedTime }: TaskCardProps) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-headline font-semibold text-lg">{title}</h3>
        <Badge variant={priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'secondary'}>
          {priority}
        </Badge>
      </div>
      <div className="flex justify-between text-sm text-on-surface-variant font-body">
        <span>Due: {dueDate}</span>
        <span>Est. Work: {estimatedTime}</span>
      </div>
    </Card>
  );
}
