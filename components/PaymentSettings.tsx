
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TenantConfig } from '../types';

interface PaymentSettingsProps {
  tenant: TenantConfig;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ tenant }) => {
  const [loading, setLoading] = useState(false);
  const isConnected = !!tenant.stripeConnectedId || (tenant as any).stripe_account_id;

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Use the new enable-payments endpoint that only creates account when explicitly requested
      const res = await fetch('/api/stripe/enable-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json();
      if (data.url) {
        // Redirect to Stripe onboarding
        // When they return, the dashboard will check for onboarding_complete param
        // and automatically trigger subscription creation (if not founding member)
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Failed to enable payments: ${data.error}`);
        setLoading(false);
      }
      // Don't set loading to false here - we're redirecting away
    } catch (err) {
      console.error(err);
      alert('Failed to enable payments. Please try again.');
      setLoading(false);
    }
  };

  const handleViewDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-sm border border-slate-100" } as any)}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Payout Destination</h3>
              <p className="text-sm text-slate-500 font-medium">Manage how you receive funds from bookings.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                Connected to Stripe
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                Awaiting Connection
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {isConnected ? (
            <button 
              onClick={handleViewDashboard}
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl"
            >
              {loading ? "Loading..." : 'Stripe Dashboard'}
            </button>
          ) : (
            <button 
              onClick={handleConnect}
              disabled={loading}
              className="bg-sky-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-sky-700 transition-all shadow-xl"
            >
              {loading ? "Initializing..." : 'Connect Stripe'}
            </button>
          )}
        </div>
      </div>

      {/* BNPL Settings Section - Elite Tier Only */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
              tenant.tier === 'elite' 
                ? 'bg-purple-50 text-purple-600' 
                : 'bg-slate-100 text-slate-400'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-black text-slate-900">Buy Now, Pay Later (BNPL)</h3>
                {tenant.tier !== 'elite' && (
                  <span className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-1 rounded-full">
                    Elite Only
                  </span>
                )}
              </div>
              
              {tenant.tier === 'elite' ? (
                <>
                  <p className="text-sm text-slate-600 font-medium mb-3">
                    Enable financing options like Klarna, Affirm, and Afterpay for your customers.
                  </p>

                  {/* BNPL Toggle - Note: This is a UI toggle for future implementation */}
                  <div className="flex items-center gap-4 mb-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={true} />
                      <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-600"></div>
                      <span className="ml-3 text-sm font-black text-slate-900">Enable BNPL</span>
                    </label>
                  </div>

                  {/* Fee Transparency Note */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-black text-amber-900 mb-1">Fee Transparency</p>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                          BNPL services (Affirm/Klarna/Afterpay) carry a higher transaction fee (usually 5-6%). You can toggle these on or off in your settings. <span className="font-black">You always receive the full amount immediately</span> — your customers pay the financing fee directly to the provider.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 font-medium mb-4">
                    Unlock BNPL financing options (Klarna, Affirm, Afterpay) for your customers. Get paid in full today while customers pay over time.
                  </p>

                  {/* Upgrade Prompt */}
                  <div className="bg-gradient-to-br from-purple-50 to-sky-50 border-2 border-purple-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-black text-slate-900 mb-2">Upgrade to Elite for BNPL</h4>
                        <p className="text-sm text-slate-700 font-medium mb-4 leading-relaxed">
                          Elite tier ($79/mo) unlocks Buy Now, Pay Later financing for your customers. Get paid in full today while customers pay over time with zero risk to you.
                        </p>
                        <button
                          onClick={() => {
                            // TODO: Link to upgrade flow
                            alert('Upgrade to Elite tier to enable BNPL financing options.');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-xl"
                        >
                          Upgrade to Elite
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
