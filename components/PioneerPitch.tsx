'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PioneerPitchProps {
  remainingSpots: number;
  onClaim: () => void;
}

export const PioneerPitch: React.FC<PioneerPitchProps> = ({ remainingSpots, onClaim }) => {
  return (
    <div className="space-y-6">
      {/* Mission Statement Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-6 border-2 border-sky-200 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355r" />
            </svg>
          </div>
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">
            Our Principle
          </h4>
        </div>
        <p className="text-lg font-black text-slate-900 italic leading-relaxed">
          "No one should be gatekeeping small business."
        </p>
      </motion.div>

      {/* The Logic - Why No Catch */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-900 mb-3">
              The "Catch"
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Why? Because <span className="font-black text-slate-900">VantakOS only wins when you win.</span> We take a tiny transaction fee when you get paid—that's it. We don't believe in "taxing" a business before it's even made a dollar.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pioneer Benefit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-6 border-2 border-sky-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xl">🏆</span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-900 mb-2">
              Lifetime Pioneer Licensing
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              <span className="font-black text-emerald-600">No upfront cost. No monthly subscription. No connectivity fees—ever.</span>{' '}
              Total cost to start today: <span className="font-black text-slate-900 text-lg">$0.00</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pioneer Countdown */}
      {remainingSpots > 0 && remainingSpots <= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-slate-900 rounded-xl p-4 text-center border-2 border-emerald-400/20"
        >
          <p className="text-white/80 text-xs font-medium mb-1 uppercase tracking-widest">
            {remainingSpots === 100 ? 'Be the First' : remainingSpots < 10 ? 'Hurry! Only' : 'Only'}
          </p>
          <p className="text-4xl font-black text-emerald-400 mb-1">
            {remainingSpots}
          </p>
          <p className="text-white/90 text-sm font-semibold mb-1">
            Founding Pioneer {remainingSpots === 1 ? 'Spot' : 'Spots'}
          </p>
          <p className="text-white/60 text-xs font-medium">
            Remaining for Lifetime Licensing
          </p>
        </motion.div>
      )}
    </div>
  );
};

