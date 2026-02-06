/**
 * Tier Gating Utilities
 * 
 * Centralized logic for feature gating based on subscription tier.
 * Use these functions throughout the app to ensure consistent feature access.
 */

import { SubscriptionTier } from '../types';

export type TierLevel = 'starter' | 'pro' | 'elite' | 'business';

/**
 * Tier hierarchy for feature gating
 * 'business' is an alias for 'elite'
 */
const TIER_HIERARCHY: Record<TierLevel, number> = {
  starter: 0,
  pro: 1,
  elite: 2,
  business: 2, // Business is same as Elite
};

/**
 * Check if tenant has access to a specific tier or higher
 */
export function hasTierAccess(tier: SubscriptionTier, requiredTier: TierLevel): boolean {
  return TIER_HIERARCHY[tier] >= TIER_HIERARCHY[requiredTier];
}

/**
 * Check if tenant has Pro tier or higher
 */
export function hasProAccess(tier: SubscriptionTier): boolean {
  return hasTierAccess(tier, 'pro');
}

/**
 * Check if tenant has Elite tier
 */
export function hasEliteAccess(tier: SubscriptionTier): boolean {
  return tier === 'elite' || tier === 'business';
}

/**
 * Check if tenant has Business Suite (Elite/Business tier)
 * Supports both 'elite' and 'business' tier names
 */
export function hasBusinessSuiteAccess(tier: SubscriptionTier): boolean {
  return tier === 'elite' || tier === 'business';
}

/**
 * Check if tenant has Marketing Engine (Pro tier or higher)
 */
export function hasMarketingEngineAccess(tier: SubscriptionTier): boolean {
  return hasProAccess(tier);
}

/**
 * Get feature access message for upgrade prompts
 */
export function getUpgradeMessage(requiredTier: TierLevel): string {
  const messages: Record<TierLevel, string> = {
    starter: 'Available on all plans',
    pro: 'Upgrade to Pro ($29/mo) to unlock this feature',
    elite: 'Upgrade to Business Suite ($79/mo) to unlock this feature',
    business: 'Upgrade to Business Suite ($79/mo) to unlock this feature',
  };
  return messages[requiredTier];
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    starter: 'Vantak Free',
    pro: 'Vantak Pro',
    elite: 'Vantak Business Suite',
    business: 'Vantak Business Suite',
  };
  return names[tier] || tier;
}

