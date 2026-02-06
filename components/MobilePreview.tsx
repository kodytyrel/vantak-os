
import React from 'react';
import { motion } from 'framer-motion';

interface BrandingConfig {
  primaryColor: string;
  businessName: string;
  logoUrl: string;
  backgroundImageUrl?: string;
}

interface MobilePreviewProps {
  brandingConfig: BrandingConfig;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ brandingConfig }) => {
  const { primaryColor, businessName, logoUrl, backgroundImageUrl } = brandingConfig;

  // Local style override for the phone screen to simulate the "tenant site"
  const previewStyle = {
    '--brand-primary': primaryColor,
  } as React.CSSProperties;

  return (
    <motion.div
      {...({ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.8, ease: "easeOut", y: { duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } }, className: "relative mx-auto w-full max-w-[300px]" } as any)}
    >
      {/* iPhone 15 Pro Titanium Frame */}
      <div className="relative border-[8px] border-slate-800 rounded-[3.5rem] bg-slate-900 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.35)] overflow-hidden aspect-[9/19.5] w-full ring-1 ring-slate-700/50">
        
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-3xl z-50 flex items-center justify-center">
          <motion.div 
            {...({ animate: { width: [20, 30, 20] }, transition: { duration: 2, repeat: Infinity }, className: "w-5 h-1 bg-white/10 rounded-full" } as any)}
          />
        </div>

        {/* Screen Content Wrapper */}
        <div 
          style={{
            ...previewStyle,
            ...(backgroundImageUrl ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : { backgroundColor: '#ffffff' })
          }}
          className="h-full w-full overflow-y-auto no-scrollbar pt-12 pb-6 flex flex-col"
        >
          {/* Internal Navbar */}
          <div className={`px-4 flex items-center justify-between mb-6 ${backgroundImageUrl ? 'bg-white/10 backdrop-blur-lg border-b border-white/20' : ''}`}>
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  className={`w-5 h-5 rounded-full object-cover shadow-sm ${backgroundImageUrl ? 'ring-1 ring-white/20' : 'ring-1 ring-slate-100'}`} 
                  alt="Logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-5 h-5 rounded-full ${backgroundImageUrl ? 'bg-white/20' : 'bg-slate-200'} flex items-center justify-center text-[6px] font-black ${backgroundImageUrl ? 'text-white' : 'text-slate-600'}`}>
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`text-[9px] font-black uppercase tracking-tight line-clamp-1 ${backgroundImageUrl ? 'text-white' : 'text-slate-900'}`}>{businessName}</span>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${backgroundImageUrl ? 'bg-white/10 backdrop-blur-lg' : 'bg-slate-50'}`}>
              <div className={`w-3 h-[1px] mb-[2px] ${backgroundImageUrl ? 'bg-white/60' : 'bg-slate-400'}`} />
              <div className={`absolute w-3 h-[1px] mt-[2px] ${backgroundImageUrl ? 'bg-white/60' : 'bg-slate-400'}`} />
            </div>
          </div>

          {/* Hero Section Mockup */}
          <div className="px-4 space-y-4 mb-8">
            <div className={`${backgroundImageUrl ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-slate-100'} h-36 rounded-2xl overflow-hidden relative`}>
              <div className={`absolute bottom-3 left-3 space-y-1 ${backgroundImageUrl ? '' : 'hidden'}`}>
                <div className="h-2 w-16 bg-white/40 rounded-full" />
                <div className="h-3 w-24 bg-white/60 backdrop-blur-sm rounded-full" />
              </div>
            </div>
          </div>

          {/* Reactive Brand Button */}
          <div className="px-4 mb-8">
            <div 
              className={`w-full py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 ${
                backgroundImageUrl 
                  ? 'bg-white/20 backdrop-blur-lg border border-white/30' 
                  : ''
              }`}
              style={backgroundImageUrl ? {} : { backgroundColor: 'var(--brand-primary)', boxShadow: '0 10px 40px -10px rgba(var(--brand-primary-rgb), 0.3)' }}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${backgroundImageUrl ? 'text-white' : 'text-white'}`}>Book Appointment</span>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="px-4 grid grid-cols-2 gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${backgroundImageUrl ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-slate-50 border border-slate-100'} p-3 rounded-2xl space-y-2`}>
                <div className={`w-full aspect-video rounded-lg ${backgroundImageUrl ? 'bg-white/5' : 'bg-white'} shadow-xs`} />
                <div className={`h-1.5 w-full rounded-full ${backgroundImageUrl ? 'bg-white/20' : 'bg-slate-200'}`} />
                <div className={`h-1.5 w-2/3 rounded-full ${backgroundImageUrl ? 'bg-white/10' : 'bg-slate-100'}`} />
              </div>
            ))}
          </div>

          {/* Bottom Nav Indicator */}
          <div className="mt-auto pb-2 flex justify-center">
            <div className="w-1/3 h-1 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Gloss Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[3.5rem] bg-gradient-to-tr from-white/5 to-transparent opacity-40 border border-white/10" />
    </motion.div>
  );
};
