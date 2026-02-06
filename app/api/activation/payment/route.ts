import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeType, email, businessName, slug } = body;

    if (!challengeType || !email || !businessName || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeType, email, businessName, slug' },
        { status: 400 }
      );
    }

    // Determine deposit amount based on challenge type
    // Note: Pioneer status is checked client-side, so amounts come from frontend
    const depositAmount = challengeType === 'elite' ? 
      (body.isPioneer ? 15000 : 25000) : // $150 or $250 in cents
      (body.isPioneer ? 0 : 10000); // $0 (waived) or $100 in cents

    // If deposit is waived (pioneer with starter challenge), return success
    if (depositAmount === 0) {
      return NextResponse.json({
        sessionId: 'waived',
        url: null,
        depositAmount: 0,
        challengeType,
      });
    }

    // Create Stripe Checkout Session for activation deposit
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VantakOS Activation - ${challengeType === 'elite' ? 'Elite Challenge' : 'Starter Challenge'}`,
              description: `Activation deposit for ${businessName}. Process the same amount in your first 30 days to receive a full refund.`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        businessName,
        slug,
        challengeType,
        isPioneer: body.isPioneer ? 'true' : 'false',
        type: 'activation_deposit',
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://vantakos.com'}/signup?session_id={CHECKOUT_SESSION_ID}&challenge_type=${challengeType}&slug=${slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://vantakos.com'}/signup?step=4&slug=${slug}`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      depositAmount: depositAmount / 100, // Convert cents to dollars
      challengeType,
    });
  } catch (error: any) {
    console.error('Activation Payment Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session', details: error.message },
      { status: 500 }
    );
  }
}

