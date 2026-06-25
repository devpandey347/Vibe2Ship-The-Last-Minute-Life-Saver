import { Card } from './Card';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AIRecommendationCardProps {
  taskId: string;
  taskName: string;
  reasoning: string[];
  estimatedTimeLeft: string;
}

export function AIRecommendationCard({ taskId, taskName, reasoning, estimatedTimeLeft }: AIRecommendationCardProps) {
  return (
    <Card className="bg-primary-container text-on-primary-container border-none shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" />
        <h2 className="font-headline font-semibold text-lg md:text-xl">Today's AI Recommendation</h2>
      </div>
      <div className="mb-4">
        <h3 className="font-headline text-xl md:text-2xl font-bold mb-2">{taskName}</h3>
        <div className="bg-background/40 p-4 rounded-xl">
          <p className="font-body font-semibold mb-2">Why?</p>
          <ul className="list-disc list-inside font-body text-sm space-y-1">
            {reasoning.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between mt-6">
        <div className="font-body text-sm font-semibold">
          Est. work left: {estimatedTimeLeft}
        </div>
        <Link to={`/task/${taskId}`}>
          <Button variant="primary" className="bg-primary text-on-primary hover:opacity-90">
            Start Now
          </Button>
        </Link>
      </div>
    </Card>
  );
}
