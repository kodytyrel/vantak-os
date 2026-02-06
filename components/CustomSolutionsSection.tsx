'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TenantConfig } from '@/types';

interface CustomSolutionsSectionProps {
  tenant?: TenantConfig;
  hasBackground?: boolean;
}

export const CustomSolutionsSection: React.FC<CustomSolutionsSectionProps> = ({ 
  tenant, 
  hasBackground = false 
}) => {
  const [vision, setVision] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vision.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/custom-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: vision.trim(),
          email: email.trim(),
          tenantSlug: tenant?.slug || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setVision('');
        setEmail('');
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error('Error submitting custom lead:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="custom-solutions" 
      className={`py-16 px-4 sm:px-6 relative ${hasBackground ? '' : 'bg-slate-50/50'}`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`${
            hasBackground 
              ? 'bg-white/10 backdrop-blur-xl border border-white/20' 
              : 'bg-white/80 backdrop-blur-sm border border-slate-200/80'
          } rounded-2xl p-8 sm:p-12 shadow-lg`}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className={`text-4xl sm:text-5xl font-black tracking-tighter mb-4 ${
              hasBackground ? 'text-white' : 'text-slate-900'
            }`}>
              Your Business. Your Rules.
            </h2>
            <p className={`text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto ${
              hasBackground ? 'text-white/90' : 'text-slate-600'
            }`}>
              Need an app more specific to your industry? KC Dev Co builds bespoke, high-performance software for businesses that break the mold.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="vision" 
                className={`block text-sm font-semibold mb-2 ${
                  hasBackground ? 'text-white' : 'text-slate-900'
                }`}
              >
                Describe your vision
              </label>
              <textarea
                id="vision"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                required
                rows={5}
                placeholder="Tell us about your unique business needs, industry requirements, or specific features you're looking for..."
                className={`w-full px-6 py-4 rounded-lg text-sm font-medium outline-none transition-all resize-none ${
                  hasBackground
                    ? 'bg-white/20 backdrop-blur-lg border border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900'
                }`}
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className={`block text-sm font-semibold mb-2 ${
                  hasBackground ? 'text-white' : 'text-slate-900'
                }`}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className={`w-full px-6 py-4 rounded-lg text-sm font-medium outline-none transition-all ${
                  hasBackground
                    ? 'bg-white/20 backdrop-blur-lg border border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900'
                }`}
              />
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <p className="text-sm font-medium text-emerald-900">
                  ✓ Thank you! We'll be in touch soon to discuss your custom solution.
                </p>
              </motion.div>
            )}

            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm font-medium text-red-900">
                  Something went wrong. Please try again or email us directly at Support@vantakos.com
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !vision.trim() || !email.trim()}
              className={`w-full py-4 px-8 rounded-lg font-semibold text-base transition-all ${
                hasBackground
                  ? 'bg-white/20 backdrop-blur-lg border border-white/30 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

