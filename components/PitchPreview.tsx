
import React from 'react';
import { motion } from 'framer-motion';
import { TenantConfig } from '../types';
import { MobilePreview } from './MobilePreview';
import { VANTAK } from '../constants';

interface PitchPreviewProps {
  tenant: TenantConfig;
}

export const PitchPreview: React.FC<PitchPreviewProps> = ({ tenant }) => {
  const valueCards = [
    {
      title: "Direct Home Screen App",
      description: `Your customers install ${tenant.name} as a native app directly from Safari/Chrome. Zero App Store friction.`,
      icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    },
    {
      title: "Pay As You Grow",
      description: `No monthly software bills. Vantak only takes ${tenant.platform_fee_percent}% when a customer actually pays you.`,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Secure Payouts",
      description: "Bookings flow through our Stripe Connect partnership. Funds hit your bank account automatically in 2 days.",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355r"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-brand overflow-x-hidden relative">
      {/* Immersive Brand Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          {...({ animate: { scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }, transition: { duration: 10, repeat: Infinity }, className: "absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[140px]", style: { backgroundColor: tenant.primaryColor } } as any)}
        />
        <motion.div 
          {...({ animate: { scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }, transition: { duration: 15, repeat: Infinity, delay: 1 }, className: "absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px]", style: { backgroundColor: VANTAK.theme.accent } } as any)}
        />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
        <motion.div 
          {...({ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, className: "text-center mb-24 space-y-8" } as any)}
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            VantakOS | Instance Preview
          </div>
          <h1 className="text-6xl md:text-[7rem] font-black text-slate-900 tracking-tighter leading-[0.8] max-w-5xl">
            Hey <span style={{ color: tenant.primaryColor }}>{tenant.name.split(' ')[0]}</span>,<br/> 
            I built this for you.
          </h1>
          <p className="text-slate-500 text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
            Your brand, your customers, your data. <br/> One platform to rule your business.
          </p>
        </motion.div>

        {/* Centerpiece Phone Frame */}
        <div className="mb-32 relative">
          <div className="absolute -inset-16 bg-white/20 backdrop-blur-[100px] rounded-[6rem] border border-white/40 scale-110 pointer-events-none shadow-[0_60px_100px_-20px_rgba(0,0,0,0.1)]" />
          <MobilePreview 
            brandingConfig={{
              businessName: tenant.name,
              primaryColor: tenant.primaryColor,
              logoUrl: tenant.logoUrl
            }} 
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 whitespace-nowrap">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
            Interactive Operating System
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10 w-full mb-32">
          {valueCards.map((card, i) => (
            <motion.div
              key={card.title}
              {...({ initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.15 }, className: "bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:shadow-2xl transition-all" } as any)}
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-sky-400 mb-8 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">{card.title}</h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          {...({ initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, className: "w-full bg-slate-900 rounded-[5rem] p-16 md:p-32 text-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(15,23,42,0.4)]" } as any)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-brand-primary/10 opacity-40" />
          
          <div className="relative z-10 space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
                Own your success.
              </h2>
              <p className="text-slate-400 text-2xl font-medium max-w-2xl mx-auto">
                No setup fees. No monthly bills. Claim your OS and start taking payments today.
              </p>
            </div>
            
            <button 
              onClick={() => window.location.pathname = '/claim'}
              className="group relative inline-flex items-center gap-8 bg-sky-400 text-slate-900 px-16 py-10 rounded-[3rem] font-black text-3xl shadow-[0_30px_60px_-10px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all overflow-hidden"
            >
              <span className="relative z-10">CLAIM {tenant.name.toUpperCase()}</span>
              <svg className="w-10 h-10 relative z-10 group-hover:translate-x-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </motion.div>

        <footer className="mt-32 text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] text-center">
          Handcrafted by {VANTAK.parentCompany} • {VANTAK.productName} Core
        </footer>
      </main>
    </div>
  );
};
