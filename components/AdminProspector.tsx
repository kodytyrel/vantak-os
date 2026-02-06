
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { VANTAK } from '../constants';

export const AdminProspector: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    primaryColor: VANTAK.theme.accent,
    logoUrl: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  useEffect(() => {
    if (formData.name && !formData.slug) {
      setFormData(prev => ({ 
        ...prev, 
        slug: formData.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      }));
    }
  }, [formData.name]);

  const handleScrape = () => {
    const input = websiteUrl.trim();
    if (!input) return;
    
    setIsScraping(true);
    try {
      const domain = input.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].split('?')[0];
      const logo = `https://logo.clearbit.com/${domain}`;
      setFormData(prev => ({ ...prev, logoUrl: logo }));
    } catch (e) {
      console.error("Vantak Scraper Error");
    } finally {
      setTimeout(() => setIsScraping(false), 800);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const { error } = await supabase.from('tenants').insert([{
        business_name: formData.name,
        slug: formData.slug,
        primary_color: formData.primaryColor,
        logo_url: formData.logoUrl,
        is_demo: true,
        tier: 'starter',
        platform_fee_percent: VANTAK.fees.starter,
        address: notes || 'Vantak Lead'
      }]);

      if (error) throw error;
      setGeneratedLink(`https://vantakos.com/preview?tenant=${formData.slug}`);
    } catch (err: any) {
      alert(`Ignition Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = "fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest z-[300] shadow-2xl border border-white/10";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 px-6 font-brand">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-sky-100 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              SaaS Ignition System
            </div>
            <h1 className="text-6xl font-black tracking-tight text-slate-900 leading-[0.85] mb-2">Prospector <br/>Engine.</h1>
            <p className="text-slate-500 text-lg font-medium">Create and deploy high-conversion demos instantly.</p>
          </div>
          <button onClick={() => window.location.href='/admin?view=admin'} className="bg-white border border-slate-200 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            Dashboard
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          <form onSubmit={handleGenerate} className="lg:col-span-7 bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/20 space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Domain Discovery</label>
                <div className="flex gap-4">
                  <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="flex-grow bg-slate-50 p-6 rounded-[1.5rem] border-2 border-transparent focus:border-sky-500 outline-none font-bold text-sm shadow-inner transition-all" placeholder="e.g. glowstudio.com" />
                  <button type="button" onClick={handleScrape} className="bg-slate-900 text-white px-8 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Discover</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 p-6 rounded-[1.5rem] border-2 border-transparent focus:border-sky-500 outline-none font-black text-lg shadow-inner" placeholder="The Business Name" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Platform Slug</label>
                  <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-slate-50 p-6 rounded-[1.5rem] border-2 border-transparent focus:border-sky-500 outline-none font-mono text-xs shadow-inner" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lead Attribution</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 p-6 rounded-[1.5rem] border-2 border-transparent focus:border-sky-500 outline-none font-medium text-sm shadow-inner h-24 resize-none" placeholder="Notes on discovery source..." />
              </div>

              <div className="flex items-center gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Primary</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 shadow-inner">
                    <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer" />
                    <span className="text-xs font-mono font-bold uppercase">{formData.primaryColor}</span>
                  </div>
                </div>
                {formData.logoUrl && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logo Discovered</label>
                    <img src={formData.logoUrl} className="h-16 w-16 rounded-2xl border border-slate-200 p-2 bg-white object-contain shadow-sm" alt="Preview" />
                  </div>
                )}
              </div>
            </div>
            <button disabled={isGenerating} className="w-full bg-sky-500 text-white py-8 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-sky-200 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-4">
              {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Deploy to Registry"}
            </button>
          </form>

          <div className="lg:col-span-5 flex flex-col gap-8">
            <AnimatePresence>
              {generatedLink ? (
                <motion.div {...({ initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "bg-slate-900 p-12 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden" } as any)}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[60px] rounded-full" />
                  <h3 className="text-4xl font-black text-sky-400 tracking-tighter">OS Live.</h3>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Preview Link</p>
                    <div className="flex gap-2">
                      <input readOnly value={generatedLink} className="flex-grow bg-white/5 border border-white/10 p-5 rounded-2xl font-mono text-[10px] text-sky-200" />
                      <button onClick={() => copyToClipboard(generatedLink, 'Link Copied!')} className="bg-white text-slate-900 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-400 transition-colors">Copy</button>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-white/10 space-y-6">
                    <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact Name" className="w-full bg-white/5 p-6 rounded-2xl text-white outline-none border border-white/5 focus:border-white/20" />
                    <button onClick={() => {
                      const pitch = `Hey ${contactName || 'there'}, I built a personalized VantakOS experience for ${formData.name}. Check it out: ${generatedLink}`;
                      copyToClipboard(pitch, 'Magic Pitch Copied!');
                    }} className="w-full bg-sky-500 text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all">Copy Sales Pitch</button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] bg-slate-100/50 rounded-[3.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-16 text-center text-slate-400">
                   <svg className="w-16 h-16 mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   <p className="font-black uppercase tracking-[0.3em] text-[10px]">Registry Initialization Pending</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
