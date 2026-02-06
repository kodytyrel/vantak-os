'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentReceivedOverlayProps {
  isVisible: boolean;
  amount: number;
  invoiceNumber?: string;
  customerName?: string;
  onClose: () => void;
}

export const PaymentReceivedOverlay: React.FC<PaymentReceivedOverlayProps> = ({
  isVisible,
  amount,
  invoiceNumber,
  customerName,
  onClose,
}) => {
  useEffect(() => {
    if (!isVisible) return;

    // Play success sound from URL (premium chime)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => {
      console.error('Failed to play success sound:', err);
      // Fallback: Try to resume AudioContext if needed (for locked screen scenarios)
      if (err.name === 'NotAllowedError') {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        context.resume().then(() => {
          audio.play().catch(console.error);
        });
      }
    });

    // Trigger haptic feedback on mobile devices (Apple-style pattern)
    if ('vibrate' in navigator) {
      try {
        // Success pattern: short-short-long vibration
        navigator.vibrate([100, 50, 100, 50, 200]);
      } catch (err) {
        console.error('Haptic feedback not available:', err);
      }
    }

    // Note: Auto-close is handled by parent component (VantakTerminal) after 4 seconds
    // This ensures consistent timing across the app

    return () => {
      // Cleanup audio if component unmounts early
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[99]"
          />

          {/* Glassmorphism Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-12 max-w-md w-full shadow-2xl text-center space-y-8">
              {/* Animated Checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <h1 className="text-4xl font-black text-white tracking-tight">
                  PAYMENT RECEIVED!
                </h1>
                <div className="space-y-2">
                  <p className="text-3xl font-black text-emerald-400">
                    ${amount.toFixed(2)}
                  </p>
                  {customerName && (
                    <p className="text-lg text-white/90 font-medium">
                      {customerName}
                    </p>
                  )}
                  {invoiceNumber && (
                    <p className="text-sm text-white/70 font-medium">
                      Receipt: {invoiceNumber}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Pulsing indicator */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-xs text-white/60 font-medium uppercase tracking-widest">
                  Processing receipt...
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

