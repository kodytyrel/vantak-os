/**
 * Email Utility for VantakOS
 * Sends transactional emails using Supabase Edge Functions or SMTP
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send Pioneer Confirmation Email
 * Notifies founding members that their connectivity fee has been waived for life
 */
export async function sendPioneerConfirmationEmail(
  email: string,
  foundingMemberNumber: number,
  businessName: string
): Promise<{ success: boolean; error?: string }> {
  const subject = '🏆 Welcome to VantakOS - You are a Pioneer!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to VantakOS - Pioneer Status</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #0f172a; background-color: #f8fafc; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background-color: #0f172a; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: #ffffff; font-size: 28px; font-weight: 900;">V</span>
          </div>
          <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em;">Vantak<span style="color: #0ea5e9;">OS</span></h1>
        </div>

        <!-- Pioneer Badge -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border: 2px solid #fbbf24; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 40px; box-shadow: 0 10px 25px rgba(14, 165, 233, 0.2);">
          <div style="font-size: 48px; margin-bottom: 12px;">⭐</div>
          <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 8px 0;">PIONEER #${foundingMemberNumber}</h2>
          <p style="color: #fbbf24; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Founding Member</p>
        </div>

        <!-- Main Content -->
        <div style="margin-bottom: 40px;">
          <p style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 20px;">
            Congratulations, ${businessName}!
          </p>
          
          <p style="font-size: 16px; color: #475569; margin-bottom: 20px; line-height: 1.7;">
            You're one of the first 100 businesses to join VantakOS, and as a Founding Member, we have incredible news for you.
          </p>

          <!-- Zero Dollar Invoice Box -->
          <div style="background-color: #f1f5f9; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 24px; margin: 30px 0;">
            <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">📧 Zero Dollar Invoice - Connectivity Fee</h3>
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 14px;">Annual Connectivity Fee:</span>
                <span style="color: #64748b; font-size: 14px; font-weight: 600;">$99.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 14px;">Pioneer Lifetime Waiver:</span>
                <span style="color: #10b981; font-size: 14px; font-weight: 700;">-$99.00</span>
              </div>
              <div style="border-top: 2px solid #cbd5e1; padding-top: 12px; margin-top: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #0f172a; font-size: 18px; font-weight: 800;">Total Due:</span>
                  <span style="color: #0f172a; font-size: 24px; font-weight: 900;">$0.00</span>
                </div>
              </div>
            </div>
          </div>

          <p style="font-size: 16px; color: #475569; margin-bottom: 20px; line-height: 1.7; font-weight: 600;">
            Your Connectivity Fee has been waived for life. You are Pioneer #${foundingMemberNumber}. Welcome to VantakOS.
          </p>

          <p style="font-size: 16px; color: #475569; margin-bottom: 20px; line-height: 1.7;">
            This means you'll never pay annual subscription fees—just transaction fees as you grow. Your Pioneer Badge is now visible in your dashboard, and you'll enjoy lifetime access to all core features.
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_URL || 'https://vantak.app'}/dashboard" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 32px; border-radius: 8px; letter-spacing: 0.01em;">
            Open Your Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; margin-top: 40px; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0;">
            <strong>VantakOS</strong> - We handle the business, so you can focus on the craft.
          </p>
          <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
            This is an automated confirmation. You're receiving this because you're a Founding Member of VantakOS.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🏆 Welcome to VantakOS - You are a Pioneer!

Congratulations, ${businessName}!

You're one of the first 100 businesses to join VantakOS, and as a Founding Member, we have incredible news for you.

ZERO DOLLAR INVOICE - CONNECTIVITY FEE
Annual Connectivity Fee: $99.00
Pioneer Lifetime Waiver: -$99.00
─────────────────────────────
Total Due: $0.00

Your Connectivity Fee has been waived for life. You are Pioneer #${foundingMemberNumber}. Welcome to VantakOS.

This means you'll never pay annual subscription fees—just transaction fees as you grow. Your Pioneer Badge is now visible in your dashboard, and you'll enjoy lifetime access to all core features.

Open Your Dashboard: ${process.env.NEXT_PUBLIC_URL || 'https://vantak.app'}/dashboard

─────────────────────────────────
VantakOS - We handle the business, so you can focus on the craft.
This is an automated confirmation. You're receiving this because you're a Founding Member of VantakOS.
  `.trim();

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Generic Email Sending Function
 * Uses environment variables to determine email service provider
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if we have an email API endpoint configured
    const emailApiUrl = process.env.EMAIL_API_URL || process.env.SUPABASE_URL + '/functions/v1/send-email';
    
    // For now, we'll use a simple fetch to an email API
    // In production, you might use Resend, SendGrid, AWS SES, or Supabase Edge Functions
    
    // Option 1: Use Resend (recommended for production)
    if (process.env.RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'VantakOS <noreply@vantak.app>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.json();
        console.error('Resend API error:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      const data = await resendResponse.json();
      console.log('✅ Email sent via Resend:', data.id);
      return { success: true };
    }

    // Option 2: Use Supabase Edge Function (if configured)
    if (process.env.SUPABASE_FUNCTIONS_URL) {
      const supabaseResponse = await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!supabaseResponse.ok) {
        const error = await supabaseResponse.json();
        console.error('Supabase Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      console.log('✅ Email sent via Supabase Edge Function');
      return { success: true };
    }

    // Option 3: Fallback - log email content (for development)
    console.log('📧 Email would be sent (no email service configured):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html.substring(0, 200) + '...');
    
    // In development, we might want to actually send via SMTP or skip
    // For now, return success so the flow continues
    return { success: true };

  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

