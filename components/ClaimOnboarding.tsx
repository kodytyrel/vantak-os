
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '../types';
import { supabase } from '../services/supabase';
import { VANTAK } from '../constants';

interface ClaimOnboardingProps {
  tenant: TenantConfig;
}

type OnboardingStep = 'identity' | 'account' | 'bank';

export const ClaimOnboarding: React.FC<ClaimOnboardingProps> = ({ tenant }) => {
  const [step, setStep] = useState<OnboardingStep>('identity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [brandColor, setBrandColor] = useState(tenant.primaryColor);

  const handleIdentitySubmit = () => setStep('account');
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('bank');
  };

  const handleFinalOnboard = async () => {
    if (!agreed) return;
    setIsSubmitting(true);

    try {
      // 1. Transition tenant to LIVE state in the Truth database
      // NOTE: We do NOT create Stripe account here - only when user explicitly enables payments
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          is_demo: false,
          primary_color: brandColor, // Mapping to SQL primary_color
          contactEmail: email,       // Tracking owner email
          // stripe_account_id remains NULL until user clicks "Enable Payments"
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      // 2. Redirect to dashboard (no Stripe onboarding - user can enable payments later)
      window.location.href = `/${tenant.slug}`;
    } catch (err: any) {
      alert(`VantakOS Activation Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-brand flex flex-col items-center">
      <header className="w-full px-8 py-6 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-black text-sm">V</div>
          <span className="font-black text-slate-900 tracking-tight">Vantak<span className="text-sky-500">OS</span> Activation</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
          Instance: {tenant.slug}
        </div>
      </header>

      <div className="max-w-2xl w-full px-6 py-20 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <motion.div key="identity" {...({ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "space-y-10" } as any)}>
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Confirm Brand.</h1>
                <p className="text-slate-500 font-medium italic text-lg">"Your custom OS is ready for live traffic."</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl space-y-8">
                <div className="flex items-center gap-6">
                  <img src={tenant.logoUrl} className="w-20 h-20 rounded-2xl object-contain bg-slate-50 border p-2" />
                  <div>
                    <h3 className="text-2xl font-black">{tenant.name}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400">SLUG: {tenant.slug}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <label className="text-[10px] font-black uppercase text-slate-400">Final Color Choice</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
                    <span className="text-xs font-mono font-bold uppercase">{brandColor}</span>
                  </div>
                </div>
                <button onClick={handleIdentitySubmit} className="w-full bg-[#0F172A] text-white py-6 rounded-2xl font-black uppercase shadow-xl">Confirm & Next</button>
              </div>
            </motion.div>
          )}

          {step === 'account' && (
            <motion.div key="account" {...({ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "space-y-10" } as any)}>
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-black tracking-tighter leading-none">Secure Access.</h1>
                <p className="text-slate-500 font-medium">Create your administrative credentials.</p>
              </div>
              <form onSubmit={handleAccountSubmit} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl space-y-6">
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none" placeholder="Email Address" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none" placeholder="Password" />
                <button type="submit" className="w-full bg-sky-500 text-white py-6 rounded-2xl font-black uppercase shadow-xl">Create Account</button>
              </form>
            </motion.div>
          )}

          {step === 'bank' && (
            <motion.div key="bank" {...({ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "space-y-10" } as any)}>
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-black tracking-tighter leading-none">Go Live.</h1>
                <p className="text-slate-500 font-medium">Activate your VantakOS instance.</p>
              </div>
              <div className="bg-[#0F172A] p-12 rounded-[3.5rem] text-white shadow-2xl space-y-8">
                 <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Platform Fee</span>
                       <span className="text-sm font-black text-sky-500">{VANTAK.fees.starter}%</span>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                        💡 <strong className="text-slate-300">Payment Setup:</strong> You can enable payments anytime from your dashboard. 
                        Stripe charges only apply when you are actively processing payouts.
                      </p>
                    </div>
                 </div>
                 <div onClick={() => setAgreed(!agreed)} className="flex gap-4 p-4 cursor-pointer hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10">
                    <div className={`w-6 h-6 rounded-lg border-2 shrink-0 ${agreed ? 'bg-sky-500 border-sky-500' : 'border-slate-600'}`} />
                    <p className="text-[9px] font-black uppercase text-slate-400">Agree to Platform Terms</p>
                 </div>
                 <button onClick={handleFinalOnboard} disabled={!agreed || isSubmitting} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-sm shadow-2xl">
                    {isSubmitting ? "Igniting..." : "Go Live on Vantak"}
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
