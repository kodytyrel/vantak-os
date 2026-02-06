import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Creates a subscription schedule for non-founding members
 * Founding members get a lifetime waiver (no annual fees)
 * 
 * @param customerId - Stripe Customer ID for the tenant (platform customer, not Connect account)
 * @param isFoundingMember - Whether this tenant is a founding member
 * @param annualFeePriceId - Stripe Price ID for the annual fee (default: env var)
 * @returns Subscription schedule or null if founding member
 */
export async function createSubscriptionSchedule(
  customerId: string,
  isFoundingMember: boolean,
  annualFeePriceId?: string
): Promise<Stripe.SubscriptionSchedule | null> {
  // Founding members get lifetime waiver - no subscription schedule
  if (isFoundingMember) {
    console.log(`🏆 Founding Member detected - skipping annual fee schedule for customer ${customerId}`);
    return null;
  }

  // Get annual fee price ID from env or use provided
  const priceId = annualFeePriceId || process.env.STRIPE_ANNUAL_FEE_PRICE_ID || '';

  if (!priceId) {
    console.warn('⚠️ No annual fee price ID configured. Skipping subscription schedule creation.');
    return null;
  }

  try {
    // Create subscription schedule with 2 phases:
    // Phase 1: Free for 12 months (Year 1)
    // Phase 2: Annual fee starting at Month 13, recurring annually
    
    const schedule = await stripe.subscriptionSchedules.create({
      customer: customerId,
      start_date: Math.floor(Date.now() / 1000), // Start immediately ('now')
      phases: [
        {
          // Phase 1: First 12 months - FREE (trial period)
          items: [
            {
              // You can use a $0 price or a trial period
              // For now, we'll use an empty items array to represent free tier
              // Or you can create a $0 price in Stripe and use that here
              price: process.env.STRIPE_FREE_TIER_PRICE_ID || '', // $0 price ID (optional)
              quantity: 1,
            },
          ],
          duration_months: 12, // First year free
          // Note: If you don't have a $0 price, you can omit items and just set duration
        },
        {
          // Phase 2: Starting Month 13 - Annual fee kicks in
          items: [
            {
              price: priceId, // Annual fee price (e.g., $99/year)
              quantity: 1,
            },
          ],
          iterations: null, // Recurring indefinitely (or set a specific number)
          // Recurring annually means this phase repeats every 12 months
          // You may need to create a subscription with collection_method: 'send_invoice'
          // and billing_cycle_anchor for annual billing
        },
      ],
      metadata: {
        platform: 'VantakOS',
        billing_type: 'annual_fee',
        first_year_free: 'true',
      },
    });

    console.log(`✅ Subscription schedule created for customer ${customerId}: ${schedule.id}`);
    return schedule;
  } catch (error: any) {
    console.error('❌ Error creating subscription schedule:', error.message);
    throw error;
  }
}

/**
 * Alternative: Create a subscription with trial period (simpler approach)
 * This might be easier than subscription schedules depending on your setup
 */
export async function createSubscriptionWithTrial(
  customerId: string,
  isFoundingMember: boolean,
  annualFeePriceId?: string
): Promise<Stripe.Subscription | null> {
  // Founding members get lifetime waiver
  if (isFoundingMember) {
    console.log(`🏆 Founding Member detected - skipping annual fee subscription for customer ${customerId}`);
    return null;
  }

  const priceId = annualFeePriceId || process.env.STRIPE_ANNUAL_FEE_PRICE_ID || '';

  if (!priceId) {
    console.warn('⚠️ No annual fee price ID configured. Skipping subscription creation.');
    return null;
  }

  try {
    // Create a subscription with 12-month trial, then annual billing
    // Note: For annual billing, you may want to use a subscription schedule instead
    // But this simpler approach works if your price is set to annual billing
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 365, // 12 months free trial (Year 1)
      // billing_cycle_anchor will be set automatically at trial end
      metadata: {
        platform: 'VantakOS',
        billing_type: 'annual_fee',
        first_year_free: 'true',
        founding_member: 'false',
        note: 'Annual fee starts after 12-month free trial period',
      },
    });

    // Alternatively, you can use subscription schedules for more control:
    // This allows you to have Phase 1: free for 12 months, Phase 2: annual fee recurring
    // But the trial_period_days approach is simpler if your Stripe price is already set to annual

    console.log(`✅ Subscription with trial created for customer ${customerId}: ${subscription.id}`);
    return subscription;
  } catch (error: any) {
    console.error('❌ Error creating subscription:', error.message);
    throw error;
  }
}

