/**
 * SECURITY: This endpoint processes the pioneer_email_queue table
 * Should be called by a background job or cron, NOT from client-side
 * Requires authentication token
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPioneerConfirmationEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function verifyAuthToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.FOUNDING_MEMBER_SECRET_TOKEN || 'vantak_founding_100_secret_2024';
  
  if (authHeader === `Bearer ${expectedToken}`) {
    return true;
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  // SECURITY: Verify this is an authorized server-side call
  if (!verifyAuthToken(req)) {
    console.error('🚨 SECURITY: Unauthorized attempt to process pioneer email queue');
    return NextResponse.json(
      { error: 'Unauthorized: This endpoint requires server-side authentication' },
      { status: 401 }
    );
  }

  try {
    // Fetch pending emails from queue (not yet sent)
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from('pioneer_email_queue')
      .select('*')
      .is('sent_at', null) // Only get unsent emails
      .order('created_at', { ascending: true })
      .limit(10); // Process in batches

    if (fetchError) {
      console.error('Error fetching pioneer email queue:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch email queue' },
        { status: 500 }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending emails to process',
      });
    }

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (emailRecord) => {
        try {
          // Send the pioneer confirmation email
          const emailResult = await sendPioneerConfirmationEmail(
            emailRecord.email,
            emailRecord.founding_member_number,
            emailRecord.business_name || 'Valued Business'
          );

          if (emailResult.success) {
            // Mark as sent
            await supabaseAdmin
              .from('pioneer_email_queue')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', emailRecord.id);

            console.log(`✅ Pioneer confirmation email sent to ${emailRecord.email} (Pioneer #${emailRecord.founding_member_number})`);
            return { success: true, id: emailRecord.id };
          } else {
            // Mark with error
            await supabaseAdmin
              .from('pioneer_email_queue')
              .update({ 
                error_message: emailResult.error || 'Unknown error',
                sent_at: null, // Keep as unsent for retry
              })
              .eq('id', emailRecord.id);

            console.error(`❌ Failed to send email to ${emailRecord.email}: ${emailResult.error}`);
            return { success: false, id: emailRecord.id, error: emailResult.error };
          }
        } catch (error: any) {
          // Mark with error
          await supabaseAdmin
            .from('pioneer_email_queue')
            .update({ 
              error_message: error.message || 'Unknown error',
              sent_at: null,
            })
            .eq('id', emailRecord.id);

          console.error(`❌ Error processing email for ${emailRecord.email}:`, error);
          return { success: false, id: emailRecord.id, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }),
    });

  } catch (err: any) {
    console.error('Error processing pioneer email queue:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

