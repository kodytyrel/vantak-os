'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageHeroProps {
  isPioneerAvailable: boolean;
  remainingSpots: number;
}

export const LandingPageHero: React.FC<LandingPageHeroProps> = ({ isPioneerAvailable, remainingSpots }) => {
  return (
    <section className="max-w-7xl mx-auto px-8 py-24 md:py-32">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Official Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo.png"
            alt="VantakOS - No more gatekeeping"
            className="h-16 md:h-20 w-auto"
          />
        </div>

        {/* Main Headline - Unified for all versions */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.02em] text-slate-900 leading-[1.05]"
        >
          <div className="block">Your Business.</div>
          <div className="block">Your App.</div>
          <div className="block">Live in Minutes.</div>
        </motion.h1>

        {/* Subheaders - Unified */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
            VantakOS. We handle the business, so you can focus on the craft.
          </p>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
            Booking, Payments, Products, and a customer-installable app.{' '}
            <span className="text-sky-500 font-black tracking-tight">all. in. one.</span>
          </p>
        </motion.div>

        {/* Launch Phase 1 CTA - Glassmorphism Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-8 space-y-4"
        >
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center justify-center px-12 py-6 bg-white/80 backdrop-blur-xl border-2 border-white/50 text-slate-900 font-black text-xl rounded-2xl transition-all shadow-lg hover:shadow-xl active:shadow-lg"
            >
              {/* Glassmorphism gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/50 to-white/40 rounded-2xl backdrop-blur-xl" />
              {/* Pulsing glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-sky-400/20 via-blue-400/20 to-purple-400/20 rounded-2xl blur-xl"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Shine effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
                initial={{ x: '-100%', opacity: 0 }}
                whileHover={{ x: '100%', opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              <span className="relative z-10 flex items-center gap-3">
                Create Your App Now
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </motion.button>
          </Link>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm md:text-base text-slate-600 font-medium max-w-xs mx-auto leading-relaxed"
          >
            Create your business app in 5 minutes, so your customers can download it in 30.
          </motion.p>
        </motion.div>

        {/* Pioneer Counter - Only show if spots available */}
        {isPioneerAvailable && remainingSpots > 0 && remainingSpots <= 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-center pt-4"
          >
            <p className="text-sm text-slate-500 font-medium mb-1">
              {remainingSpots === 100 ? 'Be the First' : remainingSpots < 10 ? 'Hurry! Only' : 'Only'}{' '}
              <span className="text-sky-500 font-black text-lg">{remainingSpots}</span>{' '}
              {remainingSpots === 1 ? 'Pioneer Spot' : 'Pioneer Spots'} Remaining
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

