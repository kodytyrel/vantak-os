'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const PWAInstallAnimation: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto mt-16 md:mt-24 px-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Phone Mockup with Home Screen */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="relative w-48 h-96 bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
            {/* Phone Screen */}
            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
              {/* Home Screen Grid */}
              <div className="absolute inset-0 p-6 grid grid-cols-4 gap-4">
                {/* Existing Apps */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-300" />
                  </div>
                ))}
              </div>

              {/* VantakOS Icon Animation */}
              <motion.div
                initial={{ x: -100, y: 0, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 1,
                  ease: [0.34, 1.56, 0.64, 1], // Elastic easing
                }}
                className="absolute bottom-6 right-6 z-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-xl ring-4 ring-white">
                  <span className="text-white font-black text-xl">V</span>
                </div>
              </motion.div>

              {/* Arrow Animation */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: [0, 1, 0], y: [-20, -10, -20] }}
                transition={{
                  delay: 1.2,
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="absolute bottom-20 right-6 z-10"
              >
                <svg
                  className="w-6 h-6 text-sky-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Glow Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              delay: 1.5,
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-sky-400/20 rounded-[3rem] blur-xl -z-10"
          />
        </div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="text-center text-slate-600 font-medium text-lg max-w-md mx-auto"
        >
          Your brand, one tap away on their home screen.
        </motion.p>
      </div>
    </div>
  );
};

