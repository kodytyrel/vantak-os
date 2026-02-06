import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Connectivity Fee Price ID - $99 Annual Fee
const CONNECTIVITY_FEE_PRICE_ID = 'price_1SnZezJH84lgzuMFcLnzszF0';

/**
 * Create Subscription Checkout API
 * Called after Stripe Connect account onboarding is complete
 * Creates a Checkout Session for the $99 annual connectivity fee (with 365-day trial)
 * Founding members get lifetime waiver (no checkout session needed)
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, stripeAccountId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // 1. Fetch tenant info including founding member status
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, is_founding_member, founding_member_number, contact_email, business_name, slug, stripe_account_id, stripe_subscription_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const isFoundingMember = tenant.is_founding_member === true;

    // 2. Check Founding Status: If founding member, skip connectivity fee entirely
    if (isFoundingMember) {
      console.log(`🏆 Founding Member #${tenant.founding_member_number} - Lifetime annual fee waiver applied`);
      return NextResponse.json({
        success: true,
        isFoundingMember: true,
        foundingMemberNumber: tenant.founding_member_number,
        message: 'Founding member - annual fees waived for life',
        checkoutUrl: null,
        subscriptionId: null,
      });
    }

    // 3. Check if subscription already exists (idempotency)
    if (tenant.stripe_subscription_id) {
      return NextResponse.json({
        success: true,
        isFoundingMember: false,
        message: 'Subscription already exists',
        subscriptionId: tenant.stripe_subscription_id,
        checkoutUrl: null,
      });
    }

    // 4. Create or retrieve Stripe Customer for the tenant (platform customer for billing)
    let customerId = (tenant as any).stripe_customer_id;

    if (!customerId) {
      // Create a platform customer for billing
      const customer = await stripe.customers.create({
        email: tenant.contact_email || undefined,
        name: tenant.business_name,
        metadata: {
          tenantId: tenant.id,
          type: 'vantakos_tenant',
          founding_member: 'false',
        },
      });

      customerId = customer.id;

      // Save customer ID to tenants table
      await supabaseAdmin
        .from('tenants')
        .update({ stripe_customer_id: customerId } as any)
        .eq('id', tenantId);
    }

    // 5. Calculate next year's date for transparency message
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearDate = nextYear.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // 6. Create Checkout Session for Connectivity Fee Subscription
    // Mode: 'subscription' - This creates a subscription with trial period on the PLATFORM account
    // IMPORTANT: By NOT including transfer_data.destination, the subscription stays on KC Dev Co's account
    // The full $99 connectivity fee stays with the platform (KC Dev Co), not the connected account
    // 
    // CTO CHECK: ✅ trial_period_days: 365 ensures Year 1 is free
    // VIBE CHECK: ✅ payment_method_collection: 'always' collects credit card NOW
    // This creates "Get It Now" momentum - they lock in tonight, bill hits automatically next year
    // The checkout page will show "$0.00 due now" and "$99.00 due on [Next Year Date]"
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: CONNECTIVITY_FEE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 365, // ✅ CTO CHECK: Year 1 Free - exactly 365 days
        application_fee_percent: 100, // 100% of subscription amount stays with platform (KC Dev Co)
        // CRITICAL: We do NOT include transfer_data.destination here
        // Without transfer_data, the subscription is created on the platform account (KC Dev Co)
        // This ensures the full $99 stays with the platform, not the connected account's balance
        metadata: {
          tenantId: tenant.id,
          type: 'vantakos_connectivity_fee',
          business_name: tenant.business_name,
          slug: tenant.slug,
          platform_fee: '100', // Full amount to platform
          trial_days: '365', // Track trial period in metadata
        },
      },
      payment_method_collection: 'always', // ✅ VIBE CHECK: Collect credit card upfront NOW
      // This ensures they commit tonight - card on file, bill hits automatically next year
      // Creates "Get It Now" momentum by locking them into the ecosystem immediately
      payment_method_types: ['card'], // Only accept cards (standard for subscriptions)
      success_url: `https://vantakos.com/dashboard/success?subscription=success&session_id={CHECKOUT_SESSION_ID}&tenant=${tenant.slug}`,
      cancel_url: `https://vantakos.com/dashboard?tenant=${tenant.slug}&subscription=cancelled`,
      metadata: {
        tenantId: tenant.id,
        type: 'connectivity_fee_subscription',
        founding_member: 'false',
        trial_period_days: '365', // Track trial in checkout metadata
      },
      // Stripe automatically shows "$0.00 due now" and next billing date when trial_period_days is set
      // The checkout page will clearly display the trial period and next charge date
      allow_promotion_codes: false, // Prevent discount codes (keep pricing consistent)
    });

    // Note: The subscription will be created automatically when the checkout session is completed
    // We'll handle saving the subscription_id via webhook (checkout.session.completed event)

    console.log(`✅ Connectivity fee checkout session created for tenant ${tenantId}: ${checkoutSession.id}`);

    return NextResponse.json({
      success: true,
      isFoundingMember: false,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      customerId: customerId,
      message: 'Connectivity fee checkout session created - 365-day free trial applies',
      trialDays: 365,
      nextChargeDate: nextYearDate,
      amount: '$99.00',
      dueNow: '$0.00',
    });

  } catch (error: any) {
    console.error('❌ Error creating connectivity fee checkout session:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to create connectivity fee checkout session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

