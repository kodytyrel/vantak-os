'use client';

import React, { useState, useEffect } from 'react';

interface InstallBannerProps {
  businessName: string;
  primaryColor: string;
  logoUrl?: string;
}

export default function InstallBanner({
  businessName,
  primaryColor,
  logoUrl,
}: InstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Don't show banner if already installed
    }

    // 2. Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      return; // Don't show on desktop
    }

    // 3. Check dismissal grace period (24 hours)
    const dismissalKey = `vantak_install_dismissed_${businessName.replace(/\s+/g, '_')}`;
    const lastDismissed = localStorage.getItem(dismissalKey);
    if (lastDismissed) {
      const hoursSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return;
      }
    }

    // 4. Android: Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setIsVisible(true), 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. iOS: Show banner automatically after engagement
    if (isIOS) {
      setTimeout(() => setIsVisible(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [businessName]);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      // Show iOS instructions modal
      setShowIOSInstructions(true);
    } else if (platform === 'android' && deferredPrompt) {
      // Trigger Android native install prompt
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

  if (!isVisible && !showIOSInstructions) {
    return null;
  }

  return (
    <>
      {/* Bottom Banner */}
      {isVisible && (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:max-w-md md:mx-auto animate-slide-up">
          <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-5 flex items-center justify-between gap-4 ring-1 ring-black/5">
            {/* Icon & Text */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {businessName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                  Install App
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight">
                  Install {businessName} App to your Home Screen for instant access.
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Faster access & offline capabilities
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={dismissBanner}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <button
                onClick={handleInstallClick}
                className="px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative animate-slide-up">
            {/* Close Button */}
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-8 right-8 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="w-14 h-14 rounded-2xl object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {businessName.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-black tracking-tighter text-slate-900 leading-none mb-3">
                Add to Home Screen
              </h3>
              <p className="text-sm font-medium text-slate-400 max-w-[200px] mx-auto">
                Install the {businessName} app for the full experience.
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <svg
                    className="w-6 h-6 text-sky-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700">
                  1. Tap the <span className="text-sky-500">Share</span> icon in Safari
                </p>
              </div>

              <div className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <svg
                    className="w-6 h-6 text-slate-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700">
                  2. Select{' '}
                  <span className="text-slate-900 font-black tracking-tight">
                    Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}


