import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
const IOS_DISMISSED = 'abotalal-install-instructions-dismissed';

export function useAppInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const navigatorIOS = navigator as Navigator & { standalone?: boolean };
    const updateInstalled = () => setInstalled(media.matches || navigatorIOS.standalone === true);
    updateInstalled();
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    try { setDismissed(localStorage.getItem(IOS_DISMISSED) === 'true'); } catch { /* Storage may be disabled. */ }
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); setInstructionsOpen(false); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    media.addEventListener('change', updateInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener('change', updateInstalled);
    };
  }, []);

  const install = async () => {
    if (installed || isPrompting) return;
    if (!prompt) { if (isIOS && !dismissed) setInstructionsOpen(true); return; }
    setIsPrompting(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally { setPrompt(null); setIsPrompting(false); }
  };
  const closeInstructions = () => {
    setInstructionsOpen(false);
    setDismissed(true);
    try { localStorage.setItem(IOS_DISMISSED, 'true'); } catch { /* Do not block browsing. */ }
  };
  return { canInstall: !installed && (Boolean(prompt) || (isIOS && !dismissed)), installed, install, isPrompting, instructionsOpen, closeInstructions };
}
