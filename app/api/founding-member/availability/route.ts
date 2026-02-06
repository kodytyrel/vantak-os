import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const FOUNDING_MEMBER_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    // Count founding members (those with is_founding_member = true)
    // If column doesn't exist, count all non-demo tenants as potential founding members
    const { count: foundingCount, error: foundingError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_founding_member', true);

    // If column doesn't exist, fall back to counting all non-demo tenants
    let currentFoundingMembers = 0;
    if (foundingError && foundingError.message.includes('is_founding_member')) {
      // Column doesn't exist - count all non-demo tenants
      const { count: totalCount, error: totalError } = await supabaseAdmin
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_demo', false);
      
      if (totalError) {
        console.error('Error counting tenants:', totalError);
        return NextResponse.json(
          { error: 'Failed to check founding member availability' },
          { status: 500 }
        );
      }
      currentFoundingMembers = totalCount || 0;
    } else if (foundingError) {
      console.error('Error counting founding members:', foundingError);
      return NextResponse.json(
        { error: 'Failed to check founding member availability' },
        { status: 500 }
      );
    } else {
      currentFoundingMembers = foundingCount || 0;
    }

    const remainingSpots = Math.max(0, FOUNDING_MEMBER_LIMIT - currentFoundingMembers);
    const isAvailable = remainingSpots > 0;

    return NextResponse.json({
      isAvailable,
      remainingSpots,
      currentFoundingMembers,
      limit: FOUNDING_MEMBER_LIMIT,
    });
  } catch (err: any) {
    console.error('Founding member availability check error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
