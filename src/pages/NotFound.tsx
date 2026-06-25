import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in duration-500">
      <EmptyState 
        title="Page Not Found"
        description="The page you are looking for doesn't exist or has been moved."
        action={
          <Link to="/">
            <Button>Go to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
