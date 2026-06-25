import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Settings as SettingsIcon, PlayCircle, Loader2 } from 'lucide-react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { calendarService } from '../services/calendarService';

export function Settings() {
  const [demoMode, setDemoMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pwaMessage, setPwaMessage] = useState<string | null>(null);

  useEffect(() => {
    setDemoMode(localStorage.getItem('demoMode') === 'true');
    setDarkMode(document.documentElement.classList.contains('dark'));
    setIsSynced(!!calendarService.getAccessToken());
    setEmail(calendarService.getEmail());
    setLastSync(calendarService.getLastSync());
  }, []);

  const toggleDemoMode = () => {
    const newValue = !demoMode;
    setDemoMode(newValue);
    localStorage.setItem('demoMode', newValue ? 'true' : 'false');
    // Force a full page reload to ensure all services pick up the change
    window.location.reload();
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const fetchedEmail = await calendarService.fetchUserProfile(tokenResponse.access_token);
        calendarService.setAccessToken(tokenResponse.access_token, fetchedEmail || undefined);
        setEmail(fetchedEmail);
        setIsSynced(true);
        setIsSyncing(false);
        handleManualSync(); // Force initial sync
      } catch (e: any) {
        console.error(e);
        setIsSyncing(false);
      }
    },
    onError: () => {
      console.error('Google OAuth Login Failed');
      setIsSyncing(false);
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
  });

  const handleCalendarSync = () => {
    setIsSyncing(true);
    login();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await calendarService.getUpcomingEvents();
    setLastSync(calendarService.getLastSync());
    setIsSyncing(false);
  };

  const handleDisconnect = () => {
    googleLogout();
    calendarService.setAccessToken(null);
    setIsSynced(false);
    setEmail(null);
    setLastSync(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-3">
        <div className="p-3 bg-surface-variant text-on-surface-variant rounded-xl">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Settings</h1>
          <p className="text-on-surface-variant font-body">Manage your app preferences.</p>
        </div>
      </header>

      <Card className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-headline font-semibold text-lg flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              Demo Mode
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 font-body">
              Enable Demo Mode to load realistic mock data instantly. Ideal for hackathon presentations if external APIs fail.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={demoMode}
              onChange={toggleDemoMode}
            />
            <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <hr className="border-outline-variant" />

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-headline font-semibold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
              Dark Mode
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 font-body">
              Toggle the application's appearance between light and dark themes.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-headline font-semibold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Install App
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 font-body">
              Add Last Minute Life Saver to your home screen or desktop for a native app experience.
            </p>
          </div>
          <Button 
            onClick={() => {
              if ((window as any).triggerPwaInstall) {
                (window as any).triggerPwaInstall();
                setPwaMessage("Installation prompted successfully!");
              } else {
                setPwaMessage("Installation is not supported by your browser or inside an iframe, or the app is already installed.");
              }
            }}
            variant="secondary"
            className="min-w-[120px]"
          >
            Install
          </Button>
        </div>
        {pwaMessage && (
          <div className="p-3 bg-surface-variant text-on-surface-variant text-xs rounded-lg font-body mt-2">
            {pwaMessage}
          </div>
        )}
      </Card>

      <Card className="space-y-6">
        <h2 className="text-lg md:text-xl font-headline font-bold text-primary mb-2">Integrations</h2>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-headline font-semibold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Google Calendar
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 font-body">
              Allow AI to automatically find gaps in your schedule to slot your tasks into.
            </p>
            {isSynced && email && (
              <p className="text-xs text-primary font-bold mt-2">
                Connected: {email}
              </p>
            )}
            {isSynced && lastSync && (
              <p className="text-xs text-on-surface-variant mt-1">
                Last synced: {lastSync}
              </p>
            )}
            {!hasClientId && (
              <p className="text-xs text-error mt-2 font-bold bg-error/10 inline-block px-2 py-1 rounded">
                Authorization Required: Please add VITE_GOOGLE_CLIENT_ID to your .env file
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {isSynced ? (
              <>
                <Button onClick={handleManualSync} disabled={isSyncing} className="min-w-[120px]">
                  {isSyncing ? <><Loader2 className="w-4 h-4 animate-spin mx-auto" /></> : "Sync Now"}
                </Button>
                <Button onClick={handleDisconnect} variant="secondary" className="min-w-[120px] text-error hover:bg-error/10 hover:border-error/50">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleCalendarSync} 
                disabled={isSyncing || !hasClientId} 
                className="min-w-[120px]"
              >
                {isSyncing ? <><Loader2 className="w-4 h-4 animate-spin mx-auto" /></> : "Connect Account"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
