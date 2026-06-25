import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';
import { Home, PlusCircle, Settings as SettingsIcon, BrainCircuit, WifiOff } from 'lucide-react';
import { cn } from '../utils/cn';

export function MainLayout() {
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Create Task', path: '/create', icon: PlusCircle },
    { name: 'AI Plan', path: '/ai-plan', icon: BrainCircuit },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      <PwaInstallPrompt />
      {/* Sidebar / Bottom Nav */}
      <nav className="md:w-64 bg-surface shadow-soft border-r border-outline-variant flex-shrink-0 z-10 md:h-screen md:sticky md:top-0 order-last md:order-first fixed bottom-0 w-full md:relative flex md:flex-col p-4 gap-2 overflow-x-auto md:overflow-y-auto">
        <div className="hidden md:block mb-8 px-4 font-headline text-xl md:text-2xl font-bold text-primary">
          Life Saver
        </div>
        <div className="flex md:flex-col w-full justify-around md:justify-start gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-body font-semibold transition-colors flex-1 md:flex-none justify-center md:justify-start",
                location.pathname === item.path
                  ? "bg-primary-container text-on-primary-container"
                  : "hover:bg-surface-variant text-on-surface"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 max-w-5xl mx-auto w-full relative">
        {isOffline && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center justify-between text-error animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">You are offline</p>
                <p className="text-xs opacity-80">Showing cached tasks. AI features are temporarily disabled.</p>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
