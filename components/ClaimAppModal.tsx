'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PioneerPitch } from './PioneerPitch';
import { PostLaunchPitch } from './PostLaunchPitch';

interface ClaimAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
  businessName: string;
  remainingSpots: number;
  isPioneerAvailable: boolean;
}

export const ClaimAppModal: React.FC<ClaimAppModalProps> = ({
  isOpen,
  onClose,
  onClaim,
  businessName,
  remainingSpots,
  isPioneerAvailable,
}) => {
  const [spots, setSpots] = useState(remainingSpots);
  const [isPioneer, setIsPioneer] = useState(isPioneerAvailable);

  // Fetch real-time Pioneer spots count
  useEffect(() => {
    if (isOpen) {
      const fetchSpots = async () => {
        try {
          const response = await fetch('/api/founding-member/spots', {
            method: 'GET',
            cache: 'no-store'
          });
          const data = await response.json();
          setSpots(data.remaining || 0);
          setIsPioneer(data.isPioneerAvailable || false);
        } catch (error) {
          console.error('Failed to fetch tenant count:', error);
        }
      };

      fetchSpots();
      const interval = setInterval(fetchSpots, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl"
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {isPioneer
                    ? 'Your App. Your Brand. $0 Forever.'
                    : 'The Business Your Clients Expect. The App Your Craft Deserves.'}
                </h2>
                <p className="text-white/90 font-medium text-sm leading-relaxed max-w-md mx-auto">
                  {isPioneer
                    ? 'We\'re looking for our first 100 Founding Pioneers. No upfront cost. No monthly subscription. No "gotchas."'
                    : 'VantakOS was built on one principle: No one should be gatekeeping small business. We give you the digital booking, seamless payments, and home-screen presence your customers expect from the giants—without the enterprise price tag.'}
                </p>
              </div>

              {/* Content - Smooth transition with no layout jump */}
              <div className="p-8 space-y-6 min-h-[400px]">
                {/* Conditional Content Based on Pioneer Availability */}
                <AnimatePresence mode="wait">
                  {isPioneer ? (
                    <motion.div
                      key="pioneer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <PioneerPitch remainingSpots={spots} onClaim={onClaim} />
                      
                      {/* What You Get - Shared */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-black uppercase tracking-widest text-slate-700">
                          What You Get
                        </h5>
                        <div className="space-y-2">
                          {[
                            'Fully-branded customer app (PWA)',
                            'Booking & payment system',
                            'Virtual Terminal (QR code POS)',
                            'Digital receipts & The Ledger',
                            'AI support assistant',
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-sm text-slate-700 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="post-launch"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <PostLaunchPitch onClaim={onClaim} />
                      
                      {/* What You Get - Shared */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-black uppercase tracking-widest text-slate-700">
                          What You Get
                        </h5>
                        <div className="space-y-2">
                          {[
                            'Fully-branded customer app (PWA)',
                            'Booking & payment system',
                            'Virtual Terminal (QR code POS)',
                            'Digital receipts & The Ledger',
                            'AI support assistant',
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-sm text-slate-700 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA Buttons */}
                <div className="space-y-3 pt-4">
                  <Link
                    href="/signup"
                    onClick={onClaim}
                    className="block w-full bg-gradient-to-br from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-5 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl text-center"
                  >
                    {isPioneer
                      ? spots > 0 && spots <= 100
                        ? `Claim My Lifetime Pioneer Spot (Only ${spots} left!)`
                        : 'Claim My Lifetime Pioneer Spot'
                      : 'Launch Your App'}
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 py-4 rounded-xl font-semibold text-sm transition-all"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>5-minute setup</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

