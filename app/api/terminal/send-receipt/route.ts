import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, receiptNumber, amount, customerName, contact, method } = body;

    if (!tenantId || !receiptNumber || !contact || !method) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch tenant info
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('business_name, contact_email')
      .eq('id', tenantId)
      .single();

    const businessName = tenant?.business_name || 'Business';
    const baseUrl = process.env.NEXT_PUBLIC_URL || req.headers.get('origin') || 'http://localhost:3000';

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${receiptNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0F172A; font-size: 24px; margin-bottom: 10px;">${businessName}</h1>
          <h2 style="color: #475569; font-size: 18px; margin-bottom: 30px;">Receipt ${receiptNumber}</h2>
          
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #64748B;">Customer:</span>
              <span style="color: #0F172A; font-weight: bold;">${customerName || 'Customer'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #64748B;">Amount:</span>
              <span style="color: #0F172A; font-weight: bold;">$${amount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Date:</span>
              <span style="color: #0F172A; font-weight: bold;">${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
            Thank you for your payment!
          </p>
          <p style="color: #64748B; font-size: 12px; margin-top: 20px;">
            Powered by VantakOS
          </p>
        </body>
      </html>
    `;

    // TODO: Integrate with email service (SendGrid, Resend, etc.) or SMS service (Twilio)
    // For now, we'll just log it
    console.log(`Sending receipt ${receiptNumber} via ${method} to ${contact}`);
    console.log(`Receipt HTML: ${receiptHtml.substring(0, 200)}...`);

    // In production, you would:
    // - If method === 'email': Send email with receiptHtml
    // - If method === 'sms': Send SMS with receipt link

    return NextResponse.json({
      success: true,
      message: `Receipt sent via ${method}`,
    });
  } catch (error: any) {
    console.error('Send receipt error:', error);
    return NextResponse.json(
      { error: 'Failed to send receipt', details: error.message },
      { status: 500 }
    );
  }
}

