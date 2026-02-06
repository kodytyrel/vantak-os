import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPioneerConfirmationEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const FOUNDING_MEMBER_LIMIT = 100;

/**
 * SECURITY: This endpoint requires authentication via secret token
 * Only authorized server-side code should call this endpoint
 * 
 * IMPORTANT: The database trigger auto_assign_founding_member() handles automatic assignments
 * using a PostgreSQL SEQUENCE for atomic, race-condition-free numbering.
 * 
 * This API route is ONLY for manual admin assignments (e.g., correcting errors).
 * Normal signups should rely on the database trigger which uses SEQUENCE.nextval() atomically.
 */
function verifyAuthToken(req: NextRequest): boolean {
  // Option 1: Check for secret token in Authorization header
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.FOUNDING_MEMBER_SECRET_TOKEN || 'vantak_founding_100_secret_2024';
  
  if (authHeader === `Bearer ${expectedToken}`) {
    return true;
  }
  
  // Option 2: Check for token in custom header (alternative)
  const customToken = req.headers.get('x-vantak-secret');
  if (customToken === expectedToken) {
    return true;
  }
  
  // Option 3: Verify request is from server-side (same origin)
  // This is a fallback - the secret token is the primary security
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');
  
  // Allow if no origin (server-side request) or origin matches host
  if (!origin || origin.includes(host || '')) {
    // Still require secret token - this is just an additional check
    return false; // Require explicit token even for server-side
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  // SECURITY CHECK: Verify this request is from authorized server-side code
  if (!verifyAuthToken(req)) {
    console.error('🚨 SECURITY: Unauthorized attempt to assign founding member status');
    return NextResponse.json(
      { error: 'Unauthorized: This endpoint requires server-side authentication' },
      { status: 401 }
    );
  }

  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Count current founding members
    const { count, error: countError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_founding_member', true);

    if (countError) {
      console.error('Error counting founding members:', countError);
      return NextResponse.json(
        { error: 'Failed to check founding member availability' },
        { status: 500 }
      );
    }

    const currentFoundingMembers = count || 0;

    // Check if we've reached the limit
    if (currentFoundingMembers >= FOUNDING_MEMBER_LIMIT) {
      return NextResponse.json(
        { error: 'Founding member limit reached', isAvailable: false },
        { status: 403 }
      );
    }

    // First, fetch tenant details including email for sending confirmation
    const { data: tenantData, error: fetchError } = await supabaseAdmin
      .from('tenants')
      .select('id, business_name, contact_email, business_name as name')
      .eq('id', tenantId)
      .single();

    if (fetchError || !tenantData) {
      console.error('Error fetching tenant:', fetchError);
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // SECURITY: Use secured database function instead of direct UPDATE
    // This prevents client-side spoofing even if someone bypasses the API route
    // The database function enforces the 100 limit server-side
    const { data: functionResult, error: functionError } = await supabaseAdmin.rpc(
      'update_founding_member_status',
      {
        p_tenant_id: tenantId,
        p_is_founding_member: true,
        p_founding_member_number: currentFoundingMembers + 1,
      }
    );

    // If the secured function doesn't exist yet, fall back to direct update (with service role)
    // But log a warning that the secure function should be created
    let data: any = null;
    let updateError: any = null;

    if (functionError && functionError.message.includes('function') && functionError.message.includes('does not exist')) {
      console.warn('⚠️ SECURITY: update_founding_member_status function not found. Using direct update. Please run migration.');
      // Fallback: Direct update (only works with service role key)
      const foundingMemberNumber = currentFoundingMembers + 1;
      const result = await supabaseAdmin
        .from('tenants')
        .update({
          is_founding_member: true,
          founding_member_number: foundingMemberNumber,
        })
        .eq('id', tenantId)
        .select('id, is_founding_member, founding_member_number, business_name, contact_email')
        .single();
      
      data = result.data;
      updateError = result.error;
    } else if (functionError) {
      updateError = functionError;
    } else {
      // Function succeeded, fetch the updated tenant data
      const fetchResult = await supabaseAdmin
        .from('tenants')
        .select('id, is_founding_member, founding_member_number, business_name, contact_email')
        .eq('id', tenantId)
        .single();
      
      data = fetchResult.data;
      updateError = fetchResult.error;
    }

    // Extract founding member number from the updated data
    const foundingMemberNumber = data?.founding_member_number || currentFoundingMembers + 1;

    if (updateError) {
      console.error('Error assigning founding member:', updateError);
      // If columns don't exist, gracefully handle it
      if (updateError.message.includes('is_founding_member') || updateError.message.includes('founding_member_number')) {
        console.log('Founding member columns may not exist yet. Migration needed.');
        return NextResponse.json(
          { 
            error: 'Database schema update needed',
            message: 'Please add is_founding_member (boolean) and founding_member_number (integer) columns to tenants table',
            isAvailable: false 
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to assign founding member status' },
        { status: 500 }
      );
    }

    // Send Pioneer Confirmation Email (Zero Dollar Invoice)
    if (data.contact_email) {
      try {
        const emailResult = await sendPioneerConfirmationEmail(
          data.contact_email,
          foundingMemberNumber,
          data.business_name || 'Valued Business'
        );

        if (emailResult.success) {
          console.log(`✅ Pioneer confirmation email sent to ${data.contact_email} (Pioneer #${foundingMemberNumber})`);
        } else {
          console.warn(`⚠️ Failed to send pioneer confirmation email to ${data.contact_email}: ${emailResult.error}`);
          // Don't fail the assignment if email fails - log and continue
        }
      } catch (emailError: any) {
        console.error('❌ Error sending pioneer confirmation email:', emailError);
        // Don't fail the assignment if email fails - log and continue
      }
    } else {
      console.warn(`⚠️ No contact email found for tenant ${tenantId} - skipping pioneer confirmation email`);
    }

    // Calculate remaining spots
    const remainingSpots = FOUNDING_MEMBER_LIMIT - foundingMemberNumber;

    return NextResponse.json({
      success: true,
      isFoundingMember: true,
      foundingMemberNumber,
      remainingSpots,
      tenant: data,
      emailSent: !!data.contact_email,
    });
  } catch (err: any) {
    console.error('Founding member assignment error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

