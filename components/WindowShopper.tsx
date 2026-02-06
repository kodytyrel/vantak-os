'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClaimAppModal } from './ClaimAppModal';
import { Sparkles, Wrench, GraduationCap, Palette, HeartPulse } from 'lucide-react';

type BusinessPersona = 'beauty_lifestyle' | 'therapy_health' | 'trades' | 'education' | 'artisan';

interface WindowShopperProps {
  onPioneerClaim?: (data: { businessName: string; logoUrl: string; persona: BusinessPersona }) => void;
}

export const WindowShopper: React.FC<WindowShopperProps> = ({ onPioneerClaim }) => {
  // Handle Pioneer claim internally if no handler provided
  const handlePioneerClaim = (data: { businessName: string; logoUrl: string; persona: BusinessPersona }) => {
    if (onPioneerClaim) {
      onPioneerClaim(data);
    } else {
      // Default: redirect to signup with pre-filled data
      const params = new URLSearchParams({
        businessName: data.businessName,
        logoUrl: data.logoUrl,
        persona: data.persona,
      });
      window.location.href = `/signup?${params.toString()}`;
    }
  };
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<BusinessPersona>('beauty_lifestyle');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Persona-specific content with dynamic presets
  const personaContent = {
    beauty_lifestyle: {
      services: [
        { name: 'Cut & Color Hair', price: 120.00, type: 'service' },
        { name: 'Spray Tan', price: 45.00, type: 'service' },
        { name: 'Gel Nails', price: 60.00, type: 'service' },
        { name: 'Personal Training', price: 85.00, type: 'service' },
      ],
      color: 'bg-rose-100',
      icon: Sparkles,
      buttonText: 'Book',
    },
    therapy_health: {
      services: [
        { name: '60-Minute Clinical Session', price: 150.00, type: 'service' },
        { name: 'Initial Intake Assessment', price: 225.00, type: 'service' },
        { name: 'Wellness Consultation', price: 100.00, type: 'service' },
      ],
      color: 'bg-emerald-100',
      icon: HeartPulse,
      buttonText: 'Schedule Session',
    },
    trades: {
      services: [
        { name: 'Oil Change', price: 55.00, type: 'service' },
        { name: 'Request Quote', price: 0.00, type: 'quote' },
        { name: 'Build Quote', price: null, type: 'action' },
        { name: 'Send Invoice', price: null, type: 'action' },
      ],
      color: 'bg-blue-100',
      icon: Wrench,
      buttonText: 'Get Estimate',
    },
    education: {
      services: [
        { name: 'Monthly Tutoring', price: 200.00, type: 'service' },
        { name: '3 Month Piano Lessons', price: 550.00, type: 'service' },
        { name: '1 Day Guitar Intro', price: 40.00, type: 'service' },
        { name: 'Code Bootcamp', price: 1200.00, type: 'service' },
      ],
      color: 'bg-purple-100',
      icon: GraduationCap,
      buttonText: 'Book',
    },
    artisan: {
      services: [
        { name: 'Sourdough Loaf', price: 12.00, type: 'product' },
        { name: 'Handmade Necklace', price: 85.00, type: 'product' },
        { name: 'Digital Invite', price: 15.00, type: 'product' },
        { name: 'Knitted Socks', price: 35.00, type: 'product' },
      ],
      color: 'bg-amber-100',
      icon: Palette,
      buttonText: 'Order',
    },
  };

  // Success animation every 10 seconds
  useEffect(() => {
    if (businessName) {
      const triggerSuccess = () => {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
      };

      // Trigger immediately, then every 10 seconds
      triggerSuccess();
      successTimerRef.current = setInterval(triggerSuccess, 10000);

      return () => {
        if (successTimerRef.current) {
          clearInterval(successTimerRef.current);
        }
      };
    }
  }, [businessName]);

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setLogoPreview(previewUrl);
      setLogoUrl(previewUrl);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Trigger claim modal after logo is set
    if (businessName) {
      setTimeout(() => {
        setShowClaimModal(true);
      }, 500);
    }
  };

  // Handle business name change - trigger modal after interaction
  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    if (value.length >= 3 && logoPreview) {
      setTimeout(() => {
        setShowClaimModal(true);
      }, 1000);
    }
  };

  // Handle persona change
  const handlePersonaChange = (persona: BusinessPersona) => {
    setSelectedPersona(persona);
  };

  // Fetch tenant count and Pioneer availability
  const [tenantCount, setTenantCount] = useState<{
    totalCount: number;
    remaining: number;
    isPioneerAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchTenantCount = async () => {
      try {
        const response = await fetch('/api/founding-member/spots', {
          method: 'GET',
          cache: 'no-store'
        });
        const data = await response.json();
        setTenantCount({
          totalCount: data.totalCount || 0,
          remaining: data.remaining || 0,
          isPioneerAvailable: data.isPioneerAvailable || false,
        });
      } catch (error) {
        console.error('Failed to fetch tenant count:', error);
        // Fallback: assume Pioneer is available if fetch fails
        setTenantCount({
          totalCount: 0,
          remaining: 100,
          isPioneerAvailable: true,
        });
      }
    };

    fetchTenantCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTenantCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const currentContent = personaContent[selectedPersona];

  return (
    <>
      <section className="py-24 md:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Try It Out
            </h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              See your app come to life in real-time. No signup required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Input Panel */}
            <div className="space-y-8">
              {/* Persona Presets */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-4">
                  Style Presets
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {([
                    { id: 'beauty_lifestyle' as BusinessPersona, label: 'Beauty & Lifestyle', Icon: Sparkles },
                    { id: 'therapy_health' as BusinessPersona, label: 'Therapy & Health', Icon: HeartPulse },
                    { id: 'trades' as BusinessPersona, label: 'Trades', Icon: Wrench },
                    { id: 'education' as BusinessPersona, label: 'Education', Icon: GraduationCap },
                    { id: 'artisan' as BusinessPersona, label: 'Artisan', Icon: Palette },
                  ]).map((persona) => {
                    const IconComponent = persona.Icon;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => handlePersonaChange(persona.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedPersona === persona.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <IconComponent className={`w-6 h-6 mx-auto mb-2 ${selectedPersona === persona.id ? 'text-white' : 'text-slate-600'}`} />
                        <div className="text-xs font-bold uppercase tracking-widest">{persona.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Name Input */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="Enter your business name"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-semibold transition-all shadow-sm"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                  Logo (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`flex items-center justify-center gap-3 w-full bg-white border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-all ${
                      logoPreview
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                        <span className="text-slate-600 font-medium">Uploading...</span>
                      </>
                    ) : logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover" />
                        <span className="text-slate-600 font-medium">Logo uploaded</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-slate-600 font-medium">Drop logo or click to upload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* 3D iPhone Mockup Preview */}
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Phone Frame - 3D Style */}
                <motion.div
                  className="relative w-[280px] h-[580px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3.5rem] p-2 shadow-2xl"
                  initial={{ rotateY: -2 }}
                  animate={{ rotateY: [-2, 2, -2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                >
                  {/* Bezel */}
                  <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-b from-slate-700 to-slate-900" />
                  
                  {/* Screen */}
                  <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3rem] overflow-hidden shadow-inner">
                    {/* Status Bar */}
                    <div className="h-8 bg-white/10 backdrop-blur-sm flex items-center justify-between px-6 text-[10px] font-bold text-white">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 border border-white/40 rounded-sm">
                          <div className="w-3 h-full bg-white rounded-sm" />
                        </div>
                        <svg className="w-4 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2 22h20V2z" />
                        </svg>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                      {logoPreview ? (
                        <img src={logoPreview} alt={businessName || 'Business'} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                          <span className="text-white font-black text-sm">V</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-white truncate">
                          {businessName || 'Your Business'}
                        </h3>
                        <p className="text-xs text-white/70 font-medium">
                          {selectedPersona === 'education' ? 'Music Lessons' : 
                           selectedPersona === 'artisan' ? 'Bakery Shop' : 
                           selectedPersona === 'trades' ? 'Professional Services' : 
                           selectedPersona === 'therapy_health' ? 'Therapy & Health' : 
                           'Beauty & Lifestyle'}
                        </p>
                      </div>
                    </div>

                    {/* Success Animation Overlay */}
                    <AnimatePresence>
                      {showSuccessAnimation && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm z-20 flex items-center justify-center"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl"
                          >
                            <motion.svg
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              className="w-10 h-10 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </motion.svg>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Scrolling Services List with Glassmorphism */}
                    <div className="flex-1 overflow-y-auto pb-6">
                      <div className="px-6 py-4 space-y-3">
                        {currentContent.services.map((service, index) => {
                          const IconComponent = currentContent.icon;
                          const buttonText = service.type === 'action' 
                            ? (service.name === 'Build Quote' ? 'Build' : 'Send')
                            : service.type === 'quote'
                            ? 'Request'
                            : currentContent.buttonText;
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                    <IconComponent className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-white text-sm">{service.name}</h4>
                                    <p className="text-xs text-white/80 font-medium mt-0.5">
                                      {service.price !== null 
                                        ? service.price === 0 
                                          ? 'Free Quote' 
                                          : `$${service.price.toFixed(2)}`
                                        : service.type === 'action'
                                        ? 'Action'
                                        : ''
                                      }
                                    </p>
                                  </div>
                                </div>
                                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg hover:bg-white/30 transition-colors border border-white/30">
                                  {buttonText}
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-lg border-t border-white/20 flex items-center justify-around">
                      {['Home', 'Services', 'Shop', 'Account'].map((tab) => (
                        <div key={tab} className="flex flex-col items-center gap-1">
                          <div className="w-6 h-6 rounded-lg bg-white/20" />
                          <span className="text-[9px] text-white/80 font-medium">{tab}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-purple-400/20 rounded-[3.5rem] blur-2xl -z-10 transform scale-110" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claim App Modal */}
      <ClaimAppModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onClaim={() => {
          setShowClaimModal(false);
          handlePioneerClaim({
            businessName,
            logoUrl: logoPreview || '',
            persona: selectedPersona,
          });
        }}
        businessName={businessName}
        remainingSpots={tenantCount?.remaining || 0}
        isPioneerAvailable={tenantCount?.isPioneerAvailable ?? true}
      />
    </>
  );
};

