import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, subscription } = body;

    if (!tenantId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Missing tenantId or subscription data' },
        { status: 400 }
      );
    }

    // Store push subscription in Supabase
    // Note: You may want to create a 'push_subscriptions' table
    // For now, we'll store it in a simple table
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        tenant_id: tenantId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint',
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


