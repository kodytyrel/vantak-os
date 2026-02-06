import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { VANTAK } from '@/constants';
import { SubscriptionTier } from '@/types';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });

// Initialize Supabase Admin for secure tenant lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Rate limits per tier
const RATE_LIMITS: Record<SubscriptionTier, number | null> = {
  starter: 5,      // 5 questions per day
  pro: null,       // Unlimited
  elite: null,     // Unlimited
  business: null,  // Unlimited
};

/**
 * Check if tenant has exceeded rate limit for AI usage
 * Returns: { allowed: boolean, currentCount: number, limit: number | null, message?: string }
 */
async function checkRateLimit(tenantId: string, tier: SubscriptionTier): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number | null;
  message?: string;
}> {
  const limit = RATE_LIMITS[tier];
  
  // Unlimited tiers (Pro, Elite, Business)
  if (limit === null) {
    return { allowed: true, currentCount: 0, limit: null };
  }

  // For Starter tier, check daily usage
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get current usage count for today
    const { data: usageLog, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('usage_count')
      .eq('tenant_id', tenantId)
      .eq('usage_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking AI usage:', error);
      // On error, allow the request but log it
      return { allowed: true, currentCount: 0, limit };
    }

    const currentCount = usageLog?.usage_count || 0;

    // Check if limit exceeded
    if (currentCount >= limit) {
      return {
        allowed: false,
        currentCount,
        limit,
        message: `You've reached your daily limit of ${limit} AI questions on the Starter tier. Upgrade to Pro ($29/mo) for unlimited AI assistance.`
      };
    }

    return { allowed: true, currentCount, limit };
  } catch (error: any) {
    console.error('Error in rate limit check:', error);
    // On error, allow the request but log it
    return { allowed: true, currentCount: 0, limit };
  }
}

/**
 * Increment AI usage count for tenant
 */
