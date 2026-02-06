
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hero } from './public/Hero';
import { ServiceList } from './public/ServiceList';
import { ShopList } from './public/ShopList';
import { InstallBanner } from './public/InstallBanner';
import { TenantConfig, Service, Product } from '../types';

interface LandingPageProps {
  tenant: TenantConfig;
  services: Service[];
  products?: Product[];
  onBookNow: () => void;
  onSelectService: (service: Service) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  tenant, 
  services, 
  products = [],
  onBookNow, 
  onSelectService 
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'shop'>('services');

  const handleBuyNow = async (product: Product) => {
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: tenant.slug,
          amount: product.price,
          serviceName: product.name,
          customerEmail: '', // Optional - can be collected in a form
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout Error:', err);
      alert(`Payment Error: ${err.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="bg-brand-background min-h-screen">
      <InstallBanner 
        businessName={tenant.name} 
        primaryColor={tenant.primaryColor} 
        logoUrl={tenant.logoUrl}
      />
      
      <Hero tenant={tenant} onBookNow={onBookNow} />
      
      <main id="services" className="max-w-5xl mx-auto px-6 py-24 space-y-32 pb-32">
        {/* Tabs */}
        <div className="sticky top-20 z-40 bg-brand-background/80 backdrop-blur-xl pb-8">
          <div className="flex gap-4 border-b-2 border-slate-200">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-8 py-4 font-black text-lg uppercase tracking-wider transition-all relative ${
                activeTab === 'services'
                  ? 'text-slate-900'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tenant.business_type === 'education' ? 'Lesson Types' : 'Services'}
              {activeTab === 'services' && (
                <motion.div
                  {...({ layoutId: "activeTab", className: "absolute bottom-0 left-0 right-0 h-0.5", style: { backgroundColor: tenant.primaryColor }, transition: { type: 'spring', stiffness: 500, damping: 30 } } as any)}
                />
              )}
            </button>
            {tenant.features?.enableShop && (
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-8 py-4 font-black text-lg uppercase tracking-wider transition-all relative ${
                  activeTab === 'shop'
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tenant.business_type === 'education' ? 'Lesson Packs' : 'Shop'}
              {activeTab === 'shop' && (
                  <motion.div
                    {...({ layoutId: "activeTab", className: "absolute bottom-0 left-0 right-0 h-0.5", style: { backgroundColor: tenant.primaryColor }, transition: { type: 'spring', stiffness: 500, damping: 30 } } as any)}
                  />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Services View */}
        {activeTab === 'services' && (
          <div>
            <header className="mb-16">
              <motion.p 
                {...({ initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, className: "text-xs font-black uppercase tracking-[0.4em] text-brand-primary mb-3" } as any)}
              >
                Curated Experiences
              </motion.p>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                {tenant.business_type === 'education' ? 'Lesson Types' : 'Service Menu'}
              </h2>
            </header>
            <ServiceList services={services} onSelect={onSelectService} />
          </div>
        )}

        {/* Shop View */}
        {activeTab === 'shop' && tenant.features?.enableShop && (
          <div>
            <header className="mb-16">
              <motion.p 
                {...({ initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, className: "text-xs font-black uppercase tracking-[0.4em] text-brand-primary mb-3" } as any)}
              >
                {tenant.business_type === 'education' ? 'Packaged Learning' : 'Premium Products'}
              </motion.p>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                {tenant.business_type === 'education' ? 'Lesson Packs' : 'Shop'}
              </h2>
            </header>
            <ShopList
              products={products}
              onBuyNow={handleBuyNow}
              primaryColor={tenant.primaryColor}
              businessType={tenant.business_type}
            />
          </div>
        )}

        {/* Location Section */}
        <section className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Premium care in the <br/> heart of {tenant.city}.
            </h3>
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-brand border border-slate-100 shadow-sm flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent flex items-center justify-center text-brand-primary shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <p className="font-black text-slate-900">{tenant.address}</p>
                  <p className="text-slate-500 font-medium">{tenant.city}, {tenant.state}</p>
                </div>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Experience the {tenant.name} difference with professional staff and a state-of-the-art facility designed for your total relaxation.
              </p>
            </div>
          </div>
          <div className="aspect-video md:aspect-square bg-slate-100 rounded-brand shadow-inner flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-xs border-2 border-dashed border-slate-200">
            [ Interactive Map ]
          </div>
        </section>
      </main>

      {/* Mobile Sticky Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-10 py-5 flex items-center justify-around md:hidden rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1.5 text-brand-primary">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-1.5 text-slate-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">{tenant.business_type === 'education' ? 'Lessons' : 'Services'}</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Account</span>
        </button>
      </nav>
    </div>
  );
};
