import React from 'react';
import { SubscriptionTier } from '../types';
import { hasTierAccess, getUpgradeMessage } from '../lib/tierGating';

interface TierGateProps {
  tier: SubscriptionTier;
  requiredTier: 'starter' | 'pro' | 'elite';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * TierGate Component
 * 
 * Use this component to conditionally render features based on tier access.
 * 
 * Example:
 * ```tsx
 * <TierGate tier={tenant.tier} requiredTier="pro">
 *   <MarketingEngine />
 * </TierGate>
 * 
 * <TierGate 
 *   tier={tenant.tier} 
 *   requiredTier="elite"
 *   showUpgradePrompt
 *   fallback={<UpgradePrompt />}
 * >
 *   <TheLedger />
 * </TierGate>
 * ```
 */
export const TierGate: React.FC<TierGateProps> = ({
  tier,
  requiredTier,
  children,
  fallback = null,
  showUpgradePrompt = false,
}) => {
  const hasAccess = hasTierAccess(tier, requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUpgradePrompt && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

/**
 * TierGateButton Component
 * 
 * Wrapper for buttons that should only appear for certain tiers.
 * Automatically disables and shows upgrade message for locked tiers.
 */
interface TierGateButtonProps {
  tier: SubscriptionTier;
  requiredTier: 'starter' | 'pro' | 'elite';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const TierGateButton: React.FC<TierGateButtonProps> = ({
  tier,
  requiredTier,
  children,
  onClick,
  className = '',
}) => {
  const hasAccess = hasTierAccess(tier, requiredTier);

  if (!hasAccess) {
    return null;
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
};

