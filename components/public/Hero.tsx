
import React from 'react';
import { motion } from 'framer-motion';
import { TenantConfig } from '../../types';

interface HeroProps {
  tenant: TenantConfig;
  onBookNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ tenant, onBookNow }) => {
  const backgroundImageUrl = (tenant as any).background_image_url;
  const hasBackground = !!backgroundImageUrl;

  return (
    <section className={`${hasBackground ? '' : 'bg-white'} py-20 md:py-32 relative`} style={hasBackground ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}>
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <motion.div
          {...({ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.2, duration: 0.6 } } as any)}
        >
          {tenant.logoUrl ? (
            <div className={`${hasBackground ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-white border border-slate-200'} rounded-lg inline-block p-3 mb-8`}>
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name} 
                className="w-20 h-20 rounded-lg mx-auto object-cover"
                onError={(e) => {
                  console.error('Logo failed to load:', tenant.logoUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully:', tenant.logoUrl);
                }}
              />
            </div>
          ) : (
            <div className="mb-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-2xl">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <h1 className={`text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9] ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
            {tenant.name}
          </h1>
          <p className={`text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed mb-10 ${hasBackground ? 'text-white/90' : 'text-slate-600'}`}>
            {tenant.seo.description}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={onBookNow}
              className={`px-10 py-5 rounded-lg font-semibold text-lg transition-all ${
                hasBackground 
                  ? 'bg-white/20 backdrop-blur-lg border border-white/30 text-white hover:bg-white/30' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {tenant.business_type === 'education' ? 'Schedule Lesson' : tenant.business_type === 'retail' ? 'Browse Catalog' : 'Start Booking'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
