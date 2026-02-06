
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenantId } = req.body;

  try {
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('stripe_account_id')
      .eq('id', tenantId)
      .single();

    if (!tenant?.stripe_account_id) {
      return res.status(400).json({ error: 'No Stripe account linked' });
    }

    const loginLink = await stripe.accounts.createLoginLink(tenant.stripe_account_id);
    return res.status(200).json({ url: loginLink.url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
