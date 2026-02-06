import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin for secure database access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vision, email, tenantSlug } = body;

    // Validate input
    if (!vision || !vision.trim()) {
      return NextResponse.json(
        { error: 'Vision description is required', success: false },
        { status: 400 }
      );
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required', success: false },
        { status: 400 }
      );
    }

    // Insert lead into database
    const { data, error } = await supabaseAdmin
      .from('custom_leads')
      .insert([
        {
          vision: vision.trim(),
          email: email.trim().toLowerCase(),
          tenant_slug: tenantSlug || null,
          status: 'new',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting custom lead:', error);
      return NextResponse.json(
        { error: 'Failed to submit inquiry. Please try again.', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: data.id,
      message: 'Inquiry submitted successfully',
    });

  } catch (error: any) {
    console.error('Custom Leads API Error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again or contact Support@vantakos.com',
        success: false,
      },
      { status: 500 }
    );
  }
}

