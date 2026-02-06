'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LimitedOfferBannerProps {
  tenant: {
    slug: string;
    is_founding_member?: boolean;
  };
  hasBackground?: boolean;
}

export const LimitedOfferBanner: React.FC<LimitedOfferBannerProps> = ({ tenant, hasBackground = false }) => {
  const [claimedSpots, setClaimedSpots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClaimedSpots = async () => {
      try {
        const response = await fetch('/api/founding-member/availability');
        const data = await response.json();
        
        // Calculate claimed spots (limit - remaining)
        const claimed = data.limit - data.remainingSpots;
        setClaimedSpots(claimed);
      } catch (error) {
        console.error('Error fetching founding member availability:', error);
        setClaimedSpots(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaimedSpots();
  }, []);

  // Don't show if user is already a founding member or if loading
  if (isLoading || tenant.is_founding_member || claimedSpots === null || claimedSpots >= 100) {
    return null;
  }

  const progressPercentage = Math.min((claimedSpots / 100) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full mb-8 rounded-xl overflow-hidden ${
        hasBackground
          ? 'bg-white/10 backdrop-blur-lg border border-white/20'
          : 'bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200'
      }`}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Text Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${hasBackground ? 'text-yellow-400' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={`text-sm font-black uppercase tracking-wider ${hasBackground ? 'text-white' : 'text-sky-900'}`}>
                LIMITED OFFER
              </span>
            </div>
            <h3 className={`text-lg font-black ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
              Founding Member Program
            </h3>
            <p className={`text-sm ${hasBackground ? 'text-white/80' : 'text-slate-600'}`}>
              Join the first 100 businesses and get a <span className="font-bold">Lifetime Annual Fee Waiver</span> and <span className="font-bold">Pioneer Badge</span>.
            </p>
          </div>

          {/* Right: Progress Bar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${hasBackground ? 'text-white/80' : 'text-slate-600'}`}>
                  Pioneer Spots Claimed
                </span>
                <span className={`text-sm font-black tabular-nums ${hasBackground ? 'text-yellow-400' : 'text-sky-600'}`}>
                  {claimedSpots}/100
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className={`relative h-3 rounded-full overflow-hidden ${
                hasBackground ? 'bg-white/10' : 'bg-white'
              } border ${hasBackground ? 'border-white/20' : 'border-sky-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    hasBackground
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600'
                  } shadow-lg`}
                />
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </div>

              {/* Remaining Spots */}
              <p className={`text-xs font-medium text-center ${hasBackground ? 'text-white/70' : 'text-slate-500'}`}>
                {100 - claimedSpots} spots remaining
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