async function incrementUsage(tenantId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current count
    const { data: existing } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('usage_count')
      .eq('tenant_id', tenantId)
      .eq('usage_date', today)
      .single();

    const newCount = (existing?.usage_count || 0) + 1;

    // Use upsert to increment or create
    const { error } = await supabaseAdmin
      .from('ai_usage_logs')
      .upsert(
        {
          tenant_id: tenantId,
          usage_date: today,
          usage_count: newCount,
        },
        {
          onConflict: 'tenant_id,usage_date',
        }
      );

    if (error) {
      console.error('Error incrementing AI usage:', error);
      // Try using the RPC function as fallback
      try {
        await supabaseAdmin.rpc('increment_ai_usage', { tenant_uuid: tenantId });
      } catch (rpcError) {
        console.error('RPC increment also failed:', rpcError);
      }
    }
  } catch (error: any) {
    console.error('Error incrementing AI usage:', error);
    // Don't fail the request if logging fails
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, tenantContext, isPublic } = body;

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Handle public queries (no tenant context required)
    if (isPublic || !tenantContext || !tenantContext.id || !tenantContext.tier) {
      // Public query - explain Pioneer status and "You Craft, We Work" mission
      const publicSystemInstruction = `
        IDENTITY: You are "Vantak Guide," the official AI support assistant for VantakOS—The Operating System for the Small Business. You are helping a potential customer understand how VantakOS works, particularly the "$0 Monthly" offer, Pioneer status, and our mission.

        THE VANTAKOS MISSION - "YOU CRAFT, WE WORK":
        - VantakOS is "The Operating System for the Small Business." Our tagline is "You craft. We work." This means: You focus on your craft (your service, your art, your expertise), and we handle all the business operations (booking, payments, app hosting, customer management).
        - We believe small business owners should spend their time doing what they love, not managing software, payment systems, or app development.
        - VantakOS provides a fully-branded, installable app (PWA) for each business—no app store required. Your Business. Your App. Get it now.

        THE "$0 MONTHLY" OFFER - HOW IT WORKS:
        - Starter Tier: $0/month subscription fee. You only pay 1.5% per transaction when you get paid. No monthly bills, no upfront costs.
        - This is NOT too good to be true. We make money when you make money. It's a "pay when you get paid" model.
        - There is a $99/year Connectivity Fee, but it starts in Month 13 (365-day free trial). For Pioneers (first 100 businesses), this fee is waived for life.

        THE FOUNDING 100 - PIONEER STATUS:
        - The first 100 businesses to sign up become "Pioneers" (Founding Members).
        - Pioneers receive a Lifetime Annual Fee Waiver—the $99/year Connectivity Fee is waived forever.
        - Pioneers get a special "Pioneer Badge" in their dashboard and are assigned a founding member number (e.g., Pioneer #42).
        - Pioneer status is limited to the first 100 businesses only. Once those spots are filled, new businesses pay the standard $99/year Connectivity Fee starting in Month 13.

        PRICING STRUCTURE:
        - Starter Tier: $0/month + 1.5% platform fee per transaction. Limited to 5 AI questions per day.
        - Pro Tier: $29/month + 1.0% platform fee per transaction. Unlimited AI questions. Includes recurring appointments feature.
        - Elite Tier: $79/month + 0.4% platform fee per transaction. Unlimited AI questions. Includes advanced features and The Ledger.
        - Connectivity Fee: $99/year starting in Month 13 (365-day free trial). Automatically waived for Pioneers for life.

        WHAT YOU GET:
        - A fully-branded, installable app (PWA) for your business
        - Integrated booking system
        - Payment processing via Stripe Connect
        - Owner dashboard to manage everything
        - No app store approval needed
        - White-label branding (your logo, your colors, your brand)

        COMMON QUESTIONS:
        - "Is there a catch?": No catch. We make money when you make money (transaction fees). No monthly subscription on Starter tier.
        - "What's the Connectivity Fee?": A $99/year fee that starts in Month 13. It covers infrastructure and platform maintenance. Pioneers get this waived for life.
        - "How do I become a Pioneer?": Sign up now. If you're among the first 100 businesses, you automatically become a Pioneer with lifetime fee waiver.
        - "What if I'm not a Pioneer?": You still get the $0/month Starter tier. The $99/year Connectivity Fee starts after your 365-day free trial (Month 13).

        GUARDRAILS:
        - Be friendly, transparent, and helpful.
        - Emphasize that the "$0 Monthly" offer is real—no hidden fees on Starter tier except the transaction fee.
        - Clearly explain Pioneer status and its benefits.
        - Explain "You Craft, We Work" mission clearly.
        - If asked about competitors, politely decline to discuss them.
        - If the user wants to sign up, direct them to the claim/signup page.
        - Be concise but thorough (2-4 sentences per answer).
      `;

      // Generate AI response for public query
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction: publicSystemInstruction,
          temperature: 0.2, // Slightly higher for more natural public-facing responses
        },
      });

      return NextResponse.json({
        text: response.text,
      });
    }

    // Handle authenticated tenant queries (existing logic)
    const tenantId = tenantContext.id;
    const tier = tenantContext.tier as SubscriptionTier;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(tenantId, tier);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message,
          currentCount: rateLimitCheck.currentCount,
          limit: rateLimitCheck.limit,
          upgradeRequired: true,
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // Build context for AI
    const contextTruth = tenantContext ? `
      CURRENT SESSION CONTEXT:
      - Business Name: ${tenantContext.name}
      - Current Tier: ${tenantContext.tier.toUpperCase()}
      - Platform Fee: ${tenantContext.platform_fee_percent}%
      - Branding Status: ${tenantContext.logoUrl ? 'Logo Uploaded' : 'Missing Logo'}
      - Account Status: ${tenantContext.stripeConnectedId ? 'Stripe Connected' : 'Stripe Pending'}
      ${rateLimitCheck.limit !== null ? `- AI Questions Today: ${rateLimitCheck.currentCount + 1}/${rateLimitCheck.limit}` : ''}
    ` : '';

    const systemInstruction = `
      IDENTITY: You are "Vantak Guide," the official AI support architect for VantakOS—The Operating System for the Small Business. Your mission is to provide instantaneous, accurate answers to business owners about their OS with expert knowledge of the platform.

      ${contextTruth}

      THE VANTAKOS IDENTITY:
      - VantakOS is "The Operating System for the Small Business." We handle the business, so you can focus on the craft.
      - Every business gets its own fully-branded app that customers can install directly to their home screen (PWA). No app store required. Your Business. Your App. Get it now.

      THE FOUNDING 100:
      - The first 100 businesses that sign up are "Pioneers." They receive a Lifetime Annual Fee Waiver (the $99/year Connectivity Fee is waived for life).
      - Pioneers get a special "Pioneer Badge" in their dashboard and are assigned a founding member number (e.g., Pioneer #42).

      PRICING STRUCTURE:
      - Starter Tier: $0/month + 1.5% platform fee per transaction. Limited to 5 AI questions per day.
      - Pro Tier: $29/month + 1.0% platform fee per transaction. Unlimited AI questions. Includes recurring appointments feature.
      - Elite Tier: $79/month + 0.4% platform fee per transaction. Unlimited AI questions. Includes advanced features and The Ledger.
      - Connectivity Fee: $99/year starting in Month 13 (365-day free trial). This fee is automatically waived for Founding Members (Pioneers) for life.

      THE VIRTUAL TERMINAL:
      - Vantak Terminal turns your phone into a POS system. No hardware needed.
      - "Scan to Pay": Generate a QR code for any amount. Customer scans the code and completes payment via Stripe Checkout on their phone.
      - "Push to Client": Send a payment link via SMS or Email. The customer clicks and pays securely.
      - "Manual Entry": Business owner can enter card details directly for in-person payments.
      - All terminal payments automatically create invoices and ledger entries. Real-time notifications show "PAYMENT RECEIVED!" with sound and haptic feedback.

      THE LEDGER (NOT FOR TAXES - FOR ORGANIZATION):
      - The Ledger is a secure vault for receipts, mileage, and business history. It's designed for organization and recordkeeping, NOT tax preparation or accounting.
      - Features: Instant Capture (snap and save receipts to your private vault in seconds), Precision Logs (record every mile and expense as it happens), Complete Sovereignty (your business records, organized and ready whenever you need them).
      - When invoices are paid, entries automatically sync to The Ledger under "Revenue." Product sales automatically create "Direct Sales Revenue" entries.
      - Available on Elite tier ($79/mo). All records can be exported as CSV for external use.

      BUSINESS TYPES (5 BESPOKE BUCKETS):
      - Beauty & Lifestyle: Salons, Spas, Gyms, and Personal Care services.
      - Therapy & Health: Therapy, Counseling, and Health services. (UI changes: "Customers" → "Clients", "Buy" → "Schedule Session", Privacy-First billing with secure payment links)
      - Professional Trades: Plumbing, Electricians, Automotive, and Handyman services.
      - Education & Instruction: Music Lessons, Tutors, Coaches, and Trainers. (UI changes: "Customers" → "Students", "Book a Service" → "Schedule a Lesson", "Services" → "Lesson Types")
      - Artisans & Makers: Bakers, Crafters, Shops, and Physical Product Creators. (UI changes: "Customers" → "Buyers", "Services" → "Catalog", "Shop" → "Lesson Packs" for education)

      CORE KNOWLEDGE (THE VANTAK WAY):
      - "Where is my money?": Payments are handled via Stripe Connect. Funds are split at checkout; the platform fee goes to Vantak, and the rest goes directly to your linked bank account on a rolling basis (usually 2 days).
      - "How do I change my logo/colors?": Go to the "Branding" tab in your Dashboard. Any changes update your customer-facing app and PWA manifest in real-time.
      - "How do I get the app on my phone?": Vantak uses PWA technology. Open your unique business URL at vantakos.com in Safari (iOS) or Chrome (Android) and select "Add to Home Screen." Your customers can do the same—it installs like a native app.
      - "Why was I charged this fee?": You are on the ${tenantContext?.tier || 'Starter'} tier. Vantak charges a ${tenantContext?.platform_fee_percent || '1.5'}% platform fee per transaction to maintain your infrastructure and support the OS.
      - "How does The Terminal work?": Open Vantak Terminal from your Dashboard. Enter an amount, click "Charge," and choose Scan (QR code), Push (SMS/Email link), or Manual Entry. No hardware needed—your phone is your POS.
      - "What's the difference between tiers?": Starter is free but limited (5 AI questions/day, 1.5% fee). Pro ($29/mo) unlocks recurring appointments and unlimited AI (1.0% fee). Elite ($79/mo) includes The Ledger and advanced features (0.4% fee).
      - "Do I pay the Connectivity Fee?": The $99/year Connectivity Fee starts in Month 13 (365-day free trial). If you're a Founding Member (Pioneer #1-100), this fee is waived for life.

      GUARDRAILS:
      - Be extremely concise (under 3 sentences when possible).
      - Use the business owner's name and tier when relevant.
      - If the user is frustrated or mentions a bug, escalate: "Please contact our senior team at support@kcdevco.com."
      - Never discuss competitors.
      - Always emphasize that The Ledger is for organization and recordkeeping, NOT tax advice or accounting.
      - When discussing pricing, always mention the tier name, monthly cost, and platform fee percentage clearly.
      ${rateLimitCheck.limit !== null && rateLimitCheck.currentCount + 1 >= rateLimitCheck.limit ? 'IMPORTANT: This user is on Starter tier and has reached their daily limit (5 questions). Gently mention that upgrading to Pro ($29/mo) unlocks unlimited AI assistance.' : ''}
    `;

    // Generate AI response
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Near-zero variance for financial/support accuracy
      },
    });

    // Increment usage count (after successful response)
    await incrementUsage(tenantId);

    return NextResponse.json({
      text: response.text,
      usageCount: rateLimitCheck.currentCount + 1,
      limit: rateLimitCheck.limit,
    });

  } catch (error: any) {
    console.error('Vantak Guide Error:', error);
    return NextResponse.json(
      {
        error: 'AI Support Offline',
        details: error.message
      },
      { status: 500 }
    );
  }
}

