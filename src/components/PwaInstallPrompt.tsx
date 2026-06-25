import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './Button';

// Extend Window to include the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function PwaInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPrompt = e as BeforeInstallPromptEvent;
      setIsInstallable(true);

      // Show banner if they haven't dismissed it before
      if (!localStorage.getItem('pwa_banner_dismissed')) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setIsInstallable(false);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
    setIsInstallable(false);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true');
    setShowBanner(false);
  };

  // Expose install to window for Settings.tsx
  (window as any).triggerPwaInstall = isInstallable ? handleInstall : null;

  if (!isInstallable || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="bg-primary-container text-on-primary-container p-4 rounded-2xl shadow-xl flex items-center gap-4 max-w-sm ml-auto border border-primary/20">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-headline font-bold text-sm">Install App</h3>
          <p className="text-xs opacity-90 mt-0.5">Add to home screen for a better experience.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInstall} className="py-1.5 px-3 text-xs bg-primary text-on-primary hover:bg-primary/90">
            Install
          </Button>
          <button onClick={handleDismiss} className="p-2 opacity-60 hover:opacity-100 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
