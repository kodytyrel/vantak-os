
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallBannerProps {
  businessName: string;
  primaryColor: string;
  logoUrl: string;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ businessName, primaryColor, logoUrl }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [showIosTutorial, setShowIosTutorial] = useState(false);

  useEffect(() => {
    // 1. Standalone Check (Don't show if already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;
    
    if (isStandalone) return;

    // 2. Platform Detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // 3. Dismissal Grace Period (24h)
    const dismissalKey = `vantak_install_dismissed_${businessName.replace(/\s+/g, '_')}`;
    const lastDismissed = localStorage.getItem(dismissalKey);
    if (lastDismissed) {
      const hoursSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }

    // 4. Android Event Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Nudge user after 4 seconds of engagement
      setTimeout(() => setIsVisible(true), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // 5. iOS Manual Nudge (iOS has no event, so we show it automatically)
    if (isIos) {
      setTimeout(() => setIsVisible(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [businessName]);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      setShowIosTutorial(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
        setDeferredPrompt(null);
      }
    }
  };

  const dismissBanner = () => {
    setIsVisible(false);
    const dismissalKey = `vantak_install_dismissed_${businessName.replace(/\s+/g, '_')}`;
    localStorage.setItem(dismissalKey, Date.now().toString());
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            {...({ initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 100, opacity: 0 }, className: "fixed bottom-24 left-4 right-4 z-[100] md:max-w-md md:mx-auto md:bottom-8" } as any)}
          >
            <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-5 flex items-center justify-between gap-4 ring-1 ring-black/5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img src={logoUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-1 ring-black/5" alt={businessName} />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Vantak Native</span>
                  <span className="text-sm font-bold text-slate-900 leading-tight">Install {businessName}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Faster booking & history</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={dismissBanner}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <button 
                  onClick={handleInstallClick}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-black/10 hover:brightness-110 active:scale-95 transition-all"
                >
                  Install
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIosTutorial && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              {...({ initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, className: "w-full max-w-sm bg-white rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative" } as any)}
            >
              <button 
                onClick={() => setShowIosTutorial(false)}
                className="absolute top-8 right-8 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>

              <div className="text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                   <img src={logoUrl} className="w-14 h-14 rounded-2xl object-cover" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 leading-none mb-3">
                  Add to Home Screen
                </h3>
                <p className="text-sm font-medium text-slate-400 max-w-[200px] mx-auto">Install the {businessName} app for the full experience.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-700">1. Tap the <span className="text-sky-500">Share</span> icon in Safari</p>
                </div>

                <div className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-700">2. Select <span className="text-slate-900 font-black tracking-tight">Add to Home Screen</span></p>
                </div>
              </div>

              <button 
                onClick={() => setShowIosTutorial(false)}
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl active:scale-95 transition-all"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
