'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PostLaunchPitchProps {
  onClaim: () => void;
}

export const PostLaunchPitch: React.FC<PostLaunchPitchProps> = ({ onClaim }) => {
  return (
    <div className="space-y-6">
      {/* The Mission */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355r" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-900 mb-3">
              The Mission
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              VantakOS was built on one principle: <span className="font-black text-slate-900">No one should be gatekeeping small business.</span> We give you the digital booking, seamless payments, and home-screen presence your customers expect from the giants—without the enterprise price tag.
            </p>
          </div>
        </div>
      </motion.div>

      {/* The Split */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-6 border-2 border-sky-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-900 mb-2">
              The Split
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              <span className="font-black text-emerald-600">You craft. We work.</span> From the first booking to the final payment, VantakOS is the partner that handles the "business" so you can stay obsessed with your craft.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

