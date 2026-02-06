'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { SubscriptionTier } from '../types';
import { hasMarketingEngineAccess } from '../lib/tierGating';

interface NewsletterPopupProps {
  tenantId: string;
  businessName: string;
  primaryColor: string;
  logoUrl?: string;
  tenantTier: SubscriptionTier;
}

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({
  tenantId,
  businessName,
  primaryColor,
  logoUrl,
  tenantTier,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Only show for Marketing Engine (Pro/Elite tiers)
    if (!hasMarketingEngineAccess(tenantTier)) return;

    // Check if popup was dismissed (24-hour cookie)
    const dismissed = localStorage.getItem(`newsletter_dismissed_${tenantId}`);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return; // Don't show if dismissed within 24 hours
      }
    }

    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [tenantId, tenantTier]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`newsletter_dismissed_${tenantId}`, Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          tenant_id: tenantId,
          email: email.toLowerCase(),
          first_name: firstName || null,
          source: 'popup',
        }, {
          onConflict: 'tenant_id,email',
        });

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } catch (err: any) {
      console.error('Newsletter signup error:', err);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasMarketingEngineAccess(tenantTier)) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            {...({ initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, className: "bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative", style: { borderTop: `4px solid ${primaryColor}` } } as any)}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8">
              {logoUrl && (
                <div className="flex justify-center mb-6">
                  <img src={logoUrl} alt={businessName} className="h-12 object-contain" />
                </div>
              )}

              {isSuccess ? (
                <motion.div
                  {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "text-center" } as any)}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                    <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">You're In!</h3>
                  <p className="text-slate-500 font-medium">Thanks for subscribing to {businessName} updates.</p>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">
                    Stay Connected
                  </h3>
                  <p className="text-slate-500 font-medium text-center mb-6">
                    Get updates on new products, services, and special offers from {businessName}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name (optional)"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 focus:outline-none transition-colors font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 focus:outline-none transition-colors font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="w-full py-4 rounded-xl font-black text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Subscribing...
                        </div>
                      ) : (
                        'Join Newsletter'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

