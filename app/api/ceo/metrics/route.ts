import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
  try {
    // Check authorization via header (you can enhance this with proper auth)
    const authHeader = request.headers.get('authorization');
    // For now, we'll skip auth check here and rely on page-level check
    // In production, add proper JWT/session validation

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total Ecosystem Volume (TEV) - Sum of all successful transactions
    const { data: allInvoices } = await supabaseServiceRole
      .from('invoices')
      .select('total_amount, amount, status, created_at')
      .eq('status', 'paid');
    
    const totalVolume = allInvoices?.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.total_amount?.toString() || invoice.amount?.toString() || '0') || 0;
      return sum + amount;
    }, 0) || 0;

    // 2. Daily Velocity - Total volume in last 24 hours
    const { data: last24hInvoices } = await supabaseServiceRole
      .from('invoices')
      .select('total_amount, amount, status, created_at')
      .eq('status', 'paid')
      .gte('created_at', last24Hours.toISOString());
    
    const dailyVelocity = last24hInvoices?.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.total_amount?.toString() || invoice.amount?.toString() || '0') || 0;
      return sum + amount;
    }, 0) || 0;

    // 3. Daily Average - 7-day rolling average
    const { data: last7dInvoices } = await supabaseServiceRole
      .from('invoices')
      .select('total_amount, amount, status, created_at')
      .eq('status', 'paid')
      .gte('created_at', last7Days.toISOString());
    
    const sevenDayTotal = last7dInvoices?.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.total_amount?.toString() || invoice.amount?.toString() || '0') || 0;
      return sum + amount;
    }, 0) || 0;
    const dailyAverage = sevenDayTotal / 7;

    // 4. Activation Ledger
    const { data: tenantsData } = await supabaseServiceRole
      .from('tenants')
      .select('deposit_paid, deposit_status, challenge_status');
    
    // Total Deposits Held (Vault) - paid or pending
    const vaultTotal = tenantsData?.reduce((sum, tenant) => {
      const status = tenant.deposit_status || tenant.challenge_status;
      if (status === 'paid' || status === 'pending') {
        return sum + (parseFloat(tenant.deposit_paid?.toString() || '0') || 0);
      }
      return sum;
    }, 0) || 0;

    // Total Deposits Refunded (Win)
    const refundedTotal = tenantsData?.reduce((sum, tenant) => {
      const status = tenant.deposit_status || tenant.challenge_status;
      if (status === 'refunded') {
        return sum + (parseFloat(tenant.deposit_paid?.toString() || '0') || 0);
      }
      return sum;
    }, 0) || 0;

    // Total Deposits Credited (Fail-Safe)
    const creditedTotal = tenantsData?.reduce((sum, tenant) => {
      const status = tenant.deposit_status || tenant.challenge_status;
      if (status === 'credited') {
        return sum + (parseFloat(tenant.deposit_paid?.toString() || '0') || 0);
      }
      return sum;
    }, 0) || 0;

    // 5. Tenant Health Data
    const { data: allTenants } = await supabaseServiceRole
      .from('tenants')
      .select('id, business_name, slug, created_at, challenge_type, deposit_paid, deposit_status, challenge_status')
      .order('created_at', { ascending: false });

    // Get volume per tenant
    const tenantHealthPromises = (allTenants || []).map(async (tenant) => {
      const { data: tenantInvoices } = await supabaseServiceRole
        .from('invoices')
        .select('total_amount, amount, status')
        .eq('status', 'paid')
        .eq('tenant_id', tenant.id);
      
      const tenantVolume = tenantInvoices?.reduce((sum, invoice) => {
        const amount = parseFloat(invoice.total_amount?.toString() || invoice.amount?.toString() || '0') || 0;
        return sum + amount;
      }, 0) || 0;

      const challengeType = tenant.challenge_type || 'starter';
      const goal = challengeType === 'elite' ? 250 : 100;
      const deposit = parseFloat(tenant.deposit_paid?.toString() || '0') || 0;
      const progress = goal > 0 ? Math.min((tenantVolume / goal) * 100, 100) : 0;

      return {
        id: tenant.id,
        businessName: tenant.business_name,
        slug: tenant.slug,
        signupDate: tenant.created_at,
        totalVolume: tenantVolume,
        challengeProgress: progress,
        challengeGoal: goal,
        depositAmount: deposit,
        depositStatus: tenant.deposit_status || tenant.challenge_status || 'pending',
      };
    });

    const tenantHealth = await Promise.all(tenantHealthPromises);

    return NextResponse.json({
      totalEcosystemVolume: totalVolume,
      dailyVelocity: dailyVelocity,
      dailyAverage: dailyAverage,
      activationLedger: {
        vault: vaultTotal,
        refunded: refundedTotal,
        credited: creditedTotal,
      },
      tenantHealth: tenantHealth,
    });

  } catch (error: any) {
    console.error('Failed to fetch CEO metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}
