import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  currentTier: string;
  targetTier: string;
  benefits: string[];
  price: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName,
  currentTier,
  targetTier,
  benefits,
  price,
}) => {
  if (!isOpen) return null;

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => {
          // Close modal when clicking backdrop
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          {...({ initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, className: "bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative my-auto" } as any)}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
            aria-label="Close modal"
            type="button"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Unlock {featureName}
              </h2>
              <p className="text-slate-500 font-medium">
                Upgrade to {targetTier} to access this feature
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed flex-1">{benefit}</p>
                </div>
              ))}
            </div>

            {/* Price & CTA */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-900 mb-1">{price}</div>
                <p className="text-sm text-slate-500">per month</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement upgrade flow - for now, just close
                  // This should redirect to upgrade/checkout page or trigger upgrade API
                  onClose();
                }}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-xl"
                type="button"
              >
                Upgrade Now
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                className="w-full py-3 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
                type="button"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


