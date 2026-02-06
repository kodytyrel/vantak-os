'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FoundingMemberBannerProps {
  remainingSpots: number;
}

export const FoundingMemberBanner: React.FC<FoundingMemberBannerProps> = ({ remainingSpots }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || remainingSpots <= 0) {
    return null;
  }

  const spotsUsed = 100 - remainingSpots;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-[100] bg-slate-950/95 backdrop-blur-md border-b border-sky-500/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 relative">
            <div className="flex items-center justify-center gap-3">
              {/* Text Content */}
              <span className="text-white/90 font-medium text-xs uppercase tracking-widest">
                LIMITED PIONEER ACCESS: {spotsUsed}/100 SPOTS REMAINING — ACTIVATION DEPOSIT WAIVED
              </span>
              
              {/* Remaining Spots Number - Subtle Breathing Animation */}
              <div className="flex-shrink-0 relative">
                <motion.span
                  animate={{
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-sky-400 font-black text-xs tabular-nums tracking-widest"
                >
                  {remainingSpots}
                </motion.span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center group ml-2"
                aria-label="Close banner"
              >
                <svg className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
