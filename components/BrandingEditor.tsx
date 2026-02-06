
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '../types';
import { MobilePreview } from './MobilePreview';
import { supabase } from '../services/supabase';
import { injectTenantTheme } from '../services/themeService';

interface BrandingEditorProps {
  tenant: TenantConfig;
  onSaveSuccess: (updated: TenantConfig) => void;
}

export const BrandingEditor: React.FC<BrandingEditorProps> = ({ tenant, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: tenant.name,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    logoUrl: tenant.logoUrl,
    backgroundImageUrl: (tenant as any).background_image_url || '',
    businessType: tenant.business_type || 'service',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  // Apply changes to the dashboard's own theme in real-time
  useEffect(() => {
    const tempConfig = { ...tenant, ...formData };
    injectTenantTheme(tempConfig as TenantConfig);
  }, [formData]);

  const handleUpdate = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsUploadingBackground(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenant.id}/background_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      handleUpdate('backgroundImageUrl', publicUrl);
    } catch (error: any) {
      console.error('Error uploading background image:', error);
      alert('Failed to upload background image: ' + error.message);
    } finally {
      setIsUploadingBackground(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({
          business_name: formData.name,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          logo_url: formData.logoUrl,
          background_image_url: formData.backgroundImageUrl,
          business_type: formData.businessType,
        })
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) throw error;

      // Map the response back to TenantConfig format
      const updatedTenant: TenantConfig = {
        ...tenant,
        name: data.business_name,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color || tenant.secondaryColor,
        logoUrl: data.logo_url,
        business_type: data.business_type || 'service',
        background_image_url: data.background_image_url || null,
      } as any;

      setShowSuccess(true);
      onSaveSuccess(updatedTenant);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert('Failed to save branding: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start max-w-7xl mx-auto">
      {/* Settings Panel */}
      <motion.div 
        {...({ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "lg:col-span-7 space-y-8" } as any)}
      >
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-8 lg:p-10 space-y-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm">Aa</span>
                General Identity
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => handleUpdate('name', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl px-6 py-4 text-base font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logo URL</label>
                  <input 
                    type="text" 
                    value={formData.logoUrl}
                    onChange={(e) => handleUpdate('logoUrl', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl px-6 py-4 font-mono text-xs outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">What is your craft?</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleUpdate('businessType', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl px-6 py-4 text-base font-semibold outline-none transition-all shadow-inner"
                  >
                    <option value="service">General Service</option>
                    <option value="education">Education/Lessons</option>
                    <option value="retail">Retail/Shop</option>
                    <option value="professional">Professional/Consulting</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm">🖼️</span>
                App Background
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Background Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageUpload}
                      disabled={isUploadingBackground}
                      className="hidden"
                      id="background-image-upload"
                    />
                    <label
                      htmlFor="background-image-upload"
                      className={`flex items-center justify-center gap-3 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-6 py-8 cursor-pointer transition-all hover:border-brand-primary hover:bg-brand-primary/5 ${
                        isUploadingBackground ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploadingBackground ? (
                        <>
                          <div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                          <span className="text-sm font-bold text-slate-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-bold text-slate-700">Upload Background Image</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                
                {formData.backgroundImageUrl && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preview</label>
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-50 aspect-video">
                      <img
                        src={formData.backgroundImageUrl}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleUpdate('backgroundImageUrl', '')}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-2 shadow-lg transition-all hover:scale-110"
                        title="Remove background image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.backgroundImageUrl}
                      onChange={(e) => handleUpdate('backgroundImageUrl', e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl px-6 py-4 font-mono text-xs outline-none transition-all shadow-inner"
                      placeholder="Background image URL"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm">🎨</span>
                Color Palette
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Primary</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 ring-2 ring-white">
                      <input 
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                        className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <input 
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                      className="bg-transparent font-mono font-bold uppercase w-full outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Secondary</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 ring-2 ring-white">
                      <input 
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => handleUpdate('secondaryColor', e.target.value)}
                        className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <input 
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => handleUpdate('secondaryColor', e.target.value)}
                      className="bg-transparent font-mono font-bold uppercase w-full outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Connectivity Fee Display (Founding Members) */}
            {tenant.is_founding_member && (
              <div className="pt-8 border-t border-slate-100">
                <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-300 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-400 border-2 border-yellow-500 shadow-md flex items-center justify-center">
                      <svg className="w-7 h-7 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-black text-yellow-900">
                          Connectivity Fee
                        </h3>
                        <span className="px-3 py-1 bg-yellow-400 rounded-full text-xs font-black uppercase tracking-wider text-yellow-900 border border-yellow-500">
                          Pioneer
                        </span>
                      </div>
                      <p className="text-2xl font-black text-yellow-900 mb-2">
                        $0
                      </p>
                      <p className="text-sm font-semibold text-yellow-800 leading-relaxed">
                        Founding Member Lifetime Waiver
                      </p>
                      <p className="text-xs font-medium text-yellow-700 mt-2 leading-relaxed">
                        As a Founding Member #{tenant.founding_member_number || '?'}, your annual connectivity fee is permanently waived. You'll never pay annual subscription fees—just transaction fees as you grow.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50/80 backdrop-blur-sm p-6 lg:p-8 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2 min-h-[24px]">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    {...({ initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 }, className: "flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100" } as any)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    Saved to Cloud
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3 group"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Publish Changes
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview Sticky Column */}
      <motion.div 
        {...({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "lg:col-span-5 sticky top-32 flex flex-col items-center" } as any)}
      >
        <MobilePreview 
          brandingConfig={{
            primaryColor: formData.primaryColor,
            businessName: formData.name,
            logoUrl: formData.logoUrl,
            backgroundImageUrl: formData.backgroundImageUrl
          }}
        />
        
        <div className="mt-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Active Real-time Session
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest max-w-[200px] leading-relaxed">
            iPhone 15 Pro <br/> <span className="opacity-50">Studio Rendering</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
